// Browser-side board store.
//
// Owns the project (R35) — the record of boards, the premise, which board is
// open — and the live BoardState of the open board that the React app renders.
// Every board mutation goes through the kernel reducer. Three mirrors stay in
// sync:
//   1. localStorage: `plotcoder.project` for the record, `plotcoder.board.<id>`
//      for each board's state, so Save/Open carries every board and the wall
//      survives a reload.
//   2. the Vite dev bridge on localhost: `/__plotcoder/board` for the open board
//      (with its id) and `/__plotcoder/project` for the record and every board,
//      so an agent can read, write and switch boards while the app is open.
//   3. window.plotcoder, so the same commands can be driven from the console.

import { isReminderList, readReminders, writeReminders } from "../reminderStore";
import { toFountain } from "./fountain";
import { toMarkdown, toPlainText } from "./markdown";
import { History } from "./history";
import {
  addBoard as addBoardTo,
  DEFAULT_PROJECT_NAME,
  emptyProject,
  isProjectRecord,
  moveBoard as moveBoardIn,
  normalizeProject,
  addStructure,
  removeStructure as removeStructureFrom,
  reidentifyProject,
  removeBoard as removeBoardFrom,
  renameBoard as renameBoardIn,
  renameProject as renameProjectTo,
  setActiveBoard,
  setPremise as setPremiseOn,
  structureBeats,
  liftCast,
  sameRoster,
  scriptTitles,
  withRoster,
  type BoardMeta,
  type ProjectRecord,
} from "./project";
import {
  applyCommand,
  boardEighths,
  CHARACTER_FIELDS,
  DEFAULT_TARGET_EIGHTHS,
  emptyState,
  isBoardState,
  normalizeState,
  nowIso,
  seedState,
  type BoardState,
  type CharacterField,
  type Command,
  type NoteColor,
} from "./reducer";

const LS_PROJECT = "plotcoder.project";
const boardKey = (id: string) => `plotcoder.board.${id}`;

// The keys a single-board PlotCoder wrote before R35. Read once, then retired.
const LEGACY = {
  logline: "plotcoder.logline",
  target: "plotcoder.target",
  characters: "plotcoder.characters",
  notes: "plotcoder.notes",
  groups: "plotcoder.groups",
  arrows: "plotcoder.arrows",
};

const BRIDGE_BOARD = "/__plotcoder/board";
const BRIDGE_PROJECT = "/__plotcoder/project";
const BRIDGE_EVENTS = "/__plotcoder/events";

type DispatchOptions = { sync?: boolean };

export type HistorySnapshot = { canUndo: boolean; canRedo: boolean };

export type BoardShape = { totalEighths: number; targetEighths: number; cards: number };

type BoardPayload = { state: BoardState | null; rev: number; boardId?: string | null };
type ProjectPayload = {
  project: ProjectRecord | null;
  boards: Record<string, unknown>;
  /** Reminders (R11) ride on the project channel so agents can read and add them. */
  reminders?: unknown;
  rev: number;
};

function isDev(): boolean {
  try {
    return Boolean(import.meta.env && import.meta.env.DEV);
  } catch {
    return false;
  }
}

