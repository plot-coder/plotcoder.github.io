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
import { storyOrder } from "./readWall.js";
import { sceneHeading, standInFor } from "./fountain.js";
import { REVISION_HEX, revisionLine, revisionMarks, sceneNumbers } from "./numbering.js";

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

function paragraph(type, text, extra = "", revised = false) {
  // A revised paragraph's text carries the revision's id, as Final Draft marks one.
  const textAttr = revised ? ' RevisionID="1"' : "";
  return `    <Paragraph Type="${type}"${extra}>\n      <Text${textAttr}>${escapeXml(text)}</Text>\n    </Paragraph>\n`;
}

function speechParagraphs(speech, revisedAt = () => false) {
  let out = paragraph("Character", speech.name.toUpperCase(), "", revisedAt(speech.at));
  for (const part of speech.parts) {
    out += paragraph(part.kind === "parenthetical" ? "Parenthetical" : "Dialogue", part.text, "", revisedAt(part.at ?? speech.at));
  }
  return out;
}

/**
 * The whole wall as an .fdx document, in reading order: a heading per card
 * with its scene number, the scene's text through the paginator's parser
 * when written and the change line as action when not, and a title page.
 */
export function toFdx(state, options = {}) {
  const order = storyOrder(state);
  const numbers = sceneNumbers(order, state.lock);
  const marks = revisionMarks(state);
  let content = "";
  order.forEach((note, index) => {
    const number = numbers.get(note.id) ?? index + 1;
    const mark = marks.get(note.id);
    // A changed card with no changed text line (its headline, change or place moved) marks its heading.
    const headingRevised = Boolean(mark?.revised && mark.lines.size === 0);
    const revisedAt = (at) => Boolean(mark && typeof at === "number" && mark.lines.has(at));
    content += paragraph("Scene Heading", sceneHeading(note).slice(1), ` Number="${number}"`, headingRevised).replace(
      /<Text( RevisionID="1")?>/,
      (_m, attr) => `<SceneProperties Length="" Page="" Title="${escapeXml(note.headline)}" />\n      <Text${attr ?? ""}>`,
    );
    // Unwritten: the change line stands in as action, marked as every export marks it.
    const elements = parseScene(note.text && note.text.trim() ? note.text : standInFor(note));
    for (let i = 0; i < elements.length; i += 1) {
      const element = elements[i];
      if (element.kind === "action") content += paragraph("Action", element.text, "", revisedAt(element.at));
      else if (element.kind === "transition") content += paragraph("Transition", element.text, "", revisedAt(element.at));
      else if (element.kind === "centered") content += paragraph("General", element.text, ' Alignment="Center"', revisedAt(element.at));
      else if (element.kind === "speech") {
        const next = elements[i + 1];
        if (next && next.kind === "speech" && next.dual) {
          content += `    <Paragraph>\n      <DualDialogue>\n${speechParagraphs(element, revisedAt)}${speechParagraphs(next, revisedAt)}      </DualDialogue>\n    </Paragraph>\n`;
          i += 1;
        } else {
          content += speechParagraphs(element, revisedAt);
        }
      }
    }
  });

  const title = [];
  if (options.title) title.push(paragraph("General", options.title, ' Alignment="Center"'));
  if (options.episode) title.push(paragraph("General", options.episode, ' Alignment="Center"'));
  if (options.author) title.push(paragraph("General", `Written by ${options.author}`, ' Alignment="Center"'));
  if (options.draftDate) title.push(paragraph("General", options.draftDate.slice(0, 10)));
  // A lock is a fact about the document; that there is none is the app's business, not the title page's (round fifteen, entry 36).
  if (state.lock) title.push(paragraph("General", `Scene numbers locked ${String(state.lock.at).slice(0, 10)}.`));
  if (state.revision) title.push(paragraph("General", `${revisionLine(state)}; changed paragraphs are marked.`));
  // The revision set Final Draft shows its marks from (round fourteen, entry 45).
  const revisions = state.revision
    ? `  <Revisions ActiveSet="1" Location="7.50" RevisionMode="No" RevisionsShown="Active" ShowAllMarks="No" ShowAllSets="No">\n    <Revision Color="${REVISION_HEX[state.revision.color] ?? "#000000"}" FullRevision="No" ID="1" Mark="*" Name="${escapeXml(state.revision.name)}" Style="" />\n  </Revisions>\n`
    : "";

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n` +
    `<FinalDraft DocumentType="Script" Template="No" Version="5">\n` +
    `  <Content>\n${content}  </Content>\n` +
    `  <TitlePage>\n    <Content>\n${title.join("")}    </Content>\n  </TitlePage>\n` +
    revisions +
    `</FinalDraft>\n`
  );
}

/** Every Paragraph in a Content, in order, with Type and Text; nested DualDialogue flattened with a dual mark. */
function readParagraphs(xml) {
  const paragraphs = [];
  // A script note holds its own Paragraphs; take it out first so the outer
  // paragraph closes where it should. The receipt counts them from the body.
  xml = xml.replace(/<ScriptNote\b[\s\S]*?<\/ScriptNote>/g, "");
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
    // Marks a production draft carries that the wall does not hold (yet).
    const revised = /RevisionID="[^"]+"|Revision="[^"]+"/.test(match[2]) || /RevisionID="[^"]+"/.test(attrs);
    const locked = /Locked="Yes"/.test(attrs) || /SceneNumberLocked="Yes"/.test(match[2]);
    paragraphs.push({ type, text: texts.join("").replace(/\s+$/, ""), number, revised, locked });
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
  // The receipt (Roadmap 2, item 3): what was read and set aside, by count,
  // so a writer bringing a production draft in knows what the wall does not hold.
  const setAside = { scriptNotes: 0, revisedParagraphs: 0, lockedNumbers: 0, pageBreaks: 0, other: {} };
  let current = null;
  let lastKind = null;
  setAside.scriptNotes = (body.match(/<ScriptNote\b/g) ?? []).length;
  for (const p of readParagraphs(body)) {
    if (p.revised) setAside.revisedParagraphs += 1;
    if (p.locked) setAside.lockedNumbers += 1;
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
      if (p.type !== "Action" && p.type !== "General") setAside.other[p.type] = (setAside.other[p.type] ?? 0) + 1;
      // Action, General and anything else: a paragraph of action.
      current.lines.push("", /^[A-Z0-9 .,'!?-]+$/.test(text) && /[A-Z]/.test(text) ? `!${text}` : text);
    }
    lastKind = p.type;
  }
  setAside.pageBreaks = (body.match(/StartsNewPage="Yes"/g) ?? []).length;
  for (const scene of scenes) {
    scene.text = scene.lines.join("\n").replace(/^\n+/, "").replace(/\n{3,}/g, "\n\n").trim();
    delete scene.lines;
  }
  return { titles, scenes, setAside };
}

/** The receipt as one line for a sheet or a tool: "" when nothing was set aside. */
export function describeSetAside(setAside) {
  if (!setAside) return "";
  const parts = [];
  if (setAside.scriptNotes) parts.push(`${setAside.scriptNotes} script note${setAside.scriptNotes === 1 ? "" : "s"}`);
  if (setAside.revisedParagraphs) parts.push(`revision marks on ${setAside.revisedParagraphs} paragraph${setAside.revisedParagraphs === 1 ? "" : "s"}`);
  if (setAside.lockedNumbers) parts.push(`${setAside.lockedNumbers} locked scene number${setAside.lockedNumbers === 1 ? "" : "s"}`);
  if (setAside.pageBreaks) parts.push(`${setAside.pageBreaks} forced page break${setAside.pageBreaks === 1 ? "" : "s"}`);
  for (const [type, count] of Object.entries(setAside.other)) parts.push(`${count} ${type} paragraph${count === 1 ? "" : "s"} read as action`);
  return parts.length ? `Kept out of the wall: ${parts.join(" · ")}. Nothing was deleted.` : "";
}
