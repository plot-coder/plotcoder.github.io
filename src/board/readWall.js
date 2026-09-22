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
// Order: the wall gives the order, and the wall is free (D20). Reading order is
// rows top to bottom, cards left to right within a row; story order is reading
// order with each follows arrow pulling its source in front of its target, the
// order organize lays the wall out in. Since round fourteen (entry 41) every
// reading uses story order, so a card wired between two others reads there
// before any tidy — the arrows are the writer's claim about the order, and
// where they say nothing the positions decide.

import { isMeasured, boardEighths, EIGHTHS_PER_PAGE, formatPages, inStory, noteEighths, readingOrder, storyOrder, unlinkedCards } from "./reducer.js";

// The two orders live in the kernel (R62: a thread's cards are held in story
// order), and every reader still imports them from here.
export { readingOrder, storyOrder };

/** What create_note writes before a person has. */
export const PLACEHOLDER_HEADLINE = "New beat";
export const PLACEHOLDER_CHANGE = "What changes?";

// A run more than twice the median run is worth a question. "Sagging" is a
// claim about proportion (R25), so the threshold is relative, not a page count.
const SAG_RATIO = 2;
// Longer than this and a group is probably two sequences wearing one frame.
const SEQUENCE_MAX_EIGHTHS = 20 * EIGHTHS_PER_PAGE;
// Two cards whose tops are within half a card of each other share a row.
// A character gone for more than this share of the story is worth asking about.
const ABSENCE_FRACTION = 1 / 3;
// ...and at least this long, so a short wall of one-page estimates does not
// call every gap a disappearance (round seven, finding 20): ten pages, a reel.
const ABSENCE_FLOOR_EIGHTHS = 10 * EIGHTHS_PER_PAGE;
// Headlines this alike are probably the same scene twice. Measured on the
// content words only — "Tom lies about the job" and "Tom lies about his job"
// are the same scene — and as overlap with the shorter headline, so a headline
// that contains another counts.
const DUPLICATE_OVERLAP = 0.75;
const FILLER = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "on", "at", "for", "with",
  "about", "into", "from", "by", "his", "her", "hers", "its", "their", "is", "it",
]);



/** The leading "Day three, night." of a headline, the convention the guide asks for until a card has a when: not a scene's words. */
const DAY_PREFIX = /^\s*day\s+[\w-]+(?:\s*,\s*[\w\s-]+?)?\s*[.:]\s*/i;



function words(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !FILLER.has(word));
}

