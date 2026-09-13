import { describe, expect, it } from "vitest";
import {
  applyCommand,
  boardEighths,
  countRanks,
  DEFAULT_NOTE_EIGHTHS,
  DEFAULT_TARGET_EIGHTHS,
  EIGHTHS_PER_PAGE,
  emptyState,
  formatPages,
  isBoardState,
  NOTE_HEIGHT,
  NOTE_WIDTH,
  normalizeState,
  seedState,
  type BoardState,
  type Command,
} from "./reducer";

const NOW = "2026-01-01T00:00:00.000Z";

function run(state: BoardState, ...commands: Command[]) {
  return commands.reduce((current, command) => {
    return applyCommand(current, command, NOW).state;
  }, state);
}

function boardOf(...positions: Array<{ id: string; x: number; y: number }>) {
  return positions.reduce(
    (state, spot) =>
      applyCommand(
        state,
        { type: "create_note", id: spot.id, x: spot.x, y: spot.y },
        NOW,
      ).state,
    emptyState(),
  );
}

describe("create_note", () => {
  it("fills in defaults and stacks each new card on top", () => {
    const first = applyCommand(emptyState(), { type: "create_note" }, NOW);
    const second = applyCommand(first.state, { type: "create_note" }, NOW);

    expect(first.state.notes).toHaveLength(1);
    expect(first.state.notes[0].headline).toBe("New beat");
    expect(first.state.notes[0].change).toBe("What changes?");
    expect(first.state.notes[0].z).toBe(1);
    expect(second.state.notes[1].z).toBe(2);
  });

  it("cycles through the paper colors so a fresh board is not monochrome", () => {
    let state = emptyState();
    for (let i = 0; i < 6; i += 1) {
      state = applyCommand(state, { type: "create_note" }, NOW).state;
    }
    expect(state.notes.map((note) => note.color)).toEqual([
      "yellow",
      "pink",
      "blue",
      "green",
      "orange",
      "yellow",
    ]);
  });

  it("honors an explicit id, text, color and position", () => {
    const { state, result } = applyCommand(
      emptyState(),
      {
        type: "create_note",
        id: "beat-1",
        headline: "Maya finds the letter",
        change: "She decides not to tell Tom.",
        color: "blue",
        x: 400,
        y: 250,
      },
      NOW,
    );

    expect(result).toMatchObject({ id: "beat-1", color: "blue", x: 400, y: 250 });
    expect(state.notes[0].headline).toBe("Maya finds the letter");
    expect(state.notes[0].createdAt).toBe(NOW);
  });
});

describe("update_note", () => {
  it("patches only the fields given and bumps updatedAt", () => {
    const start = boardOf({ id: "a", x: 0, y: 0 });
    const { state, changed } = applyCommand(
      start,
      { type: "update_note", id: "a", headline: "Tom lies" },
      "2026-02-02T00:00:00.000Z",
    );

    expect(changed).toBe(true);
    expect(state.notes[0].headline).toBe("Tom lies");
    expect(state.notes[0].change).toBe("What changes?");
    expect(state.notes[0].updatedAt).toBe("2026-02-02T00:00:00.000Z");
  });

  it("allows clearing a field to an empty string", () => {
    const start = boardOf({ id: "a", x: 0, y: 0 });
    const { state } = applyCommand(start, { type: "update_note", id: "a", change: "" }, NOW);
    expect(state.notes[0].change).toBe("");
  });
});

describe("move and nudge", () => {
  it("moves one card to an absolute position", () => {
    const start = boardOf({ id: "a", x: 0, y: 0 });
    const { state } = applyCommand(start, { type: "move_note", id: "a", x: 320, y: 480 }, NOW);
    expect(state.notes[0]).toMatchObject({ x: 320, y: 480 });
  });

  it("nudges a selection by a delta and leaves everything else alone", () => {
    const start = boardOf(
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 100, y: 100 },
      { id: "c", x: 200, y: 200 },
    );
    const { state } = applyCommand(
      start,
      { type: "nudge_notes", ids: ["a", "c"], dx: 10, dy: -5 },
      NOW,
    );

    expect(state.notes.map((n) => [n.x, n.y])).toEqual([
      [10, -5],
      [100, 100],
      [210, 195],
    ]);
  });
});

describe("recolor_notes", () => {
  it("paints every selected card in one command", () => {
    const start = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 10, y: 10 }, { id: "c", x: 20, y: 20 });
    const { state, result } = applyCommand(
      start,
      { type: "recolor_notes", ids: ["a", "c"], color: "green" },
      NOW,
    );

    expect(state.notes.map((n) => n.color)).toEqual(["green", "pink", "green"]);
    expect(result).toHaveLength(2);
  });
});

