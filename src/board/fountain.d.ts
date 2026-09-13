// Type surface for fountain.js — Fountain out (R23, slice a).

import type { BoardNote, BoardState } from "./reducer";

export declare function sceneHeading(note: BoardNote): string;

export declare function titlePage(titles: {
  title?: string;
  credit?: string;
  author?: string;
  draftDate?: string;
  notes?: string[];
}): string;

export type FountainOptions = {
  /** The board's name. */
  title?: string;
  /** The project's name, when the board is one of several. */
  project?: string;
  premise?: string;
  author?: string;
  /** ISO date string; only the date is printed. */
  draftDate?: string;
};

export declare function toFountain(state: BoardState, options?: FountainOptions): string;
