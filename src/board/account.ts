// The account mirror (R4), the name on the door (R39), the writer's projects
// (R40) and the people on one (R41).
//
// A fourth mirror beside localStorage, the dev bridge and window.plotcoder:
// when someone is signed in, the open project's record and every board are
// kept in PlotCoder's own Supabase project, so the same project opens on
// every device and, shared by name, on another writer's. Live changes from
// another person arrive over Realtime and land as steps the wall can undo,
// exactly like an agent's change through the bridge.
//
// The rules live in sync.js and are pure. This file is the thin network layer
// around them and the bookkeeping that makes the rules answerable: for every
// row of the open project, the revision this device last saw, and whether it
// has changes it has not pushed. Signed out, none of this runs.
//
// Nothing is ever lost and there is no merge dialog. When a push finds the
// account ahead, the account's copy stays the board and this device's copy
// becomes a new board named for the device and the time (sync.js). With
// Realtime that only happens after working offline.

import type { RealtimeChannel, Session, SupabaseClient } from "@supabase/supabase-js";
import { isReminderList, readReminders, writeReminders, REMINDERS_EVENT } from "../reminderStore";
import { supabase, SUPABASE_KEY, SUPABASE_URL } from "../supabase";
import { isProjectRecord, normalizeProject, type ProjectRecord } from "./project";
import { isBoardState, normalizeState, nowIso, type BoardState } from "./reducer";
import { boardStore } from "./store";
import {
  deviceName,
  liveOutcome,
  mergeProjects,
  openOutcome,
  planSignIn,
  pushOutcome,
  resolveBoardConflict,
} from "./sync";

export type SyncStatus = "idle" | "saving" | "saved" | "offline";

export type ProjectSummary = {
  id: string;
  name: string;
  boards: number;
  updatedAt: string;
  people: string[];
  mine: boolean;
};

export type Person = { name: string; role: "owner" | "writer"; userId: string };

export type Account = {
  /** The session has been looked for; until then the sheets say nothing about accounts. */
  ready: boolean;
  user: { id: string; name: string } | null;
  status: SyncStatus;
  lastSavedAt: string | null;
  error: string | null;
  /** The last thing worth telling: a conflict became a second board, a share landed. */
  notice: string | null;
  /** Every project this writer is on, newest first. */
  projects: ProjectSummary[];
  /** The people on the open project. */
  people: Person[];
  /** Names here now on the open project, this device's own excluded. */
  present: string[];
  /** More than one project and no choice made yet: show the picker. */
  needsPick: boolean;
  /** A door action in flight. */
  busy: boolean;
};

export type NameStatus = "free" | "taken" | "invalid" | "unknown";

// What this device knows about the account's copy of the open project.
// Outside the `plotcoder.` prefix so it is never carried in a project file.
type Bookkeeping = {
  userId: string;
  projectId: string;
  projectRev: number;
  boardRevs: Record<string, number>;
  dirtyBoards: string[];
  dirtyProject: boolean;
  lastSavedAt: string | null;
};

const BOOKKEEPING_KEY = "sb-plotcoder-sync";
const PROJECTS = "projects";
const BOARDS = "boards";
const PUSH_DELAY = 800;
const NAME = /^[a-z0-9][a-z0-9._-]{0,31}$/;

type ProjectRow = { id: string; record: unknown; reminders: unknown; rev: number; updated_at?: string; owner?: string; people?: string[] };
type BoardRow = { id: string; project_id: string; state: unknown; rev: number; updated_by?: string | null };

