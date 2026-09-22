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

import { PERSON_TEXT_FIELDS, fillCharacter, isCharacter, newId, normalizeState, noteEighths, nowIso, sameName } from "./reducer.js";

export const PROJECT_VERSION = 2;
export const DEFAULT_PROJECT_NAME = "Untitled project";

function trimmed(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function newBoardMeta(name, now = nowIso(), nameOpen = "") {
  return { id: newId(), name: trimmed(name, "Board"), nameOpen: openWords(nameOpen), createdAt: now, updatedAt: now };
}

/** The writer's words for why a field is not decided (R61), one line, spaces collapsed; empty is decided or blank. */
function openWords(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function emptyProject(now = nowIso()) {
  const board = newBoardMeta("Board 1", now);
  return {
    version: PROJECT_VERSION,
    id: newId(),
    name: DEFAULT_PROJECT_NAME,
    nameOpen: "",
    premise: "",
    premiseOpen: "",
    // The title page's byline and contact (pass 1a, entry 50): the project's, since every board's script goes out under them.
    author: "",
    contact: "",
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
    // A board named before R61 has no open name; the name stands until the writer says it is not decided.
    nameOpen: openWords(board.nameOpen),
    createdAt: typeof board.createdAt === "string" ? board.createdAt : now,
    updatedAt: typeof board.updatedAt === "string" ? board.updatedAt : now,
  }));
  if (boards.length === 0) boards.push(newBoardMeta("Board 1", now));
  const activeBoardId = boards.some((board) => board.id === value.activeBoardId)
    ? value.activeBoardId
    : boards[0].id;
  // A writer's own structures (Roadmap 2, item 7): saved from a wall's beats.
  const structures = Array.isArray(value.structures)
    ? value.structures.filter(
        (item) => item && typeof item.id === "string" && typeof item.name === "string" && Array.isArray(item.beats),
      )
    : [];
  // `renamed` is reidentifyProject's map for the store, never part of the record.
  const { renamed: _renamed, ...rest } = value;
  const record = {
    ...rest,
    version: PROJECT_VERSION,
    name: trimmed(value.name, DEFAULT_PROJECT_NAME),
    // A project named before R61's edge has no open name; the name stands until the writer says it is not decided.
    nameOpen: openWords(value.nameOpen),
    premise: typeof value.premise === "string" ? value.premise.trim() : "",
    // A project written before R61 has no open premise (R61).
    premiseOpen: openWords(value.premiseOpen),
    // A project written before pass 1a has no byline: blank, which claims nothing.
    author: typeof value.author === "string" ? value.author.trim() : "",
    contact: typeof value.contact === "string" ? value.contact.trim() : "",
    boards,
    activeBoardId,
    structures,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
  // The project's cast (R51). A record with none has not been lifted yet —
  // its boards still carry their own rosters — and liftCast does that at the
  // next load boundary; so absent stays absent, and never becomes [].
  if (Array.isArray(value.characters)) record.characters = value.characters.filter(isCharacter).map(fillCharacter);
  else delete record.characters;
  return record;
}

// --- The project's cast (R51) -----------------------------------------
//
// One roster for the project, on the record, that every board draws from.
// A board's state still carries `characters`, but as a copy of the
// project's: every load boundary composes it with withRoster, and every
// store lifts a roster a kernel command changed back onto the record. So
// the kernel, the readings and the wall go on reading state.characters,
// and there is one Nessa across the pilot and episode two.

/** A board's state with the project's cast in it; unknown cast ids on cards drop. */
export function withRoster(state, project) {
  if (!Array.isArray(project.characters) || sameRoster(project.characters, state.characters)) return state;
  const next = normalizeState({ ...state, characters: project.characters });
  return next.characters === project.characters ? next : { ...next, characters: project.characters };
}

/** True when two rosters are the same people with the same pages. */
export function sameRoster(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((character, index) => {
    const other = b[index];
    return other && character.id === other.id && character.name === other.name && PERSON_TEXT_FIELDS.every((field) => (character[field] ?? "") === (other[field] ?? ""));
  });
}

/**
 * Lift the cast onto the project. A record that already has one composes
 * every board with it. A record with none — written before R51 — takes the
 * boards' rosters in board order and merges them by name: the first record
 * of a name keeps its id, later ones fold into it (a page line fills from the
 * first board that had it), and every card that cast a folded id casts the
 * kept one. Returns the record, every board composed, and whether anything
 * changed.
 */
export function liftCast(project, boards, now = nowIso()) {
  if (Array.isArray(project.characters)) {
    let changed = false;
    const out = {};
    for (const [id, state] of Object.entries(boards)) {
      const next = withRoster(state, project);
      if (next !== state) changed = true;
      out[id] = next;
    }
    return { project, boards: out, changed };
  }
  const roster = [];
  const folded = {};
  const order = [
    ...project.boards.map((meta) => meta.id).filter((id) => boards[id]),
    ...Object.keys(boards).filter((id) => !project.boards.some((meta) => meta.id === id)),
  ];
  for (const boardId of order) {
    const map = {};
    for (const character of boards[boardId].characters ?? []) {
      if (!isCharacter(character)) continue;
      const kept = roster.find((item) => sameName(item.name, character.name));
      if (!kept) {
        roster.push(fillCharacter({ ...character }));
        continue;
      }
      map[character.id] = kept.id;
      for (const field of PERSON_TEXT_FIELDS) {
        if (!(kept[field] ?? "").trim() && typeof character[field] === "string" && character[field].trim()) kept[field] = character[field];
      }
    }
    folded[boardId] = map;
  }
  const lifted = { ...project, characters: roster, updatedAt: now };
  const out = {};
  for (const [boardId, state] of Object.entries(boards)) {
    const map = folded[boardId] ?? {};
    const notes = state.notes.map((note) => recastNote(note, map));
    out[boardId] = normalizeState({ ...state, notes, characters: roster });
  }
  return { project: lifted, boards: out, changed: true };
}

/** A card's people under a map of old ids to kept ones: the cast, and who may be there (a maybe follows its person, and certain wins). */
function recastNote(note, map) {
  const same = (a, b) => a.length === b.length && a.every((id, index) => id === b[index]);
  const ids = [...new Set(note.characterIds.map((id) => map[id] ?? id))];
  const was = note.maybeCharacterIds ?? [];
  const maybe = [...new Set(was.map((id) => map[id] ?? id))].filter((id) => !ids.includes(id));
  return same(ids, note.characterIds) && same(maybe, was) ? note : { ...note, characterIds: ids, maybeCharacterIds: maybe };
}

/**
 * A board with a roster of its own — an imported file, a board opened from
 * elsewhere — joins the project's cast without shrinking it: a name the
 * project already has keeps the project's record (its cards recast to that
 * id), a new name is appended with the record it came with. Returns the
 * record and the board composed with it.
 */
export function mergeRoster(project, state, now = nowIso()) {
  if (!Array.isArray(project.characters)) return { project, state };
  const roster = [...project.characters];
  const map = {};
  let grew = false;
  for (const character of state.characters ?? []) {
    if (!isCharacter(character)) continue;
    const kept = roster.find((item) => sameName(item.name, character.name));
    if (kept) {
      if (kept.id !== character.id) map[character.id] = kept.id;
      continue;
    }
    roster.push(fillCharacter({ ...character }));
    grew = true;
  }
  const next = grew ? { ...project, characters: roster, updatedAt: now } : project;
  const notes = state.notes.map((note) => recastNote(note, map));
  const recast = notes.some((note, index) => note !== state.notes[index]) ? { ...state, notes } : state;
  return { project: next, state: withRoster(recast, next) };
}

/** Which other boards of the project have each person on a card: id -> [{ board, cards }]. */
export function castElsewhere(project, boards, activeBoardId) {
  const map = {};
  for (const meta of project.boards) {
    if (meta.id === activeBoardId) continue;
    const state = boards[meta.id];
    if (!state) continue;
    const counts = {};
    for (const note of state.notes) for (const id of note.characterIds ?? []) counts[id] = (counts[id] ?? 0) + 1;
    for (const [id, cards] of Object.entries(counts)) (map[id] ??= []).push({ board: meta.name, boardId: meta.id, cards });
  }
  return map;
}

/**
 * What lands on a board from the folds of the project's other boards (R58):
 * `paid` — folds that name a scene here, keyed for the paying-off card;
 * `waiting` — folds that name this board and no scene on it yet (or a scene
 * that is gone). The receiving board carries no record of its own; this is
 * composed from the project, the way castElsewhere composes the cast.
 */
export function landingsOn(project, boards, boardId) {
  const here = boards[boardId];
  const hereIds = new Set((here?.notes ?? []).map((note) => note.id));
  const paid = [];
  const waiting = [];
  for (const meta of project.boards) {
    if (meta.id === boardId) continue;
    const state = boards[meta.id];
    if (!state) continue;
    for (const note of state.notes) {
      if (!note.plants || note.payoffBoardId !== boardId) continue;
      const landing = { fromBoardId: meta.id, fromBoardName: meta.name, fromNoteId: note.id, fromHeadline: note.headline, fromColor: note.color };
      if (note.payoffNoteId && hereIds.has(note.payoffNoteId)) paid.push({ ...landing, id: note.payoffNoteId });
      else waiting.push({ ...landing, id: note.payoffNoteId ?? null });
    }
  }
  return { paid, waiting };
}

/** Every board's name, card count and card ids, for the reading to judge a fold's promise by (R58). */
export function laterBoards(project, boards) {
  const map = {};
  for (const meta of project.boards) {
    const state = boards[meta.id];
    map[meta.id] = { name: meta.name, cards: state?.notes?.length ?? 0, noteIds: (state?.notes ?? []).map((note) => note.id) };
  }
  return map;
}

function touch(project, patch, now) {
  return { ...project, ...patch, updatedAt: now };
}

/** Add a board after the others and open it. Returns the project and the new board. */
export function addBoard(project, name, now = nowIso(), nameOpen = "") {
  const fallback = `Board ${project.boards.length + 1}`;
  const board = newBoardMeta(trimmed(name, fallback), now, nameOpen);
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
    if (board.id !== id || (board.name === next && !(board.nameOpen ?? ""))) return board;
    changed = true;
    // A name decides the field: the open words go (R61).
    return { ...board, name: next, nameOpen: "", updatedAt: now };
  });
  return changed ? touch(project, { boards }, now) : project;
}

