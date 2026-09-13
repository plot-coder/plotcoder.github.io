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
  ARROW_KINDS,
  boardEighths,
  countRanks,
  EIGHTHS_PER_PAGE,
  emptyState,
  formatPages,
  isBoardState,
  normalizeState,
  NOTE_COLORS,
  NOTE_RANKS,
  seedState,
} from "../src/board/reducer.js";
import { describeRuns, describeSetups, readWall } from "../src/board/readWall.js";
import { organizePoses } from "../src/board/organize.js";
import {
  addBoard,
  boardById,
  emptyProject,
  findBoard,
  isProjectRecord,
  normalizeProject,
  removeBoard,
  renameBoard,
  setActiveBoard,
} from "../src/board/project.js";

const colorSchema = z.enum(NOTE_COLORS);
const rankSchema = z.enum(NOTE_RANKS);
const arrowKindSchema = z.enum(ARROW_KINDS);
// Agents get pages, not eighths. Eighths are the storage unit (D23); asking a
// model to convert is a needless chance to be wrong by a factor of eight.
const pagesSchema = z.number().positive();
const toEighths = (pages) => Math.round(pages * EIGHTHS_PER_PAGE);

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
const PROJECT_FILE = path.join(REPO_ROOT, ".plotcoder", "project.json");

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
        boardId: typeof parsed.boardId === "string" ? parsed.boardId : null,
      };
    }
  } catch {
    /* no file yet */
  }
  return { state: seedState(), rev: 0, boardId: null };
}

function writeFileBoard(state, rev, boardId = null) {
  fs.mkdirSync(path.dirname(BOARD_FILE), { recursive: true });
  const payload = { app: "plotcoder", version: 1, rev, boardId, state };
  fs.writeFileSync(BOARD_FILE, `${JSON.stringify(payload, null, 2)}\n`);
}

// --- The project (R35): the record and every board ------------------------

function readFileProject() {
  try {
    const parsed = JSON.parse(fs.readFileSync(PROJECT_FILE, "utf8"));
    if (parsed && isProjectRecord(parsed.project)) {
      return {
        project: normalizeProject(parsed.project),
        boards: parsed.boards && typeof parsed.boards === "object" ? parsed.boards : {},
        rev: typeof parsed.rev === "number" ? parsed.rev : 0,
      };
    }
  } catch {
    /* no project file yet */
  }
  return null;
}

function writeFileProject(project, boards, rev) {
  fs.mkdirSync(path.dirname(PROJECT_FILE), { recursive: true });
  const payload = { app: "plotcoder", version: 2, rev, project, boards };
  fs.writeFileSync(PROJECT_FILE, `${JSON.stringify(payload, null, 2)}\n`);
}

/**
 * The project as the bridge or the file holds it. A wall from before projects
 * existed becomes a one-board project around the board on file, so every
 * board tool works on an older checkout too.
 */
async function readProject() {
  const base = await findBridge();
  if (base) {
    try {
      const res = await fetch(`${base}/__plotcoder/project`, { signal: AbortSignal.timeout(1500) });
      const data = await res.json();
      if (data && isProjectRecord(data.project)) {
        return {
          project: normalizeProject(data.project),
          boards: data.boards && typeof data.boards === "object" ? data.boards : {},
          rev: typeof data.rev === "number" ? data.rev : 0,
          base,
          live: true,
        };
      }
    } catch (error) {
      log("bridge project read failed, using file:", error);
    }
  }
  const file = readFileProject();
  if (file) return { ...file, base: null, live: false };
  const board = readFileBoard();
  const project = emptyProject();
  const id = board.boardId ?? project.boards[0].id;
  const record = board.boardId
    ? { ...project, boards: [{ ...project.boards[0], id: board.boardId }], activeBoardId: board.boardId }
    : project;
  return { project: record, boards: { [id]: board.state }, rev: 0, base: null, live: false };
}