describe("raise_note", () => {
  it("lifts a card above every other card", () => {
    const start = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 10, y: 10 }, { id: "c", x: 20, y: 20 });
    const { state } = applyCommand(start, { type: "raise_note", id: "a" }, NOW);
    const byId = Object.fromEntries(state.notes.map((n) => [n.id, n.z]));
    expect(byId.a).toBeGreaterThan(byId.b);
    expect(byId.a).toBeGreaterThan(byId.c);
  });
});

describe("delete_note", () => {
  it("takes the card's arrows with it", () => {
    let state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 }, { id: "c", x: 800, y: 0 });
    state = run(
      state,
      { type: "create_arrow", from: "a", to: "b" },
      { type: "create_arrow", from: "b", to: "c" },
    );
    expect(state.arrows).toHaveLength(2);

    const after = applyCommand(state, { type: "delete_note", id: "b" }, NOW).state;
    expect(after.notes.map((n) => n.id)).toEqual(["a", "c"]);
    expect(after.arrows).toHaveLength(0);
  });

  it("drops the card from its group, and dissolves a group left with one card", () => {
    let state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 220, y: 0 }, { id: "c", x: 440, y: 0 });
    state = run(state, { type: "create_group", noteIds: ["a", "b", "c"] });
    expect(state.groups[0].noteIds).toHaveLength(3);

    const two = applyCommand(state, { type: "delete_note", id: "c" }, NOW).state;
    expect(two.groups[0].noteIds).toEqual(["a", "b"]);

    const one = applyCommand(two, { type: "delete_note", id: "b" }, NOW).state;
    expect(one.groups).toHaveLength(0);
  });
});

describe("arrows", () => {
  it("refuses to point a card at itself", () => {
    const state = boardOf({ id: "a", x: 0, y: 0 });
    const { changed } = applyCommand(state, { type: "create_arrow", from: "a", to: "a" }, NOW);
    expect(changed).toBe(false);
  });

  it("refuses to connect a card that does not exist", () => {
    const state = boardOf({ id: "a", x: 0, y: 0 });
    expect(applyCommand(state, { type: "create_arrow", from: "a", to: "ghost" }, NOW).changed).toBe(
      false,
    );
    expect(applyCommand(state, { type: "create_arrow", from: "ghost", to: "a" }, NOW).changed).toBe(
      false,
    );
  });

  it("ignores a duplicate arrow in the same direction", () => {
    let state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 });
    state = run(state, { type: "create_arrow", from: "a", to: "b" });
    const again = applyCommand(state, { type: "create_arrow", from: "a", to: "b" }, NOW);
    expect(again.changed).toBe(false);
    expect(again.state.arrows).toHaveLength(1);
  });

  it("keeps A->B and B->A as two separate arrows", () => {
    let state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 });
    state = run(
      state,
      { type: "create_arrow", from: "a", to: "b" },
      { type: "create_arrow", from: "b", to: "a" },
    );

    expect(state.arrows).toHaveLength(2);
    expect(state.arrows.map((arrow) => `${arrow.from}->${arrow.to}`)).toEqual(["a->b", "b->a"]);
  });

  it("deletes one direction and leaves the other standing", () => {
    let state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 });
    state = run(
      state,
      { type: "create_arrow", from: "a", to: "b" },
      { type: "create_arrow", from: "b", to: "a" },
    );

    const doomed = state.arrows[0].id;
    const after = applyCommand(state, { type: "delete_arrow", id: doomed }, NOW).state;
    expect(after.arrows).toHaveLength(1);
    expect(after.arrows[0]).toMatchObject({ from: "b", to: "a" });
  });
});

describe("groups", () => {
  it("needs at least two real cards", () => {
    const state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 220, y: 0 });
    expect(applyCommand(state, { type: "create_group", noteIds: ["a"] }, NOW).changed).toBe(false);
    expect(
      applyCommand(state, { type: "create_group", noteIds: ["a", "ghost"] }, NOW).changed,
    ).toBe(false);
    expect(applyCommand(state, { type: "create_group", noteIds: ["a", "b"] }, NOW).changed).toBe(
      true,
    );
  });

  it("moves cards out of their old group when they join a new one", () => {
    let state = boardOf(
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 220, y: 0 },
      { id: "c", x: 440, y: 0 },
      { id: "d", x: 660, y: 0 },
    );
    state = run(state, { type: "create_group", noteIds: ["a", "b", "c"] });
    state = run(state, { type: "create_group", noteIds: ["c", "d"] });

    expect(state.groups).toHaveLength(2);
    expect(state.groups[0].noteIds).toEqual(["a", "b"]);
    expect(state.groups[1].noteIds).toEqual(["c", "d"]);
  });

  it("dissolves an old group that a new group leaves with one card", () => {
    let state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 220, y: 0 }, { id: "c", x: 440, y: 0 });
    state = run(state, { type: "create_group", noteIds: ["a", "b"] });
    state = run(state, { type: "create_group", noteIds: ["b", "c"] });

    expect(state.groups).toHaveLength(1);
    expect(state.groups[0].noteIds).toEqual(["b", "c"]);
  });

  it("renames and ungroups", () => {
    let state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 220, y: 0 });
    state = run(state, { type: "create_group", noteIds: ["a", "b"] });
    const groupId = state.groups[0].id;

    expect(state.groups[0].title).toBe("Sequence");
    state = run(state, { type: "rename_group", id: groupId, title: "Act One" });
    expect(state.groups[0].title).toBe("Act One");

    state = run(state, { type: "ungroup", id: groupId });
    expect(state.groups).toHaveLength(0);
    expect(state.notes).toHaveLength(2);
  });
});

