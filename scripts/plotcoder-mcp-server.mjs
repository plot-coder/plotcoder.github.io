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
  CHARACTER_FIELDS,
  emptyState,
  filledCharacterFields,
  formatPages,
  isBoardState,
  isMeasured,
  NOTE_HEIGHT,
  NOTE_WIDTH,
  DEFAULT_TARGET_EIGHTHS,
  normalizeState,
  newId,
  noteEighths,
  NOTE_COLORS,
  NOTE_RANKS,
  seedState,
} from "../src/board/reducer.js";
import { TEMPLATES } from "../src/board/templates.js";
import { wordSentence, wordsAsText } from "../src/board/words.js";
import { fromFountain, mergeFountain, toFountain } from "../src/board/fountain.js";
import { toMarkdown, toPlainText } from "../src/board/markdown.js";
import { fromProjectFile, toProjectFile } from "../src/board/projectFile.js";
import { describeSetAside, fromFdx, toFdx } from "../src/board/fdx.js";
import { paginate } from "../src/board/paginate.js";
import { readingOrder, storyOrder } from "../src/board/readWall.js";
import { REVISION_COLORS, revisionMarks, sceneNumbers } from "../src/board/numbering.js";
import { sceneHeading, standInFor } from "../src/board/fountain.js";
import { segmentBrief, WORKFLOWS } from "../src/board/workflows.js";
import { DEFAULT_REMINDERS, titleFromBody } from "../src/board/reminders.js";
import crypto from "node:crypto";
import { describeRuns, describeSetups, readWall } from "../src/board/readWall.js";
import { compareStructure, describeComparison, MATCH_PAGES } from "../src/board/compareStructure.js";
import { GAP, ROW_WIDTH, organizePoses } from "../src/board/organize.js";
import { parseScene, sceneLineCount } from "../src/board/paginate.js";
import {
  addBoard,
  addStructure,
  boardById,
  emptyProject,
  findBoard,
  isProjectRecord,
  normalizeProject,
  removeBoard,
  renameBoard,
  removeStructure,
  setActiveBoard,
  setPremise,
  structureBeats,
  reidentifyProject,
  renameProject,
  castElsewhere,
  landingsOn,
  laterBoards,
  liftCast,
  mergeRoster,
  sameRoster,
  scriptTitles,
  withRoster,
} from "../src/board/project.js";

/**
 * One PlotCoder server, with its own doors and its own trail: the stdio door
 * makes one for the process (serveStdio), the hosted door makes one per
 * request with the writer's sign-in from the request (plotcoder-http.mjs).
 * Nothing lives at module level, so two writers never share a door.
 */
export function createPlotcoderServer(env = process.env) {

const colorSchema = z.enum(NOTE_COLORS);
const rankSchema = z.enum(NOTE_RANKS);
const arrowKindSchema = z.enum(ARROW_KINDS);
// Agents get pages, not eighths. Eighths are the storage unit; asking a
// model to convert is a needless chance to be wrong by a factor of eight.
const pagesSchema = z.number().positive();
const toEighths = (pages) => Math.round(pages * EIGHTHS_PER_PAGE);

function log(...args) {
  console.error("[plotcoder-mcp]", ...args);
}

// --- Where does the board live? -------------------------------------------

function findRepoRoot() {
  if (env.PLOTCODER_ROOT) return path.resolve(env.PLOTCODER_ROOT);
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
  // Not inside a checkout: the folder the server was started in is the wall's
  // folder — never this package's own folder, which under npx is a cache.
  try {
    return process.cwd();
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
  if (env.PLOTCODER_BRIDGE_URL) bases.push(env.PLOTCODER_BRIDGE_URL);
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
  if (env.PLOTCODER_NO_BRIDGE === "1") return null;
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

// --- The account door (Roadmap 2, item 6) -----------------------------------
//
// With PLOTCODER_EMAIL and PLOTCODER_PASSWORD in the environment — the
// writer's own, never a service key — the server works the writer's project
// on the account directly: the same rows, the same revisions, and every
// change landing on every open wall over Realtime. The sign-in being set is
// the agent saying which wall it means, so the account wins over a dev app
// that happens to be open on this machine (round five, finding 9: an agent
// worked another worktree's wall for five calls before it knew). Without the
// sign-in, the open app comes first, then the file. PLOTCODER_PROJECT picks
// the project by name or id; otherwise the most recently touched. The
// password is hashed here exactly as the browser does.

const ACCOUNT = "account";
const SUPABASE_URL = env.VITE_SUPABASE_URL ?? "https://kmpahjsggbleygsnuwug.supabase.co";
const SUPABASE_KEY = env.VITE_SUPABASE_KEY ?? "sb_publishable_nTTiV21Fva9zp8kvcbf6Kg_ZPOgB6Th";
let accountDoor = null;
let accountTried = false;
/** Why the door is shut when the writer's sign-in is set but failed. Every tool says this; none reads the file instead (round four, findings 5–7). */
let accountRefusal = null;
const NO_PROJECT_YET = "The account holds no project yet: new_project starts the writer's first.";
/** The same, naming the account, with the folder named only when a wall in the folder was left alone (rounds eight and ten). */
function noProjectYet() {
  const who = accountDoor?.email ? `The account, as ${accountDoor.email}, holds no project yet: new_project starts the writer's first.` : NO_PROJECT_YET;
  return accountDoor?.skippedFolder ? `${who} The sample wall in this folder was not uploaded.` : who;
}

/** A door's answer — shut, or no project yet — thrown from a read and turned into a plain reply by every tool. Not an error. */
class DoorReply extends Error {}

/** The hosted door (R48): one server per request, the writer's sign-in from the request, no disk. */
function hosted() {
  return env.PLOTCODER_HOSTED === "1";
}

function accountEnv() {
  return Boolean(env.PLOTCODER_EMAIL && env.PLOTCODER_PASSWORD);
}

function refusal(email, reason) {
  return `The account door refused ${email.trim().toLowerCase()}: ${reason}. Nothing was read or written anywhere else. Check PLOTCODER_EMAIL and PLOTCODER_PASSWORD in the server's environment; no account yet? claim_account makes one, with the email and password the writer gives.`;
}

/** Through plotcoder-call every call is a fresh server: what this server chose does not reach the next call unless the environment carries it. */
function oneCall() {
  return env.PLOTCODER_ONE_CALL === "1";
}

function oneCallHint(record) {
  return oneCall() ? ` Through plotcoder-call every call is a fresh server, so set PLOTCODER_PROJECT=${record.id} in the environment for the next calls (the name, "${record.name}", works too, while it is the only one).` : "";
}


// --- The account is the writer's, from the agent's side (R45) ---------------
//
// Signed in as the writer, the agent may delete what the writer owns: a
// project, every project, the account itself. The database already allows
// the owner of a project to delete it; the files go first, while the
// membership the storage rules read still exists. No service key anywhere.

/** The writer's projects on the account: the ones they own, and the ones merely shared with them. */
async function ownedAndShared() {
  const all = await accountProjects();
  const me = accountDoor.user.id;
  return { all, owned: all.filter((row) => row.owner === me), shared: all.filter((row) => row.owner !== me) };
}

/** What deleting a project takes with it. */
async function deletionPlan(row) {
  const boards = await accountDoor.client.from("boards").select("id, state").eq("project_id", row.id);
  const cards = (boards.data ?? []).reduce((sum, board) => sum + (isBoardState(board.state) ? board.state.notes.length : 0), 0);
  const files = await accountDoor.client.from("assets").select("id, path").eq("project_id", row.id);
  return { id: row.id, name: row.record.name, boards: (boards.data ?? []).length, cards, files: (files.data ?? []).map((file) => file.path) };
}

function describePlan(plan) {
  return `"${plan.name}" (${plan.id}): ${plan.boards} board(s), ${plan.cards} card(s), ${plan.files.length} file(s)`;
}

/** Delete one project the writer owns: its files first, then the row; boards and file records cascade. */
async function deleteProjectRows(plan) {
  if (plan.files.length) {
    const removed = await accountDoor.client.storage.from("projects").remove(plan.files);
    if (removed.error) throw new Error(`could not remove the files of "${plan.name}": ${removed.error.message}`);
  }
  const gone = await accountDoor.client.from("projects").delete().eq("id", plan.id).select("id");
  if (gone.error) throw new Error(gone.error.message);
  if (!gone.data || gone.data.length === 0) throw new Error(`"${plan.name}" was not deleted: the account did not allow it.`);
}

/** After a deletion took the working project: work the most recent one left, or nothing. */
async function workWhatIsLeft(deletedIds) {
  if (!deletedIds.includes(accountDoor.projectId)) return "";
  if (accountDoor.channel) {
    void accountDoor.client.removeChannel(accountDoor.channel);
    accountDoor.channel = null;
  }
  const projects = await accountProjects();
  if (projects.length === 0) {
    accountDoor.projectId = null;
    accountDoor.projectName = null;
    accountDoor.projectCount = 0;
    accountDoor.skippedFolder = false;
    return ` ${NO_PROJECT_YET}`;
  }
  workingProject(projects[0].id, projects[0].record.name, projects.length);
  joinPresence(projects[0].id);
  return ` Working "${projects[0].record.name}" now.`;
}

function countCards(boards) {
  return Object.values(boards).reduce((sum, state) => sum + (isBoardState(state) ? state.notes.length : 0), 0);
}

/** The reply when a tool needs the account and there is none: the refusal when the door is shut, the plain text otherwise. */
function shut(text) {
  return ok(accountRefusal ?? text);
}

const SESSION_KEY = "sb-plotcoder-auth-token";
const SESSION_FILE = path.join(REPO_ROOT, ".plotcoder", "account-session.json");

/** supabase-js session storage as a file, for the one-call door: a map of keys in .plotcoder/account-session.json, mode 0600. */
function sessionFileStorage() {
  const read = () => {
    try {
      return JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
    } catch {
      return {};
    }
  };
  const write = (map) => {
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
    fs.writeFileSync(SESSION_FILE, JSON.stringify(map), { mode: 0o600 });
  };
  return {
    getItem: (key) => read()[key] ?? null,
    setItem: (key, value) => write({ ...read(), [key]: value }),
    removeItem: (key) => {
      const map = read();
      delete map[key];
      write(map);
    },
  };
}

function hashPassword(email, password) {
  return crypto.createHash("sha256").update(`plotcoder\n${email.trim().toLowerCase()}\n${password}`).digest("hex");
}

async function findAccount() {
  const email = env.PLOTCODER_EMAIL;
  const password = env.PLOTCODER_PASSWORD;
  if (!email || !password) return null;
  if (accountDoor) return accountDoor;
  if (accountTried) return null;
  accountTried = true;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    // Node before 22 has no WebSocket of its own; `ws` stands in, for Realtime presence.
    let transport;
    try {
      transport = (await import("ws")).default;
    } catch {
      transport = undefined;
    }
    // Through the shell door every call is a fresh server, so the sign-in is
    // kept in the repo's ignored .plotcoder folder between calls and only the
    // first call signs in (round eight, finding 2). PLOTCODER_SESSION=0 keeps
    // nothing. An MCP session signs in once anyway and keeps nothing on disk.
    const keep = oneCall() && env.PLOTCODER_SESSION !== "0";
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: keep
        ? { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storage: sessionFileStorage() }
        : { persistSession: false, autoRefreshToken: true },
      ...(transport ? { realtime: { transport } } : {}),
    });
    const wanted = email.trim().toLowerCase();
    let user = null;
    if (keep) {
      const kept = await client.auth.getSession();
      if (kept.data.session && (kept.data.session.user?.email ?? "").toLowerCase() === wanted) user = kept.data.session.user;
    }
    if (!user) {
      const signedIn = await client.auth.signInWithPassword({ email: wanted, password: hashPassword(email, password) });
      if (signedIn.error || !signedIn.data.user) {
        accountRefusal = refusal(email, signedIn.error?.message ?? "no user came back");
        log("account door:", accountRefusal);
        if (keep) sessionFileStorage().removeItem(SESSION_KEY);
        return null;
      }
      user = signedIn.data.user;
    }
    accountDoor = { client, user, email: wanted, projectId: null, channel: null };
    await chooseProject(env.PLOTCODER_PROJECT ?? "");
    return accountDoor;
  } catch (error) {
    accountRefusal = refusal(email, `could not reach the account service (${error instanceof Error ? error.message : String(error)})`);
    log("account door:", accountRefusal);
    return null;
  }
}

/** The writer's projects, newest first. */
async function accountProjects() {
  const { data, error } = await accountDoor.client.rpc("my_projects");
  if (error) throw new Error(error.message);
  return (data ?? []).filter((row) => isProjectRecord(row.record)).map((row) => ({ ...row, record: normalizeProject(row.record) }));
}

/** Pick the project by name or id, or the most recent; with none, make one from the file. */
async function chooseProject(key) {
  const projects = await accountProjects();
  const wanted = key.trim().toLowerCase();
  let chosen =
    projects.find((row) => row.id === key) ??
    projects.find((row) => row.record.name.trim().toLowerCase() === wanted) ??
    (wanted ? null : projects[0]);
  if (!chosen && wanted && projects.length) {
    log(`account door: no project called "${key}"; using the most recent`);
    chosen = projects[0];
  }
  if (!chosen) {
    // The account holds nothing: this folder's work becomes its first project —
    // unless the folder holds only the sample wall, or nothing, which is
    // nobody's work and never lands on an account (round four, finding 9).
    // Then the account stays empty until new_project.
    const file = readFileProject();
    const board = readFileBoard();
    let record = file ? file.project : emptyProject();
    const boards = file ? file.boards : { [record.activeBoardId]: board.state };
    const work = record.boards.some((meta) => {
      const state = isBoardState(boards[meta.id]) ? normalizeState(boards[meta.id]) : emptyState();
      return state.notes.length > 0 && !isSampleWall(state);
    });
    if (!work) {
      accountDoor.projectId = null;
      // Only a folder that actually held a wall is worth a word.
      accountDoor.skippedFolder = Boolean(file) || fs.existsSync(BOARD_FILE);
      return null;
    }
    record = { ...record, name: record.name || "From the agent" };
    const inserted = await accountDoor.client.from("projects").insert({ id: record.id, record, reminders: file?.reminders ?? null, rev: 1 });
    if (inserted.error) throw new Error(inserted.error.message);
    for (const meta of record.boards) {
      const state = isBoardState(boards[meta.id]) ? normalizeState(boards[meta.id]) : emptyState();
      await accountDoor.client.from("boards").insert({ id: meta.id, project_id: record.id, state, rev: 1, updated_by: null });
    }
    chosen = { id: record.id, record };
  }
  workingProject(chosen.id, chosen.record.name, projects.length);
  joinPresence(chosen.id);
  return chosen;
}

/** "an agent, as robert" under People while the server is up; best effort. */
function joinPresence(projectId) {
  try {
    if (accountDoor.channel) void accountDoor.client.removeChannel(accountDoor.channel);
    const channel = accountDoor.client.channel(`project:${projectId}`, { config: { presence: { key: `${accountDoor.user.id}-agent` } } });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") void channel.track({ name: `an agent, as ${accountDoor.email}` });
    });
    accountDoor.channel = channel;
  } catch (error) {
    log("account door: presence unavailable:", error);
  }
}

async function accountReadProject() {
  if (!accountDoor.projectId) throw new DoorReply(noProjectYet());
  const { data, error } = await accountDoor.client.from("projects").select("id, record, reminders, rev").eq("id", accountDoor.projectId).maybeSingle();
  if (error || !data || !isProjectRecord(data.record)) throw new Error(error?.message ?? "the project is gone from the account");
  const project = normalizeProject(data.record);
  const rows = await accountDoor.client.from("boards").select("id, state, rev, updated_at").eq("project_id", project.id);
  const boards = {};
  const revs = {};
  const changedAt = {};
  for (const row of rows.data ?? []) {
    if (isBoardState(row.state)) boards[row.id] = normalizeState(row.state);
    revs[row.id] = row.rev;
    if (row.updated_at) changedAt[row.id] = row.updated_at;
  }
  return { project, boards, revs, changedAt, reminders: Array.isArray(data.reminders) ? data.reminders : null, rev: data.rev, base: ACCOUNT, live: ACCOUNT };
}

async function accountWriteProject(project, boards, rev, reminders) {
  const patch = { record: project, rev: rev + 1, updated_at: new Date().toISOString(), ...(reminders ? { reminders } : {}) };
  let done = await accountDoor.client.from("projects").update(patch).eq("id", project.id).eq("rev", rev).select("rev");
  if (!done.error && done.data && done.data.length === 0) {
    // Moved elsewhere since we read it: take the account's revision and write over it, once.
    const fresh = await accountDoor.client.from("projects").select("rev").eq("id", project.id).maybeSingle();
    const current = fresh.data?.rev ?? rev;
    done = await accountDoor.client.from("projects").update({ ...patch, rev: current + 1 }).eq("id", project.id).eq("rev", current).select("rev");
  }
  if (done.error) throw new Error(done.error.message);
  // Boards the record names that the account lacks are new; ones it no longer names go.
  const have = await accountDoor.client.from("boards").select("id").eq("project_id", project.id);
  const known = new Set((have.data ?? []).map((row) => row.id));
  for (const meta of project.boards) {
    if (!known.has(meta.id)) {
      const state = isBoardState(boards[meta.id]) ? normalizeState(boards[meta.id]) : emptyState();
      await accountDoor.client.from("boards").insert({ id: meta.id, project_id: project.id, state, rev: 1, updated_by: null });
    }
  }
  const named = new Set(project.boards.map((meta) => meta.id));
  const gone = [...known].filter((id) => !named.has(id));
  if (gone.length) await accountDoor.client.from("boards").delete().in("id", gone);
  return ACCOUNT;
}

async function accountReadBoard() {
  const { project, boards, revs } = await accountReadProject();
  const boardId = project.activeBoardId;
  return { state: boards[boardId] ?? emptyState(), rev: revs[boardId] ?? 0, boardId, base: ACCOUNT, live: ACCOUNT };
}