async function writeProject(project, boards, rev, base) {
  if (base) {
    try {
      const res = await fetch(`${base}/__plotcoder/project`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project, boards, rev }),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json();
        writeFileProject(data.project ?? project, data.boards ?? boards, data.rev ?? rev + 1);
        return true;
      }
    } catch (error) {
      log("bridge project write failed, falling back to file:", error);
    }
  }
  writeFileProject(project, boards, rev + 1);
  return false;
}

/** Open a board everywhere: the record's open board, and the board channel with its id. */
async function openBoardEverywhere(project, boards, projectRev, base, boardId) {
  const opened = setActiveBoard(project, boardId);
  const state = isBoardState(boards[boardId]) ? normalizeState(boards[boardId]) : emptyState();
  const live = await writeProject(opened, { ...boards, [boardId]: state }, projectRev, base);
  const { rev } = await readBoard();
  await writeBoard(state, rev, base, boardId);
  return { project: opened, state, live };
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
      return {
        state,
        rev: typeof data.rev === "number" ? data.rev : 0,
        boardId: typeof data.boardId === "string" ? data.boardId : null,
        base,
        live: true,
      };
    } catch (error) {
      log("bridge read failed, using file:", error);
    }
  }
  const file = readFileBoard();
  return { ...file, base: null, live: false };
}

async function writeBoard(next, rev, base, boardId = null) {
  if (base) {
    try {
      const res = await fetch(`${base}/__plotcoder/board`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: next, rev, boardId }),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.state && isBoardState(data.state)) {
          writeFileBoard(data.state, data.rev, data.boardId ?? boardId);
        }
        return true;
      }
    } catch (error) {
      log("bridge write failed, falling back to file:", error);
    }
  }
  writeFileBoard(next, rev + 1, boardId);
  syncProjectFileBoard(boardId, next);
  return false;
}

/** Keep the project file's copy of a board current when the app is not open to do it. */
function syncProjectFileBoard(boardId, state) {
  if (!boardId) return;
  const file = readFileProject();
  if (!file || !file.project.boards.some((board) => board.id === boardId)) return;
  writeFileProject(file.project, { ...file.boards, [boardId]: state }, file.rev + 1);
}

// This server's own trail of changes (R33): what the board was before each
// of its tool calls, and what it became. `undo` walks it back — but only when
// the board still is what the call left, so it never tramples a change the
// person made on the wall since.
const TRAIL_CAP = 50;
const trail = [];

function describeCommand(command) {
  switch (command.type) {
    case "create_note":
      return `create_note "${command.headline ?? ""}"`;
    case "recolor_notes":
      return "recolor_note";
    default:
      return command.type;
  }
}

async function commit(command) {
  const { state, rev, base, boardId } = await readBoard();
  const { state: next, changed, result } = applyCommand(state, command);
  // `changed` is passed back so a tool can tell the agent that nothing
  // happened, and why. A tool that silently reports success on a rejected
  // command teaches the agent the board is in a state it is not.
  if (!changed) return { state: next, changed, result, live: base !== null };

  const live = await writeBoard(next, rev, base, boardId);
  trail.push({ before: state, after: JSON.stringify(next), what: describeCommand(command) });
  if (trail.length > TRAIL_CAP) trail.shift();
  return { state: next, changed, result, live };
}

/** Where a change landed, for the tail of a tool's reply. */
function where(live) {
  return live ? " (visible on the open board)" : " (written to file)";
}

// --- Reporting -------------------------------------------------------------

