import { describe, expect, it } from "vitest";
import { joinPlaceLine, placeCompletions, splitPlaceLine } from "./PlaceLine";

// The card's fourth line (R37, R55): "at the pier at Fenit · night" is one line
// to type and two fields on the card.
describe("splitPlaceLine", () => {
  it("a line with no mark is a place alone", () => {
    expect(splitPlaceLine("the piano shop")).toEqual({ location: "the piano shop", when: "" });
    expect(splitPlaceLine("  ")).toEqual({ location: "", when: "" });
  });

  it("the dot divides the place from the when, spaces collapsed", () => {
    expect(splitPlaceLine("the pier at Fenit · night")).toEqual({ location: "the pier at Fenit", when: "night" });
    expect(splitPlaceLine("the pier at Fenit·day  four,   dawn")).toEqual({ location: "the pier at Fenit", when: "day four, dawn" });
  });

  it("a spaced hyphen is the heading's own mark and is taken too", () => {
    expect(splitPlaceLine("the ferry at Tarbert - day four")).toEqual({ location: "the ferry at Tarbert", when: "day four" });
  });

  it("a hyphen inside a word is part of the place", () => {
    expect(splitPlaceLine("the lay-by")).toEqual({ location: "the lay-by", when: "" });
    expect(splitPlaceLine("the lay-by · night")).toEqual({ location: "the lay-by", when: "night" });
  });

  it("the last dot wins, so a when may carry none", () => {
    expect(splitPlaceLine("a · b · night")).toEqual({ location: "a · b", when: "night" });
  });

  it("a dot with nothing after it clears the when; nothing before it is a when alone", () => {
    expect(splitPlaceLine("the pier ·")).toEqual({ location: "the pier", when: "" });
    expect(splitPlaceLine("· night")).toEqual({ location: "", when: "night" });
  });
});

describe("joinPlaceLine", () => {
  it("round-trips what split takes apart", () => {
    expect(joinPlaceLine("the pier at Fenit", "night")).toBe("the pier at Fenit · night");
    expect(joinPlaceLine("the pier at Fenit", "")).toBe("the pier at Fenit");
    expect(splitPlaceLine(joinPlaceLine("the lay-by", "day four, dawn"))).toEqual({ location: "the lay-by", when: "day four, dawn" });
  });
});

describe("placeCompletions", () => {
  const places = ["the piano shop", "the pier at Fenit", "Maya's flat"];

  it("starts first, then contains, never the exact one", () => {
    expect(placeCompletions("the p", places)).toEqual(["the piano shop", "the pier at Fenit"]);
    expect(placeCompletions("flat", places)).toEqual(["Maya's flat"]);
    expect(placeCompletions("the piano shop", places)).toEqual([]);
  });

  it("an empty fragment offers the first six", () => {
    expect(placeCompletions("", places)).toEqual(places);
  });
});
