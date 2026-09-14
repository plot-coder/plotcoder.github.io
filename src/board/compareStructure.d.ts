// Type surface for compareStructure.js — a structure beside the wall (R52).

import type { BoardState } from "./reducer";

export declare const MATCH_PAGES: number;
export declare const NEAR_PAGES: number;

export type ComparedBeat = {
  name: string;
  at: number;
  /** The page the structure's beat falls near on this board's target. */
  page: number;
  /** The wall's beat that answers it, or null. */
  match: { id: string; headline: string; page: number } | null;
  /** Pages the wall's beat is off by: negative is early. Null with no match. */
  drift: number | null;
  /** No match, and the page is past the story so far. */
  beyond: boolean;
};

export type StructureComparison = {
  rows: ComparedBeat[];
  /** The wall's beats no beat of the structure took. */
  unmatched: Array<{ id: string; headline: string; page: number }>;
  /** Pages on the wall so far. */
  soFar: number;
  targetEighths: number;
};

export declare function compareStructure(state: BoardState, beats: ReadonlyArray<{ name: string; at: number }>): StructureComparison;
export declare function driftWord(drift: number | null | undefined): string | null;
export declare function describeComparison(comparison: StructureComparison): string[];