describe("settle_note", () => {
  function grouped() {
    let state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 220, y: 0 }, { id: "c", x: 440, y: 0 });
    state = run(state, { type: "create_group", noteIds: ["a", "b", "c"] });
    return state;
  }

  it("keeps a card in the group when it is dropped inside the frame", () => {
    let state = grouped();
    state = run(state, { type: "move_note", id: "a", x: 120, y: 40 });
    state = run(state, { type: "settle_note", id: "a" });
    expect(state.groups[0].noteIds).toEqual(["a", "b", "c"]);
  });

  it("drops a card out of the group when it is dragged well clear", () => {
    let state = grouped();
    state = run(state, { type: "move_note", id: "a", x: 2000, y: 2000 });
    state = run(state, { type: "settle_note", id: "a" });
    expect(state.groups[0].noteIds).toEqual(["b", "c"]);
  });

  it("dissolves the group when leaving would strand a single card", () => {
    let state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 220, y: 0 });
    state = run(state, { type: "create_group", noteIds: ["a", "b"] });
    state = run(state, { type: "move_note", id: "a", x: 3000, y: 3000 });
    state = run(state, { type: "settle_note", id: "a" });
    expect(state.groups).toHaveLength(0);
  });
});

describe("apply_poses", () => {
  it("repositions the cards it names and skips the rest", () => {
    const start = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 100, y: 100 });
    const { state } = applyCommand(
      start,
      { type: "apply_poses", poses: [{ id: "a", x: 500, y: 600, rotate: 0 }] },
      NOW,
    );

    expect(state.notes[0]).toMatchObject({ x: 500, y: 600, rotate: 0 });
    expect(state.notes[1]).toMatchObject({ x: 100, y: 100 });
  });
});

// The store feeds this reducer's output straight into useSyncExternalStore,
// which compares snapshots by reference. Returning a fresh object for a no-op
// would make React re-render forever, so every rejected command must hand the
// exact same state back.
describe("no-op commands return the identical state object", () => {
  const state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 });

  const noops: Array<[string, Command]> = [
    ["update_note on a missing card", { type: "update_note", id: "ghost", headline: "x" }],
    ["move_note on a missing card", { type: "move_note", id: "ghost", x: 1, y: 1 }],
    ["nudge_notes with no ids", { type: "nudge_notes", ids: [], dx: 5, dy: 5 }],
    ["recolor_notes with no ids", { type: "recolor_notes", ids: [], color: "blue" }],
    ["recolor_notes on missing cards", { type: "recolor_notes", ids: ["ghost"], color: "blue" }],
    ["raise_note on a missing card", { type: "raise_note", id: "ghost" }],
    ["delete_note on a missing card", { type: "delete_note", id: "ghost" }],
    ["apply_poses with no poses", { type: "apply_poses", poses: [] }],
    ["settle_note on a missing card", { type: "settle_note", id: "ghost" }],
    ["create_group with too few cards", { type: "create_group", noteIds: ["a"] }],
    ["ungroup on a missing group", { type: "ungroup", id: "ghost" }],
    ["rename_group on a missing group", { type: "rename_group", id: "ghost", title: "x" }],
    ["create_arrow onto itself", { type: "create_arrow", from: "a", to: "a" }],
    ["delete_arrow on a missing arrow", { type: "delete_arrow", id: "ghost" }],
    ["set_logline to the value it already has", { type: "set_logline", logline: "" }],
    ["set_rank with no ids", { type: "set_rank", ids: [], rank: "beat" }],
    ["set_rank on missing cards", { type: "set_rank", ids: ["ghost"], rank: "beat" }],
    ["set_rank to the rank a card already has", { type: "set_rank", ids: ["a"], rank: "scene" }],
    ["set_length with no ids", { type: "set_length", ids: [], lengthEighths: 16 }],
    ["set_length on missing cards", { type: "set_length", ids: ["ghost"], lengthEighths: 16 }],
    [
      "set_length to the length a card already has",
      { type: "set_length", ids: ["a"], lengthEighths: DEFAULT_NOTE_EIGHTHS },
    ],
    ["set_target to the target it already has", { type: "set_target", targetEighths: DEFAULT_TARGET_EIGHTHS }],
    ["an unknown command", { type: "not_a_command" } as unknown as Command],
  ];

  it.each(noops)("%s", (_label, command) => {
    const outcome = applyCommand(state, command, NOW);
    expect(outcome.changed).toBe(false);
    expect(outcome.state).toBe(state);
  });
});

