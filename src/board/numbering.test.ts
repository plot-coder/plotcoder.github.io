import { describe, expect, it } from "vitest";
import { isRevised, lockFrom, revisedLines, sceneNumbers } from "./numbering";

const ids = (...list: string[]) => list.map((id) => ({ id }));

describe("scene numbers (Roadmap 2, item 8)", () => {
  it("follow the wall's order until locked", () => {
    expect([...sceneNumbers(ids("a", "b", "c"), null).values()]).toEqual(["1", "2", "3"]);
  });

  it("keep their numbers once locked, whatever the order; a new scene between 14 and 15 is 14A, then 14B", () => {
    const lock = lockFrom(ids("a", "b", "c"), null, "2026-09-13T10:00:00.000Z");
    expect(lock.numbers).toEqual({ a: "1", b: "2", c: "3" });
    // Moved: c before a. Numbers stay.
    expect([...sceneNumbers(ids("c", "a", "b"), lock).entries()]).toEqual([["c", "3"], ["a", "1"], ["b", "2"]]);
    // Two new scenes after b, one after c.
    const numbers = sceneNumbers(ids("a", "b", "x", "y", "c", "z"), lock);
    expect(numbers.get("x")).toBe("2A");
    expect(numbers.get("y")).toBe("2B");
    expect(numbers.get("z")).toBe("3A");
  });

  it("numbers a scene added before the first locked one A1", () => {
    const lock = lockFrom(ids("a", "b"), null, "2026-09-13T10:00:00.000Z");
    const numbers = sceneNumbers(ids("n", "m", "a", "b"), lock);
    expect(numbers.get("n")).toBe("A1");
    expect(numbers.get("m")).toBe("B1");
    expect(numbers.get("a")).toBe("1");
  });

  it("locks again over an existing lock, keeping A-numbers as they are", () => {
    const first = lockFrom(ids("a", "b"), null, "t1");
    const again = lockFrom(ids("a", "x", "b"), first, "t2");
    expect(again.numbers).toEqual({ a: "1", x: "1A", b: "2" });
    expect(sceneNumbers(ids("a", "x", "y", "b"), again).get("y")).toBe("1AA");
  });
});

describe("revision marks", () => {
  it("marks the lines not in the snapshot, and every line of a scene with no snapshot", () => {
    expect(revisedLines("Rain.\n\nMAYA\nTom?", "Rain.\n\nMAYA\nTom?")).toEqual([]);
    expect(revisedLines("Rain, harder.\n\nMAYA\nTom? Why?", "Rain.\n\nMAYA\nTom?")).toEqual([0, 3]);
    expect(revisedLines("New.\nLines.", null)).toEqual([0, 1]);
  });

  it("knows a revised card by any of its lines", () => {
    const note = { id: "a", headline: "H", change: "C", location: "L", text: "T" } as never;
    const same = { headline: "H", change: "C", location: "L", text: "T" };
    expect(isRevised(note, same)).toBe(false);
    expect(isRevised(note, { ...same, text: "T2" })).toBe(true);
    expect(isRevised(note, undefined)).toBe(true);
  });
});
