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
import { NOTE_HEIGHT, NOTE_WIDTH, unlinkedCards } from "./reducer.js";

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

  // A card on no follows arrow, once the film has them, is not laid in the rows: the rows are the order, and it
  // has no place in it yet (round twenty-four, entry 21). It stays where it is, or goes beneath when the rows
  // would run under it, like a card set aside.
  const unlinked = new Set(unlinkedCards(state).map((note) => note.id));
  const order = keepGroupsTogether(arrowOrder(state, [...scopeIds]), groups).filter((id) => !unlinked.has(id));
  const originX = wanted ? Math.min(...scope.map((note) => note.x)) : ORIGIN_X;
  const originY = wanted ? Math.min(...scope.map((note) => note.y)) : ORIGIN_Y;
  const hasBeats = scope.some((note) => note.rank === "beat");
  const laid = hasBeats ? beatRows(order, byId, originX, originY) : wrapRows(order, originX, originY);
  return [...laid, ...clearAside(state, laid, originX)];
}

/**
 * A card set aside is not in the film and the tidy leaves it where the writer
 * put it — unless the rows just laid would run under it. Then nobody put it
 * there: a card the app placed "after the last card" and the writer later cut
 * sits inside the story (round twenty-three, entry 22). Those, and only those,
 * go to a row of their own under the lowest laid card, left to right. Marked
 * `aside` so a reply can name them.
 */
function clearAside(state, laid, originX) {
  if (laid.length === 0) return [];
  const laidIds = new Set(laid.map((pose) => pose.id));
  const covers = (card, pose) => Math.abs(card.x - pose.x) < NOTE_WIDTH && Math.abs(card.y - pose.y) < NOTE_HEIGHT;
  const unlinked = new Set(unlinkedCards(state).map((note) => note.id));
  const inTheWay = state.notes.filter((note) => (note.aside === true || unlinked.has(note.id)) && !laidIds.has(note.id) && laid.some((pose) => covers(note, pose)));
  if (inTheWay.length === 0) return [];
  // Under everything the wall draws once the rows are laid, other cards set aside included.
  const others = state.notes.filter((note) => !note.alternativeOf && !laidIds.has(note.id) && !inTheWay.includes(note));
  const floor = Math.max(...laid.map((pose) => pose.y), ...others.map((note) => note.y));
  return inTheWay.map((note, index) => ({ id: note.id, x: originX + index * STEP_X, y: floor + STEP_Y + GAP, rotate: note.rotate ?? 0, aside: note.aside === true, unlinked: unlinked.has(note.id) }));
}
