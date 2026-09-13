// Type surface for readWall.js — read the wall (R22, first slice).

import type { BoardNote, BoardState } from "./reducer";

export declare const PLACEHOLDER_HEADLINE: string;
export declare const PLACEHOLDER_CHANGE: string;

export type FindingKind =
  /** No beats are marked, so runs cannot be read. */
  | "unmarked"
  /** One run between beats is out of proportion with the others. */
  | "sag"
  /** A card still carries a placeholder headline or has no change line. */
  | "unwritten"
  /** The wall uses arrows, and these cards have none. */
  | "unlinked"
  /** Two headlines read like the same scene. */
  | "duplicate"
  /** A group runs too long to be one sequence. */
  | "sequence"
  /** A character in the roster who is on no card. */
  | "uncast"
  /** A character gone for more than a third of the story between two appearances. */
  | "absent";

export type Finding = {
  kind: FindingKind;
  /** Card ids; a group id for "sequence"; a character id (then card ids) for "uncast" and "absent". Empty for "unmarked". */
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
};

export type WallReading = {
  /** Every card id in reading order. */
  order: string[];
  beats: Array<{ id: string; headline: string }>;
  runs: Run[];
  findings: Finding[];
};

/** Rows top to bottom, cards left to right within a row. */
export declare function readingOrder(notes: BoardNote[]): BoardNote[];
export declare function readWall(state: BoardState): WallReading;
export declare function describeRuns(reading: WallReading, state: BoardState): string[];
