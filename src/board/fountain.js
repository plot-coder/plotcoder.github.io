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
import { readingOrder } from "./readWall.js";

function upper(text) {
  return text.trim().replace(/\s+/g, " ").toUpperCase();
}

/** A forced scene heading: the place, or the headline when the card has none. */
export function sceneHeading(note) {
  const place = typeof note.location === "string" ? note.location.trim() : "";
  const words = place || note.headline || "UNTITLED";
  return `.${upper(words)}`;
}

/** The title page block. `titles` is what the writer would put above the script. */
export function titlePage({ title, credit, author, draftDate, notes }) {
  const lines = [];
  if (title) lines.push(`Title: ${title}`);
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
  const order = readingOrder(state.notes);
  const beats = order.filter((note) => note.rank === "beat").length;

  const notes = [];
  if (options.premise) notes.push(`Premise: ${options.premise}`);
  if (state.logline) notes.push(`Logline: ${state.logline}`);
  notes.push(
    `From the wall: ${order.length} card${order.length === 1 ? "" : "s"}, ${beats} beat${beats === 1 ? "" : "s"}, about ${formatPages(boardEighths(state))} of ${formatPages(state.targetEighths)} pages.`,
  );

  const head = titlePage({
    title: options.title || "Untitled",
    credit: options.project && options.project !== options.title ? `An episode of ${options.project}` : undefined,
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
    const cast = (note.characterIds ?? []).map((id) => nameOf.get(id)).filter(Boolean);
    if (cast.length) marks.push(`with ${cast.join(", ")}`);
    if (note.plants) marks.push("plants something to pay off later");
    if (marks.length) {
      body.push(`[[${marks.join(" · ")}]]`);
      body.push("");
    }
    body.push(note.change || "");
    body.push("");
  }

  return `${head}\n\n${body.join("\n").trimEnd()}\n`;
}
