import { describe, expect, it } from "vitest";
import { applyCommand, seedState } from "./reducer";
import { segmentBrief, WORKFLOWS, workflowById } from "./workflows";

const NOW = "2026-01-01T00:00:00.000Z";

describe("workflows (R27)", () => {
  it("names six workflows, each an ask, the tools it composes, and a rule", () => {
    expect(WORKFLOWS.map((workflow) => workflow.id)).toEqual([
      "break-a-treatment",
      "read-and-raise",
      "lay-a-structure",
      "draft-a-sequence",
      "restick",
      "brief-a-segment",
    ]);
    for (const workflow of WORKFLOWS) {
      expect(workflow.name).toBeTruthy();
      expect(workflow.ask.length).toBeGreaterThan(40);
      expect(workflow.tools.length).toBeGreaterThan(0);
      expect(workflow.then).toBeTruthy();
      if (workflow.id === "break-a-treatment") {
        expect(workflow.needs?.length).toBe(11);
        for (const need of workflow.needs ?? []) {
          expect(need.question.endsWith("?")).toBe(true);
          expect(need.hint).toBeTruthy();
          expect(need.tool).toBeTruthy();
        }
      }
    }
    expect(workflowById("restick")?.name).toBe("Restick the remaining cards after the pages moved");
    expect(workflowById("nope")).toBeNull();
  });
});

describe("the brief (R28)", () => {
  it("briefs one scene from its card, its people's pages, its place and its script", () => {
    let state = seedState();
    state = applyCommand(state, { type: "set_logline", logline: "Can Maya forgive a useful lie?" }, NOW).state;
    state = applyCommand(state, { type: "update_character", id: "maya", looks: "Tall, a good coat.", voice: "Low." }, NOW).state;
    state = applyCommand(state, { type: "set_location", ids: ["maya-letter"], location: "the piano shop" }, NOW).state;
    state = applyCommand(state, { type: "set_plant", ids: ["maya-letter"], plants: true }, NOW).state;
    state = applyCommand(state, { type: "set_text", id: "maya-letter", text: "Rain on the window.\n\nMAYA\nTom?" }, NOW).state;
    const brief = segmentBrief(state, ["maya-letter"], { title: "Episode 2" });
    expect(brief).toBe(
      [
        "SEGMENT: Maya finds the letter",
        "FROM: Episode 2",
        "STORY: Can Maya forgive a useful lie?",
        "PEOPLE: Maya — looks: Tall, a good coat.; voice: Low.",
        "PLACES: the piano shop",
        "",
        "SCENE: Maya finds the letter — at the piano shop",
        "WHAT CHANGES: She decides not to tell Tom.",
        "PLANTS: something here pays off later, nowhere yet; keep it visible.",
        "SCRIPT:",
        "Rain on the window.\n\nMAYA\nTom?",
        "",
        "AFTER: She decides not to tell Tom. (the change line, until the scene is written)",
      ].join("\n"),
    );
  });

  it("briefs a run of scenes in order, says who has no page, and marks unwritten scripts", () => {
    const state = seedState();
    const brief = segmentBrief(state, ["tom-lies", "letter-aloud"]);
    expect(brief).toContain('SEGMENT: 2 scenes, from "Tom lies about the job" to "The letter is read aloud"');
    expect(brief).toContain("PEOPLE: Tom — (no page yet) | Maya — (no page yet)");
    expect(brief).toContain("PLACES: (none set)");
    expect(brief).toContain("SCRIPT: (unwritten — build from the change line)");
    expect(brief).toContain("AFTER: The plan dies in the room.");
    expect(segmentBrief(state, ["nope"])).toBeNull();
  });
});
