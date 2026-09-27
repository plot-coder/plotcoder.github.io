// A scene's shots (R80; Robert, 2026-09-27). A shot is a line in the scene's
// text — a note, so it never prints, is never measured and is never read as
// the page's words — and not a record beside the card (R28's note stands):
//
//   [[shot k3f9: close on Nell's hand on the ledger · slow push in · 4s]]
//
// What the camera sees, then how it moves, then how long, the last two
// optional. A shot runs from its line to the next shot line or the end of
// its scene; the same id at the head of the next scene is the same shot,
// carried across. Its first frame and its takes are files on the project
// under `shot:<id>`. Shots come after the script: a scene with no text has
// nowhere to hold one. Pure and DOM-free.

import { EIGHTHS_PER_PAGE, formatPages, inStory, isMeasured, noteEighths } from "./reducer.js";
import { placeLine, placePage } from "./places.js";

const SHOT_LINE = /^\s*\[\[\s*shot\s+([a-z0-9]{3,8})\s*:\s*(.*?)\s*\]\]\s*$/i;
const SECONDS = /^(\d+(?:\.\d+)?)\s*s(?:ec(?:ond)?s?)?$/i;
const NOTE_LINE = /^\s*\[\[.*\]\]\s*$/;
/** No 0, o, 1, l or i: an id is read aloud and typed into a file's name. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** The first line of the block a line stands in: a shot line goes above a cue, never between it and its speech. */
function blockStart(lines, index) {
  let at = index;
  while (at > 0 && lines[at - 1].trim() !== "") at -= 1;
  return at;
}
/** A shot line put in above a block, a paragraph of its own: a note on the line above a cue would stop it being one. */
function insertAbove(lines, index, line) {
  lines.splice(index, 0, line, "");
  return index + 2;
}

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").replace(/\]\]/g, "").replace(/\s*·\s*/g, ", ").trim();

/** The subject a shot's files are filed under. */
export function shotSubject(id) {
  return `shot:${String(id ?? "").trim().toLowerCase()}`;
}

/** A shot line's parts, or null when the line is not one. */
export function parseShotLine(line) {
  const match = SHOT_LINE.exec(String(line ?? ""));
  if (!match) return null;
  const parts = match[2].split(/\s+·\s+/).map((part) => part.trim()).filter(Boolean);
  let seconds = null;
  const at = parts.findIndex((part) => SECONDS.test(part));
  if (at >= 0) seconds = Number(SECONDS.exec(parts.splice(at, 1)[0])[1]);
  return { id: match[1].toLowerCase(), what: parts[0] ?? "", move: parts.slice(1).join(" · "), seconds };
}

/** A shot as its line. */
export function shotLine(shot) {
  const parts = [clean(shot.what), clean(shot.move), typeof shot.seconds === "number" && shot.seconds > 0 ? `${Number(shot.seconds.toFixed(1))}s` : ""].filter(Boolean);
  return `[[shot ${String(shot.id).toLowerCase()}: ${parts.join(" · ")}]]`;
}

/** An id no shot in `taken` has. */
export function newShotId(taken = [], random = Math.random) {
  const used = new Set([...taken].map((id) => String(id).toLowerCase()));
  for (let tries = 0; tries < 200; tries += 1) {
    let id = "";
    for (let index = 0; index < 4; index += 1) id += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length];
    if (!used.has(id)) return id;
  }
  let n = used.size;
  while (used.has(`s${n}`.padEnd(4, "x"))) n += 1;
  return `s${n}`.padEnd(4, "x");
}

/**
 * A scene's text as its shots, in order: each with the index of its line and
 * `covers`, the script from its line to the next shot line or the end of the
 * scene, other notes left out. `before` is the script above the first shot
 * line, which no shot covers.
 */
