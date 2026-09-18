// Take the pages with you (R54): the wall as Markdown, and the script as
// plain text — for a collaborator who lives in Google Docs rather than in a
// screenwriting app. Both are pure and shared by every door: the Pages
// panel's sheet, the console, and the MCP server's export_markdown and
// export_text.
//
// Markdown is the wall read out, in wall order: the board as the title, the
// premise and the logline under it, beats as second-level headings, one
// third-level heading per scene from its place (with its scene number, locked
// or by wall order), the headline as a synopsis line, then the scene's text —
// set by what each element is, from the same rules the paginator reads by —
// or, unwritten, its change line. Nothing invisible: Markdown has no notes
// that print as nothing, so the cast and the fold stay on the wall.
//
// Plain text is the script as it prints: the paginator's lines, Courier's
// columns kept with spaces, scene numbers in both margins, no page numbers.
// It pastes into anything and reads as a script wherever the font is
// monospaced.

import { storyOrder } from "./readWall.js";
import { sceneHeading, standInFor, UNWRITTEN_MARK } from "./fountain.js";
import { paginate, parseScene, WIDTH } from "./paginate.js";
import { revisionLine, revisionMarks, sceneNumbers } from "./numbering.js";

function upper(text) {
  return text.trim().replace(/\s+/g, " ").toUpperCase();
}

function documentTitle(options) {
  const title = options.title || "Untitled";
  return options.episode ? `${title} · ${options.episode}` : title;
}

/** A scene's text as Markdown paragraphs: action as it is, a speech as its cue in bold with the lines hard-broken under it. */
function sceneMarkdown(text) {
  const out = [];
  for (const element of parseScene(text)) {
    switch (element.kind) {
      case "break":
        out.push("---", "");
        break;
      case "speech": {
        const lines = [`**${element.name}**`];
        for (const part of element.parts) lines.push(part.kind === "parenthetical" ? `*${part.text}*` : part.text);
        // Two trailing spaces: Markdown's line break, so the cue and its lines stay on their own lines.
        out.push(lines.join("  \n"), "");
        break;
      }
      case "centered":
      case "transition":
      case "action":
      default:
        out.push(element.text, "");
    }
  }
  return out;
}

/**
 * The whole wall as Markdown.
 *
 * @param state the board
 * @param options.title the board's name; options.project the project's name
 *   when the project has several boards; options.premise
 */
