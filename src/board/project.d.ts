// Type surface for project.js — the project record (R35).

import type { BoardCharacter, BoardNote, BoardState } from "./reducer";

export declare const PROJECT_VERSION: number;
export declare const DEFAULT_PROJECT_NAME: string;

export type BoardMeta = {
  id: string;
  name: string;
  /** The writer's words for why the name is not decided (R61), or empty; the name stands meanwhile. */
  nameOpen: string;
  createdAt: string;
  updatedAt: string;
};

/** A project: many boards under one premise. Board states live elsewhere, one per id. */
export type ProjectRecord = {
  version: number;
  id: string;
  name: string;
  /** The writer's words for why the project's name is not decided (R61's edge), or empty; the name stands meanwhile. */
  nameOpen: string;
  premise: string;
  /** The writer's words for why there is no premise yet (R61), or empty. */
  premiseOpen: string;
  /** The title page's byline — "Written by …" — on every script out (pass 1a, entry 50); empty claims nothing. */
  author: string;
  /** The title page's contact lines under the byline; empty is none. */
  contact: string;
  boards: BoardMeta[];
  activeBoardId: string;
  /** A writer's own structures, saved from a wall's beats (Roadmap 2, item 7). */
  structures?: OwnStructure[];
  /** The project's cast (R51): one roster every board draws from. Absent until liftCast has run. */
  characters?: BoardCharacter[];
  createdAt: string;
  updatedAt: string;
};

export type OwnStructure = { id: string; name: string; beats: Array<{ name: string; prompt: string; at: number }> };
export declare function structureBeats(
  notes: ReadonlyArray<BoardNote>,
  order: ReadonlyArray<string>,
): OwnStructure["beats"];
export declare function addStructure(
  project: ProjectRecord,
  name: string,
  beats: Array<{ name: string; prompt: string; at: number }>,
  now?: string,
): { project: ProjectRecord; structure: OwnStructure };
export declare function removeStructure(project: ProjectRecord, id: string, now?: string): ProjectRecord;

export declare function newBoardMeta(name: string, now?: string, nameOpen?: string): BoardMeta;
export declare function emptyProject(now?: string): ProjectRecord;
export declare function isProjectRecord(value: unknown): value is ProjectRecord;
export declare function normalizeProject(value: unknown, now?: string): ProjectRecord;
export declare function addBoard(
  project: ProjectRecord,
  name: string,
  now?: string,
  nameOpen?: string,
): { project: ProjectRecord; board: BoardMeta };
export declare function renameBoard(
  project: ProjectRecord,
  id: string,
  name: string,
  now?: string,
): ProjectRecord;
export declare function removeBoard(project: ProjectRecord, id: string, now?: string): ProjectRecord;
export declare function moveBoard(
  project: ProjectRecord,
  id: string,
  delta: number,
  now?: string,
): ProjectRecord;
export declare function setActiveBoard(project: ProjectRecord, id: string, now?: string): ProjectRecord;
export declare function renameProject(project: ProjectRecord, name: string, now?: string): ProjectRecord;
export declare function setPremise(project: ProjectRecord, premise: string, now?: string): ProjectRecord;
/** The title page's byline and contact; undefined leaves a field, "" clears it. */
export declare function setTitlePage(project: ProjectRecord, fields: { author?: string; contact?: string }, now?: string): ProjectRecord;
/** The writer's words for why there is no premise yet (R61); words clear the premise, "" takes them back. */
export declare function setPremiseOpen(project: ProjectRecord, words: string, now?: string): ProjectRecord;
/** The writer's words for why a board's name is not decided (R61); the name stands meanwhile. */
export declare function setBoardNameOpen(project: ProjectRecord, id: string, words: string, now?: string): ProjectRecord;
/** The writer's words for why the project's name is not decided (R61's edge); the name stands meanwhile. */
export declare function setProjectNameOpen(project: ProjectRecord, words: string, now?: string): ProjectRecord;
export declare function boardById(project: ProjectRecord, id: string): BoardMeta | null;
/** What a script going out is called: a named project is the title, its board beside it only when the project has several. */
export declare function scriptTitles(project: ProjectRecord, board: BoardMeta | null | undefined): { title: string; episode?: string; author?: string; contact?: string };
export declare function findBoard(project: ProjectRecord, key: string): BoardMeta | null;
export declare function reidentifyProject(
  project: ProjectRecord,
  now?: string,
): ProjectRecord & { renamed: Record<string, string> };

/** A board's state composed with the project's cast (R51). */
export declare function withRoster(state: BoardState, project: ProjectRecord): BoardState;
export declare function sameRoster(a: BoardCharacter[] | undefined, b: BoardCharacter[] | undefined): boolean;
export declare function liftCast(
  project: ProjectRecord,
  boards: Record<string, BoardState>,
  now?: string,
): { project: ProjectRecord; boards: Record<string, BoardState>; changed: boolean };
export type CastElsewhere = Record<string, Array<{ board: string; boardId: string; cards: number }>>;
export declare function castElsewhere(project: ProjectRecord, boards: Record<string, BoardState>, activeBoardId: string): CastElsewhere;

/** A fold on another board that lands here (R58): the fold's board, card and colour, and the paying-off card here (null while waiting). */
export type Landing = { id: string | null; fromBoardId: string; fromBoardName: string; fromNoteId: string; fromHeadline: string; fromColor: string };
export declare function landingsOn(project: ProjectRecord, boards: Record<string, BoardState>, boardId: string): { paid: Array<Landing & { id: string }>; waiting: Landing[] };
export declare function laterBoards(project: ProjectRecord, boards: Record<string, BoardState>): Record<string, { name: string; cards: number; noteIds: string[] }>;
export declare function mergeRoster(
  project: ProjectRecord,
  state: BoardState,
  now?: string,
): { project: ProjectRecord; state: BoardState };