describe("commands never mutate the state they are given", () => {
  it("leaves the previous snapshot untouched", () => {
    const start = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 });
    const before = structuredClone(start);

    run(
      start,
      { type: "create_note" },
      { type: "update_note", id: "a", headline: "changed" },
      { type: "move_note", id: "a", x: 999, y: 999 },
      { type: "create_arrow", from: "a", to: "b" },
      { type: "create_group", noteIds: ["a", "b"] },
      { type: "delete_note", id: "b" },
    );

    expect(start).toEqual(before);
  });
});

describe("set_rank", () => {
  const board = () => boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 });

  it("cards are born as scenes", () => {
    expect(board().notes.every((note) => note.rank === "scene")).toBe(true);
    expect(seedState(NOW).notes.every((note) => note.rank === "scene")).toBe(true);
  });

  it("marks a card as a beat", () => {
    const state = run(board(), { type: "set_rank", ids: ["a"], rank: "beat" });
    expect(state.notes.find((note) => note.id === "a")?.rank).toBe("beat");
    expect(state.notes.find((note) => note.id === "b")?.rank).toBe("scene");
  });

  it("marks several at once and reports which changed", () => {
    const outcome = applyCommand(
      board(),
      { type: "set_rank", ids: ["a", "b"], rank: "beat" },
      NOW,
    );
    expect(outcome.result).toHaveLength(2);
  });

  it("demotes a beat back to a scene", () => {
    const state = run(
      board(),
      { type: "set_rank", ids: ["a"], rank: "beat" },
      { type: "set_rank", ids: ["a"], rank: "scene" },
    );
    expect(state.notes.find((note) => note.id === "a")?.rank).toBe("scene");
  });

  // Rank is carried by the card, not by where it sits (D20).
  it("never moves the card it marks", () => {
    const start = board();
    const state = run(start, { type: "set_rank", ids: ["a", "b"], rank: "beat" });
    state.notes.forEach((note, i) => {
      expect(note.x).toBe(start.notes[i].x);
      expect(note.y).toBe(start.notes[i].y);
    });
  });

  it("ignores unknown ids and an unknown rank", () => {
    expect(
      applyCommand(board(), { type: "set_rank", ids: ["ghost"], rank: "beat" }, NOW).changed,
    ).toBe(false);
    const bent = run(board(), {
      type: "set_rank",
      ids: ["a"],
      rank: "turning-point" as unknown as "beat",
    });
    expect(bent.notes.find((note) => note.id === "a")?.rank).toBe("scene");
  });
});

describe("countRanks", () => {
  it("counts beats and scenes without judging the total", () => {
    const state = run(
      boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 }, { id: "c", x: 800, y: 0 }),
      { type: "set_rank", ids: ["a", "b"], rank: "beat" },
    );
    expect(countRanks(state)).toEqual({ beats: 2, scenes: 1 });
  });

  it("is zero on an empty board", () => {
    expect(countRanks(emptyState())).toEqual({ beats: 0, scenes: 0 });
  });
});