export function shotsOfText(text) {
  const lines = String(text ?? "").split("\n");
  const shots = [];
  const before = [];
  for (const [index, line] of lines.entries()) {
    const shot = parseShotLine(line);
    if (shot) {
      shots.push({ ...shot, line: index, covers: [] });
      continue;
    }
    if (NOTE_LINE.test(line)) continue;
    (shots.length ? shots.at(-1).covers : before).push(line);
  }
  const trim = (rows) => rows.join("\n").replace(/^\n+|\s+$/g, "");
  return { shots: shots.map((shot) => ({ ...shot, covers: trim(shot.covers) })), before: trim(before) };
}

/** Every shot id on a board, or on several. */
export function shotIds(...states) {
  return states.flatMap((state) => (state?.notes ?? []).flatMap((note) => shotsOfText(note.text).shots.map((shot) => shot.id)));
}

/** The card a shot's line is on, with the shot and its number in the scene; the first in wall order when an id is carried across scenes. */
export function findShot(state, id) {
  const wanted = String(id ?? "").trim().toLowerCase().replace(/^shot:/, "");
  if (!wanted) return null;
  for (const note of state?.notes ?? []) {
    const { shots } = shotsOfText(note.text);
    const at = shots.findIndex((shot) => shot.id === wanted);
    if (at >= 0) return { note, shot: shots[at], number: at + 1, of: shots.length };
  }
  return null;
}

/**
 * Shot lines put into a scene's text, each above the line of the script its
 * `at` quotes (case and spacing aside; the first line that carries the
 * words). A shot with no `at` goes after the ones before it: at the top when
 * it is the first. `replace` takes the scene's shot lines out first. Returns
 * the text, the shots placed with their ids, and the ones whose words are on
 * no line — nothing is placed by guess.
 */
export function placeShots(text, shots, options = {}) {
  const taken = new Set([...(options.taken ?? [])].map((id) => String(id).toLowerCase()));
  let lines = String(text ?? "").split("\n");
  if (options.replace) for (const held of shotsOfText(lines.join("\n")).shots) lines = rewriteShot(lines.join("\n"), held.id, { remove: true }).text.split("\n");
  for (const line of lines) {
    const held = parseShotLine(line);
    if (held) taken.add(held.id);
  }
  const flat = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  const placed = [];
  const missing = [];
  let floor = 0;
  for (const shot of shots ?? []) {
    const what = clean(shot.what);
    if (!what) continue;
    const quoted = flat(shot.at);
    let index = floor;
    if (quoted) {
      index = lines.findIndex((line, at) => at >= floor && !NOTE_LINE.test(line) && flat(line).includes(quoted));
      if (index < 0) index = lines.findIndex((line) => !NOTE_LINE.test(line) && flat(line).includes(quoted));
      if (index < 0) {
        missing.push({ what, at: String(shot.at).trim() });
        continue;
      }
    }
    const wanted = String(shot.id ?? "").trim().toLowerCase();
    const id = /^[a-z0-9]{3,8}$/.test(wanted) && !taken.has(wanted) ? wanted : newShotId(taken, options.random);
    taken.add(id);
    const made = { id, what, move: clean(shot.move), seconds: typeof shot.seconds === "number" && shot.seconds > 0 ? shot.seconds : null };
    floor = insertAbove(lines, blockStart(lines, index), shotLine(made));
    placed.push(made);
  }
  return { text: lines.join("\n"), placed, missing };
}

/** One shot's line rewritten — any of what, move, seconds (null clears) — or taken out; the text as it was when the id is on no line. */
export function rewriteShot(text, id, patch = {}) {
  const wanted = String(id ?? "").trim().toLowerCase();
  let found = null;
  const rows = String(text ?? "").split("\n");
  const lines = rows.flatMap((line, index) => {
    // The blank line that stood under a shot line goes with it.
    if (found && found.now === null && found.at === index - 1 && !line.trim() && (index < 2 || !rows[index - 2].trim())) return [];
    const shot = parseShotLine(line);
    if (!shot || shot.id !== wanted || found) return [line];
    const next = {
      id: shot.id,
      what: typeof patch.what === "string" && clean(patch.what) ? clean(patch.what) : shot.what,
      move: typeof patch.move === "string" ? clean(patch.move) : shot.move,
      seconds: patch.seconds === null ? null : typeof patch.seconds === "number" && patch.seconds > 0 ? patch.seconds : shot.seconds,
    };
    found = { was: shot, now: patch.remove ? null : next, at: index };
    return patch.remove ? [] : [shotLine(next)];
  });
  return found ? { text: lines.join("\n").replace(/^\n+/, ""), was: found.was, now: found.now } : { text: String(text ?? ""), was: null, now: null };
}