async function accountWriteBoard(next, rev, boardId) {
  // updated_by is null on purpose: the browser skips its own writes by user
  // id, and the agent signs in as the writer.
  const patch = { state: next, rev: rev + 1, updated_by: null, updated_at: new Date().toISOString() };
  let done = await accountDoor.client.from("boards").update(patch).eq("id", boardId).eq("rev", rev).select("rev");
  if (!done.error && done.data && done.data.length === 0) {
    const fresh = await accountDoor.client.from("boards").select("rev").eq("id", boardId).maybeSingle();
    const current = fresh.data?.rev ?? rev;
    done = await accountDoor.client.from("boards").update({ ...patch, rev: current + 1 }).eq("id", boardId).eq("rev", current).select("rev");
  }
  if (done.error) throw new Error(done.error.message);
  return ACCOUNT;
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

// --- The project: the record and every board ------------------------

function readFileProject() {
  try {
    const parsed = JSON.parse(fs.readFileSync(PROJECT_FILE, "utf8"));
    if (parsed && isProjectRecord(parsed.project)) {
      return {
        project: normalizeProject(parsed.project),
        boards: parsed.boards && typeof parsed.boards === "object" ? parsed.boards : {},
        reminders: Array.isArray(parsed.reminders) ? parsed.reminders : null,
        rev: typeof parsed.rev === "number" ? parsed.rev : 0,
      };
    }
  } catch {
    /* no project file yet */
  }
  return null;
}

function writeFileProject(project, boards, rev, reminders = null) {
  fs.mkdirSync(path.dirname(PROJECT_FILE), { recursive: true });
  const kept = reminders ?? readFileProject()?.reminders ?? null;
  const payload = { app: "plotcoder", version: 2, rev, project, boards, ...(kept ? { reminders: kept } : {}) };
  fs.writeFileSync(PROJECT_FILE, `${JSON.stringify(payload, null, 2)}\n`);
}

/**
 * The project as the bridge or the file holds it. A wall from before projects
 * existed becomes a one-board project around the board on file, so every
 * board tool works on an older checkout too.
 */
/** The account door, when the sign-in is set: the project, or the refusal. Null when no sign-in is set. */
async function throughAccount(read) {
  if (!accountEnv()) return null;
  if (await findAccount()) return read();
  throw new DoorReply(accountRefusal ?? "The account door is shut.");
}

/** The project as last read, so any reading of the open board can know who is cast on another board (R51) without a second read. */
let lastHeld = null;
async function readProject() {
  const held = await readProjectUncached();
  lastHeld = held;
  return held;
}
/** People on a card of another board of the project: the ids readWall must not ask about (round fifteen, entries 18 and 21). */
function elsewhereIds(boardId) {
  if (!lastHeld?.project) return [];
  return Object.keys(castElsewhere(lastHeld.project, lastHeld.boards, boardId ?? lastHeld.project.activeBoardId));
}
/** Everything a reading of one board needs to know about the rest of the project (R51, R58), from the last project read. */
function readOptions(boardId, state = null) {
  if (!lastHeld?.project) return { elsewhere: [] };
  const id = boardId ?? lastHeld.project.activeBoardId;
  const boards = state ? { ...lastHeld.boards, [id]: state } : lastHeld.boards;
  return { elsewhere: elsewhereIds(id), laterBoards: laterBoards(lastHeld.project, boards), paidBy: landingsOn(lastHeld.project, boards, id).paid };
}
/** A card's number as the reading prints it: the lock's when locked, else its place in story order. */
function sceneLabel(state, noteId) {
  const numbers = state.lock ? sceneNumbers(storyOrder(state), state.lock) : null;
  const numbered = numbers?.get?.(noteId);
  if (numbered) return numbered;
  const index = storyOrder(state).findIndex((note) => note.id === noteId);
  return index >= 0 ? String(index + 1) : "?";
}
/** "Ep 1, sc 4": a scene on another board, named by the board's place in the project and the scene's in its story (R58). */
function episodeLabel(project, boards, boardId, noteId) {
  const index = project.boards.findIndex((meta) => meta.id === boardId);
  const state = isBoardState(boards[boardId]) ? normalizeState(boards[boardId]) : null;
  return `Ep ${index + 1}${state && noteId ? `, sc ${sceneLabel(state, noteId)}` : ""}`;
}
async function readProjectUncached() {
  const viaAccount = await throughAccount(accountReadProject);
  if (viaAccount) return viaAccount;
  const base = await findBridge();
  if (base) {
    try {
      const res = await fetch(`${base}/__plotcoder/project`, { signal: AbortSignal.timeout(1500) });
      const data = await res.json();
      if (data && isProjectRecord(data.project)) {
        return {
          project: normalizeProject(data.project),
          boards: data.boards && typeof data.boards === "object" ? data.boards : {},
          reminders: Array.isArray(data.reminders) ? data.reminders : null,
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
  // Written down at once, so the ids an agent reads are the ids it keeps
  // (a blind run saw the first board's id change between calls).
  writeFileProject(record, { [id]: board.state }, 1);
  if (!board.boardId) writeFileBoard(board.state, board.rev, id);
  return { project: record, boards: { [id]: board.state }, rev: 1, base: null, live: false };
}

async function writeProject(project, boards, rev, base, reminders = null) {
  if (base === ACCOUNT) return accountWriteProject(project, boards, rev, reminders);
  if (base) {
    try {
      const res = await fetch(`${base}/__plotcoder/project`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project, boards, rev, ...(reminders ? { reminders } : {}) }),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json();
        writeFileProject(data.project ?? project, data.boards ?? boards, data.rev ?? rev + 1, data.reminders ?? reminders);
        return true;
      }
    } catch (error) {
      log("bridge project write failed, falling back to file:", error);
    }
  }
  writeFileProject(project, boards, rev + 1, reminders);
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

/**
 * The open board with the project's cast in it (R51). A project written
 * before the cast moved to the record is lifted once, here, and written back.
 */
async function readBoard() {
  const raw = await readBoardRaw();
  const held = await readProject();
  if (!Array.isArray(held.project.characters)) {
    const boardId = raw.boardId ?? held.project.activeBoardId;
    const lifted = liftCast(held.project, { ...held.boards, [boardId]: raw.state });
    await writeProject(lifted.project, lifted.boards, held.rev, held.base);
    return { ...raw, state: lifted.boards[boardId] ?? withRoster(raw.state, lifted.project) };
  }
  return { ...raw, state: withRoster(raw.state, held.project) };
}

async function readBoardRaw() {
  const viaAccount = await throughAccount(accountReadBoard);
  if (viaAccount) return viaAccount;
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

/**
 * Write the board, keeping the project's cast (R51) with it. A kernel
 * command's result ("exact": commit, undo, redo) is the roster as the writer
 * now wants it, removals included, and it is lifted onto the record. Any
 * other state — a board opened, a file imported — joins the cast without
 * shrinking it ("merge"), and is written composed with the record.
 */
async function writeBoard(next, rev, base, boardId = null, roster = "merge") {
  const held = await readProject();
  let toWrite = next;
  if (Array.isArray(held.project.characters)) {
    let project = held.project;
    if (roster === "exact") {
      if (!sameRoster(project.characters, next.characters)) project = { ...project, characters: next.characters, updatedAt: new Date().toISOString() };
    } else {
      const merged = mergeRoster(project, next);
      project = merged.project;
      toWrite = merged.state;
    }
    if (project !== held.project) {
      const boards = {};
      for (const [id, state] of Object.entries(held.boards)) boards[id] = withRoster(state, project);
      boards[boardId ?? project.activeBoardId] = withRoster(toWrite, project);
      // The order matters on the bridge: the board frame carries the exact roster
      // and lands first, so the wall records one undo step holding the card, the
      // cast and the person together (R33, R51); the project frame that follows
      // then changes nothing. The account door keeps the project first, because
      // its live path composes a board's cast against the project row it holds.
      if (base === ACCOUNT) {
        await writeProject(project, boards, held.rev, held.base);
        return writeBoardRaw(toWrite, rev, base, boardId);
      }
      const live = await writeBoardRaw(toWrite, rev, base, boardId);
      await writeProject(project, boards, held.rev, held.base);
      return live;
    }
  }
  return writeBoardRaw(toWrite, rev, base, boardId);
}

async function writeBoardRaw(next, rev, base, boardId = null) {
  if (base === ACCOUNT) return accountWriteBoard(next, rev, boardId);
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
  // A board file from before the project file has no id of its own; once a
  // project file exists it is that project's open board, and it has to say so,
  // or nothing written here reaches the project's copy and open_board later
  // brings back a stale one (found by round fifteen's cross-board move).
  const id = boardId ?? readFileProject()?.project.activeBoardId ?? null;
  writeFileBoard(next, rev + 1, id);
  syncProjectFileBoard(id, next);
  return false;
}

/** Keep the project file's copy of a board current when the app is not open to do it. */
function syncProjectFileBoard(boardId, state) {
  if (!boardId) return;
  const file = readFileProject();
  if (!file || !file.project.boards.some((board) => board.id === boardId)) return;
  writeFileProject(file.project, { ...file.boards, [boardId]: state }, file.rev + 1);
}

// This server's own trail of changes: what the board was before each
// of its tool calls, and what it became. `undo` walks it back — but only when
// the board still is what the call left, so it never tramples a change the
// person made on the wall since.
const TRAIL_CAP = 50;
const trail = [];
/** What undo took back, newest last; a new change of this server's clears it. */
const undone = [];
/** The last read_wall's questions, and what changed since: a leave answers the reading in front of the agent (round thirteen, entry 19). */
let lastReading = null;
const sinceRead = [];
/** What the last write did to the wall's questions and runtime, said once on that write's tail (round fourteen, entries 18, 19, 42). */
let lastChange = null;
// The same question in the same words is the same question, whatever order its names come in (round seventeen, entry 21).
const findingKey = (finding) => `${finding.kind}|${[...finding.ids].sort().join(",")}`;
function noteChange(before, after, boardId = null) {
  // The same reading read_wall gives: a person cast on another board is not
  // asked about, so a write's tail never names a question the reading does not.
  const was = readWall(before, readOptions(boardId, before));
  const now = readWall(after, readOptions(boardId, after));
  const wasKeys = new Set(was.findings.map(findingKey));
  const nowKeys = new Set(now.findings.map(findingKey));
  lastChange = {
    gone: was.findings.filter((finding) => !nowKeys.has(findingKey(finding))),
    came: now.findings.filter((finding) => !wasKeys.has(findingKey(finding))),
    asks: now.findings.length,
    leftBefore: was.left.length,
    leftAfter: now.left.length,
    eighthsBefore: boardEighths(before),
    eighthsAfter: boardEighths(after),
    target: after.targetEighths,
  };
}
function changeNote() {
  const change = lastChange;
  lastChange = null;
  if (!change) return "";
  const parts = [];
  if (change.gone.length || change.came.length) {
    parts.push(
      `the wall now asks ${change.asks} question${change.asks === 1 ? "" : "s"}${change.gone.length ? ` (gone: ${change.gone.map((finding) => `[${finding.kind}] ${finding.text}`).join(" ")})` : ""}${change.came.length ? ` (new: ${change.came.map((finding) => `[${finding.kind}] ${finding.text}`).join(" ")})` : ""}`,
    );
  }
  if (change.leftAfter !== change.leftBefore) parts.push(`left, for now: ${change.leftAfter} (was ${change.leftBefore})`);
  if (change.eighthsAfter !== change.eighthsBefore) parts.push(`runtime now about ${formatPages(change.eighthsAfter)} of ${formatPages(change.target)} pages`);
  // No full stop of its own: the reply it rides on ends the sentence (round sixteen, entry 11).
  return parts.length ? `; ${parts.join("; ")}` : "";
}
/** Said once per session, so a reply does not repeat its advice eighteen times (round thirteen, entry 10). */
const saidOnce = new Set();
function once(key, text) {
  if (saidOnce.has(key)) return "";
  saidOnce.add(key);
  return text;
}

function describeCommand(command) {
  switch (command.type) {
    case "create_note":
      return `create_note "${command.headline ?? ""}"`;
    case "recolor_notes":
      return "recolor_note";
    case "apply_poses":
      return "organize";
    default:
      return command.type;
  }
}

/**
 * A board as one canonical string, so "has the board changed since my call?"
 * compares boards and not the JSON a store happened to write: the account
 * stores JSON in its own key order, and a byte comparison refused every undo
 * but the first (round ten, finding 29).
 */
function canon(state) {
  const sorted = (value) => {
    if (Array.isArray(value)) return value.map(sorted);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key])]));
    }
    return value;
  };
  return JSON.stringify(sorted(normalizeState(state)));
}

async function commit(command) {
  lastChange = null;
  const { state, rev, base, boardId } = await readBoard();
  const { state: next, changed, result } = applyCommand(state, command);
  // `changed` is passed back so a tool can tell the agent that nothing
  // happened, and why. A tool that silently reports success on a rejected
  // command teaches the agent the board is in a state it is not.
  if (!changed) return { state: next, changed, result, live: base !== null };

  const live = await writeBoard(next, rev, base, boardId, "exact");
  trail.push({ before: state, after: canon(next), what: describeCommand(command) });
  sinceRead.push(describeCommand(command));
  noteChange(state, next, boardId);
  if (trail.length > TRAIL_CAP) trail.shift();
  undone.length = 0;
  return { state: next, changed, result, live };
}

/**
 * Several kernel commands as one change. Read once; `build(step, current)` applies
 * each command through the kernel against the running state; write once. One tool
 * call is then one frame on the bridge — one ⌘Z on the wall — and one entry on this
 * server's own trail, however many commands it took: create_note with its cast,
 * set_plant with later, move_scene, an import. Before this, ⌘Z on the wall took the
 * cast off an agent's new card and left the card (R33).
 */
async function commitAll(what, build) {
  lastChange = null;
  const { state, rev, base, boardId } = await readBoard();
  let current = state;
  let changed = false;
  const step = (command) => {
    const out = applyCommand(current, command);
    if (out.changed) {
      current = out.state;
      changed = true;
    }
    return out;
  };
  const value = await build(step, () => current);
  if (!changed) return { state: current, changed: false, value, live: base !== null };
  const live = await writeBoard(current, rev, base, boardId, "exact");
  trail.push({ before: state, after: canon(current), what });
  sinceRead.push(what);
  noteChange(state, current, boardId);
  if (trail.length > TRAIL_CAP) trail.shift();
  undone.length = 0;
  return { state: current, changed: true, value, live };
}

/** Said once per session: that cards stack until organize (round seven, finding 11). */
/** Where a new card lands when the agent gives no position: after the last card in reading order, wrapping five wide, so cards never stack (round eleven, finding 14). */
function nextPlace(state) {
  const order = storyOrder(state);
  const last = order[order.length - 1];
  if (!last) return { x: 140, y: 140 };
  const originX = Math.min(...state.notes.map((note) => note.x));
  const x = last.x + NOTE_WIDTH + GAP;
  if (x + NOTE_WIDTH > originX + ROW_WIDTH) return { x: originX, y: last.y + NOTE_HEIGHT + GAP };
  return { x, y: last.y };
}

/** Which door a read came through, for the head of a reply: the account as whom, the open app, or the file at which path. */
function door(live, base = null) {
  if (live === ACCOUNT) {
    const others = accountDoor.projectCount > 1 ? `, ${accountDoor.projectCount} projects on the account — list_projects for the others` : ", the only project on the account";
    return `the account, as ${accountDoor.email}, working "${accountDoor.projectName}"${others}`;
  }
  return live ? `the open app at ${base ?? "localhost"}` : `the file at ${BOARD_FILE}; no app running`;
}

/** Remember which project the account door is working, for every reply's first line. */
function workingProject(id, name, count) {
  accountDoor.projectId = id;
  accountDoor.projectName = name;
  if (typeof count === "number") accountDoor.projectCount = count;
}

/** Where a change landed, for the tail of a tool's reply. */
function where(live) {
  const tail = live === ACCOUNT ? " (saved to the account; live on every open wall)" : live ? " (visible on the open board)" : " (written to file; the wall shows it the next time the app runs from this folder)";
  return `${tail}${changeNote()}`;
}

/** The wall PlotCoder starts with — Maya, Tom, the letter — and nothing of the writer's yet. */
function isSampleWall(state) {
  const sample = seedState().notes.map((note) => note.headline).sort().join("\n");
  return state.notes.map((note) => note.headline).sort().join("\n") === sample;
}
/** Every check read_wall runs, so silence can be named. */
const CHECKS = ["unmarked", "sag", "empty", "unwritten", "unlinked", "duplicate", "sequence", "uncast", "nobody", "absent", "backwards", "unpaid", "unplanted", "unplaced"];
/** What each check looks for, in words, so "clean" says what was checked rather than a kind's name. */
const CHECK_WORDS = {
  unmarked: "a beat is marked",
  sag: "no run out of proportion",
  empty: "no beats back to back",
  unwritten: "no card without a headline or change line",
  unlinked: "no card without an arrow",
  duplicate: "no two headlines alike",
  sequence: "no group too long for one sequence (act groups are not asked)",
  uncast: "nobody in the cast on no card of the project",
  nobody: "no card with nobody in it",
  absent: "nobody gone for a third of the story",
  backwards: "no payoff before its setup",
  unpaid: "no fold without a payoff",
  unplanted: "no payoff without its fold",
  unplaced: "no card without a place",
};
const SAMPLE_NOTE = "sample: this is the wall PlotCoder starts with (Maya, Tom, the letter); nothing here is the writer's. Replace it, or new_board.";

// --- Reporting -------------------------------------------------------------

/**
 * The cues in a scene's text against the cast (round sixteen, entry 30): a cue
 * matches a person by the whole name, so DANA is not "Dana Kerr", and the
 * reply says which cues found nobody and whom they nearly named.
 */
function cueReport(state, text) {
  const names = [...new Set(parseScene(text ?? "").filter((element) => element.kind === "speech" && element.name).map((element) => element.name.replace(/\s*\(.*\)\s*$/, "").trim()).filter(Boolean))];
  if (!names.length) return "";
  const cast = state.characters ?? [];
  const parts = names.map((cue) => {
    const whole = cast.find((person) => person.name.trim().toLowerCase() === cue.toLowerCase());
    if (whole) return `${cue} (in the cast)`;
    const near = cast.filter((person) => person.name.toLowerCase().split(/\s+/).includes(cue.toLowerCase()));
    return near.length
      ? `${cue} (nobody by that whole name — cues match by the whole name, and the cast has ${near.map((person) => `"${person.name}"`).join(", ")}: cue ${near.length === 1 ? near[0].name.toUpperCase() : "the whole name"})`
      : `${cue} (nobody in the cast)`;
  });
  return ` Cues: ${parts.join("; ")}.`;
}

/** A write on an open card does not close it: the words stay until the writer clears them, and the reply says so (round eighteen, entry 31). */
function stillOpen(notes) {
  const open = (notes ?? []).filter((note) => (note.open ?? "").trim());
  if (!open.length) return "";
  return ` ${open.length === 1 ? `"${open[0].headline}" is still open (${open[0].open})` : `${open.length} of them are still open`}: the words stay until set_open "" clears them, and the wall asks nothing else of ${open.length === 1 ? "it" : "them"} until then.`;
}

/** What kinds of number a runtime folds together: measured from text, set by the writer, or the default page (round fifteen, entry 39). */
function runtimeKinds(state) {
  const measured = state.notes.filter((note) => isMeasured(note));
  const sized = state.notes.filter((note) => !isMeasured(note) && note.lengthEighths !== null);
  const unsized = state.notes.filter((note) => !isMeasured(note) && note.lengthEighths === null);
  if (!state.notes.length) return "";
  const sum = (notes) => formatPages(notes.reduce((total, note) => total + noteEighths(note), 0));
  // Pages per kind, not only cards (round sixteen, entry 43).
  return `; of its ${state.notes.length} cards, ${measured.length} measured from written text (${sum(measured)} pages), ${sized.length} sized by the writer (${sum(sized)}), ${unsized.length} unsized and read as a page each (${sum(unsized)})`;
}

function summarize(state) {
  const nameOf = new Map(state.characters.map((character) => [character.id, character.name]));
  // What lands here from the other boards' folds (R58), from the last project read.
  const paidByHere = lastHeld?.project ? landingsOn(lastHeld.project, { ...lastHeld.boards, [lastHeld.project.activeBoardId]: state }, lastHeld.project.activeBoardId).paid : [];
  const notes = storyOrder(state)
    .map((note) => {
      const cast = note.characterIds.map((id) => nameOf.get(id) ?? id);
      const who = cast.length ? `, cast: ${cast.join(", ")}` : "";
      // The board it pays off on, named here as read_wall names it (round fifteen, entry 44).
      const laterName = note.payoffBoardId ? (lastHeld?.project?.boards?.find((meta) => meta.id === note.payoffBoardId)?.name ?? note.payoffBoardId) : null;
      const laterAt = note.payoffBoardId && note.payoffNoteId && lastHeld?.project ? ` at ${episodeLabel(lastHeld.project, lastHeld.boards, note.payoffBoardId, note.payoffNoteId)} "${lastHeld.boards[note.payoffBoardId]?.notes?.find((item) => item.id === note.payoffNoteId)?.headline ?? note.payoffNoteId}"` : "";
      const plant = note.plants ? (note.payoffBoardId ? `, plants → pays off later on "${laterName}"${laterAt || ", no scene there claimed yet"}` : ", plants") : "";
      // The receiving end (R58): what this card pays off from another board, composed from the project.
      const pays = paidByHere.filter((item) => item.id === note.id).map((item) => `, pays off "${item.fromHeadline}" from "${item.fromBoardName}" (${episodeLabel(lastHeld.project, lastHeld.boards, item.fromBoardId, item.fromNoteId)})`).join("");
      const snap = state.revision?.snapshot?.[note.id];
      const revised = snap && (snap.headline !== note.headline || snap.change !== note.change || (snap.text ?? "") !== (note.text ?? "") || (snap.location ?? "") !== (note.location ?? "")) ? `, changed in ${state.revision.color}` : "";
      const place = note.location ? `, at: ${note.location}` : "";
      const when = note.when ? `, when: ${note.when}` : "";
      const openWord = note.open ? `, open: ${note.open}` : "";
      const count = formatPages(noteEighths(note));
      // A written card's estimate is kept underneath for when the text goes; say it, or it is invisible (round sixteen, entry 44).
      const underneath = isMeasured(note) && note.lengthEighths !== null ? `; the writer's estimate underneath: ${formatPages(note.lengthEighths)}` : "";
      const pages = isMeasured(note) ? `${count} ${count === "1" ? "page" : "pages"}, written${underneath}` : note.lengthEighths === null ? "about a page, unsized" : `${count} ${count === "1" ? "page" : "pages"}`;
      return `  - ${note.id} [${note.rank ?? "scene"}, ${pages}${who}${place}${when}${openWord}${plant}${pays}${revised}] — "${note.headline}" (${note.color}) at ${Math.round(note.x)},${Math.round(note.y)}`;
    })
    .join("\n");
  const cast = state.characters
    .map((character) => {
      const on = state.notes.filter((note) => note.characterIds.includes(character.id)).length;
      // Which lines of their page are written, so an agent can see who is a
      // brief and who is still a name.
      const page = filledCharacterFields(character);
      const brief = page.length ? ` · page: ${page.join(", ")}` : " · page: empty";
      // On this board, and on the others (R51): a per-board count beside a project-wide check read as a contradiction (round sixteen, entry 18).
      const away = lastHeld?.project ? (castElsewhere(lastHeld.project, lastHeld.boards, lastHeld.project.activeBoardId)[character.id] ?? []).reduce((sum, item) => sum + item.cards, 0) : 0;
      return `  - ${character.id} — "${character.name}" on ${on} card${on === 1 ? "" : "s"} of this board${away ? ` and ${away} of other boards` : ""}${brief}`;
    })
    .join("\n");
  const placeCounts = new Map();
  for (const note of state.notes) {
    const phrase = (note.location ?? "").trim();
    if (phrase) placeCounts.set(phrase, (placeCounts.get(phrase) ?? 0) + 1);
  }
  const places = [...placeCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([phrase, count]) => `  - "${phrase}" on ${count} card${count === 1 ? "" : "s"}`)
    .join("\n");
  const { beats, scenes } = countRanks(state);
  const headline = (id) =>
    state.notes.find((note) => note.id === id)?.headline ?? "(missing card)";

  // Groups and arrows are listed with their own ids, not just counted. An agent
  // cannot ungroup, rename, or delete an arrow it has never been told the id of.
  const storyIndex = new Map(storyOrder(state).map((note, index) => [note.id, index]));
  const groups = state.groups
    .map(
      (group) =>
        `  - ${group.id} — "${group.title}" holds ${group.noteIds.length}, in story order: ${[...group.noteIds].sort((a, b) => (storyIndex.get(a) ?? Infinity) - (storyIndex.get(b) ?? Infinity)).join(", ")}`,
    )
    .join("\n");
  const arrows = [...state.arrows]
    .sort((a, b) => (storyIndex.get(a.from) ?? Infinity) - (storyIndex.get(b.from) ?? Infinity) || (a.kind === "setup") - (b.kind === "setup"))
    .map(
      (arrow) =>
        `  - ${arrow.id} [${arrow.kind ?? "follows"}] — ${arrow.from} → ${arrow.to}  ("${headline(arrow.from)}" ${arrow.kind === "setup" ? "sets up" : "→"} "${headline(arrow.to)}")`,
    )
    .join("\n");

  // No blank lines: ok() uses the first blank line to separate prose from the
  // JSON payload, so one in here would swallow the payload.
  const numbers = state.lock ? sceneNumbers(storyOrder(state), state.lock) : null;
  const production = [
    `numbers: ${state.lock ? `locked ${String(state.lock.at).slice(0, 10)} — ${[...numbers.entries()].map(([id, n]) => `${n}:${id}`).join(" ")}` : "follow the wall's order"}`,
    `revision: ${state.revision ? `"${state.revision.name}" in ${state.revision.color} since ${String(state.revision.since).slice(0, 10)}` : "none"}`,
  ];
  const runtime = boardEighths(state);
  const over = runtime - state.targetEighths;
  // The wall as rows, the nearest thing to a look at it without the app (round fourteen, entry 15).
  const rows = [];
  for (const note of readingOrder(state.notes)) {
    const row = rows[rows.length - 1];
    if (row && note.y - row.top <= NOTE_HEIGHT / 2) row.notes.push(note);
    else rows.push({ top: note.y, notes: [note] });
  }
  const rowLines = rows.map((row, index) => `  ${index + 1}: ${row.notes.map((note) => `${note.rank === "beat" ? "★ " : ""}"${note.headline}"`).join(" · ")}`);
  const leftCount = (state.left ?? []).length;
  return [
    ...(isSampleWall(state) ? [SAMPLE_NOTE] : []),
    `logline: ${state.logline ? `"${state.logline}"` : "(not set)"}`,
    ...production,
    `left, for now: ${leftCount ? `${leftCount} question(s) the writer left; read_wall lists them` : "none"}`,
    `beats: ${beats}, scenes: ${scenes}`,
    state.targetEighths === DEFAULT_TARGET_EIGHTHS
      ? `runtime: about ${formatPages(runtime)} pages (an estimate from the cards; a page runs about a minute); no target set — set_target for a pilot (60) or a half-hour (30); against the feature default of 120 it would be ${formatPages(-over)} under${runtimeKinds(state)}`
      : `runtime: about ${formatPages(runtime)} pages of a ${formatPages(state.targetEighths)}-page target — ${over > 0 ? `${formatPages(over)} over` : over < 0 ? `${formatPages(-over)} under` : "on it"} (an estimate from the cards; a page runs about a minute)${runtimeKinds(state)}`,
    `notes: ${state.notes.length}, groups: ${state.groups.length}, arrows: ${state.arrows.length}, cast: ${state.characters.length}`,
    "cards (in story order — the follows arrows over the rows; each with its id):",
    notes || "  (no cards)",
    "rows on the wall (top to bottom, left to right; ★ a beat):",
    ...(rowLines.length ? rowLines : ["  (no cards)"]),
    "cast (the project's; every board of it casts from here):",
    cast || "  (no one yet — add_character to start the roster)",
    "places (each phrase is its own place, and the app relates none of them — if two are one place, set_location them the same):",
    places || "  (no card says where it happens yet)",
    "groups:",
    groups || "  (no groups)",
    "arrows:",
    arrows || "  (no arrows)",
  ].join("\n");
}

// Wire format: prose, one blank line, then the JSON payload. `text` must not
// contain a blank line of its own or the payload becomes unparseable.
// PLOTCODER_JSON=0 drops the JSON tail from every reply, for an agent that
// reads the sentence and wants nothing more (a blind run found 400-line replies).
const TEXT_ONLY = env.PLOTCODER_JSON !== "1";
function ok(text, data) {
  const body = data === undefined || TEXT_ONLY ? text : `${text}\n\n${JSON.stringify(data, null, 2)}`;
  return { content: [{ type: "text", text: body }] };
}

// --- Server ----------------------------------------------------------------

const server = new McpServer({ name: "plotcoder-board", version: "0.1.0" });