function sameScene(a, b, ignore = new Set()) {
  const wa = words(a).filter((word) => !ignore.has(word));
  const wb = words(b).filter((word) => !ignore.has(word));
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

/** Small counts as words, the way the sheet reads them. */
function countWord(n) {
  return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? String(n);
}

function pages(eighths) {
  return formatPages(Math.round(eighths));
}

/** "1 page", "3 pages", "4/8 of a page" — never "1 pages" (round thirteen, entry 15). */
function pagesWord(eighths) {
  const n = pages(eighths);
  if (n === "1") return "1 page";
  if (/^\d+\/8$/.test(n)) return `${n} of a page`;
  return `${n} pages`;
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
export function readWall(state, options = {}) {
  // People on a card of another board of the project (R51) are cast, and
  // are not asked about here.
  const elsewhere = new Set(Array.isArray(options.elsewhere) ? options.elsewhere : []);
  // The project's other boards, for a fold that pays off later (R58): a board
  // that holds cards and no claimed scene is a promise the wall asks about.
  const boardsHeld = options.laterBoards && typeof options.laterBoards === "object" ? options.laterBoards : null;
  // Folds of other boards that land on a card here (R58), composed by the door.
  const paidBy = Array.isArray(options.paidBy) ? options.paidBy : [];
  const order = storyOrder(state);
  const beats = order.filter((note) => note.rank === "beat");
  // A card on no follows arrow once the film has any is in no run (round twenty-four, entry 34): it is in the film,
  // and the wall asks where it goes; until then it is nowhere between two turns.
  const unlinked = new Set(unlinkedCards(state).map((note) => note.id));

  // Runs: the scene pages strictly between consecutive beats, plus the opening
  // run before the first beat and the closing run after the last. A beat's own
  // pages belong to no run — "between" means between.
  const runs = [];
  let from = null;
  let eighths = 0;
  let cards = 0;
  let ids = [];
  for (const note of order) {
    if (unlinked.has(note.id)) continue;
    if (note.rank === "beat") {
      if (from !== null || cards > 0) runs.push({ from, to: note.id, eighths, cards, ids });
      from = note.id;
      eighths = 0;
      cards = 0;
      ids = [];
    } else {
      eighths += noteEighths(note);
      cards += 1;
      ids.push(note.id);
    }
  }
  if (from !== null && cards > 0) runs.push({ from, to: null, eighths, cards, ids });

  const findings = [];
  // Open cards (R59): the writer's word that a card is not decided. Listed,
  // and asked nothing else while the words stand — the card's own "leave it".
  const openIds = new Set(order.filter((note) => (note.open ?? "").trim()).map((note) => note.id));
  const askable = (note) => !openIds.has(note.id);
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
      // An end behind another card as its other version (R65) has no place in
      // the story, so the setup has no distance: null, never NaN (round twenty-two, entry 60).
      eighths: startAt.has(arrow.to) && startAt.has(arrow.from) ? startAt.get(arrow.to) - startAt.get(arrow.from) : null,
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
  // A run of unsized, unwritten cards is the default page each, so a wall
  // where every run is defaults measures nothing but card counts; the sag
  // waits until some card in some run is sized or written (round fourteen, 12).
  const claimed = between.some((run) => run.ids.some((id) => {
    const note = byId.get(id);
    return note && (note.lengthEighths !== null || (note.text ?? "").trim());
  }));
  // The typical run is the median of the runs that hold a card: an empty run
  // is a question of its own ("empty"), and counting it here made a small
  // wall's one ordinary scene read as a sag against a median of an eighth
  // (round fifteen, entry 10).
  const filled = between.filter((run) => run.ids.length > 0);
  if (filled.length >= 2 && claimed) {
    const typical = median(filled.map((run) => run.eighths));
    const longest = filled.reduce((top, run) => (run.eighths > top.eighths ? run : top));
    if (typical > 0 && longest.eighths > SAG_RATIO * typical) {
      findings.push({
        kind: "sag",
        ids: [longest.from, longest.to],
        text: `About ${pagesWord(longest.eighths)} run between "${headline(longest.from)}" and "${headline(longest.to)}"; the median run here is about ${pagesWord(typical)} (a beat's own pages are in no run). Is something sagging there, or is it one long set piece?`,
      });
    }
  }

  // Beats back to back: no scene between two turns. A question, not a
  // verdict — they may be one beat, or a scene may be missing. Consecutive
  // empty runs are one question naming the chain, not one per pair: a pilot
  // whose turns come thick at the end would otherwise ask the same sentence
  // six times (round four, finding 19).
  let chain = [];
  // On a wall where most runs hold nothing, the turns are back to back by
  // construction, and the question stands until scenes go in; say so rather
  // than ask it as if it were a choice (round eighteen, entry 29).
  const thin = between.length >= 2 && between.filter((run) => run.cards === 0).length * 2 > between.length ? " Most runs hold nothing yet, so this stands until scenes go in, or until the writer leaves it as the pace." : "";
  const askChain = () => {
    if (chain.length === 0) return;
    const ids = [chain[0].from, ...chain.map((run) => run.to)];
    const names = ids.map((id) => `"${headline(id)}"`);
    findings.push({
      kind: "empty",
      ids,
      text:
        ids.length === 2
          ? `Nothing runs between ${names[0]} and ${names[1]}: two turns back to back. Are they one beat, is a scene missing, is that the pace — or have you not got that far yet?${thin}`
          : `Nothing runs between ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}: ${countWord(ids.length)} turns back to back. Are some of them one beat, are scenes missing between them, is that the pace — or have you not got that far yet?${thin}`,
    });
    chain = [];
  };
  for (const run of between) {
    const continues = chain.length > 0 && chain[chain.length - 1].to === run.from;
    if (run.cards !== 0 || !continues) askChain();
    if (run.cards === 0) chain.push(run);
  }
  askChain();

  // A card that says no place, once the writer has started placing cards.
  // One question however many there are; a wall with no places at all is a
  // wall the writer has not placed yet, and is not asked.
  // A place left open in the writer's words (R61's edge) is listed, not asked.
  const unplaced = order.filter((note) => askable(note) && !(note.location ?? "").trim() && !(note.locationOpen ?? "").trim());
  if (unplaced.length > 0 && unplaced.length < order.length) {
    findings.push({
      kind: "unplaced",
      ids: unplaced.map((note) => note.id),
      text:
        unplaced.length === 1
          ? `${quote(unplaced[0])} says no place. Where does it happen?`
          : `${unplaced.length} cards say no place: ${unplaced.map(quote).join(", ")}. Where do they happen?`,
    });
  }

  // A card that has not earned its place yet.
  for (const note of order) {
    if (!askable(note)) continue;
    const change = (note.change ?? "").trim();
    const title = (note.headline ?? "").trim();
    if (title === "" || title === PLACEHOLDER_HEADLINE) {
      findings.push({
        kind: "unwritten",
        ids: [note.id],
        text: `A card still reads ${quote({ headline: title || PLACEHOLDER_HEADLINE })}. What scene is it?`,
      });
    } else if ((note.changeOpen ?? "").trim()) {
      // Left open by the writer's word (R67): listed under open fields, not asked; the card's other questions stand.
    } else if (change === "" || change === PLACEHOLDER_CHANGE) {
      findings.push({
        kind: "unwritten",
        ids: [note.id],
        text: `${quote(note)} has no change line. What is different when it ends?`,
      });
    }
  }

  // Only once the wall uses arrows does a card without one mean anything.
  // A setup arrow is a claim, not a place in the story (round twenty, entry
  // 25): a card touched only by one still has no order, so only follows
  // arrows link a card.
  const linked = new Set();
  for (const arrow of state.arrows) {
    if (arrow.kind === "setup") continue;
    linked.add(arrow.from);
    linked.add(arrow.to);
  }
  // Half the cards in the film, not half the cards on the wall: a version behind another and a card set aside are wired to nothing by design.
  if (order.length > 0 && linked.size * 2 >= order.length) {
    const loose = order.filter((note) => askable(note) && !linked.has(note.id));
    if (loose.length > 0) {
      findings.push({
        kind: "unlinked",
        ids: loose.map((note) => note.id),
        text: `${loose.length === 1 ? "One card has" : `${loose.length} cards have`} no arrow in or out: ${list(loose)}. What comes before ${loose.length === 1 ? "it" : "them"} in the story, and what after?`,
      });
    }
  }

  // Two cards doing the same job. The cast's names are not the scene's words
  // (round twenty, entry 15): "Con gives Ruth the key" and "Con gives Ruth
  // his tools" share their people, not their job.
  const nameWords = new Set((state.characters ?? []).flatMap((person) => words(person.name ?? "")));
  for (let i = 0; i < order.length; i += 1) {
    for (let j = i + 1; j < order.length; j += 1) {
      const a = order[i];
      const b = order[j];
      // A leading "Day three." is the guide's convention for when a scene
      // happens, not the scene's words (round fourteen, entry 13).
      if (sameScene(a.headline.replace(DAY_PREFIX, ""), b.headline.replace(DAY_PREFIX, ""), nameWords)) {
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

  // A payoff with no fold (round seventeen, entry 12): a setup arrow leaves a
  // card whose corner is not folded. The arrow says "this pays off", the
  // card says nothing was planted — ask which.
  for (const setup of setups) {
    const tail = byId.get(setup.from);
    if (tail && !tail.plants) {
      findings.push({
        kind: "unplanted",
        ids: [setup.id, setup.from],
        text: `${quote(tail)} pays off at ${quote(byId.get(setup.to))} by a setup arrow, but its corner is not folded. Fold it, or is the arrow wrong?`,
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
    // Every payoff, in wall order: a card can plant two things (the ledger
    // pays off at the cash and again at the initials), and both count. A
    // fold that pays off only on another board is not here at all — it is
    // under `later` — so the two never disagree about one card.
    if (!heads.length && note.payoffBoardId) continue;
    payoffs[note.id] = heads;
  }
  // A fold that pays off on another board (R50) is not unpaid: it is listed
  // under `later`, and the door that knows the project names the board.
  const later = order
    .filter((note) => note.plants && note.payoffBoardId)
    .map((note) => {
      const held = boardsHeld?.[note.payoffBoardId];
      const claimed = Boolean(note.payoffNoteId && (!held || held.noteIds.includes(note.payoffNoteId)));
      return { id: note.id, boardId: note.payoffBoardId, noteId: claimed ? note.payoffNoteId : null };
    });
  for (const note of order) {
    if (note.plants && !paysOff.has(note.id) && !note.payoffBoardId) {
      findings.push({
        kind: "unpaid",
        ids: [note.id],
        text: `${quote(note)} plants ${note.plantsWhat || "something"}, and no arrow pays it off. Where does ${note.plantsWhat ? "it" : "it"} come back?`.replace("Where does it come back?", note.plantsWhat ? `Where ${/s$/i.test(note.plantsWhat) ? "do" : "does"} ${note.plantsWhat} come back?` : "Where does it come back?"),
      });
    }
  }
  // A board's name is a promise; a scene is the payoff (R58). Once the board
  // has cards, the wall asks which one, until a scene there claims the fold.
  for (const item of later) {
    const held = boardsHeld?.[item.boardId];
    if (!held || held.cards === 0 || item.noteId) continue;
    const note = byId.get(item.id);
    findings.push({
      kind: "unpaid",
      ids: [item.id],
      text: `${quote(note)} pays off later, on "${held.name}", but no scene there claims it yet. Which one?`,
    });
  }
  const hereIds = new Set(order.map((note) => note.id));
  const paidHere = paidBy.filter((item) => hereIds.has(item.id));

  // A card with nobody in it, once the wall has a cast (round seventeen,
  // entry 28): a scene nobody is in passed every check.
  if ((state.characters ?? []).length > 0) {
    // A card where someone may be is one whose cast the writer has spoken to: listed under open, not asked (H9).
    // Nor is a card whose cast the writer has left open in their own words (round twenty-three, entry 13).
    const empty = order.filter((note) => askable(note) && !(note.characterIds ?? []).length && !(note.maybeCharacterIds ?? []).length && !(note.castOpen ?? "").trim());
    if (empty.length) {
      findings.push({
        kind: "nobody",
        ids: empty.map((note) => note.id),
        text: `${empty.length === 1 ? `${quote(empty[0])} has nobody in it` : `${empty.length} cards have nobody in them: ${empty.map((note) => quote(note)).join(", ")}`}. Who is in the scene${empty.length === 1 ? "" : "s"}?`,
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
    // Where they may or may not be, by the writer's word (H9): counted neither way.
    const maybes = order.filter((note) => note.maybeCharacterIds?.includes(character.id));
    if (scenes.length === 0) {
      if (elsewhere.has(character.id)) continue;
      // On no card for certain, and the writer has said where they may be: open, not a question.
      if (maybes.length) continue;
      // Only on a card the writer set aside, or on a version behind another: they come in where that card does, if it ever comes back. Asking would be asking about a scene the writer cut (round twenty-three, entry 19).
      if (state.notes.some((note) => !inStory(note) && (note.characterIds?.includes(character.id) || note.maybeCharacterIds?.includes(character.id)))) continue;
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
    if (longest && total > 0 && longest.gap > total * ABSENCE_FRACTION && longest.gap >= ABSENCE_FLOOR_EIGHTHS) {
      findings.push({
        kind: "absent",
        ids: [character.id, longest.from.id, longest.to.id],
        text: `${character.name} is in ${quote(longest.from)} and then not again until ${quote(longest.to)}, about ${pages(longest.gap)} pages later${(() => {
          // A maybe inside the gap is the writer's own answer in waiting: say it, never count it.
          const between = maybes.filter((note) => at.get(note.id) > at.get(longest.from.id) && at.get(note.id) < at.get(longest.to.id));
          return between.length ? ` — unless they are in ${list(between)}, which is not decided` : "";
        })()}. Where are they in between?`,
      });
    }
  }

  // A frame too big to be one sequence. A group titled as an act ("Act two")
  // is an act, not a sequence, and is not asked about.
  for (const group of state.groups) {
    if (/^act\b/i.test((group.title ?? "").trim())) continue;
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

  // Threads (R60): a named string through cards, in story order, either end
  // open until the writer ties it. The reading asks about each loose end from
  // that end — the question a fold cannot ask, where a thing is first seen.
  const threads = (state.threads ?? []).map((thread) => {
    // In the order the string runs, a card out of the film included (round twenty-four, entry 17): a version behind
    // another, or a card set aside, is where the writer said the thing is seen, if that card is ever the scene.
    const ids = thread.noteIds.filter((id) => byId.has(id) || state.notes.some((note) => note.id === id));
    const outside = ids
      .map((id) => state.notes.find((note) => note.id === id))
      .filter((note) => note && !inStory(note))
      .map((note) => ({ id: note.id, behind: note.alternativeOf ?? null, aside: note.aside === true }));
    // How far the string runs, in the same estimated pages a setup's distance uses (round twenty, entry 44), between
    // its ends in the film.
    const inFilm = ids.filter((id) => startAt.has(id));
    const apart = inFilm.length >= 2 ? (startAt.get(inFilm[inFilm.length - 1]) ?? 0) - (startAt.get(inFilm[0]) ?? 0) : 0;
    return { id: thread.id, name: thread.name, ids, outside, startOpen: thread.startOpen === true, endOpen: thread.endOpen === true, apart };
  });
  for (const thread of threads) {
    const first = thread.ids.length ? byId.get(thread.ids[0]) : null;
    const last = thread.ids.length ? byId.get(thread.ids[thread.ids.length - 1]) : null;
    if (!thread.ids.length) {
      findings.push({ kind: "loose", ids: [thread.id], text: `"${thread.name}" runs through no card yet. Where is it first seen, and where does it come out?` });
    } else if (thread.startOpen && thread.endOpen) {
      findings.push({ kind: "loose", ids: [thread.id, ...thread.ids], text: `"${thread.name}" runs through ${list(thread.ids.map((id) => byId.get(id)))} and neither end is tied. Where is it first seen, and where does it come out?` });
    } else if (thread.startOpen) {
      findings.push({ kind: "loose", ids: [thread.id, first.id], text: `"${thread.name}" starts nowhere yet: it runs ${thread.ids.length === 1 ? "to" : "through"} ${list(thread.ids.map((id) => byId.get(id)))}. Where is it first seen?` });
    } else if (thread.endOpen) {
      findings.push({ kind: "loose", ids: [thread.id, last.id], text: `"${thread.name}" ends nowhere yet: it runs ${thread.ids.length === 1 ? "from" : "through"} ${list(thread.ids.map((id) => byId.get(id)))}. Where does it come out?` });
    }
  }

  // A question the writer has left (R53) is held back while it is still the
  // same question — same kind, same cards, same words. The moment it would
  // read differently (a page moved, a headline changed, the median shifted)
  // it is a new question and is asked. The kernel never decides this; the
  // reading does, on every read.
  const left = [];
  // A question whose every card is open is not asked (R59): the writer's word covers it.
  // Not so for a question about the story around the card: a thread's loose end
  // (R60) is the writer's own claim, and the run's questions — beats back to
  // back, a sag — are about the cards between, as the guide promises (round
  // nineteen, entry 28). Those are asked whether or not the cards are open.
  const openCards = openIds.size ? findings.filter((finding) => !ASKED_OF_OPEN_CARDS.has(finding.kind) && finding.ids.some((id) => byId.has(id)) && finding.ids.filter((id) => byId.has(id)).every((id) => openIds.has(id))) : [];
  const asked = findings.filter((finding) => {
    if (openCards.includes(finding)) return false;
    const entry = (state.left ?? []).find(
      (item) => item.kind === finding.kind && sameList(item.ids, finding.ids) && item.text === finding.text,
    );
    if (!entry) return true;
    left.push({ ...finding, since: entry.since, ...(entry.why ? { why: entry.why } : {}) });
    return false;
  });

  return {
    order: order.map((note) => note.id),
    beats: beats.map((note) => ({ id: note.id, headline: note.headline })),
    runs,
    setups,
    payoffs,
    later,
    paidBy: paidHere,
    open: describeOpen(state, options, order, openIds),
    openFields: describeOpenFields(state, order),
    // Two versions of one scene (R65): the front card and the one behind it, in story order; listed, never asked.
    versions: order.filter((note) => state.notes.some((item) => item.alternativeOf === note.id)).map((note) => ({ id: note.id, alternatives: state.notes.filter((item) => item.alternativeOf === note.id).map((item) => item.id) })),
    // People the writer has left something open about (round twenty-two, entries 12, 24): listed, never asked.
    // Turns the agent has proposed and the writer has not kept or struck, in story order: scenes until kept, and never asked about.
    proposed: order.filter((note) => note.proposedBeat === true).map((note) => note.id),
    // Cards on no follows arrow while the film has them: in the film, in no run, printed last; asked about above.
    unlinked: order.filter((note) => unlinked.has(note.id)).map((note) => note.id),
    // What is not decided about the film itself, in the writer's sentences: listed first, never asked.
    openLines: [...(state.openLines ?? [])],
    openPeople: (state.characters ?? []).filter((person) => (person.open ?? "").trim()).map((person) => ({ id: person.id, name: person.name, words: person.open.trim() })),
    // How much of the film is wired (follows arrows; a setup arrow is a claim, not a place): the unlinked
    // question waits for half. Returned so a door says the reading's numbers, never its own (round twenty-two, entry 20).
    wired: { linked: order.filter((note) => linked.has(note.id)).length, of: order.length },
    // Set aside (R66): on the wall and not in the film. Listed, never asked.
    aside: state.notes.filter((note) => note.aside === true).map((note) => note.id),
    threads,
    findings: asked,
    left,
  };
}

/**
 * The open cards, each with the kinds of question it would be asked if it were
 * closed (round eighteen, entry 27): the reading of the same wall with the
 * words cleared, read once more, so the writer can see what the words hide.
 */
/**
 * The fields the writer has left open (R61), in the writer's words: the
 * board's logline, and a card's when, in story order. The premise and the
 * board's name live on the project, and the door adds them. Listed, never
 * asked about: no check asks about a missing logline or when.
 */
/** "who is in it" on a card with nobody named, "who else is in it" beside names. */
export function castOpenLabel(note) {
  return (note.characterIds ?? []).length || (note.maybeCharacterIds ?? []).length ? "who else is in it" : "who is in it";
}

/** "whether Tomás is in it", for a card where someone may or may not be (H9); empty when nobody is a maybe. */
export function maybeWords(note, state) {
  const names = (note.maybeCharacterIds ?? []).map((id) => (state.characters ?? []).find((character) => character.id === id)?.name).filter(Boolean);
  if (!names.length) return "";
  const who = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `whether ${who} ${names.length === 1 ? "is" : "are"} in it`;
}

function describeOpenFields(state, order) {
  const fields = [];
  if ((state.loglineOpen ?? "").trim()) fields.push({ field: "logline", words: state.loglineOpen.trim() });
  for (const note of order) if ((note.locationOpen ?? "").trim()) fields.push({ field: "location", id: note.id, words: note.locationOpen.trim() });
  for (const note of order) if ((note.changeOpen ?? "").trim()) fields.push({ field: "change", id: note.id, words: note.changeOpen.trim() });
  for (const note of order) if ((note.whenOpen ?? "").trim()) fields.push({ field: "when", id: note.id, words: note.whenOpen.trim() });
  for (const note of order) {
    const words = maybeWords(note, state);
    if (words) fields.push({ field: "cast", id: note.id, words });
  }
  // Who is in it, or who else, left open in the writer's words.
  for (const note of order) if ((note.castOpen ?? "").trim()) fields.push({ field: "castOpen", id: note.id, words: `${castOpenLabel(note)}: ${note.castOpen.trim()}` });
  return fields;
}

/** The question kinds an open card does not silence: about the story around it, not the card (R59, R60). */
const ASKED_OF_OPEN_CARDS = new Set(["loose", "empty", "sag"]);

function describeOpen(state, options, order, openIds) {
  if (!openIds.size) return [];
  const hides = new Map();
  if (!options.closedReading) {
    const closed = { ...state, notes: state.notes.map((note) => (openIds.has(note.id) ? { ...note, open: "" } : note)) };
    const again = readWall(closed, { ...options, closedReading: true });
    // A question about the story around the card is asked whether or not the
    // card is open, so it is never something the open words hide (round
    // nineteen, entries 23 and 28).
    for (const finding of again.findings) if (!ASKED_OF_OPEN_CARDS.has(finding.kind)) for (const id of finding.ids) if (openIds.has(id)) (hides.get(id) ?? hides.set(id, new Set()).get(id)).add(finding.kind);
  }
  return order.filter((note) => openIds.has(note.id)).map((note) => ({ id: note.id, words: note.open.trim(), hides: [...(hides.get(note.id) ?? [])] }));
}

function sameList(a, b) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/**
 * Everything undecided on the wall, in one place (round twenty-two, entries 41,
 * 43, 67, 86, 89): what the writer has left open, and what nobody has said.
 *
 * `open`: the project's fields first; then one grouped line where the same
 * words sit on three or more cards in one field (round twenty, entry 22);
 * then one line per card carrying everything particular to it, so no card
 * appears twice. `blank`: what is simply not said — no place, no when, no
 * length, nobody in it — by field, because blanks have no words. Blank is
 * never "open": open is the writer's word, and blank is nobody's (D21).
 *
 * @param extras.project lines for fields the project holds ({ label, words })
 * @param extras.wouldAsk (openItem) => a suffix saying what a closed card would be asked
 */
/** How many things are open, by the writer's word, on cards not in the film — set aside, or behind as a version: listed by describeUndecided, so counted where the list is counted (round twenty-three, entry 37). */
export function openOutsideFilm(state) {
  let count = 0;
  for (const note of state.notes.filter((item) => !inStory(item))) {
    for (const words of [note.open, note.changeOpen, note.locationOpen, note.whenOpen, note.castOpen]) if ((words ?? "").trim()) count += 1;
    if (maybeWords(note, state)) count += 1;
  }
  return count;
}

export function describeUndecided(state, reading, extras = {}) {
  const byId = new Map(state.notes.map((note) => [note.id, note]));
  const name = (id) => `"${byId.get(id)?.headline ?? id}"`;
  const FIELD = { change: "the change line", location: "where", when: "when" };
  const open = [];
  for (const item of extras.project ?? []) open.push(`  - ${item.label} — ${item.words}`);
  for (const line of reading.openLines ?? []) open.push(`  - about the film — ${line}`);
  for (const person of reading.openPeople ?? []) open.push(`  - about ${person.name} — ${person.words}`);
  for (const field of reading.openFields.filter((item) => item.field === "logline")) open.push(`  - the logline — ${field.words}`);

  // Words shared by three or more cards in one field are one line.
  const grouped = new Set();
  for (const kind of ["change", "location", "when"]) {
    const byWords = new Map();
    for (const field of reading.openFields.filter((item) => item.field === kind)) {
      const key = field.words.toLowerCase();
      if (!byWords.has(key)) byWords.set(key, { words: field.words, ids: [] });
      byWords.get(key).ids.push(field.id);
    }
    for (const group of byWords.values()) {
      if (group.ids.length < 3) continue;
      for (const id of group.ids) grouped.add(`${kind}:${id}`);
      const every = group.ids.length === reading.order.length;
      open.push(`  - ${FIELD[kind]}, on ${group.ids.length} cards${every ? " (every card)" : ""} — ${group.words}${every ? "" : `: ${group.ids.map(name).join(", ")}`}`);
    }
  }

  // Then each card once, with everything particular to it.
  const openById = new Map(reading.open.map((item) => [item.id, item]));
  for (const id of reading.order) {
    const parts = [];
    const whole = openById.get(id);
    if (whole) parts.push(`open: ${whole.words}${extras.wouldAsk ? extras.wouldAsk(whole) : ""}`);
    for (const kind of ["change", "location", "when"]) {
      const field = reading.openFields.find((item) => item.field === kind && item.id === id);
      if (field && !grouped.has(`${kind}:${id}`)) parts.push(`${FIELD[kind]}: ${field.words}`);
    }
    const cast = reading.openFields.find((item) => item.field === "cast" && item.id === id);
    if (cast) parts.push(cast.words);
    const castOpen = reading.openFields.find((item) => item.field === "castOpen" && item.id === id);
    if (castOpen) parts.push(castOpen.words);
    if (parts.length) open.push(`  - ${name(id)} — ${parts.join("; ")}`);
  }

  // A card set aside keeps what was open on it, and that is where undecided things sit: listed after the film's, marked.
  // A version behind another the same: what is undecided on it is in no other reading (round twenty-three, entry 40).
  for (const note of state.notes.filter((item) => !inStory(item))) {
    const parts = [
      (note.open ?? "").trim() ? `open: ${note.open.trim()}` : "",
      (note.changeOpen ?? "").trim() ? `${FIELD.change}: ${note.changeOpen.trim()}` : "",
      (note.locationOpen ?? "").trim() ? `${FIELD.location}: ${note.locationOpen.trim()}` : "",
      (note.whenOpen ?? "").trim() ? `${FIELD.when}: ${note.whenOpen.trim()}` : "",
      maybeWords(note, state),
      (note.castOpen ?? "").trim() ? `${castOpenLabel(note)}: ${note.castOpen.trim()}` : "",
    ].filter(Boolean);
    if (parts.length) open.push(`  - ${name(note.id)} (${note.aside === true ? "set aside" : "a version behind, not chosen"}) — ${parts.join("; ")}`);
  }

  // Not said yet: blank, and nobody has said why.
  // A card wholly open by the writer's word is not blank in any field: "that is all I know about it" covers them all (round twenty-three, entry 66).
  const cards = reading.order.map((id) => byId.get(id)).filter(Boolean).filter((note) => !(note.open ?? "").trim());
  const list = (notes) => (notes.length === cards.length && cards.length > 1 ? `every card (${notes.length})` : notes.length > 6 ? `${notes.length} of ${cards.length} cards` : notes.map((note) => name(note.id)).join(", "));
  const blank = [];
  const noPlace = cards.filter((note) => !(note.location ?? "").trim() && !(note.locationOpen ?? "").trim());
  const noWhen = cards.filter((note) => !(note.when ?? "").trim() && !(note.whenOpen ?? "").trim());
  const unsized = cards.filter((note) => note.lengthEighths === null && !(note.text ?? "").trim());
  const nobody = (state.characters ?? []).length ? cards.filter((note) => !(note.characterIds ?? []).length && !(note.maybeCharacterIds ?? []).length && !(note.castOpen ?? "").trim()) : [];
  // Each undecided thing once (round twenty-three, entries 38, 63): what the wall asks about is listed where it is
  // asked — with its question, its ids and leave_question — and not again here. This head is for what is blank and
  // NOT asked; a count says how many more were, so the numbers still add up.
  const askedOf = (kind) => new Set((reading.findings ?? []).filter((finding) => finding.kind === kind).flatMap((finding) => finding.ids));
  const split = (notes, kind) => {
    const asked = askedOf(kind);
    return { quiet: notes.filter((note) => !asked.has(note.id)), asked: notes.filter((note) => asked.has(note.id)).length };
  };
  const line = (label, notes, kind) => {
    if (!notes.length) return;
    const { quiet, asked } = kind ? split(notes, kind) : { quiet: notes, asked: 0 };
    const more = asked ? `${quiet.length ? "; and " : ""}${asked} more the wall asks about above` : "";
    if (quiet.length || asked) blank.push(`  - ${label}: ${quiet.length ? list(quiet) : ""}${more}`);
  };
  line("no place", noPlace, "unplaced");
  line("no when", noWhen, null);
  line("no length (read as a page each)", unsized, null);
  line("nobody in it", nobody, "nobody");
  return { open, blank };
}

/** The setups as prose lines: what plants what, and how far apart. */
export function describeSetups(reading, state) {
  const byId = new Map(state.notes.map((note) => [note.id, note]));
  const name = (id) => byId.get(id)?.headline ?? id;
  return reading.setups.map((setup) => {
    const distance =
      setup.eighths === null || setup.eighths === undefined
        ? (() => {
            const outside = [byId.get(setup.from), byId.get(setup.to)].find((note) => note && (note.alternativeOf || note.aside));
            const which = outside?.id === setup.from ? "its first card" : "its payoff";
            return outside?.aside ? `no distance: ${which} is set aside, not in the film` : `no distance yet: ${which} is behind another card as its other version, out of the story until it is chosen`;
          })()
        : setup.eighths > 0
        ? `about ${pages(setup.eighths)} pages later`
        : setup.eighths === 0
          ? "in the same place on the wall"
          : `about ${pages(-setup.eighths)} pages earlier`;
    const what = byId.get(setup.from)?.plantsWhat ?? "";
    // With no follows arrows the order is only the rows', and so is the distance (round twenty-two, entry 30).
    const byRows = setup.eighths !== null && setup.eighths !== undefined && !state.arrows.some((arrow) => arrow.kind !== "setup") ? ", by the rows: the story order is not set" : "";
    return `"${name(setup.from)}" sets up "${name(setup.to)}"${what ? ` — ${what}` : ""}, ${distance}${byRows}`;
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
    // Whose number a run's pages are (round seventeen, entry 39): measured
    // from written text, or the cards' guess, or some of each.
    const written = (run.ids ?? []).filter((id) => isMeasured(byId.get(id) ?? {})).length;
    const whose = !run.cards ? "" : written === run.cards ? ", measured" : written ? `, ${written} of ${run.cards} measured` : ", estimated";
    const amount = pages(run.eighths);
    return `${span}: about ${amount} ${amount === "1" ? "page" : "pages"}, ${count}${whose}`;
  });
}
