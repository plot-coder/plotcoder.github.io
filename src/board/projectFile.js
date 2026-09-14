// The project as a file (R12, R46): what Save project writes and Open project
// takes, as a pure module so the browser store and the MCP server read and
// write the same file. DOM-free.
//
// The file is `{ app, version, exportedAt, storage }`, where `storage` is the
// project's localStorage keys as they were: `plotcoder.project` for the record,
// `plotcoder.board.<id>` for each board's state, `plotcoder.reminders` for the
// reminders. Version 1 files (one board under the pre-R35 keys) still open.

import { emptyState, isBoardState, normalizeState } from "./reducer.js";
import { emptyProject, isProjectRecord, normalizeProject } from "./project.js";

export const PROJECT_APP = "plotcoder";
export const PROJECT_VERSION = 2;
export const PROJECT_PREFIX = "plotcoder.";
export const PROJECT_KEY = "plotcoder.project";
export const REMINDERS_KEY = "plotcoder.reminders";
export const boardKey = (id) => `plotcoder.board.${id}`;

const LEGACY = {
  logline: "plotcoder.logline",
  target: "plotcoder.target",
  characters: "plotcoder.characters",
  notes: "plotcoder.notes",
  groups: "plotcoder.groups",
  arrows: "plotcoder.arrows",
};

/** Is this the file Save project writes? Shape only; what the keys hold is read by fromProjectFile. */
export function isProjectFile(value) {
  if (!value || typeof value !== "object") return false;
  const file = value;
  return (
    file.app === PROJECT_APP &&
    typeof file.version === "number" &&
    typeof file.exportedAt === "string" &&
    !!file.storage &&
    typeof file.storage === "object" &&
    !Array.isArray(file.storage) &&
    Object.values(file.storage).every((item) => typeof item === "string")
  );
}

/** The file for a project: its record, each board it names, and the reminders when there are any. */
export function toProjectFile({ project, boards, reminders = null, exportedAt = new Date().toISOString() }) {
  const record = normalizeProject(project);
  const storage = { [PROJECT_KEY]: JSON.stringify(record) };
  for (const meta of record.boards) {
    const state = boards[meta.id];
    storage[boardKey(meta.id)] = JSON.stringify(isBoardState(state) ? normalizeState(state) : emptyState());
  }
  if (Array.isArray(reminders) && reminders.length) storage[REMINDERS_KEY] = JSON.stringify(reminders);
  return { app: PROJECT_APP, version: PROJECT_VERSION, exportedAt, storage };
}

/**
 * What a file holds: the record and its boards, both through the normalizers,
 * and the reminders. A version 1 file becomes a one-board project. Null when
 * the file is not a project file, or holds neither a record nor a board.
 */
export function fromProjectFile(value) {
  if (!isProjectFile(value)) return null;
  const parse = (key) => {
    if (typeof value.storage[key] !== "string") return undefined;
    try {
      return JSON.parse(value.storage[key]);
    } catch {
      return undefined;
    }
  };
  const remindersRaw = parse(REMINDERS_KEY);
  const reminders = Array.isArray(remindersRaw) ? remindersRaw : null;
  const record = parse(PROJECT_KEY);
  if (isProjectRecord(record)) {
    const project = normalizeProject(record);
    const boards = {};
    for (const meta of project.boards) {
      const state = parse(boardKey(meta.id));
      boards[meta.id] = isBoardState(state) ? normalizeState(state) : emptyState();
    }
    return { project, boards, reminders };
  }
  // Version 1: one board under its own keys, with no record around it.
  const notes = parse(LEGACY.notes);
  if (!Array.isArray(notes)) return null;
  const legacy = {
    notes,
    groups: parse(LEGACY.groups) ?? [],
    arrows: parse(LEGACY.arrows) ?? [],
    characters: parse(LEGACY.characters) ?? [],
    logline: typeof value.storage[LEGACY.logline] === "string" ? value.storage[LEGACY.logline] : "",
    targetEighths: parse(LEGACY.target),
  };
  if (!isBoardState(legacy)) return null;
  const project = emptyProject();
  return { project, boards: { [project.activeBoardId]: normalizeState(legacy) }, reminders };
}
