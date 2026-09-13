import { describe, expect, it } from "vitest";
import { readWall } from "./board/readWall";
import {
  applyCommand,
  EIGHTHS_PER_PAGE,
  emptyState,
  type BoardState,
  type Command,
} from "./board/reducer";
import { beatLabels, pageTicks, storyMapLayout, xFor } from "./storyMapLayout";

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
    expect(layout.totalEighths).toBe(48);
    expect(layout.targetEighths).toBe(120 * EIGHTHS_PER_PAGE);
    expect(layout.spanEighths).toBe(120 * EIGHTHS_PER_PAGE);
  });

  it("runs the axis past the target when the story is longer than it", () => {
    const state = run(wall({ id: "b1", rank: "beat", pages: 30 }), {
      type: "set_target",
      targetEighths: 20 * EIGHTHS_PER_PAGE,
    });
    expect(layoutOf(state).spanEighths).toBe(30 * EIGHTHS_PER_PAGE);
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

  it("gives an empty board an axis one page long and nothing on it", () => {
    const layout = layoutOf(emptyState());
    expect(layout.cards).toEqual([]);
    expect(layout.bands).toEqual([]);
    expect(layout.spanEighths).toBe(120 * EIGHTHS_PER_PAGE);
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
  });
});

describe("beatLabels", () => {
  const beat = (id: string, headline: string, page: number) => ({
    id,
    headline,
    beat: true,
    plants: false,
    characterIds: [],
    start: page * 8,
    length: 8,
  });

  it("alternates rows and gives a label the room up to the next beat on its row", () => {
    const beats = [
      beat("a", "Inciting incident", 0),
      beat("b", "Lock in", 20),
      beat("c", "Midpoint", 60),
      beat("d", "All is lost", 90),
    ];
    const labels = beatLabels(beats, 120 * 8, 1200, 20);
    expect(labels.map((label) => label.row)).toEqual([0, 1, 0, 1]);
    expect(labels.map((label) => label.text)).toEqual([
      "Inciting incident",
      "Lock in",
      "Midpoint",
      "All is lost",
    ]);
  });

  it("shortens a headline that will not fit, and falls back to the beat's number", () => {
    const beats = [
      beat("a", "A very long headline for a beat", 0),
      beat("b", "Second", 2),
      beat("c", "Third beat here", 4),
      beat("d", "Fourth", 6),
    ];
    const tight = beatLabels(beats, 120 * 8, 400, 10);
    expect(tight[0].text).toBe("1");
    expect(tight[1].text).toBe("2");
    const roomy = beatLabels([beat("a", "A very long headline for a beat", 0), beat("b", "Next", 40), beat("c", "After", 60)], 120 * 8, 300, 10);
    expect(roomy[0].text.endsWith("…")).toBe(true);
    expect(roomy[0].text.length).toBeLessThan("A very long headline for a beat".length);
  });
});