// Consecutive edits to the same line are one undo step: typing a headline is
// one thing you did, not one thing per keystroke burst.
function coalesceKey(command: Command): string | null {
  switch (command.type) {
    case "update_note":
      return `update_note:${command.id}`;
    case "set_logline":
      return "set_logline";
    case "rename_group":
      return `rename_group:${command.id}`;
    case "rename_character":
      return `rename_character:${command.id}`;
    case "update_character":
      return `update_character:${command.id}:${CHARACTER_FIELDS.filter((field) => field in command).join(",")}`;
    case "set_target":
      return "set_target";
    // One line on the card carries both (R37, R55): typed together, one step back.
    case "set_location":
    case "set_when":
      return `place_line:${[...command.ids].sort().join(",")}`;
    default:
      return null;
  }
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadLegacyBoard(): BoardState | null {
  try {
    const notes = localStorage.getItem(LEGACY.notes);
    const groups = localStorage.getItem(LEGACY.groups);
    const arrows = localStorage.getItem(LEGACY.arrows);
    if (notes === null && groups === null && arrows === null) return null;
    const target = localStorage.getItem(LEGACY.target);
    const characters = localStorage.getItem(LEGACY.characters);
    const state = {
      logline: localStorage.getItem(LEGACY.logline) ?? "",
      targetEighths: target === null ? undefined : Number(target),
      characters: characters ? JSON.parse(characters) : [],
      notes: notes ? JSON.parse(notes) : [],
      groups: groups ? JSON.parse(groups) : [],
      arrows: arrows ? JSON.parse(arrows) : [],
    };
    return isBoardState(state) ? normalizeState(state) : null;
  } catch {
    return null;
  }
}

function clearLegacy(): void {
  try {
    for (const key of Object.values(LEGACY)) localStorage.removeItem(key);
  } catch {
    /* nothing to clear */
  }
}

function loadBoard(id: string): BoardState | null {
  const parsed = readJson(boardKey(id));
  return isBoardState(parsed) ? normalizeState(parsed) : null;
}

function saveBoard(id: string, state: BoardState): void {
  try {
    localStorage.setItem(boardKey(id), JSON.stringify(state));
  } catch {
    /* storage might be full or blocked; the app still works in memory */
  }
}

/**
 * Drop board keys the project no longer names. A fresh page under the bridge
 * seeds a local project, then adopts the bridge's; without this the seed
 * board's key lingers and Save project carries a board nobody can open.
 */
function pruneBoards(project: ProjectRecord): void {
  try {
    const keep = new Set(project.boards.map((board) => boardKey(board.id)));
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("plotcoder.board.") && !keep.has(key)) localStorage.removeItem(key);
    }
  } catch {
    /* nothing to prune */
  }
}

function saveProject(project: ProjectRecord): void {
  try {
    localStorage.setItem(LS_PROJECT, JSON.stringify(project));
  } catch {
    /* as above */
  }
}

/**
 * The project record, migrating a pre-R35 wall on the way: the six single-board
 * keys become board one, and the old `{ premise }` record keeps its premise.
 */
function loadProject(): ProjectRecord {
  const parsed = readJson(LS_PROJECT);
  if (isProjectRecord(parsed)) return normalizeProject(parsed);

  const now = nowIso();
  let project = emptyProject(now);
  const oldPremise =
    parsed && typeof parsed === "object" && typeof (parsed as { premise?: unknown }).premise === "string"
      ? (parsed as { premise: string }).premise
      : "";
  if (oldPremise) project = setPremiseOn(project, oldPremise, now);
  const legacy = loadLegacyBoard();
  if (legacy) {
    saveBoard(project.boards[0].id, legacy);
    clearLegacy();
  }
  saveProject(project);
  return project;
}

class BoardStore {
  private project: ProjectRecord;
  private state: BoardState;
  private rev = 0;
  private projectRev = 0;
  private adopted = false;
  private adoptedProject = false;
  private started = false;
  private source: EventSource | null = null;
  private syncTimer: ReturnType<typeof setTimeout> | undefined;
  private projectSyncTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly listeners = new Set<() => void>();
  private history = new History<BoardState>();
  private historySnapshot: HistorySnapshot = { canUndo: false, canRedo: false };
  // Bodies of our own writes still in flight, so their echoes over the event
  // stream are never mistaken for someone else's change.
  private readonly inflight = new Set<string>();

  constructor() {
    this.project = loadProject();
    const stored = loadBoard(this.project.activeBoardId);
    // A brand-new project starts on the seed wall, so a first visit shows what
    // a card is; a board someone made and left empty stays empty.
    this.state = stored ?? seedState();
    if (!stored) saveBoard(this.project.activeBoardId, this.state);
    this.liftLocalCast();
    this.state = withRoster(this.state, this.project);
  }

