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
  PERSON_TEXT_FIELDS,
  emptyState,
  filledCharacterFields,
  formatPages,
  isBoardState,
  isMeasured,
  NOTE_HEIGHT,
  NOTE_WIDTH,
  DEFAULT_TARGET_EIGHTHS,
  targetWords,
  TARGET_KINDS,
  inStory,
  DEFAULT_NOTE_EIGHTHS,
  normalizeState,
  newId,
  noteEighths,
  NOTE_COLORS,
  NOTE_RANKS,
  seedState,
  unlinkedCards,
} from "../src/board/reducer.js";
import { TEMPLATES } from "../src/board/templates.js";
import { wordSentence, wordsAsText } from "../src/board/words.js";
import { fromFountain, mergeFountain, toFountain } from "../src/board/fountain.js";
import { toMarkdown, toPlainText } from "../src/board/markdown.js";
import { cameraLines, cameraVerbs } from "../src/board/camera.js";
import { fromProjectFile, toProjectFile } from "../src/board/projectFile.js";
import { describeSetAside, fromFdx, toFdx } from "../src/board/fdx.js";
import { paginate } from "../src/board/paginate.js";
import { readingOrder, storyOrder } from "../src/board/readWall.js";
import { REVISION_COLORS, revisionMarks, sceneNumbers } from "../src/board/numbering.js";
import { sceneHeading, standInFor } from "../src/board/fountain.js";
import { describePresence, presenceTail } from "../src/board/presence.js";
import { accountSessionStore, isSessionId, normalizeMemory } from "../src/board/agentSession.js";
import { agentsInstructions } from "../src/board/agents.js";
import { castLine, readMaybe } from "../src/board/castMaybe.js";
import { shapeNote } from "../src/board/shape.js";
import { segmentBrief, WORKFLOWS } from "../src/board/workflows.js";
import { DEFAULT_REMINDERS, titleFromBody } from "../src/board/reminders.js";
import crypto from "node:crypto";
import { describeRuns, describeSetups, describeUndecided, openOutsideFilm, readWall } from "../src/board/readWall.js";
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
  setTitlePage,
  setPremiseOpen,
  setBoardNameOpen,
  setProjectNameOpen,
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
 * options.sessionStore stands in for the account's own (src/board/agentSession.js).
 */
/**
 * A call that failed before it answered says so in words, not as a bare
 * "TypeError: fetch failed" (pass 1a, entry 8): what failed, what it most
 * likely means, and what to do.
 */
export function failedCallReply(name, error) {
  const message = error instanceof Error ? error.message : String(error);
  const network = /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|network|timeout/i.test(message);
  return `${name} failed before it answered: ${message}. ${network ? "That is the account not answering for a moment — the network, or the door — not a refusal: call it again." : "Call it again; if it fails twice the same way, tell the writer what it said."} Anything the call wrote before failing stands; list_board shows what landed.`;
}

export function createPlotcoderServer(env = process.env, options = {}) {

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
  // The files by name (pass 1a, entry 7): a kept export goes with them, and an agent that never listed them cannot know.
  const files = plan.files.length ? `${plan.files.length} file(s): ${plan.files.map((file) => file.split("/").pop()).join(", ")}` : "no files";
  return `"${plan.name}" (${plan.id}): ${plan.boards} board(s), ${plan.cards} card(s), ${files}`;
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
  newWallInHand();
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
    // Whether presence has arrived: until it has, an empty list is not "nobody" (round twenty-two, entries 93 to 95).
    accountDoor.presenceSynced = false;
    channel.on("presence", { event: "sync" }, () => {
      accountDoor.presenceSynced = true;
    });
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
/**
 * The wall at a glance, at the head of read_wall and list_board (R67): how many
 * questions it asks, how much the writer has left open, how much is unwritten.
 * Three counts and no verdict (D21), so a quiet wall is never taken for a
 * finished one: round twenty-two's wall asked one question with seventeen
 * things open.
 */
function atAGlance(state, reading, project = null, boardMeta = null) {
  const inFilm = state.notes.filter((note) => !note.alternativeOf && !note.aside);
  const open =
    reading.open.length +
    reading.openFields.length +
    (reading.openLines?.length ?? 0) +
    (reading.openPeople?.length ?? 0) +
    (state.targetOpen ? 1 : 0) +
    (project?.nameOpen ? 1 : 0) +
    (project?.premiseOpen ? 1 : 0) +
    (boardMeta?.nameOpen ? 1 : 0);
  const unwritten = inFilm.filter((note) => !(note.text ?? "").trim()).length;
  const asked = reading.findings.length;
  // What is open on a card set aside or behind as a version is listed below, so it is said here: the head and the list must add up (round twenty-three, entry 37).
  const outside = openOutsideFilm(state);
  return `this wall: ${asked} question${asked === 1 ? "" : "s"} asked · ${open} thing${open === 1 ? "" : "s"} left open by the writer's word${outside ? ` (and ${outside} more on cards not in the film)` : ""} · ${unwritten} of ${inFilm.length} scene${inFilm.length === 1 ? "" : "s"} unwritten`;
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
  newWallInHand();
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
/** Whether this session has read a wall yet: until it has, a write's tail counts the questions and points at read_wall; after, it quotes them (the handover's call 2). */
let readOnce = false;
/**
 * A different wall is in hand — a project started or opened, a board opened or
 * made, the working project deleted: what this session had read was another
 * wall, so "the session's first reading" is the first reading of THIS one
 * (round twenty-three: the on-ramp's first calls read a stale wall, and the
 * count-and-point tail never appeared for the build that followed). Held in
 * the session's memory, so it is true through the hosted door too.
 */
function newWallInHand() {
  readOnce = false;
  lastReading = null;
  sinceRead.length = 0;
}

/** What the last write did to the wall's questions and runtime, said once on that write's tail (round fourteen, entries 18, 19, 42). */
let lastChange = null;
// The same question in the same words is the same question, whatever order its names come in (round seventeen, entry 21).
const findingKey = (finding) => `${finding.kind}|${[...finding.ids].sort().join(",")}`;
/** Set by a tool whose write can change the story's shape — a reorder, a cut, a delete, a choice of version, a scene wired in — so the next change's tail says what it did to the runs, the ending and the wall's order (round twenty-three, entries 30, 31, 50, 52, 72). */
let shapeAsked = null;
function askShape(options = {}) {
  shapeAsked = options;
}

/** A question's words with its numbers blanked, so a run that measured longer is the same question. */
function withoutFigures(text) {
  return String(text ?? "").replace(/\d+(?:\s+\d+\/\d+|\/\d+)?/g, "#");
}

function noteChange(before, after, boardId = null) {
  // The same reading read_wall gives: a person cast on another board is not
  // asked about, so a write's tail never names a question the reading does not.
  const was = readWall(before, readOptions(boardId, before));
  const now = readWall(after, readOptions(boardId, after));
  const wasKeys = new Set(was.findings.map(findingKey));
  const nowKeys = new Set(now.findings.map(findingKey));
  const wasText = new Map(was.findings.map((finding) => [findingKey(finding), finding.text]));
  lastChange = {
    gone: was.findings.filter((finding) => !nowKeys.has(findingKey(finding))),
    came: now.findings.filter((finding) => !wasKeys.has(findingKey(finding))),
    // The same question, asked differently now: both ends open became one (round twenty-four, entry 32).
    // A sag whose pages moved with a measure is the same question with new numbers, not a new shape (pass 1a, entry 36): compare the words, not the figures.
    reshaped: now.findings.filter((finding) => wasKeys.has(findingKey(finding)) && withoutFigures(wasText.get(findingKey(finding))) !== withoutFigures(finding.text)),
    asks: now.findings.length,
    leftBefore: was.left.length,
    leftAfter: now.left.length,
    eighthsBefore: boardEighths(before),
    eighthsAfter: boardEighths(after),
    target: after.targetEighths,
    targetOpen: Boolean((after.targetOpen ?? "").trim()),
    shape: shapeAsked ? shapeNote(before, after, shapeAsked) : [],
  };
  shapeAsked = null;
}
function changeNote() {
  const change = lastChange;
  lastChange = null;
  if (!change) return "";
  const parts = [];
  // Before the session's first reading a tail counts and points: a build is
  // twelve writes whose quoted questions the next write answers (round
  // fifteen 9, eighteen 20). After it, a change is to something read, and
  // the tail quotes it.
  // The hosted door is one server per request: with no session to remember a
  // reading by it could only ever count, so there the tail quotes (round
  // twenty-two, entry 25).
  if (!readOnce && remembers() && (change.gone.length || change.came.length)) {
    parts.push(`the wall's questions have changed since your last read_wall: ${change.asks} now${change.came.length ? `, ${change.came.length} of them new` : ""} — read_wall lists them`);
  } else if (change.gone.length || change.came.length) {
    parts.push(
      `the wall now asks ${change.asks} question${change.asks === 1 ? "" : "s"}${change.gone.length ? ` (gone: ${change.gone.map((finding) => `[${finding.kind}] ${finding.text.replace(/\.$/, "")}`).join(" ")})` : ""}${change.came.length ? ` (new: ${change.came.map((finding) => `[${finding.kind}] ${finding.text.replace(/\.$/, "")}`).join(" ")})` : ""}`,
    );
  } else if ((change.reshaped ?? []).length) {
    parts.push(`the wall's questions changed shape (${change.asks}): ${change.reshaped.map((finding) => `[${finding.kind}] ${finding.text.replace(/\.$/, "")}`).join("; ")}`);
  } else {
    // Silence read as "unchanged" or "not computed" (round twenty-two, entries 66, 92): say which, with the count an agent can use.
    parts.push(`the wall's questions unchanged (${change.asks})`);
  }
  parts.push(...(change.shape ?? []));
  if (change.leftAfter !== change.leftBefore) parts.push(`left, for now: ${change.leftAfter} (was ${change.leftBefore})`);
  // An open target is not 120: the tail says the pages and that the target is open, as the reading does (round twenty-two, entry 19).
  if (change.eighthsAfter !== change.eighthsBefore)
    parts.push(change.targetOpen ? `runtime now about ${formatPages(change.eighthsAfter)} pages, the target open` : `runtime now about ${formatPages(change.eighthsAfter)} of ${formatPages(change.target)} pages`);
  // No full stop of its own: the reply it rides on ends the sentence (round sixteen, entry 11).
  return parts.length ? `; ${parts.join("; ")}` : "";
}
/** Said once per session, so a reply does not repeat its advice eighteen times (round thirteen, entry 10). */
const saidOnce = new Set();
function once(key, text) {
  // The hosted door is one server per request: with no session, "once" there
  // would be every time, nine nudges in a nine-card build (round twenty-two,
  // entry 26). The tool's description and the guide carry the advice; the
  // reply stays quiet.
  if (!remembers()) return "";
  if (saidOnce.has(key)) return "";
  saidOnce.add(key);
  return text;
}

// --- A session for the hosted door (the to-do's B1) -------------------------
//
// The stdio door is one process and the variables above are its memory. The
// hosted door makes a server per request, so there the memory rides a row of
// the writer's own on the account, keyed by the MCP session id the door
// issued on initialize (PLOTCODER_SESSION_ID): read before a tool runs, kept
// after it when it has changed. No id, no account, no table: the door
// remembers nothing and says only what is true without a memory, as before.
// The undo trail is not carried: it holds whole walls.

let sessionStore = null;
let sessionTried = false;
let sessionFresh = false;
let sessionWas = "";

/** Whether what this server remembers is the session's, not just this request's. */
function remembers() {
  return !hosted() || sessionStore !== null;
}

function sessionMemory() {
  return normalizeMemory({ readOnce, said: [...saidOnce], lastReading, sinceRead });
}

async function recallSession() {
  if (!hosted() || sessionTried) return;
  sessionTried = true;
  const id = env.PLOTCODER_SESSION_ID ?? "";
  if (!isSessionId(id)) return;
  try {
    let store = options.sessionStore ?? null;
    if (!store) {
      const account = await findAccount();
      if (!account) return;
      store = accountSessionStore(account.client, account.user.id);
    }
    const held = await store.load(id);
    if (!held) return;
    readOnce = held.memory.readOnce;
    for (const key of held.memory.said) saidOnce.add(key);
    lastReading = held.memory.lastReading;
    sinceRead.splice(0, sinceRead.length, ...held.memory.sinceRead);
    sessionFresh = held.fresh;
    sessionWas = JSON.stringify(sessionMemory());
    sessionStore = store;
  } catch (error) {
    log("session:", error instanceof Error ? error.message : String(error));
  }
}

/** Steps this request made, waiting to be kept on the session's trail once the tool has answered (the working list's X2). */
const undoQueue = [];
const wallHash = (state) => crypto.createHash("sha256").update(canon(state)).digest("hex");
function queueUndo(before, after, what, boardId) {
  if (!hosted()) return;
  undoQueue.push({ what, before, afterHash: wallHash(after), boardId: boardId ?? "", projectId: accountDoor?.projectId ?? "" });
}
/** Whether an undo of this session's own works through this door: everywhere but a hosted door with no session, or a store that keeps no trail. */
function undoKeptHere() {
  if (!hosted()) return true;
  if (sessionTried) return Boolean(sessionStore?.peekUndo);
  return isSessionId(env.PLOTCODER_SESSION_ID ?? "");
}

async function keepSession() {
  if (!sessionStore) return;
  try {
    // The trail first: a step the writer may want back matters more than which advice was said.
    while (undoQueue.length) {
      const step = undoQueue.shift();
      if (sessionStore.pushUndo) await sessionStore.pushUndo(env.PLOTCODER_SESSION_ID, step);
    }
    const memory = sessionMemory();
    const now = JSON.stringify(memory);
    // A session that has nothing to remember yet needs no row.
    if (now === sessionWas) return;
    if (await sessionStore.save(env.PLOTCODER_SESSION_ID, memory, sessionFresh)) {
      sessionWas = now;
      sessionFresh = false;
    }
  } catch (error) {
    log("session:", error instanceof Error ? error.message : String(error));
  }
}

/** A line quoted in a reply: whole when it fits, otherwise cut at a word with an ellipsis, never mid-word (round twenty-three, entry 60). */
function clip(text, max) {
  const line = String(text ?? "").trim();
  if (line.length <= max) return line;
  const cut = line.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).trimEnd()}…`;
}

function describeCommand(command) {
  switch (command.type) {
    case "create_note":
      return `create_note "${command.headline ?? ""}"`;
    case "recolor_notes":
      return "recolor_note";
    case "apply_poses":
      return "organize";
    case "create_thread":
      return `create_thread "${command.name ?? ""}"`;
    case "update_thread":
      return typeof command.startOpen === "boolean" || typeof command.endOpen === "boolean" ? "update_thread (an end tied or opened)" : "update_thread";
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
  queueUndo(state, next, describeCommand(command), boardId);
  sinceRead.push(describeCommand(command));
  noteChange(state, next, boardId);
  if (trail.length > TRAIL_CAP) trail.shift();
  undone.length = 0;
  return { state: next, changed, result, live, before: state };
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
  queueUndo(state, current, what, boardId);
  sinceRead.push(what);
  noteChange(state, current, boardId);
  if (trail.length > TRAIL_CAP) trail.shift();
  undone.length = 0;
  return { state: current, changed: true, value, live };
}

/**
 * Where a card lands when it is wired in beside another (round twenty-two, entry 63): next to that card, on the
 * side it follows from, and nothing else on the wall moves. The order is the arrows (R56); where cards sit is
 * the writer's, and a tool that re-laid nine cards to add one took that from them. If the spot is taken, the
 * card sits overlapping its neighbour, offset so both are seen; organize tidies when the writer wants that.
 */
function besidePlace(state, cardId, target, after) {
  const wanted = { x: target.x + (after ? NOTE_WIDTH + GAP : -(NOTE_WIDTH + GAP)), y: target.y };
  const taken = state.notes.some((note) => note.id !== cardId && note.id !== target.id && Math.abs(note.x - wanted.x) < NOTE_WIDTH * 0.7 && Math.abs(note.y - wanted.y) < NOTE_HEIGHT * 0.7);
  return taken ? { x: target.x + (after ? 48 : -48), y: target.y + 56 } : wanted;
}

/** What a wiring reply says now that it does not tidy. */
const NOT_TIDIED_WHY = "It sits beside the card it follows and nothing else moved: the order is the arrows, and where cards sit is the writer's. organize tidies the wall along them when that is wanted.";
/** Said in full once a session, and as three words after: eight builds buried the one new fact in each reply under the same two sentences (round twenty-three, entry 24). With no session to remember by, the short form. */
const notTidied = () => once("not-tidied", NOT_TIDIED_WHY) || "Nothing else moved.";

/** Said once per session: that cards stack until organize (round seven, finding 11). */
/** Where a new card lands when the agent gives no position: after the last card in reading order, wrapping five wide, so cards never stack (round eleven, finding 14). */
function nextPlace(state) {
  const order = storyOrder(state);
  const last = order[order.length - 1];
  if (!last) return { x: 140, y: 140 };
  const originX = Math.min(...state.notes.map((note) => note.x));
  // Every card the wall draws at its own x,y is in the way — a card set aside too, which is on the wall and off
  // the story; a version behind another is drawn behind its sibling, so its own x,y is nobody's (the issues file, A10).
  const drawn = state.notes.filter((note) => !note.alternativeOf);
  const taken = (spot) => drawn.some((note) => Math.abs(note.x - spot.x) < NOTE_WIDTH * 0.7 && Math.abs(note.y - spot.y) < NOTE_HEIGHT * 0.7);
  let spot = { x: last.x + NOTE_WIDTH + GAP, y: last.y };
  for (let tries = 0; tries < 200; tries += 1) {
    if (spot.x + NOTE_WIDTH > originX + ROW_WIDTH) spot = { x: originX, y: spot.y + NOTE_HEIGHT + GAP };
    if (!taken(spot)) return spot;
    spot = { x: spot.x + NOTE_WIDTH + GAP, y: spot.y };
  }
  return spot;
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
/** Who has a wall of the working project open on a screen now, from the presence the server already follows (the handover's call 4); never the agent itself. */
function presentPeople() {
  try {
    const state = accountDoor?.channel?.presenceState?.() ?? {};
    const names = new Set();
    for (const entries of Object.values(state)) for (const entry of entries ?? []) if (entry && typeof entry.name === "string" && !/^an agent, as /.test(entry.name)) names.add(entry.name);
    return [...names];
  } catch {
    return [];
  }
}

/** What the last account tail said about presence, so the next says it again only when it has changed. */
let lastPresenceSaid = null;

/** The account tail says what the wall shows: open on whose screen, or no wall open, never a bare "live". */
function accountTail() {
  const said = presenceTail(presentPeople(), lastPresenceSaid, hosted());
  lastPresenceSaid = said.key;
  // Through the hosted door a write answers before presence arrives, so it claims nothing about who is watching; once a session it says whose question that is.
  if (hosted() && presentPeople().length === 0) {
    const advice = once("who-is-here", "this door answers before it can see who has a wall open: who_is_here says, and a write shows on an open wall the moment it lands");
    return advice ? ` (saved to the account; ${advice})` : said.text;
  }
  return said.text;
}

function where(live) {
  const tail = live === ACCOUNT ? accountTail() : live ? " (visible on the open board)" : " (written to file; the wall shows it the next time the app runs from this folder)";
  return `${tail}${changeNote()}`;
}

/** The wall PlotCoder starts with — Maya, Tom, the letter — and nothing of the writer's yet. */
function isSampleWall(state) {
  const sample = seedState().notes.map((note) => note.headline).sort().join("\n");
  return state.notes.map((note) => note.headline).sort().join("\n") === sample;
}
/** Every check read_wall runs, so silence can be named. */
const CHECKS = ["unmarked", "sag", "empty", "unwritten", "unlinked", "duplicate", "sequence", "uncast", "nobody", "absent", "backwards", "unpaid", "unplanted", "unplaced", "loose"];
/** What each check looks for, in words, so "clean" says what was checked rather than a kind's name. */
const CHECK_WORDS = {
  unmarked: "a beat is marked",
  sag: "no run out of proportion",
  empty: "no beats back to back",
  unwritten: "no card without a headline or change line",
  unlinked: "no card without a follows arrow (a setup arrow is a claim, not a place in the story)",
  duplicate: "no two headlines alike",
  sequence: "no group too long for one sequence (act groups are not asked)",
  uncast: "nobody in the cast on no card of the film (a person only on a card set aside, or on a version behind, comes in where that card does)",
  nobody: "no card with nobody in it",
  absent: "nobody gone for a third of the story",
  backwards: "no payoff before its setup",
  unpaid: "no fold without a payoff",
  unplanted: "no payoff without its fold",
  unplaced: "no card without a place",
  loose: "no thread with a loose end",
};
/** What an open card would be asked once closed, as the question and not the check's clean form (round nineteen, entry 31). */
const ASK_WORDS = {
  unwritten: "its change line (update_note)",
  unlinked: "what comes before and after it (move_scene, or create_arrow)",
  duplicate: "which of two alike headlines it is (update_note)",
  sequence: "whether its group is one sequence",
  nobody: "who is in it (cast)",
  absent: "who has been gone too long",
  backwards: "why its payoff comes before its setup",
  unpaid: "where its fold pays off (create_arrow, kind setup)",
  unplanted: "what plants its payoff (set_plant on the card that does)",
  unplaced: "where it happens (set_location)",
};
const SAMPLE_NOTE = "sample: this is the wall PlotCoder starts with (Maya, Tom, the letter); nothing here is the writer's. Replace it, or new_board.";

// --- Reporting -------------------------------------------------------------

/**
 * The cues in a scene's text against the cast (round sixteen, entry 30): a cue
 * matches a person by the whole name, or by one word of it when only one
 * person has that word — JOE is "Joe Deasy" on a cast with one Joe, as a
 * script cues people (pass 1a, entry 32) — and the reply says which cues
 * found nobody and whom they nearly named. A cue for someone the card holds
 * as a maybe says so (entry 34): the page has given them a line, and the card
 * has not decided them.
 */
function cueReport(state, text, card = null) {
  const names = [...new Set(parseScene(text ?? "").filter((element) => element.kind === "speech" && element.name).map((element) => element.name.replace(/\s*\(.*\)\s*$/, "").trim()).filter(Boolean))];
  if (!names.length) return "";
  const cast = state.characters ?? [];
  const maybeHere = (person) => (card?.maybeCharacterIds ?? []).includes(person.id) ? ` — a maybe on this card: the page gives ${person.name} a line, and the card has not decided them; cast without the ? to decide it, or take the line off` : "";
  const parts = names.map((cue) => {
    const whole = cast.find((person) => person.name.trim().toLowerCase() === cue.toLowerCase());
    if (whole) return `${cue} (in the cast${maybeHere(whole)})`;
    const near = cast.filter((person) => person.name.toLowerCase().split(/\s+/).includes(cue.toLowerCase()));
    if (near.length === 1) return `${cue} (${near[0].name}, by one word of the name${maybeHere(near[0])})`;
    return near.length
      ? `${cue} (two or more by that word — the cast has ${near.map((person) => `"${person.name}"`).join(", ")}: cue the whole name, or the word that tells them apart)`
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

/** "20 under", "3 over" or "on it", against a target in eighths. */
function againstWord(state, targetEighths) {
  const total = boardEighths(state);
  return total > targetEighths ? `${formatPages(total - targetEighths)} over` : total < targetEighths ? `${formatPages(targetEighths - total)} under` : "on it";
}

/** The written scenes measured under the page they were read as (the handover's call 7, four rounds): a sketch is counted as measured and named. */
function sketches(state) {
  return state.notes.filter((note) => isMeasured(note) && noteEighths(note) < (note.lengthEighths ?? DEFAULT_NOTE_EIGHTHS));
}

/** The runtime's second number while a sketch stands: what the cards would come to if each sketch ran to the page it was read as. */
function sketchLine(state) {
  const found = sketches(state);
  if (!found.length) return "";
  const ifRan = boardEighths(state) + found.reduce((sum, note) => sum + ((note.lengthEighths ?? DEFAULT_NOTE_EIGHTHS) - noteEighths(note)), 0);
  return `; ${found.length} written scene${found.length === 1 ? " is a sketch" : "s are sketches"}, measured under the page ${found.length === 1 ? "it was" : "they were"} read as: about ${formatPages(ifRan)} pages if ${found.length === 1 ? "it" : "they"} ran to that`;
}

/**
 * The runtime, one labelled line per number, the one to use first (round
 * twenty-two, entries 84, 87): it was one sentence carrying two totals, three
 * kinds of count and two targets, none labelled. The same block in list_board
 * and read_wall, so the two cannot tell it differently.
 */
/** Every card in the film written: the script is whole, and its length is the paginated count (pass 1a, entries 42, 45). */
function wholeScript(state) {
  const cards = state.notes.filter((note) => inStory(note));
  return cards.length > 0 && cards.every((note) => isMeasured(note));
}

function runtimeBlock(state) {
  const total = boardEighths(state);
  const over = total - state.targetEighths;
  const made = runtimeKinds(state).replace(/^; /, "");
  const found = sketches(state);
  const ifRan = total + found.reduce((sum, note) => sum + ((note.lengthEighths ?? DEFAULT_NOTE_EIGHTHS) - noteEighths(note)), 0);
  const target = state.targetOpen
    ? `target open, by the writer's word — "${state.targetOpen}": against 30 it would be ${againstWord(state, 30 * EIGHTHS_PER_PAGE)}; against 120, ${againstWord(state, 120 * EIGHTHS_PER_PAGE)}; set_target decides it`
    : targetWords(state)
      ? `against ${targetWords(state)}, read as ${formatPages(state.targetEighths)} pages (the writer said "${targetWords(state)}", not a number; set_target with pages says one): ${over > 0 ? `${formatPages(over)} over` : over < 0 ? `${formatPages(-over)} under` : "on it"}`
      : state.targetEighths === DEFAULT_TARGET_EIGHTHS
      ? `no target set — set_target for a pilot (60) or a half-hour (30); against the feature default of 120 it would be ${formatPages(-over)} under`
      : `against the ${formatPages(state.targetEighths)}-page target the writer set (set_target changes it): ${over > 0 ? `${formatPages(over)} over` : over < 0 ? `${formatPages(-over)} under` : "on it"}`;
  return [
    // One number for "how long is it", said first and said to be the one (round twenty-three, entry 62): an agent handed the writer three.
    `how long it is: about ${formatPages(total)} pages. Say this one to the writer: the film by its cards, a page about a minute, counted in eighths as a production does. The other figures below are what it is made of and what it is read against, not other answers`,
    ...(made ? [`  made of: ${made}`] : []),
    `  ${target}`,
    // Once every scene is written there is nothing left to guess about: the sketches are a fact about the draft, not a second length (pass 1a, entry 45).
    ...(found.length && wholeScript(state) ? [`  every scene is written; ${found.length} of them ${found.length === 1 ? "is a sketch" : "are sketches"}, measured under the page ${found.length === 1 ? "it was" : "they were"} read as — a fact about the draft, not another length; the script as it prints is page_count's number`] : found.length ? [`  if ${found.length === 1 ? "the sketch" : `the ${found.length} sketches`} ran to the page ${found.length === 1 ? "it was" : "they were"} read as: about ${formatPages(ifRan)} pages — a written scene measured under its page is a sketch, and this is a guess about a guess`] : []),
    ...(unlinkedCards(state).length ? [`  ${unlinkedCards(state).length} card(s) on no follows arrow, in this number and in no run: ${unlinkedCards(state).map((note) => `"${note.headline}"`).join(", ")}`] : []),
    "  the script so far, paginated, is page_count's number, not this one",
  ];
}