function summarize(state) {
  const nameOf = new Map(state.characters.map((character) => [character.id, character.name]));
  const notes = state.notes
    .map((note) => {
      const cast = note.characterIds.map((id) => nameOf.get(id) ?? id);
      const who = cast.length ? `, cast: ${cast.join(", ")}` : "";
      const plant = note.plants ? ", plants" : "";
      return `  - ${note.id} [${note.rank ?? "scene"}, ${formatPages(note.lengthEighths)}pp${who}${plant}] — "${note.headline}" (${note.color}) at ${Math.round(note.x)},${Math.round(note.y)}`;
    })
    .join("\n");
  const cast = state.characters
    .map((character) => {
      const on = state.notes.filter((note) => note.characterIds.includes(character.id)).length;
      return `  - ${character.id} — "${character.name}" on ${on} card${on === 1 ? "" : "s"}`;
    })
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
        `  - ${arrow.id} [${arrow.kind ?? "follows"}] — ${arrow.from} → ${arrow.to}  ("${headline(arrow.from)}" ${arrow.kind === "setup" ? "sets up" : "→"} "${headline(arrow.to)}")`,
    )
    .join("\n");

  // No blank lines: ok() uses the first blank line to separate prose from the
  // JSON payload, so one in here would swallow the payload.
  return [
    `logline: ${state.logline ? `"${state.logline}"` : "(not set)"}`,
    `beats: ${beats}, scenes: ${scenes}`,
    `runtime: about ${formatPages(boardEighths(state))} pages of a ${formatPages(state.targetEighths)}-page target (an estimate from the cards)`,
    `notes: ${state.notes.length}, groups: ${state.groups.length}, arrows: ${state.arrows.length}, cast: ${state.characters.length}`,
    "cast:",
    cast || "  (no one yet — add_character to start the roster)",
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
      "Return the PlotCoder board: the logline, the cast (roster) with ids, then every card with id, headline, change, color, rank, length, cast, and position, then groups and arrows with ids. Read this before moving, updating, or casting cards so you use real ids.",
    inputSchema: {},
  },
  async () => {
    const { state, live, boardId } = await readBoard();
    const { project } = await readProject();
    const board = boardById(project, boardId ?? project.activeBoardId);
    const which = board
      ? `"${board.name}" (${project.boards.findIndex((item) => item.id === board.id) + 1} of ${project.boards.length} in "${project.name}")`
      : "board";
    return ok(
      `PlotCoder ${which} (${live ? "live: app is open" : "from file: app not running"})\n${summarize(state)}`,
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
  "set_length",
  {
    title: "Set card length",
    description:
      "Set how long cards run, in pages. An ordinary scene is about 1; a quick beat might be 0.25; a set piece might be 3 or 4. This is an estimate the writer owns — set it when you are told a length or when the card plainly describes one, and do not silently re-estimate a card someone has already sized.",
    inputSchema: {
      ids: z.array(z.string()).min(1),
      pages: pagesSchema,
    },
  },
  async (args) => {
    const { state, result, live } = await commit({
      type: "set_length",
      ids: args.ids,
      lengthEighths: toEighths(args.pages),
    });
    return ok(
      `${result?.length ?? 0} card(s) now run about ${args.pages} page(s)${where(live)}. The board runs about ${formatPages(boardEighths(state))} pages against a ${formatPages(state.targetEighths)}-page target.`,
      result,
    );
  },
);

server.registerTool(
  "set_target",
  {
    title: "Set target length",
    description:
      "Set the board's target script length in pages. 120 for a feature, 30 for a half-hour, 60 for an hour drama. This is what the runtime estimate is measured against.",
    inputSchema: { pages: pagesSchema },
  },
  async (args) => {
    const { state, live } = await commit({
      type: "set_target",
      targetEighths: toEighths(args.pages),
    });
    return ok(
      `Target is ${formatPages(state.targetEighths)} pages${where(live)}. The cards add up to about ${formatPages(boardEighths(state))}.`,
      { targetEighths: state.targetEighths },
    );
  },
);

server.registerTool(
  "create_note",
  {
    title: "Create note",
    description:
      "Add a card (post-it) to the board. A card is one scene: a headline plus the change it causes. Provide both headline and change. Optionally set color, x/y position, rank ('beat' for one of the major turns, otherwise 'scene'), pages (how long it runs; leave it out and the card is taken to be about a page), and plants (true if this scene sets something up that must pay off later).",
    inputSchema: {
      headline: z.string().min(1),
      change: z.string().min(1),
      color: colorSchema.optional(),
      rank: rankSchema.optional(),
      pages: pagesSchema.optional(),
      plants: z.boolean().optional(),
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
      lengthEighths: args.pages === undefined ? undefined : toEighths(args.pages),
      plants: args.plants,
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

// --- Read the wall (R22) ----------------------------------------------------

server.registerTool(
  "read_wall",
  {
    title: "Read the wall",
    description:
      "Read the board back: the beats in wall order (rows top to bottom, cards left to right), the pages of scenes between consecutive beats, and the questions the wall raises — a run out of proportion with the others, a card with no change line, a card no arrow touches, two headlines that read like the same scene, a group too long to be one sequence. These are questions, not fixes: put them to the writer and do not act on them unasked. It says nothing about how many beats there should be, and neither should you.",
    inputSchema: {},
  },
  async () => {
    const { state, live } = await readBoard();
    const reading = readWall(state);
    const runs = describeRuns(reading, state);
    // No blank lines: ok() splits prose from payload on the first one.
    const lines = [
      `PlotCoder wall (${live ? "live: app is open" : "from file: app not running"})`,
      `beats in wall order: ${
        reading.beats.length
          ? reading.beats.map((beat) => `"${beat.headline}"`).join(", ")
          : "(none marked)"
      }`,
      "runs between beats:",
      ...(runs.length ? runs.map((line) => `  - ${line}`) : ["  (none)"]),
      "setups and payoffs:",
      ...(reading.setups.length
        ? describeSetups(reading, state).map((line) => `  - ${line}`)
        : ["  (no arrow is marked as a setup)"]),
      "questions the wall raises:",
      ...(reading.findings.length
        ? reading.findings.map((finding) => `  - [${finding.kind}] ${finding.text}`)
        : ["  (none that this reading can see)"]),
    ];
    return ok(lines.join("\n"), reading);
  },
);

server.registerTool(
  "organize",
  {
    title: "Organize the wall",
    description:
      "Tidy the wall along the arrows. Cards are ordered by their 'follows' arrows (a card comes after everything that points at it), then by reading order. With beats on the wall, each beat starts a row and the scenes that follow it fill the row to its right, wrapping under themselves when a run is long; with no beats yet, rows wrap five cards wide. Groups stay together. Pass noteIds to tidy only those cards, from their own top-left. Undoable from the wall.",
    inputSchema: { noteIds: z.array(z.string()).min(2).optional() },
  },
  async (args) => {
    const { state } = await readBoard();
    const poses = organizePoses(state, { onlyIds: args.noteIds });
    if (poses.length === 0) return ok("Nothing to organize: no cards in scope.");
    const { changed, live } = await commit({ type: "apply_poses", poses });
    if (!changed) return ok("Nothing moved.");
    const rows = new Set(poses.map((pose) => pose.y)).size;
    const beats = state.notes.filter(
      (note) => note.rank === "beat" && poses.some((pose) => pose.id === note.id),
    ).length;
    return ok(
      `Organized ${poses.length} card(s) along the arrows into ${rows} row(s)${beats ? `, one per beat` : ""}${where(live)}.`,
      poses,
    );
  },
);

server.registerTool(
  "undo",
  {
    title: "Undo my last change",
    description:
      "Take back the last change this server made, restoring the board to what it was before that call. Refuses if the board has changed since — a person moved on, or another agent did — so it never tramples work; the person can always undo anything from the wall with ⌘Z. Call it again to go back further.",
    inputSchema: {},
  },
  async () => {
    const last = trail[trail.length - 1];
    if (!last) return ok("Nothing of mine to undo in this session.");
    const { state, rev, base } = await readBoard();
    if (JSON.stringify(state) !== last.after) {
      return ok(
        `Not undone: the board has changed since my ${last.what}. Undoing now would trample that. Ask the person to undo from the wall if they want it back.`,
      );
    }
    trail.pop();
    const { boardId } = await readBoard();
    const live = await writeBoard(last.before, rev, base, boardId);
    return ok(
      `Undid ${last.what}${where(live)}. ${trail.length} more of mine can be undone.`,
      last.before,
    );
  },
);

server.registerTool(
  "set_plant",
  {
    title: "Fold the corner",
    description:
      "Mark cards as planting something — a setup whose payoff may not exist yet — or unmark them. A folded corner is a debt: read_wall asks about it until a setup arrow leaves the card (create_arrow with kind 'setup'). Folding never moves a card.",
    inputSchema: {
      ids: z.array(z.string()).min(1),
      plants: z.boolean(),
    },
  },
  async (args) => {
    const { result, live } = await commit({
      type: "set_plant",
      ids: args.ids,
      plants: args.plants,
    });
    const count = result?.length ?? 0;
    if (count === 0) return ok("No change: those cards were already that way, or the ids are not on the board.");
    return ok(
      args.plants
        ? `${count} card(s) now plant something${where(live)}. read_wall will ask about each until a setup arrow pays it off.`
        : `${count} card(s) no longer marked as planting${where(live)}.`,
      result,
    );
  },
);

// --- Characters (R29) -------------------------------------------------------

server.registerTool(
  "add_character",
  {
    title: "Add character",
    description:
      "Add a person to the board's cast — the roster every card casts from. One record per person: the same name twice is refused and the existing record returned. Add someone here before casting them on a card.",
    inputSchema: { name: z.string().min(1) },
  },
  async (args) => {
    const { changed, result, live } = await commit({ type: "add_character", name: args.name });
    if (!changed) {
      return result
        ? ok(`Already in the cast as "${result.name}" (${result.id}). Use that id.`, result)
        : ok("No character added: the name was empty.");
    }
    return ok(`Added "${result.name}" to the cast${where(live)}.`, result);
  },
);

server.registerTool(
  "rename_character",
  {
    title: "Rename character",
    description:
      "Rename a person in the cast by id. Every card they are on follows, because cards hold the id, not the name.",
    inputSchema: { id: z.string(), name: z.string().min(1) },
  },
  async (args) => {
    const { state, changed, result, live } = await commit({
      type: "rename_character",
      id: args.id,
      name: args.name,
    });
    if (!changed) {
      if (result) return ok(`Not renamed: "${result.name}" (${result.id}) already has that name.`);
      return state.characters.some((character) => character.id === args.id)
        ? ok("Not renamed: that is already the name.")
        : ok(`No character with id ${args.id}. Call list_board for the cast.`);
    }
    return ok(`Renamed to "${result.name}"${where(live)}.`, result);
  },
);

server.registerTool(
  "remove_character",
  {
    title: "Remove character",
    description:
      "Remove a person from the cast by id. They leave every card they were on. The cards themselves stay.",
    inputSchema: { id: z.string() },
  },
  async (args) => {
    const { changed, live } = await commit({ type: "remove_character", id: args.id });
    if (!changed) return ok(`No character with id ${args.id}. Call list_board for the cast.`);
    return ok(`Removed from the cast and from every card${where(live)}.`);
  },
);

server.registerTool(
  "cast",
  {
    title: "Cast a scene",
    description:
      "Set who is in one or more cards. Takes card ids and character names or ids; the list replaces the card's cast, so pass everyone who is in the scene. An empty list clears it. Names must already be in the cast — add_character first — and the tool says which names it did not know.",
    inputSchema: {
      noteIds: z.array(z.string()).min(1),
      characters: z.array(z.string()),
    },
  },
  async (args) => {
    const { state: before } = await readBoard();
    const unknown = [];
    const characterIds = [];
    for (const who of args.characters) {
      const match = before.characters.find(
        (character) =>
          character.id === who || character.name.trim().toLowerCase() === who.trim().toLowerCase(),
      );
      if (match) characterIds.push(match.id);
      else unknown.push(who);
    }
    if (unknown.length > 0) {
      return ok(
        `No cast set: not in the cast — ${unknown.map((name) => `"${name}"`).join(", ")}. Call add_character for each, then cast again.`,
      );
    }
    const { state, changed, result, live } = await commit({
      type: "set_cast",
      ids: args.noteIds,
      characterIds,
    });
    if (!changed) {
      const missing = args.noteIds.filter((id) => !state.notes.some((note) => note.id === id));
      return ok(
        missing.length > 0
          ? `No cast set: no card with id ${missing.join(", ")}. Call list_board to check.`
          : "No change: those cards already had exactly that cast.",
      );
    }
    const names = characterIds.map(
      (id) => state.characters.find((character) => character.id === id)?.name ?? id,
    );
    return ok(
      `${result.length} card(s) now cast ${names.length ? names.join(", ") : "nobody"}${where(live)}.`,
      result,
    );
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
      "Draw a directed arrow from one card to another. kind 'follows' (the default) says what comes after what; kind 'setup' says the first card plants something the second pays off. Arrows are one-way: A→B does not create B→A. If you want both, call this twice — that is two arrows, not one two-headed line. A card cannot point at itself, and the same direction cannot be drawn twice, whatever its kind; use set_arrow_kind to change one.",
    inputSchema: { from: z.string(), to: z.string(), kind: arrowKindSchema.optional() },
  },
  async (args) => {
    const { state, changed, result, live } = await commit({
      type: "create_arrow",
      from: args.from,
      to: args.to,
      kind: args.kind,
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
    return ok(
      result.kind === "setup"
        ? `Drew ${args.from} → ${args.to} as a setup${where(live)}.`
        : `Drew ${args.from} → ${args.to}${where(live)}.`,
      result,
    );
  },
);

server.registerTool(
  "set_arrow_kind",
  {
    title: "Set arrow kind",
    description:
      "Change what an arrow means: 'follows' (what comes after what) or 'setup' (the tail plants something the head pays off). Needs the arrow's id from list_board.",
    inputSchema: { id: z.string(), kind: arrowKindSchema },
  },
  async (args) => {
    const { state, changed, live } = await commit({
      type: "set_arrow_kind",
      id: args.id,
      kind: args.kind,
    });
    if (!changed) {
      return state.arrows.some((arrow) => arrow.id === args.id)
        ? ok(`That arrow is already '${args.kind}'.`)
        : ok(`No arrow with id ${args.id}. Call list_board for the real ids.`);
    }
    return ok(`That arrow is now '${args.kind}'${where(live)}.`);
  },
);

// --- The project (R35) ------------------------------------------------------

function describeBoards(project, boards) {
  return project.boards
    .map((board, index) => {
      const state = boards[board.id];
      const open = board.id === project.activeBoardId ? " (open)" : "";
      const shape =
        state && isBoardState(state)
          ? `${state.notes.length} cards, about ${formatPages(boardEighths(normalizeState(state)))} of ${formatPages(normalizeState(state).targetEighths)} pages`
          : "no cards";
      return `  ${index + 1}. ${board.id} — "${board.name}"${open}: ${shape}`;
    })
    .join("\n");
}

server.registerTool(
  "list_boards",
  {
    title: "List boards",
    description:
      "The project: its name, its premise, and every board with id, name, and shape, marking the one that is open. Boards are in the writer's order — a season's episodes, or a writer's stories. Use the ids here for open_board, rename_board and delete_board.",
    inputSchema: {},
  },
  async () => {
    const { project, boards, live } = await readProject();
    return ok(
      [
        `Project "${project.name}" (${live ? "live: app is open" : "from file: app not running"})`,
        `premise: ${project.premise ? `"${project.premise}"` : "(not set)"}`,
        `boards: ${project.boards.length}`,
        describeBoards(project, boards),
      ].join("\n"),
      project,
    );
  },
);

server.registerTool(
  "open_board",
  {
    title: "Open board",
    description:
      "Open another board of the project by id, name, or number from list_boards. Every card tool then works on that board; the open wall switches too.",
    inputSchema: { board: z.string().min(1) },
  },
  async (args) => {
    const { project, boards, rev, base } = await readProject();
    const target = findBoard(project, args.board);
    if (!target) return ok(`No board matches "${args.board}". Call list_boards for the real ones.`);
    if (target.id === project.activeBoardId) return ok(`"${target.name}" is already open.`);
    const { live } = await openBoardEverywhere(project, boards, rev, base, target.id);
    return ok(`Opened "${target.name}"${where(live)}.`, target);
  },
);

server.registerTool(
  "new_board",
  {
    title: "New board",
    description:
      "Add a board to the project and open it: an empty wall with the logline placeholder, under the same premise, with the same target length as the board that was open. Nothing else is touched — the other boards stay as they are. Name it for what it is: an episode, a draft, a story.",
    inputSchema: { name: z.string().optional() },
  },
  async (args) => {
    const { project, boards, rev, base } = await readProject();
    const previous = boards[project.activeBoardId];
    const target =
      previous && isBoardState(previous) ? normalizeState(previous).targetEighths : undefined;
    const { project: next, board } = addBoard(project, args.name ?? "");
    const fresh = { ...emptyState(), ...(target ? { targetEighths: target } : {}) };
    const { live } = await openBoardEverywhere(next, { ...boards, [board.id]: fresh }, rev, base, board.id);
    return ok(
      `Added "${board.name}" (${board.id}) and opened it${where(live)}. It is empty: set the logline, then start on the beats.`,
      board,
    );
  },
);

server.registerTool(
  "rename_board",
  {
    title: "Rename board",
    description: "Rename a board of the project by id, name, or number.",
    inputSchema: { board: z.string().min(1), name: z.string().min(1) },
  },
  async (args) => {
    const { project, boards, rev, base } = await readProject();
    const target = findBoard(project, args.board);
    if (!target) return ok(`No board matches "${args.board}". Call list_boards for the real ones.`);
    const next = renameBoard(project, target.id, args.name);
    if (next === project) return ok(`"${target.name}" already has that name.`);
    const live = await writeProject(next, boards, rev, base);
    return ok(`Renamed to "${args.name.trim()}"${where(live)}.`);
  },
);

server.registerTool(
  "delete_board",
  {
    title: "Delete board",
    description:
      "Remove a board and everything on it. This cannot be undone — not from the wall either — so ask the writer first, say how many cards it holds, and suggest Save project. The last board of a project cannot be deleted. If the open board goes, the one before it opens.",
    inputSchema: { board: z.string().min(1) },
  },
  async (args) => {
    const { project, boards, rev, base } = await readProject();
    const target = findBoard(project, args.board);
    if (!target) return ok(`No board matches "${args.board}". Call list_boards for the real ones.`);
    if (project.boards.length <= 1) return ok("Not deleted: a project keeps at least one board.");
    const next = removeBoard(project, target.id);
    const remaining = { ...boards };
    delete remaining[target.id];
    if (next.activeBoardId !== project.activeBoardId) {
      const { live } = await openBoardEverywhere(next, remaining, rev, base, next.activeBoardId);
      return ok(`Deleted "${target.name}" and opened "${boardById(next, next.activeBoardId)?.name}"${where(live)}.`);
    }
    const live = await writeProject(next, remaining, rev, base);
    return ok(`Deleted "${target.name}"${where(live)}.`);
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
