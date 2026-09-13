import { describe, expect, it } from "vitest";
import { readWall } from "./board/readWall";
import {
  applyCommand,
  EIGHTHS_PER_PAGE,
  emptyState,
  type BoardState,
  type Command,
} from "./board/reducer";
import { axisSpan, beatLabels, pageTicks, storyMapLayout, xFor } from "./storyMapLayout";

const NOW = "2026-01-01T00:00:00.000Z";

function run(state: BoardState, ...commands: Command[]) {
  return commands.reduce((current, command) => applyCommand(current, command, NOW).state, state);
}

type Card = { id: string; headline?: string; rank?: "beat" | "scene"; pages?: number };

function wall(...cards: Card[]) {
  return cards.reduce(
    (state, card, index) =>
      applyCommand(
        state,
        {
          type: "create_note",
          id: card.id,
          x: 100 + index * 230,
          y: 100,
          headline: card.headline ?? `Scene ${card.id}`,
          change: "Something changes.",
          rank: card.rank ?? "scene",
          lengthEighths: (card.pages ?? 1) * EIGHTHS_PER_PAGE,
        },
        NOW,
      ).state,
    emptyState(),
  );
}

function layoutOf(state: BoardState) {
  return storyMapLayout(state, readWall(state));
}

describe("storyMapLayout", () => {
  it("places cards along the axis in reading order by cumulative pages", () => {
    const state = wall(
      { id: "b1", rank: "beat", pages: 2 },
      { id: "s1", pages: 3 },
      { id: "b2", rank: "beat" },
    );
    const layout = layoutOf(state);
    expect(layout.cards.map((card) => [card.id, card.start, card.length])).toEqual([
      ["b1", 0, 16],
      ["s1", 16, 24],
      ["b2", 40, 8],
    ]);
    expect(layout.cards.map((card) => card.number)).toEqual([1, null, 2]);
    expect(layout.cards[0]).toMatchObject({ change: "Something changes.", color: "yellow" });
    expect(layout.totalEighths).toBe(48);
    expect(layout.targetEighths).toBe(120 * EIGHTHS_PER_PAGE);
    // Six pages of story on a 120-page target: the axis fits the story, not
    // the target, so it never runs shorter than ten pages.
    expect(layout.spanEighths).toBe(10 * EIGHTHS_PER_PAGE);
    expect(layout.targetInRange).toBe(false);
  });

  it("runs the axis past the target when the story is longer than it", () => {
    const state = run(wall({ id: "b1", rank: "beat", pages: 30 }), {
      type: "set_target",
      targetEighths: 20 * EIGHTHS_PER_PAGE,
    });
    expect(layoutOf(state).spanEighths).toBe(30 * EIGHTHS_PER_PAGE);
    expect(layoutOf(state).targetInRange).toBe(true);
  });

  it("grows the axis with the story until the target comes into view, then holds", () => {
    const P = EIGHTHS_PER_PAGE;
    // Short: a quarter of headroom over the story.
    expect(axisSpan(40 * P, 120 * P)).toBe(50 * P);
    expect(axisSpan(80 * P, 120 * P)).toBe(100 * P);
    // Near: the target is within the headroom, so the axis holds at it.
    expect(axisSpan(100 * P, 120 * P)).toBe(120 * P);
    expect(axisSpan(120 * P, 120 * P)).toBe(120 * P);
    // Over: the axis follows the story again.
    expect(axisSpan(130 * P, 120 * P)).toBe(130 * P);
    // Never shorter than ten pages.
    expect(axisSpan(0, 120 * P)).toBe(10 * P);
    expect(axisSpan(3 * P, 120 * P)).toBe(10 * P);
  });

  it("draws a band for each run between beats and marks the one read the wall asked about", () => {
    const state = wall(
      { id: "b1", rank: "beat" },
      { id: "s1", pages: 3 },
      { id: "b2", rank: "beat" },
      { id: "s2", pages: 4 },
      { id: "s3", pages: 4 },
      { id: "s4", pages: 4 },
      { id: "b3", rank: "beat" },
      { id: "s5", pages: 3 },
      { id: "b4", rank: "beat" },
    );
    const { bands } = layoutOf(state);
    expect(bands.map((band) => [band.from, band.to, band.end - band.start, band.sag])).toEqual([
      ["b1", "b2", 3 * 8, false],
      ["b2", "b3", 12 * 8, true],
      ["b3", "b4", 3 * 8, false],
    ]);
  });

  it("carries setups as spans and folded cards nothing pays off", () => {
    const state = run(
      wall({ id: "b1", rank: "beat" }, { id: "s1", pages: 2 }, { id: "b2", rank: "beat" }),
      { type: "create_arrow", from: "b1", to: "b2", kind: "setup" },
      { type: "set_plant", ids: ["s1"], plants: true },
    );
    const layout = layoutOf(state);
    expect(layout.setups).toEqual([
      { id: state.arrows[0].id, from: "b1", to: "b2", start: 0, end: 24 },
    ]);
    expect(layout.unpaid).toEqual(["s1"]);
  });

  it("carries groups as page spans, and the cast by name", () => {
    const state = run(
      wall({ id: "a", pages: 2 }, { id: "b", pages: 3 }, { id: "c" }),
      { type: "create_group", title: "The heist", noteIds: ["a", "b"] },
      { type: "add_character", id: "m", name: "Maya" },
      { type: "set_cast", ids: ["c"], characterIds: ["m"] },
    );
    const layout = layoutOf(state);
    expect(layout.groups).toEqual([{ id: state.groups[0].id, title: "The heist", start: 0, end: 40 }]);
    expect(layout.cards[2].castNames).toEqual(["Maya"]);
  });

  it("gives an empty board an axis one page long and nothing on it", () => {
    const layout = layoutOf(emptyState());
    expect(layout.cards).toEqual([]);
    expect(layout.bands).toEqual([]);
    expect(layout.spanEighths).toBe(10 * EIGHTHS_PER_PAGE);
  });
});

