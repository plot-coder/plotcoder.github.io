import { describe, expect, it } from "vitest";
import { castLine, readMaybe } from "./castMaybe";

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
