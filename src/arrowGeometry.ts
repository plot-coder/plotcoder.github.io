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

export function arrowLayout(from: MockNote, to: MockNote, paired: boolean) {
  const a = noteCenter(from);
  const b = noteCenter(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const offset = paired ? 20 : 0;
  const bow = paired ? 52 : 28;
  const towardEnd = { x: b.x + nx * offset, y: b.y + ny * offset };
  const towardStart = { x: a.x + nx * offset, y: a.y + ny * offset };
  const start = edgePoint(from, towardEnd);
  const end = edgePoint(to, towardStart);
  const startP = { x: start.x + nx * offset * 0.4, y: start.y + ny * offset * 0.4 };
  const endP = { x: end.x + nx * offset * 0.4, y: end.y + ny * offset * 0.4 };
  const spanX = endP.x - startP.x;
  const spanY = endP.y - startP.y;
  const span = Math.hypot(spanX, spanY) || 1;
  const tip = {
    x: endP.x - (spanX / span) * 10,
    y: endP.y - (spanY / span) * 10,
  };
  const ctrl = {
    x: (startP.x + tip.x) / 2 + nx * bow,
    y: (startP.y + tip.y) / 2 + ny * bow,
  };
  const mid = {
    x: (startP.x + 2 * ctrl.x + tip.x) / 4,
    y: (startP.y + 2 * ctrl.y + tip.y) / 4,
  };

  return {
    d: `M ${startP.x} ${startP.y} Q ${ctrl.x} ${ctrl.y} ${tip.x} ${tip.y}`,
    mid,
  };
}

export function previewPath(from: MockNote, pointer: Point) {
  const start = edgePoint(from, pointer);
  return `M ${start.x} ${start.y} L ${pointer.x} ${pointer.y}`;
}
