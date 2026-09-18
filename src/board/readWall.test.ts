import { describe, expect, it } from "vitest";
import {
  applyCommand,
  EIGHTHS_PER_PAGE,
  emptyState,
  type BoardState,
  type Command,
} from "./reducer";
import { describeRuns, describeSetups, readingOrder, readWall, storyOrder } from "./readWall";

const NOW = "2026-01-01T00:00:00.000Z";

function run(state: BoardState, ...commands: Command[]) {
  return commands.reduce((current, command) => applyCommand(current, command, NOW).state, state);
}

type Card = {
  id: string;
  x?: number;
  y?: number;
  headline?: string;
  change?: string;
  rank?: "beat" | "scene";
  pages?: number;
};

/** A wall laid out as one row, left to right, unless a card says otherwise. */
function wall(...cards: Card[]) {
  return cards.reduce(
    (state, card, index) =>
      applyCommand(
        state,
        {
          type: "create_note",
          id: card.id,
          x: card.x ?? 100 + index * 230,
          y: card.y ?? 100,
          headline: card.headline ?? `Scene ${card.id}`,
          change: card.change ?? `Something changes in ${card.id}.`,
          rank: card.rank ?? "scene",
          lengthEighths: (card.pages ?? 1) * EIGHTHS_PER_PAGE,
        },
        NOW,
      ).state,
    emptyState(),
  );
}

