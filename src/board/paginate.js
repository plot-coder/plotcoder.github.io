// The paginator (R23, slice c1).
//
// A scene's Fountain text becomes screenplay elements, the elements become
// lines at Courier 12 widths, and the lines become pages of fifty-five with
// the four rules that do most of the work:
//   - a heading keeps at least two lines of its scene with it, or moves;
//   - dialogue breaks between sentences, with (MORE) under and NAME (CONT'D) over;
//   - dual dialogue (^) sets two speakers side by side;
//   - scene numbers follow wall order and print in both margins.
// Nothing here is stored: the card holds Fountain, and every break, (MORE),
// (CONT'D) and number is computed each time. Pure and DOM-free, so the panel,
// the print, the strip, read the wall and the MCP server all count the same.

export const LINES_PER_PAGE = 55;

// Columns at ten characters to the inch, US Letter, the industry's margins.
export const WIDTH = {
  heading: 60, // 1.5" to 7.5"
  action: 60,
  character: 38, // cue at 3.7"
  parenthetical: 25, // 3.1" to 5.6"
  dialogue: 35, // 2.5" to 6.0"
  transition: 60,
  centered: 60,
  dual: 28, // each column of a pair
};

export const TRANSITION = /^(?:[A-Z][A-Z .]*TO:|FADE (?:IN|OUT)[.:]?|CUT TO BLACK[.:]?|SMASH CUT[.:]?|DISSOLVE[.:]?)$/;

/** Wrap words to a width; a word longer than the width stands alone. */
export function wrap(text, width) {
  const lines = [];
  for (const raw of text.split("\n")) {
    const words = raw.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      if (!line) line = word;
      else if (line.length + 1 + word.length <= width) line = `${line} ${word}`;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * A scene's Fountain body as elements: action, character, parenthetical,
 * dialogue, transition, centered, page break. Character cues are lines in
 * capitals followed by dialogue; `^` after a cue marks dual dialogue; `!`
 * forces action; `>` forces a transition or, with `<`, centres; notes,
 * synopses, sections and boneyards are not on the page.
 */
export function parseScene(text) {
  const src = (text ?? "").replace(/\r\n?/g, "\n");
  const lines = src.split("\n");
  const elements = [];
  let inBoneyard = false;
  let i = 0;
  const blankBefore = (index) => index === 0 || lines[index - 1].trim() === "";
  const blankAfter = (index) => index >= lines.length - 1 || lines[index + 1].trim() === "";
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    if (inBoneyard) {
      if (line.includes("*/")) inBoneyard = false;
      i += 1;
      continue;
    }
    if (line.startsWith("/*")) {
      if (!line.includes("*/")) inBoneyard = true;
      i += 1;
      continue;
    }
    if (/^={3,}$/.test(line)) {
      elements.push({ kind: "break" });
      i += 1;
      continue;
    }
    if (!line || line.startsWith("[[") || line.startsWith("=") || line.startsWith("#")) {
      i += 1;
      continue;
    }
    if (/^>.*<$/.test(line)) {
      elements.push({ kind: "centered", text: line.slice(1, -1).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith(">") || (TRANSITION.test(line) && blankBefore(i) && blankAfter(i))) {
      elements.push({ kind: "transition", text: line.replace(/^>\s*/, "") });
      i += 1;
      continue;
    }
    if (line.startsWith("!")) {
      elements.push({ kind: "action", text: line.slice(1) });
      i += 1;
      continue;
    }
    // A character cue: capitals (with an optional extension in brackets), a
    // blank line before, something after that is not blank.
    const cue = /^@?([^a-z]+?)(\s*\(.*\))?(\s*\^)?$/.exec(line);
    if (cue && blankBefore(i) && !blankAfter(i) && /[A-Z]/.test(line) && !TRANSITION.test(line)) {
      const dual = Boolean(cue[3]);
      const name = `${cue[1].replace(/^@/, "").trim()}${cue[2] ? ` ${cue[2].trim()}` : ""}`;
      const speech = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== "") {
        const part = lines[i].trim();
        if (/^\(.*\)$/.test(part)) speech.push({ kind: "parenthetical", text: part });
        else speech.push({ kind: "dialogue", text: part });
        i += 1;
      }
      elements.push({ kind: "speech", name, dual, parts: mergeDialogue(speech) });
      continue;
    }
    // Action: consecutive non-blank lines are one paragraph, line breaks kept.
    const paragraph = [raw.replace(/\s+$/, "")];
    i += 1;
    while (i < lines.length && lines[i].trim() !== "") {
      paragraph.push(lines[i].replace(/\s+$/, ""));
      i += 1;
    }
    elements.push({ kind: "action", text: paragraph.join("\n") });
  }
  return elements;
}

function mergeDialogue(parts) {
  const merged = [];
  for (const part of parts) {
    const last = merged.at(-1);
    if (part.kind === "dialogue" && last && last.kind === "dialogue") last.text = `${last.text} ${part.text}`;
    else merged.push({ ...part });
  }
  return merged;
}

/**
 * Elements as lines with a kind each, blank lines between blocks as the
 * page has them. A speech is one block: cue, then its parts. Dual pairs are
 * folded into one block of paired lines.
 */
export function layoutScene(elements, heading, sceneNumber) {
  const blocks = [];
  if (heading) blocks.push({ kind: "heading", lines: wrap(heading, WIDTH.heading).map((text) => ({ kind: "heading", text, sceneNumber })) });
  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index];
    if (element.kind === "break") {
      blocks.push({ kind: "break", lines: [] });
      continue;
    }
    if (element.kind === "action" || element.kind === "transition" || element.kind === "centered") {
      blocks.push({ kind: element.kind, lines: wrap(element.text, WIDTH[element.kind]).map((text) => ({ kind: element.kind, text })) });
      continue;
    }
    if (element.kind === "speech") {
      const next = elements[index + 1];
      if (next && next.kind === "speech" && next.dual) {
        const left = speechLines(element, WIDTH.dual);
        const right = speechLines(next, WIDTH.dual);
        const lines = [];
        for (let row = 0; row < Math.max(left.length, right.length); row += 1) {
          lines.push({ kind: "dual", left: left[row] ?? { kind: "blank", text: "" }, right: right[row] ?? { kind: "blank", text: "" } });
        }
        blocks.push({ kind: "dual", lines });
        index += 1;
        continue;
      }
      blocks.push({
        kind: "speech",
        name: element.name,
        parts: element.parts,
        width: WIDTH.dialogue,
        lines: speechLines(element, WIDTH.dialogue),
      });
    }
  }
  return blocks;
}

