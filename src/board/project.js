// The project record (R35).
//
// A project holds many boards: a writer's several stories, or a season's
// episodes, with the premise (D17) above them. This is the record — name,
// premise, an ordered list of boards, which one is open — and the pure
// operations on it. Board states themselves are BoardState records kept
// separately, one per board id; this module never touches them.
//
// Plain ESM with a sibling .d.ts, like the kernel, so the browser store and the
// MCP server share one idea of what a project is. Keep it free of `window`.

import { newId, nowIso } from "./reducer.js";

export const PROJECT_VERSION = 2;
export const DEFAULT_PROJECT_NAME = "Untitled project";

function trimmed(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function newBoardMeta(name, now = nowIso()) {
  return { id: newId(), name: trimmed(name, "Board"), createdAt: now, updatedAt: now };
}

export function emptyProject(now = nowIso()) {
  const board = newBoardMeta("Board 1", now);
  return {
    version: PROJECT_VERSION,
    id: newId(),
    name: DEFAULT_PROJECT_NAME,
    premise: "",
    boards: [board],
    activeBoardId: board.id,
    createdAt: now,
    updatedAt: now,
  };
}

function isBoardMeta(value) {
  return Boolean(value) && typeof value.id === "string" && typeof value.name === "string";
}

/** True for a record this module wrote (any version): boards and an id. */
export function isProjectRecord(value) {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    Array.isArray(value.boards)
  );
}

/**
 * Repair a record to the current shape: a name, a premise, at least one board
 * with an id and a name, and an open board that exists. Anything else is left
 * as it was, so a field added later survives a load through an older build.
 */
export function normalizeProject(value, now = nowIso()) {
  if (!isProjectRecord(value)) return emptyProject(now);
  const boards = value.boards.filter(isBoardMeta).map((board) => ({
    ...board,
    name: trimmed(board.name, "Board"),
    createdAt: typeof board.createdAt === "string" ? board.createdAt : now,
    updatedAt: typeof board.updatedAt === "string" ? board.updatedAt : now,
  }));
  if (boards.length === 0) boards.push(newBoardMeta("Board 1", now));
  const activeBoardId = boards.some((board) => board.id === value.activeBoardId)
    ? value.activeBoardId
    : boards[0].id;
  return {
    ...value,
    version: PROJECT_VERSION,
    name: trimmed(value.name, DEFAULT_PROJECT_NAME),
    premise: typeof value.premise === "string" ? value.premise.trim() : "",
    boards,
    activeBoardId,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}

function touch(project, patch, now) {
  return { ...project, ...patch, updatedAt: now };
}

/** Add a board after the others and open it. Returns the project and the new board. */
export function addBoard(project, name, now = nowIso()) {
  const fallback = `Board ${project.boards.length + 1}`;
  const board = newBoardMeta(trimmed(name, fallback), now);
  return {
    project: touch(project, { boards: [...project.boards, board], activeBoardId: board.id }, now),
    board,
  };
}

export function renameBoard(project, id, name, now = nowIso()) {
  const next = trimmed(name, "");
  if (!next) return project;
  let changed = false;
  const boards = project.boards.map((board) => {
    if (board.id !== id || board.name === next) return board;
    changed = true;
    return { ...board, name: next, updatedAt: now };
  });
  return changed ? touch(project, { boards }, now) : project;
}

/**
 * Remove a board. The last board cannot go — a project always has a wall. If
 * the open board goes, the one before it (or the first) opens.
 */
export function removeBoard(project, id, now = nowIso()) {
  const index = project.boards.findIndex((board) => board.id === id);
  if (index === -1 || project.boards.length <= 1) return project;
  const boards = project.boards.filter((board) => board.id !== id);
  const activeBoardId =
    project.activeBoardId === id ? boards[Math.max(0, index - 1)].id : project.activeBoardId;
  return touch(project, { boards, activeBoardId }, now);
}

/** Move a board up (-1) or down (+1) the order. Off the ends is a no-op. */
export function moveBoard(project, id, delta, now = nowIso()) {
  const index = project.boards.findIndex((board) => board.id === id);
  const target = index + delta;
  if (index === -1 || target < 0 || target >= project.boards.length || delta === 0) return project;
  const boards = [...project.boards];
  const [board] = boards.splice(index, 1);
  boards.splice(target, 0, board);
  return touch(project, { boards }, now);
}

export function setActiveBoard(project, id, now = nowIso()) {
  if (project.activeBoardId === id || !project.boards.some((board) => board.id === id)) {
    return project;
  }
  return touch(project, { activeBoardId: id }, now);
}

export function renameProject(project, name, now = nowIso()) {
  const next = trimmed(name, "");
  if (!next || next === project.name) return project;
  return touch(project, { name: next }, now);
}

export function setPremise(project, premise, now = nowIso()) {
  const next = typeof premise === "string" ? premise.trim() : "";
  if (next === project.premise) return project;
  return touch(project, { premise: next }, now);
}

export function boardById(project, id) {
  return project.boards.find((board) => board.id === id) ?? null;
}

/** Find a board by id, or by name (case-insensitive), or by its 1-based number. */
export function findBoard(project, key) {
  const wanted = String(key ?? "").trim();
  if (!wanted) return null;
  const byId = boardById(project, wanted);
  if (byId) return byId;
  const lower = wanted.toLowerCase();
  const byName = project.boards.find((board) => board.name.trim().toLowerCase() === lower);
  if (byName) return byName;
  const number = Number(wanted);
  if (Number.isInteger(number) && number >= 1 && number <= project.boards.length) {
    return project.boards[number - 1];
  }
  return null;
}
