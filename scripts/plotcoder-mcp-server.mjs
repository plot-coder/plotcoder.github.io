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
  DEFAULT_TARGET_EIGHTHS,
  normalizeState,
  noteEighths,
  NOTE_COLORS,
  NOTE_RANKS,
  seedState,
} from "../src/board/reducer.js";
import { TEMPLATES } from "../src/board/templates.js";
import { wordSentence, wordsAsText } from "../src/board/words.js";
import { fromFountain, mergeFountain, toFountain } from "../src/board/fountain.js";
import { fromProjectFile, toProjectFile } from "../src/board/projectFile.js";
import { describeSetAside, fromFdx, toFdx } from "../src/board/fdx.js";
import { paginate } from "../src/board/paginate.js";
import { readingOrder } from "../src/board/readWall.js";
import { REVISION_COLORS, sceneNumbers } from "../src/board/numbering.js";
import { sceneHeading } from "../src/board/fountain.js";
import { segmentBrief, WORKFLOWS } from "../src/board/workflows.js";
import { DEFAULT_REMINDERS, titleFromBody } from "../src/board/reminders.js";
import crypto from "node:crypto";
import { describeRuns, describeSetups, readWall } from "../src/board/readWall.js";
import { organizePoses } from "../src/board/organize.js";
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
  const rows = await accountDoor.client.from("boards").select("id, state, rev").eq("project_id", project.id);
  const boards = {};
  const revs = {};
  for (const row of rows.data ?? []) {
    if (isBoardState(row.state)) boards[row.id] = normalizeState(row.state);
    revs[row.id] = row.rev;
  }
  return { project, boards, revs, reminders: Array.isArray(data.reminders) ? data.reminders : null, rev: data.rev, base: ACCOUNT, live: ACCOUNT };
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

