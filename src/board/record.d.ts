// Type surface for record.js — the record of a session (R76).

import type { BoardState, RecordEntry } from "./reducer";

export declare const RECORD_CAP: number;
/** What changed between two walls, in the person's terms, and the ids the lines name. */
export declare function describeChange(before: BoardState, after: BoardState): { lines: string[]; ids: string[] };
/** The wall with one more change on its record; the same lines from the same hand within five minutes are one change; the last fifty kept. */
export declare function withRecord(state: BoardState, entry: { at?: string; by?: string; lines: string[]; ids?: string[] }): BoardState;
/** A session of the record: one hand, no gap over half an hour. */
export type RecordSession = { by: string; from: string; to: string; count: number; lines: Array<{ line: string; ids: string[] }>; more: number; ids: string[] };
/** The record told as sessions, newest first; `since` keeps the sessions that ended after it. */
export declare function describeRecord(state: Pick<BoardState, "record">, options?: { since?: string; limit?: number }): RecordSession[];
/** "today 21:30 to 22:27", or the date when it is not today. */
export declare function spanWords(from: string, to: string, now?: string): string;
