// Type surface for fdx.js — Final Draft in and out (R23, slices c3 and c4).

import type { BoardState } from "./reducer";
import type { FountainScene } from "./fountain";

export declare function toFdx(
  state: BoardState,
  options?: { title?: string; project?: string; author?: string; draftDate?: string },
): string;

export declare function fromFdx(xml: string): {
  titles: Record<string, string>;
  scenes: Array<FountainScene & { number: string | null }>;
};
