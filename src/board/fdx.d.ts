import type { UndecidedPage } from "./undecided";
// Type surface for fdx.js — Final Draft in and out (R23, slices c3 and c4).

import type { BoardState } from "./reducer";
import type { FountainScene } from "./fountain";

export declare function toFdx(
  state: BoardState,
  options?: { /** The last page, "What is not decided" (R75). */ undecided?: UndecidedPage | null; title?: string; /** The writer's words for a title not decided (pass 1b, entry 40). */ titleOpen?: string; episode?: string; author?: string; draftDate?: string; /** The contact's lines under the date (pass 1a, entry 50). */ contact?: string },
): string;

export type SetAside = {
  scriptNotes: number;
  revisedParagraphs: number;
  lockedNumbers: number;
  pageBreaks: number;
  other: Record<string, number>;
};

export declare function fromFdx(xml: string): {
  titles: Record<string, string>;
  scenes: Array<FountainScene & { number: string | null }>;
  setAside: SetAside;
};

/** The receipt as one line; "" when nothing was set aside. */
export declare function describeSetAside(setAside: SetAside | undefined): string;