describe("set_length", () => {
  const board = () => boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 });

  it("gives a new card an ordinary page", () => {
    expect(board().notes[0].lengthEighths).toBe(DEFAULT_NOTE_EIGHTHS);
  });

  it("sizes a card in eighths", () => {
    const state = run(board(), { type: "set_length", ids: ["a"], lengthEighths: 20 });
    expect(state.notes.find((note) => note.id === "a")?.lengthEighths).toBe(20);
  });

  it("sizes a whole selection at once", () => {
    const outcome = applyCommand(
      board(),
      { type: "set_length", ids: ["a", "b"], lengthEighths: 4 },
      NOW,
    );
    expect(outcome.result).toHaveLength(2);
  });

  // Length is a property of the card, the same way rank is (D20).
  it("never moves the card it sizes", () => {
    const start = board();
    const state = run(start, { type: "set_length", ids: ["a", "b"], lengthEighths: 32 });
    state.notes.forEach((note, i) => {
      expect(note.x).toBe(start.notes[i].x);
      expect(note.y).toBe(start.notes[i].y);
    });
  });

  it("refuses nonsense lengths rather than storing them", () => {
    const zero = run(board(), { type: "set_length", ids: ["a"], lengthEighths: 0 });
    expect(zero.notes.find((note) => note.id === "a")?.lengthEighths).toBe(1);

    const negative = run(board(), { type: "set_length", ids: ["a"], lengthEighths: -5 });
    expect(negative.notes.find((note) => note.id === "a")?.lengthEighths).toBe(1);

    // A single card longer than a short film is a typo, not a scene.
    const absurd = run(board(), { type: "set_length", ids: ["a"], lengthEighths: 99999 });
    expect(absurd.notes.find((note) => note.id === "a")?.lengthEighths).toBe(30 * 8);

    const fractional = run(board(), { type: "set_length", ids: ["a"], lengthEighths: 6.4 });
    expect(fractional.notes.find((note) => note.id === "a")?.lengthEighths).toBe(6);
  });
});

describe("set_target", () => {
  it("starts a board at feature length", () => {
    expect(emptyState().targetEighths).toBe(120 * 8);
  });

  it("retargets for a half-hour", () => {
    const state = run(emptyState(), { type: "set_target", targetEighths: 30 * 8 });
    expect(state.targetEighths).toBe(240);
  });

  it("leaves the cards alone", () => {
    const start = seedState(NOW);
    const state = run(start, { type: "set_target", targetEighths: 240 });
    expect(state.notes).toBe(start.notes);
  });
});

describe("boardEighths", () => {
  it("adds the cards up", () => {
    const state = run(
      boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 }, { id: "c", x: 800, y: 0 }),
      { type: "set_length", ids: ["a"], lengthEighths: 24 },
      { type: "set_length", ids: ["b"], lengthEighths: 4 },
    );
    // three pages, half a page, and one default page
    expect(boardEighths(state)).toBe(24 + 4 + 8);
  });

  it("is zero on an empty board", () => {
    expect(boardEighths(emptyState())).toBe(0);
  });
});

// Written the way a breakdown writes them, because that is the notation the
// people who will read this number already use (D23).
describe("formatPages", () => {
  it.each([
    [8, "1"],
    [16, "2"],
    [4, "4/8"],
    [1, "1/8"],
    [12, "1 4/8"],
    [963, "120 3/8"],
    [0, "0"],
  ])("%i eighths reads as %s", (eighths, expected) => {
    expect(formatPages(eighths)).toBe(expected);
  });
});

describe("set_logline", () => {
  it("sets the central question", () => {
    const outcome = applyCommand(
      emptyState(),
      { type: "set_logline", logline: "Does telling the truth cost more than the lie?" },
      NOW,
    );
    expect(outcome.changed).toBe(true);
    expect(outcome.state.logline).toBe("Does telling the truth cost more than the lie?");
  });

  it("trims surrounding whitespace", () => {
    const state = run(emptyState(), { type: "set_logline", logline: "  What is it arguing?  " });
    expect(state.logline).toBe("What is it arguing?");
  });

  it("clears back to empty", () => {
    const state = run(
      emptyState(),
      { type: "set_logline", logline: "A question." },
      { type: "set_logline", logline: "" },
    );
    expect(state.logline).toBe("");
  });

  it("leaves the cards alone", () => {
    const start = seedState(NOW);
    const state = run(start, { type: "set_logline", logline: "A question." });
    expect(state.notes).toBe(start.notes);
    expect(state.groups).toBe(start.groups);
    expect(state.arrows).toBe(start.arrows);
  });

  it("survives a round trip through the other commands", () => {
    const state = run(
      emptyState(),
      { type: "set_logline", logline: "A question." },
      { type: "create_note", id: "a" },
      { type: "create_note", id: "b" },
      { type: "create_arrow", from: "a", to: "b" },
      { type: "delete_note", id: "b" },
    );
    expect(state.logline).toBe("A question.");
  });
});

