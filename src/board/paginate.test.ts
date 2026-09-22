import { describe, expect, it } from "vitest";
import { classifyLines, LINES_PER_PAGE, layoutScene, paginate, parseScene, sceneLineCount, splitSpeech, wrap } from "./paginate";

describe("a heading that wraps (round twenty-four, entry 51)", () => {
  it("carries its scene number on its first line only", () => {
    const heading = "PLACE NOT DECIDED: THE MORNING AFTER - THE MORNING AFTER THE LAST NIGHT OF SERVICE AT DOYLE'S";
    const [block] = layoutScene([], heading, 8);
    expect(block.lines.length).toBeGreaterThan(1);
    expect(block.lines[0].sceneNumber).toBe(8);
    expect(block.lines.slice(1).every((line) => line.sceneNumber === undefined)).toBe(true);
  });
});

describe("wrap", () => {
  it("wraps at the width, keeps line breaks, and leaves a long word alone", () => {
    expect(wrap("Rain on the shop window. Maya lifts the lid.", 20)).toEqual(["Rain on the shop", "window. Maya lifts", "the lid."]);
    expect(wrap("one\ntwo", 20)).toEqual(["one", "two"]);
    expect(wrap("supercalifragilisticexpialidocious yes", 10)).toEqual(["supercalifragilisticexpialidocious", "yes"]);
  });
});

describe("parseScene", () => {
  it("reads action, cues with parentheticals and dialogue, dual dialogue, transitions and centred lines", () => {
    const text = [
      "Rain on the window.",
      "She waits.",
      "",
      "MAYA",
      "(reading)",
      "Tom? It's your writing.",
      "",
      "TOM ^",
      "It is fine.",
      "",
      "[[a note]]",
      "= a synopsis",
      "",
      "CUT TO:",
      "",
      "> THE END <",
      "",
      "!MAYA walks out.",
    ].join("\n");
    expect(parseScene(text)).toMatchObject([
      { kind: "action", text: "Rain on the window.\nShe waits.", at: 0 },
      { kind: "speech", name: "MAYA", dual: false, at: 3, parts: [{ kind: "parenthetical", text: "(reading)", at: 4 }, { kind: "dialogue", text: "Tom? It's your writing.", at: 5 }] },
      { kind: "speech", name: "TOM", dual: true, at: 7, parts: [{ kind: "dialogue", text: "It is fine." }] },
      { kind: "transition", text: "CUT TO:", at: 13 },
      { kind: "centered", text: "THE END", at: 15 },
      { kind: "action", text: "MAYA walks out.", at: 17 },
    ]);
  });

  it("does not take a capitalised line with nothing under it for a cue", () => {
    expect(parseScene("THE DOOR SLAMS.\n\nShe turns.")).toMatchObject([
      { kind: "action", text: "THE DOOR SLAMS." },
      { kind: "action", text: "She turns." },
    ]);
  });

  it("classifies every source line for the editor, keeping the writer's lines as they are", () => {
    expect(classifyLines("Rain.\n\nMAYA\n(reading)\nTom?\nWhy?\n\nCUT TO:\n\n= a synopsis")).toEqual([
      "action", "blank", "character", "parenthetical", "dialogue", "dialogue", "blank", "transition", "blank", "note",
    ]);
  });
});

describe("layoutScene", () => {
  it("lays a heading, action and a speech out as blocks with the page's widths, and pairs dual dialogue", () => {
    const blocks = layoutScene(parseScene("She waits.\n\nMAYA\nTom?\n\nTOM ^\nIt is fine. It's just not mine."), "INT. THE PIANO SHOP - DAY", 14);
    expect(blocks.map((block) => block.kind)).toEqual(["heading", "action", "dual"]);
    expect(blocks[0].lines[0]).toEqual({ kind: "heading", text: "INT. THE PIANO SHOP - DAY", sceneNumber: 14, src: -1 });
    const dual = blocks[2].lines;
    expect(dual[0].left?.text).toBe("MAYA");
    expect(dual[0].right?.text).toBe("TOM");
    expect(dual[1].left?.text).toBe("Tom?");
    // The right column wraps at the dual width; the words are all there.
    expect(dual.slice(1).map((line) => line.right?.text ?? "").join(" ").trim()).toBe("It is fine. It's just not mine.");
  });
});

