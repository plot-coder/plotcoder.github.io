import { describe, expect, it } from "vitest";
import { arrowLayout, noteAtPoint, noteCenter, noteContains, previewPath } from "./arrowGeometry";
import { NOTE_HEIGHT, NOTE_WIDTH, type MockNote } from "./noteMock";

function card(id: string, x: number, y: number, z = 1): MockNote {
  return {
    id,
    headline: id,
    change: "",
    color: "yellow",
    x,
    y,
    rotate: 0,
    z,
    rank: "scene",
    lengthEighths: 8,
  characterIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

// A horizontal pair: centers at (96, 96) and (496, 96).
const left = card("left", 0, 0);
const right = card("right", 400, 0);

describe("noteCenter", () => {
  it("is the middle of the paper", () => {
    expect(noteCenter(left)).toEqual({ x: NOTE_WIDTH / 2, y: NOTE_HEIGHT / 2 });
    expect(noteCenter(right)).toEqual({ x: 496, y: 96 });
  });
});

describe("noteContains", () => {
  it("counts the edges as inside", () => {
    expect(noteContains(left, { x: 0, y: 0 })).toBe(true);
    expect(noteContains(left, { x: NOTE_WIDTH, y: NOTE_HEIGHT })).toBe(true);
  });

  it("rejects a point past any edge", () => {
    expect(noteContains(left, { x: -1, y: 96 })).toBe(false);
    expect(noteContains(left, { x: 96, y: -1 })).toBe(false);
    expect(noteContains(left, { x: NOTE_WIDTH + 1, y: 96 })).toBe(false);
    expect(noteContains(left, { x: 96, y: NOTE_HEIGHT + 1 })).toBe(false);
  });
});

describe("noteAtPoint", () => {
  it("finds nothing on empty canvas", () => {
    expect(noteAtPoint([left, right], { x: 2000, y: 2000 })).toBeUndefined();
  });

  it("picks the card on top when two overlap", () => {
    const under = card("under", 0, 0, 1);
    const over = card("over", 40, 40, 9);
    const point = { x: 100, y: 100 };

    expect(noteContains(under, point)).toBe(true);
    expect(noteContains(over, point)).toBe(true);
    expect(noteAtPoint([under, over], point)?.id).toBe("over");
    expect(noteAtPoint([over, under], point)?.id).toBe("over");
  });

  it("does not reorder the array it is handed", () => {
    const notes = [card("a", 0, 0, 1), card("b", 400, 0, 9)];
    noteAtPoint(notes, { x: 96, y: 96 });
    expect(notes.map((note) => note.id)).toEqual(["a", "b"]);
  });
});

describe("arrowLayout", () => {
  it("starts and ends on the facing edges, not the centers", () => {
    const { d, mid } = arrowLayout(left, right, false);

    // Right edge of the left card to the left edge of the right card, with the
    // tip pulled back 10px so the arrowhead sits clear of the paper.
    expect(d).toBe("M 192 96 Q 291 124 390 96");
    expect(mid).toEqual({ x: 291, y: 110 });
  });

  it("bows a lone arrow gently so it reads as a curve", () => {
    const { mid } = arrowLayout(left, right, false);
    expect(mid.y).toBeGreaterThan(96);
  });

  it("shifts a paired arrow off the centre line and bows it wider", () => {
    const { d, mid } = arrowLayout(left, right, true);

    // Pinned so that changing either the sideways offset or the bow shows up
    // here: the ends lift off the centre line and the curve swings further out.
    expect(d).toBe("M 192 108.8 Q 291 160.8 390 108.8");
    expect(mid.x).toBeCloseTo(291);
    expect(mid.y).toBeCloseTo(134.8);
  });

  it("throws a paired arrow wider than a lone one", () => {
    const lone = arrowLayout(left, right, false);
    const paired = arrowLayout(left, right, true);
    expect(Math.abs(paired.mid.y - 96)).toBeGreaterThan(Math.abs(lone.mid.y - 96));
  });

  // This is what keeps a two-way connection readable: A->B and B->A must bow to
  // opposite sides instead of stacking into one line with a head at each end.
  it("bows the two directions of a pair to opposite sides", () => {
    const there = arrowLayout(left, right, true);
    const back = arrowLayout(right, left, true);

    expect(there.mid.y).toBeGreaterThan(96);
    expect(back.mid.y).toBeLessThan(96);
  });

  it("survives two cards stacked exactly on top of each other", () => {
    const twin = card("twin", 0, 0);
    const { d, mid } = arrowLayout(left, twin, false);
    expect(d).toMatch(/^M -?[\d.]+ -?[\d.]+ Q/);
    expect(Number.isFinite(mid.x)).toBe(true);
    expect(Number.isFinite(mid.y)).toBe(true);
  });

  it("works vertically as well as horizontally", () => {
    const below = card("below", 0, 400);
    const { mid } = arrowLayout(left, below, false);
    expect(Number.isFinite(mid.x)).toBe(true);
    expect(mid.y).toBeGreaterThan(96);
  });
});

describe("previewPath", () => {
  it("draws a straight line from the card edge to the pointer", () => {
    expect(previewPath(left, { x: 496, y: 96 })).toBe("M 192 96 L 496 96");
  });

  it("starts at the center when the pointer is on the center", () => {
    expect(previewPath(left, { x: 96, y: 96 })).toBe("M 96 96 L 96 96");
  });
});
