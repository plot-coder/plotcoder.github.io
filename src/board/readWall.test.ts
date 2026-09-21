import { describe, expect, it } from "vitest";
import {
  applyCommand,
  EIGHTHS_PER_PAGE,
  emptyState,
  seedState,
  type BoardState,
  type Command,
} from "./reducer";
import { describeRuns, describeSetups, describeUndecided, openOutsideFilm, readingOrder, readWall, storyOrder } from "./readWall";

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

describe("a change line left open (R67)", () => {
  it("is listed under the open fields and not asked for, while the card's other questions stand", () => {
    const at = "2026-09-20T00:00:00.000Z";
    let state = applyCommand(emptyState(), { type: "create_note", id: "t", headline: "The timetable", changeOpen: "I don't know yet", plantsWhat: "the timetable" }, at).state;
    state = applyCommand(state, { type: "set_rank", ids: ["t"], rank: "beat" }, at).state;
    const reading = readWall(state);
    expect(reading.openFields).toContainEqual({ field: "change", id: "t", words: "I don't know yet" });
    expect(reading.findings.some((finding) => finding.text.includes("has no change line"))).toBe(false);
    expect(reading.findings.some((finding) => finding.kind === "unpaid")).toBe(true);
  });
});

describe("everything undecided in one place (round twenty-two, entries 41, 43, 67, 86, 89)", () => {
  const at = "2026-09-20T00:00:00.000Z";
  const wall = () => {
    let state = emptyState();
    for (const id of ["a", "b", "c", "d"]) state = applyCommand(state, { type: "create_note", id, headline: id.toUpperCase(), changeOpen: "I don't know yet" }, at).state;
    state = applyCommand(state, { type: "set_location", ids: ["a"], open: "the shelter, or her kitchen" } as never, at).state;
    state = applyCommand(state, { type: "set_when", ids: ["a"], open: "which winter" } as never, at).state;
    state = applyCommand(state, { type: "set_open", ids: ["b"], open: "whether Tom is there" }, at).state;
    state = applyCommand(state, { type: "set_location", ids: ["c"], location: "the bog road" }, at).state;
    state = applyCommand(state, { type: "set_length", ids: ["c"], lengthEighths: 16 }, at).state;
    return state;
  };

  it("groups words shared by three cards, then lists each card once with everything open on it", () => {
    const state = wall();
    const { open } = describeUndecided(state, readWall(state), { project: [{ label: "the target", words: "half an hour or a feature" }] });
    expect(open[0]).toBe("  - the target — half an hour or a feature");
    expect(open[1]).toBe("  - the change line, on 4 cards (every card) — I don't know yet");
    expect(open).toContain('  - "A" — where: the shelter, or her kitchen; when: which winter');
    expect(open).toContain('  - "B" — open: whether Tom is there');
    // No card twice, and a card with nothing particular is not listed at all.
    expect(open.filter((line) => line.includes('"A"')).length).toBe(1);
    expect(open.some((line) => line.startsWith('  - "C"'))).toBe(false);
  });

  it("lists what is open on a card set aside, after the film's, marked (the issues file, C1)", () => {
    const state = applyCommand(wall(), { type: "set_aside", ids: ["b"], aside: true }, at).state;
    const { open } = describeUndecided(state, readWall(state));
    expect(open.at(-1)).toBe('  - "B" (set aside) — open: whether Tom is there; the change line: I don\'t know yet');
  });

  it("lists what is simply not said under its own head, never as open", () => {
    const state = wall();
    const { open, blank } = describeUndecided(state, readWall(state));
    // "B" is wholly open by the writer's word, so nothing on it is blank (round twenty-three, entry 66).
    expect(blank).toContain('  - no place: "D"');
    expect(blank).toContain('  - no when: "C", "D"');
    expect(blank).toContain('  - no length (read as a page each): "A", "D"');
    expect(open.join("\n")).not.toContain("no place");
    // Nobody in it is only a blank once the wall has a cast.
    expect(blank.some((line) => line.includes("nobody in it"))).toBe(false);
  });
});

