// Type surface for the PlotCoder board kernel (implemented in reducer.js).
// Authored as plain ESM JS + this declaration so the exact same module runs in
// the browser (via Vite) and in Node (the MCP server) with no build step.

export declare const NOTE_COLORS: readonly ["yellow", "pink", "blue", "green", "orange"];
export type NoteColor = (typeof NOTE_COLORS)[number];

export declare const NOTE_RANKS: readonly ["scene", "beat"];
export type NoteRank = (typeof NOTE_RANKS)[number];

export declare const NOTE_WIDTH: number;
export declare const NOTE_HEIGHT: number;

export type BoardNote = {
  id: string;
  headline: string;
  change: string;
  color: NoteColor;
  x: number;
  y: number;
  rotate: number;
  z: number;
  /** A beat is one of the 8-to-15 major turns; everything else is a scene (R20). */
  rank: NoteRank;
  createdAt: string;
  updatedAt: string;
};

export type BoardGroup = {
  id: string;
  title: string;
  noteIds: string[];
};

export type BoardArrow = {
  id: string;
  from: string;
  to: string;
};

export type BoardState = {
  /** The board's central question — what this story is arguing (R19). */
  logline: string;
  notes: BoardNote[];
  groups: BoardGroup[];
  arrows: BoardArrow[];
};

export type Pose = { id: string; x: number; y: number; rotate: number };

export type Command =
  | { type: "set_logline"; logline: string }
  | { type: "set_rank"; ids: string[]; rank: NoteRank }
  | {
      type: "create_note";
      id?: string;
      headline?: string;
      change?: string;
      color?: NoteColor;
      x?: number;
      y?: number;
      rotate?: number;
      rank?: NoteRank;
    }
  | { type: "update_note"; id: string; headline?: string; change?: string }
  | { type: "move_note"; id: string; x: number; y: number }
  | { type: "nudge_notes"; ids: string[]; dx: number; dy: number }
  | { type: "recolor_notes"; ids: string[]; color: NoteColor }
  | { type: "raise_note"; id: string }
  | { type: "delete_note"; id: string }
  | { type: "apply_poses"; poses: Pose[] }
  | { type: "settle_note"; id: string }
  | { type: "create_group"; title?: string; noteIds: string[] }
  | { type: "ungroup"; id: string }
  | { type: "rename_group"; id: string; title: string }
  | { type: "create_arrow"; from: string; to: string }
  | { type: "delete_arrow"; id: string };

export type CommandResult = {
  state: BoardState;
  changed: boolean;
  result?: unknown;
};

export declare function newId(): string;
export declare function nowIso(): string;
export declare function emptyState(): BoardState;
export declare function seedState(now?: string): BoardState;
export declare function isBoardState(value: unknown): value is BoardState;
/** Fill in fields added after a board was written. Run at every load boundary. */
export declare function normalizeState(value: unknown): BoardState;
/** Beats vs scenes. The app shows this number and passes no judgement (D21). */
export declare function countRanks(state: BoardState): { beats: number; scenes: number };
export declare function applyCommand(
  state: BoardState,
  command: Command,
  now?: string,
): CommandResult;
