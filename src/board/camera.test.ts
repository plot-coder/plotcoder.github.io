import { describe, expect, it } from "vitest";
import { cameraLines, cameraVerbs } from "./camera";

describe("the lines the camera cannot see (the handover's call 6)", () => {
  it("marks interior verbs in action and leaves cues, dialogue, headings and parentheticals alone", () => {
    const text = [
      ".THE ALLOTMENTS - MORNING",
      "Ruth stands there with the wrong tools. Con knows what she means.",
      "He unlocks the shed. She feels the cold of the morning.",
      "",
      "CON",
      "(quietly)",
      "I know what you mean. I felt it too.",
      "",
      "She thinks about it and picks up the spade.",
    ].join("\n");
    const found = cameraLines(text);
    expect(found.map((item) => [item.at, item.verbs])).toEqual([
      [1, ["knows"]],
      [2, ["feels"]],
      [8, ["thinks"]],
    ]);
    expect(cameraVerbs(found)).toEqual(["knows", "feels", "thinks"]);
    expect(cameraLines("Con unlocks the shed. Ruth stands there.")).toEqual([]);
    expect(cameraLines("")).toEqual([]);
  });
});
