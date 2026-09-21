// PlotCoder board kernel.
//
// Pure, DOM-free reducer over the board records. This is the single source of
// truth for what a "command" does. The browser store, the Vite dev bridge, and
// the MCP server all apply commands through this module so a human gesture and
// an agent tool end up on the exact same code path.
//
// Authored as plain ESM JavaScript (with a sibling reducer.d.ts) so it runs
// unchanged in the browser (via Vite) and in Node (the MCP server). Keep it free
// of `window`, `localStorage`, and `import.meta`.

export const NOTE_COLORS = ["yellow", "pink", "blue", "green", "orange"];

// A beat is one of the 8-to-15 major turns. Everything else is a scene, which is
// why "scene" is first: it is the default a card is born with (R20/R21).
export const NOTE_RANKS = ["scene", "beat"];

// An arrow says what kind of link it is (R15, P16). "follows" is what comes
// after what — the default, and the only kind there was. "setup" says the card
// at the tail plants something the card at the head pays off. A kind is not a
// label: R15 keeps free text off arrows on purpose.
export const ARROW_KINDS = ["follows", "setup"];

// Structure templates (R38) are data beside the kernel; applying one is a
// kernel command so it is one undo step and one tool call.
import { templateById } from "./templates.js";
// The same lines the page has, so the panel's count and the print agree (R23 c).
import { sceneLineCount } from "./paginate.js";
import { lockFrom, REVISION_COLORS } from "./numbering.js";

// Characters are a board-level roster (D26): one record per person, referenced
// from cards by id, so a name changes in one place and the same person is the
// same person on every card. Long term the record grows — what they look like,
// the details a writer needs to pull up — which is why it has an id and
// timestamps now rather than being a word on a card.
export function isCharacter(value) {
  return Boolean(value) && typeof value.id === "string" && typeof value.name === "string";
}

// A person's page (R36): what they look like, how they sound, what they want,
// what they need, and the notes a writer pulls up. All text, all optional; a
// picture waits for file storage. Looks and voice are what the horizon (R28)
// hands a video agent; wants and needs are the method's two questions about a
// person (R18).
export const CHARACTER_FIELDS = ["looks", "voice", "wants", "needs", "notes"];

/**
 * Every line of text a person carries: the five lines of their page, and
 * `open` — the writer's words for what is not decided about them ("what he
 * goes to the town for: a hospital visit, a music lesson, or the courthouse";
 * round twenty-two, entries 12, 24). R61's shape on a person: listed by the
 * reading, never asked. It is not a line of the page, so the page's "how
 * filled" counts leave it out; it fills, updates, compares and merges with them.
 */
export const PERSON_TEXT_FIELDS = [...CHARACTER_FIELDS, "open"];

/** A roster record with every page field present, so the page never reads undefined. */
export function fillCharacter(character) {
  let filled = character;
  for (const field of PERSON_TEXT_FIELDS) {
    if (typeof filled[field] !== "string") {
      if (filled === character) filled = { ...character };
      filled[field] = "";
    }
  }
  return filled;
}

/** The names of the page fields a person has filled in, in page order. */
export function filledCharacterFields(character) {
  return CHARACTER_FIELDS.filter((field) => typeof character[field] === "string" && character[field].trim());
}

