// Type surface for walkthrough.js — the order of work for a scene's shots (R80).

import type { BoardState, BoardNote } from "./reducer";
import type { PlacePage } from "./places";

export type WalkFile = { id: string; kind: string; subject: string; name: string; note: string; url?: string | null };
export type WalkReference = { kind: "person" | "place"; key: string; name: string; prompt: string | null; fileName: string; shots: number; picture: WalkFile | null; outside: boolean; done: boolean };
export type WalkShot = { id: string; number: number; what: string; move: string; seconds: number | null; attach: WalkReference[]; waiting: WalkReference[]; prompt: string; fileName: string; still: WalkFile | null; stills: number };
export type WalkScene = { id: string; headline: string; number: number; of: number; shots: WalkShot[]; made: number };
export type Walkthrough = {
  look: { value: string; done: boolean };
  people: WalkReference[];
  places: WalkReference[];
  scenes: WalkScene[];
  counts: { people: { done: number; of: number }; places: { done: number; of: number }; shots: { done: number; of: number; waiting: number } };
  next: { scene: string; shot: string } | null;
  signedIn: boolean;
};

export declare function fileSlug(text: string): string;
export declare function referenceFileName(kind: "person" | "place", name: string): string;
export declare function shotFileName(scene: number, shot: number, id: string): string;
export declare function walkthrough(state: BoardState, options?: { look?: string; places?: PlacePage[]; outside?: string[]; files?: WalkFile[] | null; order?: BoardNote[] }): Walkthrough;
export declare function matchFile(name: string, walk: Walkthrough): { kind: "reference" | "shot"; key: string; name: string; scene?: string; shot?: string } | null;