  /**
   * The project's cast (R51): a record written before it takes its boards'
   * rosters, merged by name, and every board is composed with the result.
   */
  private liftLocalCast(): void {
    if (Array.isArray(this.project.characters)) return;
    const boards: Record<string, BoardState> = {};
    for (const meta of this.project.boards) {
      const state = meta.id === this.project.activeBoardId ? this.state : loadBoard(meta.id);
      if (state) boards[meta.id] = state;
    }
    const lifted = liftCast(this.project, boards);
    for (const [id, state] of Object.entries(lifted.boards)) saveBoard(id, state);
    this.project = lifted.project;
    saveProject(lifted.project);
    if (lifted.boards[this.project.activeBoardId]) this.state = lifted.boards[this.project.activeBoardId];
  }

  getState = (): BoardState => this.state;
  getProject = (): ProjectRecord => this.project;
  /** True once the dev bridge's first frames have landed; a fresh page follows the bridge until then. */
  isBridged = (): boolean => this.adopted && this.adoptedProject;
  getHistory = (): HistorySnapshot => this.historySnapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private refreshHistory(): void {
    const { canUndo, canRedo } = this.history;
    if (canUndo === this.historySnapshot.canUndo && canRedo === this.historySnapshot.canRedo) return;
    this.historySnapshot = { canUndo, canRedo };
    this.emit();
  }

  private setState(next: BoardState): void {
    this.state = next;
    saveBoard(this.project.activeBoardId, next);
    // A kernel command that changed the roster changed the project's cast (R51).
    if (!sameRoster(next.characters, this.project.characters)) {
      this.setProject({ ...this.project, characters: next.characters, updatedAt: nowIso() });
      return;
    }
    this.emit();
  }

  private setProject(next: ProjectRecord, sync = true): void {
    if (next === this.project) return;
    this.project = next;
    saveProject(next);
    this.emit();
    if (sync) this.scheduleProjectSync();
  }

  // --- the open board ------------------------------------------------------

  dispatch = (command: Command, options: DispatchOptions = {}): unknown => {
    const before = this.state;
    const { state, changed, result } = applyCommand(before, command);
    if (options.sync === false) {
      // Mid-gesture (a drag): the whole gesture becomes one step at commit.
      this.history.beginGesture(before);
      if (changed) this.history.touchGesture();
    } else if (changed) {
      this.history.record(before, coalesceKey(command));
    }
    if (changed) this.setState(state);
    if (options.sync !== false) this.scheduleSync();
    this.refreshHistory();
    return result;
  };

  commit = (): void => {
    this.history.endGesture();
    this.refreshHistory();
    if (this.syncTimer) clearTimeout(this.syncTimer);
    void this.pushState();
  };

  undo = (): boolean => {
    const previous = this.history.undo(this.state);
    this.refreshHistory();
    if (!previous) return false;
    this.setState(previous);
    this.scheduleSync();
    return true;
  };

  redo = (): boolean => {
    const next = this.history.redo(this.state);
    this.refreshHistory();
    if (!next) return false;
    this.setState(next);
    this.scheduleSync();
    return true;
  };

  // --- the project ---------------------------------------------------------

  /** Length against target for the panel: the open board live, the rest from storage. */
  boardShape = (id: string): BoardShape => {
    const state = id === this.project.activeBoardId ? this.state : loadBoard(id);
    if (!state) return { totalEighths: 0, targetEighths: DEFAULT_TARGET_EIGHTHS, cards: 0 };
    return {
      totalEighths: boardEighths(state),
      targetEighths: state.targetEighths,
      cards: state.notes.length,
    };
  };

  /** Open another board of the project. History is per board and starts fresh. */
  openBoard = (id: string): boolean => {
    if (id === this.project.activeBoardId) return false;
    const next = setActiveBoard(this.project, id);
    if (next === this.project) return false;
    this.switchTo(next, loadBoard(id) ?? emptyState());
    return true;
  };

