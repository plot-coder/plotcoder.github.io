// Type surface for shots.js — a scene's shots (R80).

import type { BoardState, BoardNote as Note } from "./reducer";
import type { PlacePage } from "./places";

export type Shot = { id: string; what: string; move: string; seconds: number | null };
export type PlacedShot = Shot & { line: number; covers: string };
export type SceneShots = { id: string; headline: string; written: boolean; shots: PlacedShot[]; seconds: number; unsaid: number; sceneSeconds: number; uncovered: boolean };
export type ShotBriefOptions = { look?: string; places?: PlacePage[]; title?: string; order?: { id: string }[]; frame?: string; pictures?: Record<string, string>; attached?: string[] };

export declare function shotSubject(id: string): string;
export declare function parseShotLine(line: string): Shot | null;
export declare function shotLine(shot: Shot): string;
export declare function newShotId(taken?: Iterable<string>, random?: () => number): string;
export declare function shotsOfText(text: string): { shots: PlacedShot[]; before: string };
export declare function shotIds(...states: (BoardState | null | undefined)[]): string[];
export declare function findShot(state: BoardState, id: string): { note: Note; shot: PlacedShot; number: number; of: number } | null;
export declare function placeShots(
  text: string,
  shots: { what: string; at?: string; move?: string; seconds?: number; id?: string }[],
  options?: { replace?: boolean; taken?: Iterable<string>; random?: () => number },
): { text: string; placed: Shot[]; missing: { what: string; at: string }[] };
export declare function rewriteShot(text: string, id: string, patch?: { what?: string; move?: string; seconds?: number | null; remove?: boolean }): { text: string; was: Shot | null; now: Shot | null };
export declare function carryShots(oldText: string, newText: string): { text: string; carried: { id: string; placed: boolean }[] };
export declare function describeShots(state: BoardState, order?: Note[] | null): SceneShots[];
export declare function shotBrief(state: BoardState, id: string, options?: ShotBriefOptions): string | null;
export declare function shotPrompt(state: BoardState, id: string, options?: ShotBriefOptions): string;
export type ShotReference = { kind: "person" | "place"; key: string; name: string; prompt: string | null };
export declare function shotReferences(state: BoardState, cards: Note[], options?: { look?: string; places?: PlacePage[] }): ShotReference[];
export declare function shotPeople(state: BoardState, note: Note, shot: { what: string }): BoardState["characters"];
