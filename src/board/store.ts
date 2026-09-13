// Browser-side board store.
//
// Owns the live BoardState the React app renders, routes every mutation through
// the kernel reducer, and keeps three mirrors in sync:
//   1. localStorage (plotcoder.logline / .notes / .groups / .arrows) so a
//      project Save/Open keeps working and the board survives a reload.
//   2. the Vite dev bridge (.plotcoder/board.json) when the app runs on
//      localhost, so an agent can read/write the board with the file.
//   3. window.plotcoder, so the same commands can be driven from the console or
//      a CDP session on the deployed site.

import { History } from "./history";
import {
  applyCommand,
  isBoardState,
  normalizeState,
  seedState,
  type BoardState,
  type Command,
  type NoteColor,
} from "./reducer";

const LS_LOGLINE = "plotcoder.logline";
const LS_TARGET = "plotcoder.target";
const LS_CHARACTERS = "plotcoder.characters";
const LS_NOTES = "plotcoder.notes";
const LS_GROUPS = "plotcoder.groups";
const LS_ARROWS = "plotcoder.arrows";

const BRIDGE_BOARD = "/__plotcoder/board";
const BRIDGE_EVENTS = "/__plotcoder/events";

type DispatchOptions = { sync?: boolean };

export type HistorySnapshot = { canUndo: boolean; canRedo: boolean };

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
    case "set_target":
      return "set_target";
    default:
      return null;
  }
}

type BridgePayload = { state: BoardState | null; rev: number };

function isDev(): boolean {
  try {
    return Boolean(import.meta.env && import.meta.env.DEV);
  } catch {
    return false;
  }
}

function loadLocal(): BoardState | null {
  try {
    const notes = localStorage.getItem(LS_NOTES);
    const groups = localStorage.getItem(LS_GROUPS);
    const arrows = localStorage.getItem(LS_ARROWS);
    if (notes === null && groups === null && arrows === null) return null;
    // A board saved before R19 has no logline key and one saved before R25 has
    // no target; normalizeState fills both in rather than the board being
    // treated as unreadable. A missing target reads as NaN, which it clamps.
    const target = localStorage.getItem(LS_TARGET);
    const characters = localStorage.getItem(LS_CHARACTERS);
    const state = {
      logline: localStorage.getItem(LS_LOGLINE) ?? "",
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

function saveLocal(state: BoardState): void {
  try {
    localStorage.setItem(LS_LOGLINE, state.logline ?? "");
    localStorage.setItem(LS_TARGET, String(state.targetEighths));
    localStorage.setItem(LS_CHARACTERS, JSON.stringify(state.characters));
    localStorage.setItem(LS_NOTES, JSON.stringify(state.notes));
    localStorage.setItem(LS_GROUPS, JSON.stringify(state.groups));
    localStorage.setItem(LS_ARROWS, JSON.stringify(state.arrows));
  } catch {
    /* storage might be full or blocked; the app still works in memory */
  }
}

class BoardStore {
  private state: BoardState;
  private rev = 0;
  private adopted = false;
  private started = false;
  private source: EventSource | null = null;
  private syncTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly listeners = new Set<() => void>();
  // Undo (R33). A drag is one step; typing a line is one step; a change an
  // agent made through the bridge is a step the person can take back.
  private readonly history = new History<BoardState>();
  private historySnapshot: HistorySnapshot = { canUndo: false, canRedo: false };
  // Bodies of our own writes still in flight. The bridge echoes every write
  // back over the event stream; an echo must never be mistaken for a change
  // someone else made — or an undo pressed right after a drop would see the
  // drop come back as a "remote" step and re-apply it.
  private readonly inflight = new Set<string>();

  constructor() {
    this.state = loadLocal() ?? seedState();
  }

  getState = (): BoardState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  getHistory = (): HistorySnapshot => this.historySnapshot;

  private refreshHistory(): void {
    const { canUndo, canRedo } = this.history;
    if (canUndo === this.historySnapshot.canUndo && canRedo === this.historySnapshot.canRedo) return;
    this.historySnapshot = { canUndo, canRedo };
    this.emit();
  }

  private setState(next: BoardState): void {
    this.state = next;
    saveLocal(next);
    this.emit();
  }

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

  // Force the current state to the dev bridge now (used at the end of a drag so
  // the file matches the wall the instant the pointer lifts). Also closes the
  // gesture, so the drag is one undo step.
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

  // After Open project has rewritten localStorage, make the bridge (and so the
  // file) match it before the page reloads. Without this the reload adopts the
  // bridge's copy of the *old* wall — the first bridge frame always wins on a
  // fresh page — and the opened project is silently undone whenever the dev
  // server is running. Found by the end-to-end suite; a no-op in production.
  adoptLocal = async (): Promise<void> => {
    const local = loadLocal();
    if (!local) return;
    this.setState(local);
    await this.pushState();
  };

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
  };

  private onBridgeState(payload: BridgePayload): void {
    if (payload.state === null) {
      // First bridge boot with no file yet: seed it from what we already have.
      void this.pushState();
      return;
    }
    if (!isBoardState(payload.state)) return;
    if (this.adopted && payload.rev <= this.rev) return;
    const incoming = normalizeState(payload.state);
    const incomingJson = JSON.stringify(incoming);
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

  private scheduleSync(): void {
    if (!isDev()) return;
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      void this.pushState();
    }, 120);
  }

  private async pushState(): Promise<void> {
    if (!isDev()) return;
    const stateJson = JSON.stringify(this.state);
    this.inflight.add(stateJson);
    try {
      const response = await fetch(BRIDGE_BOARD, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: `{"state":${stateJson},"rev":${this.rev}}`,
      });
      if (!response.ok) return;
      const payload = (await response.json()) as BridgePayload;
      this.adopted = true;
      if (payload.rev > this.rev) this.rev = payload.rev;
    } catch {
      /* bridge down: localStorage remains the record */
    } finally {
      // Keep it one more tick: the echo can land after the response resolves.
      setTimeout(() => this.inflight.delete(stateJson), 1000);
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
  createNote: (input: CreateInput) => unknown;
  updateNote: (id: string, patch: { headline?: string; change?: string }) => unknown;
  moveNote: (id: string, x: number, y: number) => unknown;
  recolorNote: (id: string, color: NoteColor) => unknown;
  deleteNote: (id: string) => unknown;
  createArrow: (from: string, to: string) => unknown;
  deleteArrow: (id: string) => unknown;
  createGroup: (noteIds: string[], title?: string) => unknown;
  dispatch: (command: Command) => unknown;
  undo: () => boolean;
  redo: () => boolean;
};

let windowApiInstalled = false;

export function installWindowApi(): void {
  if (windowApiInstalled || typeof window === "undefined") return;
  windowApiInstalled = true;
  const api: PlotCoderWindowApi = {
    list: () => boardStore.getState(),
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
    dispatch: (command) => boardStore.dispatch(command),
    undo: () => boardStore.undo(),
    redo: () => boardStore.redo(),
  };
  (window as unknown as { plotcoder: PlotCoderWindowApi }).plotcoder = api;
}