// R19 added the first board-level field. Boards written before it must still
// open — rejecting one would lose somebody's wall.
describe("normalizeState", () => {
  it("gives a pre-logline board an empty one", () => {
    const old = { notes: [], groups: [], arrows: [] };
    expect(isBoardState(old)).toBe(true);
    expect(normalizeState(old).logline).toBe("");
  });

  it("keeps every card, group and arrow of an old board", () => {
    const { logline: _drop, ...old } = seedState(NOW);
    const normalized = normalizeState(old);
    expect(normalized.notes).toEqual(seedState(NOW).notes);
    expect(normalized.groups).toEqual([]);
    expect(normalized.arrows).toEqual([]);
  });

  it("repairs a logline of the wrong type rather than rejecting the board", () => {
    const bent = { logline: 42, notes: [], groups: [], arrows: [] };
    expect(normalizeState(bent).logline).toBe("");
  });

  it("returns the same object when nothing needed filling in", () => {
    const state = seedState(NOW);
    expect(normalizeState(state)).toBe(state);
  });

  // R20 added rank the same way. A card written before it is a scene: a beat is
  // something you mark deliberately, so the default must claim nothing.
  it("gives pre-rank cards the scene rank", () => {
    const old = {
      logline: "",
      notes: seedState(NOW).notes.map(({ rank: _drop, ...note }) => note),
      groups: [],
      arrows: [],
    };
    const normalized = normalizeState(old);
    expect(normalized.notes.every((note) => note.rank === "scene")).toBe(true);
    expect(normalized.notes).toHaveLength(3);
  });

  it("repairs a rank of the wrong type without touching a good one", () => {
    const bent = {
      logline: "",
      notes: [
        { id: "a", rank: "turning-point" },
        { id: "b", rank: "beat" },
        { id: "c" },
      ],
      groups: [],
      arrows: [],
    };
    expect(normalizeState(bent).notes.map((note) => note.rank)).toEqual([
      "scene",
      "beat",
      "scene",
    ]);
  });

  it("leaves everything else on a card alone while filling rank in", () => {
    const { rank: _drop, ...note } = seedState(NOW).notes[0];
    const normalized = normalizeState({ logline: "", notes: [note], groups: [], arrows: [] });
    // The board handed in has no roster, so the seed card's cast id names
    // nobody and is dropped (R29). Everything else survives untouched.
    expect(normalized.notes[0]).toEqual({ ...note, rank: "scene", characterIds: [] });
  });

  // R25 added length the same way. An unsized card is an ordinary page, which
  // is what an index card has always silently meant.
  it("gives pre-length cards an ordinary page", () => {
    const old = {
      logline: "",
      notes: seedState(NOW).notes.map(({ lengthEighths: _drop, ...note }) => note),
      groups: [],
      arrows: [],
    };
    const normalized = normalizeState(old);
    expect(normalized.notes.every((note) => note.lengthEighths === DEFAULT_NOTE_EIGHTHS)).toBe(
      true,
    );
  });

  it("gives a pre-target board a feature-length target", () => {
    const { targetEighths: _drop, ...old } = seedState(NOW);
    expect(normalizeState(old).targetEighths).toBe(DEFAULT_TARGET_EIGHTHS);
  });

  it("repairs a length of the wrong type or an impossible size", () => {
    const bent = {
      logline: "",
      notes: [
        { id: "a", rank: "scene", lengthEighths: "two pages" },
        { id: "b", rank: "scene", lengthEighths: -4 },
        { id: "c", rank: "scene", lengthEighths: 12 },
      ],
      groups: [],
      arrows: [],
    };
    expect(normalizeState(bent).notes.map((note) => note.lengthEighths)).toEqual([8, 1, 12]);
  });

  // A board that opened yesterday has to open today, whichever field was added.
  it("opens a board written before any of the three fields existed", () => {
    const ancient = {
      notes: seedState(NOW).notes.map(
        ({ rank: _r, lengthEighths: _l, ...note }) => note,
      ),
      groups: [],
      arrows: [],
    };
    expect(isBoardState(ancient)).toBe(true);
    const normalized = normalizeState(ancient);
    expect(normalized.logline).toBe("");
    expect(normalized.targetEighths).toBe(DEFAULT_TARGET_EIGHTHS);
    expect(normalized.notes.every((note) => note.rank === "scene")).toBe(true);
    expect(normalized.notes.every((note) => note.lengthEighths === DEFAULT_NOTE_EIGHTHS)).toBe(
      true,
    );
    // and the words survive the trip, which is the only part that matters
    expect(normalized.notes.map((note) => note.headline)).toEqual(
      seedState(NOW).notes.map((note) => note.headline),
    );
  });

  it("falls back to an empty board for junk", () => {
    expect(normalizeState(null).notes).toEqual([]);
    expect(normalizeState({ notes: [] }).logline).toBe("");
  });
});