describe("two turns back to back (round twenty-two, entry 40)", () => {
  it("offers the answer a page of notes usually wants: not that far yet", () => {
    const at = "2026-09-20T00:00:00.000Z";
    let state = emptyState();
    for (const id of ["a", "b"]) state = applyCommand(state, { type: "create_note", id, headline: id, change: "x", rank: "beat" }, at).state;
    state = applyCommand(state, { type: "create_arrow", from: "a", to: "b", kind: "follows" }, at).state;
    const asked = readWall(state).findings.find((finding) => finding.kind === "empty");
    expect(asked?.text).toContain("is that the pace — or have you not got that far yet?");
  });
});

describe("a setup's distance on a wall with no order (round twenty-two, entry 30)", () => {
  it("says the distance is by the rows until a follows arrow sets the order", () => {
    const at = "2026-09-20T00:00:00.000Z";
    let state = applyCommand(seedState(), { type: "set_plant", ids: ["maya-letter"], plants: true }, at).state;
    state = { ...state, arrows: [] };
    state = applyCommand(state, { type: "create_arrow", from: "maya-letter", to: "letter-aloud", kind: "setup" }, at).state;
    expect(describeSetups(readWall(state), state)[0]).toMatch(/pages later, by the rows: the story order is not set$/);
    state = applyCommand(state, { type: "create_arrow", from: "maya-letter", to: "tom-lies", kind: "follows" }, at).state;
    expect(describeSetups(readWall(state), state)[0]).not.toContain("by the rows");
  });
});

describe("how much of the film is wired (round twenty-two, entry 20)", () => {
  it("counts follows arrows and the film's cards, not setup arrows or cards set aside", () => {
    const at = "2026-09-20T00:00:00.000Z";
    let state = emptyState();
    for (const id of ["a", "b", "c", "d"]) state = applyCommand(state, { type: "create_note", id, headline: id, change: "x" }, at).state;
    state = applyCommand(state, { type: "create_arrow", from: "a", to: "d", kind: "setup" }, at).state;
    expect(readWall(state).wired).toEqual({ linked: 0, of: 4 });
    state = applyCommand(state, { type: "create_arrow", from: "a", to: "b", kind: "follows" }, at).state;
    state = applyCommand(state, { type: "set_aside", ids: ["c"], aside: true }, at).state;
    expect(readWall(state).wired).toEqual({ linked: 2, of: 3 });
  });
});

