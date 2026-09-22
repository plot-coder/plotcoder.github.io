// Type surface for organize.js — Organize along the arrows (R34).

import type { BoardState, Pose } from "./reducer";

export declare const ROW_CARDS: number;
export declare const GAP: number;
/** A row is five cards wide on the wall, on any screen. */
export declare const ROW_WIDTH: number;

/**
 * The cards in story order: "follows" arrows first, reading order to break
 * ties and cycles. Restricted to `ids` when given.
 */
export declare function arrowOrder(state: BoardState, ids?: ReadonlyArray<string>): string[];

/**
 * Poses for Organize. With beats in scope, a row per beat with long runs
 * wrapped under themselves; otherwise rows wrapped by width. Groups travel as
 * blocks. A selection is laid out from its own top-left. A card set aside is
 * left alone unless the rows laid would run under it; then it is posed on a
 * row of its own beneath them, marked `aside`.
 */
export declare function organizePoses(
  state: BoardState,
  options?: { onlyIds?: ReadonlyArray<string> },
): Array<Pose & { aside?: boolean; unlinked?: boolean }>;