// A door's answer is a reply, not an error: a shut account door, or an
// account with no project yet, says so in words from every tool alike.
// Tool calls run one at a time. Every tool reads the board, decides, and
// writes it back; two calls interleaving at those awaits would each read the
// same board and the second would write over the first — thirteen parallel
// create_note calls naming Nessa made thirteen Nessas in prospect (round
// eleven, finding 22). One lane, in the order the calls arrive.
const registerTool = server.registerTool.bind(server);
let lane = Promise.resolve();
server.registerTool = (name, config, handler) =>
  registerTool(name, config, (...args) => {
    const turn = lane.then(() =>
      handler(...args).catch((error) => {
        if (error instanceof DoorReply) return ok(error.message);
        throw error;
      }),
    );
    lane = turn.catch(() => undefined);
    return turn;
  });

server.registerTool(
  "list_board",
  {
    title: "List board",
    description:
      "Return the PlotCoder board: the logline, the cast (roster) with ids, then every card with id, headline, change, color, rank, length, cast, and position, then groups and arrows with ids. Read this before moving, updating, or casting cards so you use real ids.",
    inputSchema: {},
  },
  async () => {
    const { state, live, boardId, base } = await readBoard();
    const { project } = await readProject();
    const board = boardById(project, boardId ?? project.activeBoardId);
    const which = board
      ? `"${board.name}" (${project.boards.findIndex((item) => item.id === board.id) + 1} of ${project.boards.length} in "${project.name}")`
      : "board";
    return ok(
      `PlotCoder ${which} (${door(live, base)})\n${summarize(state)}`,
      { ...state, revision: state.revision ? { name: state.revision.name, color: state.revision.color, since: state.revision.since } : null, notes: state.notes.map((note) => ({ ...note, eighths: noteEighths(note), measured: isMeasured(note) })) },
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
        ? `Logline set: "${state.logline}"${where(live)}.`
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
      `Mark cards as beats or scenes. ${wordSentence("beat")} Rank is carried by the card, not by where it sits. Do not volunteer an opinion about how many beats there should be.`,
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
      `${result?.length ?? 0} card(s) are now ${args.rank}${where(live)}. The board holds ${beats} beats and ${scenes} scenes. The rows are as they were; organize lays a row per beat.`,
      result,
    );
  },
);

server.registerTool(
  "set_length",
  {
    title: "Set card length",
    description:
      "Set how long cards run, in pages. An ordinary scene is about 1; a quick beat might be 0.25; a set piece might be 3 or 4. This is an estimate the writer owns — set it when you are told a length or when the card plainly describes one, and do not silently re-estimate a card someone has already sized. Pass pages \"unsized\" (or 0) to take a length away: the card claims nothing again and reads as about a page, the way a new card does.",
    inputSchema: {
      ids: z.array(z.string()).min(1),
      pages: z
        .union([pagesSchema, z.literal(0), z.literal("unsized"), z.null()])
        .describe('Pages; a fraction is fine. "unsized" (or 0) takes the length away.'),
    },
  },
  async (args) => {
    const unsizing = args.pages === "unsized" || args.pages === 0 || args.pages === null;
    const { state, changed, result, live } = await commit({
      type: "set_length",
      ids: args.ids,
      lengthEighths: unsizing ? null : toEighths(args.pages),
    });
    if (!changed) {
      const these = args.ids.length === 1 ? "the card is" : "those cards are";
      return ok(
        unsizing
          ? `Nothing to unsize: ${these} unsized already, or not on the board (list_board for the ids).`
          : `Nothing changed: ${these} at ${args.pages} page(s) already, or not on the board (list_board for the ids).`,
      );
    }
    // The runtime rides on the write's own tail (changeNote), so it is not said twice here.
    if (unsizing) {
      return ok(
        `${result.length} card(s) unsized${where(live)}: no length claimed, so each reads as about a page until someone sizes it, and list_board says "unsized".`,
        result,
      );
    }
    return ok(`${result.length} card(s) now run ${args.pages} page(s), the writer's estimate${where(live)}.`, result);
  },
);

server.registerTool(
  "set_target",
  {
    title: "Set target length",
    description:
      "Set the board's target script length, in pages or in minutes (a page runs about a minute): 120 for a feature, 30 for a half-hour, 60 for an hour drama. This is what the runtime estimate is measured against.",
    inputSchema: { pages: pagesSchema.optional(), minutes: z.number().positive().optional() },
  },
  async (args) => {
    if (args.pages === undefined && args.minutes === undefined) return ok("Say the target in pages or in minutes.");
    const { state, live } = await commit({
      type: "set_target",
      targetEighths: toEighths(args.pages ?? args.minutes),
    });
    return ok(
      `Target is ${formatPages(state.targetEighths)} pages${where(live)}. The cards add up to about ${formatPages(boardEighths(state))} — ${boardEighths(state) > state.targetEighths ? `${formatPages(boardEighths(state) - state.targetEighths)} over` : `${formatPages(state.targetEighths - boardEighths(state))} under`}.`,
      { targetEighths: state.targetEighths },
    );
  },
);

server.registerTool(
  "create_note",
  {
    title: "Create note",
    description:
      "Add a card (post-it) to the board. A card is one scene: a headline plus the change it causes. Provide both headline and change. Optionally set color, x/y position, rank ('beat' for one of the major turns — a beat is a whole card, the scene where the turn happens), pages (how long it runs; leave it out and the card is taken to be about a page), plants (true if this scene sets something up that must pay off later), location (where it happens, as the writer would say it — 'the piano shop', not 'INT. PIANO SHOP'), and characters (who is in the scene, by name; a name not in the cast yet is added to it — name an unnamed person by their role, 'Dana's mother', rather than leaving them off). The reply names the card's id.",
    inputSchema: {
      headline: z.string().min(1),
      change: z.string().optional().describe("What is different when the scene ends. Required, unless the card is born open — then it may wait, and the reading will not ask for it while the words stand."),
      color: colorSchema.optional(),
      rank: rankSchema.optional(),
      pages: pagesSchema.optional(),
      plants: z.boolean().optional(),
      after: z.string().optional().describe("Wire the new scene into the story after this card (id or headline): one call, one number under a lock. Needs follows arrows on the wall."),
      before: z.string().optional().describe("Or before this card (id or headline)."),
      location: z.string().optional(),
      when: z.string().optional().describe('When the scene happens, as the writer says it — "night", "day four, dawn" — printed after the place on the scene heading.'),
      open: z.string().optional().describe("The writer's words for what is not decided about this card — \"whether Tom knows\" — so the card is born open: the reading lists it and asks nothing else of it until the words are cleared."),
      characters: z.array(z.string().min(1)).optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    },
  },
  async (args) => {
    const { state } = await readBoard();
    const landing = args.x === undefined && args.y === undefined ? nextPlace(state) : { x: args.x, y: args.y };
    const names = (args.characters ?? []).map((name) => name.trim()).filter(Boolean);
    const added = [];
    // The card, anyone new in its cast, and the casting land as one change, so
    // one ⌘Z on the wall takes back the whole call and not just the cast.
    if (args.after && args.before) return ok("Say where: after one card, or before one, not both.");
    // A card needs its change line — unless it is born open (round eighteen, entry 13): the writer had no consequence yet.
    if (!(args.change ?? "").trim() && !(args.open ?? "").trim()) return ok("A card needs its change line: what is different when the scene ends. If the writer has not decided it, pass open with their words and the change line waits.");
    // The card beside which the new scene goes (round sixteen, entry 36): by id or headline, on this board.
    const besideKey = (args.after ?? args.before ?? "").trim();
    const beside = besideKey ? state.notes.find((note) => note.id === besideKey) ?? state.notes.find((note) => note.headline.trim().toLowerCase() === besideKey.toLowerCase()) ?? null : null;
    if (besideKey && !beside) return ok(`No card with id or headline "${besideKey}" on this board. Call list_board.`);
    const wallHasFollows = state.arrows.some((arrow) => arrow.kind !== "setup");
    let joinedGroup = null;
    const { value: result, live, state: after } = await commitAll(`create_note "${args.headline}"`, (step, current) => {
      let made = step({
        type: "create_note",
        headline: args.headline,
        change: (args.change ?? "").trim() || undefined,
        // One colour unless the agent chooses: a wall an agent builds in one go
        // would otherwise stripe through the cycle, and a writer reads a pattern
        // into it (round four, finding 17). The wall's own new-card button keeps
        // cycling for a person adding cards by hand.
        color: args.color ?? "yellow",
        rank: args.rank,
        lengthEighths: args.pages === undefined ? undefined : toEighths(args.pages),
        plants: args.plants,
        location: args.location,
        when: args.when,
        open: args.open,
        x: landing.x,
        y: landing.y,
      }).result;
      if (names.length && made?.id) {
        const ids = [];
        for (const name of names) {
          const wanted = name.toLowerCase();
          let person = current().characters.find((item) => item.id === name) ?? current().characters.find((item) => item.name.trim().toLowerCase() === wanted);
          if (!person) {
            person = step({ type: "add_character", name }).result;
            if (person) added.push(`${person.name} (${person.id})`);
          }
          if (person && !ids.includes(person.id)) ids.push(person.id);
        }
        if (ids.length) {
          const cast = step({ type: "set_cast", ids: [made.id], characterIds: ids });
          // The card as it is now, cast and all, so the reply's JSON agrees with its prose.
          made = cast.state.notes.find((note) => note.id === made.id) ?? made;
        }
      }
      // Wired into the story where the writer said, in the same frame.
      if (beside && made?.id && wallHasFollows) {
        joinedGroup = landBeside((command) => step(command), current, made.id, beside, Boolean(args.after));
        step({ type: "apply_poses", poses: organizePoses(current(), {}) });
        made = current().notes.find((note) => note.id === made.id) ?? made;
      }
      return made;
    });
    const castLine = names.length && result?.id ? ` Cast: ${names.join(", ")}${added.length ? ` (added to the roster: ${added.join(", ")})` : ""}.` : "";
    const landed = [
      result?.rank === "beat" ? "a beat" : "a scene",
      result?.lengthEighths === null ? "about a page (unsized: the writer's guess until set_length)" : `${formatPages(noteEighths(result))} ${formatPages(noteEighths(result)) === "1" ? "page" : "pages"}`,
      result?.color ? `${result.color} paper${args.color ? "" : once("paper", " (pass color to choose)")}` : null,
      result?.plants ? "corner folded" : null,
      result?.location ? `at ${result.location}` : `no place yet${once("place", " (location here, or set_location)")}`,
      result?.when ? `when: ${result.when}` : null,
      result?.open ? `open: "${result.open}" (listed, not asked about)` : null,
    ].filter(Boolean).join(", ");
    // Where it landed matters only until the tidy, so the reply says the rule once and never the coordinates (round fourteen, entry 11).
    const placed = beside
      ? wallHasFollows
        ? ` Wired ${args.after ? "after" : "before"} "${beside.headline}" in the story${joinedGroup ? `, in "${joinedGroup}"` : ""}, and the wall tidied.`
        : ` The wall has no follows arrows, so "${args.after ? "after" : "before"}" has no story to land in: it sits after the last card; create_arrow the sequence, then move_scene.`
      : args.x === undefined && args.y === undefined ? ` Placed after the last card in story order.${once("placed", " organize lays the wall out along the arrows.")}` : "";
    // Under a lock a new scene has a letter, not a number: say it, since the board is the only other place to learn it (round fourteen, entry 44).
    const numbered = after?.lock && result?.id ? ` Numbered ${sceneNumbers(storyOrder(after), after.lock).get(result.id)} (the numbers are locked; a new scene's letter is its place between locked ones now, worked out again from where it sits if it moves; the locked numbers never move).` : "";
    return ok(`Created card ${result?.id ?? ""}: ${landed}${where(live)}.${castLine}${placed}${numbered}`, result);
  },
);

server.registerTool(
  "update_note",
  {
    title: "Update note",
    description: "Change the headline, change line, location and/or when of an existing card by id. The reply says which field changed, from what to what.",
    inputSchema: {
      id: z.string(),
      headline: z.string().optional(),
      change: z.string().optional(),
      location: z.string().optional(),
      when: z.string().optional(),
    },
  },
  async (args) => {
    const prior = (await readBoard()).state.notes.find((note) => note.id === args.id);
    const { state, result, live, changed } = await commit({
      type: "update_note",
      id: args.id,
      headline: args.headline,
      change: args.change,
      location: args.location,
      when: args.when,
    });
    if (result === undefined) return ok(`No card with id ${args.id}.`);
    const fields = [["headline", "headline"], ["change", "change line"], ["location", "place"], ["when", "when"]]
      .filter(([field]) => args[field] !== undefined && (prior?.[field] ?? "") !== (result[field] ?? ""))
      .map(([field, word]) => `${word}: "${prior?.[field] ?? ""}" → "${result[field] ?? ""}"`);
    if (!changed || fields.length === 0) return ok(`Nothing changed on "${result.headline}": the card already read that way.`);
    const mark = state.revision && state.revision.snapshot?.[result.id] && (state.revision.snapshot[result.id].headline !== result.headline || state.revision.snapshot[result.id].change !== result.change) ? ` Marked changed in the ${state.revision.color} revision "${state.revision.name}".` : "";
    return ok(`Updated "${result.headline}" — ${fields.join("; ")}${where(live)}.${mark}`, result);
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
      "Remove a card from the board. Its arrows go with it and it leaves its group; a card wired into a chain — one follows in, one out — leaves the chain joined behind it. The reply names each arrow by its cards, the join, and what the group kept; undo brings all of it back.",
    inputSchema: { id: z.string() },
  },
  async (args) => {
    const { result, live } = await commit({ type: "delete_note", id: args.id });
    if (result === undefined) return ok(`No card with id ${args.id}.`);
    // Say what went with the card (round thirteen, entry 17).
    const arrows = result.arrows.length
      ? ` Took ${result.arrows.length === 1 ? "its arrow" : `its ${result.arrows.length} arrows`} with it: ${result.arrows.map((arrow) => `"${arrow.fromHeadline}" → "${arrow.toHeadline}" (${arrow.kind})`).join(", ")}.`
      : " No arrow touched it.";
    const groups = result.groups
      .map((group) => (group.dissolved ? ` Its group "${group.title}" dissolved: a frame needs two cards.` : ` Left its group "${group.title}", which keeps ${group.remaining} card${group.remaining === 1 ? "" : "s"}.`))
      .join("");
    const joined = result.joined ? ` The chain is joined behind it: "${result.joined.fromHeadline}" → "${result.joined.toHeadline}" (follows).` : "";
    // The fold and where it paid off went with the card (round fifteen, entry 17).
    const fold = result.plants
      ? ` Its folded corner went with it${result.payoffBoardId ? ` — it paid off later, on "${(await readProject()).project.boards.find((meta) => meta.id === result.payoffBoardId)?.name ?? result.payoffBoardId}"` : ""}; nothing on the wall plants that now.`
      : "";
    return ok(`Deleted "${result.headline}"${where(live)}.${arrows}${joined}${groups}${fold}`, result);
  },
);

// --- Read the wall ----------------------------------------------------

server.registerTool(
  "read_wall",
  {
    title: "Read the wall",
    description:
      "Read the board back: the beats in wall order (rows top to bottom, cards left to right), the pages of scenes between consecutive beats with the cards in each, every setup with the distance to its payoff, and the questions the wall raises — no beat marked yet; a run out of proportion with the others; beats back to back with nothing between them (a chain of them is one question); a card with a placeholder headline or no change line; a card no arrow touches; two headlines that read like the same scene; a group too long to be one sequence; a person in the cast on no card; a person gone for more than a third of the story and ten pages; a payoff before its setup on the wall; a folded card no setup arrow pays off; a setup arrow leaving a card that is not folded; a card with nobody in it once the wall has a cast; cards that say no place once any card has one. These are questions, not fixes: put them to the writer and do not act on them unasked. A question the writer answers with \"leave it\" is left with leave_question and listed under \"left, for now\" instead, until it would read differently. It says nothing about how many beats there should be, and neither should you. The prose carries every id; PLOTCODER_JSON=1 in the server's environment adds the same reading as JSON after it, for a program.",
    inputSchema: {},
  },
  async () => {
    const { state, live, base, boardId: readBoardId } = await readBoard();
    const { project: projectForRead } = await readProject();
    const readBoardMeta = boardById(projectForRead, readBoardId ?? projectForRead.activeBoardId);
    const { boards: boardsForRead } = await readProject();
    const readId = readBoardId ?? projectForRead.activeBoardId;
    const boardsNow = { ...boardsForRead, [readId]: state };
    const elsewhereForRead = castElsewhere(projectForRead, boardsForRead, readId);
    const reading = readWall(state, { elsewhere: Object.keys(elsewhereForRead), laterBoards: laterBoards(projectForRead, boardsNow), paidBy: landingsOn(projectForRead, boardsNow, readId).paid });
    lastReading = { findings: reading.findings };
    sinceRead.length = 0;
    const runs = describeRuns(reading, state).map((line, index) => {
      const ids = reading.runs[index]?.ids ?? [];
      return ids.length ? `${line} — ${ids.map((id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`).join(", ")}` : line;
    });
    // No blank lines: ok() splits prose from payload on the first one.
    const written = state.notes.filter((note) => isMeasured(note)).length;
    const lines = [
      `PlotCoder wall (${door(live, base)})`,
      ...(state.lock ? [`numbers: locked since ${String(state.lock.at).slice(0, 10)}; read_pages shows each scene's number`] : []),
      `board: "${readBoardMeta?.name ?? "?"}"${projectForRead.boards.length > 1 ? ` — board ${projectForRead.boards.findIndex((meta) => meta.id === readBoardMeta?.id) + 1} of ${projectForRead.boards.length} in the project "${projectForRead.name}"; open_board reads another` : ""}`,
      `logline: ${state.logline ? `"${state.logline}"` : "(none yet)"}`,
      "the cast and the places are list_board's, not the reading's",
      state.targetEighths === DEFAULT_TARGET_EIGHTHS
        ? `runtime: about ${formatPages(boardEighths(state))} pages; no target set (set_target)`
        : `runtime: about ${formatPages(boardEighths(state))} pages of a ${formatPages(state.targetEighths)}-page target — ${boardEighths(state) > state.targetEighths ? `${formatPages(boardEighths(state) - state.targetEighths)} over` : boardEighths(state) < state.targetEighths ? `${formatPages(state.targetEighths - boardEighths(state))} under` : "on it"} (the number to use until the scenes are written; page_count is the script so far)`,
      `groups: ${
        state.groups.length
          ? state.groups
              .map((group) => {
                const members = state.notes.filter((note) => group.noteIds.includes(note.id));
                const act = /^act\b/i.test((group.title ?? "").trim());
                return `"${group.title || "(untitled)"}" — ${members.length} card(s), about ${formatPages(members.reduce((sum, note) => sum + noteEighths(note), 0))} pages${act ? ", read as an act, so its length is not questioned" : ", read as a sequence"}`;
              })
              .join("; ")
          : "(none)"
      }`,
      `pages: ${written === 0 ? "all estimates — no scene is written yet, so every card is the writer's guess" : written === state.notes.length ? "measured — every scene is written" : `estimates — ${written} of ${state.notes.length} cards are written${written <= 5 ? ` (${state.notes.filter((note) => isMeasured(note)).map((note) => `"${note.headline}"`).join(", ")})` : ""}, the rest are guesses`}`,
      // A wall with cards and no follows arrows has no story order yet; say so rather than read the rows as one (round seventeen, entries 10, 11).
      `story order: ${state.notes.length > 1 && !state.arrows.some((arrow) => arrow.kind !== "setup") ? "unset — no follows arrows, so the rows stand in for it; create_arrow the sequence and the reading, the numbers and every export follow the arrows" : "the follows arrows, and the rows where they say nothing"}`,
      `beats in wall order: ${
        reading.beats.length
          ? reading.beats.map((beat) => `"${beat.headline}"`).join(", ")
          : "(none marked)"
      }`,
      `runs between beats (the scenes between two turns; a beat's own pages are in no run${written < state.notes.length ? "; pages are estimates" : ""}):`,
      ...(runs.length ? runs.map((line) => `  - ${line}`) : ["  (none)"]),
      `setups and payoffs${written < state.notes.length ? " (distances in estimated pages)" : ""}:`,
      ...(reading.setups.length
        ? describeSetups(reading, state).map((line) => `  - ${line}`)
        : [reading.paidBy.length ? "  (no setup arrow on this board; what pays off a fold of another board is listed below)" : "  (no arrow is marked as a setup)"]),
      ...reading.later.map((item) => `  - "${state.notes.find((note) => note.id === item.id)?.headline ?? item.id}" is folded and pays off later, on "${boardById(projectForRead, item.boardId)?.name ?? item.boardId}"${item.noteId ? `, at ${episodeLabel(projectForRead, boardsNow, item.boardId, item.noteId)} "${boardsNow[item.boardId]?.notes?.find((note) => note.id === item.noteId)?.headline ?? item.noteId}"` : " — no scene there claims it yet"}`),
      ...reading.paidBy.map((item) => `  - "${state.notes.find((note) => note.id === item.id)?.headline ?? item.id}" pays off "${item.fromHeadline}" from "${item.fromBoardName}" (${episodeLabel(projectForRead, boardsNow, item.fromBoardId, item.fromNoteId)}), one board earlier`),
      ...(reading.open.length
        ? ["open, by the writer's word (listed, not asked about while the words stand; set_open with \"\" closes):", ...reading.open.map((item) => `  - "${state.notes.find((note) => note.id === item.id)?.headline ?? item.id}" — ${item.words}${item.hides.length ? ` (would be asked, closed: ${item.hides.map((kind) => CHECK_WORDS[kind] ?? kind).join("; ")})` : ""}`)]
        : []),
      "questions the wall raises:",
      ...(reading.findings.length
        ? reading.findings.map((finding) => `  - [${finding.kind}] ${finding.text}${finding.ids.length ? ` (ids: ${finding.ids.join(", ")})` : ""}`)
        : [reading.left.length ? "  (none the writer has not left)" : "  (none that this reading can see)"]),
      ...(reading.left.length
        ? [
            "left, for now (the writer's word; kept until the question would read differently, and ask_again brings one back):",
            ...reading.left.map((finding) => `  - [${finding.kind}] ${finding.text} (left ${String(finding.since).slice(0, 10)}${finding.why ? `, "${finding.why}"` : ""}${finding.ids.length ? `; ids: ${finding.ids.join(", ")}` : ""})`),
          ]
        : []),
      `checks: ${CHECKS.length} run — ${(() => {
        const asked = reading.findings;
        const held = reading.left.length ? `, ${reading.left.length} left by the writer` : "";
        if (asked.length === 0) return `asking nothing${held}`;
        const counts = new Map();
        for (const finding of asked) counts.set(finding.kind, (counts.get(finding.kind) ?? 0) + 1);
        return `asking ${asked.length} question${asked.length === 1 ? "" : "s"} of ${counts.size} kind${counts.size === 1 ? "" : "s"}: ${[...counts.entries()].map(([kind, n]) => (n > 1 ? `${kind} ×${n}` : kind)).join(", ")}${held}`;
      })()}${reading.left.length ? `; left by the writer, so not clean: ${[...new Set(reading.left.map((finding) => finding.kind))].map((kind) => `[${kind}]`).join(" ")}` : ""}${reading.open.length ? `; ${reading.open.length} card${reading.open.length === 1 ? "" : "s"} open by the writer's word, not asked` : ""}; checked and clean: ${CHECKS.filter((kind) => !reading.findings.some((finding) => finding.kind === kind) && !reading.left.some((finding) => finding.kind === kind)).map((kind) => {
        if (kind === "unlinked" && state.arrows.length === 0) return "no card without an arrow (not asked until half the cards are wired: no arrows yet)";
        if (kind === "unlinked") {
          const linked = new Set(state.arrows.flatMap((arrow) => [arrow.from, arrow.to]));
          if (linked.size * 2 < state.notes.length) return `no card without an arrow (not asked until half the cards are wired: ${linked.size} of ${state.notes.length} are)`;
        }
        if (kind === "unplaced" && !state.notes.some((note) => (note.location ?? "").trim())) return "no card without a place (not asked: no card placed yet)";
        if (kind === "sequence" && state.groups.length === 0) return "no group too long for one sequence (not asked: no groups)";
        // A kind clean only because an open card is not asked says so (round eighteen, entry 18).
        const hiddenBy = reading.open.filter((item) => item.hides.includes(kind)).length;
        if (hiddenBy) return `${CHECK_WORDS[kind]} (except ${hiddenBy} open card${hiddenBy === 1 ? "" : "s"}, not asked)`;
        return CHECK_WORDS[kind];
      }).join("; ") || "(nothing — every check found something)"}`,
    ];
    if (isSampleWall(state)) lines.unshift(SAMPLE_NOTE);
    return ok(lines.join("\n"), { ...reading, sample: isSampleWall(state) });
  },
);

// --- Leaving a question (R53) ----------------------------------------

const sameList = (a, b) => a.length === b.length && a.every((id, index) => id === b[index]);

server.registerTool(
  "leave_question",
  {
    title: "Leave a question, for now",
    description:
      "Write the writer's word on a question the wall asks — \"leave it\" — so the reading stops asking it. Pass the question's kind as read_wall names it (sag, empty, unpaid, …) and, when that kind is asked more than once, its ids as read_wall lists them; `why` keeps the writer's reason with it, so the next reader sees why. Several at once: `questions`, a list of {kind, ids, why}, one step. A leave answers the reading in front of you: edits change the questions, so make the writer's changes first, read_wall, then leave what they still want left — a question that changed or went since the last reading is refused, with what it was. The reply says what the wall still asks, so no read after is needed. The wall keeps a left question and asks it again on its own the moment it would read differently — a card in it changes, a page moves, the median shifts — so a left question is never a dismissal; ask_again brings one back now. Only on the writer's word: never leave a question unasked.",
    inputSchema: {
      kind: z.string().optional(),
      ids: z.array(z.string()).optional(),
      why: z.string().optional(),
      questions: z.array(z.object({ kind: z.string().min(1), ids: z.array(z.string()).optional(), why: z.string().optional() })).optional(),
    },
  },
  async (args) => {
    const wanted = args.questions?.length ? args.questions : args.kind ? [{ kind: args.kind, ids: args.ids, why: args.why }] : [];
    if (!wanted.length) return ok("Say which question: its kind as read_wall names it (and ids when that kind is asked more than once), or a list under questions.");
    const { state, boardId: leaveBoardId } = await readBoard();
    const readOptions_ = readOptions(leaveBoardId, state);
    const reading = readWall(state, readOptions_);
    const replies = [];
    const toLeave = [];
    for (const want of wanted) {
      const already = reading.left.filter((finding) => finding.kind === want.kind && (!want.ids || sameList(finding.ids, want.ids)));
      const matches = reading.findings.filter((finding) => finding.kind === want.kind && (!want.ids || sameList(finding.ids, want.ids)));
      if (matches.length === 0) {
        if (already.length) { replies.push(`Already left: [${want.kind}] ${already[0].text} It stays left until the question would read differently; ask_again brings it back.`); continue; }
        // The reading the agent was answering, when the last read_wall had this question (round thirteen, entry 19).
        const earlier = lastReading?.findings.find((finding) => finding.kind === want.kind && (!want.ids || sameList(finding.ids, want.ids)));
        const now = reading.findings.filter((finding) => finding.kind === want.kind);
        if (earlier) {
          const since = sinceRead.length
            ? `${sinceRead.length} change${sinceRead.length === 1 ? "" : "s"} landed since (${[...new Set(sinceRead)].join(", ")})`
            : "the wall changed elsewhere since";
          const state_ = now.length
            ? `the wall now asks ${now.length === 1 ? "it differently" : `${now.length} questions of that kind`}: ${now.map((finding) => `${finding.text} (ids: ${finding.ids.join(", ")})`).join("; ")}`
            : "the wall no longer asks it — the cards answered it";
          replies.push(`Not left. When you last read the wall it asked [${earlier.kind}] ${earlier.text}${earlier.ids.length ? ` (ids: ${earlier.ids.join(", ")})` : ""}; ${since}, and ${state_}. A leave answers the reading in front of you: make the writer's edits first, read_wall, then leave what they still want left.`);
          continue;
        }
        replies.push(`The wall is not asking a question of kind "${want.kind}"${want.ids ? ` about ids ${want.ids.join(", ")}` : ""}. read_wall lists the questions it asks now, each with its kind and ids.${sinceRead.length ? ` ${sinceRead.length} change(s) landed since the last read_wall, so read it again first.` : ""}`);
        continue;
      }
      if (matches.length > 1) {
        replies.push(`The wall asks ${matches.length} questions of kind "${want.kind}"; pass ids to say which:\n${matches.map((finding) => `  - ${finding.text} (ids: ${finding.ids.join(", ")})`).join("\n")}`);
        continue;
      }
      toLeave.push({ finding: matches[0], why: (want.why ?? "").trim() });
    }
    let live = null;
    let after = state;
    if (toLeave.length) {
      const out = await commitAll(`leave_question ×${toLeave.length}`, (step) => {
        for (const item of toLeave) step({ type: "leave_question", kind: item.finding.kind, ids: item.finding.ids, text: item.finding.text, why: item.why });
      });
      live = out.live;
      after = out.state;
      for (const item of toLeave) replies.push(`Left, for now: [${item.finding.kind}] ${item.finding.text}${item.why ? ` — "${item.why}"` : ""}`);
    }
    const still = readWall(after, readOptions(leaveBoardId, after)).findings;
    const tail = toLeave.length
      ? `${where(live)} ${once("leave-rule", "The wall keeps the writer's word and asks a left question again on its own when it would read differently; ask_again brings one back now. ")}The wall still asks ${still.length === 0 ? "nothing" : `${still.length}: ${still.map((finding) => `[${finding.kind}] ${finding.text}`).join(" ")}`}.`
      : "";
    return ok(`${replies.join("\n")}${tail}`, toLeave.map((item) => ({ kind: item.finding.kind, ids: item.finding.ids, why: item.why })));
  },
);