  /** Add a board after the others and open it. It inherits the open board's target. */
  addBoard = (name: string): BoardMeta => {
    const { project, board } = addBoardTo(this.project, name);
    const fresh = { ...emptyState(), targetEighths: this.state.targetEighths };
    saveBoard(board.id, fresh);
    this.switchTo(project, fresh);
    return board;
  };

  renameBoard = (id: string, name: string): void => {
    this.setProject(renameBoardIn(this.project, id, name));
  };

  moveBoard = (id: string, delta: number): void => {
    this.setProject(moveBoardIn(this.project, id, delta));
  };

  /** Remove a board and its state. Refuses the last board. Not undoable. */
  removeBoard = (id: string): boolean => {
    const next = removeBoardFrom(this.project, id);
    if (next === this.project) return false;
    try {
      localStorage.removeItem(boardKey(id));
    } catch {
      /* nothing to remove */
    }
    if (next.activeBoardId !== this.project.activeBoardId) {
      this.switchTo(next, loadBoard(next.activeBoardId) ?? emptyState());
    } else {
      this.setProject(next);
    }
    return true;
  };

  /**
   * A writer's own structure from this wall's beats (Roadmap 2, item 7): each
   * beat's headline, its change line as the prompt, and where it falls as a
   * fraction of the wall's pages, in reading order.
   */
  saveStructure = (name: string, reading: { order: string[] }): void => {
    const beats = structureBeats(this.state.notes, reading.order);
    if (beats.length === 0) return;
    this.setProject(addStructure(this.project, name, beats).project);
  };

  removeStructure = (id: string): void => {
    this.setProject(removeStructureFrom(this.project, id));
  };

  renameProject = (name: string): void => {
    this.setProject(renameProjectTo(this.project, name));
  };

  setPremise = (premise: string): void => {
    this.setProject(setPremiseOn(this.project, premise));
  };

  // --- the account mirror (R4) --------------------------------------------

  /** The state of any board of the project: the open one live, the rest from storage, each with the project's cast. */
  boardState = (id: string): BoardState | null => {
    if (id === this.project.activeBoardId) return this.state;
    const stored = loadBoard(id);
    return stored ? withRoster(stored, this.project) : null;
  };

  /**
   * True while this browser holds nothing but the untouched seed wall under
   * the default project name: not work, so meeting an account with a project
   * in it adopts that project rather than carrying the seed in beside it.
   */
  isSeedProject = (): boolean => {
    if (this.project.boards.length !== 1) return false;
    if (this.project.name !== DEFAULT_PROJECT_NAME || this.project.premise) return false;
    const seed = seedState();
    const headlines = (state: BoardState) => state.notes.map((note) => note.headline).join("\u0000");
    return (
      headlines(this.state) === headlines(seed) &&
      this.state.arrows.length === seed.arrows.length &&
      this.state.groups.length === seed.groups.length &&
      this.state.logline === seed.logline
    );
  };

  /**
   * The account's copy of a board lands here. On the open board it is an undo
   * step, like an agent's change over the bridge; on another board it goes
   * straight to storage for the next switch.
   */
  replaceBoard = (id: string, state: BoardState): void => {
    if (id === this.project.activeBoardId) {
      if (JSON.stringify(state) === JSON.stringify(this.state)) return;
      this.history.record(this.state);
      this.setState(state);
      this.refreshHistory();
      this.scheduleSync();
      return;
    }
    saveBoard(id, withRoster(state, this.project));
    this.scheduleProjectSync();
  };

  /**
   * A whole project from the account lands here (R40): the record and every
   * board's state replace what this device holds, and its open board is the
   * wall. Used when the writer picks a project or one arrives on sign-in.
   */
  loadProject = (project: ProjectRecord, boards: Record<string, BoardState>): void => {
    pruneBoards(project);
    const normalized: Record<string, BoardState> = {};
    for (const [id, state] of Object.entries(boards)) normalized[id] = normalizeState(state);
    const lifted = liftCast(project, normalized);
    for (const [id, state] of Object.entries(lifted.boards)) saveBoard(id, state);
    this.switchTo(lifted.project, lifted.boards[lifted.project.activeBoardId] ?? loadBoard(lifted.project.activeBoardId) ?? emptyState());
  };