export function cleanName(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidName(value: string): boolean {
  return NAME.test(cleanName(value));
}

function emailFor(name: string): string {
  return `${cleanName(name)}@names.plotcoder.com`;
}

/**
 * The password as Supabase sees it: a hash of the name and what was typed,
 * so a password of any length — no rules — passes Supabase's own minimum,
 * and the clear text never leaves this device.
 */
export async function hashPassword(name: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`plotcoder\n${cleanName(name)}\n${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function freshBookkeeping(userId: string, projectId: string): Bookkeeping {
  return { userId, projectId, projectRev: 0, boardRevs: {}, dirtyBoards: [], dirtyProject: false, lastSavedAt: null };
}

function readBookkeeping(): Bookkeeping | null {
  try {
    const raw = localStorage.getItem(BOOKKEEPING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Bookkeeping;
    if (!parsed || typeof parsed.userId !== "string" || typeof parsed.projectId !== "string") return null;
    return {
      userId: parsed.userId,
      projectId: parsed.projectId,
      projectRev: Number(parsed.projectRev) || 0,
      boardRevs: parsed.boardRevs && typeof parsed.boardRevs === "object" ? parsed.boardRevs : {},
      dirtyBoards: Array.isArray(parsed.dirtyBoards) ? parsed.dirtyBoards : [],
      dirtyProject: Boolean(parsed.dirtyProject),
      lastSavedAt: typeof parsed.lastSavedAt === "string" ? parsed.lastSavedAt : null,
    };
  } catch {
    return null;
  }
}

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function summarize(row: ProjectRow, me: string): ProjectSummary | null {
  if (!isProjectRecord(row.record)) return null;
  const record = normalizeProject(row.record);
  return {
    id: row.id,
    name: record.name,
    boards: record.boards.length,
    updatedAt: row.updated_at ?? record.updatedAt,
    people: Array.isArray(row.people) ? row.people : [],
    mine: row.owner === me,
  };
}

class AccountStore {
  private account: Account = {
    ready: false,
    user: null,
    status: "idle",
    lastSavedAt: null,
    error: null,
    notice: null,
    projects: [],
    people: [],
    present: [],
    needsPick: false,
    busy: false,
  };
  private books: Bookkeeping | null = null;
  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private started = false;
  private pushTimer: ReturnType<typeof setTimeout> | undefined;
  private pushing = false;
  private pushAgain = false;
  // While the mirror itself writes into the board store, its own changes must
  // not come back as things to push.
  private applying = false;
  private lastState: BoardState | null = null;
  private lastProject: ProjectRecord | null = null;
  private readonly listeners = new Set<() => void>();

  getAccount = (): Account => this.account;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private set(patch: Partial<Account>): void {
    this.account = { ...this.account, ...patch };
    for (const listener of this.listeners) listener();
  }

  private saveBooks(): void {
    try {
      if (this.books) localStorage.setItem(BOOKKEEPING_KEY, JSON.stringify(this.books));
      else localStorage.removeItem(BOOKKEEPING_KEY);
    } catch {
      /* storage blocked: the account still works for this session */
    }
  }

  // --- lifecycle -----------------------------------------------------------

  start = (): void => {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    this.lastState = boardStore.getState();
    this.lastProject = boardStore.getProject();
    boardStore.subscribe(this.onBoardChange);
    window.addEventListener(REMINDERS_EVENT, this.onRemindersChange);
    window.addEventListener("online", () => void this.push());
    window.addEventListener("offline", () => {
      if (this.account.user) this.set({ status: "offline" });
    });

    try {
      this.client = supabase();
    } catch {
      this.set({ ready: true });
      return;
    }
    this.client.auth.onAuthStateChange((_event, session) => {
      void this.onSession(session);
    });
    void this.client.auth.getSession().then(({ data }) => this.onSession(data.session));
  };

  private async onSession(session: Session | null): Promise<void> {
    const id = session?.user?.id ?? null;
    if (id === (this.account.user?.id ?? null)) {
      if (!this.account.ready) this.set({ ready: true });
      return;
    }
    if (!id || !this.client) {
      this.leaveChannel();
      this.books = null;
      this.saveBooks();
      this.set({ ready: true, user: null, status: "idle", lastSavedAt: null, notice: null, projects: [], people: [], present: [], needsPick: false });
      return;
    }
    const metaName = typeof session?.user?.user_metadata?.name === "string" ? session.user.user_metadata.name : "";
    const { data: myName } = await this.client.rpc("my_name");
    const name = typeof myName === "string" && myName ? myName : metaName;
    this.set({ ready: true, user: { id, name }, error: null });
    await this.refreshProjects();
    const known = readBookkeeping();
    const local = boardStore.getProject();
    if (known && known.userId === id && known.projectId === local.id) {
      this.books = known;
      this.set({ lastSavedAt: known.lastSavedAt });
      await this.open();
    } else {
      await this.meet();
    }
  }

  // --- the door (R39) -------------------------------------------------------

  /** Is this name free, taken, or not a name? Asked as the writer types. */
  nameStatus = async (name: string): Promise<NameStatus> => {
    if (!isValidName(name)) return "invalid";
    if (!this.client) return "unknown";
    const { data, error } = await this.client.rpc("name_taken", { candidate: cleanName(name) });
    if (error) return "unknown";
    return data ? "taken" : "free";
  };

  /** Claim a free name with a password of any kind, and sign in. */
  claim = async (name: string, password: string): Promise<boolean> => {
    if (!this.client) return false;
    if (!isValidName(name)) {
      this.set({ error: "A name is letters and numbers, with dots, dashes or underscores, up to 32 long." });
      return false;
    }
    if (!password) {
      this.set({ error: "A password is needed — any password." });
      return false;
    }
    this.set({ busy: true, error: null });
    try {
      const hashed = await hashPassword(name, password);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/account`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ action: "claim", name: cleanName(name), password: hashed }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        this.set({ error: payload.error === "taken" ? `${cleanName(name)} is taken.` : payload.error ?? "Could not claim that name." });
        return false;
      }
      return await this.signIn(name, password);
    } catch {
      this.set({ error: "Could not reach the account. Try again when the network is back." });
      return false;
    } finally {
      this.set({ busy: false });
    }
  };

  /** Sign in with a name and its password. */
  signIn = async (name: string, password: string): Promise<boolean> => {
    if (!this.client) return false;
    this.set({ busy: true, error: null });
    try {
      const hashed = await hashPassword(name, password);
      const { error } = await this.client.auth.signInWithPassword({ email: emailFor(name), password: hashed });
      if (error) {
        this.set({ error: `That is not the password for ${cleanName(name)}.` });
        return false;
      }
      return true;
    } catch {
      this.set({ error: "Could not reach the account. Try again when the network is back." });
      return false;
    } finally {
      this.set({ busy: false });
    }
  };

  signOut = async (): Promise<void> => {
    if (!this.client) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    await this.client.auth.signOut();
    // The wall stays on this device. Only the mirror stops.
  };

  /** Change the password; the current one is asked once. */
  changePassword = async (current: string, next: string): Promise<boolean> => {
    if (!this.client || !this.account.user) return false;
    if (!next) {
      this.set({ error: "A password is needed — any password." });
      return false;
    }
    this.set({ busy: true, error: null });
    try {
      const name = this.account.user.name;
      const check = await this.client.auth.signInWithPassword({ email: emailFor(name), password: await hashPassword(name, current) });
      if (check.error) {
        this.set({ error: "That is not your current password." });
        return false;
      }
      const { error } = await this.client.auth.updateUser({ password: await hashPassword(name, next) });
      if (error) {
        this.set({ error: error.message });
        return false;
      }
      this.set({ notice: "Password changed." });
      return true;
    } finally {
      this.set({ busy: false });
    }
  };

  /** Change the name; the current password is asked once. The password stays the same word. */
  changeName = async (current: string, next: string): Promise<boolean> => {
    if (!this.client || !this.account.user) return false;
    if (!isValidName(next)) {
      this.set({ error: "A name is letters and numbers, with dots, dashes or underscores, up to 32 long." });
      return false;
    }
    this.set({ busy: true, error: null });
    try {
      const old = this.account.user.name;
      const check = await this.client.auth.signInWithPassword({ email: emailFor(old), password: await hashPassword(old, current) });
      if (check.error || !check.data.session) {
        this.set({ error: "That is not your current password." });
        return false;
      }
      const response = await fetch(`${SUPABASE_URL}/functions/v1/account`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${check.data.session.access_token}`,
        },
        body: JSON.stringify({ action: "rename", name: cleanName(next) }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        this.set({ error: payload.error === "taken" ? `${cleanName(next)} is taken.` : payload.error ?? "Could not change the name." });
        return false;
      }
      // The password hash is salted with the name, so it moves with it.
      const { error } = await this.client.auth.updateUser({ password: await hashPassword(next, current) });
      if (error) {
        this.set({ error: error.message });
        return false;
      }
      this.set({ user: { id: this.account.user.id, name: cleanName(next) }, notice: `You are ${cleanName(next)} now.` });
      await this.refreshProjects();
      await this.loadPeople();
      return true;
    } finally {
      this.set({ busy: false });
    }
  };

  // --- projects (R40) -------------------------------------------------------

  refreshProjects = async (): Promise<void> => {
    if (!this.client || !this.account.user) return;
    const { data, error } = await this.client.rpc("my_projects");
    if (error) {
      this.set({ error: error.message });
      return;
    }
    const me = this.account.user.id;
    const projects = ((data ?? []) as ProjectRow[]).map((row) => summarize(row, me)).filter((row): row is ProjectSummary => row !== null);
    this.set({ projects });
  };

  /** Open one of the writer's projects: it replaces what this device holds. */
  openProject = async (id: string): Promise<boolean> => {
    if (!this.client || !this.account.user) return false;
    if (this.books && this.books.projectId === id) {
      this.set({ needsPick: false });
      return true;
    }
    // Push what is unsaved on the project we are leaving.
    if (this.books && (this.books.dirtyProject || this.books.dirtyBoards.length)) await this.push();
    const remote = await this.fetchProject(id);
    if (!remote) {
      this.set({ error: "That project could not be opened." });
      return false;
    }
    const rows = await this.fetchBoards(id, remote.project.boards.map((board) => board.id));
    if (!rows) return false;
    const boards: Record<string, BoardState> = {};
    const revs: Record<string, number> = {};
    for (const row of rows) {
      if (isBoardState(row.state)) boards[row.id] = normalizeState(row.state);
      revs[row.id] = row.rev;
    }
    this.books = { ...freshBookkeeping(this.account.user.id, id), projectRev: remote.rev, boardRevs: revs };
    this.saveBooks();
    if (isReminderList(remote.reminders)) writeReminders(remote.reminders);
    this.applying = true;
    try {
      boardStore.loadProject(remote.project, boards);
    } finally {
      this.applying = false;
      this.lastState = boardStore.getState();
      this.lastProject = boardStore.getProject();
    }
    this.set({ needsPick: false, status: "saved", notice: null });
    this.joinChannel(id);
    await this.loadPeople();
    return true;
  };

  /** A new, empty project of the writer's; it opens. */
  newProject = async (name: string): Promise<boolean> => {
    if (!this.client || !this.account.user) return false;
    if (this.books && (this.books.dirtyProject || this.books.dirtyBoards.length)) await this.push();
    const { emptyProject, renameProject } = await import("./project");
    const { seedState } = await import("./reducer");
    let record = emptyProject();
    if (name.trim()) record = renameProject(record, name.trim());
    const board = seedState();
    const { error } = await this.client.from(PROJECTS).insert({ id: record.id, record, reminders: readReminders(), rev: 1 });
    if (error) {
      this.set({ error: error.message });
      return false;
    }
    const inserted = await this.client.from(BOARDS).insert({ id: record.activeBoardId, project_id: record.id, state: board, rev: 1 });
    if (inserted.error) {
      this.set({ error: inserted.error.message });
      return false;
    }
    await this.refreshProjects();
    return this.openProject(record.id);
  };

  dismissPick = (): void => {
    this.set({ needsPick: false });
  };

  // --- people (R41) ---------------------------------------------------------

  private async loadPeople(): Promise<void> {
    if (!this.client || !this.books) return;
    const { data, error } = await this.client.rpc("project_people", { p_project: this.books.projectId });
    if (error) return;
    const people = ((data ?? []) as Array<{ name: string; role: string; user_id: string }>).map((row) => ({
      name: row.name,
      role: row.role === "owner" ? ("owner" as const) : ("writer" as const),
      userId: row.user_id,
    }));
    this.set({ people });
  }

  share = async (name: string): Promise<boolean> => {
    if (!this.client || !this.books) return false;
    this.set({ error: null });
    const { data, error } = await this.client.rpc("share_project", { p_project: this.books.projectId, p_name: cleanName(name) });
    if (error) {
      this.set({ error: error.message.replace(/^.*?: /, "") });
      return false;
    }
    this.set({ notice: `${data} is on this project now.` });
    await this.loadPeople();
    await this.refreshProjects();
    return true;
  };

  unshare = async (userId: string): Promise<boolean> => {
    if (!this.client || !this.books) return false;
    const { error } = await this.client.rpc("unshare_project", { p_project: this.books.projectId, p_user: userId });
    if (error) {
      this.set({ error: error.message.replace(/^.*?: /, "") });
      return false;
    }
    await this.loadPeople();
    await this.refreshProjects();
    return true;
  };

  // --- live (R41) -----------------------------------------------------------

  private joinChannel(projectId: string): void {
    if (!this.client || !this.account.user) return;
    this.leaveChannel();
    const me = this.account.user;
    const channel = this.client.channel(`project:${projectId}`, { config: { presence: { key: me.id } } });
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: BOARDS, filter: `project_id=eq.${projectId}` }, (payload) => {
        void this.onLiveBoard(payload.eventType, payload.new as Partial<BoardRow>);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: PROJECTS, filter: `id=eq.${projectId}` }, (payload) => {
        void this.onLiveProject(payload.new as Partial<ProjectRow>);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `project_id=eq.${projectId}` }, () => {
        void this.loadPeople();
        void this.refreshProjects();
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ name: string }>();
        const present = new Set<string>();
        for (const [key, entries] of Object.entries(state)) {
          if (key === me.id) continue;
          for (const entry of entries) if (entry.name) present.add(entry.name);
        }
        this.set({ present: [...present] });
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void channel.track({ name: me.name });
      });
    this.channel = channel;
  }

  private leaveChannel(): void {
    if (this.channel && this.client) {
      void this.client.removeChannel(this.channel);
      this.channel = null;
    }
    this.set({ present: [] });
  }

  private async onLiveBoard(event: string, row: Partial<BoardRow>): Promise<void> {
    if (!this.books || !this.account.user || !row.id) return;
    if (row.updated_by === this.account.user.id) return; // our own write coming round
    if (event === "DELETE") return; // the record's update says which boards remain
    const remoteRev = typeof row.rev === "number" ? row.rev : 0;
    const outcome = liveOutcome({ remoteRev, seenRev: this.books.boardRevs[row.id] ?? 0, dirty: this.books.dirtyBoards.includes(row.id) });
    if (outcome !== "adopt") return;
    const state = isBoardState(row.state) ? normalizeState(row.state) : null;
    if (!state) return;
    this.applying = true;
    try {
      boardStore.replaceBoard(row.id, state);
    } finally {
      this.applying = false;
      this.lastState = boardStore.getState();
      this.lastProject = boardStore.getProject();
    }
    this.books.boardRevs[row.id] = remoteRev;
    this.saveBooks();
  }

  private async onLiveProject(row: Partial<ProjectRow>): Promise<void> {
    if (!this.books || !isProjectRecord(row.record)) return;
    const remoteRev = typeof row.rev === "number" ? row.rev : 0;
    if (remoteRev <= this.books.projectRev || this.books.dirtyProject) return;
    const record = normalizeProject(row.record);
    const local = boardStore.getProject();
    // Keep this device's open board; take the rest of the record.
    const next = record.boards.some((board) => board.id === local.activeBoardId)
      ? { ...record, activeBoardId: local.activeBoardId }
      : record;
    // A board the record names that this device has never seen: fetch it.
    const missing = next.boards.filter((board) => boardStore.boardState(board.id) === null).map((board) => board.id);
    const rows = missing.length ? await this.fetchBoards(next.id, missing) : [];
    this.applying = true;
    try {
      for (const fetched of rows ?? []) {
        if (isBoardState(fetched.state)) {
          boardStore.replaceBoard(fetched.id, normalizeState(fetched.state));
          this.books.boardRevs[fetched.id] = fetched.rev;
        }
      }
      boardStore.adoptProject(next);
    } finally {
      this.applying = false;
      this.lastState = boardStore.getState();
      this.lastProject = boardStore.getProject();
    }
    if (isReminderList(row.reminders)) writeReminders(row.reminders);
    this.books.projectRev = remoteRev;
    this.saveBooks();
    await this.refreshProjects();
  }

  // --- what changed here ----------------------------------------------------

  private onBoardChange = (): void => {
    const state = boardStore.getState();
    const project = boardStore.getProject();
    if (this.applying) {
      this.lastState = state;
      this.lastProject = project;
      return;
    }
    let changed = false;
    if (project !== this.lastProject) {
      this.lastProject = project;
      if (this.books) {
        this.books.dirtyProject = true;
        changed = true;
      }
    }
    if (state !== this.lastState) {
      this.lastState = state;
      if (this.books) {
        const id = project.activeBoardId;
        if (!this.books.dirtyBoards.includes(id)) this.books.dirtyBoards.push(id);
        changed = true;
      }
    }
    if (changed) {
      this.saveBooks();
      this.schedulePush();
    }
  };

  private onRemindersChange = (): void => {
    if (!this.books) return;
    this.books.dirtyProject = true;
    this.saveBooks();
    this.schedulePush();
  };

  /** After Open project rewrote every board: everything here is new to the account. */
  markAllDirty = (): void => {
    if (!this.books) return;
    this.books.dirtyProject = true;
    this.books.dirtyBoards = boardStore.getProject().boards.map((board) => board.id);
    this.saveBooks();
  };

  private schedulePush(): void {
    if (!this.account.user) return;
    if (!isOnline()) {
      this.set({ status: "offline" });
      return;
    }
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => void this.push(), PUSH_DELAY);
  }

  // --- meeting the account --------------------------------------------------

  /** The first time this device meets the account, or a project it has not synced: sync.js decides. */
  private async meet(): Promise<void> {
    if (!this.client || !this.account.user) return;
    const local = boardStore.getProject();
    const remoteIds = this.account.projects.map((project) => project.id);
    const plan = planSignIn({ isSeed: boardStore.isSeedProject(), localProjectId: local.id, remoteProjectIds: remoteIds });
    if (plan.pushLocalAsNew) {
      // This device's project becomes one of the account's, kept whole, under
      // a fresh id: the one it carried may be someone else's (every page under
      // the dev bridge shares one; a project file carries its author's).
      this.applying = true;
      let mine = local;
      try {
        mine = boardStore.reidentify();
      } finally {
        this.applying = false;
        this.lastState = boardStore.getState();
        this.lastProject = boardStore.getProject();
      }
      this.books = { ...freshBookkeeping(this.account.user.id, mine.id), dirtyProject: true, dirtyBoards: mine.boards.map((board) => board.id) };
      this.saveBooks();
      await this.push();
      await this.refreshProjects();
      this.joinChannel(mine.id);
      await this.loadPeople();
      if (plan.pick) this.set({ needsPick: true });
      return;
    }
    if (plan.open && plan.open !== local.id) {
      await this.openProject(plan.open);
    } else if (plan.open === local.id && !plan.pushLocalAsNew) {
      // The account already holds this project (another device pushed it): open it fresh.
      this.books = null;
      await this.openProject(local.id);
    }
    if (plan.pick) this.set({ needsPick: true });
  }

  /** Opening the app while signed in on a known project: pull what moved elsewhere, push what moved here. */
  private async open(): Promise<void> {
    if (!this.client || !this.books) return;
    const local = boardStore.getProject();
    const remote = await this.fetchProject(local.id);
    if (remote === undefined) return;
    if (!remote) {
      // The project is gone from the account (removed from it, or deleted): keep the wall, meet again.
      this.books = null;
      this.saveBooks();
      await this.meet();
      return;
    }
    let project = local;
    const projectOutcome = openOutcome({ remoteRev: remote.rev, seenRev: this.books.projectRev, dirty: this.books.dirtyProject });
    if (projectOutcome === "adopt" || projectOutcome === "conflict") {
      project = projectOutcome === "adopt" ? remote.project : mergeProjects(remote.project, local, new Date());
      if (project !== local) this.books.dirtyProject = projectOutcome === "conflict";
      this.books.projectRev = remote.rev;
      if (isReminderList(remote.reminders) && projectOutcome === "adopt") writeReminders(remote.reminders);
    }
    const revs = await this.fetchBoardRevs(project.id);
    if (!revs) return;
    const toFetch: string[] = [];
    const conflicts: string[] = [];
    for (const board of project.boards) {
      const outcome = openOutcome({
        remoteRev: revs.get(board.id) ?? null,
        seenRev: this.books.boardRevs[board.id] ?? 0,
        dirty: this.books.dirtyBoards.includes(board.id),
      });
      if (outcome === "adopt") toFetch.push(board.id);
      else if (outcome === "conflict") conflicts.push(board.id);
      else if (outcome === "push" && !this.books.dirtyBoards.includes(board.id)) this.books.dirtyBoards.push(board.id);
    }
    const boards = toFetch.length ? await this.fetchBoards(project.id, toFetch) : [];
    if (!boards) return;
    for (const row of boards) this.books.boardRevs[row.id] = row.rev;
    this.apply(project, boards);
    this.saveBooks();
    for (const id of conflicts) await this.settleConflict(id, project.id);
    this.joinChannel(project.id);
    await this.loadPeople();
    await this.push();
    if (this.account.projects.length > 1 && !readPicked()) this.set({ needsPick: false });
  }

  /** Write the account's copy into this device's store without it counting as a change here. */
  private apply(project: ProjectRecord, boards: BoardRow[]): void {
    this.applying = true;
    try {
      for (const row of boards) {
        if (isBoardState(row.state)) boardStore.replaceBoard(row.id, normalizeState(row.state));
      }
      boardStore.adoptProject(project);
    } finally {
      this.applying = false;
      this.lastState = boardStore.getState();
      this.lastProject = boardStore.getProject();
    }
  }

  // --- pushing --------------------------------------------------------------

  private async push(): Promise<void> {
    if (!this.client || !this.books || !this.account.user) return;
    if (this.pushing) {
      this.pushAgain = true;
      return;
    }
    if (!isOnline()) {
      this.set({ status: "offline" });
      return;
    }
    this.pushing = true;
    this.set({ status: "saving", error: null });
    try {
      let ok = true;
      if (this.books.dirtyProject) ok = await this.pushProject();
      for (const id of [...this.books.dirtyBoards]) {
        if (!ok) break;
        ok = await this.pushBoard(id);
      }
      if (ok) {
        this.books.lastSavedAt = nowIso();
        this.set({ status: "saved", lastSavedAt: this.books.lastSavedAt });
      } else {
        this.set({ status: isOnline() ? "idle" : "offline" });
      }
      this.saveBooks();
    } finally {
      this.pushing = false;
      if (this.pushAgain) {
        this.pushAgain = false;
        this.schedulePush();
      }
    }
  }

  private async pushProject(): Promise<boolean> {
    if (!this.client || !this.books) return false;
    const project = boardStore.getProject();
    const remote = await this.fetchProject(project.id);
    if (remote === undefined) return false;
    const outcome = pushOutcome({ remoteRev: remote?.rev ?? null, seenRev: this.books.projectRev });
    let record = project;
    let seen = this.books.projectRev;
    if (outcome === "conflict" && remote) {
      record = mergeProjects(remote.project, project, new Date());
      seen = remote.rev;
      if (record !== project) this.apply(record, []);
    }
    const row = { id: record.id, record, reminders: readReminders(), rev: seen + 1, updated_at: nowIso() };
    const query =
      outcome === "insert"
        ? this.client.from(PROJECTS).insert(row).select("rev")
        : this.client.from(PROJECTS).update(row).eq("id", record.id).eq("rev", seen).select("rev");
    const { data, error } = await query;
    if (error) {
      if (outcome === "insert" && error.code === "23505") {
        // The id is someone else's project: take a fresh one and try again.
        this.applying = true;
        try {
          boardStore.reidentify();
        } finally {
          this.applying = false;
          this.lastState = boardStore.getState();
          this.lastProject = boardStore.getProject();
        }
        this.books.projectId = boardStore.getProject().id;
        return this.pushProject();
      }
      this.set({ error: error.message });
      return false;
    }
    if (!data || data.length === 0) return false;
    this.books.projectRev = data[0].rev;
    this.books.dirtyProject = false;
    const kept = new Set(record.boards.map((board) => board.id));
    const gone = Object.keys(this.books.boardRevs).filter((id) => !kept.has(id));
    if (gone.length) {
      await this.client.from(BOARDS).delete().in("id", gone);
      for (const id of gone) delete this.books.boardRevs[id];
    }
    return true;
  }

  private async pushBoard(id: string): Promise<boolean> {
    if (!this.client || !this.books || !this.account.user) return false;
    const project = boardStore.getProject();
    if (!project.boards.some((board) => board.id === id)) {
      this.books.dirtyBoards = this.books.dirtyBoards.filter((item) => item !== id);
      return true;
    }
    const state = boardStore.boardState(id);
    if (!state) return true;
    const { data: found, error: lookupError } = await this.client.from(BOARDS).select("rev").eq("id", id).maybeSingle();
    if (lookupError) {
      this.set({ error: lookupError.message });
      return false;
    }
    const seen = this.books.boardRevs[id] ?? 0;
    const outcome = pushOutcome({ remoteRev: found?.rev ?? null, seenRev: seen });
    if (outcome === "conflict") {
      await this.settleConflict(id, project.id);
      return true;
    }
    const row = { id, project_id: project.id, state, rev: seen + 1, updated_by: this.account.user.id, updated_at: nowIso() };
    const query =
      outcome === "insert"
        ? this.client.from(BOARDS).insert(row).select("rev")
        : this.client.from(BOARDS).update(row).eq("id", id).eq("rev", seen).select("rev");
    const { data, error } = await query;
    if (error) {
      this.set({ error: error.message });
      return false;
    }
    if (!data || data.length === 0) return false;
    this.books.boardRevs[id] = data[0].rev;
    this.books.dirtyBoards = this.books.dirtyBoards.filter((item) => item !== id);
    return true;
  }

  /** The account is ahead on a board this device also changed: keep the account's; this device's becomes a new board. */
  private async settleConflict(id: string, projectId: string): Promise<void> {
    if (!this.client || !this.books) return;
    const rows = await this.fetchBoards(projectId, [id]);
    if (!rows || rows.length === 0 || !isBoardState(rows[0].state)) return;
    const mine = boardStore.boardState(id);
    const resolved = resolveBoardConflict({ project: boardStore.getProject(), boardId: id, device: deviceName(navigator.userAgent), now: new Date() });
    if (!resolved || !mine) return;
    this.applying = true;
    try {
      boardStore.replaceBoard(resolved.copy.id, mine);
      boardStore.replaceBoard(id, normalizeState(rows[0].state));
      boardStore.adoptProject(resolved.project);
    } finally {
      this.applying = false;
      this.lastState = boardStore.getState();
      this.lastProject = boardStore.getProject();
    }
    this.books.boardRevs[id] = rows[0].rev;
    this.books.dirtyBoards = this.books.dirtyBoards.filter((item) => item !== id);
    this.books.dirtyBoards.push(resolved.copy.id);
    this.books.dirtyProject = true;
    this.saveBooks();
    const original = resolved.project.boards.find((board) => board.id === id)?.name ?? "the board";
    this.set({ notice: `Two versions of ${original} met. The account's is on the wall; yours is beside it as “${resolved.copy.name}”.` });
  }

  // --- reading --------------------------------------------------------------

  /** null: the account has no such project. undefined: could not ask. */
  private async fetchProject(id: string): Promise<{ project: ProjectRecord; reminders: unknown; rev: number } | null | undefined> {
    if (!this.client) return undefined;
    const { data, error } = await this.client.from(PROJECTS).select("id, record, reminders, rev").eq("id", id).maybeSingle<ProjectRow>();
    if (error) {
      this.set({ error: error.message, status: isOnline() ? "idle" : "offline" });
      return undefined;
    }
    if (!data || !isProjectRecord(data.record)) return null;
    return { project: normalizeProject(data.record), reminders: data.reminders, rev: data.rev };
  }

  private async fetchBoardRevs(projectId: string): Promise<Map<string, number> | null> {
    if (!this.client) return null;
    const { data, error } = await this.client.from(BOARDS).select("id, rev").eq("project_id", projectId);
    if (error) {
      this.set({ error: error.message });
      return null;
    }
    return new Map((data ?? []).map((row: { id: string; rev: number }) => [row.id, row.rev]));
  }

  private async fetchBoards(projectId: string, ids: string[]): Promise<BoardRow[] | null> {
    if (!this.client) return null;
    if (ids.length === 0) return [];
    const { data, error } = await this.client.from(BOARDS).select("id, project_id, state, rev, updated_by").eq("project_id", projectId).in("id", ids);
    if (error) {
      this.set({ error: error.message });
      return null;
    }
    return (data ?? []) as BoardRow[];
  }
}

function readPicked(): boolean {
  return true;
}

export const accountStore = new AccountStore();

/** "a moment ago", "4 minutes ago", "at 3:14 pm" — for the sheets' account lines. */
export function savedAgo(iso: string | null, now = new Date()): string {
  if (!iso) return "not yet";
  const then = new Date(iso);
  const seconds = Math.max(0, (now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return "a moment ago";
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  return `at ${then.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

/** "yesterday", "Sept 3" — for the picker. */
export function openedWhen(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const days = Math.floor((now.getTime() - then.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