describe("splitSpeech", () => {
  it("breaks dialogue between sentences with (MORE) and NAME (CONT'D), or not at all", () => {
    const block = layoutScene(parseScene("MARK\nI saw the ring was gone. I am not going to pretend I didn't. I saw it at dinner and I saw it again just now."), null, null)[0];
    const split = splitSpeech(block, 4);
    expect(split).not.toBeNull();
    expect(split!.head[0].text).toBe("MARK");
    expect(split!.head.at(-1)).toMatchObject({ kind: "more", text: "(MORE)" });
    expect(split!.head[split!.head.length - 2].text).toMatch(/\.$/);
    expect(split!.tail[0]).toMatchObject({ kind: "character", text: "MARK (CONT'D)" });
    expect(splitSpeech(block, 2)).toBeNull();
  });
});

describe("paginate", () => {
  const long = (sentences: number) => Array(sentences).fill("She waits for a light that does not come on.").join(" ");

  it("fills fifty-five lines, then turns the page", () => {
    const { pages, scenes } = paginate([
      { id: "a", heading: "INT. A - DAY", text: long(40), change: "", written: true },
      { id: "b", heading: "INT. B - DAY", text: long(40), change: "", written: true },
    ]);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0].lines).toHaveLength(LINES_PER_PAGE);
    expect(scenes[0]).toMatchObject({ id: "a", number: 1, page: 1 });
    expect(scenes[1].number).toBe(2);
    expect(pages[0].lines[0]).toMatchObject({ kind: "heading", sceneNumber: 1, noteId: "a" });
  });

  it("never leaves a heading alone at the foot of a page", () => {
    // Fill a page to two lines short of the end, then a new scene.
    const filler = { id: "a", heading: "INT. A - DAY", text: Array(51).fill("Line.").join("\n"), change: "", written: true };
    const { pages, scenes } = paginate([filler, { id: "b", heading: "INT. B - NIGHT", text: "Tom on the step.\nTwo cups.", change: "", written: true }]);
    expect(pages[0].lines.some((line) => line.kind === "heading" && line.noteId === "b")).toBe(false);
    expect(scenes[1].page).toBe(2);
    expect(pages[1].lines[0]).toMatchObject({ kind: "heading", noteId: "b" });
  });

  it("breaks a long speech across pages with (MORE) and (CONT'D)", () => {
    const filler = { id: "a", heading: "INT. A - DAY", text: Array(44).fill("Line.").join("\n"), change: "", written: true };
    const speech = { id: "b", heading: "INT. B - DAY", text: `MARK\n${long(12)}`, change: "", written: true };
    const { pages } = paginate([filler, speech]);
    const first = pages[0].lines;
    expect(first.at(-1)).toMatchObject({ kind: "more", text: "(MORE)" });
    expect(pages[1].lines[0]).toMatchObject({ kind: "character", text: "MARK (CONT'D)" });
  });

  it("sets an unwritten scene's change line as its action, and a === as a page break", () => {
    const { pages, scenes } = paginate([
      { id: "a", heading: "INT. A - DAY", text: "", change: "She hides it in the piano.", written: false },
      { id: "b", heading: "INT. B - DAY", text: "First.\n\n===\n\nSecond.", change: "", written: true },
    ]);
    expect(pages[0].lines.some((line) => line.text === "She hides it in the piano.")).toBe(true);
    expect(scenes[1].endPage).toBe(2);
    expect(pages[1].lines[0].text).toBe("Second.");
  });
});

describe("sceneLineCount", () => {
  it("counts the lines a scene runs to on the page, and zero for no text", () => {
    expect(sceneLineCount("")).toBe(0);
    expect(sceneLineCount("One line.")).toBe(1);
    expect(sceneLineCount("One.\n\nMAYA\nTom?")).toBe(4); // action, blank, cue, dialogue
    expect(sceneLineCount(Array(28).fill("A line.").join("\n"))).toBe(28);
  });
});
