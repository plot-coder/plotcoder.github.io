// Type surface for readWall.js — read the wall (R22, first slice).

import type { BoardNote, BoardState } from "./reducer";

export declare const PLACEHOLDER_HEADLINE: string;
export declare const PLACEHOLDER_CHANGE: string;

export type FindingKind =
  /** No beats are marked, so runs cannot be read. */
  | "unmarked"
  /** One run between beats is out of proportion with the others. */
  | "sag"
  /** Beats back to back, with no scene between them; consecutive pairs are one finding naming the chain. */
  | "empty"
  /** Cards that say no place, once any card has one. */
  | "unplaced"
  /** A card still carries a placeholder headline or has no change line. */
  | "unwritten"
  /** The wall uses arrows, and these cards have none. */
  | "unlinked"
  /** Two headlines read like the same scene. */
  | "duplicate"
  /** A setup arrow leaves a card whose corner is not folded: a payoff with no fold. */
  | "unplanted"
  /** A card with nobody in it, on a wall that has a cast. */
  | "nobody"
  /** A group runs too long to be one sequence. */
  | "sequence"
  /** A character in the roster who is on no card. */
  | "uncast"
  /** A character gone for more than a third of the story between two appearances. */
  | "absent"
  /** A setup arrow whose payoff comes before its setup on the wall. */
  | "backwards"
  /** A card with a folded corner and no setup arrow leaving it. */
  | "unpaid"
  /** A thread (R60) with an end the writer has not tied: where it is first seen, or where it comes out. */
  | "loose";

export type Finding = {
  kind: FindingKind;
  /** Card ids; a group id for "sequence"; a character id (then card ids) for "uncast" and "absent"; an arrow id (then card ids) for "backwards"; a thread id (then card ids) for "loose". Empty for "unmarked". */
  ids: string[];
  /** The question, written for a writer. */
  text: string;
};

/** Scene pages strictly between two beats. `from` null = opening, `to` null = closing. */
export type Run = {
  from: string | null;
  to: string | null;
  eighths: number;
  cards: number;
  /** The scene cards in the run, in reading order. */
  ids: string[];
};

/** A setup arrow, with the distance from where it is planted to where it pays off. Negative means backwards. */
/** `eighths` is null when an end is behind another card as its other version: no place in the story, no distance. */
export type Setup = { id: string; from: string; to: string; eighths: number | null };

export type WallReading = {
  /** Every card id in reading order. */
  order: string[];
  beats: Array<{ id: string; headline: string }>;
  runs: Run[];
  setups: Setup[];
  /** Every planted card: the scene that pays it off (first setup arrow, by wall order), or null while unpaid. */
  /** For each folded card, the cards its setup arrows land on, in wall order; empty when unpaid. */
  payoffs: Record<string, string[]>;
  /** Folded cards that pay off on another board of the project (R50): the card, the board, and the scene there that claims it (R58) or null while the board is a promise. */
  later: { id: string; boardId: string; noteId: string | null }[];
  /** Open cards (R59): the writer's words for what is not decided, in story order; not asked about while they stand. */
  open: Array<{ id: string; words: string; hides: FindingKind[] }>;
  /** Fields left open by the writer's word (R61): the board's logline, and each card's when, in story order. Listed, not asked. */
  /** Turns proposed and not yet kept or struck, in story order. */
  proposed: string[];
  /** What is not decided about the film itself, in the writer's sentences. */
  openLines: string[];
  openFields: Array<{ field: "logline"; words: string } | { field: "location"; id: string; words: string } | { field: "when"; id: string; words: string } | { field: "change"; id: string; words: string } | { field: "cast"; id: string; words: string } | { field: "castOpen"; id: string; words: string }>;
  /** Two versions of one scene (R65): each front card with the versions behind it, in story order; listed, never asked. */
  versions: Array<{ id: string; alternatives: string[] }>;
  /** People the writer has left something open about, in their words: listed, never asked. */
  openPeople: Array<{ id: string; name: string; words: string }>;
  /** The film's cards a follows arrow touches, of the film's cards: the unlinked question waits until half are wired. */
  wired: { linked: number; of: number };
  /** The cards set aside (R66): on the wall and not in the film; listed, never asked. */
  aside: string[];
  /** Threads (R60): each named string with its cards in story order and which ends are open. */
  threads: Array<{ id: string; name: string; ids: string[]; startOpen: boolean; endOpen: boolean; /** Eighths from the first card's start to the last card's start; 0 with fewer than two cards. */ apart: number }>;
  /** Cards here that pay off a fold of another board (R58), composed by the door from the project. */
  paidBy: Array<{ id: string; fromBoardId: string; fromBoardName: string; fromNoteId: string; fromHeadline: string; fromColor: string }>;
  /** The questions the wall asks now. A left one (R53) is not here while its words hold. */
  findings: Finding[];
  /** Questions the writer has left, for now: the same question, with when it was left. */
  left: Array<Finding & { since: string; why?: string }>;
};

/** Rows top to bottom, cards left to right within a row. */
export declare function readingOrder(notes: BoardNote[]): BoardNote[];
/** Story order: reading order with each follows arrow pulling its source in front of its target (R56). */
export declare function storyOrder(state: Pick<BoardState, "notes" | "arrows">, ids?: string[]): BoardNote[];
export declare function readWall(
  state: BoardState,
  options?: {
    /** Cast ids on a card of another board of the project (R51): not asked about as uncast here. */
    elsewhere?: string[];
    /** Every board of the project by id (R58): a fold's promise is asked about once that board holds cards and no scene claims it. */
    laterBoards?: Record<string, { name: string; cards: number; noteIds: string[] }>;
    /** Folds of other boards that land on cards here (R58). */
    paidBy?: Array<{ id: string; fromBoardId: string; fromBoardName: string; fromNoteId: string; fromHeadline: string; fromColor: string }>;
  },
): WallReading;
export declare function describeRuns(reading: WallReading, state: BoardState): string[];
export declare function describeSetups(reading: WallReading, state: BoardState): string[];

/** Everything undecided on the wall: the writer's open things (project fields, shared words grouped, then each card once) and what is simply not said, by field. */
export declare function describeUndecided(
  state: BoardState,
  reading: WallReading,
  extras?: { project?: Array<{ label: string; words: string }>; wouldAsk?: (item: { id: string; words: string; hides: string[] }) => string },
): { open: string[]; blank: string[] };
/** "whether Tomás is in it", for a card where someone may or may not be; empty when nobody is a maybe. */
export declare function maybeWords(note: { maybeCharacterIds?: string[] }, state: { characters?: Array<{ id: string; name: string }> }): string;
/** How many things are open, by the writer's word, on cards not in the film. */
export declare function openOutsideFilm(state: BoardState): number;
/** "who is in it" on a card with nobody named, "who else is in it" beside names. */
export declare function castOpenLabel(note: { characterIds?: string[]; maybeCharacterIds?: string[] }): string;