describe("state helpers", () => {
  it("recognizes a real board and rejects junk", () => {
    expect(isBoardState(emptyState())).toBe(true);
    expect(isBoardState(seedState(NOW))).toBe(true);
    expect(isBoardState(null)).toBe(false);
    expect(isBoardState("board")).toBe(false);
    expect(isBoardState({ notes: [], groups: [] })).toBe(false);
  });

  it("seeds three beats with stable ids", () => {
    const seeded = seedState(NOW);
    expect(seeded.notes.map((note) => note.id)).toEqual([
      "maya-letter",
      "tom-lies",
      "letter-aloud",
    ]);
    expect(seeded.groups).toHaveLength(0);
    expect(seeded.arrows).toHaveLength(0);
  });

  it("agrees with the card size the layout helpers assume", () => {
    expect(NOTE_WIDTH).toBe(192);
    expect(NOTE_HEIGHT).toBe(192);
  });
});

describe("characters (R29)", () => {
  it("seeds a small cast on the seed cards", () => {
    const state = seedState(NOW);
    expect(state.characters.map((character) => character.name)).toEqual(["Maya", "Tom"]);
    expect(state.notes.map((note) => note.characterIds)).toEqual([
      ["maya"],
      ["tom", "maya"],
      ["maya", "tom"],
    ]);
  });

  it("adds a person once, trimmed, and refuses the same name in another case", () => {
    const first = applyCommand(emptyState(), { type: "add_character", name: "  Maya " }, NOW);
    expect(first.changed).toBe(true);
    expect(first.result).toMatchObject({ name: "Maya", createdAt: NOW });

    const again = applyCommand(first.state, { type: "add_character", name: "maya" }, NOW);
    expect(again.changed).toBe(false);
    expect(again.state).toBe(first.state);
    expect(again.result).toBe(first.state.characters[0]);

    const blank = applyCommand(first.state, { type: "add_character", name: "   " }, NOW);
    expect(blank.changed).toBe(false);
  });

  it("renames a person, refuses a clash, and is a no-op for the same name", () => {
    const state = run(
      emptyState(),
      { type: "add_character", id: "m", name: "Maya" },
      { type: "add_character", id: "t", name: "Tom" },
    );
    const renamed = applyCommand(state, { type: "rename_character", id: "m", name: "Maya Reed" }, NOW);
    expect(renamed.changed).toBe(true);
    expect(renamed.state.characters[0]).toMatchObject({ id: "m", name: "Maya Reed" });

    const clash = applyCommand(renamed.state, { type: "rename_character", id: "t", name: "maya reed" }, NOW);
    expect(clash.changed).toBe(false);
    expect(clash.result).toMatchObject({ id: "m" });

    expect(applyCommand(renamed.state, { type: "rename_character", id: "m", name: "Maya Reed" }, NOW).changed).toBe(false);
    expect(applyCommand(renamed.state, { type: "rename_character", id: "nobody", name: "X" }, NOW).changed).toBe(false);
  });

  it("casts cards from the roster only, once each, in the order given", () => {
    const state = run(
      boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 0 }),
      { type: "add_character", id: "m", name: "Maya" },
      { type: "add_character", id: "t", name: "Tom" },
    );
    const cast = applyCommand(
      state,
      { type: "set_cast", ids: ["a", "b"], characterIds: ["t", "ghost", "m", "t"] },
      NOW,
    );
    expect(cast.changed).toBe(true);
    expect(cast.state.notes.map((note) => note.characterIds)).toEqual([
      ["t", "m"],
      ["t", "m"],
    ]);
    expect(cast.result).toHaveLength(2);

    const same = applyCommand(cast.state, { type: "set_cast", ids: ["a"], characterIds: ["t", "m"] }, NOW);
    expect(same.changed).toBe(false);
    expect(same.state).toBe(cast.state);

    const cleared = applyCommand(cast.state, { type: "set_cast", ids: ["a"], characterIds: [] }, NOW);
    expect(cleared.state.notes[0].characterIds).toEqual([]);
    expect(cleared.state.notes[1].characterIds).toEqual(["t", "m"]);
  });

  it("removing a person takes them off every card and leaves the cards", () => {
    const state = run(
      boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 0 }),
      { type: "add_character", id: "m", name: "Maya" },
      { type: "add_character", id: "t", name: "Tom" },
      { type: "set_cast", ids: ["a"], characterIds: ["m", "t"] },
      { type: "set_cast", ids: ["b"], characterIds: ["t"] },
    );
    const removed = applyCommand(state, { type: "remove_character", id: "t" }, NOW);
    expect(removed.changed).toBe(true);
    expect(removed.state.characters.map((character) => character.id)).toEqual(["m"]);
    expect(removed.state.notes.map((note) => note.characterIds)).toEqual([["m"], []]);
    expect(removed.state.notes).toHaveLength(2);
    expect(applyCommand(removed.state, { type: "remove_character", id: "t" }, NOW).changed).toBe(false);
  });

  it("create_note takes a cast, filtered to the roster", () => {
    const state = run(emptyState(), { type: "add_character", id: "m", name: "Maya" });
    const created = applyCommand(
      state,
      { type: "create_note", id: "a", characterIds: ["m", "nobody"] },
      NOW,
    );
    expect(created.state.notes[0].characterIds).toEqual(["m"]);
    expect(applyCommand(state, { type: "create_note", id: "b" }, NOW).state.notes[0].characterIds).toEqual([]);
  });

  it("normalizeState gives a pre-R29 board an empty roster and every card an empty cast", () => {
    const old = {
      logline: "",
      targetEighths: DEFAULT_TARGET_EIGHTHS,
      notes: [{ ...seedState(NOW).notes[0], characterIds: undefined }],
      groups: [],
      arrows: [],
    } as unknown as BoardState;
    const fixed = normalizeState(old);
    expect(fixed.characters).toEqual([]);
    expect(fixed.notes[0].characterIds).toEqual([]);
  });

  it("normalizeState drops a cast id that names nobody in the roster, and keeps the rest", () => {
    const state = run(
      boardOf({ id: "a", x: 0, y: 0 }),
      { type: "add_character", id: "m", name: "Maya" },
      { type: "set_cast", ids: ["a"], characterIds: ["m"] },
    );
    const damaged = {
      ...state,
      characters: [...state.characters, { id: 42, name: "bad" }],
      notes: [{ ...state.notes[0], characterIds: ["m", "ghost"] }],
    } as unknown as BoardState;
    const fixed = normalizeState(damaged);
    expect(fixed.characters.map((character) => character.id)).toEqual(["m"]);
    expect(fixed.notes[0].characterIds).toEqual(["m"]);
    expect(normalizeState(state)).toBe(state);
  });
});