async function readProject() {
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

async function readBoard() {
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

async function writeBoard(next, rev, base, boardId = null) {
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

// This server's own trail of changes: what the board was before each
// of its tool calls, and what it became. `undo` walks it back — but only when
// the board still is what the call left, so it never tramples a change the
// person made on the wall since.
const TRAIL_CAP = 50;
const trail = [];
/** What undo took back, newest last; a new change of this server's clears it. */
const undone = [];

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
  undone.length = 0;
  return { state: next, changed, result, live };
}

/** Said once per session: that cards stack until organize (round seven, finding 11). */
let saidStack = false;

/** Which door a read came through, for the head of a reply: the account as whom, the open app, or the file at which path. */
function door(live, base = null) {
  if (live === ACCOUNT) {
    const others = accountDoor.projectCount > 1 ? `, ${accountDoor.projectCount} projects on the account — list_projects for the others` : "";
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
  if (live === ACCOUNT) return " (saved to the account; live on every open wall)";
  return live ? " (visible on the open board)" : " (written to file; the wall shows it the next time the app runs from this folder)";
}

/** The wall PlotCoder starts with — Maya, Tom, the letter — and nothing of the writer's yet. */
function isSampleWall(state) {
  const sample = seedState().notes.map((note) => note.headline).sort().join("\n");
  return state.notes.map((note) => note.headline).sort().join("\n") === sample;
}
/** Every check read_wall runs, so silence can be named. */
const CHECKS = ["sag", "empty", "unwritten", "unlinked", "duplicate", "sequence", "uncast", "absent", "backwards", "unpaid", "unplaced"];
/** What each check looks for, in words, so "clean" says what was checked rather than a kind's name. */
const CHECK_WORDS = {
  sag: "no run out of proportion",
  empty: "no beats back to back",
  unwritten: "no card without a headline or change line",
  unlinked: "no card without an arrow",
  duplicate: "no two headlines alike",
  sequence: "no group too long for one sequence",
  uncast: "nobody in the cast on no card",
  absent: "nobody gone for a third of the story",
  backwards: "no payoff before its setup",
  unpaid: "no fold without a payoff",
  unplaced: "no card without a place",
};
const SAMPLE_NOTE = "sample: this is the wall PlotCoder starts with (Maya, Tom, the letter); nothing here is the writer's. Replace it, or new_board.";

// --- Reporting -------------------------------------------------------------

function summarize(state) {
  const nameOf = new Map(state.characters.map((character) => [character.id, character.name]));
  const notes = state.notes
    .map((note) => {
      const cast = note.characterIds.map((id) => nameOf.get(id) ?? id);
      const who = cast.length ? `, cast: ${cast.join(", ")}` : "";
      const plant = note.plants ? ", plants" : "";
      const place = note.location ? `, at: ${note.location}` : "";
      const count = formatPages(noteEighths(note));
      const pages = `${count} ${count === "1" ? "page" : "pages"}${isMeasured(note) ? ", written" : note.lengthEighths === null ? ", unsized" : ""}`;
      return `  - ${note.id} [${note.rank ?? "scene"}, ${pages}${who}${place}${plant}] — "${note.headline}" (${note.color}) at ${Math.round(note.x)},${Math.round(note.y)}`;
    })
    .join("\n");
  const cast = state.characters
    .map((character) => {
      const on = state.notes.filter((note) => note.characterIds.includes(character.id)).length;
      // Which lines of their page are written, so an agent can see who is a
      // brief and who is still a name.
      const page = filledCharacterFields(character);
      const brief = page.length ? ` · page: ${page.join(", ")}` : " · page: empty";
      return `  - ${character.id} — "${character.name}" on ${on} card${on === 1 ? "" : "s"}${brief}`;
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
  const numbers = state.lock ? sceneNumbers(readingOrder(state.notes), state.lock) : null;
  const production = [
    `numbers: ${state.lock ? `locked ${String(state.lock.at).slice(0, 10)} — ${[...numbers.entries()].map(([id, n]) => `${n}:${id}`).join(" ")}` : "follow the wall's order"}`,
    `revision: ${state.revision ? `"${state.revision.name}" in ${state.revision.color} since ${String(state.revision.since).slice(0, 10)}` : "none"}`,
  ];
  const runtime = boardEighths(state);
  const over = runtime - state.targetEighths;
  return [
    ...(isSampleWall(state) ? [SAMPLE_NOTE] : []),
    `logline: ${state.logline ? `"${state.logline}"` : "(not set)"}`,
    ...production,
    `beats: ${beats}, scenes: ${scenes}`,
    `runtime: about ${formatPages(runtime)} pages of a ${formatPages(state.targetEighths)}-page target — ${over > 0 ? `${formatPages(over)} over` : over < 0 ? `${formatPages(-over)} under` : "on it"} (an estimate from the cards; a page runs about a minute)${state.targetEighths === DEFAULT_TARGET_EIGHTHS ? " — the target is the feature default, nobody's choice yet; set_target for a pilot or a half-hour" : ""}`,
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
// PLOTCODER_JSON=0 drops the JSON tail from every reply, for an agent that
// reads the sentence and wants nothing more (a blind run found 400-line replies).
const TEXT_ONLY = env.PLOTCODER_JSON === "0";
function ok(text, data) {
  const body = data === undefined || TEXT_ONLY ? text : `${text}\n\n${JSON.stringify(data, null, 2)}`;
  return { content: [{ type: "text", text: body }] };
}

// --- Server ----------------------------------------------------------------

const server = new McpServer({ name: "plotcoder-board", version: "0.1.0" });

// A door's answer is a reply, not an error: a shut account door, or an
// account with no project yet, says so in words from every tool alike.
const registerTool = server.registerTool.bind(server);
server.registerTool = (name, config, handler) =>
  registerTool(name, config, async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof DoorReply) return ok(error.message);
      throw error;
    }
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
      `${result?.length ?? 0} card(s) are now ${args.rank}${where(live)}. The board holds ${beats} beats and ${scenes} scenes.`,
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
      change: z.string().min(1),
      color: colorSchema.optional(),
      rank: rankSchema.optional(),
      pages: pagesSchema.optional(),
      plants: z.boolean().optional(),
      location: z.string().optional(),
      characters: z.array(z.string().min(1)).optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    },
  },
  async (args) => {
    const { result, live } = await commit({
      type: "create_note",
      headline: args.headline,
      change: args.change,
      // One colour unless the agent chooses: a wall an agent builds in one go
      // would otherwise stripe through the cycle, and a writer reads a pattern
      // into it (round four, finding 17). The wall's own new-card button keeps
      // cycling for a person adding cards by hand.
      color: args.color ?? "yellow",
      rank: args.rank,
      lengthEighths: args.pages === undefined ? undefined : toEighths(args.pages),
      plants: args.plants,
      location: args.location,
      x: args.x,
      y: args.y,
    });
    let castLine = "";
    if (args.characters && args.characters.length && result?.id) {
      const added = [];
      const ids = [];
      for (const name of args.characters) {
        const { state } = await readBoard();
        const wanted = name.trim().toLowerCase();
        let person = state.characters.find((item) => item.id === name) ?? state.characters.find((item) => item.name.trim().toLowerCase() === wanted);
        if (!person) {
          const made = await commit({ type: "add_character", name: name.trim() });
          person = made.result;
          if (person) added.push(`${person.name} (${person.id})`);
        }
        if (person) ids.push(person.id);
      }
      if (ids.length) await commit({ type: "set_cast", ids: [result.id], characterIds: ids });
      castLine = ` Cast: ${args.characters.map((name) => name.trim()).join(", ")}${added.length ? ` (added to the roster: ${added.join(", ")})` : ""}.`;
    }
    const landed = [
      result?.rank === "beat" ? "a beat" : "a scene",
      result?.lengthEighths === null ? "about a page (unsized: the writer's guess until set_length)" : `${formatPages(noteEighths(result))} ${formatPages(noteEighths(result)) === "1" ? "page" : "pages"}`,
      result?.color ? `${result.color} paper${args.color ? "" : " (pass color to choose)"}` : null,
      result?.plants ? "corner folded" : null,
      result?.location ? `at ${result.location}` : "no place yet (location here, or set_location)",
    ].filter(Boolean).join(", ");
    const placed = args.x === undefined && args.y === undefined && !saidStack ? " Cards stack until organize lays them out along the arrows." : "";
    if (placed) saidStack = true;
    return ok(`Created card ${result?.id ?? ""}: ${landed}${where(live)}.${castLine}${placed}`, result);
  },
);

server.registerTool(
  "update_note",
  {
    title: "Update note",
    description: "Change the headline, change text and/or location of an existing card by id.",
    inputSchema: {
      id: z.string(),
      headline: z.string().optional(),
      change: z.string().optional(),
      location: z.string().optional(),
    },
  },
  async (args) => {
    const { result } = await commit({
      type: "update_note",
      id: args.id,
      headline: args.headline,
      change: args.change,
      location: args.location,
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

// --- Read the wall ----------------------------------------------------

server.registerTool(
  "read_wall",
  {
    title: "Read the wall",
    description:
      "Read the board back: the beats in wall order (rows top to bottom, cards left to right), the pages of scenes between consecutive beats with the cards in each, every setup with the distance to its payoff, and the questions the wall raises — no beat marked yet; a run out of proportion with the others; beats back to back with nothing between them (a chain of them is one question); a card with a placeholder headline or no change line; a card no arrow touches; two headlines that read like the same scene; a group too long to be one sequence; a person in the cast on no card; a person gone for more than a third of the story and ten pages; a payoff before its setup on the wall; a folded card no setup arrow pays off; cards that say no place once any card has one. These are questions, not fixes: put them to the writer and do not act on them unasked. It says nothing about how many beats there should be, and neither should you.",
    inputSchema: {},
  },
  async () => {
    const { state, live, base } = await readBoard();
    const reading = readWall(state);
    const runs = describeRuns(reading, state).map((line, index) => {
      const ids = reading.runs[index]?.ids ?? [];
      return ids.length ? `${line} — ${ids.map((id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`).join(", ")}` : line;
    });
    // No blank lines: ok() splits prose from payload on the first one.
    const written = state.notes.filter((note) => isMeasured(note)).length;
    const lines = [
      `PlotCoder wall (${door(live, base)})`,
      `logline: ${state.logline ? `"${state.logline}"` : "(none yet)"}`,
      `pages: ${written === 0 ? "all estimates — no scene is written yet, so every card is the writer's guess" : written === state.notes.length ? "measured — every scene is written" : `estimates — ${written} of ${state.notes.length} cards are written, the rest are guesses`}`,
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
        : ["  (no arrow is marked as a setup)"]),
      "questions the wall raises:",
      ...(reading.findings.length
        ? reading.findings.map((finding) => `  - [${finding.kind}] ${finding.text}${finding.ids.length ? ` (ids: ${finding.ids.join(", ")})` : ""}`)
        : ["  (none that this reading can see)"]),
      `checks: ${CHECKS.length} run — asking about ${[...new Set(reading.findings.map((finding) => finding.kind))].filter((kind) => CHECKS.includes(kind)).join(", ") || "nothing"}; checked and clean: ${CHECKS.filter((kind) => !reading.findings.some((finding) => finding.kind === kind)).map((kind) => CHECK_WORDS[kind]).join("; ") || "(nothing — every check found something)"}`,
    ];
    if (isSampleWall(state)) lines.unshift(SAMPLE_NOTE);
    return ok(lines.join("\n"), { ...reading, sample: isSampleWall(state) });
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
    // Rows top to bottom; a row whose first card is not a beat is the row
    // above wrapping under, and the reply names whose row it is.
    const byRow = new Map();
    for (const pose of poses) byRow.set(pose.y, [...(byRow.get(pose.y) ?? []), pose]);
    const wrappedUnder = [];
    let currentBeat = null;
    for (const y of [...byRow.keys()].sort((a, b) => a - b)) {
      const first = byRow.get(y).sort((a, b) => a.x - b.x)[0];
      const note = state.notes.find((item) => item.id === first.id);
      if (note?.rank === "beat") currentBeat = note;
      else if (currentBeat && note && !wrappedUnder.some((item) => item.beat === currentBeat)) wrappedUnder.push({ beat: currentBeat, first: note });
    }
    const shape = beats
      ? `${beats} row(s), one per beat${wrappedUnder.length ? `; ${wrappedUnder.map((item) => `the row of "${item.beat.headline}" wraps under from "${item.first.headline}"`).join(", ")}` : ""}`
      : `${rows} row(s)`;
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
    description: "The structures apply_template can lay on a wall: the built-in ones, and the writer's own saved from their walls (save_structure), each with its beats.",
    inputSchema: {},
  },
  async () => {
    const { project } = await readProject();
    const own = project.structures ?? [];
    const lines = [
      `built in: ${TEMPLATES.length}`,
      ...TEMPLATES.map((template) => `  - ${template.id} — "${template.name}" (${template.beats.length} beats)`),
      `the writer's own: ${own.length}`,
      ...own.map((structure) => `  - ${structure.id} — "${structure.name}" (${structure.beats.length} beats: ${structure.beats.map((beat) => beat.name).join(", ")})`),
    ];
    return ok(lines.join("\n"), { builtIn: TEMPLATES.map((template) => ({ id: template.id, name: template.name, beats: template.beats })), own });
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
    const order = readingOrder(state.notes).map((note) => note.id);
    const beats = structureBeats(state.notes, order);
    if (beats.length === 0) return ok("Nothing to save: no card on this board is marked as a beat. Mark the turns with set_rank first.");
    const { project, boards, rev, base, live } = await readProject();
    const { project: next, structure } = addStructure(project, args.name, beats);
    await writeProject(next, boards, rev, base);
    return ok(`Saved "${structure.name}" with ${beats.length} beats${where(live)}: ${beats.map((beat) => beat.name).join(", ")}.`, structure);
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
      "The open board as a Fountain screenplay: a title page (with the premise and logline in its notes), beats as sections, one scene per card in wall order — a forced heading from the card's place (or its headline), the headline as a synopsis, the cast and the fold as notes, the change line as action. Plain text a writer can open in any Fountain editor. Pass a path to write a .fountain file; otherwise the text comes back.",
    inputSchema: { path: z.string().optional() },
  },
  async (args) => {
    const { state } = await readBoard();
    const { project } = await readProject();
    const board = project.boards.find((item) => item.id === project.activeBoardId);
    const text = toFountain(state, {
      title: board?.name,
      project: project.boards.length > 1 && project.name !== "Untitled project" ? project.name : undefined,
      premise: project.premise || undefined,
      draftDate: new Date().toISOString(),
    });
    if (args.path) {
      fs.mkdirSync(path.dirname(path.resolve(args.path)), { recursive: true });
      fs.writeFileSync(args.path, text);
      return ok(`Wrote ${text.split("\n").length} lines of Fountain to ${args.path}.`);
    }
    return ok(text);
  },
);

server.registerTool(
  "write_scene",
  {
    title: "Write a scene",
    description:
      "Write a card's scene text in Fountain — action, character cues in capitals, dialogue under them — onto the card by id. The card is then measured (its lines against a page) instead of estimated. An empty string clears it. Read read_pages first so the scene fits what is around it, and do not write scenes the writer has not asked for.",
    inputSchema: { id: z.string(), text: z.string() },
  },
  async (args) => {
    const { changed, result, live } = await commit({ type: "set_text", id: args.id, text: args.text });
    if (!changed) {
      if (!result) return ok(`No card with id ${args.id}. Call list_board.`);
      return ok(`Nothing changed: "${result.headline}" already reads that way.`);
    }
    return ok(
      `Wrote "${result.headline}": ${formatPages(noteEighths(result))} page(s) measured${where(live)}.`,
      result,
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
    const text = toFountain(state, { title: board?.name, premise: project.premise || undefined });
    const parsed = fromFountain(text);
    const ids = mergeFountain(state, parsed).matched.map((item) => item.id);
    const lines = [];
    let index = 0;
    for (const line of text.split("\n")) {
      if (/^\.(?!\.)/.test(line) && index < ids.length) {
        const note = state.notes.find((item) => item.id === ids[index]);
        index += 1;
        lines.push(`${line}    [[id: ${note?.id ?? "?"} · ${note && isMeasured(note) ? "measured" : "estimated"} ${formatPages(note ? noteEighths(note) : 0)}pp]]`);
      } else {
        lines.push(line);
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
    let live = false;
    for (const command of commands) ({ live } = await commit(command));
    const written = commands.filter((command) => command.type === "set_text").length;
    const created = matched.filter((item) => item.created).length;
    return ok(
      `Imported ${parsed.scenes.length} scene(s): ${written} written onto cards, ${created} new card(s)${where(live)}.`,
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
          `- ${workflow.id} — ${workflow.name}\n  ask: "${workflow.ask}"\n  tools: ${workflow.tools.join(", ")}\n  keep: ${workflow.then}`,
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
    const brief = segmentBrief(state, args.ids, { title: board?.name });
    if (!brief) return ok(`No cards with ids ${args.ids.join(", ")}. Call list_board.`);
    return ok(brief);
  },
);

server.registerTool(
  "export_fdx",
  {
    title: "Export as Final Draft",
    description:
      "The open board as a Final Draft .fdx: a heading per card with its scene number by wall order, the scene's text as script paragraphs (action, character, parenthetical, dialogue, dual dialogue, transition) or the change line as action when unwritten, and a title page. Pass a path to write the file; otherwise the XML comes back.",
    inputSchema: { path: z.string().optional() },
  },
  async (args) => {
    const { state } = await readBoard();
    const { project } = await readProject();
    const board = project.boards.find((item) => item.id === project.activeBoardId);
    const xml = toFdx(state, { title: board?.name, project: project.boards.length > 1 ? project.name : undefined, draftDate: new Date().toISOString() });
    if (args.path) {
      fs.mkdirSync(path.dirname(path.resolve(args.path)), { recursive: true });
      fs.writeFileSync(args.path, xml);
      return ok(`Wrote a Final Draft file with ${state.notes.length} scene(s) to ${args.path}.`);
    }
    return ok(xml);
  },
);

server.registerTool(
  "import_fdx",
  {
    title: "Import a Final Draft script",
    description:
      "Read a Final Draft .fdx (by path) or its XML onto the open board: each scene's paragraphs become Fountain on the card with the same heading in order, a scene the wall does not have becomes a new card after the last matched one, and nothing is deleted.",
    inputSchema: { path: z.string().optional(), xml: z.string().optional() },
  },
  async (args) => {
    const source = args.xml ?? (args.path ? fs.readFileSync(args.path, "utf8") : null);
    if (source === null) return ok("Nothing to import: pass a path or xml.");
    const { state } = await readBoard();
    const parsed = fromFdx(source);
    const { commands, matched } = mergeFountain(state, parsed);
    let live = false;
    for (const command of commands) ({ live } = await commit(command));
    const written = commands.filter((command) => command.type === "set_text").length;
    const created = matched.filter((item) => item.created).length;
    const receipt = describeSetAside(parsed.setAside);
    return ok(`Imported ${parsed.scenes.length} scene(s) from Final Draft: ${written} written onto cards, ${created} new card(s)${where(live)}.${receipt ? ` ${receipt}` : ""}`, matched);
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
    const order = readingOrder(state.notes);
    const result = paginate(
      order.map((note) => ({ id: note.id, heading: sceneHeading(note).slice(1), text: note.text, change: note.change, written: Boolean(note.text && note.text.trim()) })),
    );
    const lines = result.scenes.map((scene) => {
      const note = order.find((item) => item.id === scene.id);
      return `  - ${scene.number}. ${note?.headline ?? scene.id} (${scene.id}) — p. ${scene.page}${scene.endPage !== scene.page ? `–${scene.endPage}` : ""}`;
    });
    const unwritten = order.filter((note) => !(note.text && note.text.trim())).length;
    if (order.length > 0 && unwritten === order.length) {
      return ok(
        `No pages to count yet: none of the ${order.length} scenes is written. The runtime is list_board's estimate from the cards' lengths — about ${formatPages(boardEighths(state))} of ${formatPages(state.targetEighths)} pages.`,
        { pageCount: 0, unwritten, scenes: [] },
      );
    }
    const note = unwritten
      ? [`${unwritten} of ${order.length} scenes are unwritten and count as one line each here; for the estimate from the cards' lengths, see list_board's runtime line.`]
      : [];
    return ok([`pages: ${result.pageCount} of ${Math.round(state.targetEighths / 8)}`, ...note, ...lines].join("\n"), result.scenes);
  },
);

server.registerTool(
  "lock_numbers",
  {
    title: "Lock the scene numbers",
    description:
      "Once a draft has gone out: every scene keeps the number it has by the wall's order; a scene added between 14 and 15 becomes 14A, then 14B; moving cards never renumbers. Final Draft out carries the locked numbers. Ask the writer; it is a decision about the document going out.",
    inputSchema: {},
  },
  async () => {
    const { state } = await readBoard();
    const order = readingOrder(state.notes).map((note) => note.id);
    const { changed, result, live } = await commit({ type: "lock_numbers", order });
    if (!changed) return ok("Nothing to lock.");
    return ok(`Locked ${Object.keys(result.numbers).length} scene number(s)${where(live)}.`, result);
  },
);

server.registerTool(
  "unlock_numbers",
  { title: "Unlock the scene numbers", description: "Numbers follow the wall's order again.", inputSchema: {} },
  async () => {
    const { changed, live } = await commit({ type: "unlock_numbers" });
    return ok(changed ? `Unlocked${where(live)}.` : "The numbers were not locked.");
  },
);

server.registerTool(
  "start_revision",
  {
    title: "Start a revision",
    description:
      `Name a revision and give it one of the industry's colours (${REVISION_COLORS.join(", ")}). Every card is snapshotted; from then on a changed line prints in the colour with a star in the margin, and a changed card wears the colour on the wall.`,
    inputSchema: { name: z.string().min(1), color: z.string().optional() },
  },
  async (args) => {
    const { changed, result, live } = await commit({ type: "start_revision", name: args.name, color: args.color });
    if (!changed) return ok("No revision started: give it a name.");
    return ok(`Started the ${result.color} revision "${result.name}"${where(live)}.`, { name: result.name, color: result.color, since: result.since });
  },
);

server.registerTool(
  "end_revision",
  { title: "End the revision", description: "The marks come off; the snapshot is dropped.", inputSchema: {} },
  async () => {
    const { changed, live } = await commit({ type: "end_revision" });
    return ok(changed ? `Revision ended${where(live)}.` : "No revision in progress.");
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
    const brief = segmentBrief(state, args.ids, { title: board?.name });
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
    if (JSON.stringify(state) !== last.after) {
      return ok(
        `Not undone: the board has changed since my ${last.what}. Undoing now would trample that. Ask the person to undo from the wall if they want it back.`,
      );
    }
    trail.pop();
    undone.push(last);
    const { boardId } = await readBoard();
    const live = await writeBoard(last.before, rev, base, boardId);
    return ok(
      `Undid ${last.what}${where(live)}. ${trail.length} more of mine can be undone.`,
      last.before,
    );
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
    if (JSON.stringify(state) !== JSON.stringify(last.before)) {
      return ok(`Not redone: the board has changed since I undid my ${last.what}. Redoing now would trample that.`);
    }
    undone.pop();
    const after = JSON.parse(last.after);
    const live = await writeBoard(after, rev, base, boardId);
    trail.push(last);
    return ok(`Redid ${last.what}${where(live)}. ${undone.length} more can be redone.`, after);
  },
);

server.registerTool(
  "set_plant",
  {
    title: "Fold the corner",
    description:
      `Fold the corner of cards — mark them as planting something — or unfold them. ${wordSentence("corner")} The setup arrow is create_arrow with kind 'setup'. Folding never moves a card.`,
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

// --- Characters -------------------------------------------------------

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
  "read_character",
  {
    title: "Read a person's page",
    description:
      "Read one person's page back, by id or by name: the five lines — looks, voice, wants, needs, notes — as they stand, and which cards the person is on. list_board says only which lines are written; this says what they say.",
    inputSchema: { id: z.string().optional(), name: z.string().optional() },
  },
  async (args) => {
    const key = (args.id ?? args.name ?? "").trim();
    if (!key) return ok("Say who: the person's id or name from list_board.");
    const { state } = await readBoard();
    const wanted = key.toLowerCase();
    const person = state.characters.find((item) => item.id === key) ?? state.characters.find((item) => item.name.trim().toLowerCase() === wanted);
    if (!person) return ok(`Nobody called "${key}" in the cast. Call list_board for the cast, or add_character.`);
    const on = state.notes.filter((note) => note.characterIds.includes(person.id));
    const lines = [
      `${person.name} (${person.id}) — on ${on.length} card${on.length === 1 ? "" : "s"}${on.length ? `: ${on.map((note) => `"${note.headline}"`).join(", ")}` : ""}`,
      ...CHARACTER_FIELDS.map((field) => `  ${field}: ${(person[field] ?? "").trim() || "(empty)"}`),
    ];
    return ok(lines.join("\n"), { ...person, cards: on.map((note) => note.id) });
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
    const trim = (text) => (text.length > 140 ? `${text.slice(0, 137)}…` : text);
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
    return ok(
      `${result.length} card(s) now ${place ? `at ${place}` : "nowhere"}${where(live)}.`,
      result,
    );
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

// --- Arrows -----------------------------------------------------------

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
    const { project, boards, live, base } = await readProject();
    return ok(
      [
        `Project "${project.name}" (${door(live, base)})`,
        `premise: ${project.premise ? `"${project.premise}"` : "(not set)"}`,
        `boards: ${project.boards.length}`,
        describeBoards(project, boards),
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
      "Set the project's premise: the series- or story-level line above every board's logline. An empty string clears it. Boards keep their own loglines.",
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
    return ok(`Project renamed to "${next.name}"${where(live)}.`, next);
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
        `reminders on "${project.name}" (${door(live, base)}): ${list.length} — ${list.length - own} the house principles the app starts with (built in), ${own} the writer's own${own === 0 ? "; add_reminder adds one the writer asks to keep" : ""}`,
        ...list.map((item) => `  - ${item.id}${item.builtIn ? " (built in)" : ""} — ${item.title}: ${item.body}`),
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
    inputSchema: { name: z.string().min(1), pages: pagesSchema.optional(), minutes: z.number().positive().optional() },
  },
  async (args) => {
    const account = await findAccount();
    if (!account) return shut("No account door: there is one project here, the open one. Set PLOTCODER_EMAIL and PLOTCODER_PASSWORD to start another on the writer's account.");
    const record = renameProject(emptyProject(), args.name.trim());
    const inserted = await account.client.from("projects").insert({ id: record.id, record, reminders: null, rev: 1 });
    if (inserted.error) return ok(`Could not start the project: ${inserted.error.message}`);
    const target = args.pages ?? args.minutes;
    const state = target === undefined ? emptyState() : { ...emptyState(), targetEighths: toEighths(target) };
    const board = await account.client.from("boards").insert({ id: record.activeBoardId, project_id: record.id, state, rev: 1, updated_by: null });
    if (board.error) return ok(`Started "${record.name}" but could not make its first board: ${board.error.message}`);
    workingProject(record.id, record.name, (account.projectCount ?? 0) + 1);
    joinPresence(record.id);
    const targetLine = target === undefined ? ` Its target is ${formatPages(state.targetEighths)} pages, the default for a feature; set_target for a pilot or a half-hour, or pass pages or minutes here.` : ` Its target is ${formatPages(state.targetEighths)} pages.`;
    return ok(`Started "${record.name}" (${record.id}) and working it now, as ${account.email}.${targetLine}${oneCallHint(record)}`, { id: record.id, name: record.name, targetEighths: state.targetEighths });
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
    if (!args.confirm) return ok(`Emptying the account deletes ${plans.length} project(s) of the writer's own: ${plans.map(describePlan).join("; ")}. Cannot be undone. Ask the writer; export_project each first if they might want them back; then pass confirm: true.${survive}`, plans);
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
      "The project the server is working, as the file Save project writes and Open project takes: the record, every board with its cards, the reminders and the writer's structures. Pass path to write it (a .json); without a path, the reply's JSON is the file. Pictures and takes on the account are not in the file. Works through every door.",
    inputSchema: { path: z.string().optional() },
  },
  async (args) => {
    if (args.path && hosted()) return ok("The hosted door has no disk to write to: call export_project without a path and the reply's JSON is the file.");
    const { project, boards, reminders } = await readProject();
    const file = toProjectFile({ project, boards, reminders: reminders ?? null });
    const cards = countCards(boards);
    const what = `"${project.name}": ${project.boards.length} board(s), ${cards} card(s)${reminders?.length ? `, ${reminders.length} reminder(s)` : ""}${project.structures?.length ? `, ${project.structures.length} structure(s)` : ""}. Pictures and takes on the account are not in the file`;
    if (args.path) {
      fs.mkdirSync(path.dirname(path.resolve(args.path)), { recursive: true });
      fs.writeFileSync(args.path, JSON.stringify(file, null, 2));
      return ok(`Saved ${what}. Written to ${args.path}: Open project in the app takes it, import_project brings it onto an account.`, { path: args.path, boards: project.boards.length, cards });
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
      `Added "${board.name}" (${board.id}) and opened it${where(live)}. It is empty. The logline is the story's question when the writer has one — leave it empty rather than invent it — and the cards come next.${next.name === "Untitled project" ? " The project is still \"Untitled project\": rename_project names it." : ""}${next.boards.length === 2 && isSampleWall(isBoardState(boards[next.boards[0].id]) ? normalizeState(boards[next.boards[0].id]) : emptyState()) ? " The sample stays as Board 1; delete_board drops it." : ""}`,
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
    return ok(`Renamed to "${args.name.trim()}"${where(live)}.`);
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
    const { changed, live } = await commit({ type: "delete_arrow", id: args.id });
    if (!changed) return ok(`No arrow with id ${args.id}. Call list_board for the real ids.`);
    return ok(`Deleted that arrow${where(live)}. Any arrow the other way is untouched.`);
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
