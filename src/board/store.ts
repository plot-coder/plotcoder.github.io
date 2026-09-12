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
const LS_NOTES = "plotcoder.notes";
const LS_GROUPS = "plotcoder.groups";
const LS_ARROWS = "plotcoder.arrows";

const BRIDGE_BOARD = "/__plotcoder/board";
const BRIDGE_EVENTS = "/__plotcoder/events";

type DispatchOptions = { sync?: boolean };

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
    // A board saved before R19 has no logline key; normalizeState fills it in
    // rather than the board being treated as unreadable.
    const state = {
      logline: localStorage.getItem(LS_LOGLINE) ?? "",
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

  private setState(next: BoardState): void {
    this.state = next;
    saveLocal(next);
    this.emit();
  }

  dispatch = (command: Command, options: DispatchOptions = {}): unknown => {
    const { state, changed, result } = applyCommand(this.state, command);
    if (changed) this.setState(state);
    if (options.sync !== false) this.scheduleSync();
    return result;
  };

  // Force the current state to the dev bridge now (used at the end of a drag so
  // the file matches the wall the instant the pointer lifts).
  commit = (): void => {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    void this.pushState();
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
    this.adopted = true;
    this.rev = payload.rev;
    this.setState(normalizeState(payload.state));
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
    try {
      const response = await fetch(BRIDGE_BOARD, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: this.state, rev: this.rev }),
      });
      if (!response.ok) return;
      const payload = (await response.json()) as BridgePayload;
      this.adopted = true;
      this.rev = payload.rev;
    } catch {
      /* bridge down: localStorage remains the record */
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
  };
  (window as unknown as { plotcoder: PlotCoderWindowApi }).plotcoder = api;
}
