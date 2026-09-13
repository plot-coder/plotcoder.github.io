// Type surface for project.js — the project record (R35).

export declare const PROJECT_VERSION: number;
export declare const DEFAULT_PROJECT_NAME: string;

export type BoardMeta = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

/** A project: many boards under one premise. Board states live elsewhere, one per id. */
export type ProjectRecord = {
  version: number;
  id: string;
  name: string;
  premise: string;
  boards: BoardMeta[];
  activeBoardId: string;
  /** A writer's own structures, saved from a wall's beats (Roadmap 2, item 7). */
  structures?: OwnStructure[];
  createdAt: string;
  updatedAt: string;
};

export type OwnStructure = { id: string; name: string; beats: Array<{ name: string; prompt: string; at: number }> };
export declare function addStructure(
  project: ProjectRecord,
  name: string,
  beats: Array<{ name: string; prompt: string; at: number }>,
  now?: string,
): { project: ProjectRecord; structure: OwnStructure };
export declare function removeStructure(project: ProjectRecord, id: string, now?: string): ProjectRecord;

export declare function newBoardMeta(name: string, now?: string): BoardMeta;
export declare function emptyProject(now?: string): ProjectRecord;
export declare function isProjectRecord(value: unknown): value is ProjectRecord;
export declare function normalizeProject(value: unknown, now?: string): ProjectRecord;
export declare function addBoard(
  project: ProjectRecord,
  name: string,
  now?: string,
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
export declare function boardById(project: ProjectRecord, id: string): BoardMeta | null;
export declare function findBoard(project: ProjectRecord, key: string): BoardMeta | null;
export declare function reidentifyProject(
  project: ProjectRecord,
  now?: string,
): ProjectRecord & { renamed: Record<string, string> };