describe("a setup from a card behind another (round twenty-two, entry 60)", () => {
  it("has no distance, says why, and is never NaN", () => {
    let state = seedState();
    const at = "2026-09-20T00:00:00.000Z";
    state = applyCommand(state, { type: "set_alternative", id: "tom-lies", of: "maya-letter" }, at).state;
    state = applyCommand(state, { type: "set_plant", ids: ["tom-lies"], plants: true }, at).state;
    state = applyCommand(state, { type: "create_arrow", from: "tom-lies", to: "letter-aloud", kind: "setup" }, at).state;
    const reading = readWall(state);
    expect(reading.setups.find((setup) => setup.from === "tom-lies")?.eighths).toBeNull();
    const line = describeSetups(reading, state).join("\n");
    expect(line).not.toContain("NaN");
    expect(line).toContain("no distance yet: its first card is behind another card as its other version");
  });
});

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
      'Before "The letter": about 1 page, 1 card, estimated',
      '"The letter" → "Read aloud": about 1 4/8 pages, 1 card, estimated',
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
    expect(reading).toEqual({ order: [], beats: [], runs: [], setups: [], payoffs: {}, later: [], paidBy: [], open: [], proposed: [], openLines: [], openFields: [], versions: [], openPeople: [], wired: { linked: 0, of: 0 }, aside: [], threads: [], findings: [], left: [] });
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
      '2 cards have no arrow in or out: "Scene s3", "Scene s4". What comes before them in the story, and what after?',
    );

    const single = run(twoArrows, { type: "create_arrow", from: "s2", to: "s3" });
    const one = readWall(single).findings.filter((f) => f.kind === "unlinked");
    expect(one[0].text).toBe(
      'One card has no arrow in or out: "Scene s4". What comes before it in the story, and what after?',
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

  it("asks which scene pays off a fold's promise once the named board holds cards, and stops when one claims it (R58)", () => {
    const base = run(
      wall({ id: "b1", rank: "beat", headline: "The ledger" }, { id: "s1" }, { id: "b2", rank: "beat" }),
      { type: "set_plant", ids: ["b1"], plants: true },
      { type: "set_payoff_board", ids: ["b1"], boardId: "ep2" },
    );
    // A promise alone is quiet, as R50 made it — and stays quiet while the board is empty.
    expect(readWall(base).findings.filter((f) => f.kind === "unpaid")).toEqual([]);
    expect(readWall(base, { laterBoards: { ep2: { name: "Certified", cards: 0, noteIds: [] } } }).findings.filter((f) => f.kind === "unpaid")).toEqual([]);
    // Cards on that board and no claim: the wall asks which.
    const held = { ep2: { name: "Certified", cards: 2, noteIds: ["e1", "e2"] } };
    expect(readWall(base, { laterBoards: held }).findings.filter((f) => f.kind === "unpaid")).toEqual([
      { kind: "unpaid", ids: ["b1"], text: '"The ledger" pays off later, on "Certified", but no scene there claims it yet. Which one?' },
    ]);
    // A claimed scene answers it; a claim on a scene that is gone is a promise again.
    const claimed = run(base, { type: "set_payoff_board", ids: ["b1"], boardId: "ep2", noteId: "e2" });
    expect(readWall(claimed, { laterBoards: held }).findings.filter((f) => f.kind === "unpaid")).toEqual([]);
    expect(readWall(claimed, { laterBoards: held }).later).toEqual([{ id: "b1", boardId: "ep2", noteId: "e2" }]);
    const gone = { ep2: { name: "Certified", cards: 1, noteIds: ["e1"] } };
    expect(readWall(claimed, { laterBoards: gone }).later).toEqual([{ id: "b1", boardId: "ep2", noteId: null }]);
    expect(readWall(claimed, { laterBoards: gone }).findings.filter((f) => f.kind === "unpaid")).toHaveLength(1);
  });

  it("lists the folds of other boards that land on cards here, and only those on cards that exist (R58)", () => {
    const state = wall({ id: "e1", rank: "beat" }, { id: "e2" });
    const landing = { fromBoardId: "pilot", fromBoardName: "Pilot", fromNoteId: "p1", fromHeadline: "The ledger", fromColor: "yellow" };
    const reading = readWall(state, { paidBy: [{ id: "e2", ...landing }, { id: "ghost", ...landing }] });
    expect(reading.paidBy).toEqual([{ id: "e2", ...landing }]);
    expect(readWall(state).paidBy).toEqual([]);
  });

  it("asks about a setup arrow leaving a card that is not folded — a payoff with no fold (round seventeen, entry 12)", () => {
    const state = run(
      wall({ id: "b1", rank: "beat", headline: "The key" }, { id: "s1" }, { id: "b2", rank: "beat", headline: "The key is used" }),
      { type: "create_arrow", from: "b1", to: "b2", kind: "setup" },
    );
    expect(readWall(state).findings.filter((f) => f.kind === "unplanted")).toEqual([
      { kind: "unplanted", ids: [state.arrows[0].id, "b1"], text: '"The key" pays off at "The key is used" by a setup arrow, but its corner is not folded. Fold it, or is the arrow wrong?' },
    ]);
    const folded = run(state, { type: "set_plant", ids: ["b1"], plants: true });
    expect(readWall(folded).findings.filter((f) => f.kind === "unplanted")).toEqual([]);
  });

  it("asks about a card with nobody in it once the wall has a cast (round seventeen, entry 28)", () => {
    const state = run(
      wall({ id: "b1", rank: "beat", headline: "The shed at night" }, { id: "s1", headline: "The morning after" }),
      { type: "add_character", name: "Con" },
    );
    const withCon = run(state, { type: "set_cast", ids: ["s1"], characterIds: [state.characters[0].id] });
    expect(readWall(withCon).findings.filter((f) => f.kind === "nobody")).toEqual([
      { kind: "nobody", ids: ["b1"], text: '"The shed at night" has nobody in it. Who is in the scene?' },
    ]);
    // A wall with no cast yet is not asked: there is nobody to be in anything.
    expect(readWall(wall({ id: "a" }, { id: "b" })).findings.filter((f) => f.kind === "nobody")).toEqual([]);
  });

  it("lists open cards by the writer's word and asks nothing else of them (R59)", () => {
    const state = run(
      wall({ id: "b1", rank: "beat", headline: "The letter" }, { id: "s1", headline: "Declan" }, { id: "b2", rank: "beat", headline: "The bucket" }),
      { type: "set_location", ids: ["b1"], location: "the allotments" },
      { type: "set_location", ids: ["b2"], location: "the flat" },
      { type: "create_arrow", from: "b1", to: "b2" },
      { type: "add_character", name: "Con" },
    );
    // Declan's card has no place, no arrow and nobody in it: three questions.
    const before = readWall(state).findings.filter((f) => f.ids.includes("s1")).map((f) => f.kind);
    expect(before).toEqual(expect.arrayContaining(["unplaced", "unlinked", "nobody"]));
    const opened = run(state, { type: "set_open", ids: ["s1"], open: "where, and whether Ruth is there" });
    const reading = readWall(opened);
    expect(reading.open).toHaveLength(1);
    expect(reading.open[0]).toMatchObject({ id: "s1", words: "where, and whether Ruth is there" });
    // What the words hide (round eighteen, entry 27): the questions the card would be asked if closed.
    expect(reading.open[0].hides).toEqual(expect.arrayContaining(["unplaced", "unlinked", "nobody"]));
    expect(reading.findings.filter((f) => f.ids.includes("s1"))).toEqual([]);
    // Closed, the questions come back on their own.
    const closed = run(opened, { type: "set_open", ids: ["s1"], open: "" });
    expect(readWall(closed).open).toEqual([]);
    expect(readWall(closed).findings.filter((f) => f.ids.includes("s1")).length).toBeGreaterThan(0);
  });

  it("never mutates the state it reads", () => {
    const state = wall({ id: "b1", rank: "beat" }, { id: "s1" }, { id: "b2", rank: "beat" });
    const snapshot = JSON.stringify(state);
    readWall(state);
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe("two headings that differ only by a time word (round fifteen, entry 12)", () => {
  it("reads a leading day phrase as the when, not the scene's words, and a time word inside the headline as the scene's", () => {
    // "Day three. The pier" and "Day four. The pier" are one scene twice: the day is the guide's old convention for when.
    const days = wall({ id: "a", headline: "Day three. The pier at Fenit" }, { id: "b", headline: "Day four. The pier at Fenit" });
    expect(readWall(days).findings.some((finding) => finding.kind === "duplicate")).toBe(true);
    // "The pier at night" and "The pier at dawn" are two scenes: the time is part of what the scene is.
    const times = wall({ id: "a", headline: "The pier at night" }, { id: "b", headline: "The pier at dawn" });
    expect(readWall(times).findings.some((finding) => finding.kind === "duplicate")).toBe(false);
  });
});

describe("round twenty: the cast's names are not a scene's words, and a setup arrow does not link a card", () => {
  it("does not read two scenes with the same people as one scene (entry 15)", () => {
    const state = run(
      wall({ id: "a", headline: "Con gives Ruth the only key to the shed" }, { id: "b", headline: "Con gives Ruth his tools" }),
      { type: "add_character", id: "con", name: "Con Brady" },
      { type: "add_character", id: "ruth", name: "Ruth Kane" },
    );
    expect(readWall(state).findings.filter((finding) => finding.kind === "duplicate")).toEqual([]);
    // Without a cast the names are words like any other, and the check still fires on two headlines alike.
    const nameless = wall({ id: "a", headline: "Con gives Ruth the key" }, { id: "b", headline: "Con gives Ruth the key" });
    expect(readWall(nameless).findings.some((finding) => finding.kind === "duplicate")).toBe(true);
  });

  it("asks what comes before and after a card touched only by a setup arrow (entry 25)", () => {
    const state = run(
      wall({ id: "a", headline: "A" }, { id: "b", headline: "B" }, { id: "c", headline: "C" }, { id: "d", headline: "D" }),
      { type: "create_arrow", from: "a", to: "b", kind: "follows" },
      { type: "create_arrow", from: "b", to: "c", kind: "follows" },
      { type: "create_arrow", from: "a", to: "d", kind: "setup" },
    );
    const unlinked = readWall(state).findings.find((finding) => finding.kind === "unlinked");
    expect(unlinked?.ids).toEqual(["d"]);
  });
});

describe("what the fold plants (R62): the question and the setup in the writer's words", () => {
  it("asks where the named thing comes back, and names it on the setup line", () => {
    const state = run(
      wall({ id: "a", headline: "The first morning" }, { id: "b", headline: "Con gives Ruth his tools" }),
      { type: "set_plant", ids: ["a"], what: "the wrong tools" },
    );
    expect(readWall(state).findings.find((finding) => finding.kind === "unpaid")?.text).toBe('"The first morning" plants the wrong tools, and no arrow pays it off. Where do the wrong tools come back?');
    const bare = run(state, { type: "set_plant", ids: ["a"], what: "" });
    expect(readWall(bare).findings.find((finding) => finding.kind === "unpaid")?.text).toBe('"The first morning" plants something, and no arrow pays it off. Where does it come back?');
    const paid = run(state, { type: "create_arrow", from: "a", to: "b", kind: "setup" });
    expect(describeSetups(readWall(paid), paid)[0]).toContain('"The first morning" sets up "Con gives Ruth his tools" — the wrong tools,');
  });
});

describe("two versions of one scene (R65): listed, never asked", () => {
  it("lists the pair in story order and asks nothing of the version", () => {
    const state = run(
      wall({ id: "a", headline: "The balcony" }, { id: "b", headline: "Con dies" }),
      { type: "set_alternative", id: "b", of: "a" },
    );
    const reading = readWall(state);
    expect(reading.versions).toEqual([{ id: "a", alternatives: ["b"] }]);
    expect(reading.order).toEqual(["a"]);
    expect(reading.findings.every((finding) => !finding.ids.includes("b"))).toBe(true);
  });
});

describe("open fields (R61's edge): a card's place, listed and not asked", () => {
  it("lists an open place and leaves that card out of the unplaced question", () => {
    const state = run(
      wall({ id: "a", headline: "The first morning" }, { id: "b", headline: "She tells him" }, { id: "c", headline: "The key" }),
      { type: "set_location", ids: ["a"], location: "the allotments" },
      { type: "set_location", ids: ["b"], open: "where it happens" },
    );
    const reading = readWall(state);
    expect(reading.openFields).toEqual([{ field: "location", id: "b", words: "where it happens" }]);
    const unplaced = reading.findings.find((finding) => finding.kind === "unplaced");
    expect(unplaced?.ids).toEqual(["c"]);
  });
});

describe("open fields (R61): the logline and a card's when, in the writer's words", () => {
  it("lists them in story order and asks nothing about them", () => {
    const state = run(
      wall({ id: "a", headline: "The first morning" }, { id: "b", headline: "The key" }),
      { type: "set_logline", open: "two candidates, not chosen" },
      { type: "set_when", ids: ["b"], open: "after the break-in; which day" },
    );
    const reading = readWall(state);
    expect(reading.openFields).toEqual([
      { field: "logline", words: "two candidates, not chosen" },
      { field: "when", id: "b", words: "after the break-in; which day" },
    ]);
    expect(reading.open).toEqual([]);
    expect(readWall(run(state, { type: "set_logline", logline: "A question." }, { type: "set_when", ids: ["b"], when: "night" })).openFields).toEqual([]);
  });
});

describe("threads (R60): a loose end is asked about from that end", () => {
  it("asks a loose end even when its card is open, and never lists loose among what the open words hide (round nineteen, entry 23)", () => {
    const state = run(
      wall({ id: "a", headline: "The first morning" }, { id: "c", headline: "Ruth keeps the crowns in a bucket" }),
      { type: "create_thread", id: "bucket", name: "the bucket", noteIds: ["c"], startOpen: true },
      { type: "set_open", ids: ["c"], open: "when" },
    );
    const reading = readWall(state);
    expect(reading.findings.filter((finding) => finding.kind === "loose")).toHaveLength(1);
    expect(reading.open).toHaveLength(1);
    expect(reading.open[0].hides).not.toContain("loose");
  });

  it("lists threads with their cards in story order and asks where a thread is first seen, or where it comes out", () => {
    const state = run(
      wall({ id: "a", headline: "The first morning" }, { id: "b", headline: "The break-in" }, { id: "c", headline: "The last harvest" }),
      { type: "create_thread", id: "bucket", name: "the bucket", noteIds: ["c"], startOpen: true },
      { type: "create_thread", id: "declan", name: "Declan", noteIds: ["b", "a"], endOpen: true },
      { type: "create_thread", id: "key", name: "the key", noteIds: [] },
      { type: "create_thread", id: "tools", name: "the tools", noteIds: ["a", "c"] },
    );
    const reading = readWall(state);
    expect(reading.threads).toEqual([
      { id: "bucket", name: "the bucket", ids: ["c"], startOpen: true, endOpen: false, apart: 0 },
      { id: "declan", name: "Declan", ids: ["a", "b"], startOpen: false, endOpen: true, apart: 8 },
      { id: "key", name: "the key", ids: [], startOpen: false, endOpen: false, apart: 0 },
      { id: "tools", name: "the tools", ids: ["a", "c"], startOpen: false, endOpen: false, apart: 16 },
    ]);
    expect(reading.findings.filter((finding) => finding.kind === "loose")).toEqual([
      { kind: "loose", ids: ["bucket", "c"], text: '"the bucket" starts nowhere yet: it runs to "The last harvest". Where is it first seen?' },
      { kind: "loose", ids: ["declan", "b"], text: '"Declan" ends nowhere yet: it runs through "The first morning", "The break-in". Where does it come out?' },
      { kind: "loose", ids: ["key"], text: '"the key" runs through no card yet. Where is it first seen, and where does it come out?' },
    ]);
    const tied = run(state, { type: "update_thread", id: "bucket", add: ["a"], startOpen: false });
    expect(readWall(tied).findings.filter((finding) => finding.ids.includes("bucket"))).toEqual([]);
    expect(readWall(tied).threads[0].ids).toEqual(["a", "c"]);
  });

  it("asks once about a thread with neither end tied", () => {
    const state = run(wall({ id: "a", headline: "The morning after" }), { type: "create_thread", id: "key", name: "the key", noteIds: ["a"], startOpen: true, endOpen: true });
    expect(readWall(state).findings.filter((finding) => finding.kind === "loose")).toEqual([
      { kind: "loose", ids: ["key", "a"], text: '"the key" runs through "The morning after" and neither end is tied. Where is it first seen, and where does it come out?' },
    ]);
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
    expect(reading.later).toEqual([{ id: key.id, boardId: "ep2", noteId: null }]);
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

describe("beats back to back are asked even when both beats are open (round nineteen, entry 28)", () => {
  it("keeps the run's question and never lists it among what the open words hide", () => {
    const state = run(
      wall({ id: "a", rank: "beat", headline: "The key" }, { id: "b", rank: "beat", headline: "She tells him" }),
      { type: "create_arrow", from: "a", to: "b", kind: "follows" },
      { type: "set_open", ids: ["a", "b"], open: "where and when" },
    );
    const reading = readWall(state);
    const empty = reading.findings.filter((finding) => finding.kind === "empty");
    expect(empty).toHaveLength(1);
    expect(empty[0].ids).toEqual(["a", "b"]);
    expect(reading.open.map((card) => card.hides)).toEqual([[], []]);
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

describe("a person who may or may not be in a scene (round twenty-two, H9)", () => {
  // 12 pages. Tom is in the first page and the last; the middle beat is where he may be.
  const base = () =>
    run(
      wall(
        { id: "b1", rank: "beat", headline: "Tom arrives" },
        { id: "s1", pages: 4 },
        { id: "b2", rank: "beat", pages: 2, headline: "The depot" },
        { id: "s2", pages: 4 },
        { id: "b3", rank: "beat", headline: "Tom returns" },
      ),
      { type: "add_character", id: "t", name: "Tom" },
      { type: "add_character", id: "m", name: "Maya" },
      { type: "set_cast", ids: ["b1", "b3"], characterIds: ["t"] },
      { type: "set_cast", ids: ["s1", "s2"], characterIds: ["m"] },
      { type: "set_cast", ids: ["b2"], characterIds: [], maybeCharacterIds: ["t"] },
    );

  it("is listed under open in the writer's terms, and the card is not asked who is in it", () => {
    const reading = readWall(base());
    expect(reading.openFields).toContainEqual({ field: "cast", id: "b2", words: "whether Tom is in it" });
    expect(reading.findings.filter((f) => f.kind === "nobody")).toEqual([]);
    const undecided = describeUndecided(base(), reading);
    expect(undecided.open).toContain('  - "The depot" — whether Tom is in it');
    expect(undecided.blank.join("\n")).not.toContain("nobody in it");
  });

  it("is counted neither way: the absence is still asked, and says the scene that would answer it", () => {
    const absent = readWall(base()).findings.filter((f) => f.kind === "absent");
    expect(absent).toHaveLength(1);
    expect(absent[0].ids).toEqual(["t", "b1", "b3"]);
    expect(absent[0].text).toBe(
      'Tom is in "Tom arrives" and then not again until "Tom returns", about 10 pages later — unless they are in "The depot", which is not decided. Where are they in between?',
    );
  });

  it("does not ask where someone comes in when the only card they are on is a maybe", () => {
    const state = run(base(), { type: "add_character", id: "n", name: "Ngozi" }, { type: "set_cast", ids: ["b2"], characterIds: [], maybeCharacterIds: ["t", "n"] });
    const reading = readWall(state);
    expect(reading.findings.filter((f) => f.kind === "uncast")).toEqual([]);
    expect(reading.openFields).toContainEqual({ field: "cast", id: "b2", words: "whether Tom and Ngozi are in it" });
  });
});

describe("a person who is only in a scene the writer cut (round twenty-three, entry 19)", () => {
  it("is not asked where they come in: the card set aside is where, if it ever comes back", () => {
    let state = run(
      wall({ id: "a", rank: "beat" }, { id: "cut", headline: "At the audiologist's" }),
      { type: "add_character", id: "ada", name: "Ada" },
      { type: "add_character", id: "aud", name: "The audiologist" },
      { type: "set_cast", ids: ["a"], characterIds: ["ada"] },
      { type: "set_cast", ids: ["cut"], characterIds: ["ada", "aud"] },
    );
    expect(readWall(state).findings.filter((f) => f.kind === "uncast")).toEqual([]);
    state = run(state, { type: "set_aside", ids: ["cut"], aside: true });
    expect(readWall(state).findings.filter((f) => f.kind === "uncast")).toEqual([]);
    // Someone on no card at all is still asked about.
    state = run(state, { type: "add_character", id: "n", name: "Ngozi" });
    expect(readWall(state).findings.filter((f) => f.kind === "uncast").map((f) => f.ids)).toEqual([["n"]]);
  });
});

describe("what is open on a card not in the film (round twenty-three, entries 37, 40)", () => {
  it("is listed, marked, and counted: a card set aside and a version behind", () => {
    const state = run(
      wall({ id: "pub", rank: "beat", headline: "The pub, alone" }, { id: "pub2", headline: "The pub, with Callum" }, { id: "cut", headline: "At the audiologist's" }),
      { type: "add_character", id: "n", name: "Ngozi" },
      { type: "set_cast", ids: ["pub2"], characterIds: [], maybeCharacterIds: ["n"] },
      { type: "update_note", id: "pub2", changeOpen: "I don't know what changes yet" },
      { type: "set_alternative", id: "pub2", of: "pub" },
      { type: "set_location", ids: ["cut"], location: "", open: "I don't know yet" },
      { type: "set_aside", ids: ["cut"], aside: true },
    );
    const undecided = describeUndecided(state, readWall(state));
    expect(undecided.open).toContain('  - "The pub, with Callum" (a version behind, not chosen) — the change line: I don\'t know what changes yet; whether Ngozi is in it');
    expect(undecided.open).toContain('  - "At the audiologist\'s" (set aside) — where: I don\'t know yet');
    expect(openOutsideFilm(state)).toBe(3);
  });
});

describe("who is in a scene, left open by the writer's word (round twenty-three, entries 13, 14)", () => {
  it("is listed in the writer's words and the card is not asked who is in it", () => {
    const state = run(
      wall({ id: "a", rank: "beat", headline: "The school hall" }, { id: "j", headline: "The job centre" }),
      { type: "add_character", id: "ada", name: "Ada" },
      { type: "set_cast", ids: ["a"], characterIds: ["ada"], open: "anyone else: I don't know" },
      { type: "set_cast", ids: ["j"], characterIds: [], open: "I don't know yet" },
    );
    const reading = readWall(state);
    expect(reading.findings.filter((f) => f.kind === "nobody")).toEqual([]);
    const undecided = describeUndecided(state, reading);
    expect(undecided.open).toContain('  - "The school hall" — who else is in it: anyone else: I don\'t know');
    expect(undecided.open).toContain('  - "The job centre" — who is in it: I don\'t know yet');
    expect(undecided.blank.join("\n")).not.toContain("nobody in it");
    // Without the words the card is asked, as before.
    const bare = run(state, { type: "set_cast", ids: ["j"], characterIds: [], open: "" });
    expect(readWall(bare).findings.filter((f) => f.kind === "nobody")).toHaveLength(1);
  });
});

describe("what is not decided about the film itself (round twenty-three, entries 15, 16)", () => {
  it("is listed with what is open, before any card, and asks nothing", () => {
    const state = run(wall({ id: "a", rank: "beat" }), { type: "add_open_line", text: "Whether it has acts, and where they break." });
    const before = readWall(wall({ id: "a", rank: "beat" }));
    const reading = readWall(state);
    expect(reading.openLines).toEqual(["Whether it has acts, and where they break."]);
    expect(reading.findings).toEqual(before.findings);
    expect(describeUndecided(state, reading).open[0]).toBe("  - about the film — Whether it has acts, and where they break.");
  });
});
