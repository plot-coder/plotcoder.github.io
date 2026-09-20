import { describe, expect, it } from "vitest";
import type { BoardCharacter } from "./board/reducer";
import { castText, completions, findCharacter, resolveCast, splitNames } from "./castNames";

const NOW = "2026-01-01T00:00:00.000Z";
const person = (id: string, name: string): BoardCharacter => ({
  id,
  name,
  looks: "",
  voice: "",
  wants: "",
  needs: "",
  notes: "",
  open: "",
  createdAt: NOW,
  updatedAt: NOW,
});
const roster = [person("m", "Maya"), person("t", "Tom"), person("mr", "Mark Reed")];

describe("splitNames", () => {
  it("splits on commas, trims, and drops a repeated name in another case", () => {
    expect(splitNames(" Maya,  tom ,, maya, Mark   Reed ")).toEqual(["Maya", "tom", "Mark Reed"]);
  });

  it("gives nothing for nothing", () => {
    expect(splitNames("")).toEqual([]);
    expect(splitNames(" , ,")).toEqual([]);
  });
});

describe("findCharacter", () => {
  it("matches a name in any case with stray spaces", () => {
    expect(findCharacter("  mAYA ", roster)?.id).toBe("m");
    expect(findCharacter("May", roster)).toBeUndefined();
  });
});

describe("resolveCast", () => {
  it("returns typed order with roster ids, the roster's spelling, and null for a stranger", () => {
    expect(resolveCast(["tom", "The landlord", "Maya"], roster)).toEqual([
      { name: "Tom", id: "t" },
      { name: "The landlord", id: null },
      { name: "Maya", id: "m" },
    ]);
  });

  it("collapses two spellings of one person, and two of one stranger", () => {
    expect(resolveCast(["Maya", "maya", "Sam", "sam "], roster)).toEqual([
      { name: "Maya", id: "m" },
      { name: "Sam", id: null },
    ]);
  });
});

describe("castText", () => {
  it("names the cast in cast order and skips an id nobody has", () => {
    expect(castText(["t", "ghost", "m"], roster)).toBe("Tom, Maya");
    expect(castText([], roster)).toBe("");
  });
});

describe("completions", () => {
  it("offers names that start with the fragment before names that contain it", () => {
    expect(completions("ma", roster, []).map((c) => c.name)).toEqual(["Maya", "Mark Reed"]);
    expect(completions("ree", roster, []).map((c) => c.name)).toEqual(["Mark Reed"]);
  });

  it("leaves out people already in the line", () => {
    expect(completions("", roster, ["maya"]).map((c) => c.name)).toEqual(["Tom", "Mark Reed"]);
  });

  it("offers nobody for a fragment nobody matches", () => {
    expect(completions("zz", roster, [])).toEqual([]);
  });
});
