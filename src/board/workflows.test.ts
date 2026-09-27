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
        // Twelve, and the five round twenty-three's notes needed (entry 9).
        expect(workflow.needs?.length).toBe(17);
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
    state = applyCommand(state, { type: "set_when", ids: ["maya-letter"], when: "night" }, NOW).state;
    state = applyCommand(state, { type: "set_plant", ids: ["maya-letter"], what: "the letter" }, NOW).state;
    const brief = segmentBrief(state, ["maya-letter"], { title: "Episode 2", episode: 2, episodes: 3, premise: "A useful lie." });
    expect(brief).toBe(
      [
        'SEGMENT: "Maya finds the letter" — scene 1 of 3 on "Episode 2" (episode 2 of 3)',
        "LENGTH: about 1/8 pages, about 0 minutes — measured from the script",
        "THE FILM: A useful lie.",
        "STORY: Can Maya forgive a useful lie?",
        "PEOPLE: Maya — looks: Tall, a good coat.; voice: Low.",
        "PLACES: the piano shop",
        "NOT ON THE WALL: which day of the film's time a scene falls on (a card holds a time of day, never a day); what a place looks like beyond its name; a face, a build or a voice beyond the page's line. Ask the writer, or leave it open.",
        "",
        'SCENE 1: "Maya finds the letter" [[id: maya-letter]] — at the piano shop — night — about 1/8 pages, measured',
        "WHO: Maya",
        "WHAT CHANGES: She decides not to tell Tom.",
        "SCRIPT:",
        "Rain on the window.\n\nMAYA\nTom?",
        "PLANTS: the letter — pays off later, nowhere yet; keep it visible.",
        "",
        "AFTER: She decides not to tell Tom. — still visible: the letter",
      ].join("\n"),
    );
    // A payoff on another board is named to its scene; a person's open rides on PEOPLE and AFTER.
    state = applyCommand(state, { type: "set_payoff_board", ids: ["maya-letter"], boardId: "ep3", noteId: "the-drawer" }, NOW).state;
    state = applyCommand(state, { type: "update_character", id: "maya", open: "whether she keeps it" }, NOW).state;
    state = applyCommand(state, { type: "add_open_line", text: "the era — not decided" }, NOW).state;
    const later = segmentBrief(state, ["maya-letter"], { boards: [{ id: "ep3", name: "Episode 3", order: [{ id: "x", headline: "Elsewhere" }, { id: "the-drawer", headline: "The drawer" }] }] });
    expect(later).toContain('OPEN ABOUT THE FILM, BY THE WRITER\'S WORD: "the era — not decided"');
    expect(later).toContain('PLANTS: the letter — pays off at "The drawer" (scene 2 on "Episode 3"); keep it visible.');
    expect(later).toContain('not decided, by the writer\'s word: whether she keeps it');
    expect(later).toContain('— open about the people, by the writer\'s word: Maya: "whether she keeps it"');
  });

  it("briefs a run of scenes in order, says who has no page, and marks unwritten scripts", () => {
    const state = seedState();
    const brief = segmentBrief(state, ["tom-lies", "letter-aloud"]);
    expect(brief).toContain('SEGMENT: 2 scenes, from "Tom lies about the job" to "The letter is read aloud"');
    expect(brief).toContain("PEOPLE: Tom — (no page yet) | Maya — (no page yet)");
    expect(brief).toContain("PLACES: (none set)");
    expect(brief).toContain("SCRIPT: (unwritten — build from the change line)");
    expect(brief).toContain("AFTER: The plan dies in the room. (the change line; the scene is unwritten) — on the way, each scene's WHAT CHANGES stood by its end: 1. ");
    expect(brief).toMatch(/^WHO: Tom, Maya$/m);
    expect(brief).toMatch(/^LENGTH: about [\d /]+ pages?, about \d+ minutes? — the writer's estimate$/m);
    expect(segmentBrief(state, ["nope"])).toBeNull();
  });
});
