// Type surface for find.js — a card found across every board (R77 c).

import type { BoardState } from "./reducer";
import type { BoardMeta } from "./project";

export type Found = { boardId: string; boardName: string; id: string; headline: string; change: string; where: "id" | "headline" | "change" | "page"; line: string; inStory: boolean };
/** Every card whose id, headline, change line or page holds the phrase, board by board in story order. */
export declare function findCards(boards: Array<{ meta: BoardMeta; state: BoardState }>, phrase: string): Found[];
