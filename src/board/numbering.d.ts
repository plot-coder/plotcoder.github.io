// Type surface for numbering.js — locked scene numbers and revision marks (Roadmap 2, item 8).

import type { BoardNote, BoardState } from "./reducer";

export type Lock = { at: string; numbers: Record<string, string> };
export type Snapshot = { headline: string; change: string; location: string; text: string };
export type Revision = { name: string; color: string; since: string; snapshot: Record<string, Snapshot> };

export declare function sceneNumbers(order: ReadonlyArray<Pick<BoardNote, "id">>, lock: Lock | null | undefined): Map<string, string>;
export declare function lockFrom(order: ReadonlyArray<Pick<BoardNote, "id">>, existing: Lock | null | undefined, at: string): Lock;
export declare function revisedLines(text: string | undefined, snapshotText: string | null | undefined): number[];
export declare function isRevised(note: BoardNote, snapshot: Snapshot | undefined): boolean;
export declare const REVISION_COLORS: readonly string[];

/** The industry's revision colours as Final Draft writes them. */
export declare const REVISION_HEX: Record<string, string>;
/** Card id → whether it changed since the revision's snapshot, and which source lines of its text did. Empty when no revision. */
export declare function revisionMarks(state: BoardState): Map<string, { revised: boolean; lines: Set<number> }>;
/** "Blue revision · 2026-09-17", or "" when none. */
export declare function revisionLine(state: BoardState): string;
