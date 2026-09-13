import { NOTE_HEIGHT, NOTE_WIDTH, type MockNote } from "./noteMock";

export type Point = { x: number; y: number };

export function noteCenter(note: MockNote): Point {
  return { x: note.x + NOTE_WIDTH / 2, y: note.y + NOTE_HEIGHT / 2 };
}

export function noteContains(note: MockNote, point: Point) {
  return (
    point.x >= note.x &&
    point.x <= note.x + NOTE_WIDTH &&
    point.y >= note.y &&
    point.y <= note.y + NOTE_HEIGHT
  );
}

export function noteAtPoint(notes: MockNote[], point: Point) {
  return [...notes]
    .sort((a, b) => b.z - a.z)
    .find((note) => noteContains(note, point));
}

function edgePoint(note: MockNote, toward: Point): Point {
  const center = noteCenter(note);
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (dx === 0 && dy === 0) return center;
  const hw = NOTE_WIDTH / 2;
  const hh = NOTE_HEIGHT / 2;
  const tx = Math.abs(dx) < 1e-6 ? Number.POSITIVE_INFINITY : hw / Math.abs(dx);
  const ty = Math.abs(dy) < 1e-6 ? Number.POSITIVE_INFINITY : hh / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: center.x + dx * t, y: center.y + dy * t };
}

// The head: the same 27 x 18 wedge the marker drew (12 x 8 at a 2.25 stroke),
// now a shape of its own so it can follow a curve's arrival angle and keep its
// size in a tight gap. The big arrow is the big arrow everywhere.
const HEAD_LENGTH = 27;
const HEAD_HALF = 9;
// Air off the paper at both ends, when the gap can spare it.
const AIR = 8;
// Under this, two facing edges are neighbours: the arrow runs straight and
// steps off the handle's row so the head and the handle stop sharing a slot.
const SHORT = 60;
const DROP = 22;

export type ArrowLayout = {
  /** The shaft, from just off the tail card to the base of the head. */
  d: string;
  /** Where the chips sit: the middle of the shaft. */
  mid: Point;
  /** The head as polygon points, tip first. */
  head: string;
};

function unit(dx: number, dy: number): Point {
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function arrowLayout(from: MockNote, to: MockNote, paired: boolean): ArrowLayout {
  const a = noteCenter(from);
  const b = noteCenter(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  let start = edgePoint(from, b);
  let end = edgePoint(to, a);
  const gap = Math.hypot(end.x - start.x, end.y - start.y);
  const short = gap < SHORT;
  const offset = paired ? (short ? 12 : 20) : 0;

  if (short) {
    // Neighbours: straight, a little below the handle's row when side by side.
    const drop = Math.abs(dy) < 1e-3 ? DROP : 0;
    start = { x: start.x + nx * offset, y: start.y + drop + ny * offset };
    end = { x: end.x + nx * offset, y: end.y + drop + ny * offset };
  } else if (paired) {
    // A two-way pair leaves and lands off the centre line, each to its own side.
    const towardEnd = { x: b.x + nx * offset, y: b.y + ny * offset };
    const towardStart = { x: a.x + nx * offset, y: a.y + ny * offset };
    start = edgePoint(from, towardEnd);
    end = edgePoint(to, towardStart);
    start = { x: start.x + nx * offset * 0.4, y: start.y + ny * offset * 0.4 };
    end = { x: end.x + nx * offset * 0.4, y: end.y + ny * offset * 0.4 };
  }

  const span = Math.hypot(end.x - start.x, end.y - start.y) || 1;
  const u = unit(end.x - start.x, end.y - start.y);
  // The head is never shrunk; the air is what the gap leaves, split evenly.
  const air = Math.min(AIR, Math.max(2, (span - HEAD_LENGTH) / 2));
  const sp = { x: start.x + u.x * air, y: start.y + u.y * air };
  const tip = { x: end.x - u.x * air, y: end.y - u.y * air };
  const base = { x: tip.x - u.x * HEAD_LENGTH, y: tip.y - u.y * HEAD_LENGTH };

  // The bow is proportional: straight between neighbours, today's curve when far.
  const bow = short ? 0 : paired ? Math.min(span * 0.2, 40) : Math.min(span * 0.125, 28);
  const ctrl = {
    x: (sp.x + base.x) / 2 + nx * bow,
    y: (sp.y + base.y) / 2 + ny * bow,
  };
  const mid = {
    x: (sp.x + 2 * ctrl.x + base.x) / 4,
    y: (sp.y + 2 * ctrl.y + base.y) / 4,
  };

  // The head follows the curve's arrival direction; on a straight stitch that
  // collapses to a point, so fall back to the chord.
  let h = unit(base.x - ctrl.x, base.y - ctrl.y);
  if (Math.hypot(base.x - ctrl.x, base.y - ctrl.y) < 0.5) h = u;
  const hn = { x: -h.y, y: h.x };
  const head = [
    `${tip.x},${tip.y}`,
    `${tip.x - h.x * HEAD_LENGTH + hn.x * HEAD_HALF},${tip.y - h.y * HEAD_LENGTH + hn.y * HEAD_HALF}`,
    `${tip.x - h.x * HEAD_LENGTH - hn.x * HEAD_HALF},${tip.y - h.y * HEAD_LENGTH - hn.y * HEAD_HALF}`,
  ].join(" ");

  return { d: `M ${sp.x} ${sp.y} Q ${ctrl.x} ${ctrl.y} ${base.x} ${base.y}`, mid, head };
}

export function previewPath(from: MockNote, pointer: Point) {
  const start = edgePoint(from, pointer);
  return `M ${start.x} ${start.y} L ${pointer.x} ${pointer.y}`;
}