  /** The same project under a fresh id, before it is pushed to an account as a new one (R40). */
  reidentify = (): ProjectRecord => {
    const { renamed, ...next } = reidentifyProject(this.project);
    // Every board's state moves to its new key; the open board's is in hand.
    for (const [oldId, newId] of Object.entries(renamed)) {
      const state = oldId === this.project.activeBoardId ? this.state : loadBoard(oldId);
      if (state) saveBoard(newId, state);
    }
    this.project = next;
    saveProject(next);
    pruneBoards(next);
    this.emit();
    if (this.syncTimer) clearTimeout(this.syncTimer);
    if (this.projectSyncTimer) clearTimeout(this.projectSyncTimer);
    void this.pushState();
    void this.pushProject();
    return next;
  };

  /** The record and every board's state, for pushing this device's project whole. */
  snapshotProject = (): { project: ProjectRecord; boards: Record<string, BoardState> } => {
    const boards: Record<string, BoardState> = {};
    for (const board of this.project.boards) {
      const state = this.boardState(board.id);
      if (state) boards[board.id] = state;
    }
    return { project: this.project, boards };
  };

  /** The account's record lands here; a different open board switches the wall. */
  adoptProject = (project: ProjectRecord): void => {
    if (project === this.project) return;
    pruneBoards(project);
    if (project.activeBoardId !== this.project.activeBoardId) {
      this.switchTo(project, loadBoard(project.activeBoardId) ?? emptyState());
      return;
    }
    this.setProject(project);
    this.composeCast();
  };

  /** The open board takes the project's cast (R51) after the record changed under it. */
  private composeCast(): void {
    if (!Array.isArray(this.project.characters)) {
      this.liftLocalCast();
      this.scheduleProjectSync();
    }
    const composed = withRoster(this.state, this.project);
    if (composed === this.state) return;
    this.state = composed;
    saveBoard(this.project.activeBoardId, composed);
    this.emit();
  }

  private switchTo(project: ProjectRecord, state: BoardState): void {
    this.project = project;
    saveProject(project);
    this.history = new History<BoardState>();
    this.state = withRoster(state, project);
    saveBoard(project.activeBoardId, state);
    this.emit();
    this.refreshHistory();
    // A switch is structural: push both channels now rather than on the
    // debounce, so an agent asking a beat later sees the new shape.
    if (this.syncTimer) clearTimeout(this.syncTimer);
    if (this.projectSyncTimer) clearTimeout(this.projectSyncTimer);
    void this.pushState();
    void this.pushProject();
  }

  // --- the bridge ----------------------------------------------------------

  start = (): void => {
    if (this.started) return;
    this.started = true;
    if (!isDev()) return;
    try {
      const source = new EventSource(BRIDGE_EVENTS);
      this.source = source;
      source.addEventListener("state", (event) => {
        try {
          this.onBridgeState(JSON.parse((event as MessageEvent).data));
        } catch {
          /* ignore malformed frames */
        }
      });
      source.addEventListener("project", (event) => {
        try {
          this.onBridgeProject(JSON.parse((event as MessageEvent).data));
        } catch {
          /* ignore malformed frames */
        }
      });
      source.onerror = () => {
        /* bridge not available: stay in localStorage mode */
      };
    } catch {
      /* EventSource unsupported: localStorage mode */
    }
  };

  stop = (): void => {
    this.started = false;
    if (this.source) {
      this.source.close();
      this.source = null;
    }
    if (this.syncTimer) clearTimeout(this.syncTimer);
    if (this.projectSyncTimer) clearTimeout(this.projectSyncTimer);
  };