/**
 * One undecided thing in two homes (round twenty-two, entry 78): a note inside the scene's text and the card's
 * open words know nothing of each other, and deciding it means clearing both. Said when both exist, never otherwise.
 */
function twoHomes(note) {
  const notes = ((note.text ?? "").match(/\[\[[^\]]+\]\]/g) ?? []).length;
  const open = [note.open, note.changeOpen, note.locationOpen, note.whenOpen].map((words) => (words ?? "").trim()).filter(Boolean);
  if (!notes || !open.length) return "";
  return ` The text holds ${notes === 1 ? "a note" : `${notes} notes`} and the card has open words ("${open.join('"; "')}"): if they are the same undecided thing, it lives in two places, and deciding it means clearing both.`;
}

/**
 * What a write says about the camera (the handover's call 6): the lines marked,
 * or that the check ran and marked none, so silence is never "did it run?"
 * (round twenty-two, entries 72, 75). It matches a short list of interior verbs
 * in action lines, and says so: a mark, never a question.
 */
function cameraReply(text) {
  const found = cameraLines(text ?? "");
  return found.length
    ? ` — ${found.length} line${found.length === 1 ? "" : "s"} the camera cannot see (${cameraVerbs(found).join(", ")}): the reminder "Write for the camera" is the house's; show it or cut it, on the writer's word — a mark on the page, not a question on the wall`
    : " — the camera check read the action lines and marked none (it looks for a short list of interior verbs — knows, feels, thinks, remembers and the like — so it can miss a line and mark a fair one; it never asks)";
}

/**
 * What the story now runs, after an arrow changed it (round twenty-two, entry 33): no arrow reply stated the
 * resulting order, and only a reading confirmed it. Short chains whole; long ones as the cards around the change.
 */
function storyRunsLine(state, aroundIds) {
  const order = storyOrder(state);
  if (order.length < 2) return "";
  const quote = (note) => `"${note.headline}"`;
  if (order.length <= 8) return ` The story now runs: ${order.map(quote).join(" → ")}.`;
  const at = order.findIndex((note) => aroundIds.includes(note.id));
  const from = Math.max(0, at - 1);
  const slice = order.slice(from, from + 4);
  return ` The story now runs, around it: ${from > 0 ? "… → " : ""}${slice.map(quote).join(" → ")}${from + 4 < order.length ? " → …" : ""} (${order.length} cards in all).`;
}

/** " Before: "…"." — the words a write replaced, a value or the open words beside it; nothing when nothing stood there or nothing changed. */
function replacedWords(before, after) {
  const was = before.map((words) => (words ?? "").trim()).filter(Boolean);
  const now = new Set(after.map((words) => (words ?? "").trim()).filter(Boolean));
  const gone = was.filter((words) => !now.has(words));
  return gone.length ? ` Before: ${gone.map((words) => `"${words}"`).join("; ")}.` : "";
}

/** "about 7 of 120 pages", or "about 7 pages, the target open": an open target is not 120 in any reply (round twenty-two, entries 19, 44). */
function pagesOfTarget(state) {
  if ((state.targetOpen ?? "").trim()) return `about ${formatPages(boardEighths(state))} pages, the target open`;
  return `about ${formatPages(boardEighths(state))} of ${formatPages(state.targetEighths)} pages${targetWords(state) ? ` (${targetWords(state)})` : ""}`;
}

/**
 * What a card behind another leaves open, said beside it: it is out of the
 * order, so the reading's open lists never reach it, and its words were only
 * in list_board's records (round twenty-two, entry 21).
 */
function behindOpenWords(note) {
  if (!note) return "";
  const parts = [
    (note.open ?? "").trim() ? `open: ${note.open.trim()}` : "",
    (note.locationOpen ?? "").trim() ? `where: ${note.locationOpen.trim()}` : "",
    (note.whenOpen ?? "").trim() ? `when: ${note.whenOpen.trim()}` : "",
  ].filter(Boolean);
  return parts.length ? ` (left open on it, by the writer's word — ${parts.join("; ")})` : "";
}

/** What kinds of number a runtime folds together: measured from text, set by the writer, or the default page (round fifteen, entry 39). */
function runtimeKinds(state) {
  // A card behind another is out of the count, so it is out of this breakdown too (round twenty-two, entry 20).
  const inStory = state.notes.filter((note) => !note.alternativeOf && !note.aside);
  const behind = state.notes.filter((note) => note.alternativeOf).length;
  const asideCount = state.notes.filter((note) => note.aside).length;
  const measured = inStory.filter((note) => isMeasured(note));
  const sized = inStory.filter((note) => !isMeasured(note) && note.lengthEighths !== null);
  const unsized = inStory.filter((note) => !isMeasured(note) && note.lengthEighths === null);
  if (!state.notes.length) return "";
  const sum = (notes) => formatPages(notes.reduce((total, note) => total + noteEighths(note), 0));
  // A card the writer sized and then wrote is measured; their figure is kept underneath and said here, not hidden as "0 sized" (pass 1a, entry 46).
  const sizedUnder = measured.filter((note) => note.lengthEighths !== null);
  const kept = sizedUnder.length ? ` — ${sizedUnder.length} of them sized by the writer too, at ${formatPages(sizedUnder.reduce((total, note) => total + note.lengthEighths, 0))} pages between them, kept underneath and not counted while the text stands` : "";
  // Pages per kind, not only cards (round sixteen, entry 43).
  return `; of its ${inStory.length} cards${behind || asideCount ? ` (${[behind ? `${behind} more behind as other versions` : "", asideCount ? `${asideCount} set aside` : ""].filter(Boolean).join(", ")}, not counted)` : ""}, ${measured.length} measured from written text (${sum(measured)} pages${kept}), ${sized.length} sized by the writer (${sum(sized)}), ${unsized.length} unsized and read as a page each (${sum(unsized)})`;
}

function summarize(state) {
  const nameOf = new Map(state.characters.map((character) => [character.id, character.name]));
  // What lands here from the other boards' folds (R58), from the last project read.
  const paidByHere = lastHeld?.project ? landingsOn(lastHeld.project, { ...lastHeld.boards, [lastHeld.project.activeBoardId]: state }, lastHeld.project.activeBoardId).paid : [];
  // One row for any card — in the story, behind as a version, or set aside — so what is on a card can always be read back (round twenty-three, entries 21, 28).
  const cardRow = (note) => {
      // "Tomás?" is someone who may or may not be in it, by the writer's word (H9).
      const cast = castLine(note.characterIds, note.maybeCharacterIds, state.characters);
      const who = `${cast ? `, cast: ${cast}` : ""}${(note.castOpen ?? "").trim() ? `, who ${cast ? "else " : ""}is in it: open, by the writer's word — "${note.castOpen.trim()}"` : ""}`;
      // The board it pays off on, named here as read_wall names it (round fifteen, entry 44).
      const laterName = note.payoffBoardId ? (lastHeld?.project?.boards?.find((meta) => meta.id === note.payoffBoardId)?.name ?? note.payoffBoardId) : null;
      const laterAt = note.payoffBoardId && note.payoffNoteId && lastHeld?.project ? ` at ${episodeLabel(lastHeld.project, lastHeld.boards, note.payoffBoardId, note.payoffNoteId)} "${lastHeld.boards[note.payoffBoardId]?.notes?.find((item) => item.id === note.payoffNoteId)?.headline ?? note.payoffNoteId}"` : "";
      const what = note.plantsWhat ? `: ${note.plantsWhat}` : "";
      const plant = note.plants ? (note.payoffBoardId ? `, plants${what} → pays off later on "${laterName}"${laterAt || ", no scene there claimed yet"}` : `, plants${what}`) : "";
      // The receiving end (R58): what this card pays off from another board, composed from the project.
      const pays = paidByHere.filter((item) => item.id === note.id).map((item) => `, pays off "${item.fromHeadline}" from "${item.fromBoardName}" (${episodeLabel(lastHeld.project, lastHeld.boards, item.fromBoardId, item.fromNoteId)})`).join("");
      const snap = state.revision?.snapshot?.[note.id];
      const revised = snap && (snap.headline !== note.headline || snap.change !== note.change || (snap.text ?? "") !== (note.text ?? "") || (snap.location ?? "") !== (note.location ?? "")) ? `, changed in ${state.revision.color}` : "";
      const place = note.location ? `, at: ${note.location}` : note.locationOpen ? `, at: open, by the writer's word — "${note.locationOpen}"` : "";
      const when = note.when ? `, when: ${note.when}` : note.whenOpen ? `, when: open, by the writer's word — "${note.whenOpen}"` : "";
      const openWord = `${note.changeOpen ? `, change line: open, by the writer's word — "${note.changeOpen}"` : ""}${note.open ? `, open (the writer's words): "${note.open}"` : ""}${note.aside ? ", set aside: not in the film" : ""}${note.proposedBeat ? ", proposed as a turn (yours, not yet the writer's: set_rank beat keeps it, scene strikes it)" : ""}`;
      const count = formatPages(noteEighths(note));
      // A written card's estimate is kept underneath for when the text goes; say it, or it is invisible (round sixteen, entry 44).
      const underneath = isMeasured(note) && note.lengthEighths !== null ? `; the writer's estimate underneath: ${formatPages(note.lengthEighths)}` : "";
      const sketch = isMeasured(note) && noteEighths(note) < (note.lengthEighths ?? DEFAULT_NOTE_EIGHTHS) ? " (a sketch: under the page it was read as)" : "";
      const pages = isMeasured(note) ? `${count} ${count === "1" ? "page" : "pages"}, written${sketch}${underneath}` : note.lengthEighths === null ? "about a page, unsized" : `${count} ${count === "1" ? "page" : "pages"}`;
      return `  - ${note.id} [${note.rank ?? "scene"}, ${pages}${who}${place}${when}${openWord}${plant}${pays}${revised}] — "${note.headline}" (${note.color}) at ${Math.round(note.x)},${Math.round(note.y)}`;
  };
  const unlinkedIds = new Set(unlinkedCards(state).map((note) => note.id));
  const notes = storyOrder(state).map((note) => (unlinkedIds.has(note.id) ? `${cardRow(note)} — unlinked: on no follows arrow, so in the film and in no run, printed last; the wall asks where it goes` : cardRow(note))).join("\n");
  const cast = state.characters
    .map((character) => {
      // Cards in the story; a version behind another is said apart, since it is not in the film until chosen (round twenty-two, entry 68).
      const on = state.notes.filter((note) => !note.alternativeOf && !note.aside && note.characterIds.includes(character.id)).length;
      const onBehind = state.notes.filter((note) => (note.alternativeOf || note.aside) && note.characterIds.includes(character.id)).length;
      const maybeOn = state.notes.filter((note) => !note.alternativeOf && !note.aside && (note.maybeCharacterIds ?? []).includes(character.id)).length;
      // Which lines of their page are written, so an agent can see who is a
      // brief and who is still a name.
      const page = filledCharacterFields(character);
      const brief = page.length ? ` · page: ${page.join(", ")}` : " · page: empty";
      // On this board, and on the others (R51): a per-board count beside a project-wide check read as a contradiction (round sixteen, entry 18).
      const away = lastHeld?.project ? (castElsewhere(lastHeld.project, lastHeld.boards, lastHeld.project.activeBoardId)[character.id] ?? []).reduce((sum, item) => sum + item.cards, 0) : 0;
      return `  - ${character.id} — "${character.name}" on ${on} card${on === 1 ? "" : "s"} of this board${maybeOn ? ` (and maybe ${maybeOn} more: not decided, counted neither way)` : ""}${onBehind ? ` (and ${onBehind} not in the film — behind as another version, or set aside — not counted)` : ""}${away ? ` and ${away} of other boards` : ""}${brief}`;
    })
    .join("\n");
  // The film's cards, and the ones not in it said apart, as the cast's counts are and as read_wall counts (round twenty-three, entry 29).
  const placeCounts = new Map();
  for (const note of state.notes) {
    const phrase = (note.location ?? "").trim();
    if (!phrase) continue;
    const held = placeCounts.get(phrase) ?? { on: 0, out: 0 };
    if (note.alternativeOf || note.aside) held.out += 1;
    else held.on += 1;
    placeCounts.set(phrase, held);
  }
  const places = [...placeCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([phrase, { on, out }]) => `  - "${phrase}" on ${on} card${on === 1 ? "" : "s"}${out ? ` (and ${out} not in the film — behind as another version, or set aside — not counted)` : ""}`)
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
  // A card behind another is drawn behind it, not at its own x,y, so it is no row's neighbour (round twenty-two, entry 22).
  for (const note of readingOrder(state.notes.filter((item) => !item.alternativeOf))) {
    const row = rows[rows.length - 1];
    if (row && note.y - row.top <= NOTE_HEIGHT / 2) row.notes.push(note);
    else rows.push({ top: note.y, notes: [note] });
  }
  const rowLines = rows.map((row, index) => `  ${index + 1}: ${row.notes.map((note) => `${note.rank === "beat" ? "★ " : ""}"${note.headline}"${note.aside ? " (aside)" : ""}`).join(" · ")}`);
  // The reading's count, not the record's: a left question the wall asks again on its own is not left (pass 1a, entry 62).
  const leftCount = readWall(state).left.length;
  return [
    ...(isSampleWall(state) ? [SAMPLE_NOTE] : []),
    atAGlance(state, readWall(state, readOptions(lastHeld?.project?.activeBoardId ?? null, state)), lastHeld?.project ?? null, lastHeld?.project?.boards?.find((meta) => meta.id === lastHeld.project.activeBoardId) ?? null),
    `logline: ${state.loglineOpen ? `open, by the writer's word — "${state.loglineOpen}"` : state.logline ? `"${state.logline}"` : "(not set)"}`,
    ...production,
    `left, for now: ${leftCount ? `${leftCount} question(s) the writer left; read_wall lists them` : "none"}`,
    `beats: ${beats}, scenes: ${scenes}${state.notes.some((note) => note.alternativeOf) ? ` — and ${state.notes.filter((note) => note.alternativeOf).length} behind as other versions, out of the count` : ""}${state.notes.some((note) => note.aside) ? ` — and ${state.notes.filter((note) => note.aside).length} set aside, not in the film` : ""}`,
    ...runtimeBlock(state),
    ...((state.openLines ?? []).length ? ["not decided yet, about the film (the writer's sentences; listed, never asked; strike_open_line when one is decided):", ...state.openLines.map((line, index) => `  ${index + 1}. ${line}`)] : []),
    `notes: ${state.notes.length}, groups: ${state.groups.length}, arrows: ${state.arrows.length}, cast: ${state.characters.length}`,
    ...(unlinkedIds.size ? [`unlinked: ${unlinkedIds.size} card(s) on no follows arrow while the film has them — in the film and its length, in no run, last in the order and printed last, and asked where ${unlinkedIds.size === 1 ? "it goes" : "they go"} (move_scene or create_arrow places one)`] : []),
    "cards (in story order — the follows arrows over the rows; each with its id; unlinked cards last):",
    notes || "  (no cards)",
    ...(state.notes.some((note) => note.alternativeOf)
      ? ["versions, not chosen (behind their front cards; out of the order, the count and the pages; choose_version decides):", ...state.notes.filter((note) => note.alternativeOf).map((note) => `${cardRow(note).replace(/ at -?\d+,-?\d+$/, "")}, a version of "${state.notes.find((item) => item.id === note.alternativeOf)?.headline ?? note.alternativeOf}"`)]
      : []),
    ...(state.notes.some((note) => note.aside)
      ? ["set aside (on the wall and not in the film: out of the order, the count, the pages and every export; set_aside with aside false brings one back):", ...state.notes.filter((note) => note.aside).map((note) => `${cardRow(note)}${note.change && note.change !== "What changes?" ? ` — ${note.change}` : ""}`)]
      : []),
    "rows on the wall (top to bottom, left to right; ★ a beat; (aside) a card set aside):",
    ...(rowLines.length ? rowLines : ["  (no cards)"]),
    "cast (the project's; every board of it casts from here; read_character reads a person's whole page, update_character writes it):",
    cast || "  (no one yet — add_character to start the roster)",
    "places (each phrase is its own place, and the app relates none of them — if two are one place, set_location them the same):",
    places || "  (no card says where it happens yet)",
    "groups:",
    groups || "  (no groups)",
    "threads (a named string through cards, in story order; an open end is asked about by the reading):",
    ...((state.threads ?? []).length ? state.threads.map((thread) => `  - ${threadLine(state, thread)}`) : ["  (no threads — create_thread names one)"]),
    "arrows:",
    arrows || "  (no arrows)",
  ].join("\n");
}

// Wire format: prose, one blank line, then the JSON payload. `text` must not
// contain a blank line of its own or the payload becomes unparseable.
// PLOTCODER_JSON=0 drops the JSON tail from every reply, for an agent that
// reads the sentence and wants nothing more (a blind run found 400-line replies).
const TEXT_ONLY = env.PLOTCODER_JSON !== "1";
/**
 * Through the hosted door a reply never promises this server's undo: it is a
 * fresh server on every call and keeps no trail, so "undo brings it back" is
 * false there, and an agent cannot test it without risking the writer's work
 * (round twenty-three, entry 71). The writer's ⌘Z on the wall is true at
 * every door.
 */
/** undo's and redo's own descriptions through the hosted door: said first and plainly, so an agent never has to risk the writer's work to find out (round twenty-three, entries 70, 71). */
const NO_UNDO_HERE = "NOT THROUGH THIS DOOR: your client sent no session, and without one the hosted door is a fresh server on every call and keeps no trail, so this tool can take nothing back here and says so. The writer's ⌘Z on the wall takes any change back; to take one back yourself, make the opposite change (delete_note, set_aside, update_note with the old words). Elsewhere: ";
const UNDO_THROUGH_THE_DOOR = "Through the hosted door: this session's last ten changes are kept on the writer's own account for a day, and undo takes them back newest first. ";
const NO_REDO_HERE = "NOT THROUGH THIS DOOR: the hosted door keeps what undo needs and not what redo needs; make the change again. Elsewhere: ";

function undoAsThisDoorHasIt(text) {
  if (undoKeptHere()) return text;
  return text
    .replace(/\bundo brings all of it back\b/g, "the writer's ⌘Z on the wall brings all of it back (this door keeps no undo of its own)")
    .replace(/\b[Oo]ne undo takes (it all|the whole move) back\b/g, (_, what) => `one ⌘Z on the writer's wall takes ${what} back (this door keeps no undo of its own)`)
    .replace(/\bundo takes back the leaving\b/g, "the writer's ⌘Z on the wall takes back the leaving")
    .replace(/ One undo step\./g, " One ⌘Z step on the writer's wall.");
}

function ok(rawText, data) {
  const text = undoAsThisDoorHasIt(rawText);
  const body = data === undefined || TEXT_ONLY ? text : `${text}\n\n${JSON.stringify(data, null, 2)}`;
  return { content: [{ type: "text", text: body }] };
}

// --- Server ----------------------------------------------------------------

