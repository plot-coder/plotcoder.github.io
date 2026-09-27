import { describe, expect, it } from "vitest";
import { applyCommand, emptyState, storyOrder } from "./reducer";
import { selectStretch, stretchState } from "./stretch";
import { toFountain } from "./fountain";

function wall() {
  let state = emptyState();
  const ids: string[] = [];
  for (const headline of ["The letter", "The bank", "The pier", "The fair", "The ferry"]) {
    const made = applyCommand(state, { type: "create_note", headline, change: `${headline} turns`, text: `${headline}, on the page.` });
    state = made.state;
    ids.push((made.result as { id: string }).id);
  }
  for (let i = 1; i < ids.length; i += 1) state = applyCommand(state, { type: "create_arrow", from: ids[i - 1], to: ids[i] }).state;
  state = applyCommand(state, { type: "create_group", noteIds: [ids[1], ids[2]], title: "Act Two" }).state;
  state = applyCommand(state, { type: "set_aside", ids: [ids[4]], aside: true }).state;
  return { state, ids };
}

describe("a stretch of the film, selected (R77 a)", () => {
  it("names one scene, a stretch either way round, one end alone, or a group, in story order", () => {
    const { state, ids } = wall();
    const heads = (picked: ReturnType<typeof selectStretch>) => picked.cards!.map((note) => note.headline);
    expect(heads(selectStretch(state, { scene: "the bank" }))).toEqual(["The bank"]);
    expect(selectStretch(state, { scene: ids[1] }).words).toBe('"The bank"');
    expect(heads(selectStretch(state, { from: "The bank", to: "The fair" }))).toEqual(["The bank", "The pier", "The fair"]);
    expect(heads(selectStretch(state, { from: "The fair", to: ids[1] }))).toEqual(["The bank", "The pier", "The fair"]);
    expect(heads(selectStretch(state, { to: "The bank" }))).toEqual(["The letter", "The bank"]);
    expect(heads(selectStretch(state, { from: "The fair" }))).toEqual(["The fair"]);
    expect(selectStretch(state, { from: "The bank", to: "The fair" }).words).toBe('"The bank" to "The fair"');
    const act = selectStretch(state, { group: "act two" });
    expect(heads(act)).toEqual(["The bank", "The pier"]);
    expect(act.words).toBe('the group "Act Two"');
    expect(act.whole).toBe(false);
  });

  it("is the whole film when nothing is named, and says what it cannot find", () => {
    const { state } = wall();
    const all = selectStretch(state, {});
    expect(all.whole).toBe(true);
    expect(all.cards).toHaveLength(4);
    expect(selectStretch(state, { scene: "The ferry" }).error).toContain('No card with id or headline "The ferry" in the film\'s order');
    expect(selectStretch(state, { group: "Act Nine" }).error).toContain('No group with id or title "Act Nine"');
    expect(selectStretch(state, { from: "The letter", to: "The fair" }).whole).toBe(true);
  });

  it("narrows the board to the stretch so the pages print it and nothing else", () => {
    const { state } = wall();
    const picked = selectStretch(state, { from: "The bank", to: "The fair" });
    const narrowed = stretchState(state, picked.cards!);
    expect(storyOrder(narrowed).map((note) => note.headline)).toEqual(["The bank", "The pier", "The fair"]);
    expect(narrowed.arrows).toHaveLength(2);
    expect(narrowed.groups[0].noteIds).toHaveLength(2);
    const text = toFountain(narrowed, { title: "The Letter" });
    expect(text).toContain("The bank, on the page.");
    expect(text).not.toContain("The letter, on the page.");
    expect(text).not.toContain("The ferry, on the page.");
  });
});
