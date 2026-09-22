import { describe, expect, it } from "vitest";
import { COLUMN, GUTTER, setLine, toMarkdown, toPlainText } from "./markdown";
import { applyCommand, seedState } from "./reducer";

const NOW = "2026-01-01T00:00:00.000Z";

const SCENE = ["Her father kept the site's books by hand.", "", "NESSA", "Who paid this?", "", "DESSIE", "(not looking up)", "Your father did his own books.", ""].join("\n");

function wall() {
  let state = seedState();
  state = applyCommand(state, { type: "set_logline", logline: "Can Maya forgive a useful lie?" }, NOW).state;
  state = applyCommand(state, { type: "set_rank", ids: ["maya-letter"], rank: "beat" }, NOW).state;
  state = applyCommand(state, { type: "set_location", ids: ["maya-letter"], location: "the piano shop" }, NOW).state;
  state = applyCommand(state, { type: "set_text", id: "maya-letter", text: SCENE }, NOW).state;
  return state;
}

describe("Markdown out (R54)", () => {
  it("reads the wall out: title, premise, logline, beats as headings, a heading per scene, the text or the change line", () => {
    const text = toMarkdown(wall(), { title: "Low Season", episode: "Episode 1 of 3 · Pilot", premise: "A season about a lie." });
    expect(text).toBe(
      [
        "# Low Season · Episode 1 of 3 · Pilot",
        "",
        "*A season about a lie.*",
        "",
        "**Can Maya forgive a useful lie?**",
        "",
        "## 1. Maya finds the letter",
        "",
        "### 1 · THE PIANO SHOP",
        "",
        "Her father kept the site's books by hand.",
        "",
        "**NESSA**  \nWho paid this?",
        "",
        "**DESSIE**  \n*(not looking up)*  \nYour father did his own books.",
        "",
        "### 2 · NO PLACE YET: TOM LIES ABOUT THE JOB",
        "",
        "**[Unwritten]** Maya starts to doubt him.",
        "",
        "### 3 · NO PLACE YET: THE LETTER IS READ ALOUD",
        "",
        "**[Unwritten]** The plan dies in the room.",
        "",
      ].join("\n"),
    );
  });

  it("marks an unwritten scene's change line with the mark in bold, so a reader can tell it from a page and from the synopsis line", () => {
    const text = toMarkdown(seedState(), { title: "Board 1" });
    expect(text).toContain("**[Unwritten]** She decides not to tell Tom.");
    expect(text).not.toContain("\nShe decides not to tell Tom.");
  });

  it("uses the board's name alone for a one-board project, and no premise line when there is none", () => {
    const text = toMarkdown(seedState(), { title: "Board 1" });
    expect(text.startsWith("# Board 1\n\n### 1 · NO PLACE YET: MAYA FINDS THE LETTER\n")).toBe(true);
    expect(text).not.toContain("**Can");
  });

  it("carries locked scene numbers", () => {
    let state = wall();
    state = applyCommand(state, { type: "lock_numbers", order: ["maya-letter", "tom-lies", "letter-aloud"] }, NOW).state;
    state = applyCommand(state, { type: "create_note", id: "new", headline: "A new scene", change: "Something turns.", x: 320, y: 340 }, NOW).state;
    const text = toMarkdown(state, { title: "Pilot" });
    expect(text).toMatch(/### \d+A · NO PLACE YET: A NEW SCENE/);
  });
});

describe("plain text out (R54)", () => {
  it("sets each kind of line at its column, with the scene number in both margins", () => {
    expect(setLine({ kind: "heading", text: "THE PIANO SHOP", sceneNumber: 12 })).toBe(`12   ${"THE PIANO SHOP".padEnd(60)} 12`);
    expect(setLine({ kind: "action", text: "She waits." })).toBe(`${" ".repeat(GUTTER)}She waits.`);
    expect(setLine({ kind: "character", text: "NESSA" })).toBe(`${" ".repeat(GUTTER + COLUMN.character)}NESSA`);
    expect(setLine({ kind: "dialogue", text: "Who paid this?" })).toBe(`${" ".repeat(GUTTER + COLUMN.dialogue)}Who paid this?`);
    expect(setLine({ kind: "parenthetical", text: "(quietly)" })).toBe(`${" ".repeat(GUTTER + COLUMN.parenthetical)}(quietly)`);
    expect(setLine({ kind: "transition", text: "CUT TO:" })).toBe(`${" ".repeat(GUTTER + 60 - 7)}CUT TO:`);
    expect(setLine({ kind: "blank" })).toBe("");
    expect(setLine({ kind: "dual", left: { kind: "character", text: "A" }, right: { kind: "character", text: "B" } })).toBe(`${" ".repeat(GUTTER + 8)}A${" ".repeat(32 - 9)}${" ".repeat(8)}B`);
  });

  it("writes the script as it prints, titled, with the cue and the lines under it", () => {
    const text = toPlainText(wall(), { title: "Low Season", episode: "Episode 1 of 3 · Pilot" });
    const lines = text.split("\n");
    expect(lines[0].trim()).toBe("LOW SEASON");
    expect(lines[2].trim()).toBe("Episode 1 of 3 · Pilot");
    expect(text).toContain(`1    ${"THE PIANO SHOP".padEnd(60)} 1`);
    expect(text).toContain(`${" ".repeat(GUTTER)}Her father kept the site's books by hand.`);
    expect(text).toContain(`${" ".repeat(GUTTER + COLUMN.character)}NESSA\n${" ".repeat(GUTTER + COLUMN.dialogue)}Who paid this?`);
    expect(text).toContain(`${" ".repeat(GUTTER + COLUMN.parenthetical)}(not looking up)`);
    // An unwritten scene sets its change line as action, after the mark (round thirteen, entry 27).
    expect(text).toContain(`${" ".repeat(GUTTER)}[Unwritten] Maya starts to doubt him.`);
    expect(text).not.toContain(`${" ".repeat(GUTTER)}Maya starts to doubt him.`);
    expect(text).not.toMatch(/\n\n\n\n/);
    expect(text.endsWith("\n")).toBe(true);
  });
});

describe("revisions and the when reach the text forms (round fourteen, entries 27, 33, 45)", () => {
  const NOW2 = "2026-09-17T10:00:00.000Z";
  function revised() {
    let state = wall();
    state = applyCommand(state, { type: "set_when", ids: ["maya-letter"], when: "night" }, NOW2).state;
    state = applyCommand(state, { type: "start_revision", name: "Blue", color: "blue" }, NOW2).state;
    state = applyCommand(state, { type: "set_text", id: "maya-letter", text: SCENE.replace("Who paid this?", "Who paid this? And when?") }, NOW2).state;
    state = applyCommand(state, { type: "update_note", id: "tom-lies", change: "Maya starts to doubt him, hard." }, NOW2).state;
    return state;
  }

  it("marks a changed scene's heading in Markdown and says the revision at the top", () => {
    const text = toMarkdown(revised(), { title: "Pilot" });
    expect(text).toContain("*Blue revision · 2026-09-17 · a scene changed since it began has \\* after its heading*");
    expect(text).toContain("### 1 · THE PIANO SHOP - NIGHT \\*");
    expect(text).toContain("### 2 · NO PLACE YET: TOM LIES ABOUT THE JOB \\*");
    expect(text).toContain("### 3 · NO PLACE YET: THE LETTER IS READ ALOUD\n");
  });

  it("stars the changed lines in plain text's right margin, names the revision, and runs pages on with no gap", () => {
    const text = toPlainText(revised(), { title: "Pilot" });
    expect(text).toContain("BLUE REVISION · 2026-09-17");
    expect(text).toContain(`1    ${"THE PIANO SHOP - NIGHT".padEnd(60)} 1`);
    // The changed dialogue line is starred; the unchanged action line is not.
    expect(text).toMatch(/Who paid this\? And when\? +\*\n/);
    expect(text).not.toMatch(/Her father kept the site's books by hand\. +\*/);
    // A card whose change line moved, still unwritten: its heading carries the star.
    expect(text).toMatch(/2    NO PLACE YET: TOM LIES ABOUT THE JOB +2 \*\n/);
    expect(setLine({ kind: "action", text: "She waits." }, true)).toBe(`${" ".repeat(GUTTER)}She waits.`.padEnd(GUTTER + 60 + 1) + " *");
  });

  it("prints a page turn as the page's number in the right margin between blank lines, never as a bare blank line (pass 1a, entry 51; round fourteen, entry 33)", () => {
    let state = seedState();
    const long = Array(70).fill("A line of action that runs on.").join("\n");
    state = applyCommand(state, { type: "set_text", id: "maya-letter", text: long }, NOW2).state;
    const text = toPlainText(state, { title: "Long" });
    expect(text).not.toMatch(/runs on\.\n\n {5}A line of action/);
    expect(text).toMatch(/runs on\.\n\n {60,}2\.\n\n {5}A line of action/);
    expect(text).not.toMatch(/ 1\.\n/);
  });

  it("prints the byline and the contact under the title in plain text and in Markdown (pass 1a, entry 50)", () => {
    const state = seedState();
    const text = toPlainText(state, { title: "Ninety-Nine", author: "Robert Douglas", contact: "12 The Quay\nrobert@example.com" });
    expect(text).toMatch(/NINETY-NINE\n\n *Written by Robert Douglas\n\n {5}12 The Quay\n {5}robert@example.com\n/);
    const md = toMarkdown(state, { title: "Ninety-Nine", author: "Robert Douglas", contact: "robert@example.com" });
    expect(md.startsWith("# Ninety-Nine\n\n*Written by Robert Douglas*\n\nrobert@example.com  \n\n")).toBe(true);
  });
});

describe("the lock's date on the plain text's title (pass 1a, entry 108)", () => {
  it("prints when the numbers were locked, as lock_numbers promises", () => {
    let state = seedState();
    state = applyCommand(state, { type: "lock_numbers", order: state.notes.map((note) => note.id) }, "2026-09-22T12:00:00.000Z").state;
    expect(toPlainText(state, { title: "Pilot" })).toContain("SCENE NUMBERS LOCKED 2026-09-22");
  });
});
