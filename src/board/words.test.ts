import { describe, expect, it } from "vitest";
import { WORD_GROUPS, WORDS, wordSentence, wordsAsText } from "./words";

describe("what these words mean (R42)", () => {
  it("says every word once, in the method's order, each in a sentence", () => {
    expect(WORD_GROUPS.map((group) => group.id)).toEqual(["first", "card", "around", "pages", "horizon"]);
    const ids = WORDS.map((word) => word.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const word of WORDS) {
      expect(word.name.length).toBeGreaterThan(0);
      expect(word.sentence.length).toBeGreaterThan(20);
      expect(word.sentence.trim().endsWith(".") || word.sentence.trim().endsWith("”")).toBe(true);
    }
    expect(ids.slice(0, 4)).toEqual(["wall", "card", "logline", "premise"]);
    expect(ids).toContain("beat");
  });

  it("never uses the room's second vocabulary without plain words beside it", () => {
    const beat = wordSentence("beat");
    expect(beat).toContain("eight to fifteen");
    expect(beat).not.toMatch(/inciting/i);
    expect(wordSentence("length")).toContain("of a script page");
    expect(wordSentence("corner")).toContain("pay off");
    expect(wordSentence("nope")).toBe("");
  });

  it("points at a thing on the wall only where the word is one", () => {
    const targets = Object.fromEntries(WORDS.map((word) => [word.id, word.target ?? null]));
    expect(targets.beat).toBe("beat");
    expect(targets.corner).toBe("corner");
    expect(targets.wall).toBeNull();
    expect(targets.runtime).toBeNull();
    expect(targets.agent).toBeNull();
  });

  it("reads as one text for the skill and an agent", () => {
    const text = wordsAsText();
    expect(text.startsWith("First\n  The wall:")).toBe(true);
    expect(text).toContain("\n\nOn a card\n  The change line:");
    expect(text).toContain("A beat: One of the eight to fifteen big turns");
  });
});
