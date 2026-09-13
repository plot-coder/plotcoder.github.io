// Read the wall (R22, first slice).
//
// Step 4 of the method: look at the board and find what is wrong with it. This
// module reads a BoardState and returns two things — a *reading* (the cards in
// wall order, the beats, and the runs of pages between them) and a list of
// *findings*, each written as a question. It never fixes anything and it never
// says how many beats there should be (D21).
//
// Pure and DOM-free like the reducer, so the Reminders modal, the MCP server and
// the tests all read the same wall the same way.
//
// Order: the wall gives the order, and the wall is free (D20), so order here is
// reading order — rows top to bottom, cards left to right within a row. Arrows
// do not yet change the order; that is the first refinement to make once this
// slice has been used.

import { boardEighths, EIGHTHS_PER_PAGE, formatPages, NOTE_HEIGHT, noteEighths } from "./reducer.js";

/** What create_note writes before a person has. */
export const PLACEHOLDER_HEADLINE = "New beat";
export const PLACEHOLDER_CHANGE = "What changes?";

// A run more than twice the median run is worth a question. "Sagging" is a
// claim about proportion (R25), so the threshold is relative, not a page count.
const SAG_RATIO = 2;
// Longer than this and a group is probably two sequences wearing one frame.
const SEQUENCE_MAX_EIGHTHS = 20 * EIGHTHS_PER_PAGE;
// Two cards whose tops are within half a card of each other share a row.
const ROW_TOLERANCE = NOTE_HEIGHT / 2;
// A character gone for more than this share of the story is worth asking about.
const ABSENCE_FRACTION = 1 / 3;
// Headlines this alike are probably the same scene twice. Measured on the
// content words only — "Tom lies about the job" and "Tom lies about his job"
// are the same scene — and as overlap with the shorter headline, so a headline
// that contains another counts.
const DUPLICATE_OVERLAP = 0.75;
const FILLER = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "on", "at", "for", "with",
  "about", "into", "from", "by", "his", "her", "hers", "its", "their", "is", "it",
]);

/**
 * Cards in reading order: banded into rows by y, then left to right. A free
 * wall has no rows, so this is the order a person's eye takes across it.
 */
export function readingOrder(notes) {
  const byTop = [...notes].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows = [];
  let row = null;
  for (const note of byTop) {
    if (row && note.y - row.top <= ROW_TOLERANCE) {
      row.notes.push(note);
    } else {
      row = { top: note.y, notes: [note] };
      rows.push(row);
    }
  }
  return rows.flatMap((band) => band.notes.sort((a, b) => a.x - b.x || a.y - b.y));
}

function words(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !FILLER.has(word));
}

