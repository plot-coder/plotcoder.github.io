// Final Draft in and out (R23, slices c3 and c4).
//
// An .fdx is XML: a Content of Paragraphs, each with a Type — Scene Heading,
// Action, Character, Parenthetical, Dialogue, Transition, General — and Text;
// dual dialogue is a Paragraph holding a DualDialogue of the two speakers'
// paragraphs; a scene's number rides on SceneProperties; the title page is a
// TitlePage of its own paragraphs. Out: the wall's scenes through the same
// parser the paginator uses, scene numbers by wall order. In: the paragraphs
// back into Fountain per scene, then the same merge as Fountain in — by
// heading and order, never deleting. No DOM: a small reader of exactly the
// tags used, so the MCP server reads the same file the browser does.

import { parseScene, TRANSITION } from "./paginate.js";
import { readingOrder } from "./readWall.js";
import { sceneHeading } from "./fountain.js";

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function unescapeXml(text) {
  return String(text)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&");
}

function paragraph(type, text, extra = "") {
  return `    <Paragraph Type="${type}"${extra}>\n      <Text>${escapeXml(text)}</Text>\n    </Paragraph>\n`;
}

function speechParagraphs(speech) {
  let out = paragraph("Character", speech.name.toUpperCase());
  for (const part of speech.parts) {
    out += paragraph(part.kind === "parenthetical" ? "Parenthetical" : "Dialogue", part.text);
  }
  return out;
}

/**
 * The whole wall as an .fdx document, in reading order: a heading per card
 * with its scene number, the scene's text through the paginator's parser
 * when written and the change line as action when not, and a title page.
 */