/**
 * The writer's words for why a board's name is not decided (R61), or "" to
 * take them back. The name stands as it is — "Board 1" is still what every
 * reply calls it — but the reading lists the words and the crumb draws them.
 */
export function setBoardNameOpen(project, id, words, now = nowIso()) {
  const next = openWords(words);
  let changed = false;
  const boards = project.boards.map((board) => {
    if (board.id !== id || (board.nameOpen ?? "") === next) return board;
    changed = true;
    return { ...board, nameOpen: next, updatedAt: now };
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
  if (!next || (next === project.name && !(project.nameOpen ?? ""))) return project;
  // A name decides the field: the open words go (R61's edge).
  return touch(project, { name: next, nameOpen: "" }, now);
}

/** The writer's words for why the project's name is not decided (R61's edge), or "" to take them back; the name stands meanwhile. */
export function setProjectNameOpen(project, words, now = nowIso()) {
  const next = openWords(words);
  if (next === (project.nameOpen ?? "")) return project;
  return touch(project, { nameOpen: next }, now);
}

export function setPremise(project, premise, now = nowIso()) {
  const next = typeof premise === "string" ? premise.trim() : "";
  // A premise decides the field: the open words go (R61); clearing it leaves them.
  const premiseOpen = next ? "" : (project.premiseOpen ?? "");
  if (next === project.premise && premiseOpen === (project.premiseOpen ?? "")) return project;
  return touch(project, { premise: next, premiseOpen }, now);
}

/** The writer's words for why there is no premise yet (R61), or "" to take them back; words clear the premise. */
export function setPremiseOpen(project, words, now = nowIso()) {
  const next = openWords(words);
  const premise = next ? "" : project.premise;
  if (next === (project.premiseOpen ?? "") && premise === project.premise) return project;
  return touch(project, { premise, premiseOpen: next }, now);
}

/**
 * The title page's byline and contact (pass 1a, entry 50): "Written by …" and
 * the lines under it — an address, an agent, an email — on every script the
 * project sends out. Undefined leaves a field as it is; "" clears it.
 */
export function setTitlePage(project, fields, now = nowIso()) {
  const author = typeof fields?.author === "string" ? fields.author.trim().replace(/\s+/g, " ") : project.author ?? "";
  const contact = typeof fields?.contact === "string" ? fields.contact.trim() : project.contact ?? "";
  if (author === (project.author ?? "") && contact === (project.contact ?? "")) return project;
  return touch(project, { author, contact }, now);
}

/**
 * What a script going out is called (round thirteen, entry 26): a named
 * project is the title — a one-board film is its project — with the board's
 * name beside it only when the project has several boards; an untitled
 * project's board is the title. One rule for Markdown, plain text, Fountain
 * and Final Draft, through every door.
 */
export function scriptTitles(project, board) {
  const boardName = (board?.name ?? "").trim() || "Untitled";
  const named = typeof project?.name === "string" && project.name.trim() && project.name !== DEFAULT_PROJECT_NAME;
  // A film whose title is not decided goes out as "Untitled", never as "Board 1": the board's default name is the app's word, not a title (round twenty-three, entry 53).
  // The byline and contact ride with the title on every export (pass 1a, entry 50).
  const front = { ...(project?.author ? { author: project.author } : {}), ...(project?.contact ? { contact: project.contact } : {}) };
  if (!named) return { title: /^Board \d+$/.test(boardName) && (project?.boards ?? []).length <= 1 ? "Untitled" : boardName, ...front };
  const boards = project.boards ?? [];
  if (boards.length > 1) {
    // A series: the project is the title and the board is the episode line,
    // numbered in the project's order, so one file says which episode it is
    // (round fifteen, entries 32 and 37).
    const index = boards.findIndex((item) => item.id === board?.id);
    const number = index >= 0 ? `Episode ${index + 1} of ${boards.length}` : "An episode";
    return { title: project.name, episode: `${number} · ${boardName}`, ...front };
  }
  return { title: project.name, ...front };
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

/**
 * The same project under fresh ids — its own and every board's (R40). Used
 * when this device's project is pushed to an account as a new one: the ids it
 * carried may already be someone else's — every page under the dev bridge
 * shares them, and a project file carries its author's — and a project's ids
 * must be its own. The result carries `renamed`, old board id to new, which
 * normalizeProject drops.
 */
export function reidentifyProject(project, now = nowIso()) {
  const ids = new Map(project.boards.map((board) => [board.id, newId()]));
  return {
    ...project,
    id: newId(),
    boards: project.boards.map((board) => ({ ...board, id: ids.get(board.id), updatedAt: now })),
    activeBoardId: ids.get(project.activeBoardId) ?? project.activeBoardId,
    updatedAt: now,
    /** Old board id → new, so a store can move each board's state along. */
    renamed: Object.fromEntries(ids),
  };
}

/**
 * A structure's beats from a wall (Roadmap 2, item 7): each beat card in
 * reading order, its headline as the beat's name, its change line as the
 * prompt, and where it falls as a share of the wall's length. Empty when the
 * wall has no beats — there is nothing to save then.
 */
export function structureBeats(notes, order) {
  const byId = new Map(notes.map((note) => [note.id, note]));
  const ordered = order.map((id) => byId.get(id)).filter(Boolean);
  const total = ordered.reduce((sum, note) => sum + noteEighths(note), 0) || 1;
  let cursor = 0;
  const beats = [];
  for (const note of ordered) {
    if (note.rank === "beat") {
      beats.push({
        name: note.headline || "Untitled beat",
        prompt: note.change || "What turns here?",
        at: Math.round((cursor / total) * 100) / 100,
      });
    }
    cursor += noteEighths(note);
  }
  return beats;
}

/** Save a structure on the project: a name and beats { name, prompt, at }. */
export function addStructure(project, name, beats, now = nowIso()) {
  const structure = { id: newId(), name: trimmed(name, "My structure"), beats: beats.map((beat) => ({ ...beat })) };
  return { project: { ...project, structures: [...(project.structures ?? []), structure], updatedAt: now }, structure };
}

export function removeStructure(project, id, now = nowIso()) {
  const structures = (project.structures ?? []).filter((item) => item.id !== id);
  if (structures.length === (project.structures ?? []).length) return project;
  return { ...project, structures, updatedAt: now };
}