server.registerTool(
  "ask_again",
  {
    title: "Ask a left question again",
    description: "Take back a left question by its kind (and ids, when that kind was left more than once), so the wall asks it again now. Without ids, every left question of that kind comes back.",
    inputSchema: { kind: z.string().min(1), ids: z.array(z.string()).optional() },
  },
  async (args) => {
    const { state } = await readBoard();
    const held = (state.left ?? []).filter((item) => item.kind === args.kind && (!args.ids || sameList(item.ids, args.ids)));
    if (held.length === 0) return ok(`Nothing of kind "${args.kind}"${args.ids ? ` about ids ${args.ids.join(", ")}` : ""} is left. read_wall lists what is, under "left, for now".`);
    const { result, live } = await commit({ type: "ask_again", kind: args.kind, ids: args.ids });
    const again = await readBoard();
    const reading = readWall(again.state, readOptions(again.boardId, again.state));
    const back = reading.findings.filter((finding) => held.some((item) => item.kind === finding.kind && sameList(item.ids, finding.ids)));
    return ok(
      `Asked again${where(live)}: ${held.length} question${held.length === 1 ? "" : "s"} of kind "${args.kind}" ${held.length === 1 ? "is" : "are"} no longer left${back.length ? ` — the wall asks ${back.length === 1 ? "it" : `${back.length} of them`} now: ${back.map((finding) => finding.text).join(" ")}` : " — and the wall no longer asks it; the question had already changed"}.`,
      result,
    );
  },
);

/**
 * Land a card beside another in the story (R56): between the target and what
 * followed it (after) or what led to it (before), rewiring the follows arrows,
 * and into the target's group so the tidy keeps the act as a block. Shared by
 * move_scene and by create_note with after/before (round sixteen, entry 36).
 */
function landBeside(run, current, cardId, target, after) {
  const isFollows = (arrow) => arrow.kind !== "setup";
  const mid = current();
  if (after) {
    for (const arrow of mid.arrows.filter((item) => isFollows(item) && item.from === target.id && item.to !== cardId)) {
      run({ type: "delete_arrow", id: arrow.id });
      run({ type: "create_arrow", from: cardId, to: arrow.to, kind: "follows" });
    }
    run({ type: "create_arrow", from: target.id, to: cardId, kind: "follows" });
  } else {
    for (const arrow of mid.arrows.filter((item) => isFollows(item) && item.to === target.id && item.from !== cardId)) {
      run({ type: "delete_arrow", id: arrow.id });
      run({ type: "create_arrow", from: arrow.from, to: cardId, kind: "follows" });
    }
    run({ type: "create_arrow", from: cardId, to: target.id, kind: "follows" });
  }
  const targetGroup = current().groups.find((group) => group.noteIds.includes(target.id));
  if (targetGroup && !targetGroup.noteIds.includes(cardId)) {
    run({ type: "add_to_group", id: targetGroup.id, noteIds: [cardId] });
    return targetGroup.title || "an untitled group";
  }
  return null;
}

/**
 * A scene moves to another board of the project (round fifteen, entry 16: a
 * writer's "the shim should open episode two" had no tool, and the way round
 * was a delete and a recreate by hand). Two frames, one per board: the card
 * leaves the open board with everything a delete takes, and lands on the
 * target with its own record — cast, place, when, rank, length, text, fold —
 * wired after or before a card there, or at the head of that board's story.
 */
async function moveAcrossBoards(args, target, open, held) {
  if (args.after && args.before) return ok("Say where: after one card's id, or before one, not both.");
  const card = open.state.notes.find((note) => note.id === args.id);
  if (!card) return ok(`No card with id ${args.id}. Call list_board.`);
  const fromMeta = boardById(held.project, open.boardId ?? held.project.activeBoardId);
  const targetState = isBoardState(held.boards[target.id]) ? normalizeState(held.boards[target.id]) : emptyState();
  const anchorId = args.after ?? args.before;
  const anchor = anchorId ? targetState.notes.find((note) => note.id === anchorId) : null;
  if (anchorId && !anchor) return ok(`No card with id ${anchorId} on "${target.name}". open_board there and list_board for its ids, or leave after and before out to land at the head of its story.`);
  // Leave: one frame on the board it is on.
  let taken = null;
  await commitAll(`move_scene "${card.headline}" to "${target.name}" (leave)`, (step) => {
    taken = step({ type: "delete_note", id: card.id }).result;
  });
  // Open the board it is going to, everywhere.
  const now = await readProject();
  await openBoardEverywhere(now.project, now.boards, now.rev, now.base, target.id);
  // Land: one frame there.
  const isFollows = (arrow) => arrow.kind !== "setup";
  let landedId = card.id;
  let joinedGroup = null;
  let headOf = null;
  let forgotLater = false;
  const { state: final, live } = await commitAll(`move_scene "${card.headline}" to "${target.name}" (land)`, (step, current) => {
    const here = current();
    landedId = here.notes.some((note) => note.id === card.id) ? newId() : card.id;
    step({
      type: "create_note",
      id: landedId,
      headline: card.headline,
      change: card.change,
      color: card.color,
      rank: card.rank,
      lengthEighths: card.lengthEighths,
      characterIds: card.characterIds,
      plants: card.plants,
      location: card.location,
      when: card.when,
      text: card.text,
      ...nextPlace(here),
    });
    if (card.plants && card.payoffBoardId && card.payoffBoardId !== target.id) step({ type: "set_payoff_board", ids: [landedId], boardId: card.payoffBoardId });
    if (card.plants && card.payoffBoardId === target.id) forgotLater = true;
    if (anchor) {
      const mid = current();
      if (args.after) {
        for (const arrow of mid.arrows.filter((item) => isFollows(item) && item.from === anchor.id)) {
          step({ type: "delete_arrow", id: arrow.id });
          step({ type: "create_arrow", from: landedId, to: arrow.to, kind: "follows" });
        }
        step({ type: "create_arrow", from: anchor.id, to: landedId, kind: "follows" });
      } else {
        for (const arrow of mid.arrows.filter((item) => isFollows(item) && item.to === anchor.id)) {
          step({ type: "delete_arrow", id: arrow.id });
          step({ type: "create_arrow", from: arrow.from, to: landedId, kind: "follows" });
        }
        step({ type: "create_arrow", from: landedId, to: anchor.id, kind: "follows" });
      }
      const anchorGroup = current().groups.find((group) => group.noteIds.includes(anchor.id));
      if (anchorGroup) {
        step({ type: "add_to_group", id: anchorGroup.id, noteIds: [landedId] });
        joinedGroup = anchorGroup.title || "an untitled group";
      }
    } else {
      const head = storyOrder(here)[0];
      if (head && here.arrows.some(isFollows)) {
        step({ type: "create_arrow", from: landedId, to: head.id, kind: "follows" });
        headOf = head.headline;
      }
    }
    step({ type: "apply_poses", poses: organizePoses(current(), {}) });
  });
  const order = storyOrder(final);
  // "Left behind" read as "kept" (round sixteen, entry 22): the arrows are dropped, and the reply says so.
  const arrows = taken?.arrows?.length
    ? ` Dropped on "${fromMeta.name}", because an arrow joins two cards of one wall: ${taken.arrows.map((arrow) => `"${arrow.fromHeadline}" → "${arrow.toHeadline}" (${arrow.kind}${arrow.kind === "setup" && arrow.to === card.id ? "; that fold is unpaid again" : ""})`).join(", ")}${taken.joined ? `; the chain there is joined behind it, "${taken.joined.fromHeadline}" → "${taken.joined.toHeadline}"` : ""}.`
    : ` No arrow touched it on "${fromMeta.name}".`;
  const groups = (taken?.groups ?? []).map((group) => (group.dissolved ? ` Its group "${group.title}" there dissolved: a frame needs two cards.` : ` It left its group "${group.title}" there, which keeps ${group.remaining} card${group.remaining === 1 ? "" : "s"}.`)).join("");
  const landed = anchor
    ? `${args.after ? "after" : "before"} "${anchor.headline}", with the follows arrows rewired around it${joinedGroup ? `, in "${joinedGroup}"` : `; "${anchor.headline}" is in no group, so this card joined none`}`
    : headOf ? `at the head of the story, with a follows arrow drawn from it to "${headOf}"; it is in no group` : "as the only card wired to nothing yet";
  const fold = card.plants ? (forgotLater ? " It paid off later on this board, so that mark is forgotten: draw the setup arrow here." : " Its folded corner came with it; a setup arrow does not cross boards, so draw the payoff here if it is here.") : "";
  return ok(
    `Moved "${card.headline}" from "${fromMeta.name}" to "${target.name}", with its cast, place, when, rank, length${card.text ? ", text" : ""}, colour${card.plants ? " and folded corner" : ""}; it is card ${landedId} there${where(live)}.${arrows}${groups} It landed ${landed}, and the wall was tidied.${fold} Story order on "${target.name}" now: ${order.map((note, index) => `${index + 1}. ${note.headline}`).join(", ")}. "${target.name}" is the open board now. Undo is per board: undo here takes back the landing; open_board "${fromMeta.name}" and undo takes back the leaving.`,
    { id: landedId, board: target.id, order: order.map((note) => note.id) },
  );
}

server.registerTool(
  "move_scene",
  {
    title: "Move a scene in the story",
    description:
      "Move a card to another place in the story order — after one card, or before one — by rewiring its follows arrows and tidying the wall along them, as one step that undo takes back whole. The story order is the follows arrows: the card leaves its place (what pointed at it now points at what it pointed at) and lands between the target and what followed it. A person does this by dragging in the outline. Needs a wall with follows arrows; on a wall without any, create_arrow the sequence first, or move_note by position. To another board of the project: pass board (name, id or number from list_boards) and, optionally, after or before a card there; with neither the card lands at the head of that board's story. Across boards the card keeps its cast, place, when, rank, length, text and fold; its arrows stay behind, and that board is then the open one. Undo is per board: one step there, one on the board it left.",
    inputSchema: { id: z.string(), after: z.string().optional(), before: z.string().optional(), board: z.union([z.string().min(1), z.number()]).optional() },
  },
  async (args) => {
    if (args.board !== undefined) {
      const held = await readProject();
      const target = findBoard(held.project, String(args.board));
      if (!target) return ok(`No board matches "${args.board}". Call list_boards for the real ones.`);
      const open = await readBoard();
      if (target.id !== (open.boardId ?? held.project.activeBoardId)) return moveAcrossBoards(args, target, open, held);
    }
    if (!args.after === !args.before) return ok("Say where: after one card's id, or before one, not both.");
    const { state } = await readBoard();
    const find = (id) => state.notes.find((note) => note.id === id);
    const card = find(args.id);
    const target = find(args.after ?? args.before);
    if (!card) return ok(`No card with id ${args.id}. Call list_board.`);
    if (!target) return ok(`No card with id ${args.after ?? args.before}. Call list_board.`);
    if (card.id === target.id) return ok("A card cannot be moved next to itself.");
    const isFollows = (arrow) => arrow.kind !== "setup";
    if (!state.arrows.some(isFollows)) {
      return ok("The wall has no follows arrows, so there is no story order to move within: create_arrow the sequence first, or move_note the card by position.");
    }
    let removed = 0;
    let drawn = 0;
    let joinedGroup = null;
    // The whole move — its dozen arrows and the tidy — as one change: one frame on
    // the bridge, one ⌘Z on the wall, one step for undo here.
    const { state: final, live } = await commitAll(`move_scene "${card.headline}"`, (step, current) => {
      const run = (command) => {
        const done = step(command);
        if (done.changed) {
          if (command.type === "delete_arrow") removed += 1;
          if (command.type === "create_arrow") drawn += 1;
        }
        return done;
      };
      // Leave: what pointed at the card points at what the card pointed at.
      const ins = state.arrows.filter((arrow) => isFollows(arrow) && arrow.to === card.id);
      const outs = state.arrows.filter((arrow) => isFollows(arrow) && arrow.from === card.id);
      for (const arrow of [...ins, ...outs]) run({ type: "delete_arrow", id: arrow.id });
      for (const before of ins) for (const after of outs) if (before.from !== after.to) run({ type: "create_arrow", from: before.from, to: after.to, kind: "follows" });
      // Land: between the target and what followed it (or what led to it), and
      // into the act it lands beside (round fourteen, entry 38).
      joinedGroup = landBeside(run, current, card.id, target, Boolean(args.after));
      run({ type: "apply_poses", poses: organizePoses(current(), {}) });
    });
    const order = storyOrder(final);
    // Under a lock the letter is worked out again from where the scene landed (round sixteen, entry 35).
    const lockedNow = final.lock ? ` Under the lock it is now ${sceneNumbers(order, final.lock).get(card.id)}; the locked numbers never move, and an added scene's letter is worked out from where it sits.` : "";
    const group = final.groups.find((item) => item.noteIds.includes(card.id));
    const groupLine = joinedGroup
      ? ` It joined "${joinedGroup}", the group it landed in, so the tidy keeps it with the act.`
      : group ? ` It is still in "${group.title || "an untitled group"}"; a frame does not follow a move, so say if the act or sequence should change.` : "";
    return ok(
      `Moved "${card.headline}" to ${args.after ? "after" : "before"} "${target.headline}": ${removed} follows arrow(s) removed, ${drawn} drawn${final.arrows.some((arrow) => arrow.kind === "setup") ? ", setup arrows untouched" : ""}, the wall tidied along them${where(live)}. Story order now: ${order.map((note, index) => `${index + 1}. ${note.headline}`).join(", ")}.${groupLine}${lockedNow} One undo takes the whole move back.`,
      { order: order.map((note) => note.id) },
    );
  },
);

server.registerTool(
  "organize",
  {
    title: "Organize the wall",
    description:
      "Tidy the wall along the arrows. Cards are ordered by their 'follows' arrows (a card comes after everything that points at it), then by reading order. With beats on the wall, each beat starts a row and the scenes that follow it fill the row to its right, wrapping under themselves when a run is long; with no beats yet, rows wrap five cards wide. A group's cards keep their rows, so a group that spans beats spans rows. Pass noteIds to tidy only those cards, from their own top-left. Undoable from the wall.",
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
    // Rows top to bottom; a row whose first card is not a beat is the row
    // above wrapping under, and the reply names whose row it is.
    const byRow = new Map();
    for (const pose of poses) byRow.set(pose.y, [...(byRow.get(pose.y) ?? []), pose]);
    const wrappedUnder = [];
    let currentBeat = null;
    let opening = 0;
    for (const y of [...byRow.keys()].sort((a, b) => a - b)) {
      const row = byRow.get(y).sort((a, b) => a.x - b.x);
      const note = state.notes.find((item) => item.id === row[0].id);
      if (note?.rank === "beat") currentBeat = note;
      else if (!currentBeat) opening += row.length;
      else if (note && !wrappedUnder.some((item) => item.beat === currentBeat)) wrappedUnder.push({ beat: currentBeat, first: note });
    }
    const shape = beats
      ? `${opening ? `an opening row of ${opening} card(s) before the first beat, then ` : ""}${beats} row(s), one per beat${wrappedUnder.length ? `; ${wrappedUnder.map((item) => `the row of "${item.beat.headline}" wraps under from "${item.first.headline}", indented under the row's first scene, never under the beat`).join(", ")}` : ""}`
      : `${rows} row(s) five cards wide — no beats yet, so nothing sets the rows; set_rank the turns and organize again for a row per beat`;
    return ok(`Organized ${poses.length} card(s) along the arrows into ${shape}${where(live)}.`, poses);
  },
);

/** One of the writer's own structures, by id or name. */
function findStructure(project, key) {
  const wanted = key.trim().toLowerCase();
  const own = project.structures ?? [];
  return own.find((structure) => structure.id === key) ?? own.find((structure) => structure.name.trim().toLowerCase() === wanted) ?? null;
}

server.registerTool(
  "apply_template",
  {
    title: "Start from a structure",
    description:
      "Lay a structure's named beats on the wall as beat cards, prompts on their change lines, in one row above the cards already there (or at the top of an empty wall). One undo step. Structures: " +
      TEMPLATES.map((template) => `${template.id} (${template.name}, ${template.beats.length} beats — ${template.blurb})`).join("; ") +
      "; or one of the writer's own, by name or id (list_structures). The house method, turns, is the default. Ask the writer which structure before applying one; nothing remembers the template afterwards, there are only cards.",
    inputSchema: { template: z.string().min(1) },
  },
  async (args) => {
    const { project } = await readProject();
    const own = findStructure(project, args.template);
    const command = own
      ? { type: "apply_template", template: own.id, beats: own.beats }
      : { type: "apply_template", template: args.template };
    const { changed, result, live } = await commit(command);
    if (!changed) return ok(`No structure called ${args.template}. Call list_structures for the real ones.`);
    const names = result.map((note) => note.headline).join(", ");
    return ok(`Laid out ${result.length} beats${own ? ` of "${own.name}"` : ""}${where(live)}: ${names}.`, result);
  },
);

// The writer's own structures: saved from a wall's
// beats onto the project, laid on another wall with apply_template.
server.registerTool(
  "list_structures",
  {
    title: "List the structures",
    description: "The structures apply_template can lay on a wall: the built-in ones, and the writer's own saved from their walls (save_structure), each with its beats. compare_structure sets one beside this wall's beats without laying anything.",
    inputSchema: {},
  },
  async () => {
    const { project } = await readProject();
    const own = project.structures ?? [];
    const lines = [
      `the writer's own: ${own.length}`,
      ...own.map((structure) => `  - ${structure.id} — "${structure.name}" (${structure.beats.length} beats: ${structure.beats.map((beat) => `${beat.name} at ${Math.round(beat.at * 100)}%`).join(", ")})`),
      `built in: ${TEMPLATES.length}`,
      ...TEMPLATES.map((template) => `  - ${template.id} — "${template.name}" (${template.beats.length} beats: ${template.beats.map((beat) => `${beat.name} at ${Math.round(beat.at * 100)}%`).join(", ")})`),
      "compare_structure sets one of these beside this wall's beats, page by page, and lays nothing",
    ];
    return ok(lines.join("\n"), { builtIn: TEMPLATES.map((template) => ({ id: template.id, name: template.name, beats: template.beats })), own });
  },
);

