import { describe, expect, it } from "vitest";
import { helpWords, indexGuide, searchHelp } from "./help";
import { WORDS } from "./words";

const page = `<h1>For the writer</h1><ol class="toc"><li>What it is</li></ol>
<h2 id="s1">1. What it is</h2>
<p>PlotCoder is a wall of index cards for breaking a story before you write it.</p>
<h2 id="s5">5. The wall</h2>
<h3>A card</h3>
<p><b>New note</b> in the bar makes a card. Tap the words to type.</p>
<h3>Length, colour, rank</h3>
<p>A card is a <b>scene</b> until you mark it a <b>beat</b> — one of the turns — with the mark on the card&#39;s own edge.</p>
<p class="foot">This page is kept true with the app.</p>`;

describe("help (R64): the guide indexed and searched", () => {
  it("indexes the guide's paragraphs under their section and sub-head, and skips what comes before the first section", () => {
    const guide = indexGuide(page);
    expect(guide).toEqual([
      { id: "s1", title: "What it is", sub: "", text: "PlotCoder is a wall of index cards for breaking a story before you write it." },
      { id: "s5", title: "The wall", sub: "A card", text: "New note in the bar makes a card. Tap the words to type." },
      { id: "s5", title: "The wall", sub: "Length, colour, rank", text: "A card is a scene until you mark it a beat — one of the turns — with the mark on the card's own edge." },
    ]);
  });

  it("finds the word first, then the guide's paragraph, by the question's words, and links the guide's section", () => {
    const hits = searchHelp("how do I mark a beat", WORDS, indexGuide(page));
    expect(hits[0]).toMatchObject({ kind: "word", from: "The words · A beat" });
    const guideHit = hits.find((hit) => hit.kind === "guide");
    expect(guideHit).toMatchObject({ from: "The guide · The wall · Length, colour, rank", href: "/writers.html#s5" });
    expect(guideHit?.text).toContain("mark it a beat");
  });

  it("answers nothing for a question the guide and the words do not hold, and for no words at all", () => {
    expect(searchHelp("is there a spell checker", WORDS, indexGuide(page))).toEqual([]);
    // A plural finds its singular, and a short question is answered whole or not at all.
    expect(searchHelp("beats", WORDS, indexGuide(page))[0]).toMatchObject({ kind: "word", from: "The words · A beat" });
    expect(searchHelp("mark a beat in landscape", WORDS, indexGuide(page))).toEqual([]);
    expect(searchHelp("the and of", WORDS, indexGuide(page))).toEqual([]);
    expect(helpWords("How do I mark a beat?")).toEqual(["mark", "beat"]);
  });
});