/**
 * A scene rewritten from outside — a page resent, a script imported — keeps
 * its shots: each shot line of the old text that the new text does not carry
 * goes back above the line of script it stood over, or, when that line is
 * gone, at the end, so no shot and no still is orphaned by a rewrite.
 * Returns the text and what was carried and where.
 */
export function carryShots(oldText, newText) {
  const old = String(oldText ?? "").split("\n");
  const held = new Set(shotsOfText(newText).shots.map((shot) => shot.id));
  const flat = (value) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  let lines = String(newText ?? "").split("\n");
  const carried = [];
  let floor = 0;
  for (const [index, line] of old.entries()) {
    const shot = parseShotLine(line);
    if (!shot || held.has(shot.id)) continue;
    const under = old.slice(index + 1).find((row) => row.trim() && !NOTE_LINE.test(row));
    let at = under ? lines.findIndex((row, position) => position >= floor && flat(row) === flat(under)) : -1;
    if (at < 0 && under) at = lines.findIndex((row) => flat(row) === flat(under));
    if (at < 0) {
      lines = [...lines, ...(lines.at(-1)?.trim() ? [""] : []), line.trim()];
      carried.push({ id: shot.id, placed: false });
    } else {
      floor = insertAbove(lines, blockStart(lines, at), line.trim());
      carried.push({ id: shot.id, placed: true });
    }
    held.add(shot.id);
  }
  return { text: lines.join("\n"), carried };
}

/**
 * A board's shots as facts, scene by scene in the order given: how many, the
 * seconds they say against the scene's length (a page a minute), and whether
 * script stands above the first shot line. Never a question: the reading
 * asks nothing of shots.
 */
export function describeShots(state, order = null) {
  const cards = (order ?? state.notes ?? []).filter((note) => inStory(note));
  return cards.map((note) => {
    const { shots, before } = shotsOfText(note.text);
    const said = shots.filter((shot) => typeof shot.seconds === "number");
    return {
      id: note.id,
      headline: note.headline,
      written: Boolean((note.text ?? "").trim()),
      shots,
      seconds: said.reduce((sum, shot) => sum + shot.seconds, 0),
      unsaid: shots.length - said.length,
      sceneSeconds: Math.round((noteEighths(note) / EIGHTHS_PER_PAGE) * 60),
      uncovered: shots.length > 0 && Boolean(before.replace(/^(?:INT|EXT|EST|I\/E)[^\n]*\n?/i, "").trim()),
    };
  });
}

/** The people of a scene a shot names — by a word of their name in what it sees or the script it covers — or the scene's whole cast when it names none. */
function peopleInShot(state, note, shot) {
  const cast = (note.characterIds ?? []).map((id) => (state.characters ?? []).find((person) => person.id === id)).filter(Boolean);
  const words = ` ${`${shot.what} ${shot.covers}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ")} `;
  const named = cast.filter((person) => person.name.toLowerCase().split(/\s+/).some((word) => word.length > 1 && words.includes(` ${word} `)));
  return named.length ? named : cast;
}

/**
 * The brief for one shot: what an image tool is handed for its first frame
 * and a video tool for the clip. Only what the wall holds, in the writer's
 * words; what it does not hold is said, never filled. `options`: `look` (the
 * project's), `places` (its places' pages), `title` (the board's name),
 * `order` (the story order, for the scene's number), `frame` (the name of
 * the still filed as its first frame, when there is one).
 */