export function toFdx(state, options = {}) {
  const order = readingOrder(state.notes);
  let content = "";
  order.forEach((note, index) => {
    const number = index + 1;
    content += paragraph("Scene Heading", sceneHeading(note).slice(1), ` Number="${number}"`).replace(
      "<Text>",
      `<SceneProperties Length="" Page="" Title="${escapeXml(note.headline)}" />\n      <Text>`,
    );
    const elements = parseScene(note.text && note.text.trim() ? note.text : note.change || "");
    for (let i = 0; i < elements.length; i += 1) {
      const element = elements[i];
      if (element.kind === "action") content += paragraph("Action", element.text);
      else if (element.kind === "transition") content += paragraph("Transition", element.text);
      else if (element.kind === "centered") content += paragraph("General", element.text, ' Alignment="Center"');
      else if (element.kind === "speech") {
        const next = elements[i + 1];
        if (next && next.kind === "speech" && next.dual) {
          content += `    <Paragraph>\n      <DualDialogue>\n${speechParagraphs(element)}${speechParagraphs(next)}      </DualDialogue>\n    </Paragraph>\n`;
          i += 1;
        } else {
          content += speechParagraphs(element);
        }
      }
    }
  });

  const title = [];
  if (options.title) title.push(paragraph("General", options.title, ' Alignment="Center"'));
  if (options.project && options.project !== options.title) title.push(paragraph("General", `An episode of ${options.project}`, ' Alignment="Center"'));
  if (options.author) title.push(paragraph("General", `Written by ${options.author}`, ' Alignment="Center"'));
  if (options.draftDate) title.push(paragraph("General", options.draftDate.slice(0, 10)));
  title.push(paragraph("General", "Scene numbers follow the wall's order and are not locked."));

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n` +
    `<FinalDraft DocumentType="Script" Template="No" Version="5">\n` +
    `  <Content>\n${content}  </Content>\n` +
    `  <TitlePage>\n    <Content>\n${title.join("")}    </Content>\n  </TitlePage>\n` +
    `</FinalDraft>\n`
  );
}

/** Every Paragraph in a Content, in order, with Type and Text; nested DualDialogue flattened with a dual mark. */
function readParagraphs(xml) {
  const paragraphs = [];
  const re = /<Paragraph\b([^>]*)>([\s\S]*?)<\/Paragraph>/g;
  // DualDialogue holds inner Paragraphs; the lazy match above stops at the
  // first inner close, so read dual blocks first and blank them out.
  const dualRe = /<Paragraph\b[^>]*>\s*<DualDialogue>([\s\S]*?)<\/DualDialogue>\s*<\/Paragraph>/g;
  const duals = [];
  const stripped = xml.replace(dualRe, (_m, inner) => {
    duals.push(inner);
    return `<Paragraph Type="__dual${duals.length - 1}"></Paragraph>`;
  });
  let match;
  while ((match = re.exec(stripped)) !== null) {
    const attrs = match[1];
    const type = /Type="([^"]*)"/.exec(attrs)?.[1] ?? "Action";
    if (type.startsWith("__dual")) {
      const inner = duals[Number(type.slice(6))];
      const innerParagraphs = readParagraphs(inner);
      innerParagraphs.forEach((p, index) => {
        // The second speaker's cue gets the dual mark.
        if (p.type === "Character" && innerParagraphs.slice(0, index).some((q) => q.type === "Character")) p.dual = true;
      });
      paragraphs.push(...innerParagraphs);
      continue;
    }
    const texts = [...match[2].matchAll(/<Text\b[^>]*>([\s\S]*?)<\/Text>/g)].map((m) => unescapeXml(m[1]));
    const number = /Number="([^"]*)"/.exec(attrs)?.[1] ?? null;
    paragraphs.push({ type, text: texts.join("").replace(/\s+$/, ""), number });
  }
  return paragraphs;
}

/**
 * An .fdx document as the same scenes Fountain in produces: heading, body in
 * Fountain, and the title page's lines. Cues become capitals, parentheticals
 * stay in brackets, a second dual speaker gets ^, transitions end lines,
 * centred text is set in > <.
 */
export function fromFdx(xml) {
  const contentMatch = /<Content>([\s\S]*?)<\/Content>\s*(?:<TitlePage>|<\/FinalDraft>)/.exec(xml);
  const body = contentMatch ? contentMatch[1] : xml;
  const titleMatch = /<TitlePage>([\s\S]*?)<\/TitlePage>/.exec(xml);
  const titles = {};
  if (titleMatch) {
    const lines = readParagraphs(titleMatch[1]).map((p) => p.text).filter(Boolean);
    if (lines[0]) titles.title = lines[0];
    if (lines.length > 1) titles.notes = lines.slice(1).join("\n");
  }
  const scenes = [];
  let current = null;
  let lastKind = null;
  for (const p of readParagraphs(body)) {
    if (p.type === "Scene Heading") {
      current = { heading: p.text.trim().replace(/\s+/g, " "), forced: true, synopsis: "", section: null, notes: [], lines: [], number: p.number };
      scenes.push(current);
      lastKind = null;
      continue;
    }
    if (!current) continue;
    const text = p.text.trim();
    if (!text) continue;
    if (p.type === "Character") {
      current.lines.push("", `${text.toUpperCase()}${p.dual ? " ^" : ""}`);
    } else if (p.type === "Dialogue") {
      if (lastKind !== "Character" && lastKind !== "Parenthetical" && lastKind !== "Dialogue") current.lines.push("", "SPEAKER");
      current.lines.push(text);
    } else if (p.type === "Parenthetical") {
      current.lines.push(/^\(.*\)$/.test(text) ? text : `(${text})`);
    } else if (p.type === "Transition") {
      // A standard transition reads as one on its own; anything else is forced with >.
      current.lines.push("", TRANSITION.test(text) ? text : `> ${text}`);
    } else {
      // Action, General and anything else: a paragraph of action.
      current.lines.push("", /^[A-Z0-9 .,'!?-]+$/.test(text) && /[A-Z]/.test(text) ? `!${text}` : text);
    }
    lastKind = p.type;
  }
  for (const scene of scenes) {
    scene.text = scene.lines.join("\n").replace(/^\n+/, "").replace(/\n{3,}/g, "\n\n").trim();
    delete scene.lines;
  }
  return { titles, scenes };
}
