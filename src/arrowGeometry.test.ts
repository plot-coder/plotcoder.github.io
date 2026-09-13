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
  plants: false,
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
  it("floats off both cards with air at each end, and ends at the base of the head", () => {
    const { d, mid, head } = arrowLayout(left, right, false);

    // Right edge of the left card is x=192, left edge of the right card is
    // x=400. The shaft starts 8px off the paper and ends 27px (the head) before
    // a tip that stops 8px short of the next card.
    expect(d).toBe("M 200 96 Q 282.5 122 365 96");
    expect(mid).toEqual({ x: 282.5, y: 109 });
    // The tip stops 8px short of the paper; the head is the full 27 x 18 wedge,
    // tilted to the curve's arrival rather than flat along the chord.
    const [tip, wingA, wingB] = head.split(" ").map((pair) => pair.split(",").map(Number));
    expect(tip).toEqual([392, 96]);
    expect(Math.hypot(tip[0] - wingA[0], tip[1] - wingA[1])).toBeCloseTo(Math.hypot(27, 9));
    expect(Math.hypot(wingA[0] - wingB[0], wingA[1] - wingB[1])).toBeCloseTo(18);
  });

  it("bows a lone arrow gently so it reads as a curve", () => {
    const { mid } = arrowLayout(left, right, false);
    expect(mid.y).toBeGreaterThan(96);
  });

  it("bows in proportion to length, up to the old fixed curve", () => {
    const near = arrowLayout(left, card("near", 300, 0), false);
    const far = arrowLayout(left, card("far", 900, 0), false);
    expect(near.mid.y - 96).toBeGreaterThan(0);
    expect(far.mid.y - 96).toBeGreaterThan(near.mid.y - 96);
    // The cap: 28px of bow puts the curve's midpoint 14px off the chord.
    expect(far.mid.y - 96).toBeCloseTo(14);
  });

  it("runs straight between neighbours, steps off the handle's row, and keeps the full head", () => {
    // A 40px gap: too tight for the head plus 8px of air on each side.
    const neighbour = card("neighbour", 232, 0);
    const { d, head } = arrowLayout(left, neighbour, false);

    const numbers = d.match(/-?[\d.]+/g)!.map(Number);
    const [sx, sy, cx, cy, bx, by] = numbers;
    expect(sy).toBe(96 + 22);
    expect(by).toBe(96 + 22);
    expect(cy).toBe(96 + 22); // no bow
    expect(cx).toBeCloseTo((sx + bx) / 2);

    const [tip, wingA, wingB] = head.split(" ").map((pair) => pair.split(",").map(Number));
    expect(Math.hypot(tip[0] - wingA[0], tip[1] - wingA[1])).toBeCloseTo(Math.hypot(27, 9));
    expect(Math.abs(wingA[1] - wingB[1])).toBeCloseTo(18);
    // Air is what the gap leaves, split evenly: (40 - 27) / 2 = 6.5 each side.
    expect(tip[0]).toBeCloseTo(232 - 6.5);
    expect(sx).toBeCloseTo(192 + 6.5);
  });

  it("shifts a paired arrow off the centre line and bows it wider", () => {
    const { d, mid } = arrowLayout(left, right, true);

    // Pinned so that changing either the sideways offset or the bow shows up
    // here: the ends lift off the centre line and the curve swings further out.
    expect(d).toBe("M 200 108.8 Q 282.5 148.8 365 108.8");
    expect(mid.x).toBeCloseTo(282.5);
    expect(mid.y).toBeCloseTo(128.8);
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

  it("keeps a two-way pair between neighbours as two parallel stitches", () => {
    const neighbour = card("neighbour", 232, 0);
    const there = arrowLayout(left, neighbour, true);
    const back = arrowLayout(neighbour, left, true);
    const yOf = (layout: { d: string }) => Number(layout.d.match(/-?[\d.]+/g)![1]);
    expect(yOf(there)).not.toBeCloseTo(yOf(back));
    expect(Math.abs(yOf(there) - yOf(back))).toBeCloseTo(24);
  });

  it("aims the head along the curve's arrival, not the chord", () => {
    const below = card("below", 500, 500);
    const { head } = arrowLayout(left, below, false);
    const [tip, wingA] = head.split(" ").map((pair) => pair.split(",").map(Number));
    // A bowed arrow arrives at an angle that differs from the straight line
    // between the cards; the head's axis follows the arrival.
    const chord = Math.atan2(500 + 96 - 96, 500 + 96 - 96);
    const axis = Math.atan2(tip[1] - wingA[1], tip[0] - wingA[0]);
    expect(Math.abs(axis - chord)).toBeGreaterThan(0.05);
    expect(Math.abs(axis - chord)).toBeLessThan(0.6);
  });

  it("survives two cards stacked exactly on top of each other", () => {
    const twin = card("twin", 0, 0);
    const { d, mid, head } = arrowLayout(left, twin, false);
    expect(d).toMatch(/^M -?[\d.]+ -?[\d.]+ Q/);
    expect(Number.isFinite(mid.x)).toBe(true);
    expect(Number.isFinite(mid.y)).toBe(true);
    expect(head).not.toMatch(/NaN/);
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