describe("xFor and pageTicks", () => {
  it("maps eighths onto the padded axis", () => {
    expect(xFor(0, 800, 1000, 20)).toBe(20);
    expect(xFor(800, 800, 1000, 20)).toBe(980);
    expect(xFor(400, 800, 1000, 20)).toBe(500);
  });

  it("ticks every ten pages for a feature and every five for a short", () => {
    expect(pageTicks(120 * EIGHTHS_PER_PAGE).map((t) => t / 8)).toEqual([
      0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120,
    ]);
    expect(pageTicks(30 * EIGHTHS_PER_PAGE).map((t) => t / 8)).toEqual([0, 5, 10, 15, 20, 25, 30]);
    expect(pageTicks(10 * EIGHTHS_PER_PAGE).map((t) => t / 8)).toEqual([0, 2, 4, 6, 8, 10]);
  });
});

describe("beatLabels", () => {
  const beat = (id: string, headline: string, page: number, number: number) => ({
    id,
    headline,
    change: "",
    color: "yellow" as const,
    beat: true,
    number,
    plants: false,
    characterIds: [],
    castNames: [],
    location: "",
    measured: false,
    start: page * 8,
    length: 8,
  });

  it("numbers every name and gives a label the room up to the next beat", () => {
    const beats = [
      beat("a", "Inciting incident", 0, 1),
      beat("b", "Lock in", 20, 2),
      beat("c", "Midpoint", 60, 3),
      beat("d", "All is lost", 90, 4),
    ];
    const labels = beatLabels(beats, 120 * 8, 1200, 20);
    expect(labels.map((label) => label.text)).toEqual([
      "1 · Inciting incident",
      "2 · Lock in",
      "3 · Midpoint",
      "4 · All is lost",
    ]);
  });

  it("shortens a headline that will not fit, and leaves the name off when even a few letters would not", () => {
    const beats = [
      beat("a", "A very long headline for a beat", 0, 1),
      beat("b", "Second", 2, 2),
      beat("c", "Third beat here", 4, 3),
      beat("d", "Fourth", 6, 4),
    ];
    const tight = beatLabels(beats, 120 * 8, 400, 10);
    // Two pages apart on a 400px axis is a few pixels: no name fits, and the
    // block's own number stands for it, so no label is made.
    expect(tight.map((label) => label.id)).not.toContain("a");
    expect(tight.map((label) => label.id)).not.toContain("b");
    const roomy = beatLabels(
      [beat("a", "A very long headline for a beat", 0, 1), beat("b", "Next", 30, 2)],
      120 * 8,
      500,
      10,
    );
    expect(roomy[0].text.startsWith("1 · ")).toBe(true);
    expect(roomy[0].text.endsWith("…")).toBe(true);
    expect(roomy[0].text.length).toBeLessThan("1 · A very long headline for a beat".length);
  });
});