export function shotBrief(state, id, options = {}) {
  const found = findShot(state, id);
  if (!found) return null;
  const { note, shot, number, of } = found;
  const order = options.order ?? [];
  const sceneAt = order.findIndex((item) => item.id === note.id);
  const people = peopleInShot(state, note, shot);
  const page = (note.location ?? "").trim() ? placePage({ places: options.places ?? [] }, note.location) : null;
  const look = String(options.look ?? "").trim();
  const when = [note.when, note.day, note.light].map((part) => (part ?? "").trim()).filter(Boolean);
  const lines = [
    `SHOT ${shot.id}: shot ${number} of ${of} in "${note.headline}" [[id: ${note.id}]]${sceneAt >= 0 ? ` — scene ${sceneAt + 1} of ${order.length}` : ""}${options.title ? ` on "${options.title}"` : ""}`,
    `THE LOOK: ${look || "(none set for the project: set_look holds it)"}`,
    `WHAT THE CAMERA SEES: ${shot.what}`,
    `THE MOVE: ${shot.move || "(not said)"}`,
    `LENGTH: ${typeof shot.seconds === "number" ? `${shot.seconds} second${shot.seconds === 1 ? "" : "s"}` : "(not said)"} — the scene is about ${formatPages(noteEighths(note))} page${formatPages(noteEighths(note)) === "1" ? "" : "s"}, ${isMeasured(note) ? "measured" : "estimated"}`,
    `AT: ${(note.location ?? "").trim() ? `${note.location.trim()}${page ? ` — ${placeLine(page)}` : " — (no page yet)"}` : (note.locationOpen ?? "").trim() ? `the place open, by the writer's word: "${note.locationOpen.trim()}"` : "(no place set)"}`,
    `WHEN: ${when.length ? when.join(" · ") : "(no time, day or light set)"}`,
    `WHO: ${people.length ? people.map((person) => `${person.name}${(person.looks ?? "").trim() ? ` — looks: ${person.looks.trim()}` : " — (no looks on their page)"}`).join(" | ") : "(nobody cast)"}`,
    `FIRST FRAME: ${options.frame ? `"${options.frame}", filed on the shot` : "(no still filed yet)"}`,
    "THE SCRIPT IT COVERS:",
    shot.covers || "(nothing: the shot line is the last line of the scene)",
    "",
    "PROMPT FOR THE STILL (copy it into an image tool; every word is the wall's):",
    shotPrompt(state, id, options),
  ];
  const gaps = [
    look ? "" : "the project's look",
    (note.location ?? "").trim() && !page?.looks ? `what ${note.location.trim()} looks like` : "",
    ...people.filter((person) => !(person.looks ?? "").trim()).map((person) => `what ${person.name} looks like`),
    when.length ? "" : "the time of day and the light",
  ].filter(Boolean);
  if (gaps.length) lines.push("", `NOT ON THE WALL: ${gaps.join("; ")}. Ask the writer, or leave it out of the prompt: nothing is invented to fill it.`);
  return lines.join("\n");
}

/** The prompt for a shot's still, one paragraph to copy: what the camera sees, the place, the people in it, the light, the look. */
export function shotPrompt(state, id, options = {}) {
  const found = findShot(state, id);
  if (!found) return "";
  const { note, shot } = found;
  const page = (note.location ?? "").trim() ? placePage({ places: options.places ?? [] }, note.location) : null;
  const stop = (text) => String(text ?? "").trim().replace(/[.\s]+$/, "");
  const parts = [
    stop(shot.what),
    (note.location ?? "").trim() ? `${stop(note.location)}${page?.looks ? `: ${stop(page.looks)}` : ""}` : "",
    ...peopleInShot(state, note, shot).filter((person) => (person.looks ?? "").trim()).map((person) => `${person.name}: ${stop(person.looks)}`),
    [note.when, note.light].map(stop).filter(Boolean).join(", "),
    stop(options.look),
  ].filter(Boolean);
  return `${parts.join(". ")}.`;
}
