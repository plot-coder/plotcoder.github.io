// Type surface for numbering.js — locked scene numbers and revision marks (Roadmap 2, item 8).

import type { BoardNote } from "./reducer";

export type Lock = { at: string; numbers: Record<string, string> };
export type Snapshot = { headline: string; change: string; location: string; text: string };
export type Revision = { name: string; color: string; since: string; snapshot: Record<string, Snapshot> };

export declare function sceneNumbers(order: ReadonlyArray<Pick<BoardNote, "id">>, lock: Lock | null | undefined): Map<string, string>;
export declare function lockFrom(order: ReadonlyArray<Pick<BoardNote, "id">>, existing: Lock | null | undefined, at: string): Lock;
export declare function revisedLines(text: string | undefined, snapshotText: string | null | undefined): number[];
export declare function isRevised(note: BoardNote, snapshot: Snapshot | undefined): boolean;
export declare const REVISION_COLORS: readonly string[];