server.registerTool(
  "compare_structure",
  {
    title: "A structure beside the wall",
    description:
      "Set a structure beside this wall's beats without laying anything: each of the structure's beats with the page it falls near on this board's target, and the nearest of the wall's own beats within six pages — one to one, in order — with how far off it is (here, near, N pp early or late). A reading, like read_wall: nothing moves and no card is made. Takes a built-in structure by id (turns, three-acts, eight-sequences, fifteen-beats, story-circle) or one of the writer's own by name or id; turns is the default.",
    inputSchema: { structure: z.string().optional() },
  },
  async (args) => {
    const { state } = await readBoard();
    const { project } = await readProject();
    const wanted = (args.structure ?? "turns").trim().toLowerCase();
    const own = project.structures ?? [];
    const chosen =
      TEMPLATES.find((template) => template.id === wanted || template.name.toLowerCase() === wanted) ??
      own.find((structure) => structure.id === wanted || structure.name.toLowerCase() === wanted);
    if (!chosen) return ok(`No structure called "${args.structure}". list_structures names the built-in five and the writer's own.`);
    const comparison = compareStructure(state, chosen.beats);
    const beats = state.notes.filter((note) => note.rank === "beat").length;
    const allMeasured = state.notes.length > 0 && state.notes.every((note) => isMeasured(note));
    const short = state.targetEighths > 0 && boardEighths(state) * 2 < state.targetEighths;
    const lines = [
      `"${chosen.name}" beside this wall's ${beats} beat${beats === 1 ? "" : "s"}, of ${formatPages(state.targetEighths)} pages (the story so far runs to p. ${comparison.soFar}${allMeasured ? ", measured" : ", an estimate: unsized cards read as a page each"}); a match is the nearest of the wall's beats within ${MATCH_PAGES} pages, one to one and in order:`,
      ...describeComparison(comparison).map((line) => `  - ${line}`),
      comparison.unmatched.length
        ? `beats of the wall no beat of the structure answers: ${comparison.unmatched.map((beat) => `"${beat.headline}" (p. ${beat.page})`).join(", ")}`
        : "every beat of the wall answers one of the structure's",
      ...(short ? [`the wall runs to less than half its target, so its beats sit early and the ${MATCH_PAGES}-page window pairs them with the structure's first beats by arithmetic; the pairing says more once the cards are sized or written, and whether a turn is missing is the writer's call, not this reading's`] : []),
      beats === 0 ? "No card on this board is marked as a beat (set_rank), so there is nothing to compare; apply_template lays the structure's beats to fill." : "Nothing moved and nothing was made: this is a reading. apply_template lays the beats as cards when the writer wants them.",
    ];
    return ok(lines.join("\n"), { structure: { id: chosen.id, name: chosen.name }, ...comparison });
  },
);

server.registerTool(
  "save_structure",
  {
    title: "Save this wall's beats as a structure",
    description:
      "Save the open board's beats — in reading order, each one's headline as the beat's name, its change line as the prompt, and where it falls as a share of the wall — as one of the writer's own structures on the project, to lay on another wall with apply_template. Needs at least one card marked as a beat (set_rank).",
    inputSchema: { name: z.string().min(1) },
  },
  async (args) => {
    const { state } = await readBoard();
    const order = storyOrder(state).map((note) => note.id);
    const beats = structureBeats(state.notes, order);
    if (beats.length === 0) return ok("Nothing to save: no card on this board is marked as a beat. Mark the turns with set_rank first.");
    const { project, boards, rev, base, live } = await readProject();
    const { project: next, structure } = addStructure(project, args.name, beats);
    await writeProject(next, boards, rev, base);
    return ok(`Saved "${structure.name}" with ${beats.length} beats${where(live)}: ${beats.map((beat) => `${beat.name} at ${Math.round(beat.at * 100)}%`).join(", ")}. Each beat's prompt is its change line here; apply_template lays the same turns on another board, the next episode's, as beat cards to fill.`, structure);
  },
);

server.registerTool(
  "remove_structure",
  {
    title: "Remove one of the writer's structures",
    description: "Remove one of the writer's own structures from the project, by name or id. The built-in ones stay. Cards laid from it before are untouched — there are only cards.",
    inputSchema: { structure: z.string().min(1) },
  },
  async (args) => {
    const { project, boards, rev, base, live } = await readProject();
    const found = findStructure(project, args.structure);
    if (!found) return ok(`No structure of the writer's called "${args.structure}". Call list_structures.`);
    await writeProject(removeStructure(project, found.id), boards, rev, base);
    return ok(`Removed "${found.name}"${where(live)}.`, { id: found.id, name: found.name });
  },
);

server.registerTool(
  "export_fountain",
  {
    title: "Export the wall as Fountain",
    description:
      "The open board as a Fountain screenplay: a title page (with the premise and logline in its notes), beats as sections, one scene per card in wall order — a forced heading from the card's place (or its headline), the headline as a synopsis, the cast and the fold as notes, the change line as action after the mark [Unwritten] until the scene is written. Titled for the project, a one-board film being its project. Plain text a writer can open in any Fountain editor. Pass a path (relative to the server's folder) to write a .fountain file; otherwise the text comes back.",
    inputSchema: { path: z.string().optional() },
  },
  async (args) => {
    const { state } = await readBoard();
    const { project } = await readProject();
    const board = project.boards.find((item) => item.id === project.activeBoardId);
    const titles = scriptTitles(project, board);
    const text = toFountain(state, { ...titles, premise: project.premise || undefined, draftDate: new Date().toISOString() });
    if (args.path) {
      fs.mkdirSync(path.dirname(path.resolve(args.path)), { recursive: true });
      fs.writeFileSync(args.path, text);
      return ok(`Wrote ${text.split("\n").length} lines of Fountain, titled "${titles.title}", to ${args.path}.`);
    }
    return ok(text);
  },
);

server.registerTool(
  "export_markdown",
  {
    title: "Export the wall as Markdown",
    description:
      "The open board as Markdown, for a collaborator who lives in Google Docs or the like: titled for the project — a one-board film is its project, and the board's name follows only when the project has several boards — the premise and the logline under it, beats as second-level headings, a third-level heading per scene from its place with its scene number, the headline as a synopsis line, then the scene's text — a speech as its cue in bold with the lines under it — or, unwritten, its change line after the mark [Unwritten] in bold, so a reader can tell a placeholder from a page. Carries the beats and every headline; does not carry the cast or the fold (Fountain's notes do). In Google Docs, Paste from Markdown keeps the headings. Pass a path (relative to the server's folder) to write a .md file; otherwise the text comes back.",
    inputSchema: { path: z.string().optional() },
  },
  async (args) => {
    const { state } = await readBoard();
    const { project } = await readProject();
    const board = project.boards.find((item) => item.id === project.activeBoardId);
    const titles = scriptTitles(project, board);
    const text = toMarkdown(state, { ...titles, premise: project.premise || undefined });
    if (args.path) {
      fs.mkdirSync(path.dirname(path.resolve(args.path)), { recursive: true });
      fs.writeFileSync(args.path, text);
      return ok(`Wrote ${text.split("\n").length} lines of Markdown, titled "${titles.title}", to ${path.resolve(args.path)}.`);
    }
    return ok(text);
  },
);

server.registerTool(
  "export_text",
  {
    title: "Export the script as plain text",
    description:
      "The open board's script as plain text, set as it prints: the paginator's lines at Courier's columns kept with spaces, scene numbers in both margins (the wall's order, or as locked), no page numbers, an unwritten scene's change line as action after the mark [Unwritten], a revision's stars in the right margin. The script and nothing else: no headlines, no beats, no cast — the heading is the place and the when. Titled for the project, a one-board film being its project. Pastes into anything and reads as a script wherever the font is monospaced. Pass a path (relative to the server's folder) to write a .txt file; otherwise the text comes back.",
    inputSchema: { path: z.string().optional() },
  },
  async (args) => {
    const { state } = await readBoard();
    const { project } = await readProject();
    const board = project.boards.find((item) => item.id === project.activeBoardId);
    const titles = scriptTitles(project, board);
    const text = toPlainText(state, titles);
    if (args.path) {
      fs.mkdirSync(path.dirname(path.resolve(args.path)), { recursive: true });
      fs.writeFileSync(args.path, text);
      return ok(`Wrote ${text.split("\n").length} lines of plain text, titled "${titles.title}", to ${path.resolve(args.path)}.`);
    }
    return ok(text);
  },
);

