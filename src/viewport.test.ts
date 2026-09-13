import { centerOn } from "./viewport";
import { describe, expect, it } from "vitest";
import { NOTE_HEIGHT, NOTE_WIDTH } from "./noteMock";
import {
  contentBounds,
  fitView,
  IDENTITY_VIEW,
  MAX_SCALE,
  MIN_SCALE,
  panBy,
  panByDrag,
  panByScroll,
  scaleDelta,
  toBoard,
  toScreen,
  visibleBox,
  zoomAt,
  type View,
} from "./viewport";

const VIEWPORT = { width: 1440, height: 900 };

function card(x: number, y: number) {
  return { x, y };
}

describe("converting between screen and board space", () => {
  it("is the identity when the wall is unmoved and unzoomed", () => {
    expect(toBoard({ x: 120, y: 300 }, IDENTITY_VIEW)).toEqual({ x: 120, y: 300 });
  });

  it("subtracts the pan and divides by the zoom", () => {
    const view: View = { x: 100, y: 50, scale: 2 };
    expect(toBoard({ x: 300, y: 250 }, view)).toEqual({ x: 100, y: 100 });
  });

  it("round-trips through screen space at an awkward zoom", () => {
    const view: View = { x: -317, y: 88, scale: 0.37 };
    const point = { x: 1234, y: -56 };
    const back = toBoard(toScreen(point, view), view);
    expect(back.x).toBeCloseTo(point.x);
    expect(back.y).toBeCloseTo(point.y);
  });

  it("converts a drag delta out of screen pixels", () => {
    expect(scaleDelta(50, { x: 0, y: 0, scale: 0.5 })).toBe(100);
    expect(scaleDelta(50, { x: 0, y: 0, scale: 2 })).toBe(25);
  });
});

describe("panning", () => {
  it("moves the wall opposite the gesture, so content follows the finger", () => {
    expect(panBy({ x: 0, y: 0, scale: 1 }, 40, 25)).toEqual({ x: -40, y: -25, scale: 1 });
  });

  it("returns the same view object when nothing moved", () => {
    const view = { x: 10, y: 10, scale: 1 };
    expect(panBy(view, 0, 0)).toBe(view);
  });

  it("does not change the zoom", () => {
    expect(panBy({ x: 0, y: 0, scale: 0.4 }, 10, 10).scale).toBe(0.4);
  });

  // These two run opposite ways and are trivially easy to swap. Scrolling down
  // should take you further down the wall; dragging the wall down should bring
  // the wall down with your hand.
  it("scrolling down reveals content further down the wall", () => {
    const note = { x: 0, y: 1000 };
    const before = toScreen(note, IDENTITY_VIEW).y;
    const after = toScreen(note, panByScroll(IDENTITY_VIEW, 0, 200)).y;
    expect(after).toBeLessThan(before);
  });

  it("scrolling right reveals content further right", () => {
    const note = { x: 1000, y: 0 };
    const before = toScreen(note, IDENTITY_VIEW).x;
    const after = toScreen(note, panByScroll(IDENTITY_VIEW, 200, 0)).x;
    expect(after).toBeLessThan(before);
  });

  it("dragging the wall down brings content down with it", () => {
    const note = { x: 0, y: 0 };
    const after = toScreen(note, panByDrag(IDENTITY_VIEW, 0, 200)).y;
    expect(after).toBe(200);
  });

  it("drag and scroll move opposite ways for the same delta", () => {
    expect(panByDrag(IDENTITY_VIEW, 30, 40)).toEqual({ x: 30, y: 40, scale: 1 });
    expect(panByScroll(IDENTITY_VIEW, 30, 40)).toEqual({ x: -30, y: -40, scale: 1 });
  });
});

describe("zooming toward a point", () => {
  // The whole reason zoomAt exists: the board point under the cursor has to
  // stay under the cursor, or the wall slides away while you zoom.
  it.each([
    ["centre", { x: 720, y: 450 }],
    ["a corner", { x: 0, y: 0 }],
    ["off to one side", { x: 1380, y: 120 }],
  ])("keeps the board point under %s fixed", (_label, anchor) => {
    const view: View = { x: -240, y: 60, scale: 0.8 };
    const before = toBoard(anchor, view);
    const after = zoomAt(view, 1.4, anchor);
    const now = toBoard(anchor, after);
    expect(now.x).toBeCloseTo(before.x);
    expect(now.y).toBeCloseTo(before.y);
  });

  it("zooms in and out by the factor given", () => {
    const view: View = { x: 0, y: 0, scale: 1 };
    expect(zoomAt(view, 2, { x: 0, y: 0 }).scale).toBe(2);
    expect(zoomAt(view, 0.5, { x: 0, y: 0 }).scale).toBe(0.5);
  });

  it("stops at the zoom limits instead of running away", () => {
    const far = zoomAt({ x: 0, y: 0, scale: MIN_SCALE }, 0.01, { x: 10, y: 10 });
    expect(far.scale).toBe(MIN_SCALE);
    const close = zoomAt({ x: 0, y: 0, scale: MAX_SCALE }, 100, { x: 10, y: 10 });
    expect(close.scale).toBe(MAX_SCALE);
  });

  it("returns the identical view when already clamped, so React can skip the render", () => {
    const view: View = { x: 5, y: 5, scale: MAX_SCALE };
    expect(zoomAt(view, 2, { x: 0, y: 0 })).toBe(view);
  });
});

