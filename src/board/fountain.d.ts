// Type surface for fountain.js — Fountain out (R23, slice a).

import type { BoardNote, BoardState } from "./reducer";

export declare function sceneHeading(note: BoardNote): string;
/** A heading split back into its place and its when. */
export declare function splitHeading(heading: string): { place: string; when: string };
/** The mark every export sets before an unwritten scene's change line. */
export declare const UNWRITTEN_MARK: string;
export declare function standInFor(note: Pick<BoardNote, "change">): string;
export declare function unmark(text: string | null | undefined): { text: string; marked: boolean };

export declare function titlePage(titles: {
  title?: string;
  episode?: string;
  credit?: string;
  author?: string;
  draftDate?: string;
  notes?: string[];
}): string;

export type FountainOptions = {
  /** The board's name. */
  title?: string;
  /** The project's name, when the board is one of several. */
  episode?: string;
  premise?: string;
  author?: string;
  /** ISO date string; only the date is printed. */
  draftDate?: string;
};

export declare function toFountain(state: BoardState, options?: FountainOptions): string;

export type FountainScene = {
  /** The heading as written, without the forcing dot. */
  heading: string;
  forced: boolean;
  synopsis: string;
  section: string | null;
  notes: string[];
  /** The body under the heading: action, cues, dialogue. */
  text: string;
};

export declare function fromFountain(text: string): {
  titles: Record<string, string>;
  scenes: FountainScene[];
};

import type { Command } from "./reducer";
export declare function mergeFountain(
  state: BoardState,
  parsed: { scenes: FountainScene[] },
): { commands: Command[]; matched: Array<{ id: string; heading: string; created: boolean }> };
