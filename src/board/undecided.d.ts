// Type surface for undecided.js — what a script carries of the wall's opens (R75).

import type { BoardNote, BoardState } from "./reducer";

/** The last page of a script: what is not decided, in the writer's words, in the reading's order. */
export type UndecidedPage = {
  /** The day it goes out, YYYY-MM-DD, or "". */
  date: string;
  /** About the film: the project's open fields, the open lines, the logline, the target. */
  film: string[];
  /** About the people: each person's open words. */
  people: string[];
  /** Scene by scene, numbered as the script is: each card's opens and whether it is held two ways. */
  scenes: string[];
  /** Not in the film: a card set aside or a version behind, with what is open on it. */
  outside: string[];
};

/** "Declan Doyle? Priya Nair? — not decided whether they are here." for a card holding maybes; "" otherwise. */
export declare function maybeLine(note: Pick<BoardNote, "maybeCharacterIds">, state: Pick<BoardState, "characters">): string;
/** The last page, or null when nothing on the wall is open, held two ways or set aside. */
export declare function undecidedPage(state: BoardState, extras?: { project?: Array<{ label: string; words: string }>; date?: string }): UndecidedPage | null;
/** The page as plain lines: a head, then each part under its label. */
export declare function undecidedLines(page: UndecidedPage | null): string[];
