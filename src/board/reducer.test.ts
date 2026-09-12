import { describe, expect, it } from "vitest";
import {
  applyCommand,
  emptyState,
  isBoardState,
  NOTE_HEIGHT,
  NOTE_WIDTH,
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
