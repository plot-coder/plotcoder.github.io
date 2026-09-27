import { describe, expect, it } from "vitest";
import { applyCommand, emptyState, normalizeState, type BoardState, type Command } from "./reducer";
import { describeChange, describeRecord, spanWords, withRecord } from "./record";

const NOW = "2026-09-26T21:30:00.000Z";
function run(state: BoardState, ...commands: Command[]) {
  return commands.reduce((current, command) => applyCommand(current, command, NOW).state, state);
}
const base = () =>
  run(
    emptyState(),
    { type: "create_note", id: "f", x: 0, y: 0, headline: "The first Friday", change: "Eleven in the queue." },
    { type: "create_note", id: "bank", x: 300, y: 0, headline: "The bank", change: "The figure." },
    { type: "add_character", id: "m", name: "Mairead Doyle" },
    { type: "add_character", id: "p", name: "Priya Nair" },
  );

describe("the record of a session (R76): what changed, in the person's terms", () => {
  it("names a page written, a card set aside, a cast, a line struck, a turn kept, in words a person reads", () => {
    const before = run(base(), { type: "add_open_line", text: "Now, or 1987" });
    const after = run(
      before,
      { type: "set_text", id: "f", text: "INT. DOYLE'S - NIGHT\n\nThe bell over the door." },
      { type: "set_aside", ids: ["bank"], aside: true },
      { type: "set_cast", ids: ["f"], characterIds: ["m"], maybeCharacterIds: ["p"] },
      { type: "strike_open_line", index: 0 },
      { type: "set_rank", ids: ["f"], rank: "beat" },
    );
    const { lines, ids } = describeChange(before, after);
    expect(lines).toEqual([
      'wrote "The first Friday" (1/8 pages)',
      'kept "The first Friday" as a turn',
      'cast "The first Friday": Mairead Doyle, and Priya Nair as a maybe',
      'set "The bank" aside, out of the film',
      'decided a line about the film: "Now, or 1987"',
    ]);
    expect(ids).toEqual(["f", "bank"]);
    expect(describeChange(after, after)).toEqual({ lines: [], ids: [] });
  });

  it("reads a move as a move only when nothing else on the card changed, and wires and payoffs by their cards", () => {
    const before = base();
    expect(describeChange(before, run(before, { type: "move_note", id: "f", x: 50, y: 50 })).lines).toEqual(['moved "The first Friday" on the wall']);
    const wired = run(before, { type: "create_arrow", from: "f", to: "bank", kind: "follows" });
    expect(describeChange(before, wired).lines).toEqual(['wired "The bank" after "The first Friday"']);
    const paid = run(wired, { type: "set_plant", ids: ["f"], what: "the sign" }, { type: "create_arrow", from: "f", to: "bank", kind: "setup" });
    expect(describeChange(wired, paid).lines).toEqual(['folded "The first Friday": it plants the sign', '"The bank" now pays off "The first Friday"']);
  });

  it("keeps the last fifty changes, merges a repeated change by the same hand within five minutes, and tells them as sessions", () => {
    let state = base();
    state = withRecord(state, { at: "2026-09-26T21:30:00.000Z", by: "an agent", lines: ['wrote "The first Friday" (1/8 pages)'], ids: ["f"] });
    state = withRecord(state, { at: "2026-09-26T21:31:00.000Z", by: "an agent", lines: ['moved "The bank" on the wall'], ids: ["bank"] });
    state = withRecord(state, { at: "2026-09-26T21:31:30.000Z", by: "an agent", lines: ['moved "The bank" on the wall'], ids: ["bank"] });
    state = withRecord(state, { at: "2026-09-26T22:40:00.000Z", by: "test@test.com", lines: ['set "The bank" aside, out of the film'], ids: ["bank"] });
    state = withRecord(state, { at: "2026-09-26T22:41:00.000Z", by: "test@test.com", lines: [], ids: [] });
    expect(state.record).toHaveLength(3);
    expect(state.record[1].at).toBe("2026-09-26T21:31:30.000Z");
    const sessions = describeRecord(state);
    expect(sessions.map((session) => [session.by, session.count, session.lines.length])).toEqual([["test@test.com", 1, 1], ["an agent", 2, 2]]);
    expect(spanWords(sessions[1].from, sessions[1].to, "2026-09-26T23:00:00.000Z")).toBe("today 21:30 to 21:31");
    expect(spanWords(sessions[0].from, sessions[0].to, "2026-09-27T10:00:00.000Z")).toBe("2026-09-26 22:40");
    expect(describeRecord(state, { since: "2026-09-26T22:00:00.000Z" })).toHaveLength(1);
    for (let i = 0; i < 60; i += 1) state = withRecord(state, { at: `2026-09-27T0${Math.floor(i / 10)}:${String(i % 10).padStart(2, "0")}:00.000Z`, by: "an agent", lines: [`change ${i}`], ids: [] });
    expect(state.record).toHaveLength(50);
    expect(normalizeState({ ...state, record: [{ bad: true }, ...state.record] } as never).record).toHaveLength(50);
  });

  it("holds the agent's last word until it is taken back", () => {
    const state = run(base(), { type: "hand_over", words: "Whether the man's card comes back is yours.", by: "an agent" });
    expect(state.handOver).toEqual({ at: NOW, by: "an agent", words: "Whether the man's card comes back is yours." });
    expect(applyCommand(state, { type: "hand_over", words: "Whether the man's card comes back is yours." }, NOW).changed).toBe(false);
    expect(run(state, { type: "hand_over", words: "" }).handOver).toBeNull();
    expect(normalizeState({ ...emptyState(), handOver: { words: "   " } } as never).handOver).toBeNull();
  });
});

describe("a line changed and a note taken off are not a rewrite (pass 2b, entry 33)", () => {
  it("says changed a line, took a note off, or rewrote, by how much of the page stands", () => {
    const page = "INT. DOYLE'S - NIGHT\n\nThe bell over the door.\n\nSalt. Vinegar. Paper.\n\n[[Declan is not here: not decided.]]\n\nMairead counts the queue.";
    const before = run(base(), { type: "set_text", id: "f", text: page });
    const line = run(before, { type: "set_text", id: "f", text: page.replace("Salt. Vinegar. Paper.", "Salt. Vinegar. Paper. The queue moves.") });
    expect(describeChange(before, line).lines).toEqual(['changed a line in "The first Friday" (1/8 pages)']);
    const note = run(before, { type: "set_text", id: "f", text: page.replace("\n\n[[Declan is not here: not decided.]]", "") });
    expect(describeChange(before, note).lines).toEqual(['took a note off "The first Friday"']);
    const rewrite = run(before, { type: "set_text", id: "f", text: "INT. DOYLE'S - NIGHT\n\nNothing of the old page. Every line new. The end." });
    expect(describeChange(before, rewrite).lines).toEqual(['rewrote "The first Friday" (1/8 pages)']);
  });
});
