import { describe, expect, it } from "vitest";
import { fromFountain, mergeFountain, sceneHeading, titlePage, toFountain } from "./fountain";
import { applyCommand, emptyState, isMeasured, measuredEighths, noteEighths, seedState } from "./reducer";

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

describe("Fountain in (R23, slice b)", () => {
  const doc = [
    "Title: Episode 2",
    "Credit: An episode of The Letter",
    "Notes:",
    "\tLogline: Can Maya forgive a useful lie?",
    "",
    "# 1. Maya finds the letter",
    "",
    ".THE PIANO SHOP",
    "",
    "= Maya finds the letter",
    "",
    "[[with Maya]]",
    "",
    "Rain on the shop window. MAYA lifts the piano lid.",
    "",
    "MAYA",
    "Tom?",
    "",
    "/* an old draft of this scene */",
    "",
    "INT. THE FLAT - NIGHT",
    "",
    "Tom lies about the job. Maya says nothing.",
    "",
    ".THE PIANO SHOP",
    "",
    "= The letter is read aloud",
    "",
    "The plan dies in the room.",
    "",
  ].join("\n");

  it("parses a document into scenes with headings, synopses, sections and bodies", () => {
    const { titles, scenes } = fromFountain(doc);
    expect(titles.title).toBe("Episode 2");
    expect(titles.notes).toBe("Logline: Can Maya forgive a useful lie?");
    expect(scenes).toHaveLength(3);
    expect(scenes[0]).toMatchObject({
      heading: "THE PIANO SHOP",
      forced: true,
      synopsis: "Maya finds the letter",
      section: "1. Maya finds the letter",
      notes: ["with Maya"],
      text: "Rain on the shop window. MAYA lifts the piano lid.\n\nMAYA\nTom?",
    });
    expect(scenes[1]).toMatchObject({ heading: "INT. THE FLAT - NIGHT", forced: false, text: "Tom lies about the job. Maya says nothing." });
    expect(scenes[2].text).toBe("The plan dies in the room.");
  });

  it("round-trips: what the wall writes out reads back onto the same cards", () => {
    let state = seedState();
    state = applyCommand(state, { type: "set_location", ids: ["maya-letter", "letter-aloud"], location: "the piano shop" }, NOW).state;
    state = applyCommand(state, { type: "set_text", id: "maya-letter", text: "Rain on the window.\n\nMAYA\nTom?" }, NOW).state;
    const text = toFountain(state, { title: "Board 1" });
    const { commands } = mergeFountain(state, fromFountain(text));
    expect(commands).toEqual([]);
  });

  it("writes each scene's text onto the card with its heading in order, creates cards for the rest, and never deletes", () => {
    let state = seedState();
    state = applyCommand(state, { type: "set_location", ids: ["maya-letter", "letter-aloud"], location: "the piano shop" }, NOW).state;
    state = applyCommand(state, { type: "set_text", id: "tom-lies", text: "Kept as it was." }, NOW).state;
    const { commands, matched } = mergeFountain(state, fromFountain(doc));
    // Scene one lands on maya-letter, scene three on letter-aloud (the second piano shop, in order);
    // scene two has a heading the wall does not know and becomes a card.
    expect(matched.map((item) => [item.id.startsWith("scene-") ? "new" : item.id, item.created])).toEqual([
      ["maya-letter", false],
      ["new", true],
      ["letter-aloud", false],
    ]);
    expect(commands[0]).toMatchObject({ type: "set_text", id: "maya-letter" });
    expect(commands[1]).toMatchObject({ type: "create_note", headline: "Int. The Flat - Night", text: "Tom lies about the job. Maya says nothing." });
    // Scene three's body is letter-aloud's own change line: matched, still unwritten, no command.
    expect(commands).toHaveLength(2);
    // Applying them leaves tom-lies as it was.
    let next = state;
    for (const command of commands) next = applyCommand(next, command as never, NOW).state;
    expect(next.notes.find((note) => note.id === "tom-lies")?.text).toBe("Kept as it was.");
    expect(next.notes).toHaveLength(4);
  });

  it("measures a written scene and keeps the estimate for an unwritten one", () => {
    const state = applyCommand(seedState(), { type: "set_text", id: "maya-letter", text: Array(28).fill("A line.").join("\n") }, NOW).state;
    const written = state.notes.find((note) => note.id === "maya-letter")!;
    expect(isMeasured(written)).toBe(true);
    expect(noteEighths(written)).toBe(4);
    expect(measuredEighths("")).toBe(0);
    expect(measuredEighths("One line.")).toBe(1);
    const other = state.notes.find((note) => note.id === "tom-lies")!;
    expect(isMeasured(other)).toBe(false);
    // Unwritten and unsized: the estimate is the default page, and the card claims nothing.
    expect(other.lengthEighths).toBeNull();
    expect(noteEighths(other)).toBe(8);
    // Fountain out prints the text as the scene body, the change line otherwise.
    const text = toFountain(state, { title: "B" });
    expect(text).toContain("A line.\nA line.");
    expect(text).toContain("Maya starts to doubt him.");
  });
});
