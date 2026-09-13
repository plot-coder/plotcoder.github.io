// The wall is unbounded; the window is a viewport onto it (D15 / R24).
//
// A View maps board space to screen space: a point at board (bx, by) is drawn
// at screen (bx * scale + x, by * scale + y), which is exactly what
// `translate(x, y) scale(scale)` does with a top-left transform origin.
//
// Everything here is pure so it can be tested without a browser. The viewport
// is deliberately NOT board data — it never enters BoardState, the project
// file, or Postgres, because it belongs to a viewer and not to a story.

import { NOTE_HEIGHT, NOTE_WIDTH } from "./noteMock";

export type View = { x: number; y: number; scale: number };

export type Point = { x: number; y: number };

export type Size = { width: number; height: number };

export type Box = { x: number; y: number; w: number; h: number };

// Far enough out to take in a feature (53 cards laid out runs ~3200px tall);
// far enough in to still read a card's change line comfortably.
export const MIN_SCALE = 0.15;
export const MAX_SCALE = 2.5;

// Breathing room around the cards when framing the whole wall, in board units.
const FIT_MARGIN = 80;

export const IDENTITY_VIEW: View = { x: 0, y: 0, scale: 1 };

export function clampScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/** Screen point (relative to the board element) -> board coordinates. */
export function toBoard(point: Point, view: View): Point {
  return {
    x: (point.x - view.x) / view.scale,
    y: (point.y - view.y) / view.scale,
  };
}

/** Board coordinates -> screen point relative to the board element. */
export function toScreen(point: Point, view: View): Point {
  return {
    x: point.x * view.scale + view.x,
    y: point.y * view.scale + view.y,
  };
}

/** Screen distance -> board distance. Drags that work in deltas need this. */
export function scaleDelta(delta: number, view: View): number {
  return delta / view.scale;
}

/** Move the viewer by (dx, dy) in screen pixels; the wall slides the other way. */
export function panBy(view: View, dx: number, dy: number): View {
  if (dx === 0 && dy === 0) return view;
  return { ...view, x: view.x - dx, y: view.y - dy };
}

/**
 * A trackpad or wheel scroll. Positive deltaY means "scroll down", which has to
 * reveal content further down the wall — so the wall moves up, not down. Easy
 * to get backwards, which is why the sign lives here rather than in a handler.
 */
export function panByScroll(view: View, deltaX: number, deltaY: number): View {
  return panBy(view, deltaX, deltaY);
}

/** A grab-and-drag of the wall itself. Content follows the pointer. */
export function panByDrag(view: View, dx: number, dy: number): View {
  return panBy(view, -dx, -dy);
}

/**
 * Zoom so the board point under `anchor` stays under `anchor`. Without this the
 * wall slides away from the pointer and zooming feels like it fights you.
 */
export function zoomAt(view: View, factor: number, anchor: Point): View {
  const scale = clampScale(view.scale * factor);
  if (scale === view.scale) return view;
  const board = toBoard(anchor, view);
  return {
    scale,
    x: anchor.x - board.x * scale,
    y: anchor.y - board.y * scale,
  };
}

export function contentBounds(
  notes: ReadonlyArray<{ x: number; y: number }>,
): Box | null {
  if (notes.length === 0) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const note of notes) {
    if (note.x < left) left = note.x;
    if (note.y < top) top = note.y;
    if (note.x + NOTE_WIDTH > right) right = note.x + NOTE_WIDTH;
    if (note.y + NOTE_HEIGHT > bottom) bottom = note.y + NOTE_HEIGHT;
  }
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/**
 * Frame every card at once — standing back from the corkboard. Returns the
 * identity view for an empty board so Fit on nothing does nothing surprising.
 */
export function fitView(
  notes: ReadonlyArray<{ x: number; y: number }>,
  size: Size,
): View {
  const bounds = contentBounds(notes);
  if (!bounds || size.width <= 0 || size.height <= 0) return IDENTITY_VIEW;

  const scale = clampScale(
    Math.min(
      size.width / (bounds.w + FIT_MARGIN * 2),
      size.height / (bounds.h + FIT_MARGIN * 2),
    ),
  );

  // Centre the content box in the viewport at the chosen scale.
  return {
    scale,
    x: (size.width - bounds.w * scale) / 2 - bounds.x * scale,
    y: (size.height - bounds.h * scale) / 2 - bounds.y * scale,
  };
}

/**
 * Bring one card to the middle of the window without changing the zoom —
 * what a click on the Story Map does. If the wall is zoomed out past where a
 * card is readable, come in to a readable size first.
 */
export function centerOn(
  view: View,
  note: { x: number; y: number },
  size: Size,
  minScale = 0.6,
): View {
  const scale = clampScale(Math.max(view.scale, minScale));
  const cx = note.x + NOTE_WIDTH / 2;
  const cy = note.y + NOTE_HEIGHT / 2;
  return {
    scale,
    x: size.width / 2 - cx * scale,
    y: size.height / 2 - cy * scale,
  };
}

/** The board-space rectangle currently on screen. Useful for placing new cards. */
export function visibleBox(view: View, size: Size): Box {
  const topLeft = toBoard({ x: 0, y: 0 }, view);
  return {
    x: topLeft.x,
    y: topLeft.y,
    w: size.width / view.scale,
    h: size.height / view.scale,
  };
}