server.registerTool(
  "write_scene",
  {
    title: "Write a scene",
    description:
      "Write a card's scene text in Fountain — action, character cues in capitals, dialogue under them — onto the card by id; the scene heading comes from the card's place, so start with the action. The card is then measured (its lines as they print against a 55-line page) instead of estimated. An empty string clears it. Read read_pages first so the scene fits what is around it, and do not write scenes the writer has not asked for.",
    inputSchema: { id: z.string(), text: z.string() },
  },
  async (args) => {
    const { state, changed, result, live } = await commit({ type: "set_text", id: args.id, text: args.text });
    if (!changed) {
      if (!result) return ok(`No card with id ${args.id}. Call list_board.`);
      return ok(`Nothing changed: "${result.headline}" already reads that way.`);
    }
    const printed = sceneLineCount(args.text);
    return ok(
      `Wrote "${result.headline}": ${printed} line(s) as they print (headings, blank lines and wrapped dialogue counted), measured at ${formatPages(noteEighths(result))} of a 55-line page, rounded to the nearest eighth and never below one eighth${where(live)}.${revisionMark(state, result.id)}${once("heading-from-place", " The heading comes from the card's place and when, so the text starts with the action.")} While the text stands the wall reads the measure, not the estimate${result.lengthEighths !== null ? ` (the writer's ${formatPages(result.lengthEighths)} pages)` : ""}; the estimate is kept for when the text goes, and set_length changes it.${cueReport(state, result.text)}`,
      { ...result, eighths: noteEighths(result), measured: true, printedLines: printed },
    );
  },
);

/** " Marked changed in the blue revision: 3 line(s)." when a revision is on and the card differs from its snapshot. */
function revisionMark(state, id) {
  const mark = revisionMarks(state).get(id);
  if (!state.revision || !mark?.revised) return "";
  return ` Marked changed in the ${state.revision.color} revision${mark.lines.size ? `: ${mark.lines.size} line(s), starred on the page and in every export` : ""}.`;
}

server.registerTool(
  "edit_scene",
  {
    title: "Change a line of a scene",
    description:
      "Change one line of a card's scene text without resending the scene: the exact text to find, and what replaces it. The text must occur once in the scene. The card is measured again and, under a revision, the changed line is marked. For a new scene or a rewrite, write_scene.",
    inputSchema: { id: z.string(), find: z.string().min(1), replace: z.string() },
  },
  async (args) => {
    const { state: before } = await readBoard();
    const note = before.notes.find((item) => item.id === args.id);
    if (!note) return ok(`No card with id ${args.id}. Call list_board.`);
    const text = note.text ?? "";
    if (!text.trim()) return ok(`"${note.headline}" is unwritten; write_scene it first.`);
    const count = text.split(args.find).length - 1;
    if (count === 0) return ok(`"${args.find}" is not in "${note.headline}"'s text. read_pages shows the scene as it stands.`);
    if (count > 1) return ok(`"${args.find}" occurs ${count} times in "${note.headline}"; give more of the line so it occurs once.`);
    const linesBefore = sceneLineCount(text);
    const { state, result, live } = await commit({ type: "set_text", id: note.id, text: text.replace(args.find, args.replace) });
    const linesAfter = sceneLineCount(result.text);
    return ok(
      `Changed one line of "${result.headline}": "${args.find}" → "${args.replace}"${where(live)}. Now ${linesAfter} line(s) as they print${linesAfter !== linesBefore ? ` (was ${linesBefore}: a line wraps differently now)` : ""}, measured at ${formatPages(noteEighths(result))} of a page.${revisionMark(state, result.id)}${cueReport(state, result.text)}`,
      { ...result, eighths: noteEighths(result), measured: true },
    );
  },
);

server.registerTool(
  "read_pages",
  {
    title: "Read the pages",
    description:
      "The open board as a script in wall order, with each card's id beside its heading and whether its length is measured (written) or estimated. The same text export_fountain writes, plus the ids, so a scene can be written back with write_scene.",
    inputSchema: {},
  },
  async () => {
    const { state } = await readBoard();
    const { project } = await readProject();
    const board = project.boards.find((item) => item.id === project.activeBoardId);
    const text = toFountain(state, { ...scriptTitles(project, board), premise: project.premise || undefined });
    const parsed = fromFountain(text);
    const marks = revisionMarks(state);
    const ids = mergeFountain(state, parsed).matched.map((item) => item.id);
    const pageNumbers = state.lock ? sceneNumbers(storyOrder(state), state.lock) : null;
    const lines = [];
    let index = 0;
    // The changed lines of the scene being printed, starred in the right margin as plain text stars them (round sixteen, entry 32).
    let changedTexts = new Set();
    for (const line of text.split("\n")) {
      if (/^\.(?!\.)/.test(line) && index < ids.length) {
        const note = state.notes.find((item) => item.id === ids[index]);
        index += 1;
        const standIn = note && !(note.location ?? "").trim() ? " · no place: the headline stands in for the heading" : "";
        const numbered = note && pageNumbers?.get(note.id) ? ` · locked no. ${pageNumbers.get(note.id)}` : "";
        const mark = note ? marks.get(note.id) : null;
        const sourceLines = (note?.text ?? "").split("\n");
        changedTexts = new Set([...(mark?.lines ?? [])].map((at) => sourceLines[at]).filter((item) => item && item.trim()));
        const revised = mark?.revised ? ` · changed in the ${state.revision.color} revision${changedTexts.size ? ` (${changedTexts.size} line${changedTexts.size === 1 ? "" : "s"} starred below)` : ""}` : "";
        lines.push(`${line}    [[id: ${note?.id ?? "?"} · ${note && isMeasured(note) ? "measured" : "estimated"} ${formatPages(note ? noteEighths(note) : 0)}pp${standIn}${numbered}${revised}]]`);
      } else {
        lines.push(changedTexts.has(line) ? `${line}    *` : line);
      }
    }
    return ok(lines.join("\n"));
  },
);

server.registerTool(
  "import_fountain",
  {
    title: "Import a Fountain script",
    description:
      "Read a .fountain file (by path) or Fountain text onto the open board: each scene's text goes onto the card with the same heading in order, a scene the wall does not have becomes a new card after the last matched one, and nothing is deleted. What a new card takes from a scene: its headline from the `= synopsis` line (else the heading), its place from a forced heading (`.the piano shop`) when there is a synopsis, its text from the body, and its change line from the body's first sentence. Rank, the fold, the cast, arrows and acts do not travel: set them after. A card with text is measured from it, so a one-line body makes a card of a few lines, not a page — this is the door for pages, not for a treatment. Say what was matched and what was made.",
    inputSchema: { path: z.string().optional(), text: z.string().optional() },
  },
  async (args) => {
    const source = args.text ?? (args.path ? fs.readFileSync(args.path, "utf8") : null);
    if (source === null) return ok("Nothing to import: pass a path or text.");
    const { state } = await readBoard();
    const parsed = fromFountain(source);
    const { commands, matched } = mergeFountain(state, parsed);
    // The whole import as one change, so one undo takes every scene back.
    const { live } = await commitAll(`import_fountain (${parsed.scenes.length} scene(s))`, (step) => {
      for (const command of commands) step(command);
    });
    const written = commands.filter((command) => command.type === "set_text").length;
    const created = matched.filter((item) => item.created).length;
    const same = matched.length - created - written;
    return ok(
      `Imported ${parsed.scenes.length} scene(s): ${written} written onto cards, ${same} matched with the same text (unchanged), ${created} new card(s)${where(live)}.`,
      matched,
    );
  },
);

server.registerTool(
  "list_words",
  {
    title: "What these words mean",
    description:
      "PlotCoder's words — beat, logline, change line, the folded corner, eighths, structure, brief — one sentence each, the app's own meaning, in the order a new person meets them. Use these sentences when the writer asks what a word means, so the app and you say the same thing.",
    inputSchema: {},
  },
  async () => ok(`PlotCoder's words — the app's own, the same on every project; no project was read.\n\n${wordsAsText()}`),
);

server.registerTool(
  "list_workflows",
  {
    title: "List workflows",
    description:
      "The workflows a writer can ask for: each a sentence, the tools it composes, and the rule to keep while doing it. When the writer's ask matches one, follow it; when it does not, compose the tools yourself and say what you did.",
    inputSchema: {},
  },
  async () =>
    ok(
      "The workflows — the app's own, the same on every project; no project was read.\n" +
      WORKFLOWS.map(
        (workflow) =>
          `- ${workflow.id} — ${workflow.name}\n  ask: "${workflow.ask}"\n  tools: ${workflow.tools.join(", ")}\n  keep: ${workflow.then}${
            workflow.needs ? `\n  the treatment should answer (ask the writer for what it leaves open; invent none of it):\n${workflow.needs.map((need) => `    - ${need.question} ${need.hint} → ${need.tool}`).join("\n")}` : ""
          }`,
      ).join("\n"),
      WORKFLOWS,
    ),
);

server.registerTool(
  "segment_brief",
  {
    title: "Brief a segment",
    description:
      "The brief for a segment of the movie: one card, or several in wall order for a run between beats. Everything the wall knows — the story, the people with their pages, the places, what changes, the script or 'unwritten', what must be true after — in the order a video tool would need it. Text only; nothing is generated or sent. Hand it to the writer to approve; fix a wrong brief on the cards.",
    inputSchema: { ids: z.array(z.string()).min(1) },
  },
  async (args) => {
    const { state } = await readBoard();
    const { project } = await readProject();
    const board = project.boards.find((item) => item.id === project.activeBoardId);
    const brief = segmentBrief(state, args.ids, { title: board?.name, boards: project.boards });
    if (!brief) return ok(`No cards with ids ${args.ids.join(", ")}. Call list_board.`);
    return ok(brief);
  },
);

server.registerTool(
  "export_fdx",
  {
    title: "Export as Final Draft",
    description:
      "The open board as a Final Draft .fdx: a heading per card with its scene number (the locked numbers under a lock, else story order), the scene's text as script paragraphs (action, character, parenthetical, dialogue, dual dialogue, transition) or the change line as action after the mark [Unwritten] when unwritten, and a title page: the project's name, and for a series the episode line (Episode 2 of 6 · its name). One board per file; a series is one file per episode. A lock's date and a revision's name print on the title page, and changed paragraphs carry the revision's mark. Pass a path to write the file (a relative path resolves from the server's folder); otherwise the XML comes back with the file's name in a comment on its second line, and the reply with a path repeats that name.",
    inputSchema: { path: z.string().optional() },
  },
  async (args) => {
    const { state } = await readBoard();
    const { project } = await readProject();
    const board = project.boards.find((item) => item.id === project.activeBoardId);
    const titles = scriptTitles(project, board);
    const xml = toFdx(state, { ...titles, draftDate: new Date().toISOString() });
    // The file's name, so an agent writing it by hand has one (round fifteen, entry 34).
    const filename = `${titles.title}${titles.episode ? ` - ${board?.name ?? ""}` : ""}`.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() + ".fdx";
    if (args.path) {
      fs.mkdirSync(path.dirname(path.resolve(args.path)), { recursive: true });
      fs.writeFileSync(args.path, xml);
      return ok(`Wrote a Final Draft file with ${state.notes.length} scene(s), titled "${titles.title}"${titles.episode ? ` (${titles.episode})` : ""}, to ${args.path}; the app's own name for it is "${filename}".${state.lock ? " The title page says when the numbers were locked." : ""}${state.revision ? ` The ${state.revision.color} revision is declared in the file and its changed paragraphs marked.` : ""}`);
    }
    return ok(xml.replace(/^(<\?xml[^>]*\?>\n)/, `$1<!-- Save as: ${filename.replace(/--/g, "- -")} -->\n`));
  },
);

server.registerTool(
  "import_fdx",
  {
    title: "Import a Final Draft script",
    description:
      "Read a Final Draft .fdx (by path) or its XML onto the open board: each scene's paragraphs become Fountain on the card with the same heading in order, a scene the wall does not have becomes a new card after the last matched one, and nothing is deleted. A scene whose text is already on its card is matched and left alone. Matching is by heading and then by order, so a file whose scenes were reordered lands each scene's text on the next card with that heading — the wall's own order does not change; a scene of the same heading in a new place is a move_scene here, not an import.",
    inputSchema: { path: z.string().optional(), xml: z.string().optional() },
  },
  async (args) => {
    const source = args.xml ?? (args.path ? fs.readFileSync(args.path, "utf8") : null);
    if (source === null) return ok("Nothing to import: pass a path or xml.");
    const { state } = await readBoard();
    const parsed = fromFdx(source);
    const { commands, matched } = mergeFountain(state, parsed);
    // The whole import as one change, so one undo takes every scene back.
    const { live } = await commitAll(`import_fdx (${parsed.scenes.length} scene(s))`, (step) => {
      for (const command of commands) step(command);
    });
    const written = commands.filter((command) => command.type === "set_text").length;
    const created = matched.filter((item) => item.created).length;
    const same = matched.length - created - written;
    const receipt = describeSetAside(parsed.setAside);
    return ok(`Imported ${parsed.scenes.length} scene(s) from Final Draft: ${written} written onto cards, ${same} matched with the same text (unchanged), ${created} new card(s)${where(live)}.${receipt ? ` ${receipt}` : ""}`, matched);
  },
);

server.registerTool(
  "page_count",
  {
    title: "Count the pages",
    description:
      "The open board paginated as a script — US Letter, Courier 12, fifty-five lines, headings kept with their scenes, dialogue broken with (MORE) and (CONT'D) — with the page each scene starts on. Written scenes are measured; unwritten ones set their change line as action.",
    inputSchema: {},
  },
  async () => {
    const { state } = await readBoard();
    const order = storyOrder(state);
    const numbers = sceneNumbers(order, state.lock);
    const result = paginate(
      order.map((note) => ({ id: note.id, heading: sceneHeading(note).slice(1), text: note.text, change: standInFor(note), written: Boolean(note.text && note.text.trim()), number: numbers.get(note.id) ?? undefined })),
    );
    const lines = result.scenes.map((scene) => {
      const note = order.find((item) => item.id === scene.id);
      return `  - ${scene.number}. ${note?.headline ?? scene.id} (${scene.id}) — p. ${scene.page}${scene.endPage !== scene.page ? `–${scene.endPage}` : ""}`;
    });
    const unwritten = order.filter((note) => !(note.text && note.text.trim())).length;
    // An unwritten board still paginates, as the guide says it prints: every
    // change line as action (round sixteen, entry 37).
    const note = order.length > 0 && unwritten === order.length
      ? [`None of the ${order.length} scenes is written: every scene sets its change line as action, marked [Unwritten], a few lines each — so this is the wall as pages, not a script; the runtime estimate from the cards is about ${formatPages(boardEighths(state))} of ${formatPages(state.targetEighths)} pages.`]
      : unwritten
      ? [`${unwritten} of ${order.length} scenes are unwritten and set their change line as action, marked [Unwritten], a few lines each — so this is the script so far, not the runtime: the estimate from the cards is about ${formatPages(boardEighths(state))} pages, the number to use until the scenes are written.`]
      : [];
    return ok([...note, `pages: ${result.pageCount} of ${Math.round(state.targetEighths / 8)}`, `scene numbers here are ${state.lock ? "the locked numbers" : "story order (not locked)"}`, ...lines].join("\n"), result.scenes);
  },
);

server.registerTool(
  "lock_numbers",
  {
    title: "Lock the scene numbers",
    description:
      "Once a draft has gone out: every scene keeps the number it has by the story's order, and moving a locked scene never renumbers it. A scene added after the lock has a letter, not a number of its own — between 14 and 15 it is 14A, then 14B — and the letter is its place between locked scenes, so it follows the scene if the scene moves. Final Draft out carries the locked numbers. Ask the writer; it is a decision about the document going out.",
    inputSchema: {},
  },
  async () => {
    const { state } = await readBoard();
    const order = storyOrder(state).map((note) => note.id);
    const { changed, result, live } = await commit({ type: "lock_numbers", order });
    if (!changed) return ok("Nothing to lock.");
    // Which number went on which scene (round sixteen, entry 34).
    const byNumber = Object.entries(result.numbers).map(([id, number]) => `${number} "${state.notes.find((note) => note.id === id)?.headline ?? id}"`);
    return ok(`Locked ${Object.keys(result.numbers).length} scene number(s)${where(live)}: ${byNumber.join(", ")}. A scene added now gets a letter for where it sits — 3A between 3 and 4 — worked out again if it moves; the locked numbers never move. Every script out carries these numbers, and its title page says when they were locked.`, result);
  },
);

server.registerTool(
  "unlock_numbers",
  { title: "Unlock the scene numbers", description: "Numbers follow the wall's order again.", inputSchema: {} },
  async () => {
    const { state: before } = await readBoard();

    const { changed, live } = await commit({ type: "unlock_numbers" });
    return ok(changed ? `Unlocked ${Object.keys(before.lock?.numbers ?? {}).length} scene number(s)${where(live)}; scenes number by wall order again.` : "The numbers were not locked.");
  },
);

server.registerTool(
  "start_revision",
  {
    title: "Start a revision",
    description:
      `Start a revision in one of the industry's colours (${REVISION_COLORS.join(", ")}), with a name or, left out, named for the colour. Every card is snapshotted; from then on a changed line is starred — on the page, in plain text's right margin, as a revision in Final Draft — a changed scene's heading is marked in Markdown and noted in Fountain, and a changed card wears the colour on the wall. write_scene and edit_scene say when they mark a card.`,
    inputSchema: { name: z.string().optional(), color: z.string().optional() },
  },
  async (args) => {
    const revisionName = (args.name ?? "").trim() || (args.color ? `${args.color.charAt(0).toUpperCase()}${args.color.slice(1)}` : "");
    if (!revisionName) return ok("No revision started: give it a name, or a colour to name it after.");
    const { changed, result, live } = await commit({ type: "start_revision", name: revisionName, color: args.color });
    if (!changed) return ok("No revision started: one is already in progress; end_revision first.");
    return ok(`Started the ${result.color} revision "${result.name}"${where(live)}.`, { name: result.name, color: result.color, since: result.since });
  },
);

server.registerTool(
  "end_revision",
  { title: "End the revision", description: "The marks come off; the snapshot is dropped.", inputSchema: {} },
  async () => {
    const { state: before } = await readBoard();

    const { changed, live } = await commit({ type: "end_revision" });
    return ok(changed ? `Revision "${before.revision?.name ?? ""}" (${before.revision?.color ?? ""}) ended${where(live)}: its marks come off and its snapshot is dropped.` : "No revision in progress.");
  },
);

// --- The horizon's first surface (R28; Roadmap 2, item 9) -------------------

server.registerTool(
  "build_segment",
  {
    title: "Build a segment",
    description:
      "Hand a segment's brief — one card, or several in wall order — to the video tool. No tool is chosen yet: until one is, this returns the brief with a note saying so, and a take built elsewhere is filed with add_take. When a provider exists it will be a tool behind this same surface; the wall's records are what it is handed. The writer approves the brief before anything is made.",
    inputSchema: { ids: z.array(z.string()).min(1) },
  },
  async (args) => {
    const { state } = await readBoard();
    const { project } = await readProject();
    const board = project.boards.find((item) => item.id === project.activeBoardId);
    const brief = segmentBrief(state, args.ids, { title: board?.name, boards: project.boards });
    if (!brief) return ok(`No cards with ids ${args.ids.join(", ")}. Call list_board.`);
    const provider = env.PLOTCODER_VIDEO_PROVIDER;
    if (!provider) {
      return ok(`No video tool is configured (PLOTCODER_VIDEO_PROVIDER is unset). Hand this brief to one, then file what it makes with add_take.\n\n${brief}`);
    }
    return ok(`The video tool "${provider}" is named but not wired yet; this surface is where it goes. The brief:\n\n${brief}`);
  },
);

server.registerTool(
  "list_takes",
  {
    title: "List the takes",
    description: "Through the account door: every take filed on the working project — by subject (a card id, or run:<ids>), name, and whether it is the chosen one.",
    inputSchema: {},
  },
  async () => {
    const account = await findAccount();
    if (!account) return shut("No account door: takes are files on the project, and need PLOTCODER_EMAIL and PLOTCODER_PASSWORD to read.");
    if (!account.projectId) return ok(noProjectYet());
    const { data, error } = await account.client.from("assets").select("id, subject, name, note, created_at").eq("project_id", account.projectId).eq("kind", "take").order("created_at");
    if (error) return ok(`Could not read the takes: ${error.message}`);
    const rows = data ?? [];
    return ok(
      [`takes: ${rows.length}`, ...rows.map((row) => `  - ${row.id} — ${row.subject} — ${row.name}${row.note === "chosen" ? " (chosen)" : ""}`)].join("\n"),
      rows,
    );
  },
);

/** Upload a file by path into the project's bucket and file an assets row for it. */
async function fileAsset(account, kind, subject, filePath, note = "") {
  const bytes = fs.readFileSync(filePath);
  const name = path.basename(filePath);
  const safe = name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || kind;
  const ext = path.extname(name).toLowerCase();
  const contentType =
    { ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".pdf": "application/pdf", ".txt": "text/plain", ".fountain": "text/plain", ".fdx": "application/xml" }[ext] ??
    "application/octet-stream";
  const storagePath = `${account.projectId}/${kind}/${crypto.randomUUID()}-${safe}`;
  const up = await account.client.storage.from("projects").upload(storagePath, bytes, { contentType, upsert: false });
  if (up.error) return { error: `Could not upload ${name}: ${up.error.message}` };
  const row = await account.client
    .from("assets")
    .insert({ project_id: account.projectId, kind, subject, path: storagePath, name, size: bytes.length, content_type: contentType, note })
    .select("id")
    .maybeSingle();
  if (row.error) {
    await account.client.storage.from("projects").remove([storagePath]);
    return { error: `Uploaded, but could not file ${name}: ${row.error.message}` };
  }
  return { id: row.data?.id, name };
}

server.registerTool(
  "add_take",
  {
    title: "Add a take",
    description:
      "Through the account door: file a take a video tool built — a file by path — on the working project, under a card's id or run:<ids joined by +>. The writer then sees it in the Takes panel and chooses.",
    inputSchema: { subject: z.string().min(1), path: z.string().min(1), chosen: z.boolean().optional() },
  },
  async (args) => {
    const account = await findAccount();
    if (!account) return shut("No account door: set PLOTCODER_EMAIL and PLOTCODER_PASSWORD to file takes on the project.");
    if (!account.projectId) return ok(noProjectYet());
    const filed = await fileAsset(account, "take", args.subject, args.path, args.chosen ? "chosen" : "");
    if (filed.error) return ok(filed.error);
    return ok(`Filed "${filed.name}" as a take on ${args.subject}${args.chosen ? ", chosen" : ""} (saved to the account; the writer's Takes panel has it).`, { id: filed.id, subject: args.subject });
  },
);

server.registerTool(
  "add_picture",
  {
    title: "Add a picture to a person's page",
    description:
      "Through the account door: put a picture — an image file by path — on a person's page, by the character's id or name. The writer sees it in the page's gallery; the first picture is the face on their page.",
    inputSchema: { character: z.string().min(1), path: z.string().min(1) },
  },
  async (args) => {
    const account = await findAccount();
    if (!account) return shut("No account door: pictures are files on the project, and need PLOTCODER_EMAIL and PLOTCODER_PASSWORD to add.");
    if (!account.projectId) return ok(noProjectYet());
    const { state } = await readBoard();
    const wanted = args.character.trim().toLowerCase();
    const person = state.characters.find((item) => item.id === args.character) ?? state.characters.find((item) => item.name.trim().toLowerCase() === wanted);
    if (!person) return ok(`Nobody called "${args.character}" on this board. Call list_board for the cast, or add_character.`);
    const filed = await fileAsset(account, "picture", person.id, args.path);
    if (filed.error) return ok(filed.error);
    return ok(`Added "${filed.name}" to ${person.name}'s page (saved to the account; the writer's gallery has it).`, { id: filed.id, character: person.id });
  },
);

server.registerTool(
  "list_files",
  {
    title: "List the project's files",
    description:
      "Through the account door: every file on the working project — pictures on people's pages, takes on cards, other files — with its id, kind, what it is about (a character id, a card id, or run:<ids>), name and size.",
    inputSchema: {},
  },
  async () => {
    const account = await findAccount();
    if (!account) return shut("No account door: files live on the project, and need PLOTCODER_EMAIL and PLOTCODER_PASSWORD to read.");
    if (!account.projectId) return ok(noProjectYet());
    const { data, error } = await account.client.from("assets").select("id, kind, subject, name, size, note, created_at").eq("project_id", account.projectId).order("created_at");
    if (error) return ok(`Could not read the files: ${error.message}`);
    const rows = data ?? [];
    return ok(
      [`files: ${rows.length}`, ...rows.map((row) => `  - ${row.id} — ${row.kind} — ${row.subject || "(the project)"} — ${row.name} (${row.size} bytes)${row.note === "chosen" ? " (chosen)" : ""}`)].join("\n"),
      rows,
    );
  },
);

server.registerTool(
  "remove_file",
  {
    title: "Remove a file from the project",
    description: "Through the account door: remove one file — a picture, a take, anything — from the working project by its id from list_files. Cannot be undone: ask the writer first.",
    inputSchema: { id: z.string().min(1) },
  },
  async (args) => {
    const account = await findAccount();
    if (!account) return shut("No account door: files live on the project, and need PLOTCODER_EMAIL and PLOTCODER_PASSWORD to remove.");
    if (!account.projectId) return ok(noProjectYet());
    const found = await account.client.from("assets").select("id, path, name").eq("project_id", account.projectId).eq("id", args.id).maybeSingle();
    if (found.error) return ok(`Could not find the file: ${found.error.message}`);
    if (!found.data) return ok(`No file with id ${args.id} on this project. Call list_files.`);
    const gone = await account.client.from("assets").delete().eq("id", args.id);
    if (gone.error) return ok(`Could not remove ${found.data.name}: ${gone.error.message}`);
    await account.client.storage.from("projects").remove([found.data.path]);
    return ok(`Removed "${found.data.name}" (saved to the account; gone from every open wall).`, { id: args.id });
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
    if (!last) return ok(oneCall() ? "Nothing to undo here: through plotcoder-call every call is a fresh server, so undo works only from an MCP session. The writer can take any change back from the wall with ⌘Z." : "Nothing of mine to undo in this session.");
    const { state, rev, base } = await readBoard();
    if (canon(state) !== last.after) {
      return ok(
        `Not undone: the board has changed since my ${last.what}. Undoing now would trample that. Ask the person to undo from the wall if they want it back.`,
      );
    }
    trail.pop();
    undone.push(last);
    const { boardId } = await readBoard();
    const live = await writeBoard(last.before, rev, base, boardId, "exact");
    const orderLine = /^(move_scene|organize)/.test(last.what) ? ` Story order now: ${storyOrder(last.before).map((note, index) => `${index + 1}. ${note.headline}`).join(", ")}.` : "";
    const cardsDiff = last.before.notes.length - state.notes.length;
    // The arrows by name, back and gone, not the net (round sixteen, entry 45).
    const headlineIn = (board, id) => board.notes.find((note) => note.id === id)?.headline ?? id;
    const arrowName = (board, arrow) => `"${headlineIn(board, arrow.from)}" → "${headlineIn(board, arrow.to)}" (${arrow.kind ?? "follows"})`;
    const arrowsBack = last.before.arrows.filter((arrow) => !state.arrows.some((item) => item.id === arrow.id)).map((arrow) => arrowName(last.before, arrow));
    const arrowsGone = state.arrows.filter((arrow) => !last.before.arrows.some((item) => item.id === arrow.id)).map((arrow) => arrowName(state, arrow));
    const groupsChanged = last.before.groups
      .filter((group) => { const now = state.groups.find((item) => item.id === group.id); return !now || now.noteIds.length !== group.noteIds.length; })
      .map((group) => `"${group.title}" (${group.noteIds.length} cards)`);
    const withIt = [
      arrowsBack.length ? `${arrowsBack.length} arrow(s) back: ${arrowsBack.join(", ")}` : null,
      arrowsGone.length ? `${arrowsGone.length} arrow(s) gone: ${arrowsGone.join(", ")}` : null,
      groupsChanged.length ? `groups as they were: ${groupsChanged.join(", ")}` : null,
    ].filter(Boolean);
    const countLine = `${cardsDiff > 0 ? ` ${cardsDiff} card(s) back` : cardsDiff < 0 ? ` ${-cardsDiff} card(s) gone` : ""}${withIt.length ? `${cardsDiff ? ", with " : " "}${withIt.join("; ")}` : ""}${cardsDiff || withIt.length ? "." : ""}`;
    // Under a lock, the letters that changed with the undo (entry 46).
    let lockLine = "";
    if (last.before.lock) {
      const was = sceneNumbers(storyOrder(state), state.lock ?? last.before.lock);
      const now = sceneNumbers(storyOrder(last.before), last.before.lock);
      const moved = last.before.notes.filter((note) => was.get(note.id) && now.get(note.id) && was.get(note.id) !== now.get(note.id)).map((note) => `"${note.headline}" is ${now.get(note.id)} again (was ${was.get(note.id)})`);
      lockLine = moved.length ? ` Under the lock, ${moved.join("; ")}.` : "";
    }
    // Whose trail the count is (entry 47): this session's, across the boards.
    const more = `${trail.length} more of this session's changes can be undone, across the boards — each only on the board it was made on, and only while that board is as the change left it${trail.length >= TRAIL_CAP ? "; that is the most I keep, so the oldest have gone" : ""}`;
    return ok(`Undid ${last.what}${where(live)}.${orderLine}${countLine}${lockLine} ${more}. list_board has the board.`, { undid: last.what, notes: last.before.notes.length, arrows: last.before.arrows.length, groups: last.before.groups.length });
  },
);

server.registerTool(
  "redo",
  {
    title: "Redo what I undid",
    description:
      "Put back the last change this server undid, newest first. Refuses if the board has changed since the undo — a person moved on, or another agent did — so it never tramples work. Any new change of mine clears what could be redone.",
    inputSchema: {},
  },
  async () => {
    const last = undone[undone.length - 1];
    if (!last) return ok("Nothing of mine to redo.");
    const { state, rev, base, boardId } = await readBoard();
    if (canon(state) !== canon(last.before)) {
      return ok(`Not redone: the board has changed since I undid my ${last.what}. Redoing now would trample that.`);
    }
    undone.pop();
    const after = normalizeState(JSON.parse(last.after));
    const live = await writeBoard(after, rev, base, boardId, "exact");
    trail.push(last);
    return ok(`Redid ${last.what}${where(live)}. ${undone.length} more can be redone. list_board has the board.`, { redid: last.what, notes: after.notes.length, arrows: after.arrows.length, groups: after.groups.length });
  },
);

server.registerTool(
  "set_when",
  {
    title: "Set when scenes happen",
    description:
      "When one or more scenes happen, as the writer would say it — \"night\", \"day four, dawn\", \"the next morning\" — on the card beside its place, and printed after the place on every scene heading: THE PIER AT FENIT - NIGHT. Free text, the writer's phrase; an empty string clears it. This is where a scene's day and time live, not the headline, so the duplicate check never reads a day as a scene's words. create_note and update_note take when too; list_board shows it as when: …",
    inputSchema: { ids: z.array(z.string()).min(1), when: z.string() },
  },
  async (args) => {
    const { state, changed, result, live } = await commit({ type: "set_when", ids: args.ids, when: args.when });
    if (!changed) {
      const missing = args.ids.filter((id) => !state.notes.some((note) => note.id === id));
      return ok(missing.length ? `No card with id ${missing.join(", ")}. Call list_board for the real ids.` : `Nothing changed: ${args.ids.length === 1 ? "the card already says" : "those cards already say"} "${args.when.trim()}".`);
    }
    const when = result[0]?.when ?? "";
    return ok(
      when
        ? `${result.length} card(s) now happen ${/^(at|on|in|by|the)\b/i.test(when) ? "" : "at "}"${when}"${where(live)}. The heading prints as ${sceneHeading(result[0]).slice(1)}.${stillOpen(result)}`
        : `${result.length} card(s) no longer say when they happen${where(live)}.${stillOpen(result)}`,
      result,
    );
  },
);

// The open card (R59): the writer's word that a card is not decided. The
// per-card twin of leave_question — that one leaves a question, this one
// leaves a card.
server.registerTool(
  "set_open",
  {
    title: "Leave a card open",
    description:
      "Mark one or more cards open, with the writer's words for what is not decided — \"whether Tom knows\", \"who sent the letter\". An open card is listed by read_wall under its own head and asked nothing else of while the words stand: not its place, not its change line, not its arrows. It is still counted, in the order, and a page. open \"\" closes the card and its questions come back on their own. Only on the writer's word — a card is open because they said so, never because you could not decide; where the notes have two versions, ask, and if they say leave it, this is how.",
    inputSchema: { ids: z.array(z.string()).min(1), open: z.string() },
  },
  async (args) => {
    const { state, changed, result, live } = await commit({ type: "set_open", ids: args.ids, open: args.open });
    if (!changed) {
      const missing = args.ids.filter((id) => !state.notes.some((note) => note.id === id));
      return ok(missing.length ? `No card with id ${missing.join(", ")}. Call list_board for the real ids.` : `Nothing changed: ${args.ids.length === 1 ? "the card already says that" : "those cards already say that"}.`);
    }
    const words = result[0]?.open ?? "";
    return ok(
      words
        ? `${result.length} card(s) open: "${words}"${where(live)}. The reading lists ${result.length === 1 ? "it" : "them"} under "open, by the writer's word" and asks nothing else of ${result.length === 1 ? "it" : "them"} while the words stand; the card wears the words on its edge. set_open with "" closes it.`
        : `${result.length} card(s) closed${where(live)}: decided, so the wall's questions about ${result.length === 1 ? "it" : "them"} come back on their own.`,
      result,
    );
  },
);

server.registerTool(
  "set_plant",
  {
    title: "Fold the corner",
    description:
      `Fold the corner of cards — mark them as planting something — or unfold them. ${wordSentence("corner")} The setup arrow is create_arrow with kind 'setup'. A fold that pays off in a later episode: pass later, another board of the project by name, id or number — a board that exists; new_board makes one — and, once you know it, at: the scene on that board that pays it off, by id or headline. A board alone is a promise: the reading lists the card under 'later' and, once that board holds cards, asks which scene until one claims it; with at, both boards' readings name the payoff and the paying-off card says so. later '' forgets the board; at '' keeps the board and forgets the scene. set_payoff makes the same claim from the other board. Folding never moves a card.`,
    inputSchema: {
      ids: z.array(z.string()).min(1),
      plants: z.boolean(),
      later: z.string().optional(),
      at: z.string().optional(),
    },
  },
  async (args) => {
    // A series plant (R50): the fold pays off on another board of the project.
    // The kernel cannot check the board exists; this door can, before anything lands.
    let target = null;
    let forgetting = false;
    let atNote = null;
    let atClearing = false;
    if (args.plants && (args.later !== undefined || args.at !== undefined)) {
      const { project, boards } = await readProject();
      const { state: here, boardId: current } = await readBoard();
      if (args.later !== undefined && args.later.trim() === "") {
        forgetting = true;
      } else {
        // `at` alone means the board the fold already names.
        const key = args.later ?? here.notes.find((note) => args.ids.includes(note.id) && note.payoffBoardId)?.payoffBoardId;
        if (!key) return ok("Say which board with later before at: a scene belongs to a board.");
        target = findBoard(project, String(key));
        if (!target) return ok(`No board called "${args.later}" yet. A fold pays off later on a board of the project: new_board "${args.later}" makes it (empty), open_board back to this one, then set_plant again with later.`);
        if (target.id === (current ?? project.activeBoardId)) return ok(`"${target.name}" is this board. A payoff on the same board is a setup arrow: create_arrow from the fold to the scene, kind 'setup'.`);
        if (args.at !== undefined) {
          if (args.at.trim() === "") atClearing = true;
          else {
            const there = isBoardState(boards[target.id]) ? normalizeState(boards[target.id]) : emptyState();
            const wanted = args.at.trim().toLowerCase();
            atNote = there.notes.find((note) => note.id === args.at.trim()) ?? there.notes.find((note) => note.headline.trim().toLowerCase() === wanted) ?? null;
            if (!atNote) return ok(`No card on "${target.name}" with id or headline "${args.at}". open_board there and list_board for its cards; or leave at out and the fold stays a promise on that board.`);
          }
        }
      }
    }
    // The fold and the board it pays off on land as one change: one ⌘Z on the wall.
    const { value, live, changed } = await commitAll("set_plant", (step, current) => {
      // What the folds claimed before, so the reply can say what a new claim replaced (round sixteen, entry 26).
      const before = new Map(current().notes.filter((note) => args.ids.includes(note.id)).map((note) => [note.id, { plants: note.plants, boardId: note.payoffBoardId, noteId: note.payoffNoteId }]));
      const alreadyFolded = args.plants && args.ids.every((id) => before.get(id)?.plants);
      let { result } = step({ type: "set_plant", ids: args.ids, plants: args.plants });
      let laterLine = alreadyFolded ? " (already folded)" : "";
      if (forgetting) {
        const cleared = step({ type: "set_payoff_board", ids: args.ids, boardId: null });
        if (cleared.changed) {
          result = cleared.result;
          laterLine = " The board it paid off on is forgotten; read_wall asks again until a setup arrow or a board pays it off.";
        }
      } else if (target) {
        const named = step({ type: "set_payoff_board", ids: args.ids, boardId: target.id, noteId: atNote?.id ?? null });
        if (named.changed) result = named.result;
        const here = current().notes.filter((note) => args.ids.includes(note.id));
        // The claim that stood before, when this one replaces it.
        const replaced = [...before.values()].filter((was) => was.boardId && (was.boardId !== target.id || (was.noteId && was.noteId !== (atNote?.id ?? null))));
        const replacedLine = replaced.length
          ? ` That replaces the earlier claim${replaced.length === 1 ? "" : "s"}: ${replaced.map((was) => `${was.noteId ? `"${(isBoardState(lastHeld?.boards?.[was.boardId]) ? lastHeld.boards[was.boardId].notes.find((note) => note.id === was.noteId)?.headline : null) ?? was.noteId}" on` : "a scene to come on"} "${lastHeld?.project?.boards?.find((meta) => meta.id === was.boardId)?.name ?? was.boardId}"`).join(", ")}, which no longer pays anything off.`
          : "";
        laterLine = `${laterLine}${atNote
          ? ` ${here.length} fold(s) ${here.length === 1 ? "is" : "are"} paid off at "${atNote.headline}" on "${target.name}": both boards' readings name it, and that card says what it pays off.`
          : atClearing
            ? ` ${here.length} fold(s) pay off later, on "${target.name}", and no scene there is claimed: read_wall asks which once that board holds cards.`
            : ` ${here.length} fold(s) pay off later, on "${target.name}": the card says so, and read_wall asks which scene once that board holds cards — set_plant with at, or set_payoff from that board, names it.`}${replacedLine}`;
      }
      return { result, laterLine };
    });
    const { result, laterLine } = value;
    const count = result?.length ?? 0;
    if (!changed || count === 0) return ok("No change: those cards were already that way, or the ids are not on the board.");
    return ok(
      args.plants
        ? `${count} card(s) now plant something${where(live)}.${laterLine || " read_wall will ask about each until a setup arrow pays it off, or later names the board it pays off on."}`
        : `${count} card(s) no longer marked as planting${where(live)}.`,
      result,
    );
  },
);

// --- Characters -------------------------------------------------------

// The receiving end of a series plant (R58), claimed from the board it lands
// on: the same record set_plant's `at` writes, on the fold's own card, so one
// claim has one owner. Two board switches around one frame on the fold's
// board, which is where undo takes it back.
server.registerTool(
  "set_payoff",
  {
    title: "Pay off a fold from another board",
    description:
      "Say that a card on this board pays off a fold of another board of the project: id (the card here), from (that board, by name, id or number), and fold (the folded card there, by id or headline). The claim is written on the fold's card — the twin of set_plant with later and at — so both boards' readings name it and the card here says what it pays off. fold '' takes back every claim of that board on this card. The wall's other board is opened for the write and this one reopened after; undo on that board takes the claim back.",
    inputSchema: { id: z.string(), from: z.union([z.string().min(1), z.number()]), fold: z.string() },
  },
  async (args) => {
    const { project, boards } = await readProject();
    const { state: here, boardId } = await readBoard();
    const hereId = boardId ?? project.activeBoardId;
    const card = here.notes.find((note) => note.id === args.id);
    if (!card) return ok(`No card with id ${args.id} on this board. Call list_board.`);
    const source = findBoard(project, String(args.from));
    if (!source) return ok(`No board matches "${args.from}". Call list_boards for the real ones.`);
    if (source.id === hereId) return ok(`"${source.name}" is this board. A payoff on the same board is a setup arrow: create_arrow from the fold to this card, kind 'setup'.`);
    const there = isBoardState(boards[source.id]) ? normalizeState(boards[source.id]) : emptyState();
    const clearing = args.fold.trim() === "";
    const wanted = args.fold.trim().toLowerCase();
    const folds = clearing
      ? there.notes.filter((note) => note.plants && note.payoffBoardId === hereId && note.payoffNoteId === card.id)
      : [there.notes.find((note) => note.id === args.fold.trim()) ?? there.notes.find((note) => note.headline.trim().toLowerCase() === wanted)].filter(Boolean);
    if (!folds.length) return ok(clearing ? `No fold of "${source.name}" claims "${card.headline}".` : `No card on "${source.name}" with id or headline "${args.fold}". open_board there and list_board for its cards.`);
    if (!clearing && !folds[0].plants) return ok(`"${folds[0].headline}" on "${source.name}" is not folded: nothing to pay off. set_plant it there first, with later "${boardById(project, hereId)?.name ?? hereId}".`);
    const held = await readProject();
    await openBoardEverywhere(held.project, held.boards, held.rev, held.base, source.id);
    const { changed } = await commitAll(`set_payoff "${card.headline}"`, (step) => {
      for (const fold of folds) step({ type: "set_payoff_board", ids: [fold.id], boardId: clearing ? hereId : hereId, noteId: clearing ? null : card.id });
    });
    const back = await readProject();
    const { live } = await openBoardEverywhere(back.project, back.boards, back.rev, back.base, hereId);
    // The write landed on the fold's board, so its change note is that board's (round sixteen, entry 16).
    const noteThere = changeNote();
    const thereLine = noteThere ? ` On "${source.name}"${noteThere}.` : "";
    if (!changed) return ok(`No change: ${clearing ? "nothing was claimed" : `"${folds[0].headline}" already pays off at "${card.headline}"`}.`);
    return ok(
      clearing
        ? `"${card.headline}" no longer pays off ${folds.map((fold) => `"${fold.headline}"`).join(", ")} from "${source.name}"; ${folds.length === 1 ? "that fold is" : "those folds are"} a promise on this board again${where(live)}.${thereLine} This board is open again; undo on "${source.name}" takes it back.`
        : `"${card.headline}" pays off "${folds[0].headline}" from "${source.name}" (${episodeLabel(project, { ...boards, [hereId]: here }, source.id, folds[0].id)})${where(live)}. The fold's card there says "paid off in ${episodeLabel(project, { ...boards, [hereId]: here }, hereId, card.id)}", this card says what it pays off, and both readings list it.${thereLine} This board is open again; undo on "${source.name}" takes the claim back.`,
      { fold: folds.map((fold) => fold.id), board: source.id, card: card.id },
    );
  },
);

server.registerTool(
  "add_character",
  {
    title: "Add character",
    description:
      "Add a person to the project's cast — one roster every board of the project casts from, so a person is one record across the pilot and the episodes after it. The same name twice is refused and the existing record returned. Add someone here before casting them on a card.",
    inputSchema: { name: z.string().min(1) },
  },
  async (args) => {
    const { changed, result, live } = await commit({ type: "add_character", name: args.name });
    if (!changed) {
      return result
        ? ok(`Already in the cast as "${result.name}" (${result.id}). Use that id.`, result)
        : ok("No character added: the name was empty.");
    }
    return ok(`Added "${result.name}" (id ${result.id}) to the project's cast; every board of the project casts from it${where(live)}.`, result);
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
    const { state: before } = await readBoard();
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
    const followed = state.notes.filter((note) => note.characterIds.includes(result.id)).length;
    const oldName = (before.characters.find((item) => item.id === result.id)?.name ?? "").trim();
    const stale = oldName ? CHARACTER_FIELDS.filter((field) => (result[field] ?? "").toLowerCase().includes(oldName.toLowerCase())) : [];
    const staleLine = stale.length ? ` The page's ${stale.join(", ")} still mention${stale.length === 1 ? "s" : ""} "${oldName}"; the page is untouched.` : "";
    return ok(`Renamed to "${result.name}" (${result.id})${where(live)}; the name changed on ${followed} card${followed === 1 ? "" : "s"}.${staleLine}`, result);
  },
);

server.registerTool(
  "read_character",
  {
    title: "Read a person's page",
    description:
      "Read one person's page back, by id or by name: the five lines — looks, voice, wants, needs, notes — as they stand, and every card the person is on across every board of the project, in story order, each with its place, when and rank. The cast is the project's (one record, one page), so this reads all of it; list_board says only which lines are written.",
    inputSchema: { id: z.string().optional(), name: z.string().optional() },
  },
  async (args) => {
    const key = (args.id ?? args.name ?? "").trim();
    if (!key) return ok("Say who: the person's id or name from list_board.");
    const { state, boardId, live, base } = await readBoard();
    const { project, boards } = await readProject();
    const wanted = key.toLowerCase();
    const person = state.characters.find((item) => item.id === key) ?? state.characters.find((item) => item.name.trim().toLowerCase() === wanted);
    if (!person) return ok(`Nobody called "${key}" in the cast. Call list_board for the cast, or add_character.`);
    // The person's part is the project's, not one board's (R51; round fifteen,
    // entries 22 and 23): every board, in the project's order, the open one read live.
    const openId = boardId ?? project.activeBoardId;
    const parts = project.boards.map((meta) => {
      const held = meta.id === openId ? state : isBoardState(boards[meta.id]) ? normalizeState(boards[meta.id]) : emptyState();
      const on = storyOrder(held).filter((note) => (note.characterIds ?? []).includes(person.id));
      return { meta, on };
    });
    const total = parts.reduce((sum, part) => sum + part.on.length, 0);
    const where_ = (note) => [note.location ? `at ${note.location}` : "", note.when ? note.when : "", note.rank === "beat" ? "beat" : ""].filter(Boolean).join(" · ");
    // A read opens with the door it came through, like every reading (round sixteen, entry 28); one scene a line (29).
    const lines = [
      `PlotCoder cast (${door(live, base)})`,
      `${person.name} (${person.id}) — on ${total} card${total === 1 ? "" : "s"} across ${project.boards.length} board${project.boards.length === 1 ? "" : "s"} of the project`,
      ...CHARACTER_FIELDS.map((field) => `  ${field}: ${(person[field] ?? "").trim() || "(empty)"}`),
      ...parts.flatMap((part) =>
        part.on.length
          ? [`  "${part.meta.name}", ${part.on.length} card${part.on.length === 1 ? "" : "s"} in story order:`, ...part.on.map((note, index) => `    ${index + 1}. "${note.headline}"${where_(note) ? ` (${where_(note)})` : ""}`)]
          : [`  "${part.meta.name}": on no card`],
      ),
    ];
    return ok(lines.join("\n"), { ...person, cards: parts.flatMap((part) => part.on.map((note) => note.id)), boards: parts.map((part) => ({ id: part.meta.id, name: part.meta.name, cards: part.on.map((note) => note.id) })) });
  },
);

server.registerTool(
  "update_character",
  {
    title: "Update a person's page",
    description:
      "Write any of the five lines of a person's page, by id or by name: looks (what a stranger would notice), voice (how they sound, and how it changes when they lie), wants (the clear want), needs (what they need and will not admit), notes (anything to pull up mid-scene). All text; pass only the lines you are setting; an empty string clears one. Ask the writer before inventing looks or a voice — the page is theirs.",
    inputSchema: {
      id: z.string().optional(),
      name: z.string().optional(),
      looks: z.string().optional(),
      voice: z.string().optional(),
      wants: z.string().optional(),
      needs: z.string().optional(),
      notes: z.string().optional(),
    },
  },
  async (args) => {
    const patch = {};
    for (const field of CHARACTER_FIELDS) {
      if (typeof args[field] === "string") patch[field] = args[field];
    }
    const key = (args.id ?? args.name ?? "").trim();
    if (!key) return ok("Say who: the person's id or name from list_board.");
    const { state: before } = await readBoard();
    const wanted = key.toLowerCase();
    const person = before.characters.find((item) => item.id === key) ?? before.characters.find((item) => item.name.trim().toLowerCase() === wanted);
    if (!person) return ok(`Nobody called "${key}" in the cast. Call list_board for the cast, or add_character.`);
    const { changed, result, live } = await commit({ type: "update_character", id: person.id, ...patch });
    if (!changed) {
      if (!result) return ok(`No character with id ${person.id}. Call list_board for the cast.`);
      return ok(`Nothing changed on ${result.name}'s page: those lines already read that way.`, result);
    }
    const trim = (text) => (text.length > 400 ? `${text.slice(0, 140)}… (${text.length} characters in all, every one landed)` : text);
    const lines = Object.keys(patch).map((field) => {
      const had = (person[field] ?? "").trim();
      const now = (result[field] ?? "").trim();
      return `${field}${had && now ? " (replacing what was there)" : had && !now ? " (cleared)" : ""}: ${now ? `"${trim(now)}"` : "(empty)"}`;
    });
    return ok(`Set ${lines.join("; ")} on ${result.name}'s page${where(live)}. A line set here replaces the old one.`, result);
  },
);

server.registerTool(
  "set_location",
  {
    title: "Set where scenes happen",
    description:
      "Set the place of one or more cards: where the scene happens, as the writer would say it ('the piano shop', 'the flat, kitchen') — a phrase, not a slugline. The same phrase on several cards is one place in the Cast panel; an empty string clears it. list_board shows each card's place as 'at: …'.",
    inputSchema: { ids: z.array(z.string()).min(1), location: z.string() },
  },
  async (args) => {
    const { state, changed, result, live } = await commit({
      type: "set_location",
      ids: args.ids,
      location: args.location,
    });
    if (!changed) {
      const known = args.ids.filter((id) => state.notes.some((note) => note.id === id));
      if (known.length === 0) return ok(`No cards with ids ${args.ids.join(", ")}. Call list_board.`);
      return ok("No place changed: those cards already read that way.");
    }
    const place = result[0].location;
    // A near match on the wall is probably the same place spelled twice.
    const wanted = (place ?? "").trim().toLowerCase();
    const near = wanted
      ? [...new Set(state.notes.map((note) => (note.location ?? "").trim()).filter(Boolean))].filter(
          (other) => other.toLowerCase() !== wanted && (other.toLowerCase().includes(wanted) || wanted.includes(other.toLowerCase())),
        )
      : [];
    const warn = near.length ? ` The wall also has ${near.map((other) => `"${other}"`).join(", ")} — the same place spelled twice, or two places? Each distinct phrase counts as one place.` : "";
    return ok(
      `${result.length} card(s) now ${place ? `at ${place}` : "nowhere"}${where(live)}.${warn}${stillOpen(result)}`,
      result,
    );
  },
);

server.registerTool(
  "remove_character",
  {
    title: "Remove character",
    description:
      "Remove a person from the project's cast by id. They leave every card they were on here; the cards themselves stay. Refused while another board of the project has them on a card: take them off there first.",
    inputSchema: { id: z.string() },
  },
  async (args) => {
    const { state, boardId } = await readBoard();
    const person = state.characters.find((character) => character.id === args.id);
    if (!person) return ok(`No character with id ${args.id}. Call list_board for the cast.`);
    const { project, boards } = await readProject();
    const elsewhere = castElsewhere(project, boards, boardId ?? project.activeBoardId)[args.id] ?? [];
    if (elsewhere.length) {
      return ok(
        `"${person.name}" stays: the cast is the project's, and a person leaves it only when no board has them on a card — they are on ${elsewhere.map((item) => `${item.cards} card${item.cards === 1 ? "" : "s"} of "${item.board}"`).join(" and ")}. open_board there and cast them off those cards first, or leave them.`,
      );
    }
    const { changed, live } = await commit({ type: "remove_character", id: args.id });
    if (!changed) return ok(`No character with id ${args.id}. Call list_board for the cast.`);
    return ok(`Removed "${person.name}" from the project's cast and from every card${where(live)}.`);
  },
);

server.registerTool(
  "cast",
  {
    title: "Cast a scene",
    description:
      "Set who is in one or more cards of the open board (open_board first for another board's cards). Takes card ids and character names or ids; the list replaces the card's cast, so pass everyone who is in the scene. An empty list clears it. A name not yet in the cast is added to it, as create_note does, and the reply says so — the writer named them, so it is not inventing; a role is a name.",
    inputSchema: {
      noteIds: z.array(z.string()).min(1),
      characters: z.array(z.string()),
    },
  },
  async (args) => {
    // A name the cast does not have is added to it in the same frame, as
    // create_note does — two tools, one rule (round seventeen, entry 14).
    const added = [];
    const { state, changed, value: result, live } = await commitAll(`cast ${args.noteIds.length} card(s)`, (step, current) => {
      const characterIds = [];
      for (const who of args.characters) {
        const wanted = who.trim().toLowerCase();
        let person = current().characters.find((character) => character.id === who || character.name.trim().toLowerCase() === wanted);
        if (!person && wanted) {
          person = step({ type: "add_character", name: who.trim() }).result;
          if (person) added.push(`${person.name} (${person.id})`);
        }
        if (person && !characterIds.includes(person.id)) characterIds.push(person.id);
      }
      return step({ type: "set_cast", ids: args.noteIds, characterIds }).result;
    });
    const characterIds = (result ?? []).length ? result[0].characterIds : [];
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
      `${result.length} card(s) now cast ${names.length ? names.join(", ") : "nobody"}: ${result.map((note) => `"${note.headline}"`).join(", ")}${added.length ? ` (added to the cast: ${added.join(", ")})` : ""}${where(live)}.${stillOpen(result)}`,
      result,
    );
  },
);

// --- Groups -----------------------------------------------------------

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
    return ok(`Grouped ${result.noteIds.length} cards as "${result.title}" (group id ${result.id})${where(live)}.`, result);
  },
);

