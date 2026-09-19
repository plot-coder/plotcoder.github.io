import { describe, expect, it } from "vitest";
import { applyPoses, snapshotPoses } from "./organizeLayout";
import type { MockNote } from "./noteMock";

function card(id: string, x: number, y: number, rotate = -2.2): MockNote {
  return {
    id,
    headline: id,
    change: "",
    color: "yellow",
    x,
    y,
    rotate,
    z: 1,
    rank: "scene",
    lengthEighths: 8,
    characterIds: [],
    plants: false,
    payoffBoardId: null,
  payoffNoteId: null,
  open: "",
    location: "",
    when: "",
  whenOpen: "",
    text: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("snapshotPoses and applyPoses", () => {
  it("restore the exact positions a Scatter is meant to undo", () => {
    const notes = [card("a", 40, 400, -2.2), card("b", 700, 80, 1.6)];
    const before = snapshotPoses(notes);
    const tidied = applyPoses(notes, [
      { id: "a", x: 88, y: 110, rotate: 0 },
      { id: "b", x: 308, y: 110, rotate: 0 },
    ]);
    expect(tidied.map((note) => [note.x, note.y, note.rotate])).toEqual([
      [88, 110, 0],
      [308, 110, 0],
    ]);
    const restored = applyPoses(tidied, before);
    expect(restored.map((note) => [note.x, note.y, note.rotate])).toEqual([
      [40, 400, -2.2],
      [700, 80, 1.6],
    ]);
  });

  it("leaves a card alone when no pose names it", () => {
    const notes = [card("a", 10, 20), card("b", 30, 40)];
    const restored = applyPoses(notes, [{ id: "a", x: 0, y: 0, rotate: 0 }]);

    expect(restored[0]).toMatchObject({ x: 0, y: 0 });
    expect(restored[1]).toMatchObject({ x: 30, y: 40 });
  });
});