function sameScene(a, b) {
  const wa = words(a);
  const wb = words(b);
  if (wa.length === 0 || wb.length === 0) return false;
  if (wa.join(" ") === wb.join(" ")) return true;
  if (wa.length < 2 || wb.length < 2) return false;
  const setA = new Set(wa);
  const setB = new Set(wb);
  let shared = 0;
  for (const word of setA) if (setB.has(word)) shared += 1;
  return shared / Math.min(setA.size, setB.size) >= DUPLICATE_OVERLAP;
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function pages(eighths) {
  return formatPages(Math.round(eighths));
}

function quote(note) {
  return `"${note.headline}"`;
}

function list(notes) {
  return notes.map(quote).join(", ");
}

/**
 * Read the board. Returns the reading and the findings; see readWall.d.ts for
 * the shape. Never mutates the state.
 */
export function readWall(state) {
  const order = readingOrder(state.notes);
  const beats = order.filter((note) => note.rank === "beat");

  // Runs: the scene pages strictly between consecutive beats, plus the opening
  // run before the first beat and the closing run after the last. A beat's own
  // pages belong to no run — "between" means between.
  const runs = [];
  let from = null;
  let eighths = 0;
  let cards = 0;
  for (const note of order) {
    if (note.rank === "beat") {
      if (from !== null || cards > 0) runs.push({ from, to: note.id, eighths, cards });
      from = note.id;
      eighths = 0;
      cards = 0;
    } else {
      eighths += noteEighths(note);
      cards += 1;
    }
  }
  if (from !== null && cards > 0) runs.push({ from, to: null, eighths, cards });

  const findings = [];
  const byId = new Map(state.notes.map((note) => [note.id, note]));
  const headline = (id) => (id ? byId.get(id)?.headline ?? id : null);
  const position = new Map(order.map((note, index) => [note.id, index]));

  // Setups (R30): where each one is planted and paid off, in pages.
  const startAt = new Map();
  let offset = 0;
  for (const note of order) {
    startAt.set(note.id, offset);
    offset += noteEighths(note);
  }
  const setups = state.arrows
    .filter((arrow) => arrow.kind === "setup" && byId.has(arrow.from) && byId.has(arrow.to))
    .map((arrow) => ({
      id: arrow.id,
      from: arrow.from,
      to: arrow.to,
      eighths: startAt.get(arrow.to) - startAt.get(arrow.from),
    }));

  // Step 2 has not been done, so step 4 cannot read runs. A fact, not a nudge.
  if (state.notes.length > 0 && beats.length === 0) {
    findings.push({
      kind: "unmarked",
      ids: [],
      text: "No card is marked as a beat, so the runs between turns cannot be read yet.",
    });
  }

  // The sag detector (R25): one run out of proportion with the others.
  const between = runs.filter((run) => run.from !== null && run.to !== null);
  if (between.length >= 2) {
    const typical = median(between.map((run) => run.eighths));
    const longest = between.reduce((top, run) => (run.eighths > top.eighths ? run : top));
    if (typical > 0 && longest.eighths > SAG_RATIO * typical) {
      findings.push({
        kind: "sag",
        ids: [longest.from, longest.to],
        text: `About ${pages(longest.eighths)} pages run between "${headline(longest.from)}" and "${headline(longest.to)}"; a typical run here is about ${pages(typical)}. Is something sagging there, or is it one long set piece?`,
      });
    }
  }

  // Two beats back to back: no scene between two turns. A question, not a
  // verdict — they may be one beat, or a scene may be missing.
  for (const run of between) {
    if (run.cards === 0) {
      findings.push({
        kind: "empty",
        ids: [run.from, run.to],
        text: `Nothing runs between "${headline(run.from)}" and "${headline(run.to)}": two turns back to back. Are they one beat, or is a scene missing?`,
      });
    }
  }

  // A card that has not earned its place yet.
  for (const note of order) {
    const change = (note.change ?? "").trim();
    const title = (note.headline ?? "").trim();
    if (title === "" || title === PLACEHOLDER_HEADLINE) {
      findings.push({
        kind: "unwritten",
        ids: [note.id],
        text: `A card still reads ${quote({ headline: title || PLACEHOLDER_HEADLINE })}. What scene is it?`,
      });
    } else if (change === "" || change === PLACEHOLDER_CHANGE) {
      findings.push({
        kind: "unwritten",
        ids: [note.id],
        text: `${quote(note)} has no change line. What is different when it ends?`,
      });
    }
  }

  // Only once the wall uses arrows does a card without one mean anything.
  const linked = new Set();
  for (const arrow of state.arrows) {
    linked.add(arrow.from);
    linked.add(arrow.to);
  }
  if (state.notes.length > 0 && linked.size * 2 >= state.notes.length) {
    const loose = order.filter((note) => !linked.has(note.id));
    if (loose.length > 0) {
      findings.push({
        kind: "unlinked",
        ids: loose.map((note) => note.id),
        text: `${loose.length === 1 ? "One card has" : `${loose.length} cards have`} no arrow in or out: ${list(loose)}. What sets ${loose.length === 1 ? "it" : "them"} up, and what ${loose.length === 1 ? "does it" : "do they"} pay off?`,
      });
    }
  }

  // Two cards doing the same job.
  for (let i = 0; i < order.length; i += 1) {
    for (let j = i + 1; j < order.length; j += 1) {
      const a = order[i];
      const b = order[j];
      if (sameScene(a.headline, b.headline)) {
        findings.push({
          kind: "duplicate",
          ids: [a.id, b.id],
          text: `${quote(a)} and ${quote(b)} read like the same scene. Are they doing the same job?`,
        });
      }
    }
  }

  // A payoff that lands before its setup. The wall gives the order (D20), so
  // if the arrow and the wall disagree, one of them is wrong — ask which.
  for (const setup of setups) {
    if (position.get(setup.to) < position.get(setup.from)) {
      findings.push({
        kind: "backwards",
        ids: [setup.id, setup.from, setup.to],
        text: `${quote(byId.get(setup.from))} sets up ${quote(byId.get(setup.to))}, but on the wall the payoff comes first. Which order do you mean?`,
      });
    }
  }

  // A folded corner nothing has paid off (R31). The fold says "this plants
  // something"; a setup arrow leaving the card is the payoff. Until one does,
  // the debt is open.
  // Which scene pays each plant off: the first setup arrow leaving the card,
  // by wall order of its head. Every planted card is here, paid or not
  // (null), so a card can say its state.
  const paysOff = new Set(
    state.arrows.filter((arrow) => arrow.kind === "setup").map((arrow) => arrow.from),
  );
  const wallIndex = new Map(order.map((note, index) => [note.id, index]));
  const payoffs = {};
  for (const note of order) {
    if (!note.plants) continue;
    const heads = state.arrows
      .filter((arrow) => arrow.kind === "setup" && arrow.from === note.id)
      .map((arrow) => arrow.to)
      .sort((a, b) => (wallIndex.get(a) ?? Infinity) - (wallIndex.get(b) ?? Infinity));
    payoffs[note.id] = heads[0] ?? null;
  }
  for (const note of order) {
    if (note.plants && !paysOff.has(note.id)) {
      findings.push({
        kind: "unpaid",
        ids: [note.id],
        text: `${quote(note)} plants something, and no arrow pays it off. Where does it come back?`,
      });
    }
  }

  // The cast (R29): someone who vanishes for a stretch, or never appears.
  const total = boardEighths(state);
  const at = new Map();
  let cursor = 0;
  for (const note of order) {
    at.set(note.id, cursor);
    cursor += noteEighths(note);
  }
  for (const character of state.characters ?? []) {
    const scenes = order.filter((note) => note.characterIds?.includes(character.id));
    if (scenes.length === 0) {
      findings.push({
        kind: "uncast",
        ids: [character.id],
        text: `${character.name} is in the cast but on no card. Where do they come in?`,
      });
      continue;
    }
    let longest = null;
    for (let i = 1; i < scenes.length; i += 1) {
      const prev = scenes[i - 1];
      const next = scenes[i];
      const gap = at.get(next.id) - (at.get(prev.id) + noteEighths(prev));
      if (!longest || gap > longest.gap) longest = { gap, from: prev, to: next };
    }
    if (longest && total > 0 && longest.gap > total * ABSENCE_FRACTION) {
      findings.push({
        kind: "absent",
        ids: [character.id, longest.from.id, longest.to.id],
        text: `${character.name} is in ${quote(longest.from)} and then not again until ${quote(longest.to)}, about ${pages(longest.gap)} pages later. Where are they in between?`,
      });
    }
  }

  // A frame too big to be one sequence.
  for (const group of state.groups) {
    const members = group.noteIds.map((id) => byId.get(id)).filter(Boolean);
    const total = members.reduce((sum, note) => sum + noteEighths(note), 0);
    if (total > SEQUENCE_MAX_EIGHTHS) {
      findings.push({
        kind: "sequence",
        ids: [group.id],
        text: `"${group.title}" runs about ${pages(total)} pages across ${members.length} cards. Is it one sequence or two?`,
      });
    }
  }

  return {
    order: order.map((note) => note.id),
    beats: beats.map((note) => ({ id: note.id, headline: note.headline })),
    runs,
    setups,
    payoffs,
    findings,
  };
}

/** The setups as prose lines: what plants what, and how far apart. */
export function describeSetups(reading, state) {
  const byId = new Map(state.notes.map((note) => [note.id, note]));
  const name = (id) => byId.get(id)?.headline ?? id;
  return reading.setups.map((setup) => {
    const distance =
      setup.eighths > 0
        ? `about ${pages(setup.eighths)} pages later`
        : setup.eighths === 0
          ? "in the same place on the wall"
          : `about ${pages(-setup.eighths)} pages earlier`;
    return `"${name(setup.from)}" sets up "${name(setup.to)}", ${distance}`;
  });
}

/** The reading as prose lines, shared by the modal and the MCP tool. */
export function describeRuns(reading, state) {
  const byId = new Map(state.notes.map((note) => [note.id, note]));
  const name = (id) => byId.get(id)?.headline ?? id;
  return reading.runs.map((run) => {
    const span =
      run.from === null
        ? `Before "${name(run.to)}"`
        : run.to === null
          ? `After "${name(run.from)}"`
          : `"${name(run.from)}" → "${name(run.to)}"`;
    const count = run.cards === 1 ? "1 card" : `${run.cards} cards`;
    return `${span}: about ${pages(run.eighths)} pages, ${count}`;
  });
}
