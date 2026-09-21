// What a change did to the story's shape (round twenty-three, entries 30, 31,
// 50, 52, 72).
//
// A reorder, a cut, a delete or a choice of version changes the runs between
// the turns, can move the ending, and can leave the wall's rows reading in an
// order the arrows no longer say. The replies reported arrows and the runtime,
// and an agent ran a whole reading to learn the rest. Pure: two board states
// in, sentences out, and nothing when nothing of the kind changed.

import { formatPages, inStory, readingOrder, storyOrder } from "./reducer.js";
import { readWall } from "./readWall.js";

const quote = (state, id) => `"${state.notes.find((note) => note.id === id)?.headline ?? id}"`;

/** A run's name: between which turns it lies. */
function runName(state, run) {
  if (run.from === null) return `before ${quote(state, run.to)}`;
  if (run.to === null) return `after ${quote(state, run.from)}`;
  return `from ${quote(state, run.from)} to ${quote(state, run.to)}`;
}

const runKey = (run) => `${run.from ?? ""}>${run.to ?? ""}`;
const runSize = (run) => `${run.cards} card${run.cards === 1 ? "" : "s"}, about ${formatPages(run.eighths)} page${formatPages(run.eighths) === "1" ? "" : "s"}`;

/** How many of the film's cards the wall's rows read out of the story's order: the fewest that would have to move for the rows to agree with the arrows. */
export function outOfOrder(state) {
  const story = storyOrder(state).map((note) => note.id);
  const place = new Map(story.map((id, index) => [id, index]));
  const rows = readingOrder(state.notes.filter((note) => inStory(note))).map((note) => place.get(note.id)).filter((index) => index !== undefined);
  // The longest run of cards the rows already have in story order; the rest are out of it.
  const tails = [];
  for (const index of rows) {
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (tails[mid] < index) low = mid + 1;
      else high = mid;
    }
    tails[low] = index;
  }
  return rows.length - tails.length;
}

/**
 * Clauses for the tail of a write's reply — no capital, no full stop, since the
 * reply they ride on ends the sentence: the runs that changed, the ending when
 * it moved, and the cards now out of order on the wall when that number grew.
 * An empty list when the change touched none of them. `added` is a card the
 * write itself made: appending a card moves the ending by definition, and that
 * is not news.
 */
export function shapeNote(before, after, { added = null } = {}) {
  const lines = [];
  const was = readWall(before);
  const now = readWall(after);
  if (now.beats.length > 0 || was.beats.length > 0) {
    const old = new Map(was.runs.map((run) => [runKey(run), run]));
    const changed = [];
    for (const run of now.runs) {
      const prior = old.get(runKey(run));
      old.delete(runKey(run));
      if (run.cards === 0) {
        // Two turns back to back: said in words, and only when something ran between them before.
        if (prior && prior.cards > 0) changed.push(`nothing runs ${runName(after, run)} now (was ${runSize(prior)})`);
      } else if (!prior) changed.push(`the run ${runName(after, run)} is ${runSize(run)}`);
      else if (prior.cards !== run.cards || prior.eighths !== run.eighths) changed.push(`the run ${runName(after, run)} is now ${runSize(run)} (was ${runSize(prior)})`);
    }
    // A run that is gone with both its turns still standing: nothing runs between them now.
    for (const run of old.values()) {
      if (run.from !== null && run.to !== null && now.beats.includes(run.from) && now.beats.includes(run.to) && now.order.indexOf(run.to) === now.order.indexOf(run.from) + 1) changed.push(`nothing runs ${runName(after, run)} now`);
    }
    if (changed.length) lines.push(`the runs between the turns — ${changed.slice(0, 4).join(", ")}${changed.length > 4 ? `, and ${changed.length - 4} more (read_wall has them all)` : ""}`);
  }
  const lastWas = was.order[was.order.length - 1] ?? null;
  const lastNow = now.order[now.order.length - 1] ?? null;
  // A card the write itself made and appended moves the ending by definition: not news.
  const madeNow = lastNow && !before.notes.some((note) => note.id === lastNow);
  if (lastNow && lastWas && lastNow !== lastWas && lastNow !== added && !madeNow) lines.push(`the last card of the story is now ${quote(after, lastNow)}${after.notes.some((note) => note.id === lastWas) ? ` (it was ${quote(before, lastWas)})` : ""}`);
  // A version behind a card that changed its place in the order goes with it: the wall draws it behind its sibling
  // wherever that is. Nothing is wrong, and nothing said it (round twenty-three, entry 31).
  const placeWas = new Map(was.order.map((id, index) => [id, index]));
  const moved = new Set(now.order.filter((id, index) => placeWas.has(id) && placeWas.get(id) !== index));
  const carried = after.notes.filter((note) => note.alternativeOf && moved.has(note.alternativeOf));
  if (carried.length) lines.push(`${carried.map((note) => `the version behind ${quote(after, note.alternativeOf)} went with it`).join(", ")}`);
  const astray = outOfOrder(after);
  if (astray > outOfOrder(before)) lines.push(`${astray} card${astray === 1 ? "" : "s"} now sit${astray === 1 ? "s" : ""} out of the story's order on the wall (the order is the arrows; organize lays the cards along them when the writer wants it)`);
  return lines;
}
