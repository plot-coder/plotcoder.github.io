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

// Characters are a board-level roster (D26): one record per person, referenced
// from cards by id, so a name changes in one place and the same person is the
// same person on every card. Long term the record grows — what they look like,
// the details a writer needs to pull up — which is why it has an id and
// timestamps now rather than being a word on a card.
function isCharacter(value) {
  return Boolean(value) && typeof value.id === "string" && typeof value.name === "string";
}

function sameName(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function sameIds(a, b) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
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
export function boardEighths(state) {
  return state.notes.reduce(
    (total, note) => total + (note.lengthEighths ?? DEFAULT_NOTE_EIGHTHS),
    0,
  );
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
    lengthEighths: DEFAULT_NOTE_EIGHTHS,
    characterIds,
    plants: false,
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
      { id: "maya", name: "Maya", createdAt: now, updatedAt: now },
      { id: "tom", name: "Tom", createdAt: now, updatedAt: now },
    ],
    notes: [
      mk("maya-letter", "Maya finds the letter", "She decides not to tell Tom.", "yellow", 88, 120, -2.2, 1, ["maya"]),
      mk("tom-lies", "Tom lies about the job", "Maya starts to doubt him.", "pink", 320, 168, 1.6, 2, ["tom", "maya"]),
      mk("letter-aloud", "The letter is read aloud", "The plan dies in the room.", "blue", 196, 340, 0.8, 3, ["maya", "tom"]),
    ],
    groups: [],
    arrows: [],
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
  const characters = Array.isArray(value.characters)
    ? value.characters.filter(isCharacter)
    : [];
  const rosterPatched =
    !Array.isArray(value.characters) || characters.length !== value.characters.length;

  // Cards written before R20 have no rank. They are scenes: a beat is something
  // you mark deliberately, so the safe default is the one that claims nothing.
  // Cards written before R25 have no length; a scene is about a page. Cards
  // written before R29 have no cast; nobody is in the scene until someone is.
  let patched = false;
  const notes = value.notes.map((note) => {
    const rank = note && NOTE_RANKS.includes(note.rank) ? note.rank : "scene";
    const lengthEighths = clampEighths(
      note?.lengthEighths,
      DEFAULT_NOTE_EIGHTHS,
      MAX_NOTE_EIGHTHS,
    );
    const characterIds = knownCast(note?.characterIds, characters);
    // Cards written before R31 have no fold; a plant is a claim you make.
    const plants = note?.plants === true;
    if (
      note &&
      note.rank === rank &&
      note.lengthEighths === lengthEighths &&
      Array.isArray(note.characterIds) &&
      sameIds(note.characterIds, characterIds) &&
      note.plants === plants
    ) {
      return note;
    }
    patched = true;
    return { ...note, rank, lengthEighths, characterIds, plants };
  });

  if (
    value.logline === logline &&
    value.targetEighths === targetEighths &&
    !rosterPatched &&
    !arrowsPatched &&
    !patched
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
        lengthEighths: clampEighths(
          command.lengthEighths,
          DEFAULT_NOTE_EIGHTHS,
          MAX_NOTE_EIGHTHS,
        ),
        characterIds: knownCast(command.characterIds, state.characters ?? []),
        plants: command.plants === true,
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
      const lengthEighths = clampEighths(
        command.lengthEighths,
        DEFAULT_NOTE_EIGHTHS,
        MAX_NOTE_EIGHTHS,
      );
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
      if (!state.notes.some((note) => note.id === command.id)) {
        return { state, changed: false };
      }
      const notes = state.notes.filter((note) => note.id !== command.id);
      const arrows = state.arrows.filter(
        (arrow) => arrow.from !== command.id && arrow.to !== command.id,
      );
      const groups = pruneGroups(
        state.groups.map((group) => ({
          ...group,
          noteIds: group.noteIds.filter((id) => id !== command.id),
        })),
      );
      return {
        state: { ...state, notes, arrows, groups },
        changed: true,
        result: { id: command.id },
      };
    }

    case "apply_poses": {
      const byId = new Map(command.poses.map((pose) => [pose.id, pose]));
      if (byId.size === 0) return { state, changed: false };
      const notes = state.notes.map((note) => {
        const pose = byId.get(note.id);
        return pose
          ? bump(note, { x: pose.x, y: pose.y, rotate: pose.rotate }, now)
          : note;
      });
      return { state: { ...state, notes }, changed: true };
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
      const character = { id: command.id ?? newId(), name, createdAt: now, updatedAt: now };
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

    // Fold the corner (R31): this card plants something. A claim about the
    // card, like rank, so it never moves it and never touches its arrows.
    case "set_plant": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      const plants = command.plants === true;
      const touched = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id) || note.plants === plants) return note;
        const next = bump(note, { plants }, now);
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
