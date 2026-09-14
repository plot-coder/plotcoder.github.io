import { describe, expect, it } from "vitest";
import { applyCommand, EIGHTHS_PER_PAGE, emptyState, type BoardState, type Command } from "./reducer";
import { compareStructure, describeComparison, driftWord, MATCH_PAGES } from "./compareStructure";
import { TEMPLATES } from "./templates";

const NOW = "2026-01-01T00:00:00.000Z";

function run(state: BoardState, ...commands: Command[]) {
  return commands.reduce((current, command) => applyCommand(current, command, NOW).state, state);
}

/** A 60-page board with beats at the pages given, scenes filling between. */
function board(beatPages: number[], pagesSoFar: number) {
  let state = run(emptyState(), { type: "set_target", targetEighths: 60 * EIGHTHS_PER_PAGE });
  let page = 1;
  let index = 0;
  const step = (rank: "beat" | "scene", pages: number, headline: string) => {
    state = run(state, { type: "create_note", id: `${rank}-${index}`, headline, change: "Turns.", rank, x: 100 + index * 230, y: 100, lengthEighths: pages * EIGHTHS_PER_PAGE });
    index += 1;
    page += pages;
  };
  for (const at of beatPages) {
    if (at > page) step("scene", at - page, `Scene to p. ${at}`);
    step("beat", 1, `Beat at p. ${at}`);
  }
  if (pagesSoFar > page) step("scene", pagesSoFar - page, "The rest");
  return state;
}

describe("compareStructure (R52)", () => {
  it("sets each beat of the structure beside the nearest of the wall's, one to one and in order, within reach", () => {
    // Turns on 60 pages falls near p. 1, 6, 12, 15, 30, 37, 45, 54, 59.
    const state = board([2, 3, 11, 15], 15);
    const comparison = compareStructure(state, TEMPLATES[0].beats);
    expect(comparison.soFar).toBe(15);
    const rows = comparison.rows.map((row) => [row.name, row.page, row.match?.headline ?? null, row.drift, row.beyond]);
    expect(rows[0]).toEqual(["Opening image", 1, "Beat at p. 2", 1, false]);
    // The next in order takes the beat at 3, not the one at 2 again.
    expect(rows[1]).toEqual(["The inciting incident", 6, "Beat at p. 3", -3, false]);
    expect(rows[2]).toEqual(["The decision", 12, "Beat at p. 11", -1, false]);
    expect(rows[3]).toEqual(["Into the middle", 15, "Beat at p. 15", 0, false]);
    // Past the story so far: nothing yet, and said so.
    expect(rows[4]).toEqual(["The midpoint", 30, null, null, true]);
    expect(comparison.unmatched).toEqual([]);
  });

  it("never matches across more than the reach, never crosses, and names the wall's beats nothing answered", () => {
    const state = board([1, 20, 21], 25);
    const comparison = compareStructure(state, TEMPLATES[0].beats);
    // p. 6 and p. 12 have nothing within six pages once p. 1 is taken (20 is 8 away from 12).
    expect(comparison.rows[1].match).toBeNull();
    expect(comparison.rows[1].beyond).toBe(false);
    expect(comparison.rows[3].match?.headline).toBe("Beat at p. 20");
    // Into the middle (p. 15) took p. 20; the midpoint (p. 30) is 9 from 21: too far, and past the story.
    expect(comparison.rows[4].match).toBeNull();
    expect(comparison.unmatched.map((beat) => beat.headline)).toEqual(["Beat at p. 21"]);
    expect(MATCH_PAGES).toBe(6);
  });

  it("says the drift in a word or two, and describes the rows for a reply", () => {
    expect(driftWord(0)).toBe("here");
    expect(driftWord(-2)).toBe("near");
    expect(driftWord(-3)).toBe("3 pp early");
    expect(driftWord(12)).toBe("12 pp late");
    expect(driftWord(null)).toBeNull();
    const lines = describeComparison(compareStructure(board([2], 4), TEMPLATES[0].beats));
    expect(lines[0]).toBe('Opening image (p. 1) — yours: "Beat at p. 2" p. 2 · near');
    expect(lines[1]).toBe("The inciting incident (p. 6) — nothing yet: past p. 3, the story so far");
  });
});
