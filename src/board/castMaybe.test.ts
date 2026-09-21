import { describe, expect, it } from "vitest";
import { castLine, castLineWithOpen, readMaybe, splitCastLine } from "./castMaybe";

describe("a name with a question mark (round twenty-two, H9)", () => {
  it("reads the mark off the name, however it was typed", () => {
    expect(readMaybe("Tomás?")).toEqual({ name: "Tomás", maybe: true });
    expect(readMaybe("  Tomás  ?? ")).toEqual({ name: "Tomás", maybe: true });
    expect(readMaybe("Tomás")).toEqual({ name: "Tomás", maybe: false });
    expect(readMaybe("?")).toEqual({ name: "", maybe: false });
  });

  it("writes the line back as it would be typed: the certain, then who may be there", () => {
    const people = [{ id: "m", name: "Marta" }, { id: "t", name: "Tomás" }];
    expect(castLine(["m"], ["t"], people)).toBe("Marta, Tomás?");
    expect(castLine([], ["t"], people)).toBe("Tomás?");
    expect(castLine(["m"], undefined, people)).toBe("Marta");
    expect(castLine(["gone"], ["t"], people)).toBe("Tomás?");
  });
});

describe("the cast line's own open (round twenty-three, entries 13, 14)", () => {
  it("reads the writer's words from the first part that starts with the mark, commas and all", () => {
    expect(splitCastLine("Ada, Callum, ? anyone else, I don't know")).toEqual({ names: "Ada, Callum", open: "anyone else, I don't know" });
    expect(splitCastLine("? I don't know yet")).toEqual({ names: "", open: "I don't know yet" });
    // A maybe keeps its mark after the name and stays a name.
    expect(splitCastLine("Ada, Tomás?")).toEqual({ names: "Ada, Tomás?", open: "" });
    expect(splitCastLine("")).toEqual({ names: "", open: "" });
  });

  it("writes the line back as it would be typed", () => {
    const people = [{ id: "a", name: "Ada" }, { id: "t", name: "Tomás" }];
    expect(castLineWithOpen(["a"], ["t"], people, "anyone else: I don't know")).toBe("Ada, Tomás?, ? anyone else: I don't know");
    expect(castLineWithOpen([], [], people, "I don't know yet")).toBe("? I don't know yet");
    expect(castLineWithOpen(["a"], [], people, "")).toBe("Ada");
  });
});