  // After Open project has rewritten localStorage, reload the record and the
  // open board and make the bridge match before the page reloads. Without this
  // the reload adopts the bridge's copy of the old wall — the first bridge
  // frame always wins on a fresh page — and the opened project is undone.
  adoptLocal = async (): Promise<void> => {
    this.project = loadProject();
    this.state = loadBoard(this.project.activeBoardId) ?? seedState();
    this.liftLocalCast();
    this.state = withRoster(this.state, this.project);
    this.history = new History<BoardState>();
    this.emit();
    await Promise.all([this.pushState(), this.pushProject()]);
  };

  private onBridgeState(payload: BoardPayload): void {
    if (payload.state === null) {
      // First bridge boot with no file yet: seed it from what we already have.
      void this.pushState();
      void this.pushProject();
      return;
    }
    if (!isBoardState(payload.state)) return;
    if (this.adopted && payload.rev <= this.rev) return;
    // A board frame from another door is a kernel command's result, so its
    // roster is the exact roster (R51) — a person it added or removed comes with
    // the card and the cast in one undo step (R33). Only a frame with no roster
    // at all (a file from before the cast was the project's) takes the project's.
    const raw = normalizeState(payload.state);
    const incoming = Array.isArray(payload.state.characters) ? raw : withRoster(raw, this.project);
    const incomingJson = JSON.stringify(incoming);
    const boardId = typeof payload.boardId === "string" ? payload.boardId : this.project.activeBoardId;

    if (boardId !== this.project.activeBoardId) {
      // Another door opened a different board. Follow it; add it to the record
      // if the project frame has not arrived yet.
      this.adopted = true;
      this.rev = payload.rev;
      let project = this.project;
      if (!project.boards.some((board) => board.id === boardId)) {
        const now = nowIso();
        project = {
          ...project,
          boards: [
            ...project.boards,
            { id: boardId, name: `Board ${project.boards.length + 1}`, createdAt: now, updatedAt: now },
          ],
          updatedAt: now,
        };
      }
      project = setActiveBoard(project, boardId);
      this.project = project;
      saveProject(project);
      this.history = new History<BoardState>();
      this.state = incoming;
      saveBoard(boardId, incoming);
      this.emit();
      this.refreshHistory();
      return;
    }

    if (this.adopted) {
      // Our own write coming back, or nothing new: take the revision, nothing else.
      if (this.inflight.has(incomingJson) || incomingJson === JSON.stringify(this.state)) {
        this.rev = payload.rev;
        return;
      }
      // A later frame that differs is someone else's change — an agent,
      // usually. Make it an undo step so the person can take it back.
      this.history.record(this.state);
    }
    this.adopted = true;
    this.rev = payload.rev;
    this.setState(incoming);
    this.refreshHistory();
  }

  private onBridgeProject(payload: ProjectPayload): void {
    if (payload.project === null) {
      void this.pushProject();
      return;
    }
    if (!isProjectRecord(payload.project)) return;
    if (this.adoptedProject && payload.rev <= this.projectRev) return;
    const incoming = normalizeProject(payload.project);
    const incomingJson = JSON.stringify(incoming);
    this.adoptedProject = true;
    this.projectRev = payload.rev;
    if (this.inflight.has(incomingJson) || incomingJson === JSON.stringify(this.project)) return;

    // Reminders ride along too: an agent may have added one.
    if (isReminderList(payload.reminders) && JSON.stringify(payload.reminders) !== JSON.stringify(readReminders())) {
      writeReminders(payload.reminders);
    }
    // Other boards' states ride along; keep them so a switch finds them.
    for (const [id, state] of Object.entries(payload.boards ?? {})) {
      if (id !== this.project.activeBoardId && isBoardState(state)) {
        saveBoard(id, withRoster(normalizeState(state), incoming));
      }
    }
    if (incoming.activeBoardId !== this.project.activeBoardId) {
      // Another door opened a different board. The board frame may also be on
      // its way; switching here is idempotent with switching there.
      const remote = payload.boards?.[incoming.activeBoardId];
      const state = isBoardState(remote)
        ? normalizeState(remote)
        : loadBoard(incoming.activeBoardId) ?? emptyState();
      this.project = incoming;
      saveProject(incoming);
      pruneBoards(incoming);
      this.history = new History<BoardState>();
      this.state = withRoster(state, incoming);
      saveBoard(incoming.activeBoardId, this.state);
      this.emit();
      this.refreshHistory();
      return;
    }
    this.setProject(incoming, false);
    pruneBoards(incoming);
    this.composeCast();
  }