describe("typed arrows (R30)", () => {
  const board = () => boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 0 });

  it("draws 'follows' unless told otherwise, and ignores a kind it does not know", () => {
    const plain = applyCommand(board(), { type: "create_arrow", from: "a", to: "b" }, NOW);
    expect(plain.state.arrows[0].kind).toBe("follows");
    const setup = applyCommand(
      board(),
      { type: "create_arrow", from: "a", to: "b", kind: "setup" },
      NOW,
    );
    expect(setup.state.arrows[0].kind).toBe("setup");
    const odd = applyCommand(
      board(),
      { type: "create_arrow", from: "a", to: "b", kind: "label" as never },
      NOW,
    );
    expect(odd.state.arrows[0].kind).toBe("follows");
  });

  it("keeps one arrow per direction whatever the kind", () => {
    const state = run(board(), { type: "create_arrow", from: "a", to: "b", kind: "setup" });
    const again = applyCommand(state, { type: "create_arrow", from: "a", to: "b" }, NOW);
    expect(again.changed).toBe(false);
    expect(again.state).toBe(state);
  });

  it("changes an arrow's kind, and is a no-op for the same kind or an unknown arrow", () => {
    const state = run(board(), { type: "create_arrow", from: "a", to: "b" });
    const id = state.arrows[0].id;
    const changed = applyCommand(state, { type: "set_arrow_kind", id, kind: "setup" }, NOW);
    expect(changed.changed).toBe(true);
    expect(changed.state.arrows[0]).toMatchObject({ id, from: "a", to: "b", kind: "setup" });
    expect(applyCommand(changed.state, { type: "set_arrow_kind", id, kind: "setup" }, NOW).changed).toBe(false);
    expect(applyCommand(state, { type: "set_arrow_kind", id: "nope", kind: "setup" }, NOW).changed).toBe(false);
  });

  it("normalizeState gives a pre-kind arrow 'follows' and leaves a kinded one alone", () => {
    const state = run(board(), { type: "create_arrow", from: "a", to: "b", kind: "setup" });
    const old = {
      ...state,
      arrows: [{ id: "x", from: "a", to: "b" }],
    } as unknown as BoardState;
    expect(normalizeState(old).arrows[0]).toEqual({ id: "x", from: "a", to: "b", kind: "follows" });
    expect(normalizeState(state)).toBe(state);
  });
});

describe("new_board", () => {
  it("empties everything but the target", () => {
    const state = run(
      seedState(NOW),
      { type: "set_logline", logline: "Can Maya forgive?" },
      { type: "set_target", targetEighths: 60 * EIGHTHS_PER_PAGE },
      { type: "create_arrow", from: "maya-letter", to: "tom-lies" },
    );
    const fresh = applyCommand(state, { type: "new_board" }, NOW);
    expect(fresh.changed).toBe(true);
    expect(fresh.state).toEqual({ ...emptyState(), targetEighths: 60 * EIGHTHS_PER_PAGE });
  });
});