describe("content bounds", () => {
  it("is null for an empty wall", () => {
    expect(contentBounds([])).toBeNull();
  });

  it("covers the whole card, not just its top-left corner", () => {
    expect(contentBounds([card(100, 200)])).toEqual({
      x: 100,
      y: 200,
      w: NOTE_WIDTH,
      h: NOTE_HEIGHT,
    });
  });

  it("spans from the leftmost/topmost card to the far edge of the furthest one", () => {
    const box = contentBounds([card(500, 50), card(100, 900), card(300, 400)]);
    expect(box).toEqual({
      x: 100,
      y: 50,
      w: 500 + NOTE_WIDTH - 100,
      h: 900 + NOTE_HEIGHT - 50,
    });
  });

  it("handles negative coordinates, since the wall extends in every direction", () => {
    expect(contentBounds([card(-400, -300), card(0, 0)])).toEqual({
      x: -400,
      y: -300,
      w: 400 + NOTE_WIDTH,
      h: 300 + NOTE_HEIGHT,
    });
  });
});

describe("fitting the whole wall on screen", () => {
  it("does nothing surprising on an empty board", () => {
    expect(fitView([], VIEWPORT)).toEqual(IDENTITY_VIEW);
  });

  // The regression this whole feature exists for: v0.1.0 could show 16 of 53
  // cards after Organize and stranded the other 37 off-screen.
  it("brings every card of a feature-length board into view", () => {
    const notes = [];
    for (let i = 0; i < 53; i += 1) {
      notes.push(card(88 + (i % 4) * 220, 110 + Math.floor(i / 4) * 220));
    }

    const view = fitView(notes, VIEWPORT);

    for (const note of notes) {
      const topLeft = toScreen(note, view);
      const bottomRight = toScreen(
        { x: note.x + NOTE_WIDTH, y: note.y + NOTE_HEIGHT },
        view,
      );
      expect(topLeft.x).toBeGreaterThanOrEqual(0);
      expect(topLeft.y).toBeGreaterThanOrEqual(0);
      expect(bottomRight.x).toBeLessThanOrEqual(VIEWPORT.width);
      expect(bottomRight.y).toBeLessThanOrEqual(VIEWPORT.height);
    }
  });

  it("centres the content in the viewport", () => {
    const notes = [card(0, 0), card(800, 400)];
    const view = fitView(notes, VIEWPORT);
    const box = contentBounds(notes)!;
    const centre = toScreen({ x: box.x + box.w / 2, y: box.y + box.h / 2 }, view);
    expect(centre.x).toBeCloseTo(VIEWPORT.width / 2);
    expect(centre.y).toBeCloseTo(VIEWPORT.height / 2);
  });

  it("does not zoom past the limit to fill the screen with one card", () => {
    expect(fitView([card(0, 0)], VIEWPORT).scale).toBeLessThanOrEqual(MAX_SCALE);
  });

  it("stops at the far limit rather than shrinking a season to nothing", () => {
    expect(fitView([card(0, 0), card(200_000, 200_000)], VIEWPORT).scale).toBe(MIN_SCALE);
  });

  it("ignores a viewport with no area", () => {
    expect(fitView([card(0, 0)], { width: 0, height: 0 })).toEqual(IDENTITY_VIEW);
  });
});

describe("visible box", () => {
  it("is the viewport itself when unmoved and unzoomed", () => {
    expect(visibleBox(IDENTITY_VIEW, VIEWPORT)).toEqual({
      x: 0,
      y: 0,
      w: VIEWPORT.width,
      h: VIEWPORT.height,
    });
  });

  it("covers more board as you zoom out", () => {
    const box = visibleBox({ x: 0, y: 0, scale: 0.5 }, VIEWPORT);
    expect(box.w).toBe(VIEWPORT.width * 2);
    expect(box.h).toBe(VIEWPORT.height * 2);
  });

  it("reports where the wall has been panned to", () => {
    const box = visibleBox({ x: -300, y: -150, scale: 1 }, VIEWPORT);
    expect(box.x).toBe(300);
    expect(box.y).toBe(150);
  });
});


describe("centerOn", () => {
  it("puts the card's centre at the window's centre and keeps the zoom", () => {
    const view = centerOn({ x: 0, y: 0, scale: 1 }, { x: 1000, y: 500 }, { width: 800, height: 600 });
    expect(view.scale).toBe(1);
    // Card centre (1096, 596) lands at (400, 300).
    expect(1096 * view.scale + view.x).toBeCloseTo(400);
    expect(596 * view.scale + view.y).toBeCloseTo(300);
  });

  it("comes in to a readable zoom when the wall is far out", () => {
    const view = centerOn({ x: 0, y: 0, scale: 0.15 }, { x: 0, y: 0 }, { width: 800, height: 600 });
    expect(view.scale).toBe(0.6);
    expect(96 * 0.6 + view.x).toBeCloseTo(400);
  });
});