  private scheduleSync(): void {
    if (!isDev()) return;
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      void this.pushState();
    }, 120);
  }

  private scheduleProjectSync(): void {
    if (!isDev()) return;
    if (this.projectSyncTimer) clearTimeout(this.projectSyncTimer);
    this.projectSyncTimer = setTimeout(() => {
      void this.pushProject();
    }, 150);
  }

  private async pushState(): Promise<void> {
    if (!isDev()) return;
    const stateJson = JSON.stringify(this.state);
    this.inflight.add(stateJson);
    try {
      const response = await fetch(BRIDGE_BOARD, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: `{"state":${stateJson},"rev":${this.rev},"boardId":${JSON.stringify(this.project.activeBoardId)}}`,
      });
      if (!response.ok) return;
      const payload = (await response.json()) as BoardPayload;
      this.adopted = true;
      if (payload.rev > this.rev) this.rev = payload.rev;
    } catch {
      /* bridge down: localStorage remains the record */
    } finally {
      // Keep it one more tick: the echo can land after the response resolves.
      setTimeout(() => this.inflight.delete(stateJson), 1000);
    }
    // The project mirror carries this board's copy too.
    this.scheduleProjectSync();
  }

  private async pushProject(): Promise<void> {
    if (!isDev()) return;
    const boards: Record<string, BoardState> = {};
    for (const board of this.project.boards) {
      const state = board.id === this.project.activeBoardId ? this.state : loadBoard(board.id);
      if (state) boards[board.id] = state;
    }
    const projectJson = JSON.stringify(this.project);
    this.inflight.add(projectJson);
    try {
      const response = await fetch(BRIDGE_PROJECT, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project: this.project, boards, reminders: readReminders(), rev: this.projectRev }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as ProjectPayload;
      this.adoptedProject = true;
      if (payload.rev > this.projectRev) this.projectRev = payload.rev;
    } catch {
      /* bridge down */
    } finally {
      setTimeout(() => this.inflight.delete(projectJson), 1000);
    }
  }
}

export const boardStore = new BoardStore();

// --- window.plotcoder ------------------------------------------------------

type CreateInput = {
  headline: string;
  change: string;
  color?: NoteColor;
  x?: number;
  y?: number;
  rotate?: number;
};

export type PlotCoderWindowApi = {
  list: () => BoardState;
  project: () => ProjectRecord;
  createNote: (input: CreateInput) => unknown;
  updateNote: (id: string, patch: { headline?: string; change?: string }) => unknown;
  moveNote: (id: string, x: number, y: number) => unknown;
  recolorNote: (id: string, color: NoteColor) => unknown;
  deleteNote: (id: string) => unknown;
  createArrow: (from: string, to: string) => unknown;
  deleteArrow: (id: string) => unknown;
  createGroup: (noteIds: string[], title?: string) => unknown;
  /** Cards into an existing frame, where they are. */
  addToGroup: (groupId: string, noteIds: string[]) => unknown;
  dispatch: (command: Command) => unknown;
  undo: () => boolean;
  redo: () => boolean;
  openBoard: (id: string) => boolean;
  newBoard: (name: string) => BoardMeta;
  setRank: (id: string, rank: "beat" | "scene") => unknown;
  /** null unsizes: the card reads as about a page again. */
  setLength: (id: string, lengthEighths: number | null) => unknown;
  setLogline: (logline: string) => unknown;
  setTarget: (targetEighths: number) => unknown;
  setLocation: (ids: string[], location: string) => unknown;
  setWhen: (ids: string[], when: string) => unknown;
  updateCharacter: (id: string, patch: Partial<Record<CharacterField, string>>) => unknown;
  applyTemplate: (template: string) => unknown;
  setPremise: (premise: string) => void;
  /** The open board as Fountain text (R23, slice a). */
  fountain: () => string;
  /** The open board as Markdown, and the script as plain text (R54). */
  markdown: () => string;
  plainText: () => string;
  /** A scene's text onto its card (R23, slice b). */
  writeScene: (id: string, text: string) => unknown;
  /** True once the dev bridge's first frames have landed (dev only). */
  bridged: () => boolean;
};

