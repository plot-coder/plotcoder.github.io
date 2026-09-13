import { describe, expect, it } from "vitest";
import {
  applyCommand,
  EIGHTHS_PER_PAGE,
  emptyState,
  type BoardState,
  type Command,
} from "./reducer";
import { describeRuns, readingOrder, readWall } from "./readWall";

const NOW = "2026-01-01T00:00:00.000Z";

function run(state: BoardState, ...commands: Command[]) {
  return commands.reduce((current, command) => applyCommand(current, command, NOW).state, state);
}

type Card = {
  id: string;
  x?: number;
  y?: number;
  headline?: string;
  change?: string;
  rank?: "beat" | "scene";
  pages?: number;
};

/** A wall laid out as one row, left to right, unless a card says otherwise. */
function wall(...cards: Card[]) {
  return cards.reduce(
    (state, card, index) =>
      applyCommand(
        state,
        {
          type: "create_note",
          id: card.id,
          x: card.x ?? 100 + index * 230,
          y: card.y ?? 100,
          headline: card.headline ?? `Scene ${card.id}`,
          change: card.change ?? `Something changes in ${card.id}.`,
          rank: card.rank ?? "scene",
          lengthEighths: (card.pages ?? 1) * EIGHTHS_PER_PAGE,
        },
        NOW,
      ).state,
    emptyState(),
  );
}

