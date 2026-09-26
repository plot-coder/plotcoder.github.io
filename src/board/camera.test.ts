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

describe("a [[note]] is not the page (pass 1b, entry 30)", () => {
  it("never marks the words of a note, and keeps the line numbers of the page's own lines", () => {
    const text = ".DOYLE'S - NIGHT\n\n[[Declan and Priya are not on the page; that is not a decision, the writer has not decided.]]\n\nMairead counts the queue. She knows the number now.\n\n[[the sign: lit, or down — not decided]]";
    const found = cameraLines(text);
    expect(found).toEqual([{ at: 4, line: "Mairead counts the queue. She knows the number now.", verbs: ["knows"] }]);
    expect(cameraLines("[[she decided\nto go]]")).toEqual([]);
  });
});
