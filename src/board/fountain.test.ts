import { describe, expect, it } from "vitest";
import { fromFountain, mergeFountain, sceneHeading, splitHeading, standInFor, titlePage, toFountain, unmark } from "./fountain";
import { applyCommand, emptyState, isMeasured, measuredEighths, noteEighths, seedState } from "./reducer";

const NOW = "2026-01-01T00:00:00.000Z";

describe("an open place on the heading (R61's edge, round twenty-one entry 25)", () => {
  it("heads the scene with the mark and the headline, the writer's words in the note beneath, and reads them back as an open place (round twenty-two, entry 70)", () => {
    const card = { headline: "The day Ruth tells Con where she was", location: "", locationOpen: "I don't know yet", when: "night" };
    const heading = sceneHeading(card as never);
    expect(heading).toBe(".PLACE NOT DECIDED: THE DAY RUTH TELLS CON WHERE SHE WAS - NIGHT");
    const round = mergeFountain(emptyState(), fromFountain(`${heading}\n\n= The day Ruth tells Con where she was\n\n[[with Ruth · place open: I don't know yet]]\n\nCon knows.\n`));
    expect(round.commands.find((command) => command.type === "create_note")).toMatchObject({ headline: "The day Ruth tells Con where she was", location: "", locationOpen: "I don't know yet", when: "night" });
    // Out and back on a wall that has the card: nothing to write.
    let wall = applyCommand(emptyState(), { type: "create_note", id: "day", headline: card.headline, change: "Con knows." }, NOW).state;
    wall = applyCommand(wall, { type: "set_location", ids: ["day"], open: "I don't know yet" } as never, NOW).state;
    expect(toFountain(wall, { title: "B" })).toContain(".PLACE NOT DECIDED: THE DAY RUTH TELLS CON WHERE SHE WAS\n\n= The day Ruth tells Con where she was\n\n[[place open: I don't know yet]]");
    expect(mergeFountain(wall, fromFountain(toFountain(wall, { title: "B" }))).commands).toEqual([]);
    // A script from before the change, the words after the mark: the same card, and the same open place on an empty wall.
    expect(mergeFountain(wall, fromFountain(".PLACE NOT DECIDED: I DON'T KNOW YET\n\n= The day Ruth tells Con where she was\n\n[Unwritten] Con knows.\n")).matched[0].created).toBe(false);
    const heading0 = ".PLACE NOT DECIDED: WHERE IT HAPPENS - NIGHT";
    const parsed = fromFountain(`${heading0}\n= The day Ruth tells Con where she was\n\nCon knows.\n`);
    const back = mergeFountain(emptyState(), parsed);
    const created = back.commands.find((command) => command.type === "create_note") as { location: string; locationOpen: string; when: string } | undefined;
    expect(created?.location).toBe("");
    expect(created?.locationOpen).toBe("where it happens");
    expect(created?.when).toBe("night");
  });
});

