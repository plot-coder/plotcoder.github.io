// Fountain out (R23, slice a; roadmap item 8).
//
// The wall as a Fountain document: a plain-text screenplay a writer can open
// in any Fountain editor and paginate. One card is one scene, in wall order:
// a forced scene heading from the place (or the headline when the card has
// no place), the headline as a synopsis, the change line as action, and the
// cast and the fold as notes. Beats open sections, so an outline view shows
// the story's turns. Nothing here is a page yet: this is the stepping stone
// from the wall to a document, in the wall's own words.
//
// Fountain marks used: `Title:` block; `# ` section; `.` forced heading;
// `= ` synopsis; `[[ ]]` note. All of them are invisible on the printed page
// except the heading and the action.

import { formatPages, boardEighths } from "./reducer.js";
import { storyOrder } from "./readWall.js";
import { revisionLine, revisionMarks } from "./numbering.js";

function upper(text) {
  return text.trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * A forced scene heading: the place, or the headline when the card has none,
 * and the card's when after a dash — THE PIER AT FENIT - NIGHT (R55).
 */
export function sceneHeading(note) {
  const place = typeof note.location === "string" ? note.location.trim() : "";
  const when = typeof note.when === "string" ? note.when.trim() : "";
  const words = place || note.headline || "UNTITLED";
  return `.${upper(words)}${when ? ` - ${upper(when)}` : ""}`;
}

/** A heading split back into its place and its when: "THE PIER AT FENIT - NIGHT" → both. */
export function splitHeading(heading) {
  const match = /^(.*?)\s+-\s+([^-]+)$/.exec(heading ?? "");
  if (!match) return { place: (heading ?? "").trim(), when: "" };
  return { place: match[1].trim(), when: match[2].trim() };
}

/**
 * The mark every export sets before an unwritten scene's change line, so a
 * reader can tell a placeholder from a page (round thirteen, entry 27). One
 * mark, the same words in Markdown, plain text, Fountain and Final Draft;
 * coming back in, a body that is the mark and the card's change line is
 * still unwritten.
 */
export const UNWRITTEN_MARK = "[Unwritten]";

/** What stands in for an unwritten scene's body: the mark, then the change line. */
export function standInFor(note) {
  const change = (note.change ?? "").trim();
  return change ? `${UNWRITTEN_MARK} ${change}` : UNWRITTEN_MARK;
}

/** A body without its mark, and whether it carried one. */
export function unmark(text) {
  const trimmed = (text ?? "").trim();
  if (!trimmed.startsWith(UNWRITTEN_MARK)) return { text: trimmed, marked: false };
  return { text: trimmed.slice(UNWRITTEN_MARK.length).trim(), marked: true };
}

/** The title page block. `titles` is what the writer would put above the script. */
export function titlePage({ title, episode, credit, author, draftDate, notes }) {
  const lines = [];
  if (title) lines.push(`Title: ${title}`);
  if (episode) lines.push(`Episode: ${episode}`);
  if (credit) lines.push(`Credit: ${credit}`);
  if (author) lines.push(`Author: ${author}`);
  if (draftDate) lines.push(`Draft date: ${draftDate}`);
  if (notes && notes.length) {
    lines.push("Notes:");
    for (const line of notes) lines.push(`\t${line}`);
  }
  return lines.join("\n");
}

/**
 * The whole wall as Fountain text.
 *
 * @param state the board
 * @param options.title the board's name; options.project the project's name
 *   (a series title); options.premise; options.draftDate an ISO date string
 */
export function toFountain(state, options = {}) {
  const nameOf = new Map((state.characters ?? []).map((character) => [character.id, character.name]));
  const order = storyOrder(state);
  const beats = order.filter((note) => note.rank === "beat").length;
  const revisionOf = revisionMarks(state);

  const notes = [];
  if (options.premise) notes.push(`Premise: ${options.premise}`);
  if (state.logline) notes.push(`Logline: ${state.logline}`);
  if (state.revision) notes.push(`Revision: ${revisionLine(state)}; a changed scene carries a [[changed in the revision]] note.`);
  notes.push(
    `From the wall: ${order.length} card${order.length === 1 ? "" : "s"}, ${beats} beat${beats === 1 ? "" : "s"}, about ${formatPages(boardEighths(state))} of ${formatPages(state.targetEighths)} pages.`,
  );

  const head = titlePage({
    title: options.title || "Untitled",
    episode: options.episode,
    author: options.author,
    draftDate: options.draftDate ? options.draftDate.slice(0, 10) : undefined,
    notes,
  });

  const body = [];
  let beat = 0;
  for (const note of order) {
    if (note.rank === "beat") {
      beat += 1;
      body.push(`# ${beat}. ${note.headline || "Untitled beat"}`);
      body.push("");
    }
    body.push(sceneHeading(note));
    body.push("");
    if (note.headline && sceneHeading(note) !== `.${upper(note.headline)}`) {
      body.push(`= ${note.headline}`);
      body.push("");
    }
    const marks = [];
    const revisionMarksFor = (_list, card) => Boolean(revisionOf.get(card.id)?.revised);
    const cast = (note.characterIds ?? []).map((id) => nameOf.get(id)).filter(Boolean);
    if (cast.length) marks.push(`with ${cast.join(", ")}`);
    if (note.plants) marks.push("plants something to pay off later");
    if (note.open) marks.push(`open: ${note.open}`);
    const onThreads = (state.threads ?? []).filter((thread) => thread.noteIds.includes(note.id)).map((thread) => thread.name);
    if (onThreads.length) marks.push(`thread: ${onThreads.join(", ")}`);
    if (revisionMarksFor(marks, note)) marks.push(`changed in the ${state.revision.color} revision`);
    if (marks.length) {
      body.push(`[[${marks.join(" · ")}]]`);
      body.push("");
    }
    // The scene's text when it is written; the change line stands in until
    // then, marked so a printed page never passes a placeholder off as a scene.
    body.push(note.text && note.text.trim() ? note.text.trim() : standInFor(note));
    body.push("");
  }

  return `${head}\n\n${body.join("\n").trimEnd()}\n`;
}

// --- Fountain in (R23, slice b) ---------------------------------------------

const HEADING = /^(\.(?!\.)\s*(.+)|(?:INT|EXT|EST|INT\.?\/EXT|I\/E)[.\s].*)$/i;

/**
 * A Fountain document as scenes: heading, synopsis, section, and the body
 * lines under the heading. Title-page keys, sections (`#`), synopses (`=`),
 * notes (`[[ ]]`) and boneyards (slash-star comments) are read and kept out
 * of the body, so what comes back onto a card is the writing.
 */
export function fromFountain(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const titles = {};
  let i = 0;
  // Title page: `Key: value` lines (values may continue on indented lines) up to the first blank line.
  if (/^[A-Za-z][A-Za-z ]*:/.test(lines[0] ?? "")) {
    let key = null;
    while (i < lines.length && lines[i].trim() !== "") {
      const match = /^([A-Za-z][A-Za-z ]*):\s*(.*)$/.exec(lines[i]);
      if (match && !/^\s/.test(lines[i])) {
        key = match[1].trim().toLowerCase();
        titles[key] = match[2].trim();
      } else if (key) {
        titles[key] = `${titles[key]}${titles[key] ? "\n" : ""}${lines[i].trim()}`;
      }
      i += 1;
    }
  }
  const scenes = [];
  let current = null;
  let section = null;
  let inBoneyard = false;
  for (; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();
    if (inBoneyard) {
      if (line.includes("*/")) inBoneyard = false;
      continue;
    }
    if (line.startsWith("/*")) {
      if (!line.includes("*/")) inBoneyard = true;
      continue;
    }
    if (line.startsWith("#")) {
      section = line.replace(/^#+\s*/, "");
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      current = {
        heading: (heading[2] ?? line).trim().replace(/\s+/g, " "),
        forced: line.startsWith("."),
        synopsis: "",
        section,
        notes: [],
        body: [],
      };
      scenes.push(current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith("=")) {
      current.synopsis = `${current.synopsis}${current.synopsis ? " " : ""}${line.replace(/^=+\s*/, "")}`.trim();
      continue;
    }
    if (line.startsWith("[[") && line.endsWith("]]")) {
      current.notes.push(line.slice(2, -2).trim());
      continue;
    }
    current.body.push(raw.replace(/\s+$/, ""));
  }
  for (const scene of scenes) {
    while (scene.body.length && scene.body[0].trim() === "") scene.body.shift();
    while (scene.body.length && scene.body.at(-1).trim() === "") scene.body.pop();
    scene.text = scene.body.join("\n");
    delete scene.body;
  }
  return { titles, scenes };
}

function sameWords(a, b) {
  return a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Lay a parsed document onto the wall: the commands that write each scene's
 * text onto the card with the same heading (its place, or its headline) in
 * order, and create a card for a scene the wall does not have, after the
 * last matched one. Never deletes; a card the document does not mention keeps
 * its text. Returns commands for the kernel, so every door applies the same.
 */
export function mergeFountain(state, parsed) {
  const order = storyOrder(state);
  const used = new Set();
  const commands = [];
  let cursor = 0; // where in the wall's order the last match was
  const matched = [];
  for (const scene of parsed.scenes) {
    const headingOf = (note) => sceneHeading(note).slice(1);
    const wanted = scene.heading.toUpperCase();
    // First: the same heading at or after the cursor; then anywhere unused;
    // then a card whose headline is the synopsis.
    let found =
      order.slice(cursor).find((note) => !used.has(note.id) && sameWords(headingOf(note), wanted)) ??
      order.find((note) => !used.has(note.id) && sameWords(headingOf(note), wanted)) ??
      (scene.synopsis ? order.find((note) => !used.has(note.id) && sameWords(note.headline, scene.synopsis)) : undefined);
    if (found) {
      used.add(found.id);
      cursor = order.indexOf(found) + 1;
      // A scene whose body is the mark, or the card's own change line, is the
      // export of an unwritten card coming back: still unwritten, not a page.
      const body = unmark(scene.text);
      const standIn = !(found.text ?? "").trim() && (body.marked || sameWords(body.text, found.change ?? ""));
      if ((found.text ?? "") !== scene.text && !standIn) {
        commands.push({ type: "set_text", id: found.id, text: scene.text });
      }
      matched.push({ id: found.id, heading: scene.heading, created: false });
      continue;
    }
    // A new card, after the last matched one on the wall.
    const anchor = order[cursor - 1] ?? order.at(-1);
    const headline = scene.synopsis || titleCase(scene.heading);
    const isPlace = scene.forced && Boolean(scene.synopsis);
    const parts = splitHeading(scene.heading);
    const id = `scene-${Math.random().toString(36).slice(2, 8)}`;
    // A marked body is an unwritten scene: its words are the change line, not a page.
    const body = unmark(scene.text);
    commands.push({
      type: "create_note",
      id,
      headline,
      change: body.marked ? body.text || "What changes?" : scene.text ? firstSentence(scene.text) : "What changes?",
      location: isPlace ? titleCase(parts.place) : "",
      when: isPlace ? parts.when.toLowerCase() : "",
      text: body.marked ? "" : scene.text,
      x: anchor ? anchor.x + 40 : 140,
      y: anchor ? anchor.y + 40 : 140,
    });
    used.add(id);
    matched.push({ id, heading: scene.heading, created: true });
  }
  return { commands, matched };
}

function titleCase(words) {
  return words.toLowerCase().replace(/(^|\s)([a-z])/g, (m) => m.toUpperCase());
}

function firstSentence(text) {
  const first = text.trim().split(/(?<=[.!?])\s+/)[0] ?? "";
  return first.slice(0, 120);
}