// The version the door says it runs is the package's own, so a client, or a
// person checking a deploy, can tell which release answered. It said "0.1.0"
// through forty-two releases.
function packageVersion() {
  try {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json");
    return JSON.parse(fs.readFileSync(file, "utf8")).version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

// The day's rules ride the handshake (round twenty-three, entries 1, 2, 7): an agent holding a connector has them
// with nothing to fetch, and word for word — its own fetch tool paraphrased the on-ramp.
const server = new McpServer({ name: "plotcoder-board", version: packageVersion() }, { instructions: agentsInstructions() });

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
  // A tool's description promises what its reply does, so it says undo as this door has it too.
  registerTool(name, { ...config, description: `${hosted() && name === "redo" ? NO_REDO_HERE : hosted() && name === "undo" ? (undoKeptHere() ? UNDO_THROUGH_THE_DOOR : NO_UNDO_HERE) : ""}${undoAsThisDoorHasIt(config.description ?? "")}` }, (...args) => {
    const turn = lane.then(async () => {
      await recallSession();
      try {
        return await handler(...args).catch((error) => {
          if (error instanceof DoorReply) return ok(error.message);
          return ok(failedCallReply(name, error));
        });
      } finally {
        await keepSession();
      }
    });
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
  "add_open_line",
  {
    title: "Not decided yet, about the film",
    description:
      "Hold something the writer has not decided about the film itself, in their own sentence, when it is true of no one card: when it happens (the season, the year), whether it has acts and where they break, what runs long or short, whether there are other plants, a place that may or may not be in it. One sentence a call. The wall shows the list under the logline and the reading lists it first under open and never asks about it. Not for a card's place, when, change line or cast, which have opens of their own, and never a sentence of yours: only what the writer said they do not know. strike_open_line when they decide.",
    inputSchema: { text: z.string().min(1).describe("The writer's sentence, as they would read it back: \"Whether it has acts, and where they break.\"") },
  },
  async (args) => {
    const { state, changed, result, live } = await commit({ type: "add_open_line", text: args.text });
    if (!changed) return ok(`Nothing changed: the film's list already has that sentence${(state.openLines ?? []).length ? ` — ${state.openLines.map((line, index) => `${index + 1}. ${line}`).join(" ")}` : ""}.`);
    return ok(`Held, about the film: "${result.line}"${where(live)}. ${result.openLines.length} not decided yet about the film; the reading lists them first under open and asks nothing. strike_open_line takes one off when the writer decides it.`, result);
  },
);

server.registerTool(
  "strike_open_line",
  {
    title: "Decided: strike a line about the film",
    description:
      "Take a sentence off the film's not-decided list, when the writer has decided it: by its number as list_board shows it, or by its words. What they decided goes where it belongs — the premise, a group for an act, a card's when — with that field's own tool; this only strikes the line.",
    inputSchema: { line: z.union([z.number().int().positive(), z.string().min(1)]).describe("The line's number in list_board, from 1, or its words.") },
  },
  async (args) => {
    const command = typeof args.line === "number" ? { type: "strike_open_line", index: args.line - 1 } : { type: "strike_open_line", text: args.line };
    const { state, changed, result, live } = await commit(command);
    if (!changed) return ok(`Nothing struck: no such line. ${(state.openLines ?? []).length ? `The film's list: ${state.openLines.map((line, index) => `${index + 1}. ${line}`).join(" ")}` : "Nothing is held as not decided about the film."}`);
    return ok(`Struck, as decided: "${result.line}"${where(live)}. ${result.openLines.length} still not decided about the film. Where what they decided belongs is that field's own tool.`, result);
  },
);

server.registerTool(
  "set_logline",
  {
    title: "Set logline",
    description:
      "Set the board's logline — the central question, what this story is arguing. One sentence, kept as given, capitals and all. Every card on the wall should be checkable against it. Pass an empty string to clear it. Or leave it open: pass open with the writer's words for why there is no logline yet — \"two candidates, not chosen\" — and the reading lists it under open, by the writer's word, and asks nothing; text decides it and clears the words; open \"\" takes the words back and leaves the field blank. Only on the writer's word: an open field is theirs, never a guess of yours.",
    inputSchema: {
      logline: z.string().optional(),
      open: z.string().optional(),
    },
  },
  async (args) => {
    if (args.logline === undefined && args.open === undefined) return ok("Say which: logline (the sentence, or \"\" to clear it), or open (the writer's words for why there is none yet).");
    const { state, changed, live, before } = await commit({ type: "set_logline", ...(args.logline !== undefined ? { logline: args.logline } : {}), ...(args.open !== undefined ? { open: args.open } : {}) });
    // Every write that replaces the writer's words says what stood there (round twenty-two's issues file, D1).
    const wasLogline = replacedWords([before?.logline, before?.loglineOpen], [state.logline, state.loglineOpen]);
    if (!changed) return ok(args.logline === "" && !state.loglineOpen ? "Logline cleared." : "Logline unchanged: it already read that way.");
    if (state.loglineOpen) {
      return ok(`Logline left open, by the writer's word: "${state.loglineOpen}"${where(live)}. The reading lists it and asks nothing; set_logline with text decides it, open "" leaves it blank.${wasLogline}`, { logline: state.logline, loglineOpen: state.loglineOpen });
    }
    return ok(
      state.logline
        ? `Logline set: "${state.logline}"${where(live)}.${wasLogline}`
        : `Logline cleared${where(live)}.${wasLogline}`,
      { logline: state.logline, loglineOpen: state.loglineOpen },
    );
  },
);

server.registerTool(
  "set_rank",
  {
    title: "Set card rank",
    description:
      `Mark cards as beats or scenes. ${wordSentence("beat")} Rank is carried by the card, not by where it sits. Do not volunteer an opinion about how many beats there should be. When the writer says "propose the turns and I will strike", pass rank "proposed": each candidate wears a dashed bar and the words "proposed turn" on the wall, and is listed in the reading, so the proposal is on the wall and not only in the chat — and it is still a scene everywhere, in the count, the runs and the questions, until the writer keeps it. Keep is rank "beat"; strike is rank "scene". Never mark a beat on your own word.`,
    inputSchema: {
      ids: z.array(z.string()).min(1),
      rank: z.enum([...NOTE_RANKS, "proposed"]).describe("beat or scene, on the writer's word; or proposed, your candidate for the writer to keep (beat) or strike (scene)."),
    },
  },
  async (args) => {
    if (args.rank === "proposed") {
      const proposal = await commit({ type: "propose_beat", ids: args.ids });
      if (!proposal.changed) return ok("Nothing changed: those cards are beats already, or proposed already, or not on this board.");
      const beatsAlready = args.ids.length - proposal.result.length;
      return ok(
        `Proposed as ${proposal.result.length === 1 ? "a turn" : "turns"}, for the writer to keep or strike: ${proposal.result.map((note) => `"${note.headline}"`).join(", ")}${where(proposal.live)}.${beatsAlready > 0 ? ` ${beatsAlready} of the cards named ${beatsAlready === 1 ? "was" : "were"} left as ${beatsAlready === 1 ? "it was" : "they were"}: a beat already, or proposed already.` : ""} Each wears a dashed bar and "proposed turn" on the wall, where the writer can keep or strike it; each is still a scene in the count, the runs and the questions. Keep: set_rank beat. Strike: set_rank scene. Name them to the writer by headline, never by number.`,
        proposal.result,
      );
    }
    const wasProposed = new Set((await readBoard()).state.notes.filter((note) => note.proposedBeat === true).map((note) => note.id));
    const { state, result, live } = await commit({
      type: "set_rank",
      ids: args.ids,
      rank: args.rank,
    });
    // A strike and a call that changed nothing read the same (round twenty-four, entry 25): say which were proposals.
    const struck = args.rank === "scene" ? (result ?? []).filter((note) => wasProposed.has(note.id)) : [];
    const { beats, scenes } = countRanks(state);
    return ok(
      // By name, so a wrong reading of "strike 3" is caught at a glance (round twenty-three, entry 35).
      `${result?.length ?? 0} card(s) are now ${args.rank}: ${(result ?? []).map((note) => `"${note.headline}"`).join(", ")}${struck.length ? ` — the proposal${struck.length === 1 ? "" : "s"} struck: ${struck.map((note) => `"${note.headline}"`).join(", ")}` : ""}${where(live)}. The board holds ${beats} beats and ${scenes} scenes. The rows are as they were.${once("rank-rows", " organize lays a row per beat, when the writer wants the wall laid out.")}`,
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
      "Set the board's target script length. When the writer says a kind and not a number — \"it is a feature\" — pass kind (feature, hour, half-hour): the target keeps their word and is read as 120, 60 or 30 pages, and the app never says they chose a number they did not. When they give a number, pass pages, or minutes (a page runs about a minute); a number replaces the word. This is what the runtime estimate is measured against. Or leave the target open: pass open with the writer's words for why it is not decided — \"half-hour or feature\" — and the reading lists it under open, by the writer's word, and reads the runtime against both defaults while the words stand; a number decides it, open \"\" takes the words back.",
    inputSchema: { pages: pagesSchema.optional(), minutes: z.number().positive().optional(), kind: z.enum(["feature", "hour", "half-hour"]).optional(), open: z.string().optional() },
  },
  async (args) => {
    if (args.pages === undefined && args.minutes === undefined && args.open === undefined && args.kind === undefined) return ok("Say the target as a kind (feature, hour, half-hour) when that is the writer's word, in pages or in minutes when they gave a number, or open with their words for why it is not decided.");
    const { state, changed, live, before } = await commit({
      type: "set_target",
      ...(args.pages !== undefined || args.minutes !== undefined ? { targetEighths: toEighths(args.pages ?? args.minutes) } : {}),
      ...(args.kind !== undefined && args.pages === undefined && args.minutes === undefined ? { kind: args.kind } : {}),
      ...(args.open !== undefined ? { open: args.open } : {}),
    });
    if (!changed) return ok("Target unchanged: it already read that way.");
    if (state.targetOpen) {
      return ok(`Target left open, by the writer's word: "${state.targetOpen}"${where(live)}. The reading lists it and reads the cards against a half-hour and a feature meanwhile: about ${formatPages(boardEighths(state))} pages — against 30, ${againstWord(state, 30 * EIGHTHS_PER_PAGE)}; against 120, ${againstWord(state, 120 * EIGHTHS_PER_PAGE)}. set_target with pages or minutes decides it.`, { targetEighths: state.targetEighths, targetOpen: state.targetOpen });
    }
    // A number decides an open target, and the reply says the words went (round twenty-two, entry 90).
    const decided = (before?.targetOpen ?? "").trim() ? ` Decided: the writer's words, "${before.targetOpen.trim()}", are cleared, and the reading stops listing the target as open.` : "";
    const said = targetWords(state);
    return ok(
      `${said ? `Target is ${said}, read as ${formatPages(state.targetEighths)} pages: the writer's word, not a page count (set_target with pages says a number)` : `Target is ${formatPages(state.targetEighths)} pages`}${where(live)}.${decided} The cards add up to about ${formatPages(boardEighths(state))} — ${boardEighths(state) > state.targetEighths ? `${formatPages(boardEighths(state) - state.targetEighths)} over` : `${formatPages(state.targetEighths - boardEighths(state))} under`}.`,
      { targetEighths: state.targetEighths },
    );
  },
);

/** create_note's arguments, shared with create_cards (pass 1a, entry 18). */
const createNoteShape = {
    headline: z.string().min(1),
    change: z.string().optional().describe("What is different when the scene ends. Required, unless the writer has not decided it: then pass changeOpen with their words, and the change line waits while every other question about the card stands. (A card born wholly open, with open, may also wait.)"),
    changeOpen: z.string().optional().describe("The writer's words for why there is no change line yet — \"I don't know yet\" — in place of change: the card is an ordinary card, asked about its place, its cast, its arrows and its fold, and the reading lists the change line as open, by the writer's word, without asking for it. Not the same as open, which says the whole card is undecided and silences every question about it."),
    color: colorSchema.optional(),
    rank: rankSchema.optional(),
    pages: pagesSchema.optional(),
    plants: z.boolean().optional(),
    plantsWhat: z.string().optional().describe("What the folded corner plants, in the writer's words; naming it folds the card."),
    after: z.string().optional().describe("Wire the new scene into the story after this card (id or headline): one call, one number under a lock. On a wall with no follows arrows yet this draws the first, so a wall can be built in order from its second card. The new card lands beside that card and nothing else on the wall moves; organize tidies the wall along the arrows when the writer wants that."),
    before: z.string().optional().describe("Or before this card (id or headline)."),
    location: z.string().optional(),
    when: z.string().optional().describe('When the scene happens, as the writer says it — "night", "day four, dawn" — printed after the place on the scene heading.'),
    locationOpen: z.string().optional().describe("The writer's words for why the place is not decided: the card is born with its place open, listed and not asked where, while its other questions stand."),
    whenOpen: z.string().optional().describe("The writer's words for why the when is not decided: the card is born with its when open, listed and not asked."),
    open: z.string().optional().describe("The writer's words for what is not decided about this card — \"whether Tom knows\" — so the card is born open: the reading lists it and asks nothing else of it until the words are cleared."),
    characters: z.array(z.string().min(1)).optional(),
    castOpen: z.string().optional().describe("The writer's words for why who is in the scene is not decided, when nobody can be named or beside the names given. Not the same as open, which says the whole card is undecided."),
    of: z.string().optional().describe("Born as the other version of this card (id or headline): it stands behind that card from the first moment — out of the order, the count and the pages until choose_version — in one call and one step, so the wall never asks about it as a loose card. Not with after, before or aside."),
    aside: z.boolean().optional().describe("Born set aside: a scene the writer has cut and wants kept. On the wall, clear of the story's rows, and not in the film. Not with after, before or of."),
    x: z.number().optional(),
    y: z.number().optional(),
  };

server.registerTool(
  "create_note",
  {
    title: "Create note",
    description:
      "Add a card (post-it) to the board. A card is one scene: a headline plus the change it causes. Provide both headline and change. Optionally set color, x/y position, rank ('beat' for one of the major turns — a beat is a whole card, the scene where the turn happens), pages (how long it runs; leave it out and the card is taken to be about a page), plants (true if this scene sets something up that must pay off later), location (where it happens, as the writer would say it — 'the piano shop', not 'INT. PIANO SHOP'), and characters (who is in the scene, by name; a name not in the cast yet is added to it — name an unnamed person by their role, 'Dana's mother', rather than leaving them off). When the writer does not know whether someone is in the scene, put a question mark after the name — 'Tomás?' — and the wall holds it as not decided: listed under open, never asked, and counted neither way by the cast's counts or the check for someone gone too long; the name without the mark decides it, and leaving the name off decides it the other way. Only on the writer's word. When the writer does not know who is in a scene and nobody can be named — or knows some and not whether there is anyone else — that is the cast's own open: pass castOpen with their words (\"I don't know yet\"; \"anyone else: I don't know\"), and the card is listed under open and not asked who is in it, while its other questions stand. The words stand beside names; castOpen \"\" clears them. Only on the writer's word. The reply names the card's id.",
    inputSchema: createNoteShape,
  },
  createNoteCall,
);

/** The card create_note made last, for a caller that made several (create_cards). */
let lastMadeCard = null;

async function createNoteCall(args) {
    const { state } = await readBoard();
    // A card born as a version, or born set aside (round twenty-three, entry 20): neither is in the order, so neither is wired.
    if ((args.of || args.aside) && (args.after || args.before)) return ok("A version behind another card, or a card set aside, is not in the story's order, so it takes no after or before. Say one: where it goes in the order, or of, or aside.");
    if (args.of && args.aside) return ok("Say one: of (another version of a scene, behind it until the writer chooses) or aside (cut and kept).");
    const ofKey = (args.of ?? "").trim();
    const front = ofKey ? state.notes.find((note) => note.id === ofKey) ?? state.notes.find((note) => note.headline.trim().toLowerCase() === ofKey.toLowerCase()) ?? null : null;
    if (ofKey && !front) return ok(`No card with id or headline "${ofKey}" on this board. Call list_board.`);
    if (front?.alternativeOf) return ok(`"${front.headline}" is itself a version behind another card; name the front card.`);
    if (front && state.notes.some((note) => note.alternativeOf === front.id)) return ok(`"${front.headline}" has a version behind it already; choose_version there first.`);
    // A card born aside lands under the wall's lowest card, never "after the last card", which is inside the story (entry 22).
    const below = () => {
      const drawn = state.notes.filter((note) => !note.alternativeOf);
      if (!drawn.length) return { x: 140, y: 140 };
      return { x: Math.min(...drawn.map((note) => note.x)), y: Math.max(...drawn.map((note) => note.y)) + NOTE_HEIGHT + GAP * 2 };
    };
    const landing = args.x !== undefined || args.y !== undefined ? { x: args.x, y: args.y } : front ? { x: front.x, y: front.y } : args.aside ? below() : nextPlace(state);
    const names = (args.characters ?? []).map((name) => name.trim()).filter(Boolean);
    const added = [];
    // The card, anyone new in its cast, and the casting land as one change, so
    // one ⌘Z on the wall takes back the whole call and not just the cast.
    if (args.after && args.before) return ok("Say where: after one card, or before one, not both.");
    // A card needs its change line — unless it is born open (round eighteen, entry 13): the writer had no consequence yet.
    if (!(args.change ?? "").trim() && !(args.open ?? "").trim() && !(args.changeOpen ?? "").trim())
      return ok("A card needs its change line: what is different when the scene ends. If the writer has not decided it, pass changeOpen with their words: the change line waits and the wall still asks the card's other questions. (open, with their words, says the whole card is undecided and silences all of them.)");
    // The card beside which the new scene goes (round sixteen, entry 36): by id or headline, on this board.
    const besideKey = (args.after ?? args.before ?? "").trim();
    const beside = besideKey ? state.notes.find((note) => note.id === besideKey) ?? state.notes.find((note) => note.headline.trim().toLowerCase() === besideKey.toLowerCase()) ?? null : null;
    if (besideKey && !beside) return ok(`No card with id or headline "${besideKey}" on this board. Call list_board.`);
    const wallHasFollows = state.arrows.some((arrow) => arrow.kind !== "setup");
    let joinedGroup = null;
    let removedArrows = 0;
    // The arrow the wiring took out, by its cards, as delete_note names one (round twenty-two, entry 65).
    const removedNames = [];
    let drawnArrows = 0;
    // A scene wired into the story can change a run and leave the rows out of order; one simply added cannot.
    if (beside) askShape();
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
        plantsWhat: args.plantsWhat,
        location: args.location,
        locationOpen: args.locationOpen,
        whenOpen: args.whenOpen,
        changeOpen: (args.change ?? "").trim() ? undefined : args.changeOpen,
        castOpen: args.castOpen,
        when: args.when,
        open: args.open,
        x: landing.x,
        y: landing.y,
      }).result;
      if (names.length && made?.id) {
        const ids = [];
        const maybeIds = [];
        for (const typed of names) {
          // "Tomás?" — someone who may or may not be in it (H9).
          const { name, maybe } = readMaybe(typed);
          if (!name) continue;
          const wanted = name.toLowerCase();
          let person = current().characters.find((item) => item.id === name) ?? current().characters.find((item) => item.name.trim().toLowerCase() === wanted);
          if (!person) {
            person = step({ type: "add_character", name }).result;
            if (person) added.push(`${person.name} (${person.id})`);
          }
          const into = maybe ? maybeIds : ids;
          if (person && !ids.includes(person.id) && !maybeIds.includes(person.id)) into.push(person.id);
        }
        if (ids.length || maybeIds.length) {
          const cast = step({ type: "set_cast", ids: [made.id], characterIds: ids, maybeCharacterIds: maybeIds });
          // The card as it is now, cast and all, so the reply's JSON agrees with its prose.
          made = cast.state.notes.find((note) => note.id === made.id) ?? made;
        }
      }
      // Born behind another card, or born set aside, in the same frame: no loose card for the wall to ask about.
      if (front && made?.id) {
        const paired = step({ type: "set_alternative", id: made.id, of: front.id });
        made = paired.state.notes.find((note) => note.id === made.id) ?? made;
      }
      if (args.aside && made?.id) {
        const cut = step({ type: "set_aside", ids: [made.id], aside: true });
        made = cut.state.notes.find((note) => note.id === made.id) ?? made;
      }
      // Wired into the story where the writer said, in the same frame.
      // On a wall with no follows arrows yet, after or before draws the first one (round nineteen, entry 14).
      if (beside && made?.id) {
        // Count the rewiring, so the reply can say it as move_scene does (round eighteen, entry 36).
        const run = (command) => {
          const gone = command.type === "delete_arrow" ? current().arrows.find((arrow) => arrow.id === command.id) : null;
          const done = step(command);
          if (done.changed && command.type === "delete_arrow") {
            removedArrows += 1;
            const headline = (id) => current().notes.find((note) => note.id === id)?.headline ?? id;
            if (gone) removedNames.push(`"${headline(gone.from)}" → "${headline(gone.to)}"`);
          }
          if (done.changed && command.type === "create_arrow") drawnArrows += 1;
          return done;
        };
        joinedGroup = landBeside(run, current, made.id, beside, Boolean(args.after));
        // Beside its neighbour, unless the caller said where (round twenty-two, entry 63: one card in, nine moved).
        if (args.x === undefined && args.y === undefined) step({ type: "move_note", id: made.id, ...besidePlace(current(), made.id, current().notes.find((note) => note.id === beside.id) ?? beside, Boolean(args.after)) });
        made = current().notes.find((note) => note.id === made.id) ?? made;
      }
      return made;
    });
    const castSaid = names.length && result?.id ? ` Cast: ${castLine(result.characterIds, result.maybeCharacterIds, after.characters)}${added.length ? ` (added to the roster: ${added.join(", ")})` : ""}${(result.maybeCharacterIds ?? []).length ? " — a name with ? is not decided: listed under open, counted neither way" : ""}.` : "";
    // Who is in it, left open in the writer's words (round twenty-three, entries 13, 14).
    const castOpenSaid = (result?.castOpen ?? "").trim() ? ` Who ${names.length ? "else " : ""}is in it: open, by the writer's word — "${result.castOpen}" (listed, not asked).` : "";
    const landed = [
      result?.rank === "beat" ? "a beat" : "a scene",
      result?.lengthEighths === null ? "about a page (unsized: the writer's guess until set_length)" : `${formatPages(noteEighths(result))} ${formatPages(noteEighths(result)) === "1" ? "page" : "pages"}`,
      result?.color ? `${result.color} paper${args.color ? "" : once("paper", " (pass color to choose)")}` : null,
      result?.plants ? `corner folded${result.plantsWhat ? ` — plants ${result.plantsWhat}` : ""}` : null,
      result?.location ? atPlaceWords(result.location) : result?.locationOpen ? `place open: "${result.locationOpen}" (listed, not asked where)` : `no place yet${once("place", " (location here, or set_location)")}`,
      result?.when ? `when: ${result.when}` : result?.whenOpen ? `when open: "${result.whenOpen}" (listed, not asked)` : null,
      result?.changeOpen ? `change line open: "${result.changeOpen}" (listed, not asked for; the card's other questions stand)` : null,
      result?.open ? `open: "${result.open}" (listed, not asked about)` : null,
    ].filter(Boolean).join(", ");
    // Where it landed matters only until the tidy, so the reply says the rule once and never the coordinates (round fourteen, entry 11).
    const placed = front
      ? ` Born as the other version of "${front.headline}", behind it: out of the order, the count and the pages until choose_version decides. Which card is in front decides nothing.`
      : args.aside
      ? " Born set aside: on the wall under the story's rows, and not in the film — out of the order, the count, the pages and every export; set_aside with aside false brings it in."
      : beside
      ? ` Wired ${args.after ? "after" : "before"} "${beside.headline}" in the story (${removedArrows} follows arrow${removedArrows === 1 ? "" : "s"} removed${removedNames.length ? ` — ${removedNames.join(", ")}` : ""}, ${drawnArrows} drawn${wallHasFollows ? "" : "; the wall's first, so the story order starts here"})${joinedGroup ? `, in "${joinedGroup}"` : ""}. ${notTidied()}`
      : args.x === undefined && args.y === undefined ? ` Placed at the end of the rows, on no arrow.${once("placed", " organize lays the wall out along the arrows.")}` : "";
    // Under a lock a new scene has a letter, not a number: say it, since the board is the only other place to learn it (round fourteen, entry 44).
    const numbered = after?.lock && result?.id ? ` Numbered ${sceneNumbers(storyOrder(after), after.lock).get(result.id)} (the numbers are locked; a new scene's letter is its place between locked ones now, worked out again from where it sits if it moves; the locked numbers never move).` : "";
    lastMadeCard = result?.id ? result : null;
    return ok(`Created card ${result?.id ?? ""}: ${landed}${where(live)}.${castSaid}${castOpenSaid}${placed}${numbered}`, result);
}

server.registerTool(
  "create_cards",
  {
    title: "Create cards in order",
    description:
      "Several cards in one call, wired into the story in the order given: each lands after the one before it — the first after `after` when given, or as the wall's first card — with everything create_note takes on each (headline, change, cast, place, when, pages, rank, a fold, an open). A treatment's scenes are one round trip instead of one per card (pass 1a, entry 18). A card with its own after, before, of or aside is placed by that instead, and the next card follows the one before it. One reply lists every card with its id and what it landed as, then the last card's reply in full for the wall's state after all of them; a card the wall refused is named with the refusal and the rest still land. One undo step per card.",
    inputSchema: { cards: z.array(z.object(createNoteShape)).min(1), after: z.string().optional().describe("The card the first one follows (id or headline). Without it, on a wall with follows arrows the first card lands on no arrow, as create_note does.") },
  },
  async (args) => {
    const lines = [];
    let previous = args.after?.trim() || null;
    let lastReply = "";
    let made = 0;
    for (const [index, card] of args.cards.entries()) {
      const own = card.after || card.before || card.of || card.aside;
      lastMadeCard = null;
      const reply = await createNoteCall(own || !previous ? card : { ...card, after: previous });
      const text = reply.content?.[0]?.text ?? "";
      lastReply = text;
      if (lastMadeCard?.id) {
        made += 1;
        const it = lastMadeCard;
        lines.push(`${index + 1}. "${it.headline}" (${it.id}) — ${it.rank === "beat" ? "a beat" : "a scene"}, ${it.lengthEighths === null && !(it.text ?? "").trim() ? "unsized" : `${formatPages(noteEighths(it))} pages`}${it.location ? `, ${atPlaceWords(it.location)}` : it.locationOpen ? ", place open" : ", no place yet"}${it.when ? `, ${it.when}` : ""}${(it.characterIds ?? []).length || (it.maybeCharacterIds ?? []).length ? `, cast ${castLine(it.characterIds, it.maybeCharacterIds, (await readBoard()).state.characters)}` : ""}`);
        if (!own) previous = it.id;
      } else {
        lines.push(`${index + 1}. "${card.headline}" — not made: ${text.split("\n")[0]}`);
      }
    }
    return ok(`Made ${made} of ${args.cards.length} card${args.cards.length === 1 ? "" : "s"}${args.after ? ` after "${args.after}"` : ""}, each wired after the one before it:\n${lines.join("\n")}\n\nAfter the last card: ${lastReply}`);
  },
);

server.registerTool(
  "update_note",
  {
    title: "Update note",
    description: "Change the headline, change line, location and/or when of an existing card by id. The reply says which field changed, from what to what. A change line the writer has not decided: pass changeOpen with their words — \"I don't know yet\" — and the line waits, listed by the reading and not asked for, while the card's other questions stand; a change line decides it and clears the words; changeOpen \"\" takes the words back. A decided fact about one scene has three homes and no fourth: the change line when it is what changes (\"the cut is announced\" is what is different after the scene); a [[note]] in the scene's text when it is not, which neither prints nor counts; the premise when it is true of the whole film. A card has two lines on purpose: do not park a fact in the change line beside the change.",
    inputSchema: {
      id: z.string(),
      headline: z.string().optional(),
      change: z.string().optional(),
      changeOpen: z.string().optional(),
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
      changeOpen: args.changeOpen,
      location: args.location,
      when: args.when,
    });
    if (result === undefined) return ok(`No card with id ${args.id}.`);
    const fields = [["headline", "headline"], ["change", "change line"], ["changeOpen", "change line's open words"], ["location", "place"], ["when", "when"]]
      .filter(([field]) => (args[field] !== undefined || field === "changeOpen") && (prior?.[field] ?? "") !== (result[field] ?? ""))
      .map(([field, word]) => `${word}: "${prior?.[field] ?? ""}" → "${result[field] ?? ""}"`);
    if (!changed || fields.length === 0) return ok(`Nothing changed on "${result.headline}": the card already read that way.`);
    const mark = state.revision && state.revision.snapshot?.[result.id] && (state.revision.snapshot[result.id].headline !== result.headline || state.revision.snapshot[result.id].change !== result.change) ? ` Marked changed in the ${state.revision.color} revision "${state.revision.name}".` : "";
    const placeNote = args.location !== undefined && (prior?.location ?? "") !== (result.location ?? "") ? nearPlaces(state, result.location) : "";
    return ok(`Updated "${result.headline}" — ${fields.join("; ")}${where(live)}.${mark}${placeNote}`, result);
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
    const { state: before } = await readBoard();
    const was = before.notes.find((note) => note.id === args.id);
    const { result, changed, live } = await commit({ type: "move_note", id: args.id, x: args.x, y: args.y });
    if (result === undefined) return ok(`No card with id ${args.id}.`);
    // Which card, from where, to where, and where it was saved: every other write says (round twenty-three, entry 23).
    if (!changed || (was && Math.round(was.x) === Math.round(result.x) && Math.round(was.y) === Math.round(result.y))) return ok(`"${result.headline}" is already at ${Math.round(result.x)},${Math.round(result.y)}.`, result);
    return ok(`Moved "${result.headline}" from ${Math.round(was?.x ?? 0)},${Math.round(was?.y ?? 0)} to ${Math.round(result.x)},${Math.round(result.y)}${where(live)}. Position is where the card is drawn, never the story's order: the arrows are.`, result);
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
    askShape();
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
    inputSchema: { only: z.enum(["questions", "length"]).optional().describe("\"questions\": the short read — the three counts, what the wall asks, and what the writer has left, and nothing else. For \"is there anything I owe the writer?\" and \"did that raise a question?\". \"length\": how long it is, only — the one number first, then what it is made of and what it is read against. The full reading is for reading the wall back.") },
  },
  async (args = {}) => {
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
    readOnce = true;
    const runs = describeRuns(reading, state).map((line, index) => {
      const ids = reading.runs[index]?.ids ?? [];
      return ids.length ? `${line} — ${ids.map((id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`).join(", ")}` : line;
    });
    // No blank lines: ok() splits prose from payload on the first one.
    // The film's cards only: a card set aside or behind as a version is out of the count in every other line (round twenty-three, entry 65).
    const filmCards = state.notes.filter((note) => !note.alternativeOf && !note.aside);
    const written = filmCards.filter((note) => isMeasured(note)).length;
    // Whose number the runtime is (round eighteen, entries 45, 47, 50): once a
    // scene is written the total is part measure, part guess, part default,
    // and the reading says which, the same way list_board does.
    const whose = runtimeKinds(state).replace(/^; /, "");
    // A beat's own pages are in no run (entry 48); say how many pages that is.
    const beatEighths = reading.beats.reduce((sum, beat) => sum + noteEighths(state.notes.find((note) => note.id === beat.id) ?? {}), 0);
    // Fields left open by the writer's word (R61): the logline and the whens are the reading's; the premise and the board's name are the project's.
    // Everything undecided, in one place: the writer's open things card by card, then what nobody has said (round twenty-two, entries 41, 43, 67, 86, 89).
    const undecided = describeUndecided(state, reading, {
      project: [
        ...(projectForRead.nameOpen ? [{ label: "the project's name", words: projectForRead.nameOpen }] : []),
        ...(state.targetOpen ? [{ label: "the target", words: state.targetOpen }] : []),
        ...(projectForRead.premiseOpen ? [{ label: "the premise", words: projectForRead.premiseOpen }] : []),
        ...(readBoardMeta?.nameOpen ? [{ label: "this board's name", words: readBoardMeta.nameOpen }] : []),
      ],
      wouldAsk: (item) => (item.hides.length ? ` (closed, it would be asked ${item.hides.map((kind) => ASK_WORDS[kind] ?? CHECK_WORDS[kind] ?? kind).join("; ")})` : ""),
    });
    // Fields, not lines: a card's line can carry three of them.
    // What is open about a person is counted at the head, so it is counted here: the two lines must add up to one number (round twenty-three, entry 26).
    const openPeopleCount = reading.openPeople?.length ?? 0;
    const openFieldCount = reading.openFields.length + (reading.openLines?.length ?? 0) + (projectForRead.nameOpen ? 1 : 0) + (state.targetOpen ? 1 : 0) + (projectForRead.premiseOpen ? 1 : 0) + (readBoardMeta?.nameOpen ? 1 : 0);
    // The short read (round twenty-two, entry 83): confirming nothing was owed cost three hundred lines.
    // The short read for "how long is it" (pass 1a, entry 47): the runtime block alone, the one number first.
    if (args?.only === "length") {
      return ok([`PlotCoder wall (${door(live, base)}) — how long it is, only; read_wall without only is the whole reading`, ...runtimeBlock(state)].join("\n"), { eighths: boardEighths(state), targetEighths: state.targetEighths, whole: wholeScript(state) });
    }
    if (args?.only === "questions") {
      return ok(
        [
          `PlotCoder wall (${door(live, base)}) — the questions only; read_wall without only is the whole reading`,
          atAGlance(state, reading, projectForRead, readBoardMeta),
          ...((reading.proposed ?? []).length ? [`waiting on the writer: ${reading.proposed.length} turn${reading.proposed.length === 1 ? "" : "s"} you proposed, not yet kept or struck — ${reading.proposed.map((id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`).join(", ")}`] : []),
          "questions the wall raises:",
          ...(reading.findings.length ? reading.findings.map((finding) => `  - [${finding.kind}] ${finding.text}${finding.ids.length ? ` (ids: ${finding.ids.join(", ")})` : ""}`) : [reading.left.length ? "  (none the writer has not left)" : "  (none that this reading can see)"]),
          ...(reading.left.length ? ["left, for now:", ...reading.left.map((finding) => `  - [${finding.kind}] ${finding.text}${finding.why ? ` ("${finding.why}")` : ""}`)] : []),
        ].join("\n"),
        { findings: reading.findings, left: reading.left },
      );
    }
    const lines = [
      `PlotCoder wall (${door(live, base)})`,
      atAGlance(state, reading, projectForRead, readBoardMeta),
      ...(state.lock ? [`numbers: locked since ${String(state.lock.at).slice(0, 10)}; read_pages shows each scene's number`] : []),
      `board: "${readBoardMeta?.name ?? "?"}"${readBoardMeta?.nameOpen ? ` — its name is open, by the writer's word: "${readBoardMeta.nameOpen}"` : ""}${projectForRead.boards.length > 1 ? ` — board ${projectForRead.boards.findIndex((meta) => meta.id === readBoardMeta?.id) + 1} of ${projectForRead.boards.length} in the project "${projectForRead.name}"; open_board reads another` : ""}`,
      ...(projectForRead.nameOpen ? [`project: "${projectForRead.name}" — its name is open, by the writer's word: "${projectForRead.nameOpen}"`] : []),
      // A set premise is read back with the wall: it is where a fact about the whole film lives (rounds twenty 9, 20; twenty-two 13, 74).
      ...(projectForRead.premiseOpen ? [`premise: open, by the writer's word — "${projectForRead.premiseOpen}"`] : (projectForRead.premise ?? "").trim() ? [`premise: "${projectForRead.premise.trim()}"`] : []),
      `logline: ${state.loglineOpen ? `open, by the writer's word — "${state.loglineOpen}"` : state.logline ? `"${state.logline}"` : "(none yet)"}`,
      // Who is in the film and where it happens, so "read it back to me" is one call (round twenty-two, entry 29). list_board has each person's page and every card's cast.
      ...(() => {
        const film = state.notes.filter((note) => !note.alternativeOf && !note.aside);
        const cast = (state.characters ?? []).map((person) => ({ name: person.name, on: film.filter((note) => (note.characterIds ?? []).includes(person.id)).length, maybe: film.filter((note) => (note.maybeCharacterIds ?? []).includes(person.id)).length })).sort((a, b) => b.on - a.on);
        const byPlace = new Map();
        for (const note of film) {
          const place = (note.location ?? "").trim();
          if (!place) continue;
          const key = place.toLowerCase();
          byPlace.set(key, { place, on: (byPlace.get(key)?.on ?? 0) + 1 });
        }
        const places = [...byPlace.values()].sort((a, b) => b.on - a.on);
        return [
          `cast: ${cast.length ? cast.map((person) => `${person.name} (${person.on === 0 ? (person.maybe ? "on no card for certain" : state.notes.some((note) => (note.alternativeOf || note.aside) && (note.characterIds ?? []).includes(person.id)) ? "on no card in the film: only on a card set aside or a version behind, so not asked about" : "on no card") : `${person.on} scene${person.on === 1 ? "" : "s"}`}${person.maybe ? `, and maybe ${person.maybe} more` : ""})`).join(", ") : "(nobody yet)"}`,
          `places: ${places.length ? places.map((item) => `${item.place} (${item.on})`).join(", ") : "(none yet)"}`,
        ];
      })(),
      ...runtimeBlock(state),
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
      `pages: ${written === 0 ? "all estimates — no scene is written yet, so every card is the writer's guess" : written === filmCards.length ? "measured — every scene is written" : `estimates — ${written} of ${filmCards.length} cards are written${written <= 5 ? ` (${filmCards.filter((note) => isMeasured(note)).map((note) => `"${note.headline}"`).join(", ")})` : ""}, the rest are guesses`}`,
      // A wall with cards and no follows arrows has no story order yet; say so rather than read the rows as one (round seventeen, entries 10, 11).
      `story order: ${state.notes.length > 1 && !state.arrows.some((arrow) => arrow.kind !== "setup") ? "unset — no follows arrows, so the rows stand in for it; create_arrow the sequence and the reading, the numbers and every export follow the arrows" : "the follows arrows, and the rows where they say nothing"}`,
      `beats in wall order: ${
        reading.beats.length
          ? reading.beats.map((beat) => `"${beat.headline}"`).join(", ")
          : "(none marked)"
      }`,
      `runs between beats (the scenes between two turns; a beat's own pages are in no run${reading.beats.length ? ` — the ${reading.beats.length} beat${reading.beats.length === 1 ? "'s" : "s'"} own pages, about ${formatPages(beatEighths)}, are in no run` : ""}${written < state.notes.length ? "; pages are estimates" : ""}):`,
      ...(runs.length ? runs.map((line) => `  - ${line}`) : ["  (none)"]),
      `setups and payoffs${written < state.notes.length ? " (distances in estimated pages)" : ""}:`,
      ...(reading.setups.length
        ? describeSetups(reading, state).map((line) => `  - ${line}`)
        : [reading.paidBy.length ? "  (no setup arrow on this board; what pays off a fold of another board is listed below)" : "  (no arrow is marked as a setup)"]),
      ...reading.later.map((item) => `  - "${state.notes.find((note) => note.id === item.id)?.headline ?? item.id}" is folded and pays off later, on "${boardById(projectForRead, item.boardId)?.name ?? item.boardId}"${item.noteId ? `, at ${episodeLabel(projectForRead, boardsNow, item.boardId, item.noteId)} "${boardsNow[item.boardId]?.notes?.find((note) => note.id === item.noteId)?.headline ?? item.noteId}"` : " — no scene there claims it yet"}`),
      ...reading.paidBy.map((item) => `  - "${state.notes.find((note) => note.id === item.id)?.headline ?? item.id}" pays off "${item.fromHeadline}" from "${item.fromBoardName}" (${episodeLabel(projectForRead, boardsNow, item.fromBoardId, item.fromNoteId)}), one board earlier`),
      ...(undecided.open.length
        ? ["open, by the writer's word (listed, not asked about while the words stand; each card once, with everything open on it; set_open with \"\" closes a card, the field's own tool with open \"\" a field; \"whether someone is in it\" is decided by cast, with their name without the question mark or left off; a card not in the film is marked):", ...undecided.open]
        : []),
      ...(undecided.blank.length
        ? ["blank on the wall (no value here, and no words of the writer's on the wall to say why. That is a fact about the wall, not about the writer: they may have told you, and a when, a length or who is in a scene with nobody named has no open of its own to hold it. The wall asks about some of these above, and says nothing of the rest):", ...undecided.blank]
        : []),
      ...(reading.aside.length
        ? ["set aside, not in the film (on the wall; out of the order, the count, the pages and every export; never asked; set_aside with aside false brings one back):", ...reading.aside.map((id) => `  - "${state.notes.find((note) => note.id === id)?.headline ?? id}"`)]
        : []),
      ...((reading.unlinked ?? []).length
        ? [`unlinked (on no follows arrow while the film has them: in the film and its length, in no run, printed last; asked where ${reading.unlinked.length === 1 ? "it goes" : "they go"} below):`, ...reading.unlinked.map((id) => `  - "${state.notes.find((note) => note.id === id)?.headline ?? id}" (${id})`)]
        : []),
      ...(reading.versions.length
        ? ["two versions, not chosen (the front card is in the story; choose_version decides):", ...reading.versions.map((pair) => `  - "${state.notes.find((note) => note.id === pair.id)?.headline ?? pair.id}" or ${pair.alternatives.map((id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"${behindOpenWords(state.notes.find((note) => note.id === id))}`).join(" or ")}`)]
        : []),
      ...(reading.threads.length
        ? ["threads (the writer's strings through the story; a loose end is asked about below):", ...reading.threads.map((thread) => `  - "${thread.name}": ${thread.ids.length ? thread.ids.map((id) => threadCard(state, id)).join(" → ") : "no card yet"}${thread.startOpen ? " — starts nowhere yet" : ""}${thread.endOpen ? " — ends nowhere yet" : ""}${!thread.startOpen && !thread.endOpen && thread.ids.length >= 2 ? ` — both ends tied, about ${formatPages(thread.apart)} pages apart` : ""}`)]
        : []),
      ...((reading.proposed ?? []).length ? ["turns proposed and not yet kept or struck (yours, said on the wall; scenes until the writer keeps one — set_rank beat keeps, scene strikes):", ...reading.proposed.map((id) => `  - "${state.notes.find((note) => note.id === id)?.headline ?? id}" (${id})`)] : []),
      "questions the wall raises (each stands on every reading until the wall changes to answer it, or the writer leaves it — leave_question, with their reason):",
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
        if (!state.notes.length) return "nothing to check yet: no cards";
        if (asked.length === 0) return `asking nothing${held}`;
        const counts = new Map();
        for (const finding of asked) counts.set(finding.kind, (counts.get(finding.kind) ?? 0) + 1);
        return `asking ${asked.length} question${asked.length === 1 ? "" : "s"} of ${counts.size} kind${counts.size === 1 ? "" : "s"}: ${[...counts.entries()].map(([kind, n]) => (n > 1 ? `${kind} ×${n}` : kind)).join(", ")}${held}`;
      })()}${reading.left.length ? `; left by the writer, so not clean: ${[...new Set(reading.left.map((finding) => finding.kind))].map((kind) => `[${kind}]`).join(" ")}` : ""}${reading.open.length || openFieldCount || openPeopleCount ? `; ${[reading.open.length ? `${reading.open.length} card${reading.open.length === 1 ? "" : "s"}` : "", openFieldCount ? `${openFieldCount} field${openFieldCount === 1 ? "" : "s"}` : "", openPeopleCount ? `${openPeopleCount} thing${openPeopleCount === 1 ? "" : "s"} about a person` : ""].filter(Boolean).join(", ")} open by the writer's word, not asked (the ${reading.open.length + openFieldCount + openPeopleCount} at the head)` : ""}; checked and clean: ${CHECKS.filter((kind) => !reading.findings.some((finding) => finding.kind === kind) && !reading.left.some((finding) => finding.kind === kind)).map((kind) => {
        // The reading's own numbers: follows arrows and the film's cards, not setup arrows and the wall's (round twenty-two, entry 20).
        if (kind === "unlinked" && reading.wired.linked === 0) return "no card without a follows arrow (not asked until half the film's cards are wired: no follows arrows yet)";
        if (kind === "unlinked" && reading.wired.linked * 2 < reading.wired.of) return `no card without a follows arrow (not asked until half the film's cards are wired: ${reading.wired.linked} of ${reading.wired.of} are; a setup arrow is a claim, not a place in the story)`;
        if (kind === "unplaced" && !state.notes.some((note) => (note.location ?? "").trim())) return "no card without a place (not asked: no card placed yet)";
        if (kind === "sequence" && state.groups.length === 0) return "no group too long for one sequence (not asked: no groups)";
        // A kind clean only because an open card is not asked says so (round eighteen, entry 18).
        const hiddenBy = reading.open.filter((item) => item.hides.includes(kind)).length;
        // A place left open is not an open card (round twenty-one, entry 26): say which.
        const placesOpen = kind === "unplaced" ? reading.openFields.filter((field) => field.field === "location").length : 0;
        const except = [hiddenBy ? `${hiddenBy} open card${hiddenBy === 1 ? "" : "s"}` : "", placesOpen ? `${placesOpen} with ${placesOpen === 1 ? "its" : "their"} place open` : ""].filter(Boolean).join(" and ");
        if (except) return `${CHECK_WORDS[kind]} (except ${except}, not asked)`;
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
        replies.push(`The wall is not asking a question of kind "${want.kind}"${want.ids ? ` about ids ${want.ids.join(", ")}` : ""}.${now.length ? ` It asks ${now.length} of that kind, each with every id it lists — pass them all: ${now.map((finding) => `${finding.text} (ids: ${finding.ids.join(", ")})`).join("; ")}` : " It asks none of that kind now; read_wall lists the questions it asks, each with its kind and ids."}${sinceRead.length ? ` ${sinceRead.length} change(s) landed since the last read_wall, so read it again first.` : ""}`);
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
    if (anchor) step({ type: "move_note", id: landedId, ...besidePlace(current(), landedId, current().notes.find((note) => note.id === anchor.id) ?? anchor, Boolean(args.after)) });
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
      "Move a card to another place in the story order — after one card, or before one — by rewiring its follows arrows, as one step that undo takes back whole; the card lands beside the one it now follows and nothing else on the wall moves (organize tidies the wall along the arrows when the writer wants that). The story order is the follows arrows: the card leaves its place (what pointed at it now points at what it pointed at) and lands between the target and what followed it. A person does this by dragging in the outline. On a wall with no follows arrows yet, the order is drawn from the rows first and the reply says so; set_order sets a whole order from a list. To another board of the project: pass board (name, id or number from list_boards) and, optionally, after or before a card there; with neither the card lands at the head of that board's story. Across boards the card keeps its cast, place, when, rank, length, text and fold; its arrows stay behind, and that board is then the open one. Undo is per board: one step there, one on the board it left.",
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
    // A wall with no follows arrows has its order in its rows: draw that chain first, say so, and then move within it
    // (round twenty-two, entry 31: the smallest direction needed the whole chain drawn by hand first).
    const chainedFromRows = !state.arrows.some(isFollows);
    let removed = 0;
    let drawn = 0;
    let joinedGroup = null;
    // The whole move — its dozen arrows and the tidy — as one change: one frame on
    // the bridge, one ⌘Z on the wall, one step for undo here.
    askShape();
    const { state: final, live } = await commitAll(`move_scene "${card.headline}"`, (step, current) => {
      const run = (command) => {
        const done = step(command);
        if (done.changed) {
          if (command.type === "delete_arrow") removed += 1;
          if (command.type === "create_arrow") drawn += 1;
        }
        return done;
      };
      if (chainedFromRows) {
        const rows = storyOrder(state);
        for (let index = 1; index < rows.length; index += 1) step({ type: "create_arrow", from: rows[index - 1].id, to: rows[index].id, kind: "follows" });
      }
      // Leave: what pointed at the card points at what the card pointed at.
      const ins = current().arrows.filter((arrow) => isFollows(arrow) && arrow.to === card.id);
      const outs = current().arrows.filter((arrow) => isFollows(arrow) && arrow.from === card.id);
      for (const arrow of [...ins, ...outs]) run({ type: "delete_arrow", id: arrow.id });
      for (const before of ins) for (const after of outs) if (before.from !== after.to) run({ type: "create_arrow", from: before.from, to: after.to, kind: "follows" });
      // Land: between the target and what followed it (or what led to it), and
      // into the act it lands beside (round fourteen, entry 38).
      joinedGroup = landBeside(run, current, card.id, target, Boolean(args.after));
      run({ type: "move_note", id: card.id, ...besidePlace(current(), card.id, current().notes.find((note) => note.id === target.id) ?? target, Boolean(args.after)) });
    });
    const order = storyOrder(final);
    // Under a lock the letter is worked out again from where the scene landed (round sixteen, entry 35).
    const lockedNow = final.lock ? ` Under the lock it is now ${sceneNumbers(order, final.lock).get(card.id)}; the locked numbers never move, and an added scene's letter is worked out from where it sits.` : "";
    const group = final.groups.find((item) => item.noteIds.includes(card.id));
    const groupLine = joinedGroup
      ? ` It joined "${joinedGroup}", the group it landed in, so an organize keeps it with the act.`
      : group ? ` It is still in "${group.title || "an untitled group"}"; a frame does not follow a move, so say if the act or sequence should change.` : "";
    return ok(
      `${chainedFromRows ? "The wall had no follows arrows, so the order was drawn from the rows first, as the wall read it; then: " : ""}Moved "${card.headline}" to ${args.after ? "after" : "before"} "${target.headline}": ${removed} follows arrow(s) removed, ${drawn} drawn${final.arrows.some((arrow) => arrow.kind === "setup") ? ", setup arrows untouched" : ""}${where(live)}. ${notTidied()} Story order now: ${order.map((note, index) => `${index + 1}. ${note.headline}`).join(", ")}.${groupLine}${lockedNow} One undo takes the whole move back.`,
      { order: order.map((note) => note.id) },
    );
  },
);

