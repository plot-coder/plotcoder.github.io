import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyPoses, organizeReadingOrder, snapshotPoses } from "./organizeLayout";
import type { MockGroup, MockNote } from "./noteMock";

// The layout wraps against the viewport, so pin it: a 1400px window gives a
// 920px row, which fits exactly four cards before wrapping.
const VIEWPORT = 1400;
const ROW_Y = 110;
const ROW_X = 88;
const STEP = 220; // card width 192 + gap 28

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
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function group(id: string, noteIds: string[]): MockGroup {
  return { id, title: id, noteIds };
}

function spots(notes: MockNote[]) {
  return Object.fromEntries(notes.map((note) => [note.id, [note.x, note.y]]));
}

beforeEach(() => {
  vi.stubGlobal("window", { innerWidth: VIEWPORT });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("organizeReadingOrder", () => {
  it("lines loose cards up in reading order, top-to-bottom then left-to-right", () => {
    const notes = [
      card("third", 900, 400),
      card("first", 500, 20),
      card("second", 30, 60),
    ];

    const laid = organizeReadingOrder(notes, []);

    expect(spots(laid)).toEqual({
      first: [ROW_X, ROW_Y],
      second: [ROW_X + STEP, ROW_Y],
      third: [ROW_X + STEP * 2, ROW_Y],
    });
  });

  it("straightens every card it places", () => {
    const notes = [card("a", 0, 0, -2.2), card("b", 40, 40, 1.6)];
    const laid = organizeReadingOrder(notes, []);
    expect(laid.map((note) => note.rotate)).toEqual([0, 0]);
  });

  it("wraps onto a second row once the row is full", () => {
    const notes = Array.from({ length: 5 }, (_, i) => card(`n${i}`, i * 10, i * 10));
    const laid = organizeReadingOrder(notes, []);

    expect(spots(laid)).toEqual({
      n0: [ROW_X, ROW_Y],
      n1: [ROW_X + STEP, ROW_Y],
      n2: [ROW_X + STEP * 2, ROW_Y],
      n3: [ROW_X + STEP * 3, ROW_Y],
      n4: [ROW_X, ROW_Y + 220],
    });
  });

  it("gives each group its own band above the loose cards", () => {
    const notes = [card("a", 0, 0), card("b", 220, 0), card("c", 440, 0)];
    const laid = organizeReadingOrder(notes, [group("g1", ["a", "b"])]);

    // Group members are indented and pushed down to clear the frame title.
    expect(spots(laid)).toEqual({
      a: [108, 164],
      b: [328, 164],
      c: [ROW_X, 404],
    });
  });

  it("ignores a group that has fewer than two cards on the board", () => {
    const notes = [card("a", 0, 0), card("b", 220, 0)];
    const laid = organizeReadingOrder(notes, [group("g1", ["a", "ghost"])]);

    expect(spots(laid)).toEqual({
      a: [ROW_X, ROW_Y],
      b: [ROW_X + STEP, ROW_Y],
    });
  });

  it("stacks two groups in reading order, each below the last", () => {
    const notes = [
      card("a", 0, 0),
      card("b", 220, 0),
      card("c", 0, 600),
      card("d", 220, 600),
    ];
    const laid = organizeReadingOrder(notes, [
      group("late", ["c", "d"]),
      group("early", ["a", "b"]),
    ]);
    const placed = spots(laid);

    // The "early" group wins the top band even though it was listed second,
    // and the next band clears the first one's frame and title.
    expect(placed.a[1]).toBe(164);
    expect(placed.b[1]).toBe(164);
    expect(placed.c[1]).toBe(458);
    expect(placed.d[1]).toBe(458);
  });

  describe("when only part of the board is selected", () => {
    it("leaves the unselected cards exactly where they were", () => {
      const notes = [card("a", 700, 700), card("b", 900, 700), card("keep", 12, 34)];
      const laid = organizeReadingOrder(notes, [], ["a", "b"]);

      expect(spots(laid).keep).toEqual([12, 34]);
    });

    it("tidies the selection into its own top-left corner, not the board's", () => {
      const notes = [card("a", 700, 740), card("b", 950, 700)];
      const laid = organizeReadingOrder(notes, [], ["a", "b"]);

      // Origin is the top-left of the selection: min x = 700, min y = 700.
      expect(spots(laid)).toEqual({
        b: [700, 700],
        a: [700 + STEP, 700],
      });
    });
  });
});

describe("snapshotPoses and applyPoses", () => {
  it("restore the exact positions a Scatter is meant to undo", () => {
    const notes = [card("a", 13, 17, -2.2), card("b", 400, 250, 1.6)];
    const before = snapshotPoses(notes);

    const organized = organizeReadingOrder(notes, []);
    expect(spots(organized)).not.toEqual(spots(notes));

    const restored = applyPoses(organized, before);
    expect(restored.map((note) => [note.x, note.y, note.rotate])).toEqual([
      [13, 17, -2.2],
      [400, 250, 1.6],
    ]);
  });

  it("leaves a card alone when no pose names it", () => {
    const notes = [card("a", 10, 20), card("b", 30, 40)];
    const restored = applyPoses(notes, [{ id: "a", x: 0, y: 0, rotate: 0 }]);

    expect(restored[0]).toMatchObject({ x: 0, y: 0 });
    expect(restored[1]).toMatchObject({ x: 30, y: 40 });
  });
});