// Where a scene happens (R37): a phrase in the writer's words, not a slug.
// One string per card, no roster; the wall's places are read off the cards.
function cleanPlace(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function samePlace(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * The places on a wall, in order of first appearance, each with its card
 * count. Two spellings that differ only in case are one place, spelt the
 * first way. For the lens and for completion on the card.
 */
export function boardPlaces(state) {
  const places = [];
  for (const note of state.notes) {
    const name = cleanPlace(note.location);
    if (!name) continue;
    const found = places.find((place) => samePlace(place.name, name));
    if (found) found.cards += 1;
    else places.push({ name, cards: 1 });
  }
  return places;
}

/** True when the card is at this place, spelt any way. */
export function atPlace(note, place) {
  return Boolean(note.location) && samePlace(note.location, place);
}

export function sameName(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function sameIds(a, b) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/** A question the writer has left (R53): its kind, the cards it was about, and the words it had. */
function isLeftQuestion(value) {
  return (
    !!value &&
    typeof value === "object" &&
    typeof value.kind === "string" &&
    Array.isArray(value.ids) &&
    value.ids.every((id) => typeof id === "string") &&
    typeof value.text === "string" &&
    typeof value.since === "string"
  );
}

/** Keep only ids that name someone in the roster, once each, in the order given. */
function knownCast(ids, characters) {
  if (!Array.isArray(ids)) return [];
  const known = new Set(characters.map((character) => character.id));
  const seen = new Set();
  const cast = [];
  for (const id of ids) {
    if (typeof id !== "string" || !known.has(id) || seen.has(id)) continue;
    seen.add(id);
    cast.push(id);
  }
  return cast;
}

// Length is measured in eighths of a page (D23) — the unit a production
// breakdown uses, and the unit real pages will be measured in when PlotCoder
// holds them (D22). Today's estimate and tomorrow's measurement agree.
export const EIGHTHS_PER_PAGE = 8;
export const DEFAULT_NOTE_EIGHTHS = EIGHTHS_PER_PAGE; // a scene is about a page
export const DEFAULT_TARGET_EIGHTHS = 120 * EIGHTHS_PER_PAGE; // a feature

/**
 * A target said as a kind, in the writer's word, and the pages each is read as. "A feature" is a decision; 120
 * is the app's reading of it, and a page count from the writer replaces both.
 */
export const TARGET_KINDS = {
  feature: { words: "a feature", eighths: 120 * 8 },
  hour: { words: "an hour", eighths: 60 * 8 },
  "half-hour": { words: "a half-hour", eighths: 30 * 8 },
};

/** "a feature", or "" when the target is a number or nothing. */
export function targetWords(state) {
  return TARGET_KINDS[state?.targetKind]?.words ?? "";
}
const MAX_NOTE_EIGHTHS = 30 * EIGHTHS_PER_PAGE;
const MAX_TARGET_EIGHTHS = 600 * EIGHTHS_PER_PAGE;

function clampEighths(value, fallback, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(1, Math.round(value)));
}

/** Total estimated length of the board, in eighths. */
// Pages beside the wall (R23, slice b): a scene's text lives on its card. A
// card with text is measured — its lines against a page's worth — in the
// same eighths the estimate uses (D23); a card without keeps the estimate.
export const LINES_PER_PAGE = 55;

/** Eighths of a page the scene's text runs to on the page; 0 when there is no text. */
export function measuredEighths(text) {
  const lines = sceneLineCount(text);
  if (lines === 0) return 0;
  return Math.max(1, Math.round((lines / LINES_PER_PAGE) * EIGHTHS_PER_PAGE));
}

/** The card's length as every reading should take it: measured when written, estimated otherwise. */
export function noteEighths(note) {
  const measured = measuredEighths(note?.text);
  return measured > 0 ? measured : (note?.lengthEighths ?? DEFAULT_NOTE_EIGHTHS);
}

/** True when the card's length comes from its text rather than the estimate. */
export function isMeasured(note) {
  return measuredEighths(note?.text) > 0;
}

export function boardEighths(state) {
  return state.notes.reduce((total, note) => total + (inStory(note) ? noteEighths(note) : 0), 0);
}

/**
 * Eighths as pages the way a breakdown writes them: "1 3/8", "97", "2 1/2"
 * reduced to "2 4/8"'s plain form. Whole pages lose the fraction entirely.
 */
export function formatPages(eighths) {
  const whole = Math.floor(eighths / EIGHTHS_PER_PAGE);
  const part = eighths % EIGHTHS_PER_PAGE;
  if (part === 0) return `${whole}`;
  if (whole === 0) return `${part}/8`;
  return `${whole} ${part}/8`;
}

/**
 * A page runs about a minute on screen (the industry's rule, an average over a
 * whole script): eighths as whole minutes, "about". Under an hour in minutes,
 * over in hours and minutes.
 */
export function formatMinutes(eighths) {
  // Whole minutes, rounded down: "about 17" for seventeen and a half.
  const minutes = Math.floor(eighths / EIGHTHS_PER_PAGE);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours} h ${rest} min`;
}

export const NOTE_WIDTH = 192;
export const NOTE_HEIGHT = 192;

// How far a dropped card's centre may sit outside the *other* members' bounds
// and still belong to the group. It has to cover a whole neighbouring card:
// the first card of a row sits a card-width from the rest, and dropping it in
// place must not eject it. (It did, at 80px, until undo's tests caught it.)
const SETTLE_MARGIN = NOTE_WIDTH + 40;

export function newId() {
  const maybe = globalThis.crypto;
  if (maybe && typeof maybe.randomUUID === "function") return maybe.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function emptyState() {
  return {
    logline: "",
    targetEighths: DEFAULT_TARGET_EIGHTHS,
    targetOpen: "",
    // The writer's word for the target when they gave a kind and not a number — "a feature" — or nothing (round twenty-two, entry 91).
    targetKind: "",
    loglineOpen: "",
    characters: [],
    notes: [],
    groups: [],
    threads: [],
    arrows: [],
    lock: null,
    revision: null,
    left: [],
  };
}

export function seedState(now = nowIso()) {
  const mk = (id, headline, change, color, x, y, rotate, z, characterIds) => ({
    id,
    headline,
    change,
    color,
    x,
    y,
    rotate,
    z,
    rank: "scene",
    // Unsized until someone sizes it: null claims nothing, and reads as about a page (noteEighths).
    lengthEighths: null,
    characterIds,
    maybeCharacterIds: [],
    location: "",
    // The writer's words for why the place is not decided (R61), or nothing.
    locationOpen: "",
    when: "",
    // The writer's words for why the when is not decided (R61), or nothing.
    whenOpen: "",
    // The writer's words for why the change line is not decided (R67), or nothing.
    changeOpen: "",
    // Set aside (R66): on the wall and not in the film.
    aside: false,
    text: "",
    plants: false,
    // What the fold plants, in the writer's words (R62), or nothing.
    plantsWhat: "",
    // Another version of another card (R65): the card this one stands behind, or null.
    alternativeOf: null,
    // A fold that pays off on another board — a later episode — names it here;
    // null claims nothing (R50). The scene there that pays it off, once one
    // does (R58); null while the board is a promise.
    payoffBoardId: null,
    payoffNoteId: null,
    // Open: the writer's words for what is not decided about this card, or
    // nothing (R59). While they stand the reading lists the card and asks
    // nothing else of it.
    open: "",
    createdAt: now,
    updatedAt: now,
  });

  return {
    // Left empty on purpose: the placeholder asks the question, which is how a
    // new writer finds out the logline is there at all.
    logline: "",
    targetEighths: DEFAULT_TARGET_EIGHTHS,
    targetOpen: "",
    // The writer's word for the target when they gave a kind and not a number — "a feature" — or nothing (round twenty-two, entry 91).
    targetKind: "",
    loglineOpen: "",
    // Two people, cast on the cards, so a new writer sees what the roster is for.
    characters: [
      fillCharacter({ id: "maya", name: "Maya", createdAt: now, updatedAt: now }),
      fillCharacter({ id: "tom", name: "Tom", createdAt: now, updatedAt: now }),
    ],
    notes: [
      mk("maya-letter", "Maya finds the letter", "She decides not to tell Tom.", "yellow", 88, 120, -2.2, 1, ["maya"]),
      mk("tom-lies", "Tom lies about the job", "Maya starts to doubt him.", "pink", 320, 168, 1.6, 2, ["tom", "maya"]),
      mk("letter-aloud", "The letter is read aloud", "The plan dies in the room.", "blue", 196, 340, 0.8, 3, ["maya", "tom"]),
    ],
    groups: [],
    threads: [],
    arrows: [],
    lock: null,
    revision: null,
    left: [],
  };
}

// Deliberately unchanged by the arrival of `logline`. Validation stays as loose
// as it was so that no board which was valid yesterday becomes invalid today —
// a stricter check here would reject saved projects and lose someone's wall.
// Shape is repaired in normalizeState instead.
export function isBoardState(value) {
  if (!value || typeof value !== "object") return false;
  return (
    Array.isArray(value.notes) &&
    Array.isArray(value.groups) &&
    Array.isArray(value.arrows)
  );
}

/**
 * Fill in fields added after a board was written. Every load boundary — the
 * browser store, the dev bridge, the MCP server, an opened project file — runs
 * a board through this so the rest of the code can assume the current shape.
 */
export function normalizeState(value) {
  if (!isBoardState(value)) return emptyState();
  const logline = typeof value.logline === "string" ? value.logline : "";

  const targetEighths = clampEighths(
    value.targetEighths,
    DEFAULT_TARGET_EIGHTHS,
    MAX_TARGET_EIGHTHS,
  );

  // Arrows written before R30 have no kind. They are "follows": a setup is a
  // claim you make deliberately, so the default has to be the one that claims
  // nothing.
  let arrowsPatched = false;
  const arrows = value.arrows.map((arrow) => {
    if (arrow && ARROW_KINDS.includes(arrow.kind)) return arrow;
    arrowsPatched = true;
    return { ...arrow, kind: "follows" };
  });

  // Boards written before R29 have no roster. A card's cast is filtered to the
  // roster, so a dangling id (a character removed by an older build) is dropped
  // rather than left to point at nobody.
  // Rosters written before R36 have no page fields; they are empty until filled.
  const characters = Array.isArray(value.characters)
    ? value.characters.filter(isCharacter).map(fillCharacter)
    : [];
  const rosterPatched =
    !Array.isArray(value.characters) ||
    characters.length !== value.characters.length ||
    characters.some((character, index) => character !== value.characters[index]);

  // Cards written before R20 have no rank. They are scenes: a beat is something
  // you mark deliberately, so the safe default is the one that claims nothing.
  // Cards written before R25 have no length; a scene is about a page. Cards
  // written before R29 have no cast; nobody is in the scene until someone is.
  let patched = false;

  const rawIds = new Set((value.notes ?? []).map((item) => item?.id).filter((id) => typeof id === "string"));  const notes = value.notes.map((note) => {
    const rank = note && NOTE_RANKS.includes(note.rank) ? note.rank : "scene";
    // Unsized stays unsized: null (or no field, before R25) claims nothing and
    // reads as about a page. A number is the writer's estimate, kept in range.
    const lengthEighths =
      note?.lengthEighths === null || note?.lengthEighths === undefined
        ? null
        : clampEighths(note.lengthEighths, DEFAULT_NOTE_EIGHTHS, MAX_NOTE_EIGHTHS);
    const characterIds = knownCast(note?.characterIds, characters);
    // Cards written before the maybe (round twenty-two, H9) have nobody who may be there; a person on the cast line is certainly in the scene, and certain wins.
    const maybeCharacterIds = knownCast(note?.maybeCharacterIds, characters).filter((id) => !characterIds.includes(id));
    // Cards written before R31 have no fold; a plant is a claim you make.
    const plants = note?.plants === true;
    // Cards folded before R62 say "something": the fold's words are the writer's, or nothing.
    const plantsWhat = plants && typeof note?.plantsWhat === "string" ? note.plantsWhat : "";
    // Cards written before R50 pay off on their own board or not at all.
    const payoffBoardId = plants && typeof note?.payoffBoardId === "string" && note.payoffBoardId ? note.payoffBoardId : null;
    // Cards written before R58 name a board and no scene on it.
    const payoffNoteId = payoffBoardId && typeof note?.payoffNoteId === "string" && note.payoffNoteId ? note.payoffNoteId : null;
    // Cards written before R59 are not open; a card claims to be decided until the writer says otherwise.
    const open = typeof note?.open === "string" ? note.open : "";
    // Cards written before R65 are versions of nothing; a version whose sibling is gone, or of itself, stands as a plain card.
    const alternativeOf = typeof note?.alternativeOf === "string" && note.alternativeOf !== note?.id && rawIds.has(note.alternativeOf) ? note.alternativeOf : null;
    // Cards written before R37 have no place; a scene is nowhere until it is.
    const location = typeof note?.location === "string" ? note.location : "";
    // Cards written before R61's edge have no open place; a place is decided or blank until the writer says otherwise.
    const locationOpen = typeof note?.locationOpen === "string" ? note.locationOpen : "";
    // Cards written before R55 have no when; a scene is at no time until it is.
    const when = typeof note?.when === "string" ? note.when : "";
    // Cards written before R61 have no open when; a when is decided or blank until the writer says otherwise.
    const whenOpen = typeof note?.whenOpen === "string" ? note.whenOpen : "";
    // Cards written before R67 have no open change line; a change line is decided or waiting until the writer says why it waits.
    const changeOpen = typeof note?.changeOpen === "string" ? note.changeOpen : "";
    // Cards written before R66 are in the film; nothing is set aside until the writer sets it aside.
    const aside = note?.aside === true;
    // Cards written before pages (R23 b) have no text; a scene is unwritten until it is.
    const text = typeof note?.text === "string" ? note.text : "";
    if (
      note &&
      note.rank === rank &&
      note.lengthEighths === lengthEighths &&
      Array.isArray(note.characterIds) &&
      sameIds(note.characterIds, characterIds) &&
      Array.isArray(note.maybeCharacterIds) &&
      sameIds(note.maybeCharacterIds, maybeCharacterIds) &&
      note.plants === plants &&
      note.plantsWhat === plantsWhat &&
      note.alternativeOf === alternativeOf &&
      note.payoffBoardId === payoffBoardId &&
      note.payoffNoteId === payoffNoteId &&
      note.open === open &&
      note.location === location &&
      note.locationOpen === locationOpen &&
      note.when === when &&
      note.whenOpen === whenOpen &&
      note.changeOpen === changeOpen &&
      note.aside === aside &&
      note.text === text
    ) {
      return note;
    }
    patched = true;
    return { ...note, rank, lengthEighths, characterIds, maybeCharacterIds, plants, plantsWhat, alternativeOf, payoffBoardId, payoffNoteId, open, location, locationOpen, when, whenOpen, changeOpen, aside, text };
  });
  // A version of a version is a version of the front card, so the pair stays a pair.
  for (const [index, note] of notes.entries()) {
    if (!note.alternativeOf) continue;
    const front = notes.find((item) => item.id === note.alternativeOf);
    if (front?.alternativeOf) {
      patched = true;
      notes[index] = { ...note, alternativeOf: front.alternativeOf === note.id ? null : front.alternativeOf };
    }
  }

  // Boards written before the production half (Roadmap 2, item 8) have no
  // lock and no revision; both are null until a draft goes out.
  const lock = value.lock && typeof value.lock === "object" && value.lock.numbers ? value.lock : null;
  const revision = value.revision && typeof value.revision === "object" && typeof value.revision.name === "string" ? value.revision : null;
  // Boards written before R53 have no left questions: nothing is left until
  // the writer leaves it.
  const left = Array.isArray(value.left) ? value.left.filter(isLeftQuestion) : [];
  const leftPatched = !Array.isArray(value.left) || left.length !== value.left.length;
  // Boards written before R60 have no threads: a wall has none until the
  // writer names one. A thread that names a card the board no longer holds
  // drops that card; a thread with no name is not a thread.
  const noteIdSet = new Set(notes.map((note) => note.id));
  let threadsPatched = !Array.isArray(value.threads);
  const threads = (Array.isArray(value.threads) ? value.threads : [])
    .map((thread) => {
      if (!thread || typeof thread !== "object" || typeof thread.id !== "string" || typeof thread.name !== "string" || !thread.name.trim()) {
        threadsPatched = true;
        return null;
      }
      const noteIds = Array.isArray(thread.noteIds) ? thread.noteIds.filter((id, index) => typeof id === "string" && noteIdSet.has(id) && thread.noteIds.indexOf(id) === index) : [];
      const startOpen = thread.startOpen === true;
      const endOpen = thread.endOpen === true;
      if (Array.isArray(thread.noteIds) && noteIds.length === thread.noteIds.length && thread.startOpen === startOpen && thread.endOpen === endOpen) return thread;
      threadsPatched = true;
      return { ...thread, noteIds, startOpen, endOpen };
    })
    .filter(Boolean);
  // Boards written before R61 have no open logline; a logline is decided or blank until the writer says otherwise.
  const loglineOpen = typeof value.loglineOpen === "string" ? value.loglineOpen : "";
  // A target left open in the writer's words (the handover's calls, 2026-09-19): the number stands as the default meanwhile.
  const targetOpen = typeof value.targetOpen === "string" ? value.targetOpen : "";
  // Boards written before the target kept the writer's word have a number and no word: nothing is claimed.
  const targetKind = TARGET_KINDS[value.targetKind] ? value.targetKind : "";
  if (
    value.logline === logline &&
    value.loglineOpen === loglineOpen &&
    value.targetEighths === targetEighths &&
    value.targetOpen === targetOpen &&
    value.targetKind === targetKind &&
    !rosterPatched &&
    !arrowsPatched &&
    !patched &&
    value.lock === lock &&
    value.revision === revision &&
    !leftPatched &&
    !threadsPatched
  ) {
    return value;
  }
  return {
    ...value,
    logline,
    loglineOpen,
    targetEighths,
    targetOpen,
    targetKind,
    characters,
    notes: patched ? notes : value.notes,
    arrows: arrowsPatched ? arrows : value.arrows,
    lock,
    revision,
    left,
    threads,
  };
}

/** Beats vs scenes. The app shows this number and passes no judgement (D21). */
export function countRanks(state) {
  // A card behind another as its other version (R65) is out of the story, so
  // out of this count: nine cards with two behind are seven (round twenty-two, entry 20).
  const counted = state.notes.filter((note) => inStory(note));
  let beats = 0;
  for (const note of counted) if (note.rank === "beat") beats += 1;
  return { beats, scenes: counted.length - beats };
}

function maxZ(notes) {
  return notes.reduce((top, note) => Math.max(top, note.z), 0);
}

function bump(note, patch, now) {
  return { ...note, ...patch, updatedAt: now };
}

/** The writer's words for what is open about a card, one line, spaces collapsed; empty closes it (R59). */
function cleanOpen(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}


// --- Order (R56, moved here for R62) -------------------------------------
//
// Story order is the follows arrows where they exist and the wall's reading
// order — rows top to bottom, cards left to right — where they do not. The
// reading composes everything from it; the kernel needs it to hold a
// thread's cards in story order, so the tie rule folds the first card and
// not the last one the writer happened to add.

/** Cards within half a card's height of each other sit on one row. */
const ROW_TOLERANCE = NOTE_HEIGHT / 2;

/**
 * In the film: not another version behind a card (R65), and not set aside
 * (R66). Everything that reads the story — the order, the count, the pages,
 * the exports, organize, the reading — asks this and nothing else.
 */
export function inStory(note) {
  return !note.alternativeOf && note.aside !== true;
}

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

/**
 * Cards in reading order: banded into rows by y, then left to right. A free
 * wall has no rows, so this is the order a person's eye takes across it.
 */
/**
 * Story order: reading order, with each follows arrow pulling its source in
 * front of its target; a pair pointing both ways is a tie and reading order
 * keeps it. The order organize lays the wall out in, and the order every
 * reading, numbering and page uses (R56). Returns the notes.
 */
export function storyOrder(state, ids) {
  const scope = ids ? new Set(ids) : null;
  const notes = state.notes.filter((note) => inStory(note) && (!scope || scope.has(note.id)));
  const reading = readingOrder(notes);
  const byId = new Map(reading.map((note) => [note.id, note]));
  const rank = new Map(reading.map((note, index) => [note.id, index]));
  const preds = new Map(reading.map((note) => [note.id, []]));
  for (const arrow of state.arrows ?? []) {
    if (arrow.kind === "setup") continue;
    if (!rank.has(arrow.from) || !rank.has(arrow.to)) continue;
    preds.get(arrow.to).push(arrow.from);
  }
  for (const list of preds.values()) list.sort((a, b) => rank.get(a) - rank.get(b));
  const placed = new Set();
  const visiting = new Set();
  const order = [];
  function visit(id) {
    if (placed.has(id) || visiting.has(id)) return;
    visiting.add(id);
    for (const from of preds.get(id)) {
      if (preds.get(from).includes(id)) continue;
      visit(from);
    }
    visiting.delete(id);
    placed.add(id);
    order.push(byId.get(id));
  }
  for (const note of reading) visit(note.id);
  return order;
}
/**
 * The combine log's rule, both halves (R60, R62). A thread tied at both ends
 * through two or more cards is a plant between two scenes that exist, and
 * that is the fold's and the setup arrow's to draw: when the first card's
 * fold is free — unfolded, or folded for the same thing, or folded with no
 * words — the card is folded, the fold takes the thread's name, and a setup
 * arrow runs from the first card to the last. When the first card's fold is
 * another thing's, the thread stays a thread and nothing is drawn. Returns
 * the state and what it did, so the door can say it.
 */
function tieIntoFold(state, thread, now) {
  const none = { state, fold: null };
  if (thread.startOpen || thread.endOpen || thread.noteIds.length < 2) return none;
  const firstId = thread.noteIds[0];
  const lastId = thread.noteIds[thread.noteIds.length - 1];
  const first = state.notes.find((note) => note.id === firstId);
  if (!first) return none;
  const what = first.plantsWhat ?? "";
  if (first.plants && what && what.toLowerCase() !== thread.name.toLowerCase()) {
    return { state, fold: { kept: true, firstId, what } };
  }
  let next = state;
  const folded = !first.plants;
  const named = !what;
  if (folded || named) {
    next = {
      ...next,
      notes: next.notes.map((note) => (note.id === firstId ? bump(note, { plants: true, plantsWhat: thread.name }, now) : note)),
    };
  }
  // One arrow per direction between two cards (R15): a follows arrow already
  // running from the first card to the last means the payoff is the very next
  // scene, and the setup cannot be drawn over it.
  const existing = next.arrows.find((arrow) => arrow.from === firstId && arrow.to === lastId);
  let arrow = null;
  const adjacent = Boolean(existing && existing.kind !== "setup");
  if (!existing) {
    const drawn = applyCommand(next, { type: "create_arrow", from: firstId, to: lastId, kind: "setup" }, now);
    if (drawn.changed) {
      next = drawn.state;
      arrow = { from: firstId, to: lastId };
    }
  }
  return { state: next, fold: { kept: false, firstId, lastId, folded, named, arrow, adjacent } };
}

/** A thread's name as the writer typed it, one line, spaces collapsed (R60). */
function cleanThreadName(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

/** A when as the writer typed it, one line, spaces collapsed. */
function cleanWhen(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function pruneGroups(groups) {
  return groups.filter((group) => group.noteIds.length >= 2);
}

export function applyCommand(state, command, now = nowIso()) {
  switch (command.type) {
    // The logline, or the writer's words for why there is none yet (R61): a
    // value clears the open words, open words clear the value, and open ""
    // leaves the field blank.
    case "set_logline": {
      const hasOpen = typeof command.open === "string";
      const logline = hasOpen && command.open.trim() ? "" : typeof command.logline === "string" ? command.logline.trim() : (state.logline ?? "");
      const loglineOpen = hasOpen ? cleanOpen(command.open) : logline ? "" : (state.loglineOpen ?? "");
      if (logline === (state.logline ?? "") && loglineOpen === (state.loglineOpen ?? "")) return { state, changed: false };
      return { state: { ...state, logline, loglineOpen }, changed: true, result: { logline, loglineOpen } };
    }

    case "create_note": {
      const n = state.notes.length;
      const note = {
        id: command.id ?? newId(),
        headline: command.headline ?? "New beat",
        // The change line left open by the writer's word (R67): the placeholder stands, and the words say why.
        change: cleanOpen(command.changeOpen) ? "What changes?" : (command.change ?? "What changes?"),
        changeOpen: cleanOpen(command.changeOpen),
        aside: false,
        color: command.color ?? NOTE_COLORS[n % NOTE_COLORS.length],
        x: command.x ?? 140 + (n % 5) * 28,
        y: command.y ?? 140 + (n % 4) * 24,
        rotate: command.rotate ?? ((n % 5) - 2) * 1.1,
        rank: NOTE_RANKS.includes(command.rank) ? command.rank : "scene",
        lengthEighths:
          command.lengthEighths === undefined || command.lengthEighths === null
            ? null
            : clampEighths(command.lengthEighths, DEFAULT_NOTE_EIGHTHS, MAX_NOTE_EIGHTHS),
        characterIds: knownCast(command.characterIds, state.characters ?? []),
        // Who may or may not be in it, by the writer's word: listed as open, counted neither way.
        maybeCharacterIds: knownCast(command.maybeCharacterIds, state.characters ?? []).filter((id) => !knownCast(command.characterIds, state.characters ?? []).includes(id)),
        alternativeOf: null,
        plants: command.plants === true || Boolean(cleanOpen(command.plantsWhat)),
        // What it plants, in the writer's words (R62): naming a plant folds the card.
        plantsWhat: command.plants === false ? "" : cleanOpen(command.plantsWhat),
        payoffBoardId: null,
        payoffNoteId: null,
        open: cleanOpen(command.open),
        location: cleanOpen(command.locationOpen) ? "" : cleanPlace(command.location),
        locationOpen: cleanOpen(command.locationOpen),
        when: cleanOpen(command.whenOpen) ? "" : cleanWhen(command.when),
        whenOpen: cleanOpen(command.whenOpen),
        text: typeof command.text === "string" ? command.text : "",
        z: maxZ(state.notes) + 1,
        createdAt: now,
        updatedAt: now,
      };
      return {
        state: { ...state, notes: [...state.notes, note] },
        changed: true,
        result: note,
      };
    }

    case "update_note": {
      let updated;
      const notes = state.notes.map((note) => {
        if (note.id !== command.id) return note;
        const patch = {};
        if (command.headline !== undefined) patch.headline = command.headline;
        if (command.change !== undefined) {
          patch.change = command.change;
          // A change line decides it: the open words go, as a place's do (R67).
          if (command.change.trim() && command.change.trim() !== "What changes?") patch.changeOpen = "";
        }
        // Open words say the change line is not decided: the line goes back to waiting, and "" takes the words back.
        if (typeof command.changeOpen === "string") {
          patch.changeOpen = cleanOpen(command.changeOpen);
          if (patch.changeOpen) patch.change = "What changes?";
        }
        if (command.location !== undefined) patch.location = cleanPlace(command.location);
        if (command.when !== undefined) patch.when = cleanWhen(command.when);
        updated = bump(note, patch, now);
        return updated;
      });
      if (!updated) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: updated };
    }

    case "move_note": {
      let moved;
      const notes = state.notes.map((note) => {
        if (note.id !== command.id) return note;
        moved = bump(note, { x: command.x, y: command.y }, now);
        return moved;
      });
      if (!moved) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: moved };
    }

    case "nudge_notes": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      const notes = state.notes.map((note) =>
        ids.has(note.id)
          ? bump(note, { x: note.x + command.dx, y: note.y + command.dy }, now)
          : note,
      );
      return { state: { ...state, notes }, changed: true };
    }

    case "set_length": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      // null unsizes: the card claims nothing again and reads as about a page
      // (round thirteen, entry 16: there was no way back from a length).
      const lengthEighths =
        command.lengthEighths === null
          ? null
          : clampEighths(command.lengthEighths, DEFAULT_NOTE_EIGHTHS, MAX_NOTE_EIGHTHS);
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id) || note.lengthEighths === lengthEighths) return note;
        const next = bump(note, { lengthEighths }, now);
        touched.push(next);
        return next;
      });
      if (touched.length === 0) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: touched };
    }

    case "set_target": {
      // A number decides the target and clears the open words; open words
      // leave the number where it is (the default, or the last one set) and
      // say the writer has not decided; open "" takes the words back.
      // A kind is the writer's word — "a feature" — kept beside the pages it is read as (round twenty-two, entry 91):
      // the app does not put 120 in a writer's mouth, and a feature's writer no longer reads as "no target set".
      // A number given later is a number: it clears the word. Open words clear it too.
      const hasOpen = typeof command.open === "string";
      const kind = TARGET_KINDS[command.kind] ? command.kind : "";
      const asNumber = kind ? TARGET_KINDS[kind].eighths : typeof command.targetEighths === "number" ? command.targetEighths : null;
      const targetOpen = hasOpen ? cleanOpen(command.open) : asNumber !== null ? "" : (state.targetOpen ?? "");
      const targetEighths = asNumber !== null ? clampEighths(asNumber, DEFAULT_TARGET_EIGHTHS, MAX_TARGET_EIGHTHS) : state.targetEighths;
      const targetKind = kind ? kind : asNumber !== null || (hasOpen && targetOpen) ? "" : (state.targetKind ?? "");
      if (targetEighths === state.targetEighths && targetOpen === (state.targetOpen ?? "") && targetKind === (state.targetKind ?? "")) return { state, changed: false };
      return { state: { ...state, targetEighths, targetOpen, targetKind }, changed: true, result: { targetEighths, targetOpen, targetKind } };
    }

    case "set_rank": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      const rank = NOTE_RANKS.includes(command.rank) ? command.rank : "scene";
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id) || note.rank === rank) return note;
        const next = bump(note, { rank }, now);
        touched.push(next);
        return next;
      });
      if (touched.length === 0) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: touched };
    }

    case "recolor_notes": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      const changedNotes = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id)) return note;
        const next = bump(note, { color: command.color }, now);
        changedNotes.push(next);
        return next;
      });
      const painted = changedNotes.length > 0;
      return {
        state: painted ? { ...state, notes } : state,
        changed: painted,
        result: changedNotes,
      };
    }

    case "raise_note": {
      const top = maxZ(state.notes) + 1;
      let raised = false;
      const notes = state.notes.map((note) => {
        if (note.id !== command.id) return note;
        raised = true;
        return { ...note, z: top };
      });
      if (!raised) return { state, changed: false };
      return { state: { ...state, notes }, changed: true };
    }

    case "delete_note": {
      const gone = state.notes.find((note) => note.id === command.id);
      if (!gone) return { state, changed: false };
      const headlineOf = (id) => state.notes.find((note) => note.id === id)?.headline ?? id;
      let notes = state.notes.filter((note) => note.id !== command.id);
      const taken = state.arrows.filter((arrow) => arrow.from === command.id || arrow.to === command.id);
      let arrows = state.arrows.filter((arrow) => !taken.includes(arrow));
      // A card wired into a chain — one follows in, one follows out — leaves
      // the chain joined behind it, as move_scene does; undo takes the join
      // back with the card (round fourteen, entry 20).
      const ins = taken.filter((arrow) => arrow.kind !== "setup" && arrow.to === command.id);
      const outs = taken.filter((arrow) => arrow.kind !== "setup" && arrow.from === command.id);
      let joined = null;
      if (ins.length === 1 && outs.length === 1 && ins[0].from !== outs[0].to && !arrows.some((arrow) => arrow.from === ins[0].from && arrow.to === outs[0].to)) {
        joined = { id: newId(), from: ins[0].from, to: outs[0].to, kind: "follows" };
        arrows = [...arrows, joined];
      }
      const left = [];
      const groups = pruneGroups(
        state.groups.map((group) => {
          if (!group.noteIds.includes(command.id)) return group;
          const noteIds = group.noteIds.filter((id) => id !== command.id);
          left.push({ id: group.id, title: group.title, remaining: noteIds.length, dissolved: noteIds.length < 2 });
          return { ...group, noteIds };
        }),
      );
      // A thread through the card keeps its name and loses the card (R60);
      // the thread stays, with one card fewer, so the writer can retie it.
      // A version whose front card goes stands as a plain card (R65).
      notes = notes.map((note) => (note.alternativeOf === command.id ? { ...note, alternativeOf: null } : note));
      const threadsLeft = [];
      const threads = (state.threads ?? []).map((thread) => {
        if (!thread.noteIds.includes(command.id)) return thread;
        const noteIds = thread.noteIds.filter((id) => id !== command.id);
        threadsLeft.push({ id: thread.id, name: thread.name, remaining: noteIds.length });
        return { ...thread, noteIds };
      });
      // The result says what went with the card, so a door can say it too
      // (round thirteen, entry 17: "Deleted card." and nothing of the arrows).
      return {
        state: { ...state, notes, arrows, groups, threads },
        changed: true,
        result: {
          id: command.id,
          headline: gone.headline,
          // The fold and where it paid off go with the card too; a door that
          // says what went should say these (round fifteen, entry 17).
          plants: gone.plants === true,
          payoffBoardId: gone.payoffBoardId ?? null,
          payoffNoteId: gone.payoffNoteId ?? null,
          arrows: taken.map((arrow) => ({ ...arrow, fromHeadline: headlineOf(arrow.from), toHeadline: headlineOf(arrow.to) })),
          joined: joined ? { ...joined, fromHeadline: headlineOf(joined.from), toHeadline: headlineOf(joined.to) } : null,
          groups: left,
          threads: threadsLeft,
        },
      };
    }

    case "apply_poses": {
      const byId = new Map(command.poses.map((pose) => [pose.id, pose]));
      if (byId.size === 0) return { state, changed: false };
      // Only a card that actually moves is touched, so a tidy that leaves a
      // card where it was does not stamp it (round fourteen, entry 43).
      let moved = 0;
      const notes = state.notes.map((note) => {
        const pose = byId.get(note.id);
        if (!pose || (note.x === pose.x && note.y === pose.y && note.rotate === pose.rotate)) return note;
        moved += 1;
        return bump(note, { x: pose.x, y: pose.y, rotate: pose.rotate }, now);
      });
      if (moved === 0) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: { moved } };
    }

    case "settle_note": {
      const note = state.notes.find((item) => item.id === command.id);
      if (!note) return { state, changed: false };
      // Only a card that actually left its frame is a change. A drop that
      // changes nothing must say so, or it becomes an empty undo step (R33).
      let touched = false;
      const groups = pruneGroups(
        state.groups.map((group) => {
          if (!group.noteIds.includes(command.id)) return group;
          const others = state.notes.filter(
            (item) => item.id !== command.id && group.noteIds.includes(item.id),
          );
          if (others.length === 0) {
            touched = true;
            return { ...group, noteIds: [] };
          }
          const left = Math.min(...others.map((item) => item.x)) - SETTLE_MARGIN;
          const top = Math.min(...others.map((item) => item.y)) - SETTLE_MARGIN;
          const right = Math.max(...others.map((item) => item.x + NOTE_WIDTH)) + SETTLE_MARGIN;
          const bottom = Math.max(...others.map((item) => item.y + NOTE_HEIGHT)) + SETTLE_MARGIN;
          const cx = note.x + NOTE_WIDTH / 2;
          const cy = note.y + NOTE_HEIGHT / 2;
          const inside = cx > left && cx < right && cy > top && cy < bottom;
          if (inside) return group;
          touched = true;
          return { ...group, noteIds: group.noteIds.filter((id) => id !== command.id) };
        }),
      );
      if (!touched) return { state, changed: false };
      return { state: { ...state, groups }, changed: true };
    }

    // Two versions of one scene (R65): a card set behind another as its
    // alternative leaves the story — the order, the count, the pages — and
    // waits there until the writer chooses one. The reading lists the pair.
    case "set_alternative": {
      const note = state.notes.find((item) => item.id === command.id);
      if (!note) return { state, changed: false };
      const of = typeof command.of === "string" && command.of ? command.of : null;
      if (of === null) {
        if (!note.alternativeOf) return { state, changed: false };
        const notes = state.notes.map((item) => (item.id === command.id ? bump(item, { alternativeOf: null }, now) : item));
        return { state: { ...state, notes }, changed: true, result: { id: command.id, of: null, arrowsDropped: 0 } };
      }
      const front = state.notes.find((item) => item.id === of);
      if (!front || of === command.id || front.alternativeOf || state.notes.some((item) => item.alternativeOf === command.id)) return { state, changed: false };
      if (note.alternativeOf === of) return { state, changed: false };
      // Out of the story: its follows arrows go with it; setup arrows are claims and stay.
      const arrows = state.arrows.filter((arrow) => arrow.kind === "setup" || (arrow.from !== command.id && arrow.to !== command.id));
      const notes = state.notes.map((item) => (item.id === command.id ? bump(item, { alternativeOf: of, aside: false }, now) : item));
      return { state: { ...state, notes, arrows }, changed: true, result: { id: command.id, of, arrowsDropped: state.arrows.length - arrows.length } };
    }

    // Choose one of two versions (R65): the chosen card is the scene, in the
    // front card's place; the other goes, or stands beside it as a plain
    // card when the writer says keep.
    case "choose_version": {
      const chosen = state.notes.find((item) => item.id === command.id);
      if (!chosen) return { state, changed: false };
      const other = chosen.alternativeOf ? state.notes.find((item) => item.id === chosen.alternativeOf) : state.notes.find((item) => item.alternativeOf === chosen.id);
      if (!other) return { state, changed: false };
      const frontId = chosen.alternativeOf ? other.id : chosen.id;
      let notes = state.notes;
      let arrows = state.arrows;
      let groups = state.groups;
      let threads = state.threads ?? [];
      if (chosen.alternativeOf) {
        // The alternative steps forward: the front's arrows, place in the order, rank and group are its now.
        arrows = arrows.map((arrow) => ({ ...arrow, from: arrow.from === frontId ? chosen.id : arrow.from, to: arrow.to === frontId ? chosen.id : arrow.to })).filter((arrow) => arrow.from !== arrow.to);
        groups = groups.map((group) => (group.noteIds.includes(frontId) ? { ...group, noteIds: group.noteIds.map((id) => (id === frontId ? chosen.id : id)) } : group));
        // What was tied to the scene comes with it, not only what was tied to the card (round twenty-two, entry 59:
        // "the keys are first seen in the depot, either way of it"). The front card's fold, when the chosen one has none of
        // its own; and every thread through the front card, which would otherwise hold the id of a card that is gone.
        const inheritsFold = !chosen.plants && other.plants;
        notes = notes.map((item) =>
          item.id === chosen.id
            ? bump(item, { alternativeOf: null, x: other.x, y: other.y, rank: other.rank, z: other.z, ...(inheritsFold ? { plants: true, plantsWhat: other.plantsWhat ?? "" } : {}) }, now)
            : item,
        );
        threads = threads.map((thread) =>
          thread.noteIds.includes(frontId) ? { ...thread, noteIds: [...new Set(thread.noteIds.map((id) => (id === frontId ? chosen.id : id)))] } : thread,
        );
        // Both versions may have carried an arrow to the same card: one pair of cards, one arrow, as create_arrow
        // holds. A follows arrow wins over a setup between the same two — the payoff is the very next scene, and the
        // fold says so on its own (R62's adjacent rule).
        const seen = new Map();
        for (const arrow of arrows) {
          const key = `${arrow.from}>${arrow.to}`;
          const held = seen.get(key);
          if (!held || (held.kind === "setup" && arrow.kind !== "setup")) seen.set(key, arrow);
        }
        arrows = arrows.filter((arrow) => seen.get(`${arrow.from}>${arrow.to}`) === arrow);
      }
      const keep = command.keep === true;
      if (keep) {
        // Kept is set aside (R66): on the wall where the writer can see it, and not in the film. The turn went
        // forward with the chosen card, so the kept one is a scene, not a second beat (round twenty-two, entries 47 to 50).
        notes = notes.map((item) => (item.id === other.id ? bump(item, { alternativeOf: null, aside: true, rank: "scene", x: item.x + 40, y: item.y + 40 }, now) : item));
        if (chosen.alternativeOf) {
          arrows = arrows.filter((arrow) => arrow.kind === "setup" || (arrow.from !== other.id && arrow.to !== other.id));
          groups = groups.map((group) => (group.noteIds.includes(other.id) ? { ...group, noteIds: group.noteIds.filter((id) => id !== other.id) } : group));
        }
      } else {
        notes = notes.filter((item) => item.id !== other.id);
        arrows = arrows.filter((arrow) => arrow.from !== other.id && arrow.to !== other.id);
        groups = pruneGroups(groups.map((group) => ({ ...group, noteIds: group.noteIds.filter((id) => id !== other.id) })));
      }
      // A card that is gone is on no thread; a kept one, set aside, is not in the film and leaves them too.
      threads = threads.map((thread) => (thread.noteIds.includes(other.id) ? { ...thread, noteIds: thread.noteIds.filter((id) => id !== other.id) } : thread));
      return { state: { ...state, notes, arrows, groups, threads }, changed: true, result: { chosen: chosen.id, other: other.id, kept: keep, steppedForward: Boolean(chosen.alternativeOf) } };
    }

    // Set aside (R66): on the wall and not in the film. The card keeps its
    // place on the wall, its words, its cast and its fold; it leaves the order,
    // the count, the pages and every export. Its follows arrows go, and where
    // it stood between two cards the story closes over it, so setting a scene
    // aside never breaks the chain; setup arrows are claims and stay. A beat
    // set aside is a scene: a turn that is not in the film is not a turn.
    // Brought back, it is a plain unwired card, and the wall asks where it goes.
    case "set_aside": {
      const ids = new Set((command.ids ?? []).filter((id) => state.notes.some((note) => note.id === id)));
      const aside = command.aside !== false;
      const moving = state.notes.filter((note) => ids.has(note.id) && (note.aside === true) !== aside && !(aside && note.alternativeOf));
      if (moving.length === 0) return { state, changed: false };
      const movingIds = new Set(moving.map((note) => note.id));
      let arrows = state.arrows;
      let closed = 0;
      let dropped = 0;
      if (aside) {
        for (const id of movingIds) {
          const ins = arrows.filter((arrow) => arrow.kind !== "setup" && arrow.to === id);
          const outs = arrows.filter((arrow) => arrow.kind !== "setup" && arrow.from === id);
          dropped += ins.length + outs.length;
          arrows = arrows.filter((arrow) => arrow.kind === "setup" || (arrow.from !== id && arrow.to !== id));
          if (ins.length === 1 && outs.length === 1 && ins[0].from !== outs[0].to && !arrows.some((arrow) => arrow.from === ins[0].from && arrow.to === outs[0].to)) {
            arrows = [...arrows, { id: newId(), from: ins[0].from, to: outs[0].to, kind: "follows" }];
            closed += 1;
          }
        }
      }
      // A card with versions behind it cannot go aside and leave them fronting nothing: they stand as plain cards.
      const notes = state.notes.map((note) => {
        if (movingIds.has(note.id)) return bump(note, aside ? { aside: true, rank: "scene" } : { aside: false }, now);
        if (aside && note.alternativeOf && movingIds.has(note.alternativeOf)) return bump(note, { alternativeOf: null }, now);
        return note;
      });
      const groups = aside ? pruneGroups(state.groups.map((group) => ({ ...group, noteIds: group.noteIds.filter((id) => !movingIds.has(id)) }))) : state.groups;
      const threads = aside ? (state.threads ?? []).map((thread) => (thread.noteIds.some((id) => movingIds.has(id)) ? { ...thread, noteIds: thread.noteIds.filter((id) => !movingIds.has(id)) } : thread)) : state.threads;
      return {
        state: { ...state, notes, arrows, groups, threads },
        changed: true,
        result: { ids: [...movingIds], aside, arrowsDropped: dropped, closedOver: closed },
      };
    }

    // A thread (R60): a named string through cards, either end open until the
    // writer ties it. A record of its own beside the fold and the setup arrow;
    // the reading asks about each loose end from that end.
    case "create_thread": {
      const name = cleanThreadName(command.name);
      if (!name) return { state, changed: false };
      const wanted = (command.noteIds ?? []).filter((id, index, all) => all.indexOf(id) === index && state.notes.some((note) => note.id === id));
      // Held in story order, whatever order the writer named them (R62).
      const noteIds = storyOrder(state, wanted).map((note) => note.id);
      const thread = {
        id: typeof command.id === "string" && command.id && !(state.threads ?? []).some((item) => item.id === command.id) ? command.id : newId(),
        name,
        noteIds,
        startOpen: command.startOpen === true,
        endOpen: command.endOpen === true,
      };
      const tied = tieIntoFold({ ...state, threads: [...(state.threads ?? []), thread] }, thread, now);
      return { state: tied.state, changed: true, result: { ...thread, fold: tied.fold } };
    }

    case "update_thread": {
      const current = (state.threads ?? []).find((thread) => thread.id === command.id);
      if (!current) return { state, changed: false };
      const exists = (id) => state.notes.some((note) => note.id === id);
      let noteIds = Array.isArray(command.noteIds) ? command.noteIds.filter((id, index, all) => all.indexOf(id) === index && exists(id)) : [...current.noteIds];
      if (Array.isArray(command.add)) for (const id of command.add) if (exists(id) && !noteIds.includes(id)) noteIds.push(id);
      if (Array.isArray(command.remove)) noteIds = noteIds.filter((id) => !command.remove.includes(id));
      // Held in story order, whatever order the cards were added (R62): the
      // rule below folds the first card in the story, not the last one named.
      noteIds = storyOrder(state, noteIds).map((note) => note.id);
      const name = command.name === undefined ? current.name : cleanThreadName(command.name) || current.name;
      const startOpen = typeof command.startOpen === "boolean" ? command.startOpen : current.startOpen;
      const endOpen = typeof command.endOpen === "boolean" ? command.endOpen : current.endOpen;
      if (name === current.name && startOpen === current.startOpen && endOpen === current.endOpen && sameIds(noteIds, current.noteIds) && noteIds.length === current.noteIds.length) {
        return { state, changed: false };
      }
      const next = { ...current, name, noteIds, startOpen, endOpen };
      // A fold this thread named follows a rename (R62), so the two never drift apart on the wall's word alone.
      let notes = state.notes;
      if (name !== current.name && noteIds.length) {
        const firstId = noteIds[0];
        notes = notes.map((note) => (note.id === firstId && note.plants && (note.plantsWhat ?? "").toLowerCase() === current.name.toLowerCase() ? bump(note, { plantsWhat: name }, now) : note));
      }
      const tied = tieIntoFold({ ...state, notes, threads: state.threads.map((thread) => (thread.id === command.id ? next : thread)) }, next, now);
      return {
        state: tied.state,
        changed: true,
        result: { thread: next, before: current, fold: tied.fold },
      };
    }

    case "delete_thread": {
      const gone = (state.threads ?? []).find((thread) => thread.id === command.id);
      if (!gone) return { state, changed: false };
      return { state: { ...state, threads: state.threads.filter((thread) => thread.id !== command.id) }, changed: true, result: gone };
    }

    case "create_group": {
      const noteIds = command.noteIds.filter((id) =>
        state.notes.some((note) => note.id === id),
      );
      if (noteIds.length < 2) return { state, changed: false };
      const idSet = new Set(noteIds);
      const group = {
        id: newId(),
        title: command.title ?? "Sequence",
        noteIds: [...noteIds],
      };
      const groups = [
        ...pruneGroups(
          state.groups.map((existing) => ({
            ...existing,
            noteIds: existing.noteIds.filter((id) => !idSet.has(id)),
          })),
        ),
        group,
      ];
      return { state: { ...state, groups }, changed: true, result: group };
    }

    case "ungroup": {
      if (!state.groups.some((group) => group.id === command.id)) {
        return { state, changed: false };
      }
      return {
        state: { ...state, groups: state.groups.filter((group) => group.id !== command.id) },
        changed: true,
      };
    }

    case "add_to_group": {
      // The agent's twin of dragging a card into a frame (round thirteen,
      // entry 18). Membership only: the frame reaches the card where it is,
      // and a card leaves any other group on the way, as create_group does.
      const group = state.groups.find((item) => item.id === command.id);
      if (!group) return { state, changed: false };
      const joining = command.noteIds.filter(
        (id, index) =>
          command.noteIds.indexOf(id) === index &&
          !group.noteIds.includes(id) &&
          state.notes.some((note) => note.id === id),
      );
      if (joining.length === 0) return { state, changed: false };
      const idSet = new Set(joining);
      const left = [];
      const groups = pruneGroups(
        state.groups.map((existing) => {
          if (existing.id === group.id) return { ...existing, noteIds: [...existing.noteIds, ...joining] };
          if (!existing.noteIds.some((id) => idSet.has(id))) return existing;
          const noteIds = existing.noteIds.filter((id) => !idSet.has(id));
          left.push({ id: existing.id, title: existing.title, remaining: noteIds.length, dissolved: noteIds.length < 2 });
          return { ...existing, noteIds };
        }),
      );
      const joined = groups.find((item) => item.id === group.id);
      return { state: { ...state, groups }, changed: true, result: { group: joined, added: joining, left } };
    }

    case "rename_group": {
      let renamed = false;
      const groups = state.groups.map((group) => {
        if (group.id !== command.id) return group;
        renamed = true;
        return { ...group, title: command.title };
      });
      if (!renamed) return { state, changed: false };
      return { state: { ...state, groups }, changed: true };
    }

    case "create_arrow": {
      if (command.from === command.to) return { state, changed: false };
      const knownFrom = state.notes.some((note) => note.id === command.from);
      const knownTo = state.notes.some((note) => note.id === command.to);
      if (!knownFrom || !knownTo) return { state, changed: false };
      // A follows arrow is a place in the story, and a card that is not in the film has none (R65, R66): a
      // version behind another, or a card set aside. A setup arrow is a claim, and either may carry one.
      const kindWanted = ARROW_KINDS.includes(command.kind) ? command.kind : "follows";
      if (kindWanted !== "setup" && state.notes.some((note) => (note.id === command.from || note.id === command.to) && !inStory(note))) return { state, changed: false };
      if (state.arrows.some((arrow) => arrow.from === command.from && arrow.to === command.to)) {
        return { state, changed: false };
      }
      const arrow = {
        id: newId(),
        from: command.from,
        to: command.to,
        kind: ARROW_KINDS.includes(command.kind) ? command.kind : "follows",
      };
      return {
        state: { ...state, arrows: [...state.arrows, arrow] },
        changed: true,
        result: arrow,
      };
    }

    case "set_arrow_kind": {
      const kind = ARROW_KINDS.includes(command.kind) ? command.kind : "follows";
      let changedArrow;
      const arrows = state.arrows.map((arrow) => {
        if (arrow.id !== command.id || arrow.kind === kind) return arrow;
        changedArrow = { ...arrow, kind };
        return changedArrow;
      });
      if (!changedArrow) return { state, changed: false };
      return { state: { ...state, arrows }, changed: true, result: changedArrow };
    }

    // A fresh wall. Everything goes, including the cast and the logline; the
    // target stays, because it belongs to the kind of thing you are writing,
    // not to the cards you had.
    case "new_board": {
      return {
        state: { ...emptyState(), targetEighths: state.targetEighths ?? DEFAULT_TARGET_EIGHTHS },
        changed: true,
      };
    }

    // --- Characters (R29): a roster the board maintains ---------------------

    case "add_character": {
      const name = typeof command.name === "string" ? command.name.trim() : "";
      if (!name) return { state, changed: false };
      const existing = state.characters.find((character) => sameName(character.name, name));
      // The same person twice is the thing a roster exists to prevent. Hand
      // back who it already is so a tool can say so.
      if (existing) return { state, changed: false, result: existing };
      const character = fillCharacter({ id: command.id ?? newId(), name, createdAt: now, updatedAt: now });
      return {
        state: { ...state, characters: [...state.characters, character] },
        changed: true,
        result: character,
      };
    }

    case "rename_character": {
      const name = typeof command.name === "string" ? command.name.trim() : "";
      if (!name) return { state, changed: false };
      const current = state.characters.find((character) => character.id === command.id);
      if (!current || current.name === name) return { state, changed: false };
      const taken = state.characters.find(
        (character) => character.id !== command.id && sameName(character.name, name),
      );
      if (taken) return { state, changed: false, result: taken };
      let renamed;
      const characters = state.characters.map((character) => {
        if (character.id !== command.id) return character;
        renamed = { ...character, name, updatedAt: now };
        return renamed;
      });
      return { state: { ...state, characters }, changed: true, result: renamed };
    }

    // The person's page (R36): any of the five lines, by id. Unknown fields
    // are ignored; a patch that changes nothing changes nothing.
    case "update_character": {
      const current = state.characters.find((character) => character.id === command.id);
      if (!current) return { state, changed: false };
      const patch = {};
      for (const field of PERSON_TEXT_FIELDS) {
        // Open words are cleaned as every open field's are; the page's lines are the writer's, as typed.
        const value = typeof command[field] === "string" ? (field === "open" ? cleanOpen(command[field]) : command[field]) : null;
        if (value !== null && value !== current[field]) patch[field] = value;
      }
      if (Object.keys(patch).length === 0) return { state, changed: false, result: current };
      const updated = { ...current, ...patch, updatedAt: now };
      const characters = state.characters.map((character) =>
        character.id === command.id ? updated : character,
      );
      return { state: { ...state, characters }, changed: true, result: updated };
    }

    case "remove_character": {
      if (!state.characters.some((character) => character.id === command.id)) {
        return { state, changed: false };
      }
      const characters = state.characters.filter((character) => character.id !== command.id);
      // Leaving the scene means leaving every card they were in.
      const notes = state.notes.map((note) =>
        note.characterIds.includes(command.id) || note.maybeCharacterIds.includes(command.id)
          ? bump(note, { characterIds: note.characterIds.filter((id) => id !== command.id), maybeCharacterIds: note.maybeCharacterIds.filter((id) => id !== command.id) }, now)
          : note,
      );
      return { state: { ...state, characters, notes }, changed: true, result: { id: command.id } };
    }

    case "set_cast": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      const cast = knownCast(command.characterIds, state.characters);
      // Who may be there (H9): given, it replaces the card's maybes; not given, the card keeps its own. Certain wins, so nobody is in both.
      const maybes = Array.isArray(command.maybeCharacterIds) ? knownCast(command.maybeCharacterIds, state.characters).filter((id) => !cast.includes(id)) : null;
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id)) return note;
        const maybe = maybes ?? note.maybeCharacterIds.filter((id) => !cast.includes(id));
        if (sameIds(note.characterIds, cast) && sameIds(note.maybeCharacterIds, maybe)) return note;
        const next = bump(note, { characterIds: [...cast], maybeCharacterIds: [...maybe] }, now);
        touched.push(next);
        return next;
      });
      if (touched.length === 0) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: touched };
    }

    // Start from a structure (R38): the template's beats become beat cards in
    // one row above the wall's cards, prompts on their change lines. Nothing
    // remembers the template afterwards; there are only cards.
    case "apply_template": {
      // One of the five by id, or a writer's own beats handed in (Roadmap 2, item 7).
      const template = Array.isArray(command.beats) && command.beats.length
        ? { id: command.template, beats: command.beats }
        : templateById(command.template);
      if (!template) return { state, changed: false };
      // Rows read top to bottom, so the block of new rows starts high enough
      // that its last row still clears the wall's top card.
      const rows = Math.ceil(template.beats.length / 5);
      const top = state.notes.length
        ? Math.min(...state.notes.map((note) => note.y)) - rows * (NOTE_HEIGHT + 40) - 32
        : 140;
      const left = state.notes.length ? Math.min(...state.notes.map((note) => note.x)) : 140;
      let z = state.notes.reduce((max, note) => Math.max(max, note.z), 0);
      const created = template.beats.map((item, index) => ({
        id: newId(),
        headline: item.name,
        change: item.prompt,
        // One colour: paper means nothing to the app, and a structure is not a pattern (round eleven).
        color: "yellow",
        x: left + (index % 5) * (NOTE_WIDTH + 28),
        y: top + Math.floor(index / 5) * (NOTE_HEIGHT + 40),
        rotate: ((index % 5) - 2) * 0.8,
        z: (z += 1),
        rank: "beat",
        lengthEighths: null,
        characterIds: [],
        maybeCharacterIds: [],
        plants: false,
        plantsWhat: "",
        alternativeOf: null,
        payoffBoardId: null,
        payoffNoteId: null,
        open: "",
        location: "",
        locationOpen: "",
        when: "",
        whenOpen: "",
        changeOpen: "",
        aside: false,
        text: "",
        createdAt: now,
        updatedAt: now,
      }));
      return { state: { ...state, notes: [...state.notes, ...created] }, changed: true, result: created };
    }

    // Pages (R23 b): the scene's text, on its card. Trailing whitespace is
    // trimmed so a stray newline is not a change.
    case "set_text": {
      const text = typeof command.text === "string" ? command.text.replace(/\s+$/, "") : "";
      let updated;
      const notes = state.notes.map((note) => {
        if (note.id !== command.id || note.text === text) return note;
        updated = bump(note, { text }, now);
        return updated;
      });
      if (!updated) {
        return { state, changed: false, result: state.notes.find((note) => note.id === command.id) };
      }
      return { state: { ...state, notes }, changed: true, result: updated };
    }

    // The production half (Roadmap 2, item 8). Lock the numbers once a draft
    // goes out: every scene keeps its number by the wall's order the caller
    // passes; new scenes take A-numbers; moving never renumbers. A revision is
    // a name and a colour over a snapshot of every card, so changed lines mark.
    case "lock_numbers": {
      const order = Array.isArray(command.order) ? command.order : state.notes.map((note) => note.id);
      const byId = new Map(state.notes.map((note) => [note.id, note]));
      const ordered = order.map((id) => byId.get(id)).filter(Boolean);
      for (const note of state.notes) if (!order.includes(note.id)) ordered.push(note);
      const lock = lockFrom(ordered, state.lock, now);
      return { state: { ...state, lock }, changed: true, result: lock };
    }

    case "unlock_numbers": {
      if (!state.lock) return { state, changed: false };
      return { state: { ...state, lock: null }, changed: true, result: null };
    }

    case "start_revision": {
      const name = typeof command.name === "string" ? command.name.trim() : "";
      if (!name) return { state, changed: false };
      const color = REVISION_COLORS.includes(command.color) ? command.color : "blue";
      const snapshot = {};
      for (const note of state.notes) {
        snapshot[note.id] = { headline: note.headline, change: note.change, location: note.location ?? "", text: note.text ?? "" };
      }
      const revision = { name, color, since: now, snapshot };
      return { state: { ...state, revision }, changed: true, result: revision };
    }

    case "end_revision": {
      if (!state.revision) return { state, changed: false };
      return { state: { ...state, revision: null }, changed: true, result: null };
    }

    // Leaving a question (R53): the writer's word on a question the wall
    // asks, written on the wall as the question's kind, the cards it was
    // about and the words it had. The reading holds it back while a question
    // with those words is still what the wall would ask, and asks again on
    // its own the moment the question would read differently. Never a
    // dismissal: the kernel records the word; the reading decides.
    case "leave_question": {
      const kind = typeof command.kind === "string" ? command.kind : "";
      const ids = Array.isArray(command.ids) ? command.ids.filter((id) => typeof id === "string") : [];
      const text = typeof command.text === "string" ? command.text : "";
      if (!kind || !text) return { state, changed: false };
      const why = typeof command.why === "string" ? command.why.trim() : "";
      const entry = why ? { kind, ids, text, since: now, why } : { kind, ids, text, since: now };
      const rest = (state.left ?? []).filter((item) => !(item.kind === kind && sameIds(item.ids, ids)));
      return { state: { ...state, left: [...rest, entry] }, changed: true, result: entry };
    }

    case "ask_again": {
      const kind = typeof command.kind === "string" ? command.kind : "";
      const ids = Array.isArray(command.ids) ? command.ids : null;
      const gone = (state.left ?? []).filter((item) => item.kind === kind && (!ids || sameIds(item.ids, ids)));
      if (gone.length === 0) return { state, changed: false };
      const left = (state.left ?? []).filter((item) => !gone.includes(item));
      return { state: { ...state, left }, changed: true, result: gone };
    }

    // Where a scene happens (R37): one place on one or more cards; an empty
    // place clears it.
    case "set_location": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      // The place, or the writer's words for why there is none yet (R61's
      // edge, round twenty entry 16): words clear the place, a place clears
      // the words, open "" with a place does both in one command.
      const hasOpen = typeof command.open === "string";
      const locationOpen = hasOpen ? cleanOpen(command.open) : null;
      const location = hasOpen ? (locationOpen ? "" : typeof command.location === "string" ? cleanPlace(command.location) : null) : cleanPlace(command.location);
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id)) return note;
        const patch = {
          location: location === null ? (note.location ?? "") : location,
          locationOpen: locationOpen === null ? (location ? "" : (note.locationOpen ?? "")) : locationOpen,
        };
        if (patch.location === (note.location ?? "") && patch.locationOpen === (note.locationOpen ?? "")) return note;
        const next = bump(note, patch, now);
        touched.push(next);
        return next;
      });
      if (touched.length === 0) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: touched };
    }

    // When a scene happens (R55): "night", "day four, dawn" — the writer's
    // phrase, printed after the place on the scene heading; empty clears it.
    case "set_when": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      // The when, or the writer's words for why there is none yet (R61): a
      // value clears the open words, open words clear the value, open "" leaves
      // the when blank.
      const hasOpen = typeof command.open === "string";
      const whenOpen = hasOpen ? cleanOpen(command.open) : null;
      const when = hasOpen ? (whenOpen ? "" : typeof command.when === "string" ? cleanWhen(command.when) : null) : cleanWhen(command.when);
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id)) return note;
        const patch = {
          when: when === null ? (note.when ?? "") : when,
          whenOpen: whenOpen === null ? (when ? "" : (note.whenOpen ?? "")) : whenOpen,
        };
        if (patch.when === (note.when ?? "") && patch.whenOpen === (note.whenOpen ?? "")) return note;
        const next = bump(note, patch, now);
        touched.push(next);
        return next;
      });
      if (touched.length === 0) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: touched };
    }

    // Leave a card open (R59): the writer's words for what is not decided,
    // or nothing. A claim about the card, like rank: it never moves it.
    case "set_open": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      const open = cleanOpen(command.open);
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id) || (note.open ?? "") === open) return note;
        const next = bump(note, { open }, now);
        touched.push(next);
        return next;
      });
      if (touched.length === 0) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: touched };
    }

    // Fold the corner (R31): this card plants something. A claim about the
    // card, like rank, so it never moves it and never touches its arrows.
    case "set_plant": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      // What the fold plants, in the writer's words (R62): `what` names it and
      // folds an unfolded card; `plants` alone keeps the words; unfolding
      // forgets them, as it forgets where it paid off.
      const what = typeof command.what === "string" ? cleanOpen(command.what) : null;
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id)) return note;
        const plants = typeof command.plants === "boolean" ? command.plants : note.plants || Boolean(what);
        const plantsWhat = !plants ? "" : what === null ? (note.plantsWhat ?? "") : what;
        // Unfolding forgets where it paid off; a claim that no longer stands.
        const payoffBoardId = plants ? note.payoffBoardId : null;
        const payoffNoteId = plants ? (note.payoffNoteId ?? null) : null;
        if (note.plants === plants && (note.plantsWhat ?? "") === plantsWhat && note.payoffBoardId === payoffBoardId && note.payoffNoteId === payoffNoteId) return note;
        const next = bump(note, { plants, plantsWhat, payoffBoardId, payoffNoteId }, now);
        touched.push(next);
        return next;
      });
      if (touched.length === 0) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: touched };
    }

    // A fold that pays off on another board of the project (R50): the wall
    // stops asking where it comes back, and the reading says where. The
    // kernel cannot check the board exists; the door that knows the project
    // does. Null takes the claim back.
    // With noteId, the scene on that board that pays it off (R58): the
    // receiving end, kept here on the fold so one claim has one owner. A
    // board alone is a promise; a note is the payoff.
    case "set_payoff_board": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      const payoffBoardId = typeof command.boardId === "string" && command.boardId ? command.boardId : null;
      const payoffNoteId = payoffBoardId && typeof command.noteId === "string" && command.noteId ? command.noteId : null;
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id) || !note.plants || (note.payoffBoardId === payoffBoardId && (note.payoffNoteId ?? null) === payoffNoteId)) return note;
        const next = bump(note, { payoffBoardId, payoffNoteId }, now);
        touched.push(next);
        return next;
      });
      if (touched.length === 0) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: touched };
    }

    case "delete_arrow": {
      if (!state.arrows.some((arrow) => arrow.id === command.id)) {
        return { state, changed: false };
      }
      return {
        state: { ...state, arrows: state.arrows.filter((arrow) => arrow.id !== command.id) },
        changed: true,
        result: { id: command.id },
      };
    }

    default:
      return { state, changed: false };
  }
}