describe("readingOrder", () => {
  it("reads rows top to bottom and cards left to right within a row", () => {
    const state = wall(
      { id: "c", x: 500, y: 100 },
      { id: "a", x: 100, y: 110 },
      { id: "b", x: 300, y: 95 },
      { id: "d", x: 100, y: 400 },
    );
    expect(readingOrder(state.notes).map((note) => note.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("does not treat a card slightly lower in the same row as a new row", () => {
    // Half a card of drift is still the same row — a free wall is never tidy.
    const state = wall({ id: "a", x: 100, y: 100 }, { id: "b", x: 330, y: 180 });
    expect(readingOrder(state.notes).map((note) => note.id)).toEqual(["a", "b"]);
  });

  it("leaves the notes it was given untouched", () => {
    const state = wall({ id: "b", x: 300, y: 100 }, { id: "a", x: 100, y: 100 });
    const before = state.notes.map((note) => note.id);
    readingOrder(state.notes);
    expect(state.notes.map((note) => note.id)).toEqual(before);
  });
});

describe("runs between beats", () => {
  it("counts the scene pages strictly between consecutive beats", () => {
    const state = wall(
      { id: "open", pages: 2 },
      { id: "b1", rank: "beat" },
      { id: "s1", pages: 3 },
      { id: "s2", pages: 1 },
      { id: "b2", rank: "beat", pages: 5 },
      { id: "s3", pages: 2 },
      { id: "b3", rank: "beat" },
      { id: "tail", pages: 1 },
    );
    const reading = readWall(state);
    expect(reading.beats.map((beat) => beat.id)).toEqual(["b1", "b2", "b3"]);
    expect(reading.runs.map((run) => run.ids)).toEqual([["open"], ["s1", "s2"], ["s3"], ["tail"]]);
    expect(reading.runs.map(({ ids: _ids, ...run }) => run)).toEqual([
      { from: null, to: "b1", eighths: 2 * 8, cards: 1 },
      { from: "b1", to: "b2", eighths: 4 * 8, cards: 2 },
      { from: "b2", to: "b3", eighths: 2 * 8, cards: 1 },
      { from: "b3", to: null, eighths: 1 * 8, cards: 1 },
    ]);
  });

  it("omits an empty opening or closing run but keeps an empty run between beats", () => {
    const state = wall({ id: "b1", rank: "beat" }, { id: "b2", rank: "beat" });
    expect(readWall(state).runs).toEqual([{ from: "b1", to: "b2", eighths: 0, cards: 0, ids: [] }]);
  });

  it("describes runs by headline for a person", () => {
    const state = wall(
      { id: "open", headline: "Maya wakes" },
      { id: "b1", rank: "beat", headline: "The letter" },
      { id: "s1", headline: "Tom lies", pages: 1.5 },
      { id: "b2", rank: "beat", headline: "Read aloud" },
    );
    expect(describeRuns(readWall(state), state)).toEqual([
      'Before "The letter": about 1 pages, 1 card',
      '"The letter" → "Read aloud": about 1 4/8 pages, 1 card',
    ]);
  });
});

describe("findings", () => {
  it("says nothing about an honest wall", () => {
    const state = run(
      wall(
        { id: "b1", rank: "beat" },
        { id: "s1" },
        { id: "b2", rank: "beat" },
        { id: "s2" },
        { id: "b3", rank: "beat" },
      ),
    );
    expect(readWall(state).findings).toEqual([]);
  });

  it("returns nothing at all for an empty board", () => {
    const reading = readWall(emptyState());
    expect(reading).toEqual({ order: [], beats: [], runs: [], setups: [], payoffs: {}, later: [], findings: [], left: [] });
  });

  it("notes that runs cannot be read until a beat is marked, and passes no judgement on the count", () => {
    const reading = readWall(wall({ id: "a" }, { id: "b" }));
    expect(reading.findings).toEqual([
      expect.objectContaining({ kind: "unmarked" }),
    ]);
    expect(reading.findings[0].text).not.toMatch(/\b(8|15|too many|too few)\b/);
  });

  it("asks about a run more than twice the typical run (the sag detector)", () => {
    const state = wall(
      { id: "b1", rank: "beat", headline: "Inciting" },
      { id: "s1", pages: 3 },
      { id: "b2", rank: "beat", headline: "Lock in" },
      { id: "s2", pages: 4 },
      { id: "s3", pages: 4 },
      { id: "s4", pages: 4 },
      { id: "b3", rank: "beat", headline: "Midpoint" },
      { id: "s5", pages: 3 },
      { id: "b4", rank: "beat", headline: "All is lost" },
    );
    const sag = readWall(state).findings.filter((finding) => finding.kind === "sag");
    expect(sag).toHaveLength(1);
    expect(sag[0].ids).toEqual(["b2", "b3"]);
    expect(sag[0].text).toContain('About 12 pages run between "Lock in" and "Midpoint"');
    expect(sag[0].text).toMatch(/\?$/);
  });

  it("measures the typical run over runs that hold a card, so empty runs never make a page read as a sag", () => {
    // Four beats, three runs: one card of a page, nothing, a quarter page.
    // With the empties counted the median was an eighth and the page sagged
    // (round fifteen, entry 10); the empties are their own question.
    const state = wall(
      { id: "b1", rank: "beat" },
      { id: "s1", pages: 1 },
      { id: "b2", rank: "beat" },
      { id: "b3", rank: "beat" },
      { id: "s2", pages: 0.25 },
      { id: "b4", rank: "beat" },
    );
    const findings = readWall(state).findings;
    expect(findings.filter((f) => f.kind === "sag")).toEqual([]);
    expect(findings.filter((f) => f.kind === "empty")).toHaveLength(1);
  });

  it("does not call an even wall saggy just because one run is a little longer", () => {
    const state = wall(
      { id: "b1", rank: "beat" },
      { id: "s1", pages: 4 },
      { id: "b2", rank: "beat" },
      { id: "s2", pages: 6 },
      { id: "b3", rank: "beat" },
      { id: "s3", pages: 5 },
      { id: "b4", rank: "beat" },
    );
    expect(readWall(state).findings.filter((f) => f.kind === "sag")).toEqual([]);
  });

  it("asks about placeholder headlines and missing change lines", () => {
    const state = run(
      wall({ id: "b1", rank: "beat" }),
      { type: "create_note", id: "blank", x: 400, y: 100 },
      {
        type: "create_note",
        id: "half",
        x: 700,
        y: 100,
        headline: "Tom lies",
        change: "   ",
      },
    );
    const unwritten = readWall(state).findings.filter((f) => f.kind === "unwritten");
    expect(unwritten.map((f) => f.ids)).toEqual([["blank"], ["half"]]);
    expect(unwritten[0].text).toContain('"New beat"');
    expect(unwritten[1].text).toContain('"Tom lies" has no change line');
  });

  it("only lists unlinked cards once at least half the wall uses arrows", () => {
    const base = wall(
      { id: "b1", rank: "beat" },
      { id: "s1" },
      { id: "s2" },
      { id: "s3" },
      { id: "s4" },
    );
    // One arrow links two of five cards: the wall is not using arrows yet.
    const oneArrow = run(base, { type: "create_arrow", from: "b1", to: "s1" });
    expect(readWall(oneArrow).findings.filter((f) => f.kind === "unlinked")).toEqual([]);

    // Two arrows link three of five: now a card with none is worth a question.
    const twoArrows = run(oneArrow, { type: "create_arrow", from: "s1", to: "s2" });
    const unlinked = readWall(twoArrows).findings.filter((f) => f.kind === "unlinked");
    expect(unlinked).toHaveLength(1);
    expect(unlinked[0].ids).toEqual(["s3", "s4"]);
    expect(unlinked[0].text).toBe(
      '2 cards have no arrow in or out: "Scene s3", "Scene s4". What sets them up, and what do they pay off?',
    );

    const single = run(twoArrows, { type: "create_arrow", from: "s2", to: "s3" });
    const one = readWall(single).findings.filter((f) => f.kind === "unlinked");
    expect(one[0].text).toBe(
      'One card has no arrow in or out: "Scene s4". What sets it up, and what does it pay off?',
    );
  });

  it("asks whether two cards with the same headline do the same job", () => {
    const state = wall(
      { id: "b1", rank: "beat" },
      { id: "a", headline: "Maya finds the letter" },
      { id: "b", headline: "Maya finds the letter." },
      { id: "c", headline: "Tom lies about the job" },
      { id: "d", headline: "Tom lies about his job" },
    );
    const dupes = readWall(state).findings.filter((f) => f.kind === "duplicate");
    expect(dupes.map((f) => f.ids)).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("does not call two short, different headlines duplicates", () => {
    const state = wall(
      { id: "b1", rank: "beat" },
      { id: "a", headline: "The letter" },
      { id: "b", headline: "The job" },
    );
    expect(readWall(state).findings.filter((f) => f.kind === "duplicate")).toEqual([]);
  });

  it("asks whether a group over twenty pages is one sequence or two", () => {
    const state = run(
      wall(
        { id: "b1", rank: "beat" },
        { id: "s1", pages: 8 },
        { id: "s2", pages: 8 },
        { id: "s3", pages: 8 },
        { id: "s4", pages: 2 },
      ),
      { type: "create_group", title: "The heist", noteIds: ["s1", "s2", "s3"] },
    );
    const sequence = readWall(state).findings.filter((f) => f.kind === "sequence");
    expect(sequence).toHaveLength(1);
    expect(sequence[0].ids).toEqual([state.groups[0].id]);
    expect(sequence[0].text).toBe(
      '"The heist" runs about 24 pages across 3 cards. Is it one sequence or two?',
    );
  });

  it("asks where a person in the cast comes in when they are on no card", () => {
    const state = run(
      wall({ id: "b1", rank: "beat" }, { id: "s1" }),
      { type: "add_character", id: "m", name: "Maya" },
      { type: "add_character", id: "l", name: "The landlord" },
      { type: "set_cast", ids: ["b1", "s1"], characterIds: ["m"] },
    );
    const uncast = readWall(state).findings.filter((f) => f.kind === "uncast");
    expect(uncast).toEqual([
      { kind: "uncast", ids: ["l"], text: "The landlord is in the cast but on no card. Where do they come in?" },
    ]);
  });

  it("asks where a person went when they vanish for more than a third of the story", () => {
    // 12 pages total. Tom is in the first page and the last, gone for 10 between.
    const state = run(
      wall(
        { id: "b1", rank: "beat", headline: "Tom arrives" },
        { id: "s1", pages: 4 },
        { id: "b2", rank: "beat", pages: 2 },
        { id: "s2", pages: 4 },
        { id: "b3", rank: "beat", headline: "Tom returns" },
      ),
      { type: "add_character", id: "t", name: "Tom" },
      { type: "add_character", id: "m", name: "Maya" },
      { type: "set_cast", ids: ["b1", "b3"], characterIds: ["t"] },
      { type: "set_cast", ids: ["s1", "b2", "s2"], characterIds: ["m"] },
    );
    const absent = readWall(state).findings.filter((f) => f.kind === "absent");
    expect(absent).toHaveLength(1);
    expect(absent[0].ids).toEqual(["t", "b1", "b3"]);
    expect(absent[0].text).toBe(
      'Tom is in "Tom arrives" and then not again until "Tom returns", about 10 pages later. Where are they in between?',
    );
  });

  it("does not call a gap on a short wall a disappearance: a third of the story, and ten pages at least", () => {
    // 13 one-page cards, Maya on the second and the ninth: a gap of 6 pages, nearly half the wall.
    const cards = Array.from({ length: 13 }, (_, i) => ({ id: `c${i}`, rank: (i === 0 ? "beat" : "scene") as "beat" | "scene" }));
    const state = run(wall(...cards), { type: "add_character", id: "m", name: "Maya" }, { type: "set_cast", ids: ["c1", "c8"], characterIds: ["m"] });
    expect(readWall(state).findings.filter((f) => f.kind === "absent")).toEqual([]);
  });

  it("does not ask about a person who keeps turning up", () => {
    const state = run(
      wall(
        { id: "b1", rank: "beat" },
        { id: "s1", pages: 3 },
        { id: "b2", rank: "beat" },
        { id: "s2", pages: 3 },
        { id: "b3", rank: "beat" },
      ),
      { type: "add_character", id: "m", name: "Maya" },
      { type: "set_cast", ids: ["b1", "b2", "b3"], characterIds: ["m"] },
    );
    expect(readWall(state).findings.filter((f) => f.kind === "absent")).toEqual([]);
  });

  it("reads setups with the distance to their payoff, and says nothing when they run forward", () => {
    const state = run(
      wall(
        { id: "b1", rank: "beat", headline: "The gun on the wall" },
        { id: "s1", pages: 3 },
        { id: "s2", pages: 2 },
        { id: "b2", rank: "beat", headline: "The gun goes off" },
      ),
      { type: "create_arrow", from: "b1", to: "b2", kind: "setup" },
      { type: "create_arrow", from: "b1", to: "s1" },
    );
    const reading = readWall(state);
    expect(reading.setups).toEqual([
      { id: state.arrows[0].id, from: "b1", to: "b2", eighths: 6 * 8 },
    ]);
    expect(describeSetups(reading, state)).toEqual([
      '"The gun on the wall" sets up "The gun goes off", about 6 pages later',
    ]);
    expect(reading.findings.filter((f) => f.kind === "backwards")).toEqual([]);
  });

  it("asks which order is meant when a payoff comes before its setup on the wall", () => {
    const state = run(
      wall(
        { id: "b1", rank: "beat", headline: "The gun goes off" },
        { id: "s1" },
        { id: "b2", rank: "beat", headline: "The gun on the wall" },
      ),
      { type: "create_arrow", from: "b2", to: "b1", kind: "setup" },
    );
    const reading = readWall(state);
    const backwards = reading.findings.filter((f) => f.kind === "backwards");
    expect(backwards).toHaveLength(1);
    expect(backwards[0].ids).toEqual([state.arrows[0].id, "b2", "b1"]);
    expect(backwards[0].text).toBe(
      '"The gun on the wall" sets up "The gun goes off", but on the wall the payoff comes first. Which order do you mean?',
    );
    expect(describeSetups(reading, state)[0]).toContain("about 2 pages earlier");
  });

  it("asks where a folded card pays off until a setup arrow leaves it", () => {
    const base = run(
      wall(
        { id: "b1", rank: "beat", headline: "The gun on the wall" },
        { id: "s1" },
        { id: "b2", rank: "beat", headline: "The gun goes off" },
      ),
      { type: "set_plant", ids: ["b1"], plants: true },
    );
    const unpaid = readWall(base).findings.filter((f) => f.kind === "unpaid");
    expect(unpaid).toEqual([
      {
        kind: "unpaid",
        ids: ["b1"],
        text: '"The gun on the wall" plants something, and no arrow pays it off. Where does it come back?',
      },
    ]);

    // A plain "follows" arrow is not a payoff.
    const follows = run(base, { type: "create_arrow", from: "b1", to: "s1" });
    expect(readWall(follows).findings.filter((f) => f.kind === "unpaid")).toHaveLength(1);

    const paid = run(base, { type: "create_arrow", from: "b1", to: "b2", kind: "setup" });
    expect(readWall(paid).findings.filter((f) => f.kind === "unpaid")).toEqual([]);
  });

  it("never mutates the state it reads", () => {
    const state = wall({ id: "b1", rank: "beat" }, { id: "s1" }, { id: "b2", rank: "beat" });
    const snapshot = JSON.stringify(state);
    readWall(state);
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe("payoffs: which scene pays each plant off", () => {
  it("names every setup arrow's head in wall order, and none while unpaid", () => {
    let state = emptyState();
    const plant = applyCommand(state, { type: "create_note", headline: "The gun on the wall", change: "Nobody mentions it.", x: 0, y: 0, plants: true }).result as { id: string };
    state = applyCommand(state, { type: "create_note", headline: "The gun on the wall", change: "Nobody mentions it.", x: 0, y: 0, plants: true }).state;
    const first = state.notes[0];
    state = applyCommand(state, { type: "create_note", headline: "Later", change: "It goes off.", x: 600, y: 0 }).state;
    state = applyCommand(state, { type: "create_note", headline: "Latest", change: "It goes off again.", x: 1200, y: 0 }).state;
    const [, later, latest] = state.notes;
    expect(readWall(state).payoffs).toEqual({ [first.id]: [] });
    state = applyCommand(state, { type: "create_arrow", from: first.id, to: latest.id, kind: "setup" }).state;
    state = applyCommand(state, { type: "create_arrow", from: first.id, to: later.id, kind: "setup" }).state;
    // Two payoffs: the ledger pays off at the cash and again at the initials, and both count.
    expect(readWall(state).payoffs).toEqual({ [first.id]: [later.id, latest.id] });
    expect(readWall(state).findings.filter((f) => f.kind === "unpaid")).toEqual([]);
    void plant;
  });
});

describe("a fold that pays off on another board (R50)", () => {
  it("is not unpaid, and is listed under later with its board", () => {
    let state = emptyState();
    state = applyCommand(state, { type: "create_note", headline: "The key", change: "She keeps it.", x: 0, y: 0, plants: true }).state;
    const key = state.notes[0];
    expect(readWall(state).findings.filter((f) => f.kind === "unpaid")).toHaveLength(1);
    state = applyCommand(state, { type: "set_payoff_board", ids: [key.id], boardId: "ep2" }).state;
    const reading = readWall(state);
    expect(reading.findings.filter((f) => f.kind === "unpaid")).toHaveLength(0);
    expect(reading.later).toEqual([{ id: key.id, boardId: "ep2" }]);
    expect(reading.payoffs[key.id]).toBeUndefined();
  });
});

describe("two beats back to back", () => {
  it("asks whether they are one beat or a scene is missing, and stays quiet when scenes run between", () => {
    let state = emptyState();
    state = applyCommand(state, { type: "create_note", headline: "The gate", change: "Miguel checks the glovebox.", x: 0, y: 0, rank: "beat" }).state;
    state = applyCommand(state, { type: "create_note", headline: "The gun", change: "Dana moves it to her jacket.", x: 600, y: 0, rank: "beat" }).state;
    const empty = readWall(state).findings.filter((finding) => finding.kind === "empty");
    expect(empty).toHaveLength(1);
    expect(empty[0].text).toContain('between "The gate" and "The gun"');
    expect(empty[0].ids).toEqual([state.notes[0].id, state.notes[1].id]);
    state = applyCommand(state, { type: "create_note", headline: "The diner", change: "Miguel pockets the tips.", x: 300, y: 0 }).state;
    expect(readWall(state).findings.filter((finding) => finding.kind === "empty")).toHaveLength(0);
  });
});

describe("beats back to back, in a chain", () => {
  it("asks once for consecutive empty runs, naming every turn in the chain", () => {
    let state = emptyState();
    for (const [i, headline] of ["The envelope", "The initials", "The counter", "The gate"].entries()) {
      state = applyCommand(state, { type: "create_note", headline, change: "Something turns.", x: i * 300, y: 0, rank: "beat" }).state;
    }
    const empty = readWall(state).findings.filter((finding) => finding.kind === "empty");
    expect(empty).toHaveLength(1);
    expect(empty[0].ids).toEqual(state.notes.map((note) => note.id));
    expect(empty[0].text).toContain('between "The envelope", "The initials", "The counter" and "The gate": four turns back to back');
  });

  it("keeps two chains apart when a scene runs between them", () => {
    let state = emptyState();
    const cards: Array<[string, "beat" | "scene"]> = [["A", "beat"], ["B", "beat"], ["C", "beat"], ["The diner", "scene"], ["D", "beat"], ["E", "beat"]];
    for (const [i, [headline, rank]] of cards.entries()) {
      state = applyCommand(state, { type: "create_note", headline, change: "Something turns.", x: i * 300, y: 0, rank }).state;
    }
    const empty = readWall(state).findings.filter((finding) => finding.kind === "empty");
    expect(empty).toHaveLength(2);
    expect(empty[0].text).toContain('between "A", "B" and "C": three turns');
    expect(empty[1].text).toContain('between "D" and "E": two turns back to back');
  });
});

describe("a card with no place", () => {
  it("asks once the writer has started placing cards, as one question however many", () => {
    let state = emptyState();
    state = applyCommand(state, { type: "create_note", headline: "The gate", change: "Miguel checks the glovebox.", x: 0, y: 0 }).state;
    state = applyCommand(state, { type: "create_note", headline: "The diner", change: "Miguel pockets the tips.", x: 300, y: 0 }).state;
    state = applyCommand(state, { type: "create_note", headline: "The key", change: "She keeps it.", x: 600, y: 0 }).state;
    // No card placed yet: the writer has not started, so the wall does not ask.
    expect(readWall(state).findings.filter((finding) => finding.kind === "unplaced")).toHaveLength(0);
    state = applyCommand(state, { type: "set_location", ids: [state.notes[0].id], location: "the prison gate" }).state;
    let asked = readWall(state).findings.filter((finding) => finding.kind === "unplaced");
    expect(asked).toHaveLength(1);
    expect(asked[0].ids).toEqual([state.notes[1].id, state.notes[2].id]);
    expect(asked[0].text).toBe('2 cards say no place: "The diner", "The key". Where do they happen?');
    state = applyCommand(state, { type: "set_location", ids: [state.notes[1].id], location: "the diner" }).state;
    asked = readWall(state).findings.filter((finding) => finding.kind === "unplaced");
    expect(asked[0].text).toBe('"The key" says no place. Where does it happen?');
    state = applyCommand(state, { type: "set_location", ids: [state.notes[2].id], location: "the office" }).state;
    expect(readWall(state).findings.filter((finding) => finding.kind === "unplaced")).toHaveLength(0);
  });
});

describe("act groups", () => {
  it("does not ask whether an act is one sequence or two", () => {
    let state = emptyState();
    const ids: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      state = applyCommand(state, { type: "create_note", headline: `Scene ${i}`, change: "Something turns.", x: i * 300, y: 0, lengthEighths: 8 * 8 }).state;
      ids.push(state.notes[i].id);
    }
    state = applyCommand(state, { type: "create_group", noteIds: ids, title: "Act two" }).state;
    expect(readWall(state).findings.filter((finding) => finding.kind === "sequence")).toHaveLength(0);
    state = applyCommand(state, { type: "rename_group", id: state.groups[0].id, title: "The heist" }).state;
    expect(readWall(state).findings.filter((finding) => finding.kind === "sequence")).toHaveLength(1);
  });
});

describe("a left question (R53)", () => {
  it("is held back while it is the same question, and asked again the moment it would read differently", () => {
    // Three beats; the middle run is long, so the wall asks about the sag.
    let state = wall(
      { id: "a", rank: "beat" },
      { id: "s1", pages: 1 },
      { id: "b", rank: "beat" },
      { id: "s2", pages: 4 },
      { id: "s3", pages: 4 },
      { id: "c", rank: "beat" },
      { id: "s4", pages: 1 },
      { id: "d", rank: "beat" },
    );
    const first = readWall(state);
    const sag = first.findings.find((finding) => finding.kind === "sag");
    expect(sag).toBeDefined();
    expect(first.left).toEqual([]);
    state = run(state, { type: "leave_question", kind: "sag", ids: sag!.ids, text: sag!.text });
    const held = readWall(state);
    expect(held.findings.find((finding) => finding.kind === "sag")).toBeUndefined();
    expect(held.left).toEqual([{ ...sag, since: NOW }]);
    // A page moves in the run: the question would read differently, so it is asked again.
    const changed = run(state, { type: "set_length", ids: ["s3"], lengthEighths: 6 * EIGHTHS_PER_PAGE });
    const again = readWall(changed);
    expect(again.findings.find((finding) => finding.kind === "sag")).toBeDefined();
    expect(again.left).toEqual([]);
    // Back to how it was, and the writer's word holds again.
    const restored = run(changed, { type: "set_length", ids: ["s3"], lengthEighths: 4 * EIGHTHS_PER_PAGE });
    expect(readWall(restored).left).toHaveLength(1);
    // ask_again takes the word back now.
    expect(readWall(run(restored, { type: "ask_again", kind: "sag" })).findings.find((finding) => finding.kind === "sag")).toBeDefined();
  });
});

describe("the cast is the project's (R51)", () => {
  it("does not ask about a person on no card here who is on a card of another board", () => {
    let state = wall({ id: "a" });
    state = run(state, { type: "add_character", name: "Nessa", id: "nessa" }, { type: "add_character", name: "Fiona", id: "fiona" });
    const alone = readWall(state).findings.filter((finding) => finding.kind === "uncast").map((finding) => finding.ids[0]);
    expect(alone).toEqual(["nessa", "fiona"]);
    const withOthers = readWall(state, { elsewhere: ["nessa"] }).findings.filter((finding) => finding.kind === "uncast").map((finding) => finding.ids[0]);
    expect(withOthers).toEqual(["fiona"]);
  });
});

describe("story order: the arrows over the rows (R56)", () => {
  it("is reading order with no arrows, and pulls a wired card into its place before any tidy", () => {
    // a, b, c in a row; d sits far below, wired between a and b.
    let state = wall({ id: "a" }, { id: "b" }, { id: "c" }, { id: "d", x: 100, y: 900 });
    expect(storyOrder(state).map((note) => note.id)).toEqual(["a", "b", "c", "d"]);
    state = run(state, { type: "create_arrow", from: "a", to: "d" }, { type: "create_arrow", from: "d", to: "b" }, { type: "create_arrow", from: "b", to: "c" });
    expect(storyOrder(state).map((note) => note.id)).toEqual(["a", "d", "b", "c"]);
    // The reading uses it: the runs and the numbering follow the arrows, not the rows.
    const marked = run(state, { type: "set_rank", ids: ["a", "c"], rank: "beat" });
    expect(readWall(marked).order).toEqual(["a", "d", "b", "c"]);
    expect(readWall(marked).runs.find((r) => r.from === "a" && r.to === "c")?.ids).toEqual(["d", "b"]);
    // A setup pulls nothing; a pair pointing both ways is a tie.
    const setup = run(wall({ id: "a" }, { id: "b" }), { type: "create_arrow", from: "b", to: "a", kind: "setup" });
    expect(storyOrder(setup).map((note) => note.id)).toEqual(["a", "b"]);
    const tie = run(wall({ id: "a" }, { id: "b" }), { type: "create_arrow", from: "a", to: "b" }, { type: "create_arrow", from: "b", to: "a" });
    expect(storyOrder(tie).map((note) => note.id)).toEqual(["a", "b"]);
  });
});

describe("the sag waits for a claim (round fourteen, entry 12)", () => {
  it("asks nothing while every run is the default page per card, and asks once a card in a run is sized or written", () => {
    // Beats A, B, C, D; one card between A and B, three between B and C, one between C and D — all unsized.
    const cards = [{ id: "A", rank: "beat" as const }, { id: "s1" }, { id: "B", rank: "beat" as const }, { id: "s2" }, { id: "s3" }, { id: "s4" }, { id: "C", rank: "beat" as const }, { id: "s5" }, { id: "D", rank: "beat" as const }];
    const defaults = cards.reduce(
      (state, card, index) => applyCommand(state, { type: "create_note", id: card.id, x: 100 + index * 230, y: 100, headline: card.id, change: "Turns.", rank: card.rank ?? "scene" }, NOW).state,
      emptyState(),
    );
    expect(defaults.notes.every((note) => note.lengthEighths === null)).toBe(true);
    expect(readWall(defaults).findings.some((f) => f.kind === "sag")).toBe(false);
    const sized = run(defaults, { type: "set_length", ids: ["s2"], lengthEighths: 8 });
    expect(readWall(sized).findings.some((f) => f.kind === "sag")).toBe(true);
    expect(readWall(sized).findings.find((f) => f.kind === "sag")?.text).toContain("About 3 pages run between");
    // The median run of one page reads "1 page", never "1 pages" (round thirteen, entry 15).
    expect(readWall(sized).findings.find((f) => f.kind === "sag")?.text).toContain("about 1 page (");
  });
});

describe("the duplicate check ignores a leading day (round fourteen, entry 13)", () => {
  it("does not read two scenes on the same day at the same place as one scene, but still catches the same words", () => {
    const days = wall({ id: "a", headline: "Day three. The fair at Kilmallock: they sell all day" }, { id: "b", headline: "Day three. The road out of Kilmallock: the letter in the glove box" });
    expect(readWall(days).findings.some((f) => f.kind === "duplicate")).toBe(false);
    const same = wall({ id: "a", headline: "Day one. Tom lies about the job" }, { id: "b", headline: "Day two, night. Tom lies about his job" });
    expect(readWall(same).findings.some((f) => f.kind === "duplicate")).toBe(true);
  });
});
