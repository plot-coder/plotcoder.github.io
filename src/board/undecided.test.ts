import { describe, expect, it } from "vitest";
import { applyCommand, emptyState, type BoardState, type Command } from "./reducer";
import { maybeLine, undecidedLines, undecidedPage } from "./undecided";

const NOW = "2026-09-26T00:00:00.000Z";
function run(state: BoardState, ...commands: Command[]) {
  return commands.reduce((current, command) => applyCommand(current, command, NOW).state, state);
}

describe("what a script carries of the wall's opens (R75)", () => {
  const wall = () =>
    run(
      emptyState(),
      { type: "create_note", id: "f", x: 0, y: 0, headline: "The first Friday", change: "Eleven in the queue." },
      { type: "create_note", id: "tea", x: 300, y: 0, headline: "The funeral tea", changeOpen: "I don't know what changes yet", castOpen: "Half the town is there and I could not tell you who." },
      { type: "create_note", id: "pier", x: 600, y: 0, headline: "The pier: the knife", change: "She throws it in." },
      { type: "create_note", id: "alone", x: 600, y: 0, headline: "The pier: alone, the card", changeOpen: "I don't know what changes yet" },
      { type: "set_alternative", id: "alone", of: "pier" },
      { type: "create_note", id: "bank", x: 900, y: 300, headline: "The bank", change: "The figure." },
      { type: "set_aside", ids: ["bank"], aside: true },
      { type: "create_arrow", from: "f", to: "tea", kind: "follows" },
      { type: "create_arrow", from: "tea", to: "pier", kind: "follows" },
      { type: "add_character", id: "m", name: "Mairead Doyle" },
      { type: "add_character", id: "d", name: "Declan Doyle" },
      { type: "add_character", id: "p", name: "Priya Nair" },
      { type: "set_cast", ids: ["f"], characterIds: ["m"], maybeCharacterIds: ["d", "p"] },
      { type: "update_character", id: "d", open: "Has he already signed something?" },
      { type: "add_open_line", text: "Acts: I have not decided how it divides." },
      { type: "set_logline", logline: "", open: "I don't know yet — leave it open." },
    );

  it("prints the maybe's line from the card, in the card's own form", () => {
    const state = wall();
    expect(maybeLine(state.notes.find((note) => note.id === "f")!, state)).toBe("Declan Doyle? Priya Nair? — not decided whether they are here.");
    expect(maybeLine(state.notes.find((note) => note.id === "pier")!, state)).toBe("");
  });

  it("gathers the last page in the reading's order: the film, the people, scene by scene, not in the film", () => {
    const page = undecidedPage(wall(), { project: [{ label: "The title", words: "Doyle's, or Last Orders" }], date: "2026-09-26T22:00:00.000Z" })!;
    expect(page.date).toBe("2026-09-26");
    expect(page.film).toEqual(["The title: Doyle's, or Last Orders", "Acts: I have not decided how it divides.", "The logline: I don't know yet — leave it open."]);
    expect(page.people).toEqual(["Declan Doyle — Has he already signed something?"]);
    expect(page.scenes).toEqual([
      "1 · The first Friday — whether Declan Doyle and Priya Nair are in it",
      "2 · The funeral tea — what changes: I don't know what changes yet; who is in it: Half the town is there and I could not tell you who.",
      '3 · The pier: the knife — held two ways: "The pier: alone, the card" is behind it, not chosen',
    ]);
    expect(page.outside).toEqual([
      '"The pier: alone, the card" — a version behind "The pier: the knife", not chosen; what changes: I don\'t know what changes yet',
      '"The bank" — set aside, not in the film',
    ]);
    const lines = undecidedLines(page);
    expect(lines[0]).toBe("WHAT IS NOT DECIDED");
    expect(lines).toContain("About the film");
    expect(lines).toContain("- 2 · The funeral tea — what changes: I don't know what changes yet; who is in it: Half the town is there and I could not tell you who.");
  });

  it("is null when nothing is open, held two ways or set aside", () => {
    const state = run(emptyState(), { type: "create_note", id: "a", x: 0, y: 0, headline: "A", change: "B." });
    expect(undecidedPage(state)).toBeNull();
    expect(undecidedLines(null)).toEqual([]);
  });
});
