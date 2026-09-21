// The day-one guide is cut from the whole guide by its headings: a renamed
// heading must fail here, not leave an agent with half a page.

import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { DAY_ONE_SECTIONS, dayOne } from "./day-one.mjs";

const guide = fs.readFileSync(new URL("../.cursor/skills/plotcoder-board/SKILL.md", import.meta.url), "utf8").replace(/^---\n[\s\S]*?\n---\n+/, "");

describe("the day-one guide (round twenty-three, entries 1, 2)", () => {
  it("is the day's sections of the guide, word for word, and none of what waits for the writer's word", () => {
    const text = dayOne(guide);
    for (const heading of DAY_ONE_SECTIONS) expect(text).toContain(`\n${heading}\n`);
    for (const heading of ["### Reading", "### Cards", "### Cast"]) expect(text).toContain(`\n${heading}\n`);
    for (const heading of ["### Pages", "### Structure", "## The production half", "## The account door", "## The account, the app, or the file"]) expect(text).not.toContain(`\n${heading}\n`);
    // Word for word: a paragraph of the guide's Cards section is in it unchanged.
    const cards = guide.slice(guide.indexOf("### Cards"), guide.indexOf("### Cast"));
    expect(text).toContain(cards.trimEnd());
    // And it is the smaller read it claims to be.
    expect(text.length).toBeLessThan(guide.length * 0.75);
  });

  it("fails loudly when the guide renames a section it is cut from", () => {
    expect(() => dayOne(guide.replace("## What the tools will refuse", "## What is refused"))).toThrow(/no section "## What the tools will refuse"/);
  });
});
