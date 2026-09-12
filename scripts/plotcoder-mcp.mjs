// PlotCoder board MCP server.
//
// Exposes the board to any MCP client (e.g. a Cursor agent) so cards can be
// created and moved without driving the mouse. Every tool runs the same kernel
// reducer the app uses, then persists:
//   - live: if the Vite dev bridge is reachable, GET the board, apply the
//     command, and PUT it back so the open wall updates within a second.
//   - offline: otherwise read/write .plotcoder/board.json directly, and the
//     wall catches up the next time the app loads.
//
// Runs under plain `node` (see .cursor/mcp.json). Never write to stdout except
// MCP frames; diagnostics go to stderr.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  applyCommand,
  isBoardState,
  NOTE_COLORS,
  seedState,
} from "../src/board/reducer.js";

const colorSchema = z.enum(NOTE_COLORS);

function log(...args) {
  console.error("[plotcoder-mcp]", ...args);
}

// --- Where does the board live? -------------------------------------------

function findRepoRoot() {
  if (process.env.PLOTCODER_ROOT) return path.resolve(process.env.PLOTCODER_ROOT);
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    if (
      fs.existsSync(path.join(dir, "package.json")) ||
      fs.existsSync(path.join(dir, ".git"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  try {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  } catch {
    return process.cwd();
  }
}

const REPO_ROOT = findRepoRoot();
const BOARD_FILE = path.join(REPO_ROOT, ".plotcoder", "board.json");

// --- Live dev bridge -------------------------------------------------------

function bridgeCandidates() {
  const bases = [];
  if (process.env.PLOTCODER_BRIDGE_URL) bases.push(process.env.PLOTCODER_BRIDGE_URL);
  const hosts = ["127.0.0.1", "localhost"];
  const ports = [5173, 5174, 5175, 5176, 5177, 4173];
  for (const port of ports) {
    for (const host of hosts) bases.push(`http://${host}:${port}`);
  }
  return bases;
}

let cachedBase = null;

async function probe(base) {
  try {
    const res = await fetch(`${base}/__plotcoder/board`, {
      signal: AbortSignal.timeout(400),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data && typeof data === "object" && "rev" in data;
  } catch {
    return false;
  }
}

async function findBridge() {
  if (process.env.PLOTCODER_NO_BRIDGE === "1") return null;
  if (cachedBase && (await probe(cachedBase))) return cachedBase;
  for (const base of bridgeCandidates()) {
    if (await probe(base)) {
      cachedBase = base;
      return base;
    }
  }
  cachedBase = null;
  return null;
}

// --- Persistence -----------------------------------------------------------

function readFileBoard() {
  try {
    const parsed = JSON.parse(fs.readFileSync(BOARD_FILE, "utf8"));
    if (parsed.state && isBoardState(parsed.state)) {
      return { state: parsed.state, rev: typeof parsed.rev === "number" ? parsed.rev : 0 };
    }
  } catch {
    /* no file yet */
  }
  return { state: seedState(), rev: 0 };
}

function writeFileBoard(state, rev) {
  fs.mkdirSync(path.dirname(BOARD_FILE), { recursive: true });
  const payload = { app: "plotcoder", version: 1, rev, state };
  fs.writeFileSync(BOARD_FILE, `${JSON.stringify(payload, null, 2)}\n`);
}

async function readBoard() {
  const base = await findBridge();
  if (base) {
    try {
      const res = await fetch(`${base}/__plotcoder/board`, {
        signal: AbortSignal.timeout(1500),
      });
      const data = await res.json();
      const state = data.state && isBoardState(data.state) ? data.state : seedState();
      return { state, rev: typeof data.rev === "number" ? data.rev : 0, base, live: true };
    } catch (error) {
      log("bridge read failed, using file:", error);
    }
  }
  const file = readFileBoard();
  return { ...file, base: null, live: false };
}

async function commit(command) {
  const { state, rev, base } = await readBoard();
  const { state: next, changed, result } = applyCommand(state, command);
  if (!changed) return { state: next, result, live: base !== null };

  if (base) {
    try {
      const res = await fetch(`${base}/__plotcoder/board`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: next, rev }),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.state && isBoardState(data.state)) writeFileBoard(data.state, data.rev);
        return { state: next, result, live: true };
      }
    } catch (error) {
      log("bridge write failed, falling back to file:", error);
    }
  }
  writeFileBoard(next, rev + 1);
  return { state: next, result, live: false };
}

// --- Reporting -------------------------------------------------------------

function summarize(state) {
  const notes = state.notes
    .map(
      (note) =>
        `  - ${note.id} — "${note.headline}" (${note.color}) at ${Math.round(note.x)},${Math.round(note.y)}`,
    )
    .join("\n");
  return [
    `notes: ${state.notes.length}, groups: ${state.groups.length}, arrows: ${state.arrows.length}`,
    notes || "  (no notes)",
  ].join("\n");
}

function ok(text, data) {
  const body = data === undefined ? text : `${text}\n\n${JSON.stringify(data, null, 2)}`;
  return { content: [{ type: "text", text: body }] };
}

// --- Server ----------------------------------------------------------------

const server = new McpServer({ name: "plotcoder-board", version: "0.1.0" });

server.registerTool(
  "list_board",
  {
    title: "List board",
    description:
      "Return every card on the PlotCoder board with id, headline, change, color, and position. Read this before moving or updating cards so you use real ids.",
    inputSchema: {},
  },
  async () => {
    const { state, live } = await readBoard();
    return ok(
      `PlotCoder board (${live ? "live: app is open" : "from file: app not running"})\n${summarize(state)}`,
      state,
    );
  },
);

server.registerTool(
  "create_note",
  {
    title: "Create note",
    description:
      "Add a card (post-it) to the board. A card is a beat: a headline plus the change it causes. Provide both headline and change. Optionally set color and x/y position.",
    inputSchema: {
      headline: z.string().min(1),
      change: z.string().min(1),
      color: colorSchema.optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    },
  },
  async (args) => {
    const { result, live } = await commit({
      type: "create_note",
      headline: args.headline,
      change: args.change,
      color: args.color,
      x: args.x,
      y: args.y,
    });
    return ok(`Created card${live ? " (visible on the open board)" : " (written to file)"}.`, result);
  },
);

server.registerTool(
  "update_note",
  {
    title: "Update note",
    description: "Change the headline and/or change text of an existing card by id.",
    inputSchema: {
      id: z.string(),
      headline: z.string().optional(),
      change: z.string().optional(),
    },
  },
  async (args) => {
    const { result } = await commit({
      type: "update_note",
      id: args.id,
      headline: args.headline,
      change: args.change,
    });
    if (result === undefined) return ok(`No card with id ${args.id}.`);
    return ok("Updated card.", result);
  },
);

server.registerTool(
  "move_note",
  {
    title: "Move note",
    description:
      "Move a card to an absolute position on the board (x,y are the top-left of the card, in pixels).",
    inputSchema: { id: z.string(), x: z.number(), y: z.number() },
  },
  async (args) => {
    const { result } = await commit({ type: "move_note", id: args.id, x: args.x, y: args.y });
    if (result === undefined) return ok(`No card with id ${args.id}.`);
    return ok("Moved card.", result);
  },
);

server.registerTool(
  "recolor_note",
  {
    title: "Recolor note",
    description: "Change the paper color of a card.",
    inputSchema: { id: z.string(), color: colorSchema },
  },
  async (args) => {
    const { result } = await commit({
      type: "recolor_notes",
      ids: [args.id],
      color: args.color,
    });
    const changed = Array.isArray(result) && result.length > 0;
    if (!changed) return ok(`No card with id ${args.id}.`);
    return ok("Recolored card.", result);
  },
);

server.registerTool(
  "delete_note",
  {
    title: "Delete note",
    description:
      "Remove a card from the board. Also removes any arrows touching it and drops it from groups.",
    inputSchema: { id: z.string() },
  },
  async (args) => {
    const { result } = await commit({ type: "delete_note", id: args.id });
    if (result === undefined) return ok(`No card with id ${args.id}.`);
    return ok("Deleted card.", result);
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log(`ready. board file: ${BOARD_FILE}`);
}

main().catch((error) => {
  log("fatal:", error);
  process.exit(1);
});
