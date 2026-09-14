// Type surface for projectFile.js — the project as a file (R12, R46).

import type { BoardState } from "./reducer";
import type { ProjectRecord } from "./project";

export declare const PROJECT_APP: "plotcoder";
export declare const PROJECT_VERSION: number;
export declare const PROJECT_PREFIX: string;
export declare const PROJECT_KEY: string;
export declare const REMINDERS_KEY: string;
export declare const boardKey: (id: string) => string;

export type ProjectFile = {
  app: "plotcoder";
  version: number;
  exportedAt: string;
  storage: Record<string, string>;
};

export type OpenedProject = {
  project: ProjectRecord;
  boards: Record<string, BoardState>;
  reminders: unknown[] | null;
};

export declare function isProjectFile(value: unknown): value is ProjectFile;
export declare function toProjectFile(input: {
  project: ProjectRecord;
  boards: Record<string, BoardState>;
  reminders?: unknown[] | null;
  exportedAt?: string;
}): ProjectFile;
export declare function fromProjectFile(value: unknown): OpenedProject | null;
