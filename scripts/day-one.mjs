// The day-one guide (round twenty-three, entries 1, 2; round twenty-two's 6,
// 8 — asked three times): the part of the guide a day's work needs, cut from
// the guide itself by its headings, so the two can never say different things.
// The guide's own reading map names these parts; this is that map, applied.

/** The sections of the whole guide that are the day's work, by heading, in the guide's order. */
export const DAY_ONE_SECTIONS = [
  "## Use the MCP tools, not the mouse", // with Reading, Cards and Cast beneath it
  "## Workflow",
  "## What the tools will refuse",
  "## The words, when the writer asks",
  "## The reply's tail, presence, a sketch, and the camera",
  "## Do not have opinions about beat count, and do not treat page counts as facts",
];
/** Under "Use the MCP tools", the day's work stops here: the rest is for when the writer says the words. */
const LEAVE_FROM = "### Pages";

const HEAD = `# PlotCoder — the day-one guide

For an agent holding PlotCoder's tools: what a day's work needs — building a
wall from a writer's notes, reading it back, taking their directions. It is
cut from the whole guide, https://plotcoder.com/guide.md, word for word; go
there when the writer says **write it**, **how long**, **export**, **a
series** or a second board, **a structure** to compare with, or **lock the
numbers**. Wiring a server in is https://plotcoder.com/wiring.md and is not
for you: if the tools are in front of you, you are connected.

**Before you ask the writer anything:** \`list_workflows\`. Its first workflow
carries what a treatment should answer — the questions to put to the writer,
and the tool each answer lands in. Ask those, and then anything the writer's
notes raise that those do not. Invent no fact; a question is not an invention.
`;

/** Split a guide into its "## " sections, each with its heading line. */
function sections(guide) {
  const parts = [];
  let current = null;
  for (const line of guide.split("\n")) {
    if (line.startsWith("## ")) {
      current = { heading: line.trim(), lines: [line] };
      parts.push(current);
    } else if (current) current.lines.push(line);
  }
  return parts;
}

/** The day-one guide, from the whole one. Throws when a named section is gone, so a renamed heading fails the build and not an agent. */
export function dayOne(guide) {
  const all = sections(guide);
  // The method: everything between the reading map and the first "## " section.
  const intro = guide.slice(guide.indexOf("PlotCoder serves one method"), guide.indexOf("\n## "));
  if (!intro.startsWith("PlotCoder serves one method")) throw new Error('day-one: the guide no longer opens its method with "PlotCoder serves one method"');
  const out = [HEAD, intro.trimEnd(), ""];
  for (const heading of DAY_ONE_SECTIONS) {
    const found = all.find((part) => part.heading === heading);
    if (!found) throw new Error(`day-one: the guide has no section "${heading}"`);
    let lines = found.lines;
    if (heading === DAY_ONE_SECTIONS[0]) {
      const stop = lines.findIndex((line) => line.trim() === LEAVE_FROM);
      if (stop === -1) throw new Error(`day-one: the guide has no "${LEAVE_FROM}" under "${heading}"`);
      lines = lines.slice(0, stop);
    }
    out.push(lines.join("\n").trimEnd(), "");
  }
  return `${out.join("\n").trimEnd()}\n`;
}