describe("readingOrder", () => {
  it("reads rows top to bottom and cards left to right within a row", () => {
    const state = wall(
      { id: "c", x: 500, y: 100 },
      { id: "a", x: 100, y: 110 },
      { id: "b", x: 300, y: 95 },
      { id: "d", x: 100, y: 400 },
    );
    expect(readingOrder(state.notes).map((note) => note.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("does not treat a card slightly lower in the same row as a new row", () => {
    // Half a card of drift is still the same row — a free wall is never tidy.
    const state = wall({ id: "a", x: 100, y: 100 }, { id: "b", x: 330, y: 180 });
    expect(readingOrder(state.notes).map((note) => note.id)).toEqual(["a", "b"]);
  });

  it("leaves the notes it was given untouched", () => {
    const state = wall({ id: "b", x: 300, y: 100 }, { id: "a", x: 100, y: 100 });
    const before = state.notes.map((note) => note.id);
    readingOrder(state.notes);
    expect(state.notes.map((note) => note.id)).toEqual(before);
  });
});

describe("runs between beats", () => {
  it("counts the scene pages strictly between consecutive beats", () => {
    const state = wall(
      { id: "open", pages: 2 },
      { id: "b1", rank: "beat" },
      { id: "s1", pages: 3 },
      { id: "s2", pages: 1 },
      { id: "b2", rank: "beat", pages: 5 },
      { id: "s3", pages: 2 },
      { id: "b3", rank: "beat" },
      { id: "tail", pages: 1 },
    );
    const reading = readWall(state);
    expect(reading.beats.map((beat) => beat.id)).toEqual(["b1", "b2", "b3"]);
    expect(reading.runs).toEqual([
      { from: null, to: "b1", eighths: 2 * 8, cards: 1 },
      { from: "b1", to: "b2", eighths: 4 * 8, cards: 2 },
      { from: "b2", to: "b3", eighths: 2 * 8, cards: 1 },
      { from: "b3", to: null, eighths: 1 * 8, cards: 1 },
    ]);
  });

  it("omits an empty opening or closing run but keeps an empty run between beats", () => {
    const state = wall({ id: "b1", rank: "beat" }, { id: "b2", rank: "beat" });
    expect(readWall(state).runs).toEqual([{ from: "b1", to: "b2", eighths: 0, cards: 0 }]);
  });

  it("describes runs by headline for a person", () => {
    const state = wall(
      { id: "open", headline: "Maya wakes" },
      { id: "b1", rank: "beat", headline: "The letter" },
      { id: "s1", headline: "Tom lies", pages: 1.5 },
      { id: "b2", rank: "beat", headline: "Read aloud" },
    );
    expect(describeRuns(readWall(state), state)).toEqual([
      'Before "The letter": about 1 pages, 1 card',
      '"The letter" → "Read aloud": about 1 4/8 pages, 1 card',
    ]);
  });
});

describe("findings", () => {
  it("says nothing about an honest wall", () => {
    const state = run(
      wall(
        { id: "b1", rank: "beat" },
        { id: "s1" },
        { id: "b2", rank: "beat" },
        { id: "s2" },
        { id: "b3", rank: "beat" },
      ),
    );
    expect(readWall(state).findings).toEqual([]);
  });

  it("returns nothing at all for an empty board", () => {
    const reading = readWall(emptyState());
    expect(reading).toEqual({ order: [], beats: [], runs: [], findings: [] });
  });

  it("notes that runs cannot be read until a beat is marked, and passes no judgement on the count", () => {
    const reading = readWall(wall({ id: "a" }, { id: "b" }));
    expect(reading.findings).toEqual([
      expect.objectContaining({ kind: "unmarked" }),
    ]);
    expect(reading.findings[0].text).not.toMatch(/\b(8|15|too many|too few)\b/);
  });

  it("asks about a run more than twice the typical run (the sag detector)", () => {
    const state = wall(
      { id: "b1", rank: "beat", headline: "Inciting" },
      { id: "s1", pages: 3 },
      { id: "b2", rank: "beat", headline: "Lock in" },
      { id: "s2", pages: 4 },
      { id: "s3", pages: 4 },
      { id: "s4", pages: 4 },
      { id: "b3", rank: "beat", headline: "Midpoint" },
      { id: "s5", pages: 3 },
      { id: "b4", rank: "beat", headline: "All is lost" },
    );
    const sag = readWall(state).findings.filter((finding) => finding.kind === "sag");
    expect(sag).toHaveLength(1);
    expect(sag[0].ids).toEqual(["b2", "b3"]);
    expect(sag[0].text).toContain('About 12 pages run between "Lock in" and "Midpoint"');
    expect(sag[0].text).toMatch(/\?$/);
  });

  it("does not call an even wall saggy just because one run is a little longer", () => {
    const state = wall(
      { id: "b1", rank: "beat" },
      { id: "s1", pages: 4 },
      { id: "b2", rank: "beat" },
      { id: "s2", pages: 6 },
      { id: "b3", rank: "beat" },
      { id: "s3", pages: 5 },
      { id: "b4", rank: "beat" },
    );
    expect(readWall(state).findings.filter((f) => f.kind === "sag")).toEqual([]);
  });

  it("asks about placeholder headlines and missing change lines", () => {
    const state = run(
      wall({ id: "b1", rank: "beat" }),
      { type: "create_note", id: "blank", x: 400, y: 100 },
      {
        type: "create_note",
        id: "half",
        x: 700,
        y: 100,
        headline: "Tom lies",
        change: "   ",
      },
    );
    const unwritten = readWall(state).findings.filter((f) => f.kind === "unwritten");
    expect(unwritten.map((f) => f.ids)).toEqual([["blank"], ["half"]]);
    expect(unwritten[0].text).toContain('"New beat"');
    expect(unwritten[1].text).toContain('"Tom lies" has no change line');
  });

  it("only lists unlinked cards once at least half the wall uses arrows", () => {
    const base = wall(
      { id: "b1", rank: "beat" },
      { id: "s1" },
      { id: "s2" },
      { id: "s3" },
      { id: "s4" },
    );
    // One arrow links two of five cards: the wall is not using arrows yet.
    const oneArrow = run(base, { type: "create_arrow", from: "b1", to: "s1" });
    expect(readWall(oneArrow).findings.filter((f) => f.kind === "unlinked")).toEqual([]);

    // Two arrows link three of five: now a card with none is worth a question.
    const twoArrows = run(oneArrow, { type: "create_arrow", from: "s1", to: "s2" });
    const unlinked = readWall(twoArrows).findings.filter((f) => f.kind === "unlinked");
    expect(unlinked).toHaveLength(1);
    expect(unlinked[0].ids).toEqual(["s3", "s4"]);
    expect(unlinked[0].text).toBe(
      '2 cards have no arrow in or out: "Scene s3", "Scene s4". What sets them up, and what do they pay off?',
    );

    const single = run(twoArrows, { type: "create_arrow", from: "s2", to: "s3" });
    const one = readWall(single).findings.filter((f) => f.kind === "unlinked");
    expect(one[0].text).toBe(
      'One card has no arrow in or out: "Scene s4". What sets it up, and what does it pay off?',
    );
  });

  it("asks whether two cards with the same headline do the same job", () => {
    const state = wall(
      { id: "b1", rank: "beat" },
      { id: "a", headline: "Maya finds the letter" },
      { id: "b", headline: "Maya finds the letter." },
      { id: "c", headline: "Tom lies about the job" },
      { id: "d", headline: "Tom lies about his job" },
    );
    const dupes = readWall(state).findings.filter((f) => f.kind === "duplicate");
    expect(dupes.map((f) => f.ids)).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("does not call two short, different headlines duplicates", () => {
    const state = wall(
      { id: "b1", rank: "beat" },
      { id: "a", headline: "The letter" },
      { id: "b", headline: "The job" },
    );
    expect(readWall(state).findings.filter((f) => f.kind === "duplicate")).toEqual([]);
  });

  it("asks whether a group over twenty pages is one sequence or two", () => {
    const state = run(
      wall(
        { id: "b1", rank: "beat" },
        { id: "s1", pages: 8 },
        { id: "s2", pages: 8 },
        { id: "s3", pages: 8 },
        { id: "s4", pages: 2 },
      ),
      { type: "create_group", title: "The heist", noteIds: ["s1", "s2", "s3"] },
    );
    const sequence = readWall(state).findings.filter((f) => f.kind === "sequence");
    expect(sequence).toHaveLength(1);
    expect(sequence[0].ids).toEqual([state.groups[0].id]);
    expect(sequence[0].text).toBe(
      '"The heist" runs about 24 pages across 3 cards. Is it one sequence or two?',
    );
  });

  it("asks where a person in the cast comes in when they are on no card", () => {
    const state = run(
      wall({ id: "b1", rank: "beat" }, { id: "s1" }),
      { type: "add_character", id: "m", name: "Maya" },
      { type: "add_character", id: "l", name: "The landlord" },
      { type: "set_cast", ids: ["b1", "s1"], characterIds: ["m"] },
    );
    const uncast = readWall(state).findings.filter((f) => f.kind === "uncast");
    expect(uncast).toEqual([
      { kind: "uncast", ids: ["l"], text: "The landlord is in the cast but on no card. Where do they come in?" },
    ]);
  });

  it("asks where a person went when they vanish for more than a third of the story", () => {
    // 12 pages total. Tom is in the first page and the last, gone for 10 between.
    const state = run(
      wall(
        { id: "b1", rank: "beat", headline: "Tom arrives" },
        { id: "s1", pages: 4 },
        { id: "b2", rank: "beat", pages: 2 },
        { id: "s2", pages: 4 },
        { id: "b3", rank: "beat", headline: "Tom returns" },
      ),
      { type: "add_character", id: "t", name: "Tom" },
      { type: "add_character", id: "m", name: "Maya" },
      { type: "set_cast", ids: ["b1", "b3"], characterIds: ["t"] },
      { type: "set_cast", ids: ["s1", "b2", "s2"], characterIds: ["m"] },
    );
    const absent = readWall(state).findings.filter((f) => f.kind === "absent");
    expect(absent).toHaveLength(1);
    expect(absent[0].ids).toEqual(["t", "b1", "b3"]);
    expect(absent[0].text).toBe(
      'Tom is in "Tom arrives" and then not again until "Tom returns", about 10 pages later. Where are they in between?',
    );
  });

  it("does not ask about a person who keeps turning up", () => {
    const state = run(
      wall(
        { id: "b1", rank: "beat" },
        { id: "s1", pages: 3 },
        { id: "b2", rank: "beat" },
        { id: "s2", pages: 3 },
        { id: "b3", rank: "beat" },
      ),
      { type: "add_character", id: "m", name: "Maya" },
      { type: "set_cast", ids: ["b1", "b2", "b3"], characterIds: ["m"] },
    );
    expect(readWall(state).findings.filter((f) => f.kind === "absent")).toEqual([]);
  });

  it("never mutates the state it reads", () => {
    const state = wall({ id: "b1", rank: "beat" }, { id: "s1" }, { id: "b2", rank: "beat" });
    const snapshot = JSON.stringify(state);
    readWall(state);
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});
