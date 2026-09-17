// Organize along the arrows (R34).
//
// Organize was written before an arrow existed and tidied by reading order,
// which left the arrows pointing every way across a neat grid. Now reading
// order is the base and each "follows" arrow pulls its source in front of its
// target, so a card is never placed before something that points at it and a
// wall with no arrows keeps its order. A two-way pair is a tie on purpose.
// Setups are not sequence and do not order anything.
//
// Two layouts, one Organize: with beats on the wall, each beat starts a row and
// the scenes that follow it fill the row to its right, wrapping under
// themselves when a run is long; with no beats yet, rows wrap by width. Groups
// travel as blocks to where their first card falls. A row is five cards wide
// on the wall, on any screen (open question 21, closed).
//
// Pure and DOM-free like the kernel: the app and the MCP server both call it,
// and it returns poses for apply_poses rather than touching anything.

import { readingOrder, storyOrder } from "./readWall.js";
import { NOTE_HEIGHT, NOTE_WIDTH } from "./reducer.js";

export const ROW_CARDS = 5;
export const GAP = 28;
export const ROW_WIDTH = ROW_CARDS * NOTE_WIDTH + (ROW_CARDS - 1) * GAP;
const ORIGIN_X = 88;
const ORIGIN_Y = 110;
const STEP_X = NOTE_WIDTH + GAP;
const STEP_Y = NOTE_HEIGHT + GAP;

/**
 * The cards in story order. Reading order — the same rows-then-left-to-right
 * order read the wall uses — is the base; each "follows" arrow pulls its
 * source in front of its target. So a wall with no arrows keeps its order, and
 * an arrow moves only what it has to. A two-way pair is a tie and reading
 * order keeps it; a longer cycle is cut where reading order says. Only the ids
 * given (or every card) take part; arrows to cards outside are ignored.
 */
export function arrowOrder(state, ids) {
  // One story order for the whole app: the reading's (R56).
  return storyOrder(state, ids).map((note) => note.id);
}

/** Pull each group's members up to its first member, keeping their order. */
function keepGroupsTogether(order, groups) {
  const groupOf = new Map();
  groups.forEach((group, index) => group.noteIds.forEach((id) => groupOf.set(id, index)));
  const placed = new Set();
  const result = [];
  for (const id of order) {
    if (placed.has(id)) continue;
    const group = groupOf.get(id);
    if (group === undefined) {
      result.push(id);
      placed.add(id);
      continue;
    }
    for (const member of order) {
      if (groupOf.get(member) === group && !placed.has(member)) {
        result.push(member);
        placed.add(member);
      }
    }
  }
  return result;
}

function wrapRows(order, originX, originY) {
  const poses = [];
  let x = originX;
  let y = originY;
  for (const id of order) {
    if (x > originX && x + NOTE_WIDTH > originX + ROW_WIDTH) {
      x = originX;
      y += STEP_Y;
    }
    poses.push({ id, x, y, rotate: 0 });
    x += STEP_X;
  }
  return poses;
}

function beatRows(order, byId, originX, originY) {
  const poses = [];
  let x = originX;
  let y = originY - STEP_Y;
  let started = false;
  for (const id of order) {
    const note = byId.get(id);
    if (note.rank === "beat" || !started) {
      // A beat owns the left edge of its row; the opening scenes get a row too.
      y += STEP_Y;
      x = originX;
      started = true;
    } else if (x + NOTE_WIDTH > originX + ROW_WIDTH) {
      // A long run wraps under itself, indented one card, never under the beat.
      y += STEP_Y;
      x = originX + STEP_X;
    }
    poses.push({ id, x, y, rotate: 0 });
    x += STEP_X;
  }
  return poses;
}

/**
 * Poses for Organize: every card, or only `onlyIds` when a selection is being
 * tidied, in which case the layout starts where the selection's top-left is.
 */
export function organizePoses(state, options = {}) {
  const wanted = options.onlyIds ? new Set(options.onlyIds) : null;
  const scope = state.notes.filter((note) => !wanted || wanted.has(note.id));
  if (scope.length === 0) return [];
  const byId = new Map(scope.map((note) => [note.id, note]));
  const scopeIds = new Set(byId.keys());
  const groups = state.groups
    .map((group) => ({ ...group, noteIds: group.noteIds.filter((id) => scopeIds.has(id)) }))
    .filter((group) => group.noteIds.length >= 2);

  const order = keepGroupsTogether(arrowOrder(state, [...scopeIds]), groups);
  const originX = wanted ? Math.min(...scope.map((note) => note.x)) : ORIGIN_X;
  const originY = wanted ? Math.min(...scope.map((note) => note.y)) : ORIGIN_Y;
  const hasBeats = scope.some((note) => note.rank === "beat");
  return hasBeats ? beatRows(order, byId, originX, originY) : wrapRows(order, originX, originY);
}
