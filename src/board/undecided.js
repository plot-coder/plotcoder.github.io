// What a script carries of the wall's opens (R75; pass 1b, entries 34, 41,
// 42, drawn in docs/mockups/pass-1b-decisions.html and built on Robert's
// word, 2026-09-26). Two things, both from the wall and never from the
// text, so neither can go stale:
//
// - the maybe's line: a card that holds someone as "Name?" prints one line
//   under its heading, in the card's own form, so a page cannot read as
//   deciding who is in the room;
// - the last page: every script ends with "What is not decided", the
//   writer's own words in the reading's order — about the film, about the
//   people, scene by scene — and one line each for a scene held two ways
//   and a scene set aside. The pages themselves stay pages.
//
// Pure and DOM-free: the exports call these with the state and the project's
// own open fields, through every door.

import { inStory, storyOrder } from "./reducer.js";
import { sceneNumbers } from "./numbering.js";
import { castOpenLabel, readWall } from "./readWall.js";

/** The names a card holds as maybes, in the cast's order, with the question mark the card shows. */
function maybeNames(note, state) {
  return (note.maybeCharacterIds ?? [])
    .map((id) => (state.characters ?? []).find((person) => person.id === id)?.name)
    .filter(Boolean);
}

/**
 * The line a page prints under its heading for the people the card holds as
 * maybes: "Declan Doyle? Priya Nair? — not decided whether they are here."
 * Empty when the card holds none. Drawn from the card, never stored in the
 * text.
 */
export function maybeLine(note, state) {
  const names = maybeNames(note, state);
  if (!names.length) return "";
  return `${names.map((name) => `${name}?`).join(" ")} — not decided whether ${names.length === 1 ? "they are" : "they are"} here.`;
}

const FIELD = { change: "what changes", location: "where", when: "when" };

/**
 * The last page of a script: what is not decided, in the writer's words.
 * `extras.project` carries the project's own open fields as
 * { label, words }; `extras.date` is the day it goes out. Returns null when
 * nothing on the wall is open, held two ways or set aside.
 */
export function undecidedPage(state, extras = {}) {
  const reading = readWall(state);
  const byId = new Map(state.notes.map((note) => [note.id, note]));
  const order = storyOrder(state);
  const numbers = sceneNumbers(order, state.lock);
  const label = (id) => {
    const note = byId.get(id);
    if (!note) return id;
    const number = numbers.get(id);
    return `${number ? `${number} · ` : ""}${note.headline}`;
  };

  const film = [];
  for (const item of extras.project ?? []) film.push(`${item.label}: ${item.words}`);
  for (const line of reading.openLines ?? []) film.push(line);
  for (const field of reading.openFields.filter((item) => item.field === "logline")) film.push(`The logline: ${field.words}`);
  if (state.targetOpen) film.push(`How long: ${state.targetOpen}`);

  const people = (reading.openPeople ?? []).map((person) => `${person.name} — ${person.words}`);

  const scenes = [];
  const openById = new Map(reading.open.map((item) => [item.id, item]));
  for (const id of reading.order) {
    const note = byId.get(id);
    if (!note) continue;
    const parts = [];
    const whole = openById.get(id);
    if (whole) parts.push(whole.words);
    for (const kind of ["change", "location", "when"]) {
      const field = reading.openFields.find((item) => item.field === kind && item.id === id);
      if (field) parts.push(`${FIELD[kind]}: ${field.words}`);
    }
    const cast = reading.openFields.find((item) => item.field === "cast" && item.id === id);
    if (cast) parts.push(cast.words);
    const castOpen = reading.openFields.find((item) => item.field === "castOpen" && item.id === id);
    if (castOpen) parts.push(castOpen.words);
    const behind = (reading.versions ?? []).find((pair) => pair.id === id);
    if (behind) parts.push(`held two ways: ${behind.alternatives.map((other) => `"${byId.get(other)?.headline ?? other}"`).join(", ")} ${behind.alternatives.length === 1 ? "is" : "are"} behind it, not chosen`);
    if (parts.length) scenes.push(`${label(id)} — ${parts.join("; ")}`);
  }

  const outside = [];
  for (const note of state.notes.filter((item) => !inStory(item))) {
    const parts = [
      (note.open ?? "").trim() ? note.open.trim() : "",
      (note.changeOpen ?? "").trim() ? `${FIELD.change}: ${note.changeOpen.trim()}` : "",
      (note.locationOpen ?? "").trim() ? `${FIELD.location}: ${note.locationOpen.trim()}` : "",
      (note.whenOpen ?? "").trim() ? `${FIELD.when}: ${note.whenOpen.trim()}` : "",
      maybeNames(note, state).length ? `whether ${maybeNames(note, state).join(" and ")} ${maybeNames(note, state).length === 1 ? "is" : "are"} in it` : "",
      (note.castOpen ?? "").trim() ? `${castOpenLabel(note)}: ${note.castOpen.trim()}` : "",
    ].filter(Boolean);
    const standing = note.aside === true ? "set aside, not in the film" : `a version behind "${byId.get(note.alternativeOf)?.headline ?? note.alternativeOf}", not chosen`;
    outside.push(`"${note.headline}" — ${standing}${parts.length ? `; ${parts.join("; ")}` : ""}`);
  }

  if (!film.length && !people.length && !scenes.length && !outside.length) return null;
  return { date: typeof extras.date === "string" ? extras.date.slice(0, 10) : "", film, people, scenes, outside };
}

/** The page as plain lines, for the exports that have no headings of their own: the head, then each part under its label. */
export function undecidedLines(page) {
  if (!page) return [];
  const out = ["WHAT IS NOT DECIDED", `In the writer's words, from the wall${page.date ? `, ${page.date}` : ""}. Nothing here is on the pages.`];
  const part = (title, lines) => {
    if (!lines.length) return;
    out.push("", title);
    for (const line of lines) out.push(`- ${line}`);
  };
  part("About the film", page.film);
  part("About the people", page.people);
  part("Scene by scene", page.scenes);
  part("Not in the film", page.outside);
  return out;
}
