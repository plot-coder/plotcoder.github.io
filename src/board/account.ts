// The account mirror (R4).
//
// A fourth mirror beside localStorage, the dev bridge and window.plotcoder:
// when someone is signed in, the project record and every board are kept in
// their account on Supabase, so the same project opens on every device.
//
// The rules live in sync.js and are pure. This file is the thin network layer
// around them, and the bookkeeping that makes the rules answerable: for every
// row, the revision this device last saw, and whether it has changes it has
// not pushed. Signed out, none of this runs and the app is exactly as before.
//
// Nothing is ever lost and there is no merge dialog. When a push finds the
// account ahead, the account's copy stays the board and this device's copy
// becomes a new board named for the device and the time (sync.js).

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { readReminders, writeReminders, isReminderList, REMINDERS_EVENT } from "../reminderStore";
import { supabase } from "../supabase";
import { isProjectRecord, normalizeProject, type ProjectRecord } from "./project";
import { isBoardState, normalizeState, type BoardState } from "./reducer";
import { boardStore } from "./store";
import {
  deviceName,
  mergeProjects,
  openOutcome,
  pushOutcome,
  reconcileOnSignIn,
  resolveBoardConflict,
} from "./sync";

export type SyncStatus = "idle" | "saving" | "saved" | "offline";

export type Account = {
  /** The session has been looked for; until then the sheet shows nothing about accounts. */
  ready: boolean;
  user: { id: string; email: string } | null;
  status: SyncStatus;
  lastSavedAt: string | null;
  /** The address a link was just sent to, so the sheet can say so. */
  linkSentTo: string | null;
  error: string | null;
  /** The last thing worth telling: a conflict became a second board. */
  notice: string | null;
};

// What this device knows about the account's copy. Outside the `plotcoder.`
// prefix so it is never carried in a project file (R12).
type Bookkeeping = {
  userId: string;
  projectRev: number;
  boardRevs: Record<string, number>;
  dirtyBoards: string[];
  dirtyProject: boolean;
  lastSavedAt: string | null;
};

const BOOKKEEPING_KEY = "sb-plotcoder-sync";
const PROJECTS = "plotcoder_projects";
const BOARDS = "plotcoder_boards";
const PUSH_DELAY = 800;

type ProjectRow = { id: string; record: unknown; reminders: unknown; rev: number };
type BoardRow = { id: string; project_id: string; state: unknown; rev: number };

function freshBookkeeping(userId: string): Bookkeeping {
  return { userId, projectRev: 0, boardRevs: {}, dirtyBoards: [], dirtyProject: false, lastSavedAt: null };
}