let windowApiInstalled = false;

export function installWindowApi(): void {
  if (windowApiInstalled || typeof window === "undefined") return;
  windowApiInstalled = true;
  const api: PlotCoderWindowApi = {
    list: () => boardStore.getState(),
    project: () => boardStore.getProject(),
    createNote: (input) => boardStore.dispatch({ type: "create_note", ...input }),
    updateNote: (id, patch) => boardStore.dispatch({ type: "update_note", id, ...patch }),
    moveNote: (id, x, y) => boardStore.dispatch({ type: "move_note", id, x, y }),
    recolorNote: (id, color) =>
      boardStore.dispatch({ type: "recolor_notes", ids: [id], color }),
    deleteNote: (id) => boardStore.dispatch({ type: "delete_note", id }),
    createArrow: (from, to) => boardStore.dispatch({ type: "create_arrow", from, to }),
    deleteArrow: (id) => boardStore.dispatch({ type: "delete_arrow", id }),
    createGroup: (noteIds, title) =>
      boardStore.dispatch({ type: "create_group", noteIds, title }),
    addToGroup: (groupId, noteIds) => boardStore.dispatch({ type: "add_to_group", id: groupId, noteIds }),
    dispatch: (command) => boardStore.dispatch(command),
    undo: () => boardStore.undo(),
    redo: () => boardStore.redo(),
    openBoard: (id) => boardStore.openBoard(id),
    newBoard: (name) => boardStore.addBoard(name),
    setRank: (id, rank) => boardStore.dispatch({ type: "set_rank", ids: [id], rank }),
    setLength: (id, lengthEighths) => boardStore.dispatch({ type: "set_length", ids: [id], lengthEighths }),
    setLogline: (logline) => boardStore.dispatch({ type: "set_logline", logline }),
    setTarget: (targetEighths) => boardStore.dispatch({ type: "set_target", targetEighths }),
    setLocation: (ids, location) => boardStore.dispatch({ type: "set_location", ids, location }),
    setWhen: (ids, when) => boardStore.dispatch({ type: "set_when", ids, when }),
    updateCharacter: (id, patch) => boardStore.dispatch({ type: "update_character", id, ...patch }),
    applyTemplate: (template) => boardStore.dispatch({ type: "apply_template", template }),
    setPremise: (premise) => boardStore.setPremise(premise),
    writeScene: (id, text) => boardStore.dispatch({ type: "set_text", id, text }),
    bridged: () => boardStore.isBridged(),
    fountain: () => {
      const project = boardStore.getProject();
      const board = project.boards.find((item) => item.id === project.activeBoardId);
      return toFountain(boardStore.getState(), {
        ...scriptTitles(project, board),
        premise: project.premise || undefined,
        draftDate: new Date().toISOString(),
      });
    },
    markdown: () => {
      const project = boardStore.getProject();
      const board = project.boards.find((item) => item.id === project.activeBoardId);
      return toMarkdown(boardStore.getState(), {
        ...scriptTitles(project, board),
        premise: project.premise || undefined,
      });
    },
    plainText: () => {
      const project = boardStore.getProject();
      const board = project.boards.find((item) => item.id === project.activeBoardId);
      return toPlainText(boardStore.getState(), {
        ...scriptTitles(project, board),
      });
    },
  };
  (window as unknown as { plotcoder: PlotCoderWindowApi }).plotcoder = api;
}
