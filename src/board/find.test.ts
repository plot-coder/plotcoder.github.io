import { describe, expect, it } from "vitest";
import { applyCommand, emptyState } from "./reducer";
import { addBoard, emptyProject } from "./project";
import { findCards } from "./find";

function series() {
  const project = addBoard(emptyProject("2026-01-01T00:00:00.000Z"), "Episode two").project;
  const [one, two] = project.boards;
  let a = emptyState();
  a = applyCommand(a, { type: "create_note", id: "key", headline: "Nell opens the office", change: "Nell finds a brass key that fits nothing", text: "The office.\n\nNELL\nA key. Brass. It fits nothing I know." }).state;
  a = applyCommand(a, { type: "create_note", id: "wall", headline: "The wall, first light", change: "Bram finds the crack", text: "The sea wall at dawn." }).state;
  a = applyCommand(a, { type: "create_arrow", from: "wall", to: "key" }).state;
  a = applyCommand(a, { type: "create_note", id: "aside", headline: "The spare key", change: "Nobody", text: "" }).state;
  a = applyCommand(a, { type: "set_aside", ids: ["aside"], aside: true }).state;
  let b = emptyState();
  b = applyCommand(b, { type: "create_note", id: "drawer", headline: "The chart drawer", change: "Nell finds the papers", text: "The brass key from the ledger drawer. It turns first time." }).state;
  return [{ meta: one, state: a }, { meta: two, state: b }];
}

describe("a card found across every board (R77 c)", () => {
  it("finds by headline, change line, page and id, board by board in story order, and says a card out of the film", () => {
    const boards = series();
    const key = findCards(boards, "brass key");
    expect(key.map((item) => [item.boardName, item.headline, item.where])).toEqual([
      ["Board 1", "Nell opens the office", "change"],
      ["Episode two", "The chart drawer", "page"],
    ]);
    expect(key[1].line).toBe("The brass key from the ledger drawer. It turns first time.");
    expect(findCards(boards, "KEY").map((item) => item.headline)).toEqual(["Nell opens the office", "The spare key", "The chart drawer"]);
    expect(findCards(boards, "key").find((item) => item.headline === "The spare key")?.inStory).toBe(false);
    expect(findCards(boards, "drawer")[0].where).toBe("id");
    expect(findCards(boards, "first light").map((item) => item.id)).toEqual(["wall"]);
    expect(findCards(boards, "  ")).toEqual([]);
    expect(findCards(boards, "nothing here")).toEqual([]);
  });
});
