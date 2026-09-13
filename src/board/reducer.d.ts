// Type surface for the PlotCoder board kernel (implemented in reducer.js).
// Authored as plain ESM JS + this declaration so the exact same module runs in
// the browser (via Vite) and in Node (the MCP server) with no build step.

export declare const NOTE_COLORS: readonly ["yellow", "pink", "blue", "green", "orange"];
export type NoteColor = (typeof NOTE_COLORS)[number];

export declare const NOTE_RANKS: readonly ["scene", "beat"];
export type NoteRank = (typeof NOTE_RANKS)[number];

/** Length is measured in eighths of a page (D23). */
export declare const EIGHTHS_PER_PAGE: number;
export declare const DEFAULT_NOTE_EIGHTHS: number;
export declare const DEFAULT_TARGET_EIGHTHS: number;
/** Total estimated length of the board, in eighths. */
export declare function boardEighths(state: BoardState): number;
/** Eighths as a breakdown writes them: "1 3/8", "97", "5/8". */
export declare function formatPages(eighths: number): string;

export declare const NOTE_WIDTH: number;
export declare const NOTE_HEIGHT: number;

/**
 * One person in the board's roster (R29, D26). Referenced from cards by id.
 * The record is expected to grow — what they look like, the details a writer
 * pulls up — so it carries an id and timestamps from the start.
 */
export type BoardCharacter = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

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
  /** Estimated screen time, in eighths of a page (R25). */
  lengthEighths: number;
  /** Who is in the scene: ids from the roster, in the order they were cast (R29). */
  characterIds: string[];
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
  /** Target script length in eighths of a page; 120 pages for a feature (R25). */
  targetEighths: number;
  /** The roster: every person in the story, whether or not they are on a card yet (R29). */
  characters: BoardCharacter[];
  notes: BoardNote[];
  groups: BoardGroup[];
  arrows: BoardArrow[];
};

export type Pose = { id: string; x: number; y: number; rotate: number };

export type Command =
  | { type: "set_logline"; logline: string }
  | { type: "set_rank"; ids: string[]; rank: NoteRank }
  | { type: "set_length"; ids: string[]; lengthEighths: number }
  | { type: "set_target"; targetEighths: number }
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
      lengthEighths?: number;
      characterIds?: string[];
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
  | { type: "delete_arrow"; id: string }
  | { type: "add_character"; name: string; id?: string }
  | { type: "rename_character"; id: string; name: string }
  | { type: "remove_character"; id: string }
  | { type: "set_cast"; ids: string[]; characterIds: string[] };

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