server.registerTool(
  "set_order",
  {
    title: "Set the story order from a list",
    description:
      "\"The order is: the first morning, the timetable, the depot…\" — set the story order from a list of cards, by id or headline, in one step one undo takes back. The follows arrows touching the cards named are replaced by one chain through them in the order given — no card moves; organize lays the wall out along it when the writer wants that — and setup arrows, being claims, are untouched. A card in the film that is not named keeps its arrows to other cards not named and loses any to a card that is: the reply names the cards left unwired, and the wall asks where they go. Cards set aside, and versions behind another card, are not in the film and are refused by name. For one card's place, move_scene; for one arrow, create_arrow.",
    inputSchema: { cards: z.array(z.string()).min(2) },
  },
  async (args) => {
    const { state } = await readBoard();
    const refs = cardsByRef(state, args.cards);
    if (refs.missing.length) return ok(`Nothing changed: not on the board — ${refs.missing.map((ref) => `"${ref}"`).join(", ")}. Call list_board for the ids or the exact headlines.`);
    const ids = refs.found;
    if (new Set(ids).size !== ids.length) return ok("Nothing changed: a card is named twice, and a scene has one place in the order.");
    const outside = ids.map((id) => state.notes.find((note) => note.id === id)).filter((note) => note.alternativeOf || note.aside);
    if (outside.length) return ok(`Nothing changed: ${outside.map((note) => `"${note.headline}"`).join(", ")} ${outside.length === 1 ? "is" : "are"} not in the film (${outside.map((note) => (note.aside ? "set aside" : "a version behind another card")).join(", ")}), and the order is the film's.`);
    const named = new Set(ids);
    let removed = 0;
    let drawn = 0;
    const drawnPairs = [];
    const notDrawn = [];
    askShape();
    const { state: final, live } = await commitAll(`set_order (${ids.length} cards)`, (step, current) => {
      for (const arrow of current().arrows.filter((item) => item.kind !== "setup" && (named.has(item.from) || named.has(item.to)))) if (step({ type: "delete_arrow", id: arrow.id }).changed) removed += 1;
      for (let index = 1; index < ids.length; index += 1) {
        const pair = [ids[index - 1], ids[index]];
        if (step({ type: "create_arrow", from: pair[0], to: pair[1], kind: "follows" }).changed) {
          drawn += 1;
          drawnPairs.push(pair);
        } else notDrawn.push(pair);
      }
    });
    const order = storyOrder(final);
    const wired = new Set(final.arrows.filter((arrow) => arrow.kind !== "setup").flatMap((arrow) => [arrow.from, arrow.to]));
    const loose = order.filter((note) => !wired.has(note.id));
    return ok(
      `${notDrawn.length ? "The story does not run whole: " : "The story now runs: "}${order.filter((note) => named.has(note.id)).map((note) => `"${note.headline}"`).join(" → ")}${where(live)}. ${removed} follows arrow(s) removed, ${drawn} drawn${drawnPairs.length ? ` (${drawnPairs.map(([from, to]) => `${headlineOf(final, from)} → ${headlineOf(final, to)}`).join(", ")})` : ""}${notDrawn.length ? `; not drawn — ${notDrawn.map(([from, to]) => `${headlineOf(final, from)} → ${headlineOf(final, to)}`).join(", ")}: a card there is out of the film, or the arrow is already there` : ""}${final.arrows.some((arrow) => arrow.kind === "setup") ? "; setup arrows untouched" : ""}; one undo takes it all back. No card moved: the order is the arrows, and where cards sit is the writer's — organize lays the wall out along the new order when that is wanted.${loose.length ? ` Not named, and now on no follows arrow: ${loose.map((note) => `"${note.headline}"`).join(", ")} — the wall asks where ${loose.length === 1 ? "it goes" : "they go"}.` : ""}`,
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
    const everyPose = organizePoses(state, { onlyIds: args.noteIds });
    // The film's cards are what is laid out; a card set aside comes along only when the rows would run under it (round twenty-three, entry 22).
    const poses = everyPose.filter((pose) => !pose.aside && !pose.unlinked);
    const clearedAside = everyPose.filter((pose) => pose.aside);
    const clearedUnlinked = everyPose.filter((pose) => pose.unlinked && !pose.aside);
    const unlinkedLeft = unlinkedCards(state).filter((note) => !clearedUnlinked.some((pose) => pose.id === note.id));
    const unlinkedLine = clearedUnlinked.length || unlinkedLeft.length
      ? ` Not laid, on no follows arrow: ${[...clearedUnlinked.map((pose) => `"${state.notes.find((note) => note.id === pose.id)?.headline ?? pose.id}" (moved to a row beneath the story, since the rows would have run under it)`), ...unlinkedLeft.map((note) => `"${note.headline}" (left where it is)`)].join(", ")} — the wall asks where ${clearedUnlinked.length + unlinkedLeft.length === 1 ? "it goes" : "they go"}.`
      : "";
    if (poses.length === 0) return ok("Nothing to organize: no cards in scope.");
    const { changed, live } = await commit({ type: "apply_poses", poses: everyPose });
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
    // Nothing moved says what already stands (round fifteen, entry 20): after a rank change the agent asked whether a beat row still held.
    if (!changed) return ok(`Nothing moved: the ${poses.length} card(s) already lie along the arrows in ${shape}.`, poses);
    const asideLeft = state.notes.filter((note) => note.aside).length;
    const behindCount = state.notes.filter((note) => note.alternativeOf).length;
    // A version behind a card goes where its card goes: the wall draws it there, whatever x,y its record keeps for the day it is chosen (round twenty-two, entry 32).
    const behindLine = behindCount ? ` ${behindCount} card(s) behind as other versions went with the cards they stand behind: the wall draws a version behind its sibling wherever that is, and its own x,y waits until it is chosen.` : "";
    const clearedNames = clearedAside.map((pose) => `"${state.notes.find((note) => note.id === pose.id)?.headline ?? pose.id}"`);
    const stayed = asideLeft - clearedAside.length;
    // Each card set aside by name, with what happened to it: "stayed where the writer put them" was said of cards
    // the app had placed, beside a rule and its exception with no word on which was which (round twenty-four, entry 43).
    const stayedNames = state.notes.filter((note) => note.aside && !clearedAside.some((pose) => pose.id === note.id)).map((note) => `"${note.headline}"`);
    const asideLine = clearedAside.length || stayed > 0
      ? ` Set aside, not in the film, so not laid: ${[...clearedNames.map((name) => `${name} (moved to a row beneath the story, since the rows would have run under it)`), ...stayedNames.map((name) => `${name} (left where it is)`)].join(", ")}.`
      : "";
    return ok(`Organized ${poses.length} card(s) along the arrows into ${shape}${where(live)}.${behindLine}${asideLine}${unlinkedLine}`, poses);
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
    // Pages beside the percentages, against the open board's target, so the two readings agree without arithmetic (round twenty, entry 57).
    const { state } = await readBoard();
    const target = state?.targetEighths ?? DEFAULT_TARGET_EIGHTHS;
    const at = (beat) => `${beat.name} at ${Math.round(beat.at * 100)}% (p. ${Math.floor((beat.at * target) / EIGHTHS_PER_PAGE) + 1})`;
    const lines = [
      `the writer's own: ${own.length}`,
      ...own.map((structure) => `  - ${structure.id} — "${structure.name}" (${structure.beats.length} beats: ${structure.beats.map(at).join(", ")})`),
      `built in: ${TEMPLATES.length}`,
      ...TEMPLATES.map((template) => `  - ${template.id} — "${template.name}" (${template.beats.length} beats: ${template.beats.map(at).join(", ")})`),
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
      `"${chosen.name}" beside this wall's ${beats} beat${beats === 1 ? "" : "s"}, of ${formatPages(state.targetEighths)} pages (the story so far runs to p. ${comparison.soFar}, the page its last card ends on — read_wall counts the same cards as about ${formatPages(boardEighths(state))} pages, and page_count the script so far${allMeasured ? ", measured" : ", an estimate: unsized cards read as a page each"}); a match is the nearest of the wall's beats within ${MATCH_PAGES} pages, one to one and in order:`,
      // On a wall under half its target the pairing is arithmetic; say so before the rows, not after them (round eighteen, entry 52).
      ...(short ? [`the wall runs to less than half its target, so its beats sit early and the ${MATCH_PAGES}-page window pairs them with the structure's first beats by arithmetic; the pairing says more once the cards are sized or written, and whether a turn is missing is the writer's call, not this reading's`] : []),
      // On a thin wall a match is arithmetic, and the row says so where it says "here" (round twenty, entry 54).
      ...describeComparison(comparison).map((line) => `  - ${short ? line.replace(/\bhere\b/, "here, by arithmetic") : line}`),
      comparison.unmatched.length
        ? `beats of the wall no beat of the structure answers: ${comparison.unmatched.map((beat) => `"${beat.headline}" (p. ${beat.page})`).join(", ")}`
        : "every beat of the wall answers one of the structure's",
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
      "The script for a Fountain editor, with the wall's notes — the open board as a Fountain screenplay: a title page (with the premise and logline in its notes), beats as sections, one scene per card in wall order — a forced heading from the card's place (or its headline), the headline as a synopsis, the cast and the fold as notes, the change line as action after the mark [Unwritten] until the scene is written. Titled for the project, a one-board film being its project. Plain text a writer can open in any Fountain editor. Pass a path (relative to the server's folder) to write a .fountain file; otherwise the text comes back.",
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
      "The open board as Markdown, for a collaborator who lives in Google Docs or the like: titled for the project — a one-board film is its project, and the board's name follows only when the project has several boards — the byline and contact under the title when set_title_page has set them, then the premise and the logline, beats as second-level headings, a third-level heading per scene from its place with its scene number, the headline as a synopsis line under a scene (a beat's headline is its own heading, not printed twice), then the scene's text — a speech as its cue in bold with the lines under it — or, unwritten, its change line after the mark [Unwritten] in bold, so a reader can tell a placeholder from a page. Carries the beats and every headline; does not carry the cast or the fold (Fountain's notes do). In Google Docs, Paste from Markdown keeps the headings. Pass a path (relative to the server's folder) to write a .md file; otherwise the text comes back.",
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
      "The script to read, as it prints — the open board's script as plain text: the paginator's lines at Courier's columns kept with spaces, scene numbers in both margins (the wall's order, or as locked), a page turn as the new page's number in the right margin between two blank lines (the first page unnumbered), the byline and contact under the title when set_title_page has set them, an unwritten scene's change line as action after the mark [Unwritten], a revision's stars in the right margin. Without a path the reply is the file itself and nothing else, to save as is: name it for the project (a series: the board), .txt. The script and nothing else: no headlines, no beats, no cast — the heading is the place and the when. Titled for the project, a one-board film being its project. Pastes into anything and reads as a script wherever the font is monospaced. Pass a path (relative to the server's folder) to write a .txt file; otherwise the text comes back.",
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
      "Write a card's scene text in Fountain — action, character cues in capitals, dialogue under them, a (parenthetical) under a cue, a second cue ending ^ for dual dialogue, a line ending in TO: or beginning > for a transition, a line in > and < for a centred line (THE END), === for a page break, [[a note]] that never prints — onto the card by id; the scene heading comes from the card's place, so start with the action. Anything else on the page is action (INSERT and BACK TO SCENE included). The card is then measured (its lines as they print against a 55-line page) instead of estimated. An empty string clears it. Read read_pages first so the scene fits what is around it, and do not write scenes the writer has not asked for.",
    inputSchema: { id: z.string(), text: z.string() },
  },
  async (args) => {
    const { state, changed, result, live } = await commit({ type: "set_text", id: args.id, text: args.text });
    if (!changed) {
      if (!result) return ok(`No card with id ${args.id}. Call list_board.`);
      return ok(`Nothing changed: "${result.headline}" already reads that way.`);
    }
    const printed = sceneLineCount(args.text);
    const landedLines = String(args.text ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
    const landed = landedLines.length ? ` First line as it landed: "${clip(landedLines[0], 80)}"${landedLines.length > 1 ? `; last: "${clip(landedLines[landedLines.length - 1], 80)}"` : ""}.` : "";
    return ok(
      `Wrote "${result.headline}": ${printed} line(s) as they print${once("write-lines", " (headings, blank lines and wrapped dialogue counted; a [[note]] neither prints nor counts)")}, measured at ${formatPages(noteEighths(result))} of a 55-line page${once("write-measure", ", rounded to the nearest eighth and never below one eighth")}${noteEighths(result) < (result.lengthEighths ?? DEFAULT_NOTE_EIGHTHS) ? ` — a sketch: shorter than ${result.lengthEighths !== null ? "the writer's pages for it" : "the page it was read as"}${once("write-sketch", "; the wall counts the measure and says so")}` : ""}${cameraReply(result.text)}${where(live)}.${twoHomes(result)}${revisionMark(state, result.id)}${once("heading-from-place", " The heading comes from the card's place and when, so the text starts with the action.")} While the text stands the wall reads the measure, not the estimate${(() => {
        // How far the measure sits from what the card was read as before (round eighteen, entry 43): the writer's estimate, or the page an unsized card is read as.
        const before = result.lengthEighths !== null ? result.lengthEighths : 8;
        const label = result.lengthEighths !== null ? `the writer's ${formatPages(result.lengthEighths)} pages` : "the page an unsized card is read as";
        const moved = noteEighths(result) - before;
        return ` (${label}${moved ? `, so the runtime moved ${formatPages(Math.abs(moved))} ${moved < 0 ? "down" : "up"}` : ""})`;
      })()}${once("write-estimate", "; the estimate is kept for when the text goes, and set_length changes it")}.${landed}${cueReport(state, result.text, result)}`,
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
      "Change one line of a card's scene text without resending the scene: the exact text to find, and what replaces it. Or add to it: insert with after (or before) puts a new paragraph after (or before) the paragraph that holds that text, set off by a blank line, leaving the rest as it stands — \"add a line after he gets on\". The text to find, or the anchor, must occur once in the scene. The card is measured again and, under a revision, the changed line is marked. For a new scene or a rewrite, write_scene.",
    inputSchema: { id: z.string(), find: z.string().min(1).optional(), replace: z.string().optional(), insert: z.string().min(1).optional(), after: z.string().min(1).optional(), before: z.string().min(1).optional() },
  },
  async (args) => {
    const { state: before } = await readBoard();
    const note = before.notes.find((item) => item.id === args.id);
    if (!note) return ok(`No card with id ${args.id}. Call list_board.`);
    const text = note.text ?? "";
    if (!text.trim()) return ok(`"${note.headline}" is unwritten; write_scene it first.`);
    // Insert a paragraph beside the one that holds the anchor (round twenty-two, entry 77): "add a line after X" was only "replace X with X plus the line".
    if (args.insert !== undefined) {
      const anchor = args.after ?? args.before;
      if (!anchor || (args.after && args.before)) return ok("Say where: insert with after, or with before — the text of the paragraph it goes beside.");
      const hits = text.split(anchor).length - 1;
      if (hits === 0) return ok(`"${anchor}" is not in "${note.headline}"'s text. read_pages shows the scene as it stands.`);
      if (hits > 1) return ok(`"${anchor}" occurs ${hits} times in "${note.headline}"; give more of the line so it occurs once.`);
      const paragraphs = text.split(/\n{2,}/);
      const at = paragraphs.findIndex((paragraph) => paragraph.includes(anchor));
      paragraphs.splice(args.after ? at + 1 : at, 0, args.insert.trim());
      const linesWere = sceneLineCount(text);
      const done = await commit({ type: "set_text", id: note.id, text: paragraphs.join("\n\n") });
      const linesNow = sceneLineCount(done.result.text);
      return ok(
        `Inserted a paragraph ${args.after ? "after" : "before"} "${clip(paragraphs[args.after ? at : at + 1].split("\n")[0], 90)}" in "${done.result.headline}": "${args.insert.trim()}"${where(done.live)}. Now ${linesNow} line(s) as they print (was ${linesWere}; blank lines and wrapped lines count), measured at ${formatPages(noteEighths(done.result))} of a page${cameraReply(done.result.text)}.${revisionMark(done.state, done.result.id)}${cueReport(done.state, done.result.text, done.result)}`,
        { ...done.result, eighths: noteEighths(done.result), measured: true },
      );
    }
    if (!args.find || args.replace === undefined) return ok("Say which: find and replace, to change a line; or insert with after or before, to add one.");
    const count = text.split(args.find).length - 1;
    if (count === 0) return ok(`"${args.find}" is not in "${note.headline}"'s text. read_pages shows the scene as it stands.`);
    if (count > 1) return ok(`"${args.find}" occurs ${count} times in "${note.headline}"; give more of the line so it occurs once.`);
    const linesBefore = sceneLineCount(text);
    const { state, result, live } = await commit({ type: "set_text", id: note.id, text: text.replace(args.find, args.replace) });
    const linesAfter = sceneLineCount(result.text);
    return ok(
      `Changed one line of "${result.headline}": "${args.find}" → "${args.replace}"${where(live)}. Now ${linesAfter} line(s) as they print${linesAfter !== linesBefore ? ` (was ${linesBefore}; blank lines and wrapped lines count)` : ""}, measured at ${formatPages(noteEighths(result))} of a page${cameraReply(result.text)}.${revisionMark(state, result.id)}${cueReport(state, result.text, result)}`,
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
    let cameraByText = new Map();
    for (const line of text.split("\n")) {
      if (/^\.(?!\.)/.test(line) && index < ids.length) {
        const note = state.notes.find((item) => item.id === ids[index]);
        index += 1;
        const standIn = note && !(note.location ?? "").trim() ? ((note.locationOpen ?? "").trim() ? ` · place open: the headline heads the scene behind the mark, not a place; the writer's words are in the note beneath` : `${note.open ? " · open card" : ""} · no place: the headline heads the scene behind the mark, not a place`) : "";
        const numbered = note && pageNumbers?.get(note.id) ? ` · locked no. ${pageNumbers.get(note.id)}` : "";
        const mark = note ? marks.get(note.id) : null;
        const sourceLines = (note?.text ?? "").split("\n");
        changedTexts = new Set([...(mark?.lines ?? [])].map((at) => sourceLines[at]).filter((item) => item && item.trim()));
        const revised = mark?.revised ? ` · changed in the ${state.revision.color} revision${changedTexts.size ? ` (${changedTexts.size} line${changedTexts.size === 1 ? "" : "s"} starred below)` : ""}` : "";
        // The lines the camera cannot see (the handover's call 6): marked on the page, never asked on the wall.
        const camera = note ? cameraLines(note.text ?? "") : [];
        cameraByText = new Map(camera.map((item) => [item.line, item.verbs]));
        const cameraNote = camera.length ? ` · camera: ${camera.length} line${camera.length === 1 ? "" : "s"} it cannot see (${cameraVerbs(camera).join(", ")}) — a mark, not a question: nothing is owed for it` : "";
        lines.push(`${line}    [[id: ${note?.id ?? "?"} · ${note && isMeasured(note) ? "measured" : "estimated"} ${formatPages(note ? noteEighths(note) : 0)}pp${standIn}${numbered}${revised}${cameraNote}]]`);
      } else {
        const verbs = cameraByText.get(line.trim());
        lines.push(`${line}${changedTexts.has(line) ? "    *" : ""}${verbs ? `    ◂ ${verbs.join(", ")}` : ""}`);
      }
    }
    // The film's own facts at the head, for whoever writes a scene from these pages: a card cannot show what is true of the whole film (round twenty-two, entry 74).
    const film = (project.premise ?? "").trim() ? [`the film (the premise, true of every scene): "${project.premise.trim()}"`] : [];
    return ok([...film, ...lines].join("\n"));
  },
);

/** Which cards an import wrote onto, by headline (pass 1a, entry 60), so nobody has to read every page back to find them. */
function writtenNames(state, commands) {
  const names = commands.filter((command) => command.type === "set_text").map((command) => `"${state.notes.find((note) => note.id === command.id)?.headline ?? command.id}"`);
  return names.length ? ` (${names.join(", ")})` : "";
}

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
      `Imported ${parsed.scenes.length} scene(s): ${written} written onto cards${writtenNames(state, commands)}, ${same} matched with the same text (unchanged), ${created} new card(s)${where(live)}.`,
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
      "The open board as a Final Draft .fdx: a heading per card with its scene number (the locked numbers under a lock, else story order), the scene's text as script paragraphs (action, character, parenthetical, dialogue, dual dialogue, transition) or the change line as action after the mark [Unwritten] when unwritten, and a title page: the project's name, for a series the episode line (Episode 2 of 6 · its name), \"Written by\" and the contact when set_title_page has set them, and \"Draft date:\" with the day it goes out — an unlocked, unrevised script's title page is those and nothing else. Each card's headline rides as its scene's title in the scene properties, so Final Draft's navigator shows the wall's headlines. Without a path the reply is the file itself, to save as is: name it for the project (a series: the board), .fdx. One board per file; a series is one file per episode. A lock's date and a revision's name print on the title page, and changed paragraphs carry the revision's mark. Pass a path to write the file (a relative path resolves from the server's folder); otherwise the XML comes back with the file's name in a comment on its second line, and the reply with a path repeats that name.",
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
    return ok(`Imported ${parsed.scenes.length} scene(s) from Final Draft: ${written} written onto cards${writtenNames(state, commands)}, ${same} matched with the same text (unchanged), ${created} new card(s)${where(live)}.${receipt ? ` ${receipt}` : ""}`, matched);
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
      ? [`${unwritten} of ${order.length} scenes are unwritten and set their change line as action, marked [Unwritten], a few lines each — so this is the script so far, not the runtime: the runtime from the cards is about ${formatPages(boardEighths(state))} pages, ${order.length - unwritten} of ${order.length} measured and the rest estimated.`]
      : [];
    // The film's length is the cards' number, said first; the page count here is how far the script has got (round twenty-three, entry 62).
    // Once every scene is written, the paginated count is the script's length (pass 1a, entry 42); before that, the cards' number leads and the pages say how far the script has got.
    const lead = order.length > 0 && unwritten === 0
      ? `how long the script is: ${result.pageCount} pages, paginated — say this one to the writer: every scene is written, so this is the script as it prints. By the cards' measures it is about ${formatPages(boardEighths(state))} pages, in eighths, the count a production breakdown uses; the difference is headings and the spacing of the page.`
      : `how long the film is: about ${formatPages(boardEighths(state))} pages, by the cards — say this one to the writer. What follows is the script as written so far, paginated${unwritten ? `: ${order.length - unwritten} of ${order.length} scenes written` : ""}, which is a different number and not the film's length until every scene is written.`;
    return ok([lead, ...note, `pages: ${result.pageCount} of ${Math.round(state.targetEighths / 8)}`, `scene numbers here are ${state.lock ? "the locked numbers" : "story order (not locked)"}`, ...lines].join("\n"), result.scenes);
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
      "Take back the LAST change this server made, restoring the board to what it was before that call. It is a stack, newest first, with no way to pick a change: when the writer says \"undo that scene\" and changes they want have landed since — a scene written, a line added — undo would take those first, so use delete_note or set_aside on the card instead. preview: true says what it would take back, and whether it still can, without taking it. Refuses if the board has changed since — a person moved on, or another agent did — so it never tramples work; the person can always undo anything from the wall with ⌘Z. Call it again to go back further.",
    inputSchema: { preview: z.boolean().optional().describe("Say what undo would take back, and whether the board is still as that change left it, and take nothing back.") },
  },
  async (args) => {
    let last = trail[trail.length - 1];
    // Through the hosted door the trail is the session's, kept on the writer's account (the working list's X2).
    let kept = null;
    if (!last && hosted() && sessionStore?.peekUndo) {
      kept = await sessionStore.peekUndo(env.PLOTCODER_SESSION_ID);
      if (kept) last = { before: normalizeState(kept.before), afterHash: kept.afterHash, what: kept.what, boardId: kept.boardId };
    }
    if (!last && hosted() && sessionStore?.peekUndo) return ok("Nothing of this session's to undo: no change of yours is on its trail. The writer can take any change back from the wall with ⌘Z.");
    // With no session the door keeps nothing: "nothing of mine" there would be false after a build.
    if (!last && hosted()) return ok("Nothing to undo through this door: it is a fresh server on every call and keeps no trail of its changes. The writer can take any change back from the wall with ⌘Z; to take one back yourself, make the opposite change.");
    if (!last) return ok(oneCall() ? "Nothing to undo here: through plotcoder-call every call is a fresh server, so undo works only from an MCP session. The writer can take any change back from the wall with ⌘Z." : "Nothing of mine to undo in this session.");
    const { state, rev, base, boardId: openBoardId } = await readBoard();
    const steps = kept ? kept.steps : trail.length;
    if (kept && last.boardId && openBoardId && last.boardId !== openBoardId) {
      return ok(`Not undone: my last change, ${last.what}, was on another board. open_board there first; undo takes a change back only on the board it was made on.`);
    }
    const unchanged = last.afterHash ? wallHash(state) === last.afterHash : canon(state) === last.after;
    if (args?.preview) {
      return ok(`undo would take back: ${last.what}${unchanged ? "" : " — but the board has changed since, so it would refuse rather than trample that"}. the last ${steps} change${steps === 1 ? "" : "s"} of this session ${steps === 1 ? "is" : "are"} kept to take back, newest first (ten at most; the oldest go); nothing was taken back now.`);
    }
    if (!unchanged) {
      return ok(
        `Not undone: the board has changed since my ${last.what}. Undoing now would trample that. Ask the person to undo from the wall if they want it back.`,
      );
    }
    if (kept) await sessionStore.popUndo(env.PLOTCODER_SESSION_ID, kept.seq);
    else {
      trail.pop();
      undone.push(last);
    }
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
    const left = kept ? Math.max(kept.steps - 1, 0) : trail.length;
    const more = `${left} more of this session's changes ${left === 1 ? "is" : "are"} kept to undo (ten at most; the oldest go), across the boards — each only on the board it was made on, and only while that board is as the change left it${trail.length >= TRAIL_CAP ? "; that is the most I keep, so the oldest have gone" : ""}`;
    const shape = shapeNote(state, last.before);
    const shapeLine = shape.length ? ` ${shape.join("; ")}.` : "";
    return ok(`Undid ${last.what}${where(live)}.${orderLine}${countLine}${lockLine}${shapeLine} ${more}. list_board has the board.`, { undid: last.what, notes: last.before.notes.length, arrows: last.before.arrows.length, groups: last.before.groups.length });
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
    if (!last) return ok(hosted() ? "No redo through the hosted door: it keeps the last ten changes to take back and no trail forward. Make the change again; a card made again is a new card with a new id." : "Nothing of mine to redo.");
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
      "When one or more scenes happen, as the writer would say it — \"night\", \"day four, dawn\", \"the next morning\" — on the card beside its place, and printed after the place on every scene heading: THE PIER AT FENIT - NIGHT. Free text, the writer's phrase; an empty string clears it. Or leave the when open: pass open with the writer's words for why it is not decided — \"after the party; which night\" — and the reading lists it under open, by the writer's word, while the card's other questions still stand; a when decides it, open \"\" leaves it blank. This is where a scene's day and time live, not the headline, so the duplicate check never reads a day as a scene's words. create_note and update_note take when too; list_board shows it as when: …",
    inputSchema: { ids: z.array(z.string()).min(1), when: z.string().optional(), open: z.string().optional() },
  },
  async (args) => {
    if (args.when === undefined && args.open === undefined) return ok("Say which: when (the writer's phrase, or \"\" to clear it), or open (their words for why the when is not decided).");
    const { state, changed, result, live } = await commit({ type: "set_when", ids: args.ids, ...(args.when !== undefined ? { when: args.when } : {}), ...(args.open !== undefined ? { open: args.open } : {}) });
    if (!changed) {
      const missing = args.ids.filter((id) => !state.notes.some((note) => note.id === id));
      return ok(missing.length ? `No card with id ${missing.join(", ")}. Call list_board for the real ids.` : `Nothing changed: ${args.ids.length === 1 ? "the card already says" : "those cards already say"} "${(args.when ?? args.open ?? "").trim()}".`);
    }
    const when = result[0]?.when ?? "";
    const whenOpen = result[0]?.whenOpen ?? "";
    if (whenOpen) {
      return ok(`${result.length} card(s) have their when left open, by the writer's word: "${whenOpen}"${where(live)}. The reading lists it and asks nothing; the heading prints no time; set_when with a when decides it, open "" leaves it blank. The card is still asked about everything else.${stillOpen(result)}`, result);
    }
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
/**
 * Two versions of one scene (R65, the handover's call 5 on Robert's word):
 * a card set behind another as its other version leaves the story — the
 * order, the count, the pages, every export — and waits there; the reading
 * lists the pair and asks nothing of it until the writer chooses.
 */
server.registerTool(
  "set_alternative",
  {
    title: "Another version of a scene",
    description:
      "Set a card behind another as its other version — two endings, two ways a scene could go — by id or headline. Which card is in front decides nothing: it is only the one drawn on top and counted until the writer chooses, so put the way the writer named first in front, say so, and do not ask them to pick. The version leaves the story: out of the order, the count, the pages and every export; its follows arrows are dropped (setup arrows stay). The wall draws it tucked behind its sibling; read_wall lists the pair under \"two versions, not chosen\" and asks nothing of it; choose_version decides. of: \"\" takes a card out from behind and it stands as a plain card again. Only on the writer's word: two versions the notes hold, never two the agent could not choose between.",
    inputSchema: { id: z.string(), of: z.string() },
  },
  async (args) => {
    const { state: current } = await readBoard();
    const byRef = (ref) => current.notes.find((note) => note.id === ref) ?? current.notes.find((note) => note.headline.trim().toLowerCase() === ref.trim().toLowerCase()) ?? null;
    const card = byRef(args.id);
    if (!card) return ok(`No card with id or headline "${args.id}". Call list_board.`);
    const front = args.of.trim() ? byRef(args.of) : null;
    if (args.of.trim() && !front) return ok(`No card with id or headline "${args.of}". Call list_board.`);
    if (front?.alternativeOf) return ok(`"${front.headline}" is itself a version of another card; set the version behind the front card, "${current.notes.find((note) => note.id === front.alternativeOf)?.headline ?? front.alternativeOf}".`);
    if (front && current.notes.some((note) => note.alternativeOf === card.id)) return ok(`"${card.headline}" has a version behind it already; choose_version there first.`);
    const { state, changed, result, live } = await commit({ type: "set_alternative", id: card.id, of: front ? front.id : null });
    if (!changed) return ok(front ? `"${card.headline}" already stands behind "${front.headline}".` : `"${card.headline}" is not a version of another card.`);
    if (!front) return ok(`"${card.headline}" stands as a plain card again, unwired${where(live)}: create_arrow or move_scene puts it in the order.`, result);
    return ok(`"${card.headline}" is now the other version of "${front.headline}"${where(live)}: out of the order, the count and the pages${result.arrowsDropped ? `, ${result.arrowsDropped} follows arrow${result.arrowsDropped === 1 ? "" : "s"} dropped` : ""}. The reading lists the pair as two versions, not chosen, and asks nothing of it; choose_version decides. The wall draws it tucked behind its sibling, wherever the sibling goes; the x,y on its record is where it will stand if it is chosen, not where it is drawn.`, result);
  },
);

server.registerTool(
  "set_aside",
  {
    title: "Set a card aside, or bring it back",
    description:
      "Set cards aside, by id or headline: on the wall where the writer can see them, and not in the film. A card set aside keeps its words, its cast, its fold and its place on the wall, and leaves the order, the count, the pages and every export; its follows arrows go and the story closes over it where it stood between two cards (setup arrows stay); a beat set aside is a scene. read_wall lists what is set aside and asks nothing of it; organize leaves it where it is. For a scene the writer cuts and will not throw away, an idea with no place in the story yet, the version not chosen that they may come back to (choose_version with keep does this itself). aside false brings a card back as a plain unwired card, and the wall asks where it goes. Only on the writer's word: cutting a scene is theirs.",
    inputSchema: { ids: z.array(z.string()).min(1), aside: z.boolean().optional() },
  },
  async (args) => {
    const current = (await readBoard()).state;
    const refs = cardsByRef(current, args.ids);
    if (refs.missing.length) return ok(`Nothing changed: not on the board — ${refs.missing.map((ref) => `"${ref}"`).join(", ")}. Call list_board for the ids or the exact headlines.`);
    const behind = refs.found.map((id) => current.notes.find((note) => note.id === id)).filter((note) => note?.alternativeOf);
    if (behind.length && args.aside !== false) return ok(`Nothing changed: ${behind.map((note) => `"${note.headline}"`).join(", ")} ${behind.length === 1 ? "is" : "are"} already out of the film, behind another card as its other version. choose_version with keep sets the one not chosen aside.`);
    askShape();
    const { changed, result, live, state: after } = await commit({ type: "set_aside", ids: refs.found, aside: args.aside !== false });
    if (!changed) return ok(`Nothing changed: ${args.aside === false ? "those cards are not set aside" : "those cards are already set aside"}.`);
    // The arrows that closed the story over the cut, by their cards (round twenty-three, entry 49).
    const had = new Set(current.arrows.map((arrow) => arrow.id));
    const headlineOf = (id) => after.notes.find((note) => note.id === id)?.headline ?? id;
    const closing = (after?.arrows ?? []).filter((arrow) => !had.has(arrow.id) && arrow.kind !== "setup").map((arrow) => `"${headlineOf(arrow.from)}" → "${headlineOf(arrow.to)}"`);
    const names = result.ids.map((id) => `"${current.notes.find((note) => note.id === id)?.headline ?? id}"`).join(", ");
    if (!result.aside) return ok(`Brought back ${names}${where(live)}: in the film again, as ${result.ids.length === 1 ? "a plain unwired card" : "plain unwired cards"} — in the count and the pages, and the wall will ask what comes before and after ${result.ids.length === 1 ? "it" : "them"}; create_arrow or move_scene says.`, result);
    return ok(
      // What was done first, then where it landed and what it did to the wall: the tail read as part of the sentence when it sat in the middle of it.
      `Set aside ${names}: on the wall and not in the film — out of the order, the count, the pages and every export${result.arrowsDropped ? `; ${result.arrowsDropped} follows arrow${result.arrowsDropped === 1 ? "" : "s"} dropped${result.closedOver ? `, and the story closed over ${result.closedOver === 1 ? "it" : "them"} (${result.closedOver} arrow${result.closedOver === 1 ? "" : "s"} drawn between the cards on either side${closing.length ? `: ${closing.join(", ")}` : ""})` : ""}` : ""}${where(live)}. The reading lists ${result.ids.length === 1 ? "it" : "them"} under "set aside" and asks nothing; set_aside with aside false brings ${result.ids.length === 1 ? "it" : "them"} back.${(result.onThreads ?? []).length ? ` ${result.onThreads.length === 1 ? "A thread still runs" : `${result.onThreads.length} threads still run`} through ${result.ids.length === 1 ? "it" : "them"} (${result.onThreads.map((id) => `"${(state.threads ?? []).find((thread) => thread.id === id)?.name ?? id}"`).join(", ")}): the string keeps the card, and the reading asks nothing of that end while the card is out of the film.` : ""}`,
      result,
    );
  },
);

server.registerTool(
  "choose_version",
  {
    title: "Choose a version",
    description:
      "Choose one of two versions of a scene, by id or headline: the chosen card is the scene, in the front card's place — its arrows, its rank, its group, the threads that ran through it, and its fold when the chosen card has none of its own, so what was true of the scene \"either way of it\" needs saying once, on the front card; the other goes, or with keep true is set aside below it, clear of the other cards: on the wall where the writer can see it, and not in the film — out of the order, the count, the pages and every export, a scene and no longer a beat. set_aside with aside false brings it back as a plain card. Only on the writer's word.",
    inputSchema: { id: z.string(), keep: z.boolean().optional() },
  },
  async (args) => {
    const { state: current } = await readBoard();
    const card = current.notes.find((note) => note.id === args.id) ?? current.notes.find((note) => note.headline.trim().toLowerCase() === args.id.trim().toLowerCase());
    if (!card) return ok(`No card with id or headline "${args.id}". Call list_board.`);
    const other = card.alternativeOf ? current.notes.find((note) => note.id === card.alternativeOf) : current.notes.find((note) => note.alternativeOf === card.id);
    if (!other) return ok(`"${card.headline}" has no other version; nothing to choose.`);
    askShape();
    const { state, changed, result, live } = await commit({ type: "choose_version", id: card.id, keep: args.keep === true });
    if (!changed) return ok("Nothing chosen.");
    // What the version stepping forward took from the front card is named, arrow by arrow: a setup arrow is a claim
    // that was true of the scene "either way of it", and the writer is the one who knows whether it holds in this
    // version (round twenty-four, entry 35).
    const head = (id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`;
    const hadBefore = new Set(current.arrows.filter((arrow) => arrow.from === card.id || arrow.to === card.id).map((arrow) => `${arrow.from}>${arrow.to}>${arrow.kind}`));
    const carriedSetups = result.steppedForward
      ? state.arrows.filter((arrow) => arrow.kind === "setup" && (arrow.from === card.id || arrow.to === card.id) && !hadBefore.has(`${arrow.from}>${arrow.to}>${arrow.kind}`))
      : [];
    const carried = carriedSetups.map((arrow) => (arrow.to === card.id ? `it now pays off ${head(arrow.from)} (arrow ${arrow.id})` : `it now sets up ${head(arrow.to)} (arrow ${arrow.id})`));
    const carriedLine = carried.length ? ` Carried from "${other.headline}": ${carried.join("; ")} — true of the scene either way of it, or of that version only? delete_arrow takes one off, and the fold then asks again.` : "";
    return ok(`Chose "${card.headline}"${result.steppedForward ? ` — it steps forward into "${other.headline}"'s place, with its arrows, rank, group and threads${!card.plants && other.plants ? `, and its fold${other.plantsWhat ? ` ("${other.plantsWhat}")` : ""}` : ""}` : ""}${where(live)}.${carriedLine} "${other.headline}" ${result.kept ? "is kept, set aside below it, clear of the other cards: on the wall and not in the film — out of the order, the count, the pages and every export; the reading lists it and asks nothing of it. set_aside with aside false brings it back as a plain card" : "is gone"}.`, result);
  },
);

server.registerTool(
  "set_open",
  {
    title: "Leave a card open",
    description:
      "Mark one or more cards open, with the writer's words for what is not decided — \"whether Tom knows\", \"who sent the letter\". An open card is listed by read_wall under its own head, with what it would be asked if closed, and asked nothing of itself while the words stand: not its place, its change line, its arrows, its cast or its fold; a question about the run it sits in — beats back to back, a sag — is still asked, because that is about the story around it. It is still counted, in the order, and a page. open \"\" closes the card and its questions come back on their own. Only on the writer's word — a card is open because they said so, never because you could not decide; where the notes have two versions, ask, and if they say leave it, this is how.",
    inputSchema: { ids: z.array(z.string()).min(1), open: z.string() },
  },
  async (args) => {
    const { state, changed, result, live, before } = await commit({ type: "set_open", ids: args.ids, open: args.open });
    if (!changed) {
      const missing = args.ids.filter((id) => !state.notes.some((note) => note.id === id));
      return ok(missing.length ? `No card with id ${missing.join(", ")}. Call list_board for the real ids.` : `Nothing changed: ${args.ids.length === 1 ? "the card already says that" : "those cards already say that"}.`);
    }
    const words = result[0]?.open ?? "";
    // New words replace the old whole, so the reply shows what they replaced: a slip in retyping the writer's words is seen (round twenty-two, entry 39).
    const was = [...new Set(result.map((note) => (before?.notes.find((item) => item.id === note.id)?.open ?? "").trim()).filter((old) => old && old !== words.trim()))];
    const replaced = words && was.length ? ` The words replace what stood there whole — before: ${was.map((old) => `"${old}"`).join("; ")}.` : "";
    return ok(
      words
        ? `${result.length} card(s) open: "${words}"${where(live)}.${replaced} The reading lists ${result.length === 1 ? "it" : "them"} under "open, by the writer's word" and asks nothing else of ${result.length === 1 ? "it" : "them"} while the words stand; the card wears the words on its edge. set_open with "" closes it.`
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
      `Fold the corner of cards — mark them as planting something — or unfold them. ${wordSentence("corner")} what is a short label for the thing planted ("the jar of coins"), repeated wherever the fold is named: how it is first seen and how it pays off are what happens in those two scenes, so they go in those cards' change lines or text, never in the label; when the change line is the writer's own words, ask before adding to it, and keep it meanwhile as a [[note]] in the scene's text with write_scene — a scene whose text is only notes is still unwritten, so that is not writing the scene. The setup arrow is create_arrow with kind 'setup'. A fold that pays off in a later episode: pass later, another board of the project by name, id or number — a board that exists; new_board makes one — and, once you know it, at: the scene on that board that pays it off, by id or headline. A board alone is a promise: the reading lists the card under 'later' and, once that board holds cards, asks which scene until one claims it; with at, both boards' readings name the payoff and the paying-off card says so. later '' forgets the board; at '' keeps the board and forgets the scene. set_payoff makes the same claim from the other board. Folding never moves a card.`,
    inputSchema: {
      ids: z.array(z.string()).min(1),
      plants: z.boolean().optional(),
      what: z.string().optional(),
      later: z.string().optional(),
      at: z.string().optional(),
    },
  },
  async (args) => {
    if (args.plants === undefined && args.what === undefined) return ok("Say which: plants (true folds, false unfolds), or what (the writer's words for what it plants, which folds the card; \"\" keeps the fold and drops the words).");
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
      const before = new Map(current().notes.filter((note) => args.ids.includes(note.id)).map((note) => [note.id, { plants: note.plants, boardId: note.payoffBoardId, noteId: note.payoffNoteId, what: (note.plantsWhat ?? "").trim() }]));
      const alreadyFolded = args.plants && args.ids.every((id) => before.get(id)?.plants);
      let { result } = step({ type: "set_plant", ids: args.ids, ...(args.plants !== undefined ? { plants: args.plants } : {}), ...(args.what !== undefined ? { what: args.what } : {}) });
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
      // What the reply needs to be true of this wall (round twenty-two, entries 55, 56): the setup arrows that already pay these folds off, and the words the new ones replaced.
      const after = current();
      const paidAt = after.arrows.filter((arrow) => arrow.kind === "setup" && args.ids.includes(arrow.from)).map((arrow) => after.notes.find((note) => note.id === arrow.to)?.headline).filter(Boolean);
      const wasWords = [...new Set([...before.values()].map((was) => was.what).filter(Boolean))];
      return { result, laterLine, paidAt, wasWords };
    });
    const { result, laterLine, paidAt = [], wasWords = [] } = value;
    const count = result?.length ?? 0;
    if (!changed || count === 0) return ok("No change: those cards were already that way, or the ids are not on the board.");
    const what = result?.[0]?.plantsWhat ?? "";
    return ok(
      args.plants !== false
        ? `${count} card(s) now plant ${what ? `"${what}"` : "something"}${where(live)}.${what && wasWords.length && !wasWords.includes(what) ? ` The words replace what the fold said — before: ${wasWords.map((old) => `"${old}"`).join("; ")}.` : ""}${
            paidAt.length && !laterLine.trim().replace("(already folded)", "")
              ? `${what ? ` The card says "Plants · ${what}".` : ""} Its setup arrow to ${paidAt.map((headline) => `"${headline}"`).join(", ")} still pays it off, so read_wall asks nothing about it.`
              : `${what ? ` The card says "Plants · ${what}", and read_wall asks where it comes back` : " read_wall will ask about each"}${laterLine || " until a setup arrow pays it off, or later names the board it pays off on."}`
          }${args.what === "" ? " The fold keeps no words now." : ""}`
        : `${count} card(s) no longer marked as planting${where(live)}.${result?.some((note) => !note.plantsWhat) && args.ids.length ? "" : ""}`,
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
    // An open card reads as open on a person's page too (round eighteen, entry 53).
    const where_ = (note) => [note.location ? atPlaceWords(note.location) : note.locationOpen ? `where open: "${note.locationOpen}"` : "", note.when ? note.when : note.whenOpen ? `when open: "${note.whenOpen}"` : "", note.rank === "beat" ? "beat" : "", note.open ? `open: "${note.open}"` : ""].filter(Boolean).join(" · ");
    // A read opens with the door it came through, like every reading (round sixteen, entry 28); one scene a line (29).
    const lines = [
      `PlotCoder cast (${door(live, base)})`,
      `${person.name} (${person.id}) — on ${total} card${total === 1 ? "" : "s"} across ${project.boards.length} board${project.boards.length === 1 ? "" : "s"} of the project`,
      // Four empty lines say the same thing four times (round twenty, entry 56): once is enough, and it says what empty means.
      ...(CHARACTER_FIELDS.every((field) => !(person[field] ?? "").trim())
        ? [`  ${CHARACTER_FIELDS.join(", ")}: (empty — nothing given yet, nothing invented; update_character fills a line)`]
        : CHARACTER_FIELDS.map((field) => `  ${field}: ${(person[field] ?? "").trim() || "(empty)"}`)),
      // What the writer has not decided about them, in their words (round twenty-two, entries 12, 24).
      ...((person.open ?? "").trim() ? [`  not decided yet, by the writer's word: ${person.open.trim()}`] : []),
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
      "Something the writer has not decided about a person — \"what he goes to the town for: a hospital visit, a music lesson, or the courthouse\" — is open, with their words: the reading lists it under open, by the writer's word, as \"about <name>\", and never asks; open \"\" takes the words back once it is decided and the answer has gone where it belongs (their notes, a scene). Not a line of the page. Otherwise: write any of the five lines of a person's page, by id or by name: looks (what a stranger would notice), voice (how they sound, and how it changes when they lie), wants (the clear want), needs (what they need and will not admit), notes (anything to pull up mid-scene). All text; pass only the lines you are setting; an empty string clears one. Ask the writer before inventing looks or a voice — the page is theirs.",
    inputSchema: {
      id: z.string().optional(),
      name: z.string().optional(),
      looks: z.string().optional(),
      voice: z.string().optional(),
      wants: z.string().optional(),
      needs: z.string().optional(),
      notes: z.string().optional(),
      open: z.string().optional(),
    },
  },
  async (args) => {
    const patch = {};
    for (const field of PERSON_TEXT_FIELDS) {
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
    const openLine = "open" in patch ? ((result.open ?? "").trim() ? ` What is open about ${result.name} is listed by the reading under "open, by the writer's word", and never asked.` : ` Nothing is left open about ${result.name} now.`) : "";
    return ok(`Set ${lines.join("; ")} on ${result.name}'s page${where(live)}. A line set here replaces the old one.${openLine}`, result);
  },
);

/** A near match on the wall is probably the same place spelled twice (round ten; update_note too, round nineteen entry 36). */
function nearPlaces(state, place) {
  const wanted = (place ?? "").trim().toLowerCase();
  const near = wanted
    ? [...new Set(state.notes.map((note) => (note.location ?? "").trim()).filter(Boolean))].filter(
        (other) => other.toLowerCase() !== wanted && (other.toLowerCase().includes(wanted) || wanted.includes(other.toLowerCase())),
      )
    : [];
  return near.length ? ` The wall also has ${near.map((other) => `"${other}"`).join(", ")} — the same place spelled twice, or two places? Each distinct phrase counts as one place.` : "";
}

server.registerTool(
  "set_location",
  {
    title: "Set where scenes happen",
    description:
      "Set the place of one or more cards: where the scene happens, as the writer would say it ('the piano shop', 'the flat, kitchen') — a phrase, not a slugline. The same phrase on several cards is one place in the Cast panel; an empty string clears it. Or leave the place open: pass open with the writer's words for why it is not decided — \"where it happens\" — and the reading lists it under open, by the writer's word, and stops asking where, while the card's other questions stand; a place decides it, open \"\" leaves it blank. list_board shows each card's place as 'at: …'.",
    inputSchema: { ids: z.array(z.string()).min(1), location: z.string().optional(), open: z.string().optional() },
  },
  async (args) => {
    if (args.location === undefined && args.open === undefined) return ok("Say which: location (the place, or \"\" to clear it), or open (the writer's words for why it is not decided).");
    const { state, changed, result, live } = await commit({
      type: "set_location",
      ids: args.ids,
      ...(args.location !== undefined ? { location: args.location } : {}),
      ...(args.open !== undefined ? { open: args.open } : {}),
    });
    if (!changed) {
      const known = args.ids.filter((id) => state.notes.some((note) => note.id === id));
      if (known.length === 0) return ok(`No cards with ids ${args.ids.join(", ")}. Call list_board.`);
      return ok("No place changed: those cards already read that way.");
    }
    const place = result[0].location;
    const placeOpen = result[0].locationOpen ?? "";
    if (placeOpen) {
      return ok(`${result.length} card(s) have their place left open, by the writer's word: "${placeOpen}"${where(live)}. The reading lists it and stops asking where; the heading prints the headline in its stead; set_location with a place decides it, open "" leaves it blank. The card is still asked about everything else.${stillOpen(result)}`, result);
    }
    return ok(
      `${result.length} card(s) now ${place ? atPlaceWords(place) : "nowhere"}${where(live)}.${nearPlaces(state, place)}${stillOpen(result)}`,
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
      "Set who is in one or more cards of the open board (open_board first for another board's cards). Takes card ids and character names or ids; the list replaces the card's cast, so pass everyone who is in the scene. An empty list clears it. A name not yet in the cast is added to it, as create_note does, and the reply says so — the writer named them, so it is not inventing; a role is a name. When the writer does not know whether someone is in the scene, put a question mark after the name — 'Tomás?' — and the wall holds it as not decided: listed under open, never asked, and counted neither way by the cast's counts or the check for someone gone too long; the name without the mark decides it, and leaving the name off decides it the other way. Only on the writer's word.",
    inputSchema: {
      noteIds: z.array(z.string()).min(1),
      characters: z.array(z.string()),
      castOpen: z.string().optional().describe("The writer's words for why who is in the scene is not decided — \"I don't know yet\", or \"anyone else: I don't know\" beside the names — listed under open, and the card is not asked who is in it. \"\" clears the words; leave it out and the card keeps its own."),
    },
  },
  async (args) => {
    // A name the cast does not have is added to it in the same frame, as
    // create_note does — two tools, one rule (round seventeen, entry 14).
    const added = [];
    // Who was on the first card before, so the reply can say who came off and which maybe was decided (round twenty-three, entry 58).
    const beforeCast = (await readBoard()).state.notes.find((note) => note.id === args.noteIds[0]);
    const { state, changed, value: result, live } = await commitAll(`cast ${args.noteIds.length} card(s)`, (step, current) => {
      const characterIds = [];
      const maybeCharacterIds = [];
      for (const typed of args.characters) {
        // "Tomás?" — someone who may or may not be in it (H9). The list replaces the card's cast, its maybes with it.
        const { name: who, maybe } = readMaybe(typed);
        const wanted = who.toLowerCase();
        let person = current().characters.find((character) => character.id === who || character.name.trim().toLowerCase() === wanted);
        if (!person && wanted) {
          person = step({ type: "add_character", name: who }).result;
          if (person) added.push(`${person.name} (${person.id})`);
        }
        const into = maybe ? maybeCharacterIds : characterIds;
        if (person && !characterIds.includes(person.id) && !maybeCharacterIds.includes(person.id)) into.push(person.id);
      }
      return step({ type: "set_cast", ids: args.noteIds, characterIds, maybeCharacterIds, ...(typeof args.castOpen === "string" ? { open: args.castOpen } : {}) }).result;
    });
    const characterIds = (result ?? []).length ? result[0].characterIds : [];
    const maybeIds = (result ?? []).length ? (result[0].maybeCharacterIds ?? []) : [];
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
    const maybeNames = maybeIds.map((id) => state.characters.find((character) => character.id === id)?.name ?? id);
    const nameOf = (id) => state.characters.find((character) => character.id === id)?.name ?? id;
    const decidedIn = args.noteIds.length === 1 && beforeCast ? (beforeCast.maybeCharacterIds ?? []).filter((id) => characterIds.includes(id)).map(nameOf) : [];
    const decidedOut = args.noteIds.length === 1 && beforeCast ? (beforeCast.maybeCharacterIds ?? []).filter((id) => !characterIds.includes(id) && !maybeIds.includes(id)).map(nameOf) : [];
    const cameOff = args.noteIds.length === 1 && beforeCast ? (beforeCast.characterIds ?? []).filter((id) => !characterIds.includes(id) && !maybeIds.includes(id)).map(nameOf) : [];
    const whatChanged = [decidedIn.length ? `decided: ${decidedIn.join(", ")} ${decidedIn.length === 1 ? "is" : "are"} in it` : "", decidedOut.length ? `decided: ${decidedOut.join(", ")} ${decidedOut.length === 1 ? "is" : "are"} not in it, so that is no longer open` : "", cameOff.length ? `off the card: ${cameOff.join(", ")}` : ""].filter(Boolean).join("; ");
    return ok(
      `${result.length} card(s) now cast ${names.length ? names.join(", ") : "nobody"}${maybeNames.length ? `, with ${maybeNames.join(", ")} not decided (listed under open, counted neither way; the name without the mark decides it)` : ""}${whatChanged ? ` (${whatChanged})` : ""}${(result[0]?.castOpen ?? "").trim() ? `, who ${names.length || maybeNames.length ? "else " : ""}is in it left open, by the writer's word: "${result[0].castOpen}" (listed, not asked)` : ""}: ${result.map((note) => `"${note.headline}"`).join(", ")}${added.length ? ` (added to the cast: ${added.join(", ")})` : ""}${where(live)}.${stillOpen(result)}`,
      result,
    );
  },
);

// --- Threads (R60) ----------------------------------------------------------
//
// A thread is a named string through cards, either end open until the writer
// ties it: the record for a thing the writer knows the far end of — the
// bucket in the last scene, the key that changes hands — and not where it is
// first seen. A fold and a setup arrow are still how a plant and its payoff
// are drawn; a thread is beside them, in the writer's words, and the reading
// asks about each loose end from that end.

function threadByRef(state, ref) {
  const wanted = (ref ?? "").trim();
  if (!wanted) return null;
  return (state.threads ?? []).find((thread) => thread.id === wanted) ?? (state.threads ?? []).find((thread) => thread.name.trim().toLowerCase() === wanted.toLowerCase()) ?? null;
}

function cardsByRef(state, refs) {
  const found = [];
  const missing = [];
  for (const ref of refs ?? []) {
    const wanted = (ref ?? "").trim();
    const note = state.notes.find((item) => item.id === wanted) ?? state.notes.find((item) => item.headline.trim().toLowerCase() === wanted.toLowerCase()) ?? null;
    if (note) found.push(note.id);
    else missing.push(ref);
  }
  return { found, missing };
}

/** "at the pier", but "upstairs at the Harbour Bar" as it is: no "at" before a place that opens with one (round twenty-four, entry 19). */
function atPlaceWords(place) {
  return /^(at|in|on|inside|outside|upstairs|downstairs|under|by|behind|beside|above|below|over|across|along|near|aboard|around|off)\b/i.test(place.trim()) ? place.trim() : `at ${place}`;
}

/** A card's headline, quoted, from a state — or the id when the card is gone. */
function headlineOf(state, id) {
  return `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`;
}

/** What tying a thread at both ends did to the fold (R62), in words for the reply. */
function foldLine(state, fold, thread) {
  if (!fold) return "";
  const head = (id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`;
  if (fold.kept) return ` ${head(fold.firstId)} is folded for ${fold.what}, so "${thread.name}" stays a thread and no arrow is drawn: a card has one fold.`;
  if (fold.waiting) {
    const card = state.notes.find((note) => note.id === fold.waiting);
    const why = card?.alternativeOf ? `a version behind ${head(card.alternativeOf)} — choose_version decides` : "set aside — set_aside with aside false brings it back";
    return ` An end of "${thread.name}" is on ${head(fold.waiting)}, which is not in the film (${why}): the string holds it, the reading asks nothing of that end, and the fold and the setup arrow wait until it is the scene.`;
  }
  // The arrow it drew is named by its id, as any arrow a tool makes is: the next call may need it (round twenty-two, entry 61).
  const drew = fold.arrow ? state.arrows.find((arrow) => arrow.kind === "setup" && arrow.from === fold.firstId && arrow.to === fold.lastId) : null;
  const did = [fold.folded ? `folded ${head(fold.firstId)} (${fold.firstId})` : null, fold.named ? `named its fold "${thread.name}"` : null, fold.arrow ? `drew the setup arrow to ${head(fold.lastId)}${drew ? ` (arrow ${drew.id})` : ""}` : null].filter(Boolean);
  const adjacent = fold.adjacent ? ` A follows arrow already runs from ${head(fold.firstId)} to ${head(fold.lastId)}: the payoff is the very next scene, and the setup arrow runs beside it.` : "";
  return did.length ? ` Tied at both ends, so it is the fold's now: ${did.join(", ")}.${adjacent}` : adjacent;
}

/** A thread's card as the replies print it: the headline, and where the card is when it is not in the film. */
function threadCard(state, id) {
  const note = state.notes.find((item) => item.id === id);
  if (!note) return `"${id}"`;
  const front = note.alternativeOf ? state.notes.find((item) => item.id === note.alternativeOf) : null;
  const mark = note.alternativeOf ? ` (a version behind "${front?.headline ?? note.alternativeOf}")` : note.aside ? " (set aside)" : "";
  return `"${note.headline}"${mark}`;
}

/** The cards on a thread that are not in the film, said once, so a writer's word is not held in silence (round twenty-four, entry 17). */
function heldLine(state, thread) {
  const held = (thread.noteIds ?? []).map((id) => state.notes.find((note) => note.id === id)).filter((note) => note && (note.alternativeOf || note.aside));
  if (!held.length) return "";
  return ` ${held.length === 1 ? "One card on it is" : `${held.length} cards on it are`} not in the film — ${held.map((note) => threadCard(state, note.id)).join(", ")}: the string keeps ${held.length === 1 ? "it" : "them"}, the reading asks nothing of that end while the card is out of the film, and choose_version (or set_aside with aside false) makes it the scene.`;
}

function threadLine(state, thread) {
  const order = thread.noteIds.filter((id) => state.notes.some((note) => note.id === id));
  const cards = order.length ? order.map((id) => threadCard(state, id)).join(" → ") : "no card yet";
  const ends = [thread.startOpen ? "starts nowhere yet" : null, thread.endOpen ? "ends nowhere yet" : null].filter(Boolean);
  return `"${thread.name}" (${thread.id}): ${cards}${ends.length ? ` — ${ends.join(", ")}` : order.length ? " — both ends tied" : ""}`;
}

server.registerTool(
  "create_thread",
  {
    title: "Name a thread",
    description:
      "Name a thread — a thing that runs through the story and is first seen somewhere and comes out somewhere: \"the letter\", \"the shop's lease\", a subplot — and string it through the cards it touches, by id or headline, in story order. Say which end is not decided: startOpen when the writer knows where it comes out and not where it is first seen; endOpen when the card where it comes out is not decided — they may know it comes out at the end and not on which card, or what happens when it does; the last is the end card's change line, open in their words. The reading asks about each open end from that end — \"where is it first seen?\" — until update_thread ties it, and lists every thread with its cards. A thread is beside the fold and the setup arrow, not instead of them: fold the card that plants and draw the setup arrow when both scenes exist; a thread is for the writer's word before they do, and for a strand a fold cannot hold. Only on the writer's word: a thread is theirs to name.",
    inputSchema: {
      name: z.string().min(1),
      cards: z.array(z.string()).optional(),
      startOpen: z.boolean().optional(),
      endOpen: z.boolean().optional(),
    },
  },
  async (args) => {
    const current = await readBoard();
    const { found, missing } = cardsByRef(current.state, args.cards);
    if (missing.length) return ok(`No thread made: not on the board — ${missing.map((ref) => `"${ref}"`).join(", ")}. Call list_board for the ids or the exact headlines.`);
    const { state, changed, result, live } = await commit({ type: "create_thread", name: args.name, noteIds: found, startOpen: args.startOpen === true, endOpen: args.endOpen === true });
    if (!changed) return ok("No thread made: a thread needs a name.");
    const asks = [result.startOpen ? "where it is first seen" : null, result.endOpen ? "where it comes out" : null].filter(Boolean);
    return ok(
      `Named the thread ${threadLine(state, result)}${where(live)}.${heldLine(state, result)}${asks.length ? ` The reading asks ${asks.join(" and ")} until update_thread ties ${asks.length === 1 ? "that end" : "them"}.` : result.noteIds.length ? " Both ends are tied; the reading lists it and asks nothing." : " No card yet: the reading asks where it is first seen and where it comes out."}${foldLine(state, result.fold, result)} The wall draws it as a string through its cards, a loose end where one is open.`,
      result,
    );
  },
);

server.registerTool(
  "update_thread",
  {
    title: "Tie or change a thread",
    description:
      "Change a thread by id or name: rename it, add cards (by id or headline) or remove them, or tie an end — startOpen false once the writer says where it is first seen, endOpen false once they say where it comes out; true reopens an end. Adding the card where a thing is first seen and tying the start is one call: add plus startOpen false. The reading stops asking about an end the moment it is tied.",
    inputSchema: {
      thread: z.string(),
      name: z.string().optional(),
      add: z.array(z.string()).optional(),
      remove: z.array(z.string()).optional(),
      startOpen: z.boolean().optional(),
      endOpen: z.boolean().optional(),
    },
  },
  async (args) => {
    const current = await readBoard();
    const thread = threadByRef(current.state, args.thread);
    if (!thread) return ok(`No thread called "${args.thread}". list_board names the threads on this board; create_thread names a new one.`);
    const add = cardsByRef(current.state, args.add);
    const remove = cardsByRef(current.state, args.remove);
    const missing = [...add.missing, ...remove.missing];
    if (missing.length) return ok(`Nothing changed: not on the board — ${missing.map((ref) => `"${ref}"`).join(", ")}. Call list_board for the ids or the exact headlines.`);
    // A card out of the film — behind another as its other version, or set aside — may be on a thread (round
    // twenty-four, entry 17): the kernel holds it beside its front, or last, and the reply says so below.
    const { state, changed, result, live } = await commit({
      type: "update_thread",
      id: thread.id,
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(add.found.length ? { add: add.found } : {}),
      ...(remove.found.length ? { remove: remove.found } : {}),
      ...(typeof args.startOpen === "boolean" ? { startOpen: args.startOpen } : {}),
      ...(typeof args.endOpen === "boolean" ? { endOpen: args.endOpen } : {}),
    });
    if (!changed) return ok(`Nothing changed: "${thread.name}" already reads that way.`);
    const tied = [result.before.startOpen && !result.thread.startOpen ? "its start" : null, result.before.endOpen && !result.thread.endOpen ? "its end" : null].filter(Boolean);
    const reopened = [!result.before.startOpen && result.thread.startOpen ? "its start" : null, !result.before.endOpen && result.thread.endOpen ? "its end" : null].filter(Boolean);
    return ok(
      `Now ${threadLine(state, result.thread)}${where(live)}.${heldLine(state, result.thread)}${tied.length ? ` Tied ${tied.join(" and ")}; the reading stops asking about ${tied.length === 1 ? "it" : "them"}.` : ""}${reopened.length ? ` Opened ${reopened.join(" and ")}; the reading asks about ${reopened.length === 1 ? "it" : "them"} again.` : ""}${foldLine(state, result.fold, result.thread)}`,
      result.thread,
    );
  },
);

server.registerTool(
  "delete_thread",
  {
    title: "Cut a thread",
    description: "Remove a thread by id or name. The cards stay; only the string and its name go. Only on the writer's word.",
    inputSchema: { thread: z.string() },
  },
  async (args) => {
    const current = await readBoard();
    const thread = threadByRef(current.state, args.thread);
    if (!thread) return ok(`No thread called "${args.thread}". list_board names the threads on this board.`);
    const { changed, result, live } = await commit({ type: "delete_thread", id: thread.id });
    if (!changed) return ok(`No thread called "${args.thread}".`);
    return ok(`Cut the thread "${result.name}"${where(live)}; its ${result.noteIds.length} card${result.noteIds.length === 1 ? "" : "s"} stay where they are.`, result);
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
      "Draw a directed arrow from one card to another. kind 'follows' (the default) says what comes after what — a straight sequence needs them too: organize lays the wall out along them, and the wall asks about a card no arrow touches; kind 'setup' says the first card plants something the second pays off. Arrows are one-way: A→B does not create B→A. If you want both, call this twice — that is two arrows, not one two-headed line. A card cannot point at itself. A pair of cards carries at most one follows arrow and one setup arrow the same way — a plant whose payoff is the very next scene has both — and a second of the same kind is not drawn; set_arrow_kind changes one.",
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
              : (() => {
                  const outside = state.notes.find((note) => (note.id === args.from || note.id === args.to) && (note.alternativeOf || note.aside));
                  return outside && args.kind !== "setup"
                    ? `"${outside.headline}" is not in the film (${outside.aside ? "set aside: set_aside with aside false brings it back" : "behind another card as its other version: choose_version decides"}), and a follows arrow is a place in the story; a setup arrow, a claim, it can carry`
                    : `a ${args.kind ?? "follows"} arrow already runs that way (a pair carries one follows and one setup arrow at most; set_arrow_kind changes one, delete_arrow takes one off)`;
                })();
      return ok(`No arrow drawn: ${why}. Call list_board to check.`);
    }
    const name = (id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`;
    const paidOff = result.kind === "setup" && state.notes.find((note) => note.id === args.from)?.plants ? ` The fold on ${name(args.from)} is paid off now; the wall stops asking where it comes back.` : "";
    return ok(
      result.kind === "setup"
        ? `Drew ${name(args.from)} → ${name(args.to)} as a setup: the first plants what the second pays off${where(live)}.${paidOff}`
        : `Drew ${name(args.from)} → ${name(args.to)}: the second follows the first${where(live)}.${storyRunsLine(state, [args.from, args.to])}`,
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
      const arrow = state.arrows.find((item) => item.id === args.id);
      if (!arrow) return ok(`No arrow with id ${args.id}. Call list_board for the real ids.`);
      if (arrow.kind === args.kind) return ok(`That arrow is already '${args.kind}'.`);
      const twin = state.arrows.find((item) => item.id !== arrow.id && item.from === arrow.from && item.to === arrow.to && item.kind === args.kind);
      return ok(`Not changed: a '${args.kind}' arrow (${twin?.id ?? "?"}) already runs the same way between those cards, and a pair carries one of each kind at most. delete_arrow takes this one off if it is not wanted.`);
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
          ? `${state.notes.length} cards, ${pagesOfTarget(normalizeState(state))}`
          : "no cards";
      const changed = changedAt?.[board.id] ? `, last changed ${changedAt[board.id]}` : "";
      const nameOpen = board.nameOpen ? ` (name open, by the writer's word: "${board.nameOpen}")` : "";
      return `  ${index + 1}. ${board.id} — "${board.name}"${nameOpen}${open}: ${shape}${changed}`;
    })
    .join("\n");
}

/**
 * The project as a whole (round fifteen, entry 14; the handover's first
 * call): every board's questions in one reading, with what each board
 * leaves open, the folds that pay off on another board, and the project's
 * length. Each board is read as read_wall reads it — the same checks, the
 * same cross-board context — so this never says something read_wall would
 * not; it only says it for every board at once.
 */
server.registerTool(
  "read_project",
  {
    title: "Read the project",
    description:
      "Every board's reading in one call: for each board in the writer's order, its logline, its runtime, the questions it asks and what it leaves open by the writer's word — the same checks read_wall runs, board by board — then the folds that pay off on another board and the project's length. The records — cards, ids, cast, places — are list_board's, board by board; open_board and read_wall for one board in full.",
    inputSchema: {},
  },
  async () => {
    const { project, boards, live, base } = await readProject();
    const states = new Map(project.boards.map((meta) => [meta.id, isBoardState(boards[meta.id]) ? normalizeState(boards[meta.id]) : emptyState()]));
    const boardsNow = Object.fromEntries(states);
    const lines = [
      `PlotCoder project "${project.name}"${project.nameOpen ? ` — its name is open, by the writer's word: "${project.nameOpen}"` : ""} (${door(live, base)})`,
      `premise: ${project.premiseOpen ? `open, by the writer's word — "${project.premiseOpen}"` : project.premise ? `"${project.premise}"` : "(not set)"}`,
    ];
    let asked = 0;
    for (const [index, meta] of project.boards.entries()) {
      const state = states.get(meta.id);
      const reading = readWall(state, { elsewhere: Object.keys(castElsewhere(project, boardsNow, meta.id)), laterBoards: laterBoards(project, boardsNow), paidBy: landingsOn(project, boardsNow, meta.id).paid });
      asked += reading.findings.length;
      const open = reading.open.length + reading.openFields.length + (meta.nameOpen ? 1 : 0);
      const headline = (id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`;
      lines.push(
        `${index + 1}. "${meta.name}"${meta.nameOpen ? ` (name open: "${meta.nameOpen}")` : ""}${meta.id === project.activeBoardId ? " (open)" : ""} — ${state.notes.length} card${state.notes.length === 1 ? "" : "s"}, ${reading.beats.length} beat${reading.beats.length === 1 ? "" : "s"}, ${pagesOfTarget(state)}; logline: ${state.loglineOpen ? `open — "${state.loglineOpen}"` : state.logline ? `"${state.logline}"` : "(none yet)"}`,
        ...(reading.findings.length ? reading.findings.map((finding) => `   - [${finding.kind}] ${finding.text}`) : [`   (asks nothing${reading.left.length ? `; ${reading.left.length} left by the writer` : ""}${state.notes.length ? "" : ": no cards yet"})`]),
        ...(open ? [`   open by the writer's word: ${[reading.open.length ? `${reading.open.length} card${reading.open.length === 1 ? "" : "s"}` : "", reading.openFields.length ? `${reading.openFields.length} field${reading.openFields.length === 1 ? "" : "s"}` : "", meta.nameOpen ? "the board's name" : ""].filter(Boolean).join(", ")} — read_wall there lists them`] : []),
        ...reading.threads.filter((thread) => thread.startOpen || thread.endOpen).map((thread) => `   thread "${thread.name}" — ${thread.startOpen ? "starts nowhere yet" : ""}${thread.startOpen && thread.endOpen ? ", " : ""}${thread.endOpen ? "ends nowhere yet" : ""}`),
        ...reading.later.map((item) => `   "${headline(item.id)}" is folded and pays off later, on "${boardById(project, item.boardId)?.name ?? item.boardId}"${item.noteId ? `, at "${boardsNow[item.boardId]?.notes?.find((note) => note.id === item.noteId)?.headline ?? item.noteId}"` : ", no scene there claimed yet"}`),
      );
    }
    const pages = [...states.values()].reduce((sum, state) => sum + boardEighths(state), 0);
    const target = [...states.values()].reduce((sum, state) => sum + state.targetEighths, 0);
    const cards = [...states.values()].reduce((sum, state) => sum + state.notes.length, 0);
    lines.push(`the whole project: ${cards} card${cards === 1 ? "" : "s"}, about ${formatPages(pages)} of ${formatPages(target)} pages across ${project.boards.length} board${project.boards.length === 1 ? "" : "s"}; ${asked} question${asked === 1 ? "" : "s"} in all (each board's runtime is an estimate unless every scene is written)`);
    return ok(lines.join("\n"), { project: { id: project.id, name: project.name }, boards: project.boards.map((meta) => meta.id), asked });
  },
);

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
        `Project "${project.name}"${project.nameOpen ? ` — its name is open, by the writer's word: "${project.nameOpen}"` : ""} (${door(live, base)})`,
        `premise: ${project.premiseOpen ? `open, by the writer's word — "${project.premiseOpen}"` : project.premise ? `"${project.premise}"` : "(not set)"}`,
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
      "Set the project's premise: the line above every board's logline, held by the project whatever its board count — what a series is about, or what is true before a film starts ('the winter the shop closes'). An empty string clears it. Or leave it open: pass open with the writer's words for why there is no premise yet — \"the buyer: a sale, or a lease\" — and the reading lists it under open, by the writer's word; a premise decides it, open \"\" leaves it blank. Boards keep their own loglines. The premise is also where a fact about the whole film goes when no card holds it: its span (\"September to New Year\"), when it is set (\"five days in August\"), a rule it keeps (\"Con does not die in this film\") — a sentence each. A film with nothing true before it starts and no such fact leaves the premise blank, and the reading does not ask for one. read_wall prints it above the logline and read_pages at the head of the script, so whoever writes a scene sees it; a fact about one scene belongs on that scene's card.",
    inputSchema: { premise: z.string().optional(), open: z.string().optional() },
  },
  async (args) => {
    if (args.premise === undefined && args.open === undefined) return ok("Say which: premise (the line, or \"\" to clear it), or open (the writer's words for why there is none yet).");
    const { project, boards, rev, base, live } = await readProject();
    const next = args.open !== undefined ? setPremiseOpen(project, args.open) : setPremise(project, args.premise);
    if (next === project) return ok("Premise unchanged.");
    await writeProject(next, boards, rev, base);
    const wasPremise = replacedWords([project.premise, project.premiseOpen], [next.premise, next.premiseOpen]);
    if (next.premiseOpen) return ok(`Premise left open, by the writer's word: "${next.premiseOpen}"${where(live)}.${wasPremise} The reading lists it and asks nothing; set_premise with a line decides it, open "" leaves it blank.`, next);
    return ok(`Premise ${next.premise ? `set to "${next.premise}"` : "cleared"}${where(live)}.${wasPremise}`, next);
  },
);

server.registerTool(
  "set_title_page",
  {
    title: "Set the title page",
    description:
      "The title page's byline and contact, on the project — every script it sends out carries them, in Fountain, Final Draft, Markdown and plain text, with the draft date of the day it goes out: \"Written by …\" under the title, and the contact lines (an address, an agent, an email; several lines are fine) where a title page keeps them. The title itself is the project's name (rename_project); a series' episode line comes from the board. Pass author, contact, or both; \"\" clears one; leaving one out leaves it as it is. Nothing is claimed until the writer says who it is by.",
    inputSchema: { author: z.string().optional().describe("The byline as it should print after \"Written by\", or \"\" for none."), contact: z.string().optional().describe("The contact lines under the byline, newline-separated, or \"\" for none.") },
  },
  async (args) => {
    if (args.author === undefined && args.contact === undefined) return ok("Say which: author (the byline), contact (the lines under it), or both; \"\" clears one.");
    const { project, boards, rev, base, live } = await readProject();
    const next = setTitlePage(project, { author: args.author, contact: args.contact });
    if (next === project) return ok("Title page unchanged.");
    await writeProject(next, boards, rev, base);
    const front = [next.author ? `Written by ${next.author}` : "no byline", next.contact ? `contact: ${next.contact.split("\n").map((line) => line.trim()).filter(Boolean).join(" / ")}` : "no contact"].join("; ");
    return ok(`Title page: ${front}${where(live)}. Every export of "${next.name}" now carries it under the title, with the draft date of the day it goes out.`, { author: next.author, contact: next.contact });
  },
);

server.registerTool(
  "rename_project",
  {
    title: "Rename the project",
    description: "Rename the project — the name at the top of the wall, over every board. Or leave its name open: pass open with the writer's words for why the title is not decided — \"The Allotments, or Plot 14\" — and the name stands as it is while the reading lists the words; a name decides it, open \"\" takes the words back.",
    inputSchema: { name: z.string().min(1).optional(), open: z.string().optional() },
  },
  async (args) => {
    if (args.name === undefined && args.open === undefined) return ok("Say which: name, or open (the writer's words for why the title is not decided).");
    const { project, boards, rev, base, live } = await readProject();
    if (args.name === undefined) {
      const opened = setProjectNameOpen(project, args.open);
      if (opened === project) return ok("Project name unchanged: it already reads that way.");
      await writeProject(opened, boards, rev, base);
      return ok(opened.nameOpen ? `The project keeps its name, "${opened.name}", and its name is left open, by the writer's word: "${opened.nameOpen}"${where(live)}. The reading lists it; rename_project with a name decides it.` : `The project's name, "${opened.name}", is no longer open${where(live)}.`, { name: opened.name, nameOpen: opened.nameOpen });
    }
    const next = renameProject(project, args.name);
    if (next === project) return ok("Project name unchanged.");
    await writeProject(next, boards, rev, base);
    // The line at the head of every reply names the project it works; it must
    // follow the rename (round fifteen, entry 40).
    if (accountDoor) workingProject(next.id, next.name);
    const several = (next.boards ?? []).length > 1;
    return ok(`Project renamed to "${next.name}"${where(live)}.${project.nameOpen ? " Its name is decided; the open words are gone." : ""} It shows at the head of every reply, in list_boards and read_wall, and as the title of every script out${several ? `, where each board follows it as an episode line (Episode 1 of ${next.boards.length} · ${next.boards[0].name})` : ""}. The boards keep their names.`, next);
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
          `${error.message.replace(/\.$/, "")}.`,
          `reminders: ${house.length}, all the house's — the principles the app starts every project with; the writer's own will live on the project`,
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
      "Through the account door — a hosted connector signed in as the writer, or PLOTCODER_EMAIL and PLOTCODER_PASSWORD in the environment, no app open: every project the writer is on, newest first, with its people, marking the one this server is working. Through the dev bridge or the file there is one project, the open one.",
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
        ...projects.map((row) => `  - ${row.id} — "${row.record.name}"${row.id === account.projectId ? " (working)" : ""}: ${row.record.boards.length} board(s) · ${(row.people ?? []).join(", ")}${row.id === account.projectId ? (() => { const people = presentPeople(); return people.length ? ` · open now on ${people.length} screen${people.length === 1 ? "" : "s"}: ${people.join(", ")}` : hosted() ? " · who has a wall open: who_is_here waits for presence and says" : " · no wall open right now"; })() : ""}`),
      ].join("\n"),
      projects.map((row) => ({ id: row.id, name: row.record.name, boards: row.record.boards.length, people: row.people })),
    );
  },
);

server.registerTool(
  "who_is_here",
  {
    title: "Who has this wall open",
    description:
      "Who has a wall of the working project open on a screen right now, and whether this session shows beside them. People are named as the app's People sheet names them; an agent session shows as \"an agent, as <the writer's email>\". Waits a moment for presence to arrive, so it is the one call that can say \"nobody\" and mean it; when presence does not arrive in time it says it could not see, never \"nobody\". Presence lags a second or two: this is now, not \"seen by\". Through a folder on this machine there is no account and nobody else to see.",
    inputSchema: {},
  },
  async () => {
    const account = await findAccount();
    if (!account) {
      if (accountRefusal) return ok(accountRefusal);
      const { project, live } = await readProject();
      return ok(`"${project.name}" is a wall ${live ? "open in the app on this machine" : "in a folder on this machine, with no app running"}: there is no account behind it, so nobody else can have it open.`);
    }
    // Reading the project opens the door on it and joins its channel.
    let name = "";
    try {
      name = (await readProject()).project.name;
    } catch (error) {
      if (!(error instanceof DoorReply)) throw error;
      return ok(error.message);
    }
    // Presence has arrived when it has synced and this session's own entry is on it: the first sync
    // comes before our own track lands, and "is the agent counted?" was the round's question (entry 94).
    const until = Date.now() + 2000;
    const ownKey = `${accountDoor?.user?.id}-agent`;
    const arrived = () => accountDoor?.presenceSynced && Boolean(accountDoor?.channel?.presenceState?.()?.[ownKey]);
    while (!arrived() && Date.now() < until) await new Promise((resolve) => setTimeout(resolve, 100));
    const state = accountDoor?.channel?.presenceState?.() ?? {};
    return ok(describePresence(state, { synced: Boolean(accountDoor?.presenceSynced), project: name }));
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
    newWallInHand();
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
      "Through the account door: start a new project of the writer's with this name — one empty board, nothing on it — and work it from now on. The writer sees it under Projects on every device. A title not decided: open with the writer's words (\"The Allotments, or Plot 14\") instead of a name, and the project starts as Untitled project with those words beside it. A film is one board and goes out under the project's name: leave board alone and do not ask the writer to name it. For a series, board names the first episode; boardOpen leaves that name open in the writer's words instead (\"the pilot, or the film\").",
    inputSchema: {
      name: z.string().min(1).optional().describe("The title. Or leave it out and pass open."),
      open: z.string().optional().describe("The writer's words for why the title is not decided — \"The Tuner, or Four Forty\" — in place of name: the project starts as Untitled project with those words beside it."),
      board: z.string().optional().describe("A name for the first board. A film of one board needs none; an episode does."),
      boardOpen: z.string().optional().describe("The writer's words for why the first board's name is not decided, in place of board."),
      pages: pagesSchema.optional().describe("The target, when the writer gave a number of pages."),
      minutes: z.number().positive().optional().describe("The target, when the writer gave a running time: a page a minute."),
      kind: z.enum(["feature", "hour", "half-hour"]).optional().describe("The target as the writer said it — \"it is a feature\" — kept as their word and read as 120, 60 or 30 pages; not a page count. In place of pages or minutes."),
      targetOpen: z.string().optional().describe("The writer's words for why the length is not decided — \"half-hour or feature\" — so the target is born open instead of the feature default standing unsaid."),
    },
  },
  async (args) => {
    const account = await findAccount();
    if (!account) return shut("No account door: there is one project here, the open one. Set PLOTCODER_EMAIL and PLOTCODER_PASSWORD to start another on the writer's account.");
    if (!args.name?.trim() && !args.open?.trim()) return ok("Say which: name (the title), or open (the writer's words for why the title is not decided — the project starts as \"Untitled project\" with those words beside it).");
    let record = emptyProject();
    if (args.name?.trim()) record = renameProject(record, args.name.trim());
    // A project born from a maybe is born open on its name (R61's edge): open holds the writer's words.
    if (args.open?.trim()) record = setProjectNameOpen(record, args.open);
    if (args.board?.trim()) record = renameBoard(record, record.activeBoardId, args.board.trim());
    // A board born from a maybe is born open on its name (R61): boardOpen holds the writer's words.
    if (args.boardOpen?.trim()) record = setBoardNameOpen(record, record.activeBoardId, args.boardOpen);
    const inserted = await account.client.from("projects").insert({ id: record.id, record, reminders: null, rev: 1 });
    if (inserted.error) return ok(`Could not start the project: ${inserted.error.message}`);
    const target = args.pages ?? args.minutes;
    // A kind is the writer's word for the target, kept beside the pages it is read as (round twenty-two, entry 91).
    const kindState = target === undefined && !args.targetOpen?.trim() && args.kind ? applyCommand(emptyState(), { type: "set_target", kind: args.kind }, new Date().toISOString()).state : null;
    const state = { ...(kindState ?? emptyState()), ...(target === undefined ? {} : { targetEighths: toEighths(target) }), ...(args.targetOpen?.trim() && target === undefined ? { targetOpen: args.targetOpen.trim().replace(/\s+/g, " ") } : {}) };
    const board = await account.client.from("boards").insert({ id: record.activeBoardId, project_id: record.id, state, rev: 1, updated_by: null });
    if (board.error) return ok(`Started "${record.name}" but could not make its first board: ${board.error.message}`);
    workingProject(record.id, record.name, (account.projectCount ?? 0) + 1);
    newWallInHand();
    joinPresence(record.id);
    const targetLine = state.targetOpen ? ` Its target is left open, by the writer's word: "${state.targetOpen}"; the reading reads the cards against a half-hour and a feature until set_target decides it.` : targetWords(state) ? ` Its target is ${targetWords(state)}, read as ${formatPages(state.targetEighths)} pages: kept as the writer's word, not a page count (set_target with pages says a number).` : target === undefined ? ` Its target is ${formatPages(state.targetEighths)} pages, the default for a feature; set_target for a pilot or a half-hour, or pass pages or minutes here.` : ` Its target is ${formatPages(state.targetEighths)} pages.`;
    const first = record.boards[0];
    const nameOpenLine = `${record.nameOpen ? ` The project's name is left open, by the writer's word: "${record.nameOpen}"; rename_project decides it.` : ""}${first.nameOpen ? ` The board's name is left open, by the writer's word: "${first.nameOpen}"; rename_board decides it.` : ""}`;
    // A film is one board and goes out under the project's name: nothing to ask the writer about "Board 1" (round twenty-two, entry 16).
    const filmBoard = !args.board?.trim() && !args.boardOpen?.trim() ? " A film is one board and goes out under the project's name, so its board needs no name; a series names each board for its episode (rename_board)." : args.board?.trim() ? ` The board is named "${first.name}" by the writer's word; a one-board film goes out under the project's name either way, so the board's name shows on the wall and nowhere else.` : "";
    // A kind and a number in one call (pass 1a, entry 4): the number is the target; say so, rather than drop the word in silence.
    const kindDropped = target !== undefined && args.kind ? ` You passed kind "${args.kind}" and a number: the number is the target and the word is not kept (a number always clears the word) — pass kind alone to keep the writer's word instead, read as ${formatPages(TARGET_KINDS[args.kind]?.eighths ?? 0)} pages.` : "";
    return ok(`Started "${record.name}" (${record.id}) with its first board "${first.name}" (${first.id}), and working it now, as ${account.email}.${filmBoard}${targetLine}${kindDropped}${nameOpenLine}${oneCallHint(record)}`, { id: record.id, name: record.name, boardId: first.id, boardName: first.name, boardNameOpen: first.nameOpen ?? "", targetEighths: state.targetEighths });
  },
);


server.registerTool(
  "delete_project",
  {
    title: "Delete a project",
    description:
      "Through the account door: delete one of the writer's own projects, by name or id from list_projects — its boards, its cards and its files, the exports kept with them included. Cannot be undone, not from the wall either: ask the writer first, and export_project first if they might want it (on the hosted door, fetch the reply's link or pass inline: a file kept with the project goes with it) back. Without confirm it only says what would go; pass confirm: true to delete. A project merely shared with the writer is not theirs to delete.",
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
      "Through the account door: delete every project the writer owns — boards, cards and files, the exports kept with them included — and leave the account itself, signed in and empty. On the hosted door an export_project without inline is kept with the project's files and goes too: fetch its link, or pass inline, before this. Projects merely shared with the writer by others stay. The reply names every file that goes, and list_files shows them first. Cannot be undone: ask the writer first, and export_project each project first if they might want it back. Without confirm it only says what would go; pass confirm: true to empty.",
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

// Help in the app (R64): the questions writers asked that the guide did not
// answer. They are the app's, not a project's, so these two tools take the
// maintainer's service role from the server's environment — the key never
// ships, as the wipe script's does not — and every other door refuses them.
async function questionsDoor() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PLOTCODER_SERVICE_ROLE_KEY;
  if (!key) return null;
  const { createClient } = await import("@supabase/supabase-js");
  // Node 20 has no native WebSocket; the realtime client wants one even when unused, as the account door knows.
  let transport;
  try {
    transport = (await import("ws")).default;
  } catch {
    transport = undefined;
  }
  return createClient(process.env.SUPABASE_URL || SUPABASE_URL, key, { auth: { persistSession: false }, ...(transport ? { realtime: { transport } } : {}) });
}
const NO_QUESTIONS_DOOR = "The questions are the app's, not a project's: set SUPABASE_SERVICE_ROLE_KEY in the server's environment — the maintainer's key, never in the repo — and call again. A writer asks from the Help sheet; the answer goes into public/writers.html and back to them through answer_question.";

server.registerTool(
  "list_questions",
  {
    title: "The writers' questions",
    description:
      "The questions writers asked from the app's Help sheet that the guide did not answer, waiting first: who asked, when, the words. Maintainer only — needs the service role in the server's environment. Answer one with answer_question after the answer is in public/writers.html.",
    inputSchema: { all: z.boolean().optional() },
  },
  async (args) => {
    const db = await questionsDoor();
    if (!db) return ok(NO_QUESTIONS_DOOR);
    const { data, error } = await db.from("questions").select("id, email, question, asked_at, answered_at, answer, section").order("asked_at", { ascending: false });
    if (error) return ok(`Could not read the questions: ${error.message}`);
    const rows = args.all ? data : data.filter((row) => !row.answered_at);
    const waiting = data.filter((row) => !row.answered_at).length;
    const line = (row) => `  - ${row.id.slice(0, 8)} · ${String(row.asked_at).slice(0, 10)} · ${row.email ?? "(not signed in)"} · "${row.question}" · ${row.answered_at ? `answered ${String(row.answered_at).slice(0, 10)}${row.section ? ` → ${row.section}` : ""}` : "waiting"}`;
    return ok(
      [`${waiting} waiting, ${data.length - waiting} answered.${args.all ? "" : " (all: true lists the answered ones too)"}`, ...(rows.length ? rows.map(line) : ["  (none)"])].join("\n"),
      rows,
    );
  },
);

server.registerTool(
  "answer_question",
  {
    title: "Answer a writer's question",
    description:
      "Mark a writer's question answered, with the answer in a sentence or two and the guide's section it went into (\"#s5\"), once the answer is in public/writers.html: the writer sees both under Your questions. Maintainer only — needs the service role in the server's environment. The guide is the answer; this is the promise kept.",
    inputSchema: { id: z.string().min(1), answer: z.string().min(1), section: z.string().optional() },
  },
  async (args) => {
    const db = await questionsDoor();
    if (!db) return ok(NO_QUESTIONS_DOOR);
    // A uuid takes no pattern match in Postgres; the prefix is matched here, as list_questions prints it.
    const { data: rows, error: findError } = await db.from("questions").select("id, question, answered_at");
    if (findError) return ok(`Could not read the questions: ${findError.message}`);
    const wantedId = args.id.trim().toLowerCase();
    const found = (rows ?? []).filter((row) => String(row.id).toLowerCase().startsWith(wantedId));
    if (!found?.length) return ok(`No question whose id starts "${args.id}". list_questions shows them.`);
    if (found.length > 1) return ok(`${found.length} questions start "${args.id}": say more of the id.`);
    const row = found[0];
    const { error } = await db.from("questions").update({ answered_at: new Date().toISOString(), answer: args.answer.trim(), section: args.section?.trim() || null }).eq("id", row.id);
    if (error) return ok(`Could not answer it: ${error.message}`);
    return ok(`Answered "${row.question}"${args.section ? ` and filed it under ${args.section.trim()}` : ""}${row.answered_at ? " (it had been answered before; this replaces that)" : ""}. The writer sees it under Your questions. If the answer is not yet in public/writers.html, put it there and open the pull request: the guide is the answer, this list is the promise.`, { id: row.id });
  },
);

server.registerTool(
  "export_project",
  {
    title: "Save the project as a file",
    description:
      `The project the server is working, as the file Save project writes and Open project takes: the record, every board with its cards, the reminders and the writer's structures. ${hosted() ? "This door has no disk, so the file is kept with the project's files on the account and the reply is a link to it, good for an hour, with its size and checksum — nothing to retype; list_files shows it and remove_file takes it off. Pass inline: true to have the JSON in the reply instead." : `Pass path to write it (a .json) on the machine this server runs on — a stdio server runs on the session's own machine, so the file lands on this disk — an absolute path, since a relative one resolves from the folder the server was started in, which is ${process.cwd()} — this session's own folder when the server was started from it, and somewhere else when it was not; without a path, the reply's JSON is the file.`} Pictures and takes on the account are not in the file. Works through every door.`,
    inputSchema: { path: z.string().optional(), inline: z.boolean().optional().describe("The JSON in the reply itself, rather than a link to the file. Through a door with a disk, no path already means this.") },
  },
  async (args) => {
    if (args.path && hosted()) return ok("The hosted door has no disk to write to: call export_project without a path and the reply is a link to the file, kept with the project's files; inline: true puts the JSON in the reply.");
    const { project, boards, reminders } = await readProject();
    const file = toProjectFile({ project, boards, reminders: reminders ?? null });
    const cards = countCards(boards);
    const filmCards = Object.values(boards).filter(isBoardState).reduce((sum, board) => sum + board.notes.filter((note) => !note.alternativeOf && !note.aside).length, 0);
    const ownReminders = (reminders ?? []).filter((item) => !item.builtIn).length;
    const builtInReminders = (reminders ?? []).length - ownReminders;
    const what = `"${project.name}": ${project.boards.length} board(s) — ${project.boards.map((meta) => `"${meta.name}" (${isBoardState(boards[meta.id]) ? boards[meta.id].notes.length : 0} cards)`).join(", ")} — ${cards} card(s) in all${cards !== filmCards ? ` (${filmCards} in the film, ${cards - filmCards} set aside or behind as other versions)` : ""}${reminders?.length ? `, ${reminders.length} reminder(s) (${builtInReminders} built in, ${ownReminders} the writer's own)` : ", the six built-in reminders come with every project and no reminders of the writer's own (none to write)"}${project.structures?.length ? `, ${project.structures.length} structure(s)` : ", no structures of the writer's own (none to write)"}. Pictures and takes on the account are not in the file`;
    if (args.path) {
      fs.mkdirSync(path.dirname(path.resolve(args.path)), { recursive: true });
      fs.writeFileSync(args.path, JSON.stringify(file, null, 2));
      return ok(`Saved ${what}. Written to ${path.resolve(args.path)}: Open project in the app takes it, import_project brings it onto an account.`, { path: path.resolve(args.path), boards: project.boards.length, cards });
    }
    // Through the hosted door the file goes with the project's files and the reply is a link (round twenty-three: the agent
    // retyped twenty kilobytes of escaped JSON by hand to keep a copy). Anything wrong with that and the JSON comes inline, saying why.
    let whyInline = "";
    if (hosted() && !args.inline) {
      const account = await findAccount();
      if (account?.projectId) {
        try {
          const body = JSON.stringify(file, null, 2);
          const bytes = Buffer.from(body, "utf8");
          const safe = (project.name || "project").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "project";
          const name = `${safe}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
          const storagePath = `${account.projectId}/file/${crypto.randomUUID()}-${name}`;
          const up = await account.client.storage.from("projects").upload(storagePath, bytes, { contentType: "application/json", upsert: false });
          if (up.error) throw new Error(up.error.message);
          const row = await account.client.from("assets").insert({ project_id: account.projectId, kind: "file", subject: "", path: storagePath, name, size: bytes.length, content_type: "application/json", note: "export_project" }).select("id").maybeSingle();
          if (row.error) {
            await account.client.storage.from("projects").remove([storagePath]);
            throw new Error(row.error.message);
          }
          const signed = await account.client.storage.from("projects").createSignedUrl(storagePath, 3600, { download: name });
          if (signed.error || !signed.data?.signedUrl) throw new Error(signed.error?.message ?? "no link came back");
          const sha = crypto.createHash("sha256").update(bytes).digest("hex");
          return ok(`Saved ${what}. Kept with the project's files as ${name} (${bytes.length} bytes, sha256 ${sha}). A link to it, good for an hour: ${signed.data.signedUrl} — fetch it to keep a copy; nothing to retype. list_files shows it and remove_file takes it off; deleting the project takes it too, and so does emptying the account, so fetch first when the copy is the point. Open project in the app takes the file, and import_project brings it onto an account.`, { id: row.data?.id, name, size: bytes.length, sha256: sha, url: signed.data.signedUrl });
        } catch (error) {
          whyInline = ` (The file could not be kept with the project's files — ${error instanceof Error ? error.message : String(error)} — so it is here instead.)`;
        }
      }
    }
    // The file is the reply's payload, not a tail: it comes whether or not PLOTCODER_JSON is on (round twenty-two, entry 4).
    if (whyInline) return { content: [{ type: "text", text: `The project as a file — ${what}.${whyInline} The JSON below is the file; write it to a .json for Open project or import_project.\n\n${JSON.stringify(file, null, 2)}` }] };
    return { content: [{ type: "text", text: `The project as a file — ${what}. The JSON below is the file; write it to a .json for Open project or import_project.\n\n${JSON.stringify(file, null, 2)}` }] };
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
      newWallInHand();
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
      "Add a board to the project and open it: an empty wall with the logline placeholder, under the same premise, with the same target length as the board that was open. Nothing else is touched — the other boards stay as they are. Name it for what it is: an episode, a draft, a story; or pass open with the writer's words for why the name is not decided, and it is born open on its name.",
    inputSchema: { name: z.string().optional(), open: z.string().optional() },
  },
  async (args) => {
    const { project, boards, rev, base } = await readProject();
    const previous = boards[project.activeBoardId];
    const target =
      previous && isBoardState(previous) ? normalizeState(previous).targetEighths : undefined;
    const { project: next, board } = addBoard(project, args.name ?? "", undefined, args.open ?? "");
    const fresh = { ...emptyState(), ...(target ? { targetEighths: target } : {}) };
    const { live } = await openBoardEverywhere(next, { ...boards, [board.id]: fresh }, rev, base, board.id);
    return ok(
      `Added "${board.name}" (${board.id})${board.nameOpen ? ` — its name left open, by the writer's word: "${board.nameOpen}"` : ""} and opened it${where(live)}: every card call lands there now, and the writer's open wall switched with it; open_board ${project.boards.findIndex((item) => item.id === project.activeBoardId) + 1} returns to "${project.boards.find((item) => item.id === project.activeBoardId)?.name ?? "the one before"}". It is empty, and the project's cast is already there to cast from. The logline is the story's question when the writer has one — leave it empty rather than invent it — and the cards come next.${next.name === "Untitled project" ? " The project is still \"Untitled project\": rename_project names it." : ""}${next.boards.length === 2 && isSampleWall(isBoardState(boards[next.boards[0].id]) ? normalizeState(boards[next.boards[0].id]) : emptyState()) ? " The sample stays as Board 1; delete_board drops it." : ""}`,
      board,
    );
  },
);

server.registerTool(
  "rename_board",
  {
    title: "Rename board",
    description: "Rename a board of the project by id, name, or number. Or leave its name open: pass open with the writer's words for why it is not decided — \"the pilot, or the film\" — and the name stands as it is (every reply still calls it that) while the reading lists the words; a name decides it, open \"\" takes the words back.",
    inputSchema: { board: z.union([z.string().min(1), z.number()]), name: z.string().min(1).optional(), open: z.string().optional() },
  },
  async (args) => {
    if (args.name === undefined && args.open === undefined) return ok("Say which: name, or open (the writer's words for why the name is not decided).");
    const { project, boards, rev, base } = await readProject();
    const target = findBoard(project, String(args.board));
    if (!target) return ok(`No board matches "${args.board}". Call list_boards for the real ones.`);
    if (args.name === undefined) {
      const next = setBoardNameOpen(project, target.id, args.open);
      if (next === project) return ok(`"${target.name}" already reads that way.`);
      const live = await writeProject(next, boards, rev, base);
      const words = boardById(next, target.id)?.nameOpen ?? "";
      return ok(words ? `Board "${target.name}" (${target.id}) keeps its name and its name is left open, by the writer's word: "${words}"${where(live)}. The reading lists it; rename_board with a name decides it.` : `Board "${target.name}" (${target.id}) is no longer open on its name${where(live)}.`, { id: target.id, name: target.name, nameOpen: words });
    }
    const next = renameBoard(project, target.id, args.name);
    if (next === project) return ok(`"${target.name}" already has that name.`);
    const live = await writeProject(next, boards, rev, base);
    return ok(`Renamed board "${target.name}" (${target.id}) to "${args.name.trim()}"${where(live)}.${target.nameOpen ? " Its name is decided; the open words are gone." : ""}`, { id: target.id, name: args.name.trim() });
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