export function toMarkdown(state, options = {}) {
  const order = storyOrder(state);
  const numbers = sceneNumbers(order, state.lock);
  const marks = revisionMarks(state);
  const out = [`# ${documentTitle(options)}`, ""];
  if (options.premise) out.push(`*${options.premise}*`, "");
  if (state.logline) out.push(`**${state.logline}**`, "");
  if (state.revision) out.push(`*${revisionLine(state)} · a scene changed since it began has \\* after its heading*`, "");
  let beat = 0;
  for (const note of order) {
    if (note.rank === "beat") {
      beat += 1;
      out.push(`## ${beat}. ${note.headline || "Untitled beat"}`, "");
    }
    const heading = sceneHeading(note).slice(1);
    const star = marks.get(note.id)?.revised ? " \\*" : "";
    out.push(`### ${numbers.get(note.id) ?? ""} · ${heading}${star}`.replace(/^###  · /, "### "), "");
    // The headline as a synopsis line — not under a beat, whose heading is the headline already.
    if (note.rank !== "beat" && note.headline && upper(note.headline) !== heading) out.push(`*${note.headline.trim()}*`, "");
    if (note.text && note.text.trim()) out.push(...sceneMarkdown(note.text));
    // Unwritten: the change line stands in after the mark in bold, a plain
    // paragraph so it never reads as a second synopsis line (round fourteen, 30).
    else out.push(`**${UNWRITTEN_MARK}**${standInFor(note).slice(UNWRITTEN_MARK.length)}`, "");
  }
  return `${out.join("\n").trimEnd()}\n`;
}

/** The column the script's body starts at: room for a scene number on the left. */
export const GUTTER = 5;

/** Where each kind of line starts, in characters from the body's left edge — the print stylesheet's columns. */
export const COLUMN = { character: 22, more: 22, parenthetical: 16, dialogue: 10 };

const DUAL_RIGHT = 32;
const DUAL_CUE = 8;

function pad(n) {
  return " ".repeat(Math.max(0, n));
}

function centred(text, width = WIDTH.action) {
  return pad(GUTTER + Math.floor((width - text.length) / 2)) + text;
}

/** One line of a dual-dialogue column, from the column's own left edge. */
function columnLine(line) {
  if (!line || line.kind === "blank") return "";
  const text = line.text ?? "";
  if (line.kind === "character") return pad(DUAL_CUE) + text;
  if (line.kind === "parenthetical") return pad(4) + text;
  return text;
}

/** A printed line set with spaces, a revision's star in the right margin when `star`. Exported for the test; the file is `toPlainText`. */
export function setLine(line, star = false) {
  const set = setLineBare(line);
  if (!star) return set;
  if (line.kind === "heading" && line.sceneNumber !== null && line.sceneNumber !== undefined) return `${set} *`;
  return `${set.padEnd(GUTTER + WIDTH.action + 1)} *`;
}

function setLineBare(line) {
  const text = line.text ?? "";
  switch (line.kind) {
    case "blank":
      return "";
    case "heading": {
      const number = line.sceneNumber === null || line.sceneNumber === undefined ? "" : String(line.sceneNumber);
      if (!number) return pad(GUTTER) + text;
      return `${number.padEnd(GUTTER)}${text.padEnd(WIDTH.action)} ${number}`.trimEnd();
    }
    case "character":
    case "more":
    case "parenthetical":
    case "dialogue":
      return pad(GUTTER + COLUMN[line.kind]) + text;
    case "transition":
      return pad(GUTTER + WIDTH.action - text.length) + text;
    case "centered":
      return centred(text);
    case "dual": {
      const left = pad(GUTTER) + columnLine(line.left);
      const right = columnLine(line.right);
      return right ? `${left.padEnd(GUTTER + DUAL_RIGHT)}${right}` : left.trimEnd();
    }
    case "action":
    default:
      return pad(GUTTER) + text;
  }
}

/**
 * The script as plain text, set as it prints.
 *
 * @param state the board
 * @param options.title the board's name; options.project the project's name
 *   when the project has several boards
 */
export function toPlainText(state, options = {}) {
  const order = storyOrder(state);
  const numbers = sceneNumbers(order, state.lock);
  const marks = revisionMarks(state);
  const result = paginate(
    order.map((note) => ({
      id: note.id,
      heading: sceneHeading(note).slice(1),
      text: note.text,
      change: standInFor(note),
      written: Boolean(note.text && note.text.trim()),
      number: numbers.get(note.id) ?? undefined,
    })),
  );
  const title = options.title || "Untitled";
  const out = [];
  if (options.episode) {
    out.push(centred(upper(title)), "", centred(options.episode));
  } else {
    out.push(centred(upper(title)));
  }
  if (state.revision) out.push("", centred(revisionLine(state).toUpperCase()));
  out.push("", "");
  // Pages run on with no gap: a page turn inside a paragraph is not a blank
  // line in a text file (round fourteen, entry 33).
  for (const page of result.pages) {
    for (const line of page.lines) {
      const mark = marks.get(line.noteId);
      const star = Boolean(mark) && (line.kind === "heading" ? mark.revised && mark.lines.size === 0 : typeof line.src === "number" && mark.lines.has(line.src));
      out.push(setLine(line, star));
    }
  }
  return `${out.join("\n").replace(/\n{4,}/g, "\n\n\n").trimEnd()}\n`;
}
