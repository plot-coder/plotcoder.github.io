// Type surface for stretch.js — a stretch of the film, selected (R77 a).

import type { BoardState, Note } from "./reducer";

export type Selection = { scene?: string; from?: string; to?: string; group?: string };
export type Stretch = { cards: Note[]; whole: boolean; words: string; error?: undefined } | { error: string; cards?: undefined; whole?: undefined; words?: undefined };
/** The cards a selection names, in story order, or an error in the reply's words. */
export declare function selectStretch(state: BoardState, selection?: Selection): Stretch;
/** The board narrowed to those cards, the arrows between them and the groups' parts that fall in it. */
export declare function stretchState(state: BoardState, cards: Note[]): BoardState;