server.registerTool(
  "add_to_group",
  {
    title: "Add cards to a group",
    description:
      "Put one or more cards into a group that already exists — the agent's side of dragging a card into a frame. The frame reaches the cards where they are; nothing moves. A card is in one group at a time, so it leaves any other frame on the way, and a frame left with one card dissolves. Needs the group's id and the cards' ids from list_board; organize keeps a group together as a block.",
    inputSchema: { id: z.string(), noteIds: z.array(z.string()).min(1) },
  },
  async (args) => {
    const { state, changed, result, live } = await commit({ type: "add_to_group", id: args.id, noteIds: args.noteIds });
    if (!changed) {
      if (!state.groups.some((group) => group.id === args.id)) return ok(`No group with id ${args.id}. Call list_board for the real ids; create_group makes a new frame.`);
      const missing = args.noteIds.filter((id) => !state.notes.some((note) => note.id === id));
      return ok(missing.length ? `Nothing added: not on the board — ${missing.join(", ")}. Call list_board to check the ids.` : "Nothing added: those cards are in that group already.");
    }
    const names = result.added.map((id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`).join(", ");
    const left = result.left
      .map((group) => (group.dissolved ? ` "${group.title}" dissolved on the way: a frame needs two cards.` : ` Left "${group.title}", which keeps ${group.remaining} card${group.remaining === 1 ? "" : "s"}.`))
      .join("");
    const inOrder = storyOrder(state).filter((note) => result.group.noteIds.includes(note.id)).map((note) => `"${note.headline}"`).join(", ");
    return ok(`Added ${names} to "${result.group.title}", which now holds ${result.group.noteIds.length} cards, in story order: ${inOrder}${where(live)}. The frame reaches them where they are; organize lays the group out as a block.${left}`, result);
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

// --- Arrows -----------------------------------------------------------

server.registerTool(
  "create_arrow",
  {
    title: "Create arrow",
    description:
      "Draw a directed arrow from one card to another. kind 'follows' (the default) says what comes after what — a straight sequence needs them too: organize lays the wall out along them, and the wall asks about a card no arrow touches; kind 'setup' says the first card plants something the second pays off. Arrows are one-way: A→B does not create B→A. If you want both, call this twice — that is two arrows, not one two-headed line. A card cannot point at itself, and the same direction cannot be drawn twice, whatever its kind; use set_arrow_kind to change one.",
    inputSchema: { from: z.string(), to: z.string(), kind: arrowKindSchema.optional() },
  },
  async (args) => {
    const { boardId } = await readBoard();
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
      const { project: wholeProject, boards: allBoards } = await readProject();
      const elsewhere = (id) => wholeProject.boards.find((meta) => meta.id !== (boardId ?? wholeProject.activeBoardId) && isBoardState(allBoards[meta.id]) && allBoards[meta.id].notes.some((note) => note.id === id));
      const missing = (id) => {
        const other = elsewhere(id);
        return other ? `card ${id} is on another board, "${other.name}" — an arrow stays on one board; a fold that pays off there is set_plant with later: "${other.name}"` : `there is no card with id ${id}`;
      };
      const why =
        args.from === args.to
          ? "a card cannot point at itself"
          : !onBoard(args.from)
            ? missing(args.from)
            : !onBoard(args.to)
              ? missing(args.to)
              : "that arrow already exists";
      return ok(`No arrow drawn: ${why}. Call list_board to check.`);
    }
    const name = (id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`;
    const paidOff = result.kind === "setup" && state.notes.find((note) => note.id === args.from)?.plants ? ` The fold on ${name(args.from)} is paid off now; the wall stops asking where it comes back.` : "";
    return ok(
      result.kind === "setup"
        ? `Drew ${name(args.from)} → ${name(args.to)} as a setup: the first plants what the second pays off${where(live)}.${paidOff}`
        : `Drew ${name(args.from)} → ${name(args.to)}: the second follows the first${where(live)}.`,
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
    const arrow = state.arrows.find((item) => item.id === args.id);
    const tail = arrow ? state.notes.find((note) => note.id === arrow.from) : null;
    const paidOff = args.kind === "setup" && tail?.plants ? ` The fold on "${tail.headline}" is paid off now; the wall stops asking where it comes back.` : "";
    return ok(`That arrow is now '${args.kind}'${where(live)}.${paidOff}`);
  },
);

// --- The project ------------------------------------------------------

function describeBoards(project, boards, changedAt = null) {
  return project.boards
    .map((board, index) => {
      const state = boards[board.id];
      const open = board.id === project.activeBoardId ? " (open)" : "";
      const shape =
        state && isBoardState(state)
          ? `${state.notes.length} cards, about ${formatPages(boardEighths(normalizeState(state)))} of ${formatPages(normalizeState(state).targetEighths)} pages`
          : "no cards";
      const changed = changedAt?.[board.id] ? `, last changed ${changedAt[board.id]}` : "";
      return `  ${index + 1}. ${board.id} — "${board.name}"${open}: ${shape}${changed}`;
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
    const { project, boards, live, base, changedAt } = await readProject();
    return ok(
      [
        `Project "${project.name}" (${door(live, base)})`,
        `premise: ${project.premise ? `"${project.premise}"` : "(not set)"}`,
        `boards: ${project.boards.length}`,
        describeBoards(project, boards, changedAt),
        // The project's length as one line, so a series is not arithmetic by hand (round fifteen, entry 38).
        ...(project.boards.length > 1
          ? (() => {
              const states = project.boards.map((meta) => (isBoardState(boards[meta.id]) ? normalizeState(boards[meta.id]) : null)).filter(Boolean);
              const pages = states.reduce((sum, state) => sum + boardEighths(state), 0);
              const target = states.reduce((sum, state) => sum + state.targetEighths, 0);
              const cards = states.reduce((sum, state) => sum + state.notes.length, 0);
              return [`the whole project: ${cards} cards, about ${formatPages(pages)} of ${formatPages(target)} pages across ${states.length} boards (each board's runtime is an estimate unless every scene is written)`];
            })()
          : []),
      ].join("\n"),
      project,
    );
  },
);

server.registerTool(
  "set_premise",
  {
    title: "Set the project's premise",
    description:
      "Set the project's premise: the line above every board's logline, held by the project whatever its board count — what a series is about, or what is true before a film starts ('the winter the shop closes'). An empty string clears it. Boards keep their own loglines.",
    inputSchema: { premise: z.string() },
  },
  async (args) => {
    const { project, boards, rev, base, live } = await readProject();
    const next = setPremise(project, args.premise);
    if (next === project) return ok("Premise unchanged.");
    await writeProject(next, boards, rev, base);
    return ok(`Premise ${next.premise ? `set to "${next.premise}"` : "cleared"}${where(live)}.`, next);
  },
);

server.registerTool(
  "rename_project",
  {
    title: "Rename the project",
    description: "Rename the project — the name at the top of the wall, over every board.",
    inputSchema: { name: z.string().min(1) },
  },
  async (args) => {
    const { project, boards, rev, base, live } = await readProject();
    const next = renameProject(project, args.name);
    if (next === project) return ok("Project name unchanged.");
    await writeProject(next, boards, rev, base);
    // The line at the head of every reply names the project it works; it must
    // follow the rename (round fifteen, entry 40).
    if (accountDoor) workingProject(next.id, next.name);
    const several = (next.boards ?? []).length > 1;
    return ok(`Project renamed to "${next.name}"${where(live)}. It shows at the head of every reply, in list_boards and read_wall, and as the title of every script out${several ? `, where each board follows it as an episode line (Episode 1 of ${next.boards.length} · ${next.boards[0].name})` : ""}. The boards keep their names.`, next);
  },
);

// Reminders: the writer's principles, read before touching the wall.
function currentReminders(reminders) {
  return Array.isArray(reminders) ? reminders : DEFAULT_REMINDERS;
}

server.registerTool(
  "list_reminders",
  {
    title: "List reminders",
    description:
      "The writer's reminders: the principles they keep in front of themselves (six built in, plus their own). Read these before building or reading a wall; they are the house style.",
    inputSchema: {},
  },
  async () => {
    let read;
    try {
      read = await readProject();
    } catch (error) {
      if (!(error instanceof DoorReply)) throw error;
      // No project on the account yet: the house principles still exist, and
      // an agent is told to read them before it changes anything (round ten).
      const house = currentReminders(null);
      return ok(
        [
          `reminders (${error.message.replace(/\.$/, "")}): ${house.length} — the house principles the app starts every project with; the writer's own will live on the project`,
          ...house.map((item) => `  - ${item.id} (built in) — ${item.title}: ${item.body}`),
        ].join("\n"),
        house,
      );
    }
    const { reminders, live, project, base } = read;
    const list = currentReminders(reminders);
    const own = list.filter((item) => !item.builtIn).length;
    return ok(
      [
        `reminders on "${project.name}" (${door(live, base)}): ${list.length} — ${list.length - own} the house principles the app starts with (built in), ${own} the writer's own${own === 0 ? "; add_reminder adds one the writer asks to keep" : ""}. Reminders live on the project and go with it`,
        ...list.map((item) => `  - ${item.id}${item.builtIn ? " (built in)" : ""} — ${item.body.replace(/\.$/, "").startsWith(item.title.replace(/\.$/, "")) ? item.body : `${item.title}: ${item.body}`}`),
      ].join("\n"),
      list,
    );
  },
);

server.registerTool(
  "add_reminder",
  {
    title: "Add a reminder",
    description:
      "Add a reminder to the writer's list: a body (the principle, a sentence or two) and an optional title; without one the first sentence is the title. Add only what the writer asked to keep in front of them.",
    inputSchema: { body: z.string().min(1), title: z.string().optional() },
  },
  async (args) => {
    const { project, boards, reminders, rev, base, live } = await readProject();
    const list = currentReminders(reminders);
    const body = args.body.trim();
    const title = args.title?.trim() || titleFromBody(body) || "Reminder";
    const reminder = { id: crypto.randomUUID(), title, body, builtIn: false, createdAt: new Date().toISOString() };
    await writeProject(project, boards, rev, base, [...list, reminder]);
    return ok(`Added reminder "${title}"${where(live)}.`, reminder);
  },
);

server.registerTool(
  "remove_reminder",
  {
    title: "Remove a reminder",
    description: "Remove a reminder by id, built in or the writer's own. list_reminders has the ids.",
    inputSchema: { id: z.string() },
  },
  async (args) => {
    const { project, boards, reminders, rev, base, live } = await readProject();
    const list = currentReminders(reminders);
    if (!list.some((item) => item.id === args.id)) return ok(`No reminder with id ${args.id}. Call list_reminders.`);
    await writeProject(project, boards, rev, base, list.filter((item) => item.id !== args.id));
    return ok(`Removed reminder ${args.id}${where(live)}.`);
  },
);

server.registerTool(
  "list_projects",
  {
    title: "List the writer's projects",
    description:
      "Through the account door (PLOTCODER_EMAIL and PLOTCODER_PASSWORD in the environment, no app open): every project the writer is on, newest first, with its people, marking the one this server is working. Through the dev bridge or the file there is one project, the open one.",
    inputSchema: {},
  },
  async () => {
    const account = await findAccount();
    if (!account) {
      if (accountRefusal) return ok(accountRefusal);
      const { project, live } = await readProject();
      return ok(`No account door: working "${project.name}" ${live ? "on the open app" : "from the file"}. Set PLOTCODER_EMAIL and PLOTCODER_PASSWORD to work the writer's account directly.`);
    }
    const projects = await accountProjects();
    return ok(
      [
        `projects: ${projects.length} (as ${account.email})${projects.length === 0 ? ` — ${noProjectYet()}` : ""}`,
        ...projects.map((row) => `  - ${row.id} — "${row.record.name}"${row.id === account.projectId ? " (working)" : ""}: ${row.record.boards.length} board(s) · ${(row.people ?? []).join(", ")}`),
      ].join("\n"),
      projects.map((row) => ({ id: row.id, name: row.record.name, boards: row.record.boards.length, people: row.people })),
    );
  },
);

server.registerTool(
  "open_project",
  {
    title: "Open a project",
    description: "Through the account door: work another of the writer's projects, by name or id from list_projects. Every tool then works on it.",
    inputSchema: { project: z.string().min(1) },
  },
  async (args) => {
    const account = await findAccount();
    if (!account) return shut("No account door: there is one project here, the open one. Set PLOTCODER_EMAIL and PLOTCODER_PASSWORD to work the writer's account.");
    const projects = await accountProjects();
    const wanted = args.project.trim().toLowerCase();
    const found = projects.find((row) => row.id === args.project) ?? projects.find((row) => row.record.name.trim().toLowerCase() === wanted);
    if (!found) return ok(`No project called "${args.project}". Call list_projects.`);
    workingProject(found.id, found.record.name, projects.length);
    joinPresence(found.id);
    return ok(`Working "${found.record.name}" (${found.id}) now, as ${account.email}.${oneCallHint(found.record)}`, { id: found.id, name: found.record.name });
  },
);

server.registerTool(
  "claim_account",
  {
    title: "Make the writer's account",
    description:
      "Make a PlotCoder account for the writer: their email and a password they chose (any password, no rules). Ask them for both; never invent a password. The account is the same one the door makes; the writer signs in at the wordmark on any device with it. This server then works the account for the rest of the session. The wall it was working on becomes the account's first project — unless it is the sample wall, which is never uploaded; then the account is empty until new_project. Refuses an address that already has an account.",
    inputSchema: { email: z.string().min(3), password: z.string().min(1) },
  },
  async (args) => {
    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ok("That does not look like an email address.");
    if (env.PLOTCODER_EMAIL && accountDoor) return ok(`Already signed in as ${accountDoor.email}. Sign out of the environment first to make another account.`);
    let response;
    try {
      response = await fetch(`${SUPABASE_URL}/functions/v1/account`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ action: "claim", email, password: hashPassword(email, args.password) }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (error) {
      return ok(`Could not reach the account service: ${error instanceof Error ? error.message : String(error)}`);
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (payload.error === "taken") return ok(`${email} already has an account. Sign in with it (PLOTCODER_EMAIL and PLOTCODER_PASSWORD), or the writer can use Forgotten? at the door.`);
      return ok(`Could not make the account: ${payload.error ?? response.status}`);
    }
    // Work it from here on: the door reads the environment, so set it for this process.
    env.PLOTCODER_EMAIL = email;
    env.PLOTCODER_PASSWORD = args.password;
    accountDoor = null;
    accountTried = false;
    accountRefusal = null;
    const account = await findAccount();
    if (!account) return ok(`Made the account for ${email}, but could not sign in with it yet: ${accountRefusal ?? "no reason came back"}`);
    return ok(
      account.projectId
        ? `Made the account for ${email} and working it now. The wall here is its first project; the writer signs in at the wordmark on any device with this email and the password they gave.`
        : `Made the account for ${email} and working it now. It holds no project yet: new_project starts the writer's first, and the sample wall in this folder was not uploaded. The writer signs in at the wordmark on any device with this email and the password they gave.`,
      { email, project: account.projectId },
    );
  },
);

server.registerTool(
  "new_project",
  {
    title: "Start a project",
    description:
      "Through the account door: start a new project of the writer's with this name — one empty board, nothing on it — and work it from now on. The writer sees it under Projects on every device.",
    inputSchema: { name: z.string().min(1), board: z.string().optional(), pages: pagesSchema.optional(), minutes: z.number().positive().optional() },
  },
  async (args) => {
    const account = await findAccount();
    if (!account) return shut("No account door: there is one project here, the open one. Set PLOTCODER_EMAIL and PLOTCODER_PASSWORD to start another on the writer's account.");
    let record = renameProject(emptyProject(), args.name.trim());
    if (args.board?.trim()) record = renameBoard(record, record.activeBoardId, args.board.trim());
    const inserted = await account.client.from("projects").insert({ id: record.id, record, reminders: null, rev: 1 });
    if (inserted.error) return ok(`Could not start the project: ${inserted.error.message}`);
    const target = args.pages ?? args.minutes;
    const state = target === undefined ? emptyState() : { ...emptyState(), targetEighths: toEighths(target) };
    const board = await account.client.from("boards").insert({ id: record.activeBoardId, project_id: record.id, state, rev: 1, updated_by: null });
    if (board.error) return ok(`Started "${record.name}" but could not make its first board: ${board.error.message}`);
    workingProject(record.id, record.name, (account.projectCount ?? 0) + 1);
    joinPresence(record.id);
    const targetLine = target === undefined ? ` Its target is ${formatPages(state.targetEighths)} pages, the default for a feature; set_target for a pilot or a half-hour, or pass pages or minutes here.` : ` Its target is ${formatPages(state.targetEighths)} pages.`;
    const first = record.boards[0];
    return ok(`Started "${record.name}" (${record.id}) with its first board "${first.name}" (${first.id}), and working it now, as ${account.email}.${targetLine}${oneCallHint(record)}`, { id: record.id, name: record.name, boardId: first.id, boardName: first.name, targetEighths: state.targetEighths });
  },
);


server.registerTool(
  "delete_project",
  {
    title: "Delete a project",
    description:
      "Through the account door: delete one of the writer's own projects, by name or id from list_projects — its boards, its cards and its files. Cannot be undone, not from the wall either: ask the writer first, and export_project first if they might want it back. Without confirm it only says what would go; pass confirm: true to delete. A project merely shared with the writer is not theirs to delete.",
    inputSchema: { project: z.string().min(1), confirm: z.boolean().optional() },
  },
  async (args) => {
    const account = await findAccount();
    if (!account) return shut("No account door: there is one project here, the open one; delete_board removes its boards. Set PLOTCODER_EMAIL and PLOTCODER_PASSWORD to work the writer's account.");
    const { all } = await ownedAndShared();
    const wanted = args.project.trim().toLowerCase();
    const found = all.find((row) => row.id === args.project) ?? all.find((row) => row.record.name.trim().toLowerCase() === wanted);
    if (!found) return ok(`No project called "${args.project}". Call list_projects.`);
    if (found.owner !== account.user.id) return ok(`"${found.record.name}" is not the writer's to delete: it is shared with them by ${(found.people ?? [])[0] ?? "its owner"}. Only its owner can delete it.`);
    const plan = await deletionPlan(found);
    if (!args.confirm) return ok(`Deleting ${describePlan(plan)} cannot be undone, not from the wall either. Ask the writer; export_project first if they might want it back; then pass confirm: true.`, plan);
    await deleteProjectRows(plan);
    const next = await workWhatIsLeft([plan.id]);
    return ok(`Deleted ${describePlan(plan)}, as ${account.email}. Gone from every device the writer signs in on.${next}`, plan);
  },
);

server.registerTool(
  "empty_account",
  {
    title: "Empty the account",
    description:
      "Through the account door: delete every project the writer owns — boards, cards and files — and leave the account itself, signed in and empty. Projects merely shared with the writer by others stay. Cannot be undone: ask the writer first, and export_project each project first if they might want it back. Without confirm it only says what would go; pass confirm: true to empty.",
    inputSchema: { confirm: z.boolean().optional() },
  },
  async (args) => {
    const account = await findAccount();
    if (!account) return shut("No account door: there is one project here, the open one. Set PLOTCODER_EMAIL and PLOTCODER_PASSWORD to work the writer's account.");
    const { owned, shared } = await ownedAndShared();
    const plans = [];
    for (const row of owned) plans.push(await deletionPlan(row));
    const survive = shared.length ? ` ${shared.length} project(s) shared with the writer by others stay: ${shared.map((row) => `"${row.record.name}"`).join(", ")}.` : "";
    if (plans.length === 0) return ok(`The account holds nothing of the writer's own to delete.${survive}`);
    if (!args.confirm) return ok(`Emptying the account deletes ${plans.length} project(s) of the writer's own: ${plans.map(describePlan).join("; ")}. Cannot be undone. Ask the writer, or if they have already said so, pass confirm: true now; export_project each first if they might want them back.${survive}`, plans);
    for (const plan of plans) await deleteProjectRows(plan);
    const next = await workWhatIsLeft(plans.map((plan) => plan.id));
    return ok(`Emptied the account as ${account.email}: deleted ${plans.map(describePlan).join("; ")}.${survive}${next}`, plans);
  },
);

server.registerTool(
  "delete_account",
  {
    title: "Delete the account",
    description:
      "Through the account door: delete the writer's account itself — every project they own, its files, and the sign-in. Cannot be undone; the address can be claimed again afterwards, empty. Ask the writer first, and export_project first if they might want anything back. Without confirm it only says what would go; pass confirm: true to delete. The door is shut afterwards.",
    inputSchema: { confirm: z.boolean().optional() },
  },
  async (args) => {
    const account = await findAccount();
    if (!account) return shut("No account door: nothing here is an account. Set PLOTCODER_EMAIL and PLOTCODER_PASSWORD to work the writer's account.");
    const { owned, shared } = await ownedAndShared();
    const plans = [];
    for (const row of owned) plans.push(await deletionPlan(row));
    const what = plans.length ? ` and ${plans.length} project(s) of the writer's own: ${plans.map(describePlan).join("; ")}` : "";
    const survive = shared.length ? ` ${shared.length} project(s) shared with the writer by others stay with their owners.` : "";
    if (!args.confirm) return ok(`Deleting the account ${account.email} takes the sign-in${what}. Cannot be undone; the address can be claimed again, empty. Ask the writer; export_project first; then pass confirm: true.${survive}`, plans);
    const session = await account.client.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) return ok("Could not delete the account: no session token came back. Nothing was deleted; sign in again and retry.");
    let response;
    try {
      response = await fetch(`${SUPABASE_URL}/functions/v1/account`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "delete_account", email: account.email }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      return ok(`Could not reach the account service: ${error instanceof Error ? error.message : String(error)}. Nothing was deleted.`);
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return ok(`The account service refused to delete the account: ${payload.error ?? response.status}. Nothing was deleted.`);
    if (account.channel) void account.client.removeChannel(account.channel);
    await account.client.auth.signOut().catch(() => {});
    const email = account.email;
    accountDoor = null;
    accountTried = true;
    accountRefusal = `The account ${email} was deleted at the writer's ask, so the door is shut. claim_account makes a new one with that address or another.`;
    return ok(`Deleted the account ${email}${what}. The writer cannot sign in with it any more; claim_account makes a new one. This server's door is shut now.${survive}`, plans);
  },
);

server.registerTool(
  "export_project",
  {
    title: "Save the project as a file",
    description:
      "The project the server is working, as the file Save project writes and Open project takes: the record, every board with its cards, the reminders and the writer's structures. Pass path to write it (a .json) — an absolute path, since a relative one resolves from the server's own folder, not yours; without a path, the reply's JSON is the file. Pictures and takes on the account are not in the file. Works through every door.",
    inputSchema: { path: z.string().optional() },
  },
  async (args) => {
    if (args.path && hosted()) return ok("The hosted door has no disk to write to: call export_project without a path and the reply's JSON is the file.");
    const { project, boards, reminders } = await readProject();
    const file = toProjectFile({ project, boards, reminders: reminders ?? null });
    const cards = countCards(boards);
    const ownReminders = (reminders ?? []).filter((item) => !item.builtIn).length;
    const builtInReminders = (reminders ?? []).length - ownReminders;
    const what = `"${project.name}": ${project.boards.length} board(s) — ${project.boards.map((meta) => `"${meta.name}" (${isBoardState(boards[meta.id]) ? boards[meta.id].notes.length : 0} cards)`).join(", ")} — ${cards} card(s) in all${reminders?.length ? `, ${reminders.length} reminder(s) (${builtInReminders} built in, ${ownReminders} the writer's own)` : ", the six built-in reminders come with every project and no reminders of the writer's own (none to write)"}${project.structures?.length ? `, ${project.structures.length} structure(s)` : ", no structures of the writer's own (none to write)"}. Pictures and takes on the account are not in the file`;
    if (args.path) {
      fs.mkdirSync(path.dirname(path.resolve(args.path)), { recursive: true });
      fs.writeFileSync(args.path, JSON.stringify(file, null, 2));
      return ok(`Saved ${what}. Written to ${path.resolve(args.path)}: Open project in the app takes it, import_project brings it onto an account.`, { path: path.resolve(args.path), boards: project.boards.length, cards });
    }
    return ok(`The project as a file — ${what}. The JSON below is the file; write it to a .json for Open project or import_project.`, file);
  },
);

server.registerTool(
  "import_project",
  {
    title: "Open a project file",
    description:
      "Bring a project file — the one Save project writes, or export_project — in. Through the account door it becomes a NEW project on the writer's account, worked from then on; nothing already there is touched. Through the open app or the file it replaces the project there, as Open project does: without confirm it says what it would replace; pass confirm: true to do it. Pass path or text.",
    inputSchema: { path: z.string().optional(), text: z.string().optional(), confirm: z.boolean().optional() },
  },
  async (args) => {
    if (args.path && hosted()) return ok("The hosted door has no disk to read from: pass the file's contents as text.");
    const source = args.text ?? (args.path ? fs.readFileSync(args.path, "utf8") : null);
    if (source === null) return ok("Nothing to import: pass a path or text.");
    let parsed;
    try {
      parsed = JSON.parse(source);
    } catch {
      return ok("That is not JSON, so not a PlotCoder project file.");
    }
    const opened = fromProjectFile(parsed);
    if (!opened) return ok("That is not a PlotCoder project file: it holds no project record and no board.");
    const cards = countCards(opened.boards);
    if (accountEnv()) {
      const account = await findAccount();
      if (!account) return ok(accountRefusal ?? "The account door is shut.");
      const { renamed, ...fresh } = reidentifyProject(opened.project);
      const record = normalizeProject(fresh);
      const inserted = await account.client.from("projects").insert({ id: record.id, record, reminders: opened.reminders, rev: 1 });
      if (inserted.error) return ok(`Could not import the project: ${inserted.error.message}`);
      for (const meta of record.boards) {
        const oldId = Object.keys(renamed).find((key) => renamed[key] === meta.id);
        const state = oldId && isBoardState(opened.boards[oldId]) ? normalizeState(opened.boards[oldId]) : emptyState();
        const board = await account.client.from("boards").insert({ id: meta.id, project_id: record.id, state, rev: 1, updated_by: null });
        if (board.error) return ok(`Imported "${record.name}" but could not make its board "${meta.name}": ${board.error.message}`);
      }
      workingProject(record.id, record.name, (account.projectCount ?? 0) + 1);
      joinPresence(record.id);
      return ok(
        `Imported "${record.name}" onto the account as a new project (${record.id}): ${record.boards.length} board(s), ${cards} card(s). Working it now, as ${account.email}; the writer sees it under Projects on every device.${oneCallHint(record)}`,
        { id: record.id, name: record.name, boards: record.boards.length, cards },
      );
    }
    const { project: current, boards: currentBoards, rev, base, live } = await readProject();
    const incoming = `"${opened.project.name}" (${opened.project.boards.length} board(s), ${cards} card(s))`;
    const here = `"${current.name}" (${current.boards.length} board(s), ${countCards(currentBoards)} card(s)) on ${live ? "the open app" : "the file"}`;
    if (!args.confirm) return ok(`Importing ${incoming} here would replace ${here}, as Open project does. Ask the writer; export_project first if they might want it back; then pass confirm: true.`);
    const written = await writeProject(opened.project, opened.boards, rev, base, opened.reminders);
    const active = opened.boards[opened.project.activeBoardId] ?? emptyState();
    const { rev: boardRev } = await readBoard();
    await writeBoard(active, boardRev, base, opened.project.activeBoardId);
    trail.length = 0;
    undone.length = 0;
    return ok(`Imported ${incoming}, replacing ${here}${where(written)}. Nothing of mine is left to undo.`, { id: opened.project.id, name: opened.project.name, boards: opened.project.boards.length, cards });
  },
);

server.registerTool(
  "open_board",
  {
    title: "Open board",
    description:
      "Open another board of the project by id, name, or number from list_boards. Every card tool then works on that board; the open wall switches too.",
    inputSchema: { board: z.union([z.string().min(1), z.number()]) },
  },
  async (args) => {
    const { project, boards, rev, base } = await readProject();
    const target = findBoard(project, String(args.board));
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
      `Added "${board.name}" (${board.id}) and opened it${where(live)}: every card call lands there now, and the writer's open wall switched with it; open_board ${project.boards.findIndex((item) => item.id === project.activeBoardId) + 1} returns to "${project.boards.find((item) => item.id === project.activeBoardId)?.name ?? "the one before"}". It is empty, and the project's cast is already there to cast from. The logline is the story's question when the writer has one — leave it empty rather than invent it — and the cards come next.${next.name === "Untitled project" ? " The project is still \"Untitled project\": rename_project names it." : ""}${next.boards.length === 2 && isSampleWall(isBoardState(boards[next.boards[0].id]) ? normalizeState(boards[next.boards[0].id]) : emptyState()) ? " The sample stays as Board 1; delete_board drops it." : ""}`,
      board,
    );
  },
);

server.registerTool(
  "rename_board",
  {
    title: "Rename board",
    description: "Rename a board of the project by id, name, or number.",
    inputSchema: { board: z.union([z.string().min(1), z.number()]), name: z.string().min(1) },
  },
  async (args) => {
    const { project, boards, rev, base } = await readProject();
    const target = findBoard(project, String(args.board));
    if (!target) return ok(`No board matches "${args.board}". Call list_boards for the real ones.`);
    const next = renameBoard(project, target.id, args.name);
    if (next === project) return ok(`"${target.name}" already has that name.`);
    const live = await writeProject(next, boards, rev, base);
    return ok(`Renamed board "${target.name}" (${target.id}) to "${args.name.trim()}"${where(live)}.`, { id: target.id, name: args.name.trim() });
  },
);

server.registerTool(
  "delete_board",
  {
    title: "Delete board",
    description:
      "Remove a board and everything on it. This cannot be undone — not from the wall either — so ask the writer first, say how many cards it holds, and suggest Save project. The last board of a project cannot be deleted. If the open board goes, the one before it opens.",
    inputSchema: { board: z.union([z.string().min(1), z.number()]) },
  },
  async (args) => {
    const { project, boards, rev, base } = await readProject();
    const target = findBoard(project, String(args.board));
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
    const { state: before } = await readBoard();
    const arrow = before.arrows.find((item) => item.id === args.id);
    const { changed, live } = await commit({ type: "delete_arrow", id: args.id });
    if (!changed) return ok(`No arrow with id ${args.id}. Call list_board for the real ids.`);
    const name = (id) => `"${before.notes.find((note) => note.id === id)?.headline ?? id}"`;
    return ok(`Deleted the ${arrow?.kind ?? "follows"} arrow ${name(arrow?.from)} → ${name(arrow?.to)}${where(live)}. Any arrow the other way is untouched.`);
  },
);


  return { server, log, accountEnv, boardFile: BOARD_FILE };
}

/** The stdio door: the server for this process, on stdin and stdout. */
export async function serveStdio(env = process.env) {
  const { server, log, accountEnv, boardFile } = createPlotcoderServer(env);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log(accountEnv() ? `ready. account door: ${env.PLOTCODER_EMAIL} (signs in on the first call)` : `ready. board file: ${boardFile}`);
}
