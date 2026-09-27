// The walkthrough (R80; drawn in docs/mockups/r80-the-walkthrough.html and
// built on Robert's word, 2026-09-27). The rehearsal's finding was an order:
// a still holds a face only when a picture of the person is attached, so the
// references — a picture of each person and place a scene's shots name — come
// before the stills. This is that order as facts, for the sheet and for the
// agent's tools: what is to make, what to paste, what to call the file, what
// to attach, and what a shot is waiting on. Pure and DOM-free.

import { placeKey } from "./places.js";
import { shotPeople, shotPrompt, shotReferences, shotSubject, shotsOfText } from "./shots.js";

/** Words as a file's name: lower case, hyphens, nothing a disk minds. */
export function fileSlug(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A reference's file: a person is their name, a place its phrase without INT or EXT. */
export function referenceFileName(kind, name) {
  const words = kind === "place" ? String(name ?? "").replace(/^\s*(?:INT\.?\s*\/\s*EXT|I\s*\/\s*E|INT|EXT|EST)[.\s]+/i, "") : name;
  return `${fileSlug(words) || (kind === "place" ? "place" : "person")}.png`;
}

/** A shot's file: its scene's number, its own, and its id, so a folder sorts in story order and the id finds the shot if the numbers move. */
export function shotFileName(scene, shot, id) {
  const two = (n) => String(n).padStart(2, "0");
  return `s${two(scene)}-${two(shot)}-${String(id).toLowerCase()}.png`;
}

/** A file's name without its ending and without the "-2" of a second try. */
function stem(name) {
  return String(name ?? "").toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/-\d{1,2}$/, "");
}

/**
 * The walkthrough of one board. `options`: `look`, `places` (the project's
 * pages), `outside` (the references ticked as kept outside the app), `files`
 * (the project's files, or null when signed out: pictures are not known),
 * `order` (the story order).
 */
export function walkthrough(state, options = {}) {
  const order = options.order ?? state.notes ?? [];
  const files = options.files ?? null;
  const outside = new Set(options.outside ?? []);
  const pictureOf = (key) => (files ?? []).find((file) => file.kind === "picture" && file.subject === key) ?? null;
  const scenesWithShots = order.map((note, index) => ({ note, number: index + 1, shots: shotsOfText(note.text).shots })).filter((scene) => scene.shots.length);

  // How many of the board's shots each reference is in.
  const uses = new Map();
  for (const scene of scenesWithShots) {
    for (const shot of scene.shots) {
      for (const person of shotPeople(state, scene.note, shot)) uses.set(person.id, (uses.get(person.id) ?? 0) + 1);
      if ((scene.note.location ?? "").trim()) {
        const key = `place:${placeKey(scene.note.location)}`;
        uses.set(key, (uses.get(key) ?? 0) + 1);
      }
    }
  }
  const references = shotReferences(state, scenesWithShots.map((scene) => scene.note), { look: options.look, places: options.places }).map((item) => {
    const picture = pictureOf(item.key);
    return { ...item, fileName: referenceFileName(item.kind, item.name), shots: uses.get(item.key) ?? 0, picture, outside: outside.has(item.key), done: Boolean(picture) || outside.has(item.key) };
  });
  const byKey = new Map(references.map((item) => [item.key, item]));

  const scenes = scenesWithShots.map((scene) => {
    const place = (scene.note.location ?? "").trim() ? byKey.get(`place:${placeKey(scene.note.location)}`) ?? null : null;
    const shots = scene.shots.map((shot, index) => {
      const people = shotPeople(state, scene.note, shot).map((person) => byKey.get(person.id)).filter(Boolean);
      const attach = [...people, ...(place ? [place] : [])];
      const stills = (files ?? []).filter((file) => file.kind === "picture" && file.subject === shotSubject(shot.id));
      const still = stills.find((file) => file.note === "chosen") ?? stills.at(-1) ?? null;
      return {
        id: shot.id,
        number: index + 1,
        what: shot.what,
        move: shot.move,
        seconds: shot.seconds,
        attach,
        // What the shot waits on: a reference neither made nor ticked.
        waiting: attach.filter((item) => !item.done),
        prompt: shotPrompt(state, shot.id, { look: options.look, places: options.places, attached: people.filter((item) => item.done).map((item) => item.key) }),
        fileName: shotFileName(scene.number, index + 1, shot.id),
        still,
        stills: stills.length,
      };
    });
    return { id: scene.note.id, headline: scene.note.headline, number: scene.number, of: order.length, shots, made: shots.filter((shot) => shot.still).length };
  });

  const people = references.filter((item) => item.kind === "person");
  const places = references.filter((item) => item.kind === "place");
  const allShots = scenes.flatMap((scene) => scene.shots.map((shot) => ({ scene: scene.id, shot })));
  const next = allShots.find((item) => !item.shot.still && item.shot.waiting.length === 0) ?? null;
  return {
    look: { value: String(options.look ?? "").trim(), done: Boolean(String(options.look ?? "").trim()) },
    people,
    places,
    scenes,
    counts: {
      people: { done: people.filter((item) => item.done).length, of: people.length },
      places: { done: places.filter((item) => item.done).length, of: places.length },
      shots: { done: allShots.filter((item) => item.shot.still).length, of: allShots.length, waiting: allShots.filter((item) => item.shot.waiting.length).length },
    },
    /** The first shot with no still whose references are done: where to go next. */
    next: next ? { scene: next.scene, shot: next.shot.id } : null,
    /** Whether the project's files are in sight: signed out, a picture cannot be held and only a tick marks a reference done. */
    signedIn: files !== null,
  };
}

/**
 * Where a file that was dropped belongs, by its name: a reference's name
 * ("ada-quill.png", "ada-quill-2.png") or a shot's ("s04-02-q3j9.png", or
 * any name that ends in the shot's id). Null when the name says nothing;
 * the file then goes to the row it was dropped on.
 */
export function matchFile(name, walk) {
  const wanted = stem(name);
  if (!wanted) return null;
  for (const item of [...walk.people, ...walk.places]) if (stem(item.fileName) === wanted) return { kind: "reference", key: item.key, name: item.name };
  for (const scene of walk.scenes) {
    for (const shot of scene.shots) if (wanted === shot.id || wanted.endsWith(`-${shot.id}`)) return { kind: "shot", key: shotSubject(shot.id), name: shot.what, scene: scene.id, shot: shot.id };
  }
  return null;
}
