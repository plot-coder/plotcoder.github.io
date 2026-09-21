import { describe, expect, it } from "vitest";
import { applyCommand, emptyState, EIGHTHS_PER_PAGE, type BoardState, type Command } from "./reducer";
import { outOfOrder, shapeNote } from "./shape";

const NOW = "2026-09-21T00:00:00.000Z";
const run = (state: BoardState, ...commands: Command[]) => commands.reduce((current, command) => applyCommand(current, command, NOW).state, state);

/** Five cards in a row, wired in order: a turn, two scenes, a turn, a scene. */
function wall() {
  let state = emptyState();
  const cards: Array<[string, "beat" | "scene"]> = [["a", "beat"], ["b", "scene"], ["c", "scene"], ["d", "beat"], ["e", "scene"]];
  cards.forEach(([id, rank], index) => {
    state = run(state, { type: "create_note", id, headline: id.toUpperCase(), change: "x", rank, x: 100 + index * 230, y: 100, lengthEighths: EIGHTHS_PER_PAGE });
  });
  for (const [from, to] of [["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"]]) state = run(state, { type: "create_arrow", from, to, kind: "follows" });
  return state;
}

describe("what a change did to the story's shape (round twenty-three, entries 30, 31, 50, 52, 72)", () => {
  it("says nothing when the change touched neither the runs, the ending nor the wall's order", () => {
    const before = wall();
    expect(shapeNote(before, run(before, { type: "update_note", id: "b", headline: "B, renamed" }))).toEqual([]);
  });

  it("says which run changed when a scene is cut and kept", () => {
    const before = wall();
    const after = run(before, { type: "set_aside", ids: ["c"], aside: true });
    expect(shapeNote(before, after)).toEqual(['the runs between the turns — the run from "A" to "D" is now 1 card, about 1 page (was 2 cards, about 2 pages)']);
  });

  it("says when nothing runs between two turns any more, and when the ending moved", () => {
    const before = wall();
    const bare = run(before, { type: "set_aside", ids: ["b", "c"], aside: true });
    expect(shapeNote(before, bare)[0]).toBe('the runs between the turns — nothing runs from "A" to "D" now (was 2 cards, about 2 pages)');
    const ended = run(before, { type: "delete_note", id: "e" });
    expect(shapeNote(before, ended)).toContain('the last card of the story is now "D"');
    // A card the write itself appended moves the ending by definition: not news.
    const grown = run(before, { type: "create_note", id: "f", headline: "F", change: "x", x: 1300, y: 100 }, { type: "create_arrow", from: "e", to: "f", kind: "follows" });
    expect(shapeNote(before, grown, { added: "f" }).join(" ")).not.toContain("last card");
  });

  it("counts the cards the rows read out of the story's order, and says so only when the number grew", () => {
    const before = wall();
    expect(outOfOrder(before)).toBe(0);
    // The order becomes a, c, b, d, e by the arrows; no card moves.
    let after = before;
    for (const arrow of before.arrows) after = run(after, { type: "delete_arrow", id: arrow.id });
    for (const [from, to] of [["a", "c"], ["c", "b"], ["b", "d"], ["d", "e"]]) after = run(after, { type: "create_arrow", from, to, kind: "follows" });
    expect(outOfOrder(after)).toBe(1);
    expect(shapeNote(before, after).join(" ")).toContain("1 card now sits out of the story's order on the wall");
    expect(shapeNote(after, run(after, { type: "update_note", id: "b", headline: "again" }))).toEqual([]);
  });

  it("says a version behind a card went with it when the card changed its place in the order (entry 31)", () => {
    let before = run(wall(), { type: "create_note", id: "c2", headline: "C, another way", change: "x", x: 560, y: 100 }, { type: "set_alternative", id: "c2", of: "c" });
    let after = before;
    for (const arrow of before.arrows) after = run(after, { type: "delete_arrow", id: arrow.id });
    for (const [from, to] of [["a", "c"], ["c", "b"], ["b", "d"], ["d", "e"]]) after = run(after, { type: "create_arrow", from, to, kind: "follows" });
    expect(shapeNote(before, after).join("; ")).toContain('the version behind "C" went with it');
  });
});