function speechLines(speech, dialogueWidth) {
  const lines = [{ kind: "character", text: speech.name.toUpperCase() }];
  for (const part of speech.parts) {
    const width = part.kind === "parenthetical" ? WIDTH.parenthetical : dialogueWidth;
    for (const text of wrap(part.text, width)) lines.push({ kind: part.kind, text });
  }
  return lines;
}

/**
 * Break blocks into pages. A block is preceded by one blank line unless it
 * opens a page. A speech that does not fit is split between sentences of its
 * dialogue, with (MORE) closing the page and NAME (CONT'D) opening the next;
 * a speech too short to split moves whole. A heading moves unless two lines
 * of its scene fit under it.
 */
export function paginateBlocks(scenes) {
  const pages = [];
  let page = { number: 1, lines: [] };
  const placement = new Map(); // noteId -> { page, endPage }
  const flush = () => {
    pages.push(page);
    page = { number: pages.length + 1, lines: [] };
  };
  const room = () => LINES_PER_PAGE - page.lines.length;
  const place = (noteId) => {
    const at = placement.get(noteId);
    if (!at) placement.set(noteId, { page: page.number, endPage: page.number });
    else at.endPage = page.number;
  };

  for (const scene of scenes) {
    const blocks = scene.blocks;
    for (let b = 0; b < blocks.length; b += 1) {
      const block = blocks[b];
      if (block.kind === "break") {
        if (page.lines.length) flush();
        continue;
      }
      const gap = page.lines.length ? 1 : 0;
      let need = gap + block.lines.length;
      if (block.kind === "heading") {
        // Two lines of the scene must fit under the heading: the gap and two lines of the next block.
        const following = blocks[b + 1];
        const under = following ? 1 + Math.min(2, following.lines.length) : 0;
        need += under;
        if (need > room() && page.lines.length) flush();
        push(page, block.lines, gap && page.lines.length ? 1 : 0, scene.id);
        place(scene.id);
        continue;
      }
      if (need <= room()) {
        push(page, block.lines, gap, scene.id);
        place(scene.id);
        continue;
      }
      if (block.kind === "speech") {
        const split = splitSpeech(block, room() - gap);
        if (split) {
          push(page, split.head, gap, scene.id);
          place(scene.id);
          flush();
          push(page, split.tail, 0, scene.id);
          place(scene.id);
          continue;
        }
      }
      if (block.kind === "action" && block.lines.length > 1 && room() - gap >= 2) {
        const take = room() - gap;
        push(page, block.lines.slice(0, take), gap, scene.id);
        place(scene.id);
        flush();
        push(page, block.lines.slice(take), 0, scene.id);
        place(scene.id);
        continue;
      }
      if (page.lines.length) flush();
      push(page, block.lines.slice(0, LINES_PER_PAGE), 0, scene.id);
      place(scene.id);
      for (let rest = LINES_PER_PAGE; rest < block.lines.length; rest += LINES_PER_PAGE) {
        flush();
        push(page, block.lines.slice(rest, rest + LINES_PER_PAGE), 0, scene.id);
        place(scene.id);
      }
    }
  }
  if (page.lines.length || pages.length === 0) pages.push(page);
  return { pages, placement };
}

