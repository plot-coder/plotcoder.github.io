import { describe, expect, it } from "vitest";
import { History } from "./history";

describe("History", () => {
  it("starts empty and undoes and redoes in order", () => {
    const history = new History<string>();
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
    expect(history.undo("a")).toBeNull();

    history.record("a");
    history.record("b");
    expect(history.canUndo).toBe(true);
    expect(history.undo("c")).toBe("b");
    expect(history.canRedo).toBe(true);
    expect(history.undo("b")).toBe("a");
    expect(history.undo("a")).toBeNull();
    expect(history.redo("a")).toBe("b");
    expect(history.redo("b")).toBe("c");
    expect(history.redo("c")).toBeNull();
  });

  it("drops the redo stack when something new happens", () => {
    const history = new History<string>();
    history.record("a");
    history.undo("b");
    expect(history.canRedo).toBe(true);
    history.record("a");
    expect(history.canRedo).toBe(false);
  });

  it("merges consecutive steps with the same key, keeping the earliest state", () => {
    const history = new History<string>();
    history.record("blank", "headline:1");
    history.record("M", "headline:1");
    history.record("Ma", "headline:1");
    expect(history.depth).toBe(1);
    expect(history.undo("Maya")).toBe("blank");
  });

  it("does not merge across a different key or an unkeyed step", () => {
    const history = new History<string>();
    history.record("a", "headline:1");
    history.record("b", "headline:2");
    history.record("c");
    history.record("d", "headline:2");
    expect(history.depth).toBe(4);
  });

  it("turns a whole drag into one step, and none at all if nothing moved", () => {
    const history = new History<string>();
    history.beginGesture("start");
    history.touchGesture();
    history.touchGesture();
    history.endGesture();
    expect(history.depth).toBe(1);
    expect(history.undo("dropped")).toBe("start");

    history.beginGesture("still");
    history.endGesture();
    expect(history.canUndo).toBe(false);
  });

  it("closes an open drag before recording or undoing", () => {
    const history = new History<string>();
    history.beginGesture("start");
    history.touchGesture();
    history.record("moved");
    expect(history.depth).toBe(2);

    const again = new History<string>();
    again.beginGesture("start");
    again.touchGesture();
    expect(again.canUndo).toBe(true);
    expect(again.undo("mid-drag")).toBe("start");
  });

  it("forgets the oldest step past the cap", () => {
    const history = new History<number>(3);
    for (let i = 0; i < 5; i += 1) history.record(i);
    expect(history.depth).toBe(3);
    expect(history.undo(5)).toBe(4);
    expect(history.undo(4)).toBe(3);
    expect(history.undo(3)).toBe(2);
    expect(history.undo(2)).toBeNull();
  });
});
