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
  countRanks,
  isBoardState,
  normalizeState,
  NOTE_COLORS,
  NOTE_RANKS,
  seedState,
} from "../src/board/reducer.js";

const colorSchema = z.enum(NOTE_COLORS);
const rankSchema = z.enum(NOTE_RANKS);

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
      // Boards written before the logline existed still load; they just gain an
      // empty one on the way in.
      return {
        state: normalizeState(parsed.state),
        rev: typeof parsed.rev === "number" ? parsed.rev : 0,
      };
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
      const state =
        data.state && isBoardState(data.state) ? normalizeState(data.state) : seedState();
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
  // `changed` is passed back so a tool can tell the agent that nothing
  // happened, and why. A tool that silently reports success on a rejected
  // command teaches the agent the board is in a state it is not.
  if (!changed) return { state: next, changed, result, live: base !== null };

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
        return { state: next, changed, result, live: true };
      }
    } catch (error) {
      log("bridge write failed, falling back to file:", error);
    }
  }
  writeFileBoard(next, rev + 1);
  return { state: next, changed, result, live: false };
}

/** Where a change landed, for the tail of a tool's reply. */
function where(live) {
  return live ? " (visible on the open board)" : " (written to file)";
}

// --- Reporting -------------------------------------------------------------

function summarize(state) {
  const notes = state.notes
    .map(
      (note) =>
        `  - ${note.id} [${note.rank ?? "scene"}] — "${note.headline}" (${note.color}) at ${Math.round(note.x)},${Math.round(note.y)}`,
    )
    .join("\n");
  const { beats, scenes } = countRanks(state);
  const headline = (id) =>
    state.notes.find((note) => note.id === id)?.headline ?? "(missing card)";

  // Groups and arrows are listed with their own ids, not just counted. An agent
  // cannot ungroup, rename, or delete an arrow it has never been told the id of.
  const groups = state.groups
    .map(
      (group) =>
        `  - ${group.id} — "${group.title}" holds ${group.noteIds.length}: ${group.noteIds.join(", ")}`,
    )
    .join("\n");
  const arrows = state.arrows
    .map(
      (arrow) =>
        `  - ${arrow.id} — ${arrow.from} → ${arrow.to}  ("${headline(arrow.from)}" → "${headline(arrow.to)}")`,
    )
    .join("\n");

  // No blank lines: ok() uses the first blank line to separate prose from the
  // JSON payload, so one in here would swallow the payload.
  return [
    `logline: ${state.logline ? `"${state.logline}"` : "(not set)"}`,
    `beats: ${beats}, scenes: ${scenes}`,
    `notes: ${state.notes.length}, groups: ${state.groups.length}, arrows: ${state.arrows.length}`,
    "cards:",
    notes || "  (no cards)",
    "groups:",
    groups || "  (no groups)",
    "arrows:",
    arrows || "  (no arrows)",
  ].join("\n");
}

// Wire format: prose, one blank line, then the JSON payload. `text` must not
// contain a blank line of its own or the payload becomes unparseable.
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
  "set_logline",
  {
    title: "Set logline",
    description:
      "Set the board's logline — the central question, what this story is arguing. One sentence. Every card on the wall should be checkable against it. Pass an empty string to clear it.",
    inputSchema: {
      logline: z.string(),
    },
  },
  async (args) => {
    const { state, live } = await commit({ type: "set_logline", logline: args.logline });
    return ok(
      state.logline
        ? `Logline set${live ? " (visible on the open board)" : " (written to file)"}.`
        : "Logline cleared.",
      { logline: state.logline },
    );
  },
);

server.registerTool(
  "set_rank",
  {
    title: "Set card rank",
    description:
      "Mark cards as beats or scenes. A beat is one of the 8-to-15 major turns the story hangs on (inciting incident, midpoint, lowest point, climax); everything else is a scene. Rank is carried by the card, not by where it sits, so marking a beat never moves it. Do not volunteer an opinion about how many beats there should be.",
    inputSchema: {
      ids: z.array(z.string()).min(1),
      rank: rankSchema,
    },
  },
  async (args) => {
    const { state, result, live } = await commit({
      type: "set_rank",
      ids: args.ids,
      rank: args.rank,
    });
    const { beats, scenes } = countRanks(state);
    return ok(
      `${result?.length ?? 0} card(s) are now ${args.rank}${live ? " (visible on the open board)" : " (written to file)"}. The board holds ${beats} beats and ${scenes} scenes.`,
      result,
    );
  },
);