describe("a card with no place on the heading (rounds eighteen 46, nineteen 44, twenty 48)", () => {
  it("prints the headline after a mark, with the when after the dash", () => {
    expect(sceneHeading({ headline: "Con gives Ruth the only key to the shed", location: "", when: "" } as never)).toBe(
      ".NO PLACE YET: CON GIVES RUTH THE ONLY KEY TO THE SHED",
    );
    expect(sceneHeading({ headline: "Con gives Ruth the key", location: "", when: "night" } as never)).toBe(".NO PLACE YET: CON GIVES RUTH THE KEY - NIGHT");
    expect(sceneHeading({ headline: "", location: "" } as never)).toBe(".NO PLACE YET: UNTITLED");
  });

  it("goes out with the headline under it and comes back as the same card, nothing to write", () => {
    const seed = seedState();
    const out = toFountain(seed, { title: "B" });
    expect(out).toContain(".NO PLACE YET: MAYA FINDS THE LETTER\n\n= Maya finds the letter");
    expect(mergeFountain(seed, fromFountain(out)).commands).toEqual([]);
  });

  it("comes in on an empty wall as a card with no place, the headline as typed, the when its own", () => {
    const parsed = fromFountain(".NO PLACE YET: CON GIVES RUTH THE KEY - NIGHT\n= Con gives Ruth the key\n\n[Unwritten] The shed is hers too.\n");
    const created = mergeFountain(emptyState(), parsed).commands.find((command) => command.type === "create_note") as
      | { headline: string; location: string; locationOpen: string; when: string }
      | undefined;
    expect(created).toMatchObject({ headline: "Con gives Ruth the key", location: "", locationOpen: "", when: "night" });
    // Without the line under it, the words after the mark are the headline.
    const bare = mergeFountain(emptyState(), fromFountain(".NO PLACE YET: THE KEY\n\nHe hands it over.\n")).commands[0] as { headline: string; location: string };
    expect(bare).toMatchObject({ headline: "The Key", location: "" });
    // A headline with a dash of its own is not a headline and a when.
    const dashed = mergeFountain(emptyState(), fromFountain(".NO PLACE YET: MAYA - ALONE\n= Maya - alone\n\nShe waits.\n")).commands[0] as { headline: string; when: string };
    expect(dashed).toMatchObject({ headline: "Maya - alone", when: "" });
  });

  it("still answers to the bare headline, as a script from elsewhere or from before the mark names it", () => {
    const seed = seedState();
    const { commands, matched } = mergeFountain(seed, fromFountain(".MAYA FINDS THE LETTER\n\nRain on the window.\n"));
    expect(matched).toEqual([{ id: "maya-letter", heading: "MAYA FINDS THE LETTER", created: false }]);
    expect(commands).toEqual([{ type: "set_text", id: "maya-letter", text: "Rain on the window." }]);
    // A card with a place does not answer to its headline as a heading.
    const placed = applyCommand(seed, { type: "set_location", ids: ["maya-letter"], location: "the piano shop" }, NOW).state;
    expect(mergeFountain(placed, fromFountain(".MAYA FINDS THE LETTER\n\nRain.\n")).matched[0].created).toBe(true);
  });
});

describe("an unwritten scene whose change line is the app's placeholder (round twenty-two, entries 18, 69)", () => {
  it("prints the mark alone, or an open card's words as the writer's, never the app's question", () => {
    expect(standInFor({ change: "What changes?" } as never)).toBe("[Unwritten]");
    expect(standInFor({ change: "What changes?", open: "that is all I know about it" } as never)).toBe("[Unwritten] Open, by the writer's word: that is all I know about it");
    expect(standInFor({ change: "She decides not to tell Tom.", open: "whether Tom knows" } as never)).toBe("[Unwritten] She decides not to tell Tom.");
    const back = mergeFountain(emptyState(), fromFountain(".THE BOG ROAD\n= The morning after\n\n[Unwritten] Open, by the writer's word: that is all I know about it\n")).commands[0] as { open?: string; change: string; text: string };
    expect(back).toMatchObject({ open: "that is all I know about it", change: "What changes?", text: "" });
  });

  it("prints a change line's own open words and reads them back as the change line's open, not the card's (round twenty-four, entry 50)", () => {
    expect(standInFor({ change: "What changes?", changeOpen: "I don't know what changes yet" } as never)).toBe("[Unwritten] What changes is open, by the writer's word: I don't know what changes yet");
    // The card's own open wins when both are there: it is the wider claim.
    expect(standInFor({ change: "What changes?", open: "all of it", changeOpen: "what changes" } as never)).toBe("[Unwritten] Open, by the writer's word: all of it");
    const back = mergeFountain(emptyState(), fromFountain(".THE PIER\n= The pier\n\n[Unwritten] What changes is open, by the writer's word: I don't know what changes yet\n")).commands[0] as { open?: string; changeOpen?: string; change: string };
    expect(back).toMatchObject({ changeOpen: "I don't know what changes yet", change: "What changes?" });
    expect(back.open).toBeUndefined();
  });
});

