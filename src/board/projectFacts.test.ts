import { describe, expect, it } from "vitest";
import { applyCommand, emptyState, type BoardState, type Command } from "./reducer";
import { withRecord } from "./record";
import { factsLine, projectFacts, whenWords } from "./projectFacts";

const NOW = "2026-09-27T12:00:00.000Z";
const run = (state: BoardState, ...commands: Command[]) => commands.reduce((current, command) => applyCommand(current, command, NOW).state, state);

describe("what a project holds, for its row (Robert, 2026-09-27)", () => {
  const one = withRecord(
    run(
      emptyState(),
      { type: "create_note", id: "a", x: 0, y: 0, headline: "The wall", change: "A crack." },
      { type: "create_note", id: "b", x: 300, y: 0, headline: "The office", change: "The ledger." },
      { type: "create_note", id: "c", x: 600, y: 0, headline: "Cut", change: "Gone." },
      { type: "set_length", ids: ["a"], lengthEighths: 12 },
      { type: "set_aside", ids: ["c"], aside: true },
    ),
    { at: "2026-09-27T09:12:00.000Z", by: "robert@example.com", lines: ['made "The wall"'] },
  );
  const two = withRecord(run(emptyState(), { type: "create_note", id: "d", x: 0, y: 0, headline: "The slip", change: "Brandt." }), { at: "2026-09-27T10:41:00.000Z", by: "an agent", lines: ['made "The slip"'] });

  it("counts the cards in the film and their pages, and takes the newest change on any board", () => {
    expect(projectFacts([one, two])).toEqual({ boards: 2, cards: 3, eighths: 12 + 8 + 8, changedAt: "2026-09-27T10:41:00.000Z", changedBy: "an agent" });
    expect(projectFacts([])).toEqual({ boards: 0, cards: 0, eighths: 0, changedAt: null, changedBy: null });
  });

  it("says what it holds and who changed it last, the writer as you and an agent as an agent", () => {
    const now = new Date(2026, 8, 27, 15, 0);
    const at = new Date(2026, 8, 27, 14, 41).toISOString();
    expect(factsLine({ boards: 2, cards: 7, eighths: 34, changedAt: at, changedBy: "an agent" }, { me: "robert@example.com", now })).toEqual({ holds: "2 boards · 7 cards · 4 2/8 pages", changed: "changed 14:41 by an agent", agent: true });
    expect(factsLine({ boards: 1, cards: 1, eighths: 8, changedAt: at, changedBy: "robert@example.com" }, { me: "robert@example.com", now })).toEqual({ holds: "1 board · 1 card · 1 page", changed: "changed 14:41 by you", agent: false });
    expect(factsLine({ boards: 1, cards: 3, eighths: 24, changedAt: at, changedBy: "ada@example.com" }, { me: "robert@example.com", now }).changed).toBe("changed 14:41 by ada@example.com");
    // A project with no record yet says when it was saved, and claims no hand.
    expect(factsLine({ boards: 1, cards: 3, eighths: 24, changedAt: null, changedBy: null }, { savedAt: new Date(2026, 8, 26, 9, 0).toISOString(), now }).changed).toBe("saved yesterday");
  });

  it("says when in the reader's own clock", () => {
    const now = new Date(2026, 8, 27, 15, 0);
    expect(whenWords(new Date(2026, 8, 27, 3, 5).toISOString(), now)).toBe("03:05");
    expect(whenWords(new Date(2026, 8, 26, 23, 59).toISOString(), now)).toBe("yesterday");
    expect(whenWords(new Date(2026, 8, 3, 12, 0).toISOString(), now)).toBe("3 Sep");
    expect(whenWords("nonsense", now)).toBe("");
  });
});
