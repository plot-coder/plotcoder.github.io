// Type surface for the PlotCoder board kernel (implemented in reducer.js).
// Authored as plain ESM JS + this declaration so the exact same module runs in
// the browser (via Vite) and in Node (the MCP server) with no build step.

export declare const NOTE_COLORS: readonly ["yellow", "pink", "blue", "green", "orange"];
export type NoteColor = (typeof NOTE_COLORS)[number];

export declare const NOTE_RANKS: readonly ["scene", "beat"];
export type NoteRank = (typeof NOTE_RANKS)[number];

/** What an arrow means: what comes after what, or a setup and its payoff (R30). */
export declare const ARROW_KINDS: readonly ["follows", "setup"];
export type ArrowKind = (typeof ARROW_KINDS)[number];

/** Length is measured in eighths of a page (D23). */
export declare const EIGHTHS_PER_PAGE: number;
export declare const DEFAULT_NOTE_EIGHTHS: number;
export declare const DEFAULT_TARGET_EIGHTHS: number;
/** Total estimated length of the board, in eighths. */
export declare const LINES_PER_PAGE: number;
/** Eighths the scene's text runs to; 0 when there is no text. */
export declare function measuredEighths(text: string | undefined): number;
/** Measured when written, the estimate otherwise. Every reading uses this. */
export declare function noteEighths(note: BoardNote): number;
export declare function isMeasured(note: BoardNote): boolean;
export declare function boardEighths(state: BoardState): number;
/** Eighths as a breakdown writes them: "1 3/8", "97", "5/8". */
export declare function formatPages(eighths: number): string;
/** Eighths as screen time, a page a minute: "17 minutes", "2 hours", "2 h 4 min". */
export declare function formatMinutes(eighths: number): string;

export declare const NOTE_WIDTH: number;
export declare const NOTE_HEIGHT: number;

/**
 * One person in the board's roster (R29, D26). Referenced from cards by id.
 * The record is expected to grow — what they look like, the details a writer
 * pulls up — so it carries an id and timestamps from the start.
 */
export type CharacterField = "looks" | "voice" | "wants" | "needs" | "notes";
export declare const CHARACTER_FIELDS: readonly CharacterField[];

export type BoardCharacter = {
  id: string;
  name: string;
  /** The person's page (R36): all text, empty until filled. */
  looks: string;
  voice: string;
  wants: string;
  needs: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

/** The page fields a person has filled in, in page order. */
/** The places on a wall in order of first appearance, with card counts. */
export declare function boardPlaces(state: BoardState): Array<{ name: string; cards: number }>;
/** True when the card is at this place, spelt any way. */
export declare function atPlace(note: BoardNote, place: string): boolean;

export declare function filledCharacterFields(character: BoardCharacter): CharacterField[];

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
  /** The writer's estimate in eighths of a page; null until someone sizes the card, which reads as about a page. */
  lengthEighths: number | null;
  /** Who is in the scene: ids from the roster, in the order they were cast (R29). */
  characterIds: string[];
  /** The corner is folded: this card plants something that must pay off (R31). */
  plants: boolean;
  /** When folded: the id of another board of the project where it pays off (R50), or null. */
  payoffBoardId: string | null;
  /** The scene on that board that pays it off (R58), or null while the board is only a promise. */
  payoffNoteId: string | null;
  /** Where the scene happens (R37): a phrase in the writer's words; empty until set. */
  location: string;
  /** When the scene happens, as the writer says it — "night", "day four, dawn" — printed after the place on the heading (R55). Empty when unsaid. */
  when: string;
  /** The scene's text in Fountain (R23 b): action, cues, dialogue; empty until written. */
  text: string;
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
  /** "follows" unless the writer says the tail sets up the head. */
  kind: ArrowKind;
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
  /** Locked scene numbers, once a draft has gone out (Roadmap 2, item 8); null until then. */
  lock: import("./numbering").Lock | null;
  /** The revision in progress — a name, a colour, a snapshot — or null. */
  revision: import("./numbering").Revision | null;
  /** Questions the writer has left, for now (R53): kept until the question would read differently. */
  left: LeftQuestion[];
};

/** A question the wall asked and the writer left (R53). */
export type LeftQuestion = {
  kind: string;
  ids: string[];
  /** The question's words when it was left; it comes back when they would differ. */
  text: string;
  since: string;
  /** The writer's reason, when they gave one. */
  why?: string;
};

export type Pose = { id: string; x: number; y: number; rotate: number };

export declare function isCharacter(value: unknown): value is { id: string; name: string };
export declare function fillCharacter(character: { id: string; name: string } & Partial<BoardCharacter>): BoardCharacter;
export declare function sameName(a: string, b: string): boolean;

export type Command =
  | { type: "set_logline"; logline: string }
  | { type: "set_rank"; ids: string[]; rank: NoteRank }
  | { type: "set_length"; ids: string[]; lengthEighths: number | null }
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
      plants?: boolean;
      location?: string;
      when?: string;
      text?: string;
    }
  | { type: "update_note"; id: string; headline?: string; change?: string; location?: string; when?: string }
  | { type: "move_note"; id: string; x: number; y: number }
  | { type: "nudge_notes"; ids: string[]; dx: number; dy: number }
  | { type: "recolor_notes"; ids: string[]; color: NoteColor }
  | { type: "raise_note"; id: string }
  | { type: "delete_note"; id: string }
  | { type: "apply_poses"; poses: Pose[] }
  | { type: "settle_note"; id: string }
  | { type: "create_group"; title?: string; noteIds: string[] }
  | { type: "ungroup"; id: string }
  | { type: "add_to_group"; id: string; noteIds: string[] }
  | { type: "rename_group"; id: string; title: string }
  | { type: "create_arrow"; from: string; to: string; kind?: ArrowKind }
  | { type: "delete_arrow"; id: string }
  | { type: "set_arrow_kind"; id: string; kind: ArrowKind }
  | { type: "new_board" }
  | { type: "add_character"; name: string; id?: string }
  | { type: "rename_character"; id: string; name: string }
  | { type: "remove_character"; id: string }
  | ({ type: "update_character"; id: string } & Partial<Record<CharacterField, string>>)
  | { type: "set_cast"; ids: string[]; characterIds: string[] }
  | { type: "set_plant"; ids: string[]; plants: boolean }
  | { type: "set_payoff_board"; ids: string[]; boardId: string | null; noteId?: string | null }
  | { type: "set_location"; ids: string[]; location: string }
  | { type: "set_when"; ids: string[]; when: string }
  | { type: "apply_template"; template: string; beats?: Array<{ name: string; prompt: string; at: number }> }
  | { type: "set_text"; id: string; text: string }
  | { type: "lock_numbers"; order?: string[] }
  | { type: "unlock_numbers" }
  | { type: "start_revision"; name: string; color?: string }
  | { type: "end_revision" }
  | { type: "leave_question"; kind: string; ids: string[]; text: string; why?: string }
  | { type: "ask_again"; kind: string; ids?: string[] };

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
