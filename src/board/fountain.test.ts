import { describe, expect, it } from "vitest";
import { sceneHeading, titlePage, toFountain } from "./fountain";
import { applyCommand, emptyState, seedState } from "./reducer";

const NOW = "2026-01-01T00:00:00.000Z";

describe("Fountain out (R23, slice a)", () => {
  it("forces a scene heading from the place, or the headline when there is none", () => {
    const seed = seedState();
    expect(sceneHeading(seed.notes[0])).toBe(".MAYA FINDS THE LETTER");
    const placed = applyCommand(seed, { type: "set_location", ids: [seed.notes[0].id], location: "the piano shop" }, NOW).state;
    expect(sceneHeading(placed.notes[0])).toBe(".THE PIANO SHOP");
  });

  it("writes a title page with the wall's numbers in its notes", () => {
    expect(titlePage({ title: "Episode 2", credit: "An episode of The Letter", draftDate: "2026-09-13", notes: ["Logline: x"] })).toBe(
      "Title: Episode 2\nCredit: An episode of The Letter\nDraft date: 2026-09-13\nNotes:\n\tLogline: x",
    );
  });

  it("lays the wall out in reading order: beats as sections, cards as scenes, cast and fold as notes", () => {
    let state = seedState();
    state = applyCommand(state, { type: "set_logline", logline: "Can Maya forgive a useful lie?" }, NOW).state;
    state = applyCommand(state, { type: "set_rank", ids: ["maya-letter"], rank: "beat" }, NOW).state;
    state = applyCommand(state, { type: "set_location", ids: ["maya-letter", "letter-aloud"], location: "the piano shop" }, NOW).state;
    state = applyCommand(state, { type: "set_plant", ids: ["maya-letter"], plants: true }, NOW).state;
    const text = toFountain(state, { title: "Episode 2", project: "The Letter", premise: "A season about a lie.", draftDate: "2026-09-13T10:00:00.000Z" });
    expect(text).toBe(
      [
        "Title: Episode 2",
        "Credit: An episode of The Letter",
        "Draft date: 2026-09-13",
        "Notes:",
        "\tPremise: A season about a lie.",
        "\tLogline: Can Maya forgive a useful lie?",
        "\tFrom the wall: 3 cards, 1 beat, about 3 of 120 pages.",
        "",
        "# 1. Maya finds the letter",
        "",
        ".THE PIANO SHOP",
        "",
        "= Maya finds the letter",
        "",
        "[[with Maya · plants something to pay off later]]",
        "",
        "She decides not to tell Tom.",
        "",
        ".TOM LIES ABOUT THE JOB",
        "",
        "[[with Tom, Maya]]",
        "",
        "Maya starts to doubt him.",
        "",
        ".THE PIANO SHOP",
        "",
        "= The letter is read aloud",
        "",
        "[[with Maya, Tom]]",
        "",
        "The plan dies in the room.",
        "",
      ].join("\n"),
    );
  });

  it("gives an empty wall a title page and nothing else", () => {
    const text = toFountain(emptyState(), { title: "Board 1" });
    expect(text.startsWith("Title: Board 1\nNotes:\n\tFrom the wall: 0 cards, 0 beats")).toBe(true);
    expect(text.trim().split("\n").at(-1)).toContain("From the wall");
  });
});
