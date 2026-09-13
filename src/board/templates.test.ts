import { describe, expect, it } from "vitest";
import { applyCommand, emptyState, seedState, NOTE_HEIGHT, type BoardNote } from "./reducer";
import { beatPage, TEMPLATES, templateById } from "./templates";

const NOW = "2026-01-01T00:00:00.000Z";

describe("structure templates (R38)", () => {
  it("offers five structures, the house method first, each between eight and fifteen beats or the three-act seven", () => {
    expect(TEMPLATES.map((template) => template.id)).toEqual([
      "turns",
      "three-acts",
      "eight-sequences",
      "fifteen-beats",
      "story-circle",
    ]);
    for (const template of TEMPLATES) {
      expect(template.beats.length).toBeGreaterThanOrEqual(7);
      expect(template.beats.length).toBeLessThanOrEqual(15);
      let last = -1;
      for (const item of template.beats) {
        expect(item.name).toBeTruthy();
        expect(item.prompt).toMatch(/\?$/);
        expect(item.at).toBeGreaterThanOrEqual(last);
        expect(item.at).toBeLessThanOrEqual(1);
        last = item.at;
      }
    }
    expect(templateById("nope")).toBeNull();
  });

  it("places a beat near a page of the target", () => {
    expect(beatPage(0.5, 120 * 8)).toBe(60);
    expect(beatPage(0, 120 * 8)).toBe(1);
    expect(beatPage(0.99, 30 * 8)).toBe(30);
    expect(beatPage(0.5, 8)).toBe(1);
  });

  it("applies a template as beat cards in one step, prompts on the change line, above the wall", () => {
    const seed = seedState();
    const top = Math.min(...seed.notes.map((note) => note.y));
    const applied = applyCommand(seed, { type: "apply_template", template: "turns" }, NOW);
    expect(applied.changed).toBe(true);
    const created = applied.result as BoardNote[];
    expect(created).toHaveLength(9);
    expect(applied.state.notes).toHaveLength(seed.notes.length + 9);
    expect(created.every((note) => note.rank === "beat")).toBe(true);
    expect(created[4]).toMatchObject({ headline: "The midpoint", change: "What turns here so there is no going back?" });
    // Above the cards that were there, and never overlapping them.
    expect(Math.max(...created.map((note) => note.y))).toBeLessThanOrEqual(top - NOTE_HEIGHT);
    // And in reading order: the first beat is on the top row, the last on the bottom.
    expect(created[0].y).toBeLessThan(created[8].y);
    // The existing cards are untouched.
    expect(applied.state.notes.slice(0, seed.notes.length)).toEqual(seed.notes);
    // Every card gets its own id and z.
    expect(new Set(created.map((note) => note.id)).size).toBe(9);
    expect(new Set(created.map((note) => note.z)).size).toBe(9);
  });

  it("starts an empty wall at the top-left and refuses an unknown template", () => {
    const applied = applyCommand(emptyState(), { type: "apply_template", template: "story-circle" }, NOW);
    expect((applied.result as BoardNote[])[0]).toMatchObject({ x: 140, y: 140, headline: "Comfort" });
    expect(applyCommand(emptyState(), { type: "apply_template", template: "nope" }, NOW).changed).toBe(false);
  });
});
