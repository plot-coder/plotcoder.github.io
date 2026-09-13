// Type surface for sync.js — the sync decisions (R4).

import type { BoardMeta, ProjectRecord } from "./project";

export declare function conflictName(name: string, device: string, when: Date): string;

export type SignInPlan = {
  /** The project this device should adopt, or null to keep its own. */
  adopt: ProjectRecord | null;
  /** The project record to push, or null. */
  pushProject: ProjectRecord | null;
  /** Board ids whose state this device should push. */
  pushBoards: string[];
  /** Boards carried over and renamed so it is plain where they came from. */
  renamed: string[];
};

export declare function reconcileOnSignIn(input: {
  local: { project: ProjectRecord };
  remote: { project: ProjectRecord | null };
  isSeed: boolean;
  device: string;
  now: Date;
}): SignInPlan;

export declare function mergeProjects(
  remote: ProjectRecord,
  local: ProjectRecord,
  now: Date,
  carry?: (board: BoardMeta) => BoardMeta,
): ProjectRecord;

export declare function resolveBoardConflict(input: {
  project: ProjectRecord;
  boardId: string;
  device: string;
  now: Date;
}): { project: ProjectRecord; copy: BoardMeta } | null;

export declare function deviceName(userAgent: string | undefined): string;

export type PushOutcome = "insert" | "update" | "conflict";
export declare function pushOutcome(input: { remoteRev: number | null | undefined; seenRev: number }): PushOutcome;

export type OpenOutcome = "nothing" | "push" | "adopt" | "conflict";
export declare function openOutcome(input: {
  remoteRev: number | null | undefined;
  seenRev: number;
  dirty: boolean;
}): OpenOutcome;

export declare function planSignIn(input: {
  isSeed: boolean;
  localProjectId: string;
  remoteProjectIds: string[];
}): { pushLocalAsNew: boolean; open: string | null; pick: boolean };

export declare function liveOutcome(input: {
  remoteRev: number;
  seenRev: number;
  dirty: boolean;
}): "nothing" | "adopt" | "conflict";
