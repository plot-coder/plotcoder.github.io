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

/** A roster record with every page field present, so the page never reads undefined. */
export function fillCharacter(character) {
  let filled = character;
  for (const field of CHARACTER_FIELDS) {
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
  return state.notes.reduce((total, note) => total + noteEighths(note), 0);
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
    characters: [],
    notes: [],
    groups: [],
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
    location: "",
    when: "",
    text: "",
    plants: false,
    // A fold that pays off on another board — a later episode — names it here;
    // null claims nothing (R50). The scene there that pays it off, once one
    // does (R58); null while the board is a promise.
    payoffBoardId: null,
    payoffNoteId: null,
    createdAt: now,
    updatedAt: now,
  });

  return {
    // Left empty on purpose: the placeholder asks the question, which is how a
    // new writer finds out the logline is there at all.
    logline: "",
    targetEighths: DEFAULT_TARGET_EIGHTHS,
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
  const notes = value.notes.map((note) => {
    const rank = note && NOTE_RANKS.includes(note.rank) ? note.rank : "scene";
    // Unsized stays unsized: null (or no field, before R25) claims nothing and
    // reads as about a page. A number is the writer's estimate, kept in range.
    const lengthEighths =
      note?.lengthEighths === null || note?.lengthEighths === undefined
        ? null
        : clampEighths(note.lengthEighths, DEFAULT_NOTE_EIGHTHS, MAX_NOTE_EIGHTHS);
    const characterIds = knownCast(note?.characterIds, characters);
    // Cards written before R31 have no fold; a plant is a claim you make.
    const plants = note?.plants === true;
    // Cards written before R50 pay off on their own board or not at all.
    const payoffBoardId = plants && typeof note?.payoffBoardId === "string" && note.payoffBoardId ? note.payoffBoardId : null;
    // Cards written before R58 name a board and no scene on it.
    const payoffNoteId = payoffBoardId && typeof note?.payoffNoteId === "string" && note.payoffNoteId ? note.payoffNoteId : null;
    // Cards written before R37 have no place; a scene is nowhere until it is.
    const location = typeof note?.location === "string" ? note.location : "";
    // Cards written before R55 have no when; a scene is at no time until it is.
    const when = typeof note?.when === "string" ? note.when : "";
    // Cards written before pages (R23 b) have no text; a scene is unwritten until it is.
    const text = typeof note?.text === "string" ? note.text : "";
    if (
      note &&
      note.rank === rank &&
      note.lengthEighths === lengthEighths &&
      Array.isArray(note.characterIds) &&
      sameIds(note.characterIds, characterIds) &&
      note.plants === plants &&
      note.payoffBoardId === payoffBoardId &&
      note.payoffNoteId === payoffNoteId &&
      note.location === location &&
      note.when === when &&
      note.text === text
    ) {
      return note;
    }
    patched = true;
    return { ...note, rank, lengthEighths, characterIds, plants, payoffBoardId, payoffNoteId, location, when, text };
  });

  // Boards written before the production half (Roadmap 2, item 8) have no
  // lock and no revision; both are null until a draft goes out.
  const lock = value.lock && typeof value.lock === "object" && value.lock.numbers ? value.lock : null;
  const revision = value.revision && typeof value.revision === "object" && typeof value.revision.name === "string" ? value.revision : null;
  // Boards written before R53 have no left questions: nothing is left until
  // the writer leaves it.
  const left = Array.isArray(value.left) ? value.left.filter(isLeftQuestion) : [];
  const leftPatched = !Array.isArray(value.left) || left.length !== value.left.length;
  if (
    value.logline === logline &&
    value.targetEighths === targetEighths &&
    !rosterPatched &&
    !arrowsPatched &&
    !patched &&
    value.lock === lock &&
    value.revision === revision &&
    !leftPatched
  ) {
    return value;
  }
  return {
    ...value,
    logline,
    targetEighths,
    characters,
    notes: patched ? notes : value.notes,
    arrows: arrowsPatched ? arrows : value.arrows,
    lock,
    revision,
    left,
  };
}

/** Beats vs scenes. The app shows this number and passes no judgement (D21). */
export function countRanks(state) {
  let beats = 0;
  for (const note of state.notes) if (note.rank === "beat") beats += 1;
  return { beats, scenes: state.notes.length - beats };
}

function maxZ(notes) {
  return notes.reduce((top, note) => Math.max(top, note.z), 0);
}

function bump(note, patch, now) {
  return { ...note, ...patch, updatedAt: now };
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
    case "set_logline": {
      const logline = typeof command.logline === "string" ? command.logline.trim() : "";
      if (logline === (state.logline ?? "")) return { state, changed: false };
      return { state: { ...state, logline }, changed: true, result: { logline } };
    }

    case "create_note": {
      const n = state.notes.length;
      const note = {
        id: command.id ?? newId(),
        headline: command.headline ?? "New beat",
        change: command.change ?? "What changes?",
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
        plants: command.plants === true,
        payoffBoardId: null,
        payoffNoteId: null,
        location: cleanPlace(command.location),
        when: cleanWhen(command.when),
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
        if (command.change !== undefined) patch.change = command.change;
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
      const targetEighths = clampEighths(
        command.targetEighths,
        DEFAULT_TARGET_EIGHTHS,
        MAX_TARGET_EIGHTHS,
      );
      if (targetEighths === (state.targetEighths ?? DEFAULT_TARGET_EIGHTHS)) {
        return { state, changed: false };
      }
      return {
        state: { ...state, targetEighths },
        changed: true,
        result: { targetEighths },
      };
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
      const notes = state.notes.filter((note) => note.id !== command.id);
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
      // The result says what went with the card, so a door can say it too
      // (round thirteen, entry 17: "Deleted card." and nothing of the arrows).
      return {
        state: { ...state, notes, arrows, groups },
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
      for (const field of CHARACTER_FIELDS) {
        if (typeof command[field] === "string" && command[field] !== current[field]) {
          patch[field] = command[field];
        }
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
        note.characterIds.includes(command.id)
          ? bump(note, { characterIds: note.characterIds.filter((id) => id !== command.id) }, now)
          : note,
      );
      return { state: { ...state, characters, notes }, changed: true, result: { id: command.id } };
    }

    case "set_cast": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      const cast = knownCast(command.characterIds, state.characters);
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id) || sameIds(note.characterIds, cast)) return note;
        const next = bump(note, { characterIds: [...cast] }, now);
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
        plants: false,
        payoffBoardId: null,
        payoffNoteId: null,
        location: "",
        when: "",
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
      const location = cleanPlace(command.location);
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id) || note.location === location) return note;
        const next = bump(note, { location }, now);
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
      const when = cleanWhen(command.when);
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id) || note.when === when) return note;
        const next = bump(note, { when }, now);
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
      const plants = command.plants === true;
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id)) return note;
        // Unfolding forgets where it paid off; a claim that no longer stands.
        const payoffBoardId = plants ? note.payoffBoardId : null;
        const payoffNoteId = plants ? (note.payoffNoteId ?? null) : null;
        if (note.plants === plants && note.payoffBoardId === payoffBoardId && note.payoffNoteId === payoffNoteId) return note;
        const next = bump(note, { plants, payoffBoardId, payoffNoteId }, now);
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