function push(page, lines, gap, noteId) {
  if (gap) page.lines.push({ kind: "blank", text: "", noteId });
  for (const line of lines) page.lines.push({ ...line, noteId });
}

/**
 * Split a speech so `head` fits in `space` lines including (MORE), breaking
 * between sentences of its dialogue and re-wrapping each side, never after a
 * bare cue or a parenthetical. Returns null when no clean split leaves at
 * least one sentence on each page.
 */
export function splitSpeech(block, space) {
  const budget = space - 2; // the cue and the (MORE) line
  if (budget < 1 || !block.parts || !block.parts.length) return null;
  const partLines = (part) => wrap(part.text, part.kind === "parenthetical" ? WIDTH.parenthetical : block.width);
  let best = null;
  let before = 0;
  for (let p = 0; p < block.parts.length; p += 1) {
    const part = block.parts[p];
    if (part.kind === "dialogue") {
      const sentences = part.text.match(/[^.!?…]+[.!?…]+["')]*\s*|[^.!?…]+$/g) ?? [part.text];
      for (let cut = 1; cut < sentences.length; cut += 1) {
        const headText = sentences.slice(0, cut).join("").trim();
        if (before + wrap(headText, block.width).length <= budget) best = { p, cut, sentences };
      }
    }
    before += partLines(part).length;
    if (before > budget) break;
  }
  if (!best) return null;
  const headParts = [...block.parts.slice(0, best.p), { kind: "dialogue", text: best.sentences.slice(0, best.cut).join("").trim() }];
  const tailParts = [{ kind: "dialogue", text: best.sentences.slice(best.cut).join("").trim() }, ...block.parts.slice(best.p + 1)];
  const toLines = (parts) => parts.flatMap((part) => partLines(part).map((text) => ({ kind: part.kind, text })));
  const cue = block.lines[0];
  return {
    head: [cue, ...toLines(headParts), { kind: "more", text: "(MORE)" }],
    tail: [{ kind: "character", text: `${cue.text} (CONT'D)` }, ...toLines(tailParts)],
  };
}

/** Lines a scene's text runs to on the page, cue and gaps included; 0 when unwritten. */
export function sceneLineCount(text) {
  if (typeof text !== "string" || !text.trim()) return 0;
  const blocks = layoutScene(parseScene(text), null, null);
  let count = 0;
  for (const block of blocks) count += block.lines.length + (count ? 1 : 0);
  return count;
}

/**
 * The whole wall as pages. `scenes` is the wall in reading order as
 * { id, heading, text, change, written }; an unwritten scene sets its change
 * line as action so the document is always the whole story.
 */
export function paginate(scenes) {
  const laid = scenes.map((scene, index) => ({
    id: scene.id,
    number: index + 1,
    blocks: layoutScene(parseScene(scene.written ? scene.text : scene.change || ""), scene.heading, index + 1),
  }));
  const { pages, placement } = paginateBlocks(laid);
  return {
    pages,
    scenes: laid.map((scene) => ({ id: scene.id, number: scene.number, ...(placement.get(scene.id) ?? { page: 1, endPage: 1 }) })),
    pageCount: pages.length,
  };
}
