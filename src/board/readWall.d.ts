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
  /** A group runs too long to be one sequence. */
  | "sequence"
  /** A character in the roster who is on no card. */
  | "uncast"
  /** A character gone for more than a third of the story between two appearances. */
  | "absent"
  /** A setup arrow whose payoff comes before its setup on the wall. */
  | "backwards"
  /** A card with a folded corner and no setup arrow leaving it. */
  | "unpaid";

export type Finding = {
  kind: FindingKind;
  /** Card ids; a group id for "sequence"; a character id (then card ids) for "uncast" and "absent"; an arrow id (then card ids) for "backwards". Empty for "unmarked". */
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
export type Setup = { id: string; from: string; to: string; eighths: number };

export type WallReading = {
  /** Every card id in reading order. */
  order: string[];
  beats: Array<{ id: string; headline: string }>;
  runs: Run[];
  setups: Setup[];
  /** Every planted card: the scene that pays it off (first setup arrow, by wall order), or null while unpaid. */
  payoffs: Record<string, string | null>;
  findings: Finding[];
};

/** Rows top to bottom, cards left to right within a row. */
export declare function readingOrder(notes: BoardNote[]): BoardNote[];
export declare function readWall(state: BoardState): WallReading;
export declare function describeRuns(reading: WallReading, state: BoardState): string[];
export declare function describeSetups(reading: WallReading, state: BoardState): string[];
