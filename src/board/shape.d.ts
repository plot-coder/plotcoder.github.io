import type { BoardState } from "./reducer";
/** How many of the film's cards the wall's rows read out of the story's order. */
export declare function outOfOrder(state: BoardState): number;
/** Clauses for a write's tail: the runs that changed, a moved ending, cards now out of order on the wall. Empty when none did. */
export declare function shapeNote(before: BoardState, after: BoardState, options?: { added?: string | null }): string[];