describe("the title page with the target open (round twenty-two, entry 80)", () => {
  it("does not read the cards against 120", () => {
    const open = applyCommand(seedState(), { type: "set_target", open: "half an hour or a feature" } as never, NOW).state;
    const out = toFountain(open, { title: "B" });
    expect(out).toContain("pages, the target open (half an hour or a feature).");
    expect(out).not.toContain("of 120 pages");
  });
});

describe("Fountain out (R23, slice a)", () => {
  it("forces a scene heading from the place, or the marked headline when there is none", () => {
    const seed = seedState();
    expect(sceneHeading(seed.notes[0])).toBe(".NO PLACE YET: MAYA FINDS THE LETTER");
    const placed = applyCommand(seed, { type: "set_location", ids: [seed.notes[0].id], location: "the piano shop" }, NOW).state;
    expect(sceneHeading(placed.notes[0])).toBe(".THE PIANO SHOP");
  });

  it("prints the byline and the contact's lines on the title page (pass 1a, entry 50)", () => {
    expect(titlePage({ title: "Ninety-Nine", author: "Robert Douglas", draftDate: "2026-09-22", contact: "12 The Quay\nrobert@example.com" })).toBe(
      "Title: Ninety-Nine\nAuthor: Robert Douglas\nDraft date: 2026-09-22\nContact:\n\t12 The Quay\n\trobert@example.com",
    );
  });

  it("writes a title page with the wall's numbers in its notes", () => {
    expect(titlePage({ title: "The Letter", episode: "Episode 2 of 3 · The pier", draftDate: "2026-09-13", notes: ["Logline: x"] })).toBe(
      "Title: The Letter\nEpisode: Episode 2 of 3 · The pier\nDraft date: 2026-09-13\nNotes:\n\tLogline: x",
    );
  });

  it("lays the wall out in reading order: beats as sections, cards as scenes, cast and fold as notes", () => {
    let state = seedState();
    state = applyCommand(state, { type: "set_logline", logline: "Can Maya forgive a useful lie?" }, NOW).state;
    state = applyCommand(state, { type: "set_rank", ids: ["maya-letter"], rank: "beat" }, NOW).state;
    state = applyCommand(state, { type: "set_location", ids: ["maya-letter", "letter-aloud"], location: "the piano shop" }, NOW).state;
    state = applyCommand(state, { type: "set_plant", ids: ["maya-letter"], plants: true }, NOW).state;
    state = applyCommand(state, { type: "set_open", ids: ["maya-letter"], open: "whether Tom knows" }, NOW).state;
    const text = toFountain(state, { title: "The Letter", episode: "Episode 2 of 3 · The pier", premise: "A season about a lie.", draftDate: "2026-09-13T10:00:00.000Z" });
    expect(text).toBe(
      [
        "Title: The Letter",
        "Episode: Episode 2 of 3 · The pier",
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
        "[[with Maya · plants something to pay off later · open: whether Tom knows]]",
        "",
        "[Unwritten] She decides not to tell Tom.",
        "",
        ".NO PLACE YET: TOM LIES ABOUT THE JOB",
        "",
        "= Tom lies about the job",
        "",
        "[[with Tom, Maya]]",
        "",
        "[Unwritten] Maya starts to doubt him.",
        "",
        ".THE PIANO SHOP",
        "",
        "= The letter is read aloud",
        "",
        "[[with Maya, Tom]]",
        "",
        "[Unwritten] The plan dies in the room.",
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
    "Title: The Letter",
    "Episode: Episode 2 of 3 · The pier",
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
    expect(titles.title).toBe("The Letter");
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
    // Fountain out prints the text as the scene body, the change line — marked — otherwise.
    const text = toFountain(state, { title: "B" });
    expect(text).toContain("A line.\nA line.");
    expect(text).toContain("[Unwritten] Maya starts to doubt him.");
  });

  it("brings a marked stand-in back as an unwritten card, and makes an unwritten card from a marked scene the wall lacks (round thirteen, entry 27)", () => {
    const out = toFountain(seedState(), { title: "B" });
    const back = fromFountain(out);
    expect(back.scenes[1].text).toBe("[Unwritten] Maya starts to doubt him.");
    // Out then in: the wall's own stand-ins change nothing.
    expect(mergeFountain(seedState(), back).commands).toEqual([]);
    // A marked scene the wall lacks becomes a card that is still unwritten: the words are its change line.
    const extra = fromFountain(`${out}\n.THE PIER\n\n[Unwritten] Ciara reads the letter and says nothing.\n`);
    const { commands } = mergeFountain(seedState(), extra);
    expect(commands).toHaveLength(1);
    expect(commands[0]).toMatchObject({ type: "create_note", change: "Ciara reads the letter and says nothing.", text: "" });
    expect(unmark("[Unwritten] Words.")).toEqual({ text: "Words.", marked: true });
    expect(unmark("Words.")).toEqual({ text: "Words.", marked: false });
  });
});

describe("the when on a heading, out and back (R55)", () => {
  const NOW2 = "2026-09-17T10:00:00.000Z";
  it("prints after the place with a dash, splits back into place and when, and comes in as a new card's when", () => {
    const state = applyCommand(seedState(), { type: "set_location", ids: ["maya-letter"], location: "the piano shop" }, NOW2).state;
    const timed = applyCommand(state, { type: "set_when", ids: ["maya-letter"], when: "night" }, NOW2).state;
    expect(sceneHeading(timed.notes[0])).toBe(".THE PIANO SHOP - NIGHT");
    expect(splitHeading("THE PIANO SHOP - NIGHT")).toEqual({ place: "THE PIANO SHOP", when: "NIGHT" });
    expect(splitHeading("THE PIER")).toEqual({ place: "THE PIER", when: "" });
    const out = toFountain(timed, { title: "B" });
    expect(out).toContain(".THE PIANO SHOP - NIGHT");
    // Out then in: the same card, nothing to write.
    expect(mergeFountain(timed, fromFountain(out)).commands).toEqual([]);
    // A new scene with a when on its heading lands with place and when apart.
    const extra = fromFountain(`${out}\n.THE PIER - DAWN\n\n= She waits.\n\nShe waits.\n`);
    const made = mergeFountain(timed, extra).commands.find((command) => command.type === "create_note");
    expect(made).toMatchObject({ location: "The Pier", when: "dawn" });
  });

  it("notes a changed scene under a revision", () => {
    const revising = applyCommand(seedState(), { type: "start_revision", name: "Blue", color: "blue" }, NOW2).state;
    const changed = applyCommand(revising, { type: "update_note", id: "tom-lies", change: "Maya starts to doubt him, hard." }, NOW2).state;
    const out = toFountain(changed, { title: "B" });
    expect(out).toContain("Revision: Blue revision · 2026-09-17");
    expect(out).toContain("[[with Tom, Maya · changed in the blue revision]]");
    expect(out.split("[[with Maya]]").length).toBe(2);
  });
});

describe("the scene note says what is not decided about who is in it (round twenty-three, entry 54)", () => {
  it("carries a maybe with its mark, the writer's words for an open cast, and an open change line", () => {
    let state = applyCommand(seedState(NOW), { type: "set_cast", ids: ["maya-letter"], characterIds: ["maya"], maybeCharacterIds: ["tom"], open: "anyone else: I don't know" }, NOW).state;
    state = applyCommand(state, { type: "update_note", id: "maya-letter", changeOpen: "I don't know what changes yet" }, NOW).state;
    const text = toFountain(state, { title: "The Letter" });
    expect(text).toContain("[[with Maya, Tom? (? — not decided whether they are in it) · who else is in it, not decided: anyone else: I don't know");
    expect(text).toContain("change line open: I don't know what changes yet");
    // A card with nobody named and the cast left open says so, and no "with".
    const bare = applyCommand(state, { type: "set_cast", ids: ["maya-letter"], characterIds: [], maybeCharacterIds: [], open: "I don't know yet" }, NOW).state;
    expect(toFountain(bare, { title: "The Letter" })).toContain("[[who is in it, not decided: I don't know yet");
  });
});
