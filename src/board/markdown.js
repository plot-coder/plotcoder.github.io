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

import { readingOrder } from "./readWall.js";
import { sceneHeading, standInFor } from "./fountain.js";
import { paginate, parseScene, WIDTH } from "./paginate.js";
import { sceneNumbers } from "./numbering.js";

function upper(text) {
  return text.trim().replace(/\s+/g, " ").toUpperCase();
}

function documentTitle(options) {
  const title = options.title || "Untitled";
  return options.project && options.project !== title ? `${options.project} · ${title}` : title;
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
  const order = readingOrder(state.notes);
  const numbers = sceneNumbers(order, state.lock);
  const out = [`# ${documentTitle(options)}`, ""];
  if (options.premise) out.push(`*${options.premise}*`, "");
  if (state.logline) out.push(`**${state.logline}**`, "");
  let beat = 0;
  for (const note of order) {
    if (note.rank === "beat") {
      beat += 1;
      out.push(`## ${beat}. ${note.headline || "Untitled beat"}`, "");
    }
    const heading = sceneHeading(note).slice(1);
    out.push(`### ${numbers.get(note.id) ?? ""} · ${heading}`.replace(/^###  · /, "### "), "");
    if (note.headline && upper(note.headline) !== heading) out.push(`*${note.headline.trim()}*`, "");
    if (note.text && note.text.trim()) out.push(...sceneMarkdown(note.text));
    // Unwritten: the change line stands in, marked and in italics, so a reader
    // in Docs can tell the one written scene from sixteen placeholders.
    else out.push(`*${standInFor(note)}*`, "");
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

/** A printed line set with spaces. Exported for the test; the file is `toPlainText`. */
export function setLine(line) {
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
  const order = readingOrder(state.notes);
  const numbers = sceneNumbers(order, state.lock);
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
  if (options.project && options.project !== title) {
    out.push(centred(upper(options.project)), "", centred(title));
  } else {
    out.push(centred(upper(title)));
  }
  out.push("", "");
  for (const page of result.pages) {
    if (page.number > 1) out.push("");
    for (const line of page.lines) out.push(setLine(line));
  }
  return `${out.join("\n").replace(/\n{4,}/g, "\n\n\n").trimEnd()}\n`;
}