function readBookkeeping(): Bookkeeping | null {
  try {
    const raw = localStorage.getItem(BOOKKEEPING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Bookkeeping;
    if (!parsed || typeof parsed.userId !== "string") return null;
    return {
      userId: parsed.userId,
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

class AccountStore {
  private account: Account = {
    ready: false,
    user: null,
    status: "idle",
    lastSavedAt: null,
    linkSentTo: null,
    error: null,
    notice: null,
  };
  private books: Bookkeeping | null = null;
  private client: SupabaseClient | null = null;
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
    const user = session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null;
    if (user?.id === this.account.user?.id) {
      if (!this.account.ready) this.set({ ready: true });
      return;
    }
    if (!user) {
      this.books = null;
      this.saveBooks();
      this.set({ ready: true, user: null, status: "idle", lastSavedAt: null, notice: null });
      return;
    }
    // A fresh sign-in, or a session found on load.
    const known = readBookkeeping();
    this.books = known && known.userId === user.id ? known : freshBookkeeping(user.id);
    this.set({ ready: true, user, linkSentTo: null, error: null, lastSavedAt: this.books.lastSavedAt });
    if (known && known.userId === user.id) await this.open();
    else await this.meet();
  }

  // --- the door ------------------------------------------------------------

  signIn = async (email: string): Promise<boolean> => {
    const address = email.trim();
    if (!address || !this.client) return false;
    this.set({ error: null });
    const { error } = await this.client.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    if (error) {
      this.set({ error: error.message });
      return false;
    }
    this.set({ linkSentTo: address });
    return true;
  };

  signOut = async (): Promise<void> => {
    if (!this.client) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    await this.client.auth.signOut();
    // The wall stays on this device. Only the mirror stops.
  };

  // --- what changed here ---------------------------------------------------

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

  // --- meeting the account -------------------------------------------------

  /** The first time this device meets the account: sync.js decides who adopts whom. */
  private async meet(): Promise<void> {
    if (!this.client || !this.books) return;
    const local = boardStore.getProject();
    const remote = await this.fetchProject(local.id);
    if (remote === undefined) return; // offline: try again on the next change
    const plan = reconcileOnSignIn({
      local: { project: local },
      remote: { project: remote?.project ?? null },
      isSeed: boardStore.isSeedProject(),
      device: deviceName(navigator.userAgent),
      now: new Date(),
    });
    if (remote) {
      this.books.projectRev = remote.rev;
      if (isReminderList(remote.reminders) && !plan.pushProject) writeReminders(remote.reminders);
    }
    if (plan.adopt) {
      const boards = await this.fetchBoards(plan.adopt.id, plan.adopt.boards.map((board) => board.id));
      if (!boards) return;
      for (const row of boards) this.books.boardRevs[row.id] = row.rev;
      this.apply(plan.adopt, boards);
    }
    this.books.dirtyProject = Boolean(plan.pushProject);
    this.books.dirtyBoards = plan.pushBoards;
    this.saveBooks();
    if (plan.renamed.length) {
      const names = plan.renamed
        .map((id) => plan.adopt?.boards.find((board) => board.id === id)?.name)
        .filter(Boolean);
      this.set({ notice: `Your boards from this device joined the project as ${names.join(", ")}.` });
    }
    if (plan.pushProject || plan.pushBoards.length) await this.push();
    else this.set({ status: "saved" });
  }

  /** Opening the app while signed in: pull what moved elsewhere, push what moved here. */
  private async open(): Promise<void> {
    if (!this.client || !this.books) return;
    const local = boardStore.getProject();
    const remote = await this.fetchProject(local.id);
    if (remote === undefined) return;
    if (!remote) {
      // The account lost the project (or never had this one): seed it again.
      this.books = { ...freshBookkeeping(this.books.userId), dirtyProject: true, dirtyBoards: local.boards.map((board) => board.id) };
      this.saveBooks();
      await this.push();
      return;
    }
    let project = local;
    const projectOutcome = openOutcome({ remoteRev: remote.rev, seenRev: this.books.projectRev, dirty: this.books.dirtyProject });
    if (projectOutcome === "adopt" || projectOutcome === "conflict") {
      project = projectOutcome === "adopt" ? remote.project : mergeProjects(remote.project, local, new Date());
      if (project !== local) this.books.dirtyProject = true;
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
    await this.push();
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

  // --- pushing -------------------------------------------------------------

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
        this.books.lastSavedAt = new Date().toISOString();
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
      // The record moved elsewhere: the account's names and order win, and any
      // board only this device has rides along. Boards are settled one by one.
      record = mergeProjects(remote.project, project, new Date());
      seen = remote.rev;
      if (record !== project) this.apply(record, []);
    }
    const row = { id: record.id, record, reminders: readReminders(), rev: seen + 1, updated_at: new Date().toISOString() };
    const query =
      outcome === "insert"
        ? this.client.from(PROJECTS).insert(row).select("rev")
        : this.client.from(PROJECTS).update(row).eq("id", record.id).eq("rev", seen).select("rev");
    const { data, error } = await query;
    if (error) {
      this.set({ error: error.message });
      return false;
    }
    if (!data || data.length === 0) return false; // moved again underneath us; next push retries
    this.books.projectRev = data[0].rev;
    this.books.dirtyProject = false;
    // Boards this project no longer has are gone from the account too.
    const kept = new Set(record.boards.map((board) => board.id));
    const gone = Object.keys(this.books.boardRevs).filter((id) => !kept.has(id));
    if (gone.length) {
      await this.client.from(BOARDS).delete().in("id", gone);
      for (const id of gone) delete this.books.boardRevs[id];
    }
    return true;
  }

  private async pushBoard(id: string): Promise<boolean> {
    if (!this.client || !this.books) return false;
    const project = boardStore.getProject();
    if (!project.boards.some((board) => board.id === id)) {
      this.books.dirtyBoards = this.books.dirtyBoards.filter((item) => item !== id);
      return true;
    }
    const state = boardStore.boardState(id);
    if (!state) return true;
    const { data: found, error: lookupError } = await this.client
      .from(BOARDS)
      .select("rev")
      .eq("id", id)
      .maybeSingle();
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
    const row = { id, project_id: project.id, state, rev: seen + 1, updated_at: new Date().toISOString() };
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

  /**
   * The account is ahead of this device on one board, and this device has its
   * own changes. Keep the account's; this device's becomes a new board.
   */
  private async settleConflict(id: string, projectId: string): Promise<void> {
    if (!this.client || !this.books) return;
    const rows = await this.fetchBoards(projectId, [id]);
    if (!rows || rows.length === 0 || !isBoardState(rows[0].state)) return;
    const mine = boardStore.boardState(id);
    const resolved = resolveBoardConflict({
      project: boardStore.getProject(),
      boardId: id,
      device: deviceName(navigator.userAgent),
      now: new Date(),
    });
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
    this.set({
      notice: `Two versions of ${original} met. The account's is on the wall; yours is beside it as “${resolved.copy.name}”.`,
    });
  }

  // --- reading -------------------------------------------------------------

  /** null: the account has no such project. undefined: could not ask. */
  private async fetchProject(
    id: string,
  ): Promise<{ project: ProjectRecord; reminders: unknown; rev: number } | null | undefined> {
    if (!this.client) return undefined;
    const { data, error } = await this.client
      .from(PROJECTS)
      .select("id, record, reminders, rev")
      .eq("id", id)
      .maybeSingle<ProjectRow>();
    if (error) {
      this.set({ error: error.message, status: isOnline() ? "idle" : "offline" });
      return undefined;
    }
    if (!data) {
      // One project per writer for now: if the account holds a project under
      // another id, that is the one to meet.
      const { data: any, error: anyError } = await this.client
        .from(PROJECTS)
        .select("id, record, reminders, rev")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<ProjectRow>();
      if (anyError || !any) return null;
      return isProjectRecord(any.record)
        ? { project: normalizeProject(any.record), reminders: any.reminders, rev: any.rev }
        : null;
    }
    return isProjectRecord(data.record)
      ? { project: normalizeProject(data.record), reminders: data.reminders, rev: data.rev }
      : null;
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
    const { data, error } = await this.client
      .from(BOARDS)
      .select("id, project_id, state, rev")
      .eq("project_id", projectId)
      .in("id", ids);
    if (error) {
      this.set({ error: error.message });
      return null;
    }
    return (data ?? []) as BoardRow[];
  }
}

export const accountStore = new AccountStore();

/** "a moment ago", "4 minutes ago", "at 3:14 pm" — for the sheet's account line. */
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