server.registerTool(
  "create_note",
  {
    title: "Create note",
    description:
      "Add a card (post-it) to the board. A card is one scene: a headline plus the change it causes. Provide both headline and change. Optionally set color, x/y position, and rank ('beat' for one of the major turns, otherwise 'scene').",
    inputSchema: {
      headline: z.string().min(1),
      change: z.string().min(1),
      color: colorSchema.optional(),
      rank: rankSchema.optional(),
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
      rank: args.rank,
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

// --- Groups (R14) -----------------------------------------------------------

server.registerTool(
  "create_group",
  {
    title: "Create group",
    description:
      "Wrap two or more cards in a named frame — a sequence, a set piece, a run of beats that reads as one unit. The cards stay visible and keep their positions; a group is a frame around them, not a folder. A card can only be in one group, so grouping a card moves it out of any group it was already in. Call list_board first to get real card ids.",
    inputSchema: {
      noteIds: z.array(z.string()).min(2),
      title: z.string().optional(),
    },
  },
  async (args) => {
    const { state, changed, result, live } = await commit({
      type: "create_group",
      noteIds: args.noteIds,
      title: args.title,
    });
    if (!changed) {
      const missing = args.noteIds.filter(
        (id) => !state.notes.some((note) => note.id === id),
      );
      return ok(
        missing.length > 0
          ? `No group made: not on the board — ${missing.join(", ")}. Call list_board to check the ids.`
          : "No group made: a group needs at least two cards.",
      );
    }
    return ok(`Grouped ${result.noteIds.length} cards as "${result.title}"${where(live)}.`, result);
  },
);

server.registerTool(
  "rename_group",
  {
    title: "Rename group",
    description:
      "Retitle a group frame, e.g. 'Midpoint' or 'The heist'. Needs the group's id from list_board.",
    inputSchema: { id: z.string(), title: z.string().min(1) },
  },
  async (args) => {
    const { changed, live } = await commit({
      type: "rename_group",
      id: args.id,
      title: args.title,
    });
    if (!changed) return ok(`No group with id ${args.id}. Call list_board for the real ids.`);
    return ok(`Renamed the group to "${args.title}"${where(live)}.`);
  },
);

server.registerTool(
  "ungroup",
  {
    title: "Ungroup",
    description:
      "Remove a group frame. The cards stay on the board exactly where they are — only the frame goes.",
    inputSchema: { id: z.string() },
  },
  async (args) => {
    const { changed, live } = await commit({ type: "ungroup", id: args.id });
    if (!changed) return ok(`No group with id ${args.id}. Call list_board for the real ids.`);
    return ok(`Ungrouped${where(live)}. The cards are untouched.`);
  },
);

// --- Arrows (R15) -----------------------------------------------------------

server.registerTool(
  "create_arrow",
  {
    title: "Create arrow",
    description:
      "Draw a directed arrow from one card to another to show what comes after what, or what sets up what. Arrows are one-way: A→B does not create B→A. If you want both, call this twice — that is two arrows, not one two-headed line. A card cannot point at itself, and the same direction cannot be drawn twice.",
    inputSchema: { from: z.string(), to: z.string() },
  },
  async (args) => {
    const { state, changed, result, live } = await commit({
      type: "create_arrow",
      from: args.from,
      to: args.to,
    });
    if (!changed) {
      // Say which of the three reasons it was. "Something went wrong" makes an
      // agent retry the same call; naming the cause makes it fix the input.
      const onBoard = (id) => state.notes.some((note) => note.id === id);
      const why =
        args.from === args.to
          ? "a card cannot point at itself"
          : !onBoard(args.from)
            ? `there is no card with id ${args.from}`
            : !onBoard(args.to)
              ? `there is no card with id ${args.to}`
              : "that arrow already exists";
      return ok(`No arrow drawn: ${why}. Call list_board to check.`);
    }
    return ok(`Drew ${args.from} → ${args.to}${where(live)}.`, result);
  },
);

server.registerTool(
  "delete_arrow",
  {
    title: "Delete arrow",
    description:
      "Remove one arrow by its id, which list_board reports. This deletes that direction only: removing A→B leaves B→A alone.",
    inputSchema: { id: z.string() },
  },
  async (args) => {
    const { changed, live } = await commit({ type: "delete_arrow", id: args.id });
    if (!changed) return ok(`No arrow with id ${args.id}. Call list_board for the real ids.`);
    return ok(`Deleted that arrow${where(live)}. Any arrow the other way is untouched.`);
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
