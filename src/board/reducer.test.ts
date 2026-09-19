import { describe, expect, it } from "vitest";
import { sceneNumbers } from "./numbering";
import {
  formatMinutes,
  applyCommand,
  atPlace,
  boardPlaces,
  boardEighths,
  countRanks,
  DEFAULT_NOTE_EIGHTHS,
  noteEighths,
  DEFAULT_TARGET_EIGHTHS,
  EIGHTHS_PER_PAGE,
  emptyState,
  filledCharacterFields,
  formatPages,
  isBoardState,
  NOTE_HEIGHT,
  NOTE_WIDTH,
  normalizeState,
  seedState,
  type BoardState,
  type Command,
  type BoardThread,
  storyOrder,
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

    const outcome = applyCommand(state, { type: "delete_note", id: "b" }, NOW);
    const after = outcome.state;
    expect(after.notes.map((n) => n.id)).toEqual(["a", "c"]);
    // The chain is joined behind the card: one follows in, one out, so a → c (round fourteen, entry 20).
    expect(after.arrows).toHaveLength(1);
    expect(after.arrows[0]).toMatchObject({ from: "a", to: "c", kind: "follows" });
    expect(outcome.result).toMatchObject({ joined: { from: "a", to: "c" } });
    // No join when the card had two ways in, when the arrow was a setup, or when a → c already exists.
    const forked = run(state, { type: "create_arrow", from: "c", to: "b" });
    expect(applyCommand(forked, { type: "delete_note", id: "b" }, NOW).state.arrows).toHaveLength(0);
    const setup = run(boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 }, { id: "c", x: 800, y: 0 }), { type: "create_arrow", from: "a", to: "b", kind: "setup" }, { type: "create_arrow", from: "b", to: "c" });
    expect(applyCommand(setup, { type: "delete_note", id: "b" }, NOW).state.arrows).toHaveLength(0);
    const already = run(state, { type: "create_arrow", from: "a", to: "c" });
    expect(applyCommand(already, { type: "delete_note", id: "b" }, NOW).state.arrows).toHaveLength(1);
  });

  it("says whether the card was folded and where it paid off, so a door can say what went (round fifteen, entry 17)", () => {
    let state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 });
    state = run(state, { type: "set_plant", ids: ["a"], plants: true }, { type: "set_payoff_board", ids: ["a"], boardId: "episode-two" });
    expect(applyCommand(state, { type: "delete_note", id: "a" }, NOW).result).toMatchObject({ plants: true, payoffBoardId: "episode-two" });
    expect(applyCommand(state, { type: "delete_note", id: "b" }, NOW).result).toMatchObject({ plants: false, payoffBoardId: null });
  });

  it("tidies only the cards that move, so a pose that changes nothing stamps nothing (round fourteen, entry 43)", () => {
    const state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 });
    const same = applyCommand(state, { type: "apply_poses", poses: [{ id: "a", x: 0, y: 0, rotate: state.notes[0].rotate }] }, NOW);
    expect(same.changed).toBe(false);
    expect(same.state).toBe(state);
    const moved = applyCommand(state, { type: "apply_poses", poses: [{ id: "a", x: 0, y: 0, rotate: state.notes[0].rotate }, { id: "b", x: 500, y: 0, rotate: 0 }] }, NOW);
    expect(moved.changed).toBe(true);
    expect(moved.result).toEqual({ moved: 1 });
    expect(moved.state.notes[0]).toBe(state.notes[0]);
  });

  it("says what went with the card: its arrows by both headlines, and the group it left (round thirteen, entry 17)", () => {
    let state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 220, y: 0 }, { id: "c", x: 440, y: 0 }, { id: "d", x: 660, y: 0 });
    state = run(
      state,
      { type: "update_note", id: "a", headline: "The yard" },
      { type: "update_note", id: "b", headline: "The lay-by" },
      { type: "update_note", id: "c", headline: "The pier" },
      { type: "create_arrow", from: "a", to: "b" },
      { type: "create_arrow", from: "b", to: "c", kind: "setup" },
      { type: "create_group", noteIds: ["a", "b", "c"], title: "Act three" },
    );
    const outcome = applyCommand(state, { type: "delete_note", id: "b" }, NOW);
    expect(outcome.result).toMatchObject({
      id: "b",
      headline: "The lay-by",
      arrows: [
        { from: "a", to: "b", kind: "follows", fromHeadline: "The yard", toHeadline: "The lay-by" },
        { from: "b", to: "c", kind: "setup", fromHeadline: "The lay-by", toHeadline: "The pier" },
      ],
      groups: [{ title: "Act three", remaining: 2, dissolved: false }],
    });
    // A card in no group and with no arrow says so with empty lists.
    expect(applyCommand(state, { type: "delete_note", id: "d" }, NOW).result).toMatchObject({ arrows: [], groups: [] });
    // A group left with one card reports that it dissolved.
    const two = applyCommand(state, { type: "delete_note", id: "c" }, NOW).state;
    expect(applyCommand(two, { type: "delete_note", id: "b" }, NOW).result).toMatchObject({ groups: [{ title: "Act three", remaining: 1, dissolved: true }] });
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

  it("adds cards to a group where they are, taking them out of any other frame (round thirteen, entry 18)", () => {
    let state = boardOf(
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 220, y: 0 },
      { id: "c", x: 440, y: 0 },
      { id: "d", x: 660, y: 0 },
      { id: "e", x: 880, y: 0 },
    );
    state = run(state, { type: "create_group", noteIds: ["a", "b"], title: "Act three" }, { type: "create_group", noteIds: ["c", "d"], title: "Sequence" });
    const actThree = state.groups[0].id;
    const before = state.notes.map((note) => [note.x, note.y]);

    // A loose card joins; nothing moves.
    const joined = applyCommand(state, { type: "add_to_group", id: actThree, noteIds: ["e"] }, NOW);
    expect(joined.changed).toBe(true);
    expect(joined.state.groups[0].noteIds).toEqual(["a", "b", "e"]);
    expect(joined.result).toMatchObject({ added: ["e"], left: [] });
    expect(joined.state.notes.map((note) => [note.x, note.y])).toEqual(before);

    // A card from another frame leaves it on the way, and a frame left with one card dissolves.
    const pulled = applyCommand(joined.state, { type: "add_to_group", id: actThree, noteIds: ["c", "c"] }, NOW);
    expect(pulled.state.groups).toHaveLength(1);
    expect(pulled.state.groups[0].noteIds).toEqual(["a", "b", "e", "c"]);
    expect(pulled.result).toMatchObject({ added: ["c"], left: [{ title: "Sequence", remaining: 1, dissolved: true }] });

    // No such group, nothing real to add, or already in: no change, the same state object.
    expect(applyCommand(state, { type: "add_to_group", id: "ghost", noteIds: ["e"] }, NOW).state).toBe(state);
    expect(applyCommand(state, { type: "add_to_group", id: actThree, noteIds: ["ghost"] }, NOW).state).toBe(state);
    expect(applyCommand(state, { type: "add_to_group", id: actThree, noteIds: ["a", "b"] }, NOW).state).toBe(state);
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

describe("threads (R60)", () => {
  it("names a thread through existing cards, once each, either end open on the writer's word", () => {
    const state = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 0 });
    const made = applyCommand(state, { type: "create_thread", name: "  the  bucket ", noteIds: ["b", "ghost", "b"], startOpen: true }, NOW);
    expect(made.changed).toBe(true);
    expect(made.result).toEqual({ id: expect.any(String), name: "the bucket", noteIds: ["b"], startOpen: true, endOpen: false, fold: null });
    expect(applyCommand(state, { type: "create_thread", name: "   " }, NOW).changed).toBe(false);
  });

  it("ties an end, adds and removes cards, renames, and says when nothing changed", () => {
    let state = run(boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 0 }), { type: "create_thread", id: "t", name: "the bucket", noteIds: ["b"], startOpen: true });
    const tied = applyCommand(state, { type: "update_thread", id: "t", add: ["a"], startOpen: false }, NOW);
    const tiedResult = tied.result as { thread: BoardThread; before: BoardThread };
    // Held in story order: a sits left of b on the wall, so it comes first whatever order it was added.
    expect(tiedResult.thread).toEqual({ id: "t", name: "the bucket", noteIds: ["a", "b"], startOpen: false, endOpen: false });
    expect(tiedResult.before.startOpen).toBe(true);
    state = tied.state;
    expect(applyCommand(state, { type: "update_thread", id: "t", add: ["a"] }, NOW).changed).toBe(false);
    expect(applyCommand(state, { type: "update_thread", id: "t", name: "  " }, NOW).changed).toBe(false);
    expect((applyCommand(state, { type: "update_thread", id: "t", remove: ["b"], name: "the crowns" }, NOW).result as { thread: BoardThread }).thread).toEqual({ id: "t", name: "the crowns", noteIds: ["a"], startOpen: false, endOpen: false });
    expect(applyCommand(state, { type: "update_thread", id: "ghost", name: "x" }, NOW).changed).toBe(false);
    expect(applyCommand(state, { type: "delete_thread", id: "t" }, NOW).state.threads).toEqual([]);
    expect(applyCommand(state, { type: "delete_thread", id: "ghost" }, NOW).changed).toBe(false);
  });

  it("takes a deleted card off its threads and says so; the thread stays", () => {
    const state = run(boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 0 }), { type: "create_thread", id: "t", name: "the key", noteIds: ["a", "b"], endOpen: true });
    const gone = applyCommand(state, { type: "delete_note", id: "a" }, NOW);
    expect((gone.result as { threads: unknown }).threads).toEqual([{ id: "t", name: "the key", remaining: 1 }]);
    expect(gone.state.threads).toEqual([{ id: "t", name: "the key", noteIds: ["b"], startOpen: false, endOpen: true }]);
  });

  it("repairs threads on load: none before R60, a missing card dropped, a nameless thread gone", () => {
    const old = { logline: "", notes: seedState(NOW).notes, groups: [], arrows: [] };
    expect(normalizeState(old).threads).toEqual([]);
    const messy = { ...old, threads: [{ id: "t", name: "the key", noteIds: ["maya-letter", "ghost"], startOpen: "yes" }, { id: "u", noteIds: [] }, null] };
    expect(normalizeState(messy).threads).toEqual([{ id: "t", name: "the key", noteIds: ["maya-letter"], startOpen: false, endOpen: false }]);
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

describe("settle_note is honest about change (R33)", () => {
  it("is a no-op for a card in no group, or still inside its frame", () => {
    const loose = boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 0 });
    const settled = applyCommand(loose, { type: "settle_note", id: "a" }, NOW);
    expect(settled.changed).toBe(false);
    expect(settled.state).toBe(loose);

    const grouped = run(loose, { type: "create_group", noteIds: ["a", "b"] });
    const inside = applyCommand(grouped, { type: "settle_note", id: "a" }, NOW);
    expect(inside.changed).toBe(false);
    expect(inside.state).toBe(grouped);
  });

  it("is a change when the card has been dragged out of its frame", () => {
    const grouped = run(
      boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 300, y: 0 }, { id: "c", x: 600, y: 0 }),
      { type: "create_group", noteIds: ["a", "b", "c"] },
      { type: "move_note", id: "a", x: 0, y: 2000 },
    );
    const out = applyCommand(grouped, { type: "settle_note", id: "a" }, NOW);
    expect(out.changed).toBe(true);
    expect(out.state.groups[0].noteIds).toEqual(["b", "c"]);
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
      "set_length with no cards named",
      { type: "set_length", ids: [], lengthEighths: DEFAULT_NOTE_EIGHTHS },
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

describe("set_open (R59)", () => {
  it("leaves a card open with the writer's words, closes it with nothing, and is born open from create_note", () => {
    let state = emptyState();
    state = applyCommand(state, { type: "create_note", headline: "Declan", change: "What changes?", x: 0, y: 0 }).state;
    state = applyCommand(state, { type: "create_note", headline: "The buyer", change: "Housing, or a supermarket.", x: 300, y: 0, open: "  the buyer  " }).state;
    const [declan, buyer] = state.notes;
    expect(declan.open).toBe("");
    expect(buyer.open).toBe("the buyer");
    const opened = applyCommand(state, { type: "set_open", ids: [declan.id], open: "where, and  whether Ruth is there" });
    expect(opened.changed).toBe(true);
    expect(opened.state.notes[0].open).toBe("where, and whether Ruth is there");
    expect(applyCommand(opened.state, { type: "set_open", ids: [declan.id], open: "where, and whether Ruth is there" }).changed).toBe(false);
    const closed = applyCommand(opened.state, { type: "set_open", ids: [declan.id, buyer.id], open: "" });
    expect(closed.state.notes.map((note) => note.open)).toEqual(["", ""]);
    // A record from before R59 is repaired as decided.
    const older = normalizeState({ ...state, notes: state.notes.map(({ open: _drop, ...note }) => note) });
    expect(older.notes.every((note) => note.open === "")).toBe(true);
  });
});

describe("set_payoff_board (R50)", () => {
  it("names another board as where a fold pays off, only on folded cards, and forgets it when unfolded", () => {
    let state = emptyState();
    state = applyCommand(state, { type: "create_note", headline: "The key", change: "She keeps it.", x: 0, y: 0, plants: true }).state;
    state = applyCommand(state, { type: "create_note", headline: "The gate", change: "She stays.", x: 300, y: 0 }).state;
    const [key, gate] = state.notes;
    expect(key.payoffBoardId).toBeNull();
    const unfolded = applyCommand(state, { type: "set_payoff_board", ids: [gate.id], boardId: "ep2" });
    expect(unfolded.changed).toBe(false);
    const named = applyCommand(state, { type: "set_payoff_board", ids: [key.id], boardId: "ep2" });
    expect(named.changed).toBe(true);
    expect(named.state.notes[0].payoffBoardId).toBe("ep2");
    expect(applyCommand(named.state, { type: "set_payoff_board", ids: [key.id], boardId: "ep2" }).changed).toBe(false);
    const cleared = applyCommand(named.state, { type: "set_payoff_board", ids: [key.id], boardId: null }).state;
    expect(cleared.notes[0].payoffBoardId).toBeNull();
    // The receiving end (R58): a scene on that board, kept on the fold; a board alone is a promise.
    expect(named.state.notes[0].payoffNoteId).toBeNull();
    const claimed = applyCommand(named.state, { type: "set_payoff_board", ids: [key.id], boardId: "ep2", noteId: "ep2-gate" });
    expect(claimed.changed).toBe(true);
    expect(claimed.state.notes[0]).toMatchObject({ payoffBoardId: "ep2", payoffNoteId: "ep2-gate" });
    expect(applyCommand(claimed.state, { type: "set_payoff_board", ids: [key.id], boardId: "ep2", noteId: "ep2-gate" }).changed).toBe(false);
    // Naming the board again without a scene takes the claim back to a promise; unfolding forgets both.
    expect(applyCommand(claimed.state, { type: "set_payoff_board", ids: [key.id], boardId: "ep2" }).state.notes[0].payoffNoteId).toBeNull();
    expect(applyCommand(claimed.state, { type: "set_plant", ids: [key.id], plants: false }).state.notes[0]).toMatchObject({ plants: false, payoffBoardId: null, payoffNoteId: null });
    // A record from before R58 is repaired to a promise; a note without its board claims nothing.
    const older = normalizeState({ ...claimed.state, notes: [{ ...claimed.state.notes[0], payoffNoteId: undefined }, { ...claimed.state.notes[1], payoffNoteId: "x" }] });
    expect(older.notes[0].payoffNoteId).toBeNull();
    expect(older.notes[1].payoffNoteId).toBeNull();
    const unfoldedKey = applyCommand(named.state, { type: "set_plant", ids: [key.id], plants: false }).state;
    expect(unfoldedKey.notes[0].payoffBoardId).toBeNull();
    // A card written before R50 has no field; it claims nothing.
    const old = { ...named.state, notes: named.state.notes.map(({ payoffBoardId: _drop, ...note }) => note) };
    expect(normalizeState(old).notes[0].payoffBoardId).toBeNull();
  });
});

describe("set_length", () => {
  const board = () => boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 });

  it("leaves a new card unsized, which reads as an ordinary page", () => {
    expect(board().notes[0].lengthEighths).toBeNull();
    expect(noteEighths(board().notes[0])).toBe(DEFAULT_NOTE_EIGHTHS);
  });

  it("returns the identical state when a card already has that length", () => {
    const sized = run(board(), { type: "set_length", ids: ["a"], lengthEighths: DEFAULT_NOTE_EIGHTHS });
    expect(sized.notes[0].lengthEighths).toBe(DEFAULT_NOTE_EIGHTHS);
    expect(applyCommand(sized, { type: "set_length", ids: ["a"], lengthEighths: DEFAULT_NOTE_EIGHTHS }).state).toBe(sized);
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

  it("unsizes a card with null, so it claims nothing again (round thirteen, entry 16)", () => {
    const sized = run(board(), { type: "set_length", ids: ["a", "b"], lengthEighths: 20 });
    const outcome = applyCommand(sized, { type: "set_length", ids: ["a"], lengthEighths: null }, NOW);
    expect(outcome.changed).toBe(true);
    expect(outcome.result).toHaveLength(1);
    const a = outcome.state.notes.find((note) => note.id === "a")!;
    expect(a.lengthEighths).toBeNull();
    expect(noteEighths(a)).toBe(DEFAULT_NOTE_EIGHTHS);
    expect(outcome.state.notes.find((note) => note.id === "b")?.lengthEighths).toBe(20);
    // Unsizing an unsized card is no change at all.
    expect(applyCommand(outcome.state, { type: "set_length", ids: ["a"], lengthEighths: null }, NOW).state).toBe(outcome.state);
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

type Fold = { kept: boolean; firstId?: string; lastId?: string; what?: string; folded?: boolean; named?: boolean; arrow?: { from: string; to: string } | null; adjacent?: boolean } | null;

describe("what the fold plants (R62)", () => {
  it("names a fold in the writer's words, folds an unfolded card when named, and forgets the words on unfolding", () => {
    const base = run(emptyState(), { type: "create_note", id: "a", headline: "The first morning", change: "x" });
    const named = run(base, { type: "set_plant", ids: ["a"], what: "  the wrong  tools " });
    expect(named.notes[0].plants).toBe(true);
    expect(named.notes[0].plantsWhat).toBe("the wrong tools");
    expect(applyCommand(named, { type: "set_plant", ids: ["a"], what: "the wrong tools" }, NOW).changed).toBe(false);
    // plants alone keeps the words; what "" keeps the fold and clears them.
    expect(run(named, { type: "set_plant", ids: ["a"], plants: true }).notes[0].plantsWhat).toBe("the wrong tools");
    const unnamed = run(named, { type: "set_plant", ids: ["a"], what: "" });
    expect(unnamed.notes[0].plants).toBe(true);
    expect(unnamed.notes[0].plantsWhat).toBe("");
    const unfolded = run(named, { type: "set_plant", ids: ["a"], plants: false });
    expect(unfolded.notes[0].plants).toBe(false);
    expect(unfolded.notes[0].plantsWhat).toBe("");
    const born = run(emptyState(), { type: "create_note", id: "b", headline: "B", change: "x", plantsWhat: "the key" });
    expect(born.notes[0].plants).toBe(true);
    expect(born.notes[0].plantsWhat).toBe("the key");
    const old = JSON.parse(JSON.stringify(named));
    delete old.notes[0].plantsWhat;
    expect(normalizeState(old).notes[0].plantsWhat).toBe("");
    expect(normalizeState({ ...old, notes: [{ ...old.notes[0], plants: false, plantsWhat: "stale" }] }).notes[0].plantsWhat).toBe("");
  });

  it("ties a thread into the fold and the arrow when the first card's fold is free, and leaves it a thread when the fold is another's", () => {
    const wallOf = run(
      emptyState(),
      { type: "create_note", id: "a", headline: "The first morning", change: "x" },
      { type: "create_note", id: "k", headline: "Con gives Ruth the key", change: "x" },
      { type: "create_note", id: "t", headline: "Con gives Ruth his tools", change: "x" },
    );
    // Free fold: the thread names the fold and draws the arrow.
    const tied = run(wallOf, { type: "create_thread", id: "key", name: "the key", noteIds: ["a", "k"] });
    expect(tied.notes.find((note) => note.id === "a")).toMatchObject({ plants: true, plantsWhat: "the key" });
    expect(tied.arrows.some((arrow) => arrow.kind === "setup" && arrow.from === "a" && arrow.to === "k")).toBe(true);
    const outcome = applyCommand(wallOf, { type: "create_thread", id: "key", name: "the key", noteIds: ["a", "k"] }, NOW);
    expect((outcome.result as { fold: Fold }).fold).toMatchObject({ kept: false, firstId: "a", lastId: "k", folded: true, named: true, arrow: { from: "a", to: "k" } });
    // Tied later by update_thread: the same, once.
    const open = run(wallOf, { type: "create_thread", id: "key", name: "the key", noteIds: ["k"], startOpen: true });
    expect(open.notes.find((note) => note.id === "a")?.plants).toBe(false);
    const later = applyCommand(open, { type: "update_thread", id: "key", add: ["a"], noteIds: ["a", "k"], startOpen: false }, NOW);
    expect((later.result as { fold: Fold }).fold).toMatchObject({ kept: false, folded: true, named: true });
    expect(later.state.arrows.filter((arrow) => arrow.kind === "setup")).toHaveLength(1);
    // Renamed, the fold it named follows, and the rule finds nothing left to do.
    const renamed = applyCommand(later.state, { type: "update_thread", id: "key", name: "the shed key" }, NOW);
    expect((renamed.result as { fold: Fold }).fold).toMatchObject({ kept: false, folded: false, named: false, arrow: null });
    expect(renamed.state.notes.find((note) => note.id === "a")?.plantsWhat).toBe("the shed key");
    // The fold is another's: the thread stays a thread and nothing is drawn.
    const tools = run(wallOf, { type: "set_plant", ids: ["a"], what: "the wrong tools" });
    const kept = applyCommand(tools, { type: "create_thread", id: "key", name: "the key", noteIds: ["a", "k"] }, NOW);
    expect((kept.result as { fold: Fold }).fold).toEqual({ kept: true, firstId: "a", what: "the wrong tools" });
    expect(kept.state.notes.find((note) => note.id === "a")?.plantsWhat).toBe("the wrong tools");
    expect(kept.state.arrows).toHaveLength(0);
    // A fold with no words is free: it takes the thread's name.
    const bare = run(wallOf, { type: "set_plant", ids: ["a"], plants: true });
    const took = applyCommand(bare, { type: "create_thread", id: "key", name: "the key", noteIds: ["a", "k"] }, NOW);
    expect((took.result as { fold: Fold }).fold).toMatchObject({ kept: false, folded: false, named: true });
    expect(took.state.notes.find((note) => note.id === "a")?.plantsWhat).toBe("the key");
    // Added last but first in the story (round twenty, entry 40): the rule folds the first card in the story.
    const chain = run(
      wallOf,
      { type: "create_arrow", from: "a", to: "k", kind: "follows" },
      { type: "create_arrow", from: "k", to: "t", kind: "follows" },
      { type: "create_thread", id: "key2", name: "the shed key", noteIds: ["k"], startOpen: true },
    );
    const appended = applyCommand(chain, { type: "update_thread", id: "key2", add: ["a"], startOpen: false }, NOW);
    expect((appended.result as { thread: { noteIds: string[] } }).thread.noteIds).toEqual(["a", "k"]);
    // The payoff is the very next scene, and a follows arrow already runs there: the fold is named, and no setup arrow is drawn over it.
    expect((appended.result as { fold: Fold }).fold).toMatchObject({ kept: false, firstId: "a", lastId: "k", folded: true, arrow: null, adjacent: true });
    expect(appended.state.notes.find((note) => note.id === "k")?.plants).toBe(false);
    // A loose end, or one card: no rule.
    expect((applyCommand(wallOf, { type: "create_thread", id: "b", name: "the bucket", noteIds: ["t"], startOpen: true }, NOW).result as { fold: Fold }).fold).toBeNull();
  });
});

describe("two versions of one scene (R65)", () => {
  it("sets a card behind another, out of the order and the count; choosing either leaves one scene", () => {
    const wallOf = run(
      emptyState(),
      { type: "create_note", id: "a", headline: "The parish hall", change: "x" },
      { type: "create_note", id: "b", headline: "They lose the plots", change: "x" },
      { type: "create_note", id: "c", headline: "Con dies", change: "x" },
      { type: "create_arrow", from: "a", to: "b", kind: "follows" },
      { type: "create_arrow", from: "b", to: "c", kind: "follows" },
    );
    const paired = run(wallOf, { type: "set_alternative", id: "c", of: "b" });
    expect(paired.notes.find((note) => note.id === "c")?.alternativeOf).toBe("b");
    expect(storyOrder(paired).map((note) => note.id)).toEqual(["a", "b"]);
    expect(boardEighths(paired)).toBe(boardEighths(wallOf) - 8);
    expect(paired.arrows.some((arrow) => arrow.to === "c")).toBe(false);
    expect(applyCommand(paired, { type: "set_alternative", id: "c", of: "b" }, NOW).changed).toBe(false);
    // A version of a version, or a front made a version: refused.
    expect(applyCommand(paired, { type: "set_alternative", id: "a", of: "c" }, NOW).changed).toBe(false);
    expect(applyCommand(paired, { type: "set_alternative", id: "b", of: "a" }, NOW).changed).toBe(false);
    // Choosing the front: the version goes.
    const front = run(paired, { type: "choose_version", id: "b" });
    expect(front.notes.map((note) => note.id)).toEqual(["a", "b"]);
    // Choosing the version: it steps into the front's place with its arrows; the front goes.
    const behind = run(paired, { type: "choose_version", id: "c" });
    expect(behind.notes.map((note) => note.id)).toEqual(["a", "c"]);
    expect(behind.notes.find((note) => note.id === "c")?.alternativeOf).toBeNull();
    expect(behind.arrows.some((arrow) => arrow.from === "a" && arrow.to === "c")).toBe(true);
    // Keep: the other stands beside, plain and unwired.
    const kept = run(paired, { type: "choose_version", id: "c", keep: true });
    expect(kept.notes.map((note) => note.id).sort()).toEqual(["a", "b", "c"]);
    expect(kept.notes.find((note) => note.id === "b")?.alternativeOf).toBeNull();
    expect(kept.arrows.some((arrow) => arrow.to === "b" || arrow.from === "b")).toBe(false);
    // Deleting the front leaves the version as a plain card; a load repairs a stale sibling.
    expect(run(paired, { type: "delete_note", id: "b" }).notes.find((note) => note.id === "c")?.alternativeOf).toBeNull();
    const old = JSON.parse(JSON.stringify(paired));
    (old.notes as Array<{ id: string; alternativeOf: string | null }>).find((note) => note.id === "c")!.alternativeOf = "ghost";
    expect(normalizeState(old).notes.find((note) => note.id === "c")?.alternativeOf).toBeNull();
  });
});

describe("set_target with open (the handover's call 6)", () => {
  it("leaves the target open in the writer's words while the number stands; a number decides it", () => {
    const open = run(emptyState(), { type: "set_target", open: "half-hour or feature" });
    expect(open.targetOpen).toBe("half-hour or feature");
    expect(open.targetEighths).toBe(emptyState().targetEighths);
    expect(applyCommand(open, { type: "set_target", open: "half-hour or feature" }, NOW).changed).toBe(false);
    const decided = run(open, { type: "set_target", targetEighths: 90 * 8 });
    expect(decided.targetEighths).toBe(90 * 8);
    expect(decided.targetOpen).toBe("");
    expect(run(open, { type: "set_target", open: "" }).targetOpen).toBe("");
    const old = JSON.parse(JSON.stringify(open));
    delete old.targetOpen;
    expect(normalizeState(old).targetOpen).toBe("");
  });
});

describe("set_location with open (R61's edge)", () => {
  it("leaves a card's place open in the writer's words; a place decides it; open \"\" leaves it blank", () => {
    const base = run(emptyState(), { type: "create_note", id: "a", headline: "She tells him", change: "Con knows." });
    const open = run(base, { type: "set_location", ids: ["a"], open: "where it happens" });
    expect(open.notes[0].location).toBe("");
    expect(open.notes[0].locationOpen).toBe("where it happens");
    expect(applyCommand(open, { type: "set_location", ids: ["a"], open: "where it happens" }, NOW).changed).toBe(false);
    const decided = run(open, { type: "set_location", ids: ["a"], location: "the allotments" });
    expect(decided.notes[0].location).toBe("the allotments");
    expect(decided.notes[0].locationOpen).toBe("");
    const blank = run(decided, { type: "set_location", ids: ["a"], open: "" , location: "" });
    expect(blank.notes[0].location).toBe("");
    expect(blank.notes[0].locationOpen).toBe("");
    const born = run(emptyState(), { type: "create_note", id: "b", headline: "B", change: "x", location: "the shed", locationOpen: "which shed" });
    expect(born.notes[0].location).toBe("");
    expect(born.notes[0].locationOpen).toBe("which shed");
    const old = JSON.parse(JSON.stringify(open));
    delete old.notes[0].locationOpen;
    expect(normalizeState(old).notes[0].locationOpen).toBe("");
  });
});

describe("set_when with open (R61)", () => {
  it("leaves a card's when open in the writer's words; a when decides it; open \"\" leaves it blank", () => {
    const base = run(emptyState(), { type: "create_note", id: "a", headline: "The key", change: "Ruth has it." });
    const open = run(base, { type: "set_when", ids: ["a"], open: "after the break-in; which day" });
    expect(open.notes[0].when).toBe("");
    expect(open.notes[0].whenOpen).toBe("after the break-in; which day");
    expect(applyCommand(open, { type: "set_when", ids: ["a"], open: "after the break-in; which day" }, NOW).changed).toBe(false);
    const decided = run(open, { type: "set_when", ids: ["a"], when: "the morning after" });
    expect(decided.notes[0].when).toBe("the morning after");
    expect(decided.notes[0].whenOpen).toBe("");
    const reopened = run(decided, { type: "set_when", ids: ["a"], open: "which morning" });
    expect(reopened.notes[0].when).toBe("");
    const blank = run(reopened, { type: "set_when", ids: ["a"], open: "" });
    expect(blank.notes[0].when).toBe("");
    expect(blank.notes[0].whenOpen).toBe("");
    // Born open: create_note with whenOpen.
    const born = run(emptyState(), { type: "create_note", id: "b", headline: "B", change: "x", when: "night", whenOpen: "day or night" });
    expect(born.notes[0].when).toBe("");
    expect(born.notes[0].whenOpen).toBe("day or night");
  });

  it("repairs a board and its cards written before R61 with blank open fields", () => {
    const old = JSON.parse(JSON.stringify(run(emptyState(), { type: "create_note", id: "a", headline: "A", change: "x" })));
    delete old.loglineOpen;
    delete old.notes[0].whenOpen;
    const fixed = normalizeState(old);
    expect(fixed.loglineOpen).toBe("");
    expect(fixed.notes[0].whenOpen).toBe("");
    expect(normalizeState(fixed)).toBe(fixed);
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

  it("leaves the logline open in the writer's words, and a value decides it (R61)", () => {
    const open = run(emptyState(), { type: "set_logline", open: "  two candidates,   not chosen " });
    expect(open.logline).toBe("");
    expect(open.loglineOpen).toBe("two candidates, not chosen");
    expect(applyCommand(open, { type: "set_logline", open: "two candidates, not chosen" }, NOW).changed).toBe(false);
    const decided = run(open, { type: "set_logline", logline: "Can three years be grown in one?" });
    expect(decided.logline).toBe("Can three years be grown in one?");
    expect(decided.loglineOpen).toBe("");
    const reopened = run(decided, { type: "set_logline", open: "not sure that is the question" });
    expect(reopened.logline).toBe("");
    expect(reopened.loglineOpen).toBe("not sure that is the question");
    const blank = run(reopened, { type: "set_logline", open: "" });
    expect(blank.logline).toBe("");
    expect(blank.loglineOpen).toBe("");
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
    // Unsized stays unsized — null claims nothing — and reads as a page.
    expect(normalized.notes.every((note) => note.lengthEighths === null && noteEighths(note) === DEFAULT_NOTE_EIGHTHS)).toBe(
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
    expect(normalized.notes.every((note) => note.lengthEighths === null && noteEighths(note) === DEFAULT_NOTE_EIGHTHS)).toBe(
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

describe("set_plant (R31)", () => {
  it("folds and unfolds without moving the card, and skips cards already that way", () => {
    const state = boardOf({ id: "a", x: 40, y: 50 }, { id: "b", x: 300, y: 50 });
    expect(state.notes.every((note) => note.plants === false)).toBe(true);
    const folded = applyCommand(state, { type: "set_plant", ids: ["a", "b"], plants: true }, NOW);
    expect(folded.changed).toBe(true);
    expect(folded.state.notes.map((note) => note.plants)).toEqual([true, true]);
    expect(folded.state.notes[0]).toMatchObject({ x: 40, y: 50 });
    expect(folded.result).toHaveLength(2);

    const again = applyCommand(folded.state, { type: "set_plant", ids: ["a"], plants: true }, NOW);
    expect(again.changed).toBe(false);
    expect(again.state).toBe(folded.state);

    const unfolded = applyCommand(folded.state, { type: "set_plant", ids: ["a", "nope"], plants: false }, NOW);
    expect(unfolded.state.notes.map((note) => note.plants)).toEqual([false, true]);
  });

  it("create_note takes plants, and treats anything but true as false", () => {
    const planted = applyCommand(emptyState(), { type: "create_note", id: "a", plants: true }, NOW);
    expect(planted.state.notes[0].plants).toBe(true);
    const odd = applyCommand(emptyState(), { type: "create_note", id: "b", plants: "yes" as never }, NOW);
    expect(odd.state.notes[0].plants).toBe(false);
  });

  it("normalizeState gives a pre-fold card plants: false and leaves a folded one alone", () => {
    const state = run(boardOf({ id: "a", x: 0, y: 0 }), { type: "set_plant", ids: ["a"], plants: true });
    const { plants: _drop, ...bare } = state.notes[0];
    const fixed = normalizeState({ ...state, notes: [bare] } as unknown as BoardState);
    expect(fixed.notes[0].plants).toBe(false);
    expect(normalizeState(state)).toBe(state);
  });
});

describe("the person's page (R36)", () => {
  function roster() {
    const base = emptyState();
    return applyCommand(base, { type: "add_character", name: "Maya", id: "m" }, NOW).state;
  }

  it("adds a person with every page line present and empty", () => {
    const maya = roster().characters[0];
    expect(maya).toMatchObject({ looks: "", voice: "", wants: "", needs: "", notes: "" });
    expect(filledCharacterFields(maya)).toEqual([]);
  });

  it("updates any of the five lines by id, one step at a time", () => {
    const first = applyCommand(roster(), { type: "update_character", id: "m", looks: "Tall, a good coat." }, NOW);
    expect(first.changed).toBe(true);
    expect(first.result).toMatchObject({ id: "m", looks: "Tall, a good coat.", voice: "" });
    const second = applyCommand(
      first.state,
      { type: "update_character", id: "m", wants: "To keep the flat.", needs: "To be believed." },
      NOW,
    );
    expect(second.state.characters[0]).toMatchObject({
      looks: "Tall, a good coat.",
      wants: "To keep the flat.",
      needs: "To be believed.",
    });
    expect(filledCharacterFields(second.state.characters[0])).toEqual(["looks", "wants", "needs"]);
  });

  it("changes nothing for an unknown person, an unknown field, or the same words", () => {
    const state = applyCommand(roster(), { type: "update_character", id: "m", looks: "Tall." }, NOW).state;
    expect(applyCommand(state, { type: "update_character", id: "nobody", looks: "x" }, NOW).changed).toBe(false);
    expect(applyCommand(state, { type: "update_character", id: "m", looks: "Tall." }, NOW).changed).toBe(false);
    const stray = applyCommand(state, { type: "update_character", id: "m", age: "34" } as never, NOW);
    expect(stray.changed).toBe(false);
    expect(stray.result).toBe(state.characters[0]);
  });

  it("fills the page lines in for a roster written before them (seventh migration)", () => {
    const old = {
      ...emptyState(),
      characters: [{ id: "t", name: "Tom", createdAt: NOW, updatedAt: NOW }],
    };
    const repaired = normalizeState(old as never);
    expect(repaired).not.toBe(old);
    expect(repaired.characters[0]).toMatchObject({ id: "t", name: "Tom", looks: "", notes: "" });
    // And leaves a roster that already has them alone.
    expect(normalizeState(repaired)).toBe(repaired);
  });
});

describe("where a scene happens (R37)", () => {
  function wall() {
    let state = emptyState();
    state = applyCommand(state, { type: "create_note", id: "a", headline: "A", change: "a", location: "  the piano  shop " }, NOW).state;
    state = applyCommand(state, { type: "create_note", id: "b", headline: "B", change: "b" }, NOW).state;
    state = applyCommand(state, { type: "create_note", id: "c", headline: "C", change: "c", location: "The Piano Shop" }, NOW).state;
    return state;
  }

  it("cleans a place on creation and leaves a card nowhere by default", () => {
    const state = wall();
    expect(state.notes[0].location).toBe("the piano shop");
    expect(state.notes[1].location).toBe("");
  });

  it("sets one place on many cards, clears with an empty place, and changes nothing twice", () => {
    const state = wall();
    const set = applyCommand(state, { type: "set_location", ids: ["a", "b"], location: "the flat" }, NOW);
    expect(set.changed).toBe(true);
    expect((set.result as { id: string }[]).map((note) => note.id)).toEqual(["a", "b"]);
    expect(set.state.notes.map((note) => note.location)).toEqual(["the flat", "the flat", "The Piano Shop"]);
    expect(applyCommand(set.state, { type: "set_location", ids: ["a"], location: " the  flat " }, NOW).changed).toBe(false);
    const cleared = applyCommand(set.state, { type: "set_location", ids: ["b"], location: "" }, NOW);
    expect(cleared.state.notes[1].location).toBe("");
    expect(applyCommand(state, { type: "set_location", ids: [], location: "x" }, NOW).changed).toBe(false);
  });

  it("takes a place through update_note as well", () => {
    const state = applyCommand(wall(), { type: "update_note", id: "b", location: "the bank" }, NOW).state;
    expect(state.notes[1].location).toBe("the bank");
  });

  it("lists the wall's places in order of first appearance, one per spelling-insensitive name", () => {
    const state = applyCommand(wall(), { type: "set_location", ids: ["b"], location: "the flat" }, NOW).state;
    expect(boardPlaces(state)).toEqual([
      { name: "the piano shop", cards: 2 },
      { name: "the flat", cards: 1 },
    ]);
    expect(atPlace(state.notes[2], "the piano shop")).toBe(true);
    expect(atPlace(state.notes[1], "the piano shop")).toBe(false);
    expect(boardPlaces(emptyState())).toEqual([]);
  });

  it("fills a place in for cards written before it (eighth migration)", () => {
    const seed = seedState();
    const old = { ...seed, notes: seed.notes.map(({ location: _location, ...note }) => note) };
    const repaired = normalizeState(old as never);
    expect(repaired).not.toBe(old);
    expect(repaired.notes.every((note) => note.location === "")).toBe(true);
    expect(normalizeState(repaired)).toBe(repaired);
  });
});

describe("the production half (Roadmap 2, item 8)", () => {
  it("locks the numbers by the order given, gives a new scene an A-number, and unlocks", () => {
    const seed = seedState();
    const locked = applyCommand(seed, { type: "lock_numbers", order: ["maya-letter", "tom-lies", "letter-aloud"] }, NOW);
    expect(locked.changed).toBe(true);
    expect(locked.state.lock?.numbers).toEqual({ "maya-letter": "1", "tom-lies": "2", "letter-aloud": "3" });
    const added = applyCommand(locked.state, { type: "create_note", id: "new", headline: "New", change: "x" }, NOW).state;
    expect(sceneNumbers([{ id: "maya-letter" }, { id: "new" }, { id: "tom-lies" }, { id: "letter-aloud" }], added.lock).get("new")).toBe("1A");
    expect(applyCommand(added, { type: "unlock_numbers" }, NOW).state.lock).toBeNull();
    expect(applyCommand(seed, { type: "unlock_numbers" }, NOW).changed).toBe(false);
  });

  it("starts a revision with a snapshot of every card, and ends it", () => {
    const seed = seedState();
    const started = applyCommand(seed, { type: "start_revision", name: "blue draft", color: "blue" }, NOW);
    expect(started.state.revision).toMatchObject({ name: "blue draft", color: "blue", since: NOW });
    expect(started.state.revision?.snapshot["maya-letter"]).toEqual({ headline: "Maya finds the letter", change: "She decides not to tell Tom.", location: "", text: "" });
    expect(applyCommand(seed, { type: "start_revision", name: "  " }, NOW).changed).toBe(false);
    expect(applyCommand(seed, { type: "start_revision", name: "x", color: "puce" }, NOW).state.revision?.color).toBe("blue");
    expect(applyCommand(started.state, { type: "end_revision" }, NOW).state.revision).toBeNull();
  });

  it("fills lock and revision in for older boards (tenth migration)", () => {
    const seed = seedState();
    const { lock: _lock, revision: _revision, ...old } = seed;
    const repaired = normalizeState(old as never);
    expect(repaired.lock).toBeNull();
    expect(repaired.revision).toBeNull();
    expect(normalizeState(repaired)).toBe(repaired);
  });
});

describe("formatMinutes: a page a minute", () => {
  it("rounds eighths to whole minutes, and turns to hours past sixty", () => {
    expect(formatMinutes(0)).toBe("0 minutes");
    expect(formatMinutes(8)).toBe("1 minute");
    expect(formatMinutes(17 * 8 + 4)).toBe("17 minutes");
    expect(formatMinutes(17 * 8 + 7)).toBe("17 minutes");
    expect(formatMinutes(60 * 8)).toBe("1 hour");
    expect(formatMinutes(120 * 8)).toBe("2 hours");
    expect(formatMinutes(124 * 8)).toBe("2 h 4 min");
  });
});

describe("leaving a question (R53)", () => {
  it("writes the writer's word on the wall, replaces it for the same question, and takes it back", () => {
    let state = emptyState();
    const left = applyCommand(state, { type: "leave_question", kind: "sag", ids: ["a", "b"], text: "About 7 pages run…" }, NOW);
    expect(left.changed).toBe(true);
    expect(left.state.left).toEqual([{ kind: "sag", ids: ["a", "b"], text: "About 7 pages run…", since: NOW }]);
    state = left.state;
    // The same question left again with new words replaces the entry, never doubles it.
    state = applyCommand(state, { type: "leave_question", kind: "sag", ids: ["a", "b"], text: "About 9 pages run…" }, NOW).state;
    expect(state.left).toHaveLength(1);
    expect(state.left[0].text).toBe("About 9 pages run…");
    state = applyCommand(state, { type: "leave_question", kind: "empty", ids: ["b", "c"], text: "Nothing runs between…" }, NOW).state;
    expect(state.left).toHaveLength(2);
    // Nothing to leave without a kind and words.
    expect(applyCommand(state, { type: "leave_question", kind: "", ids: [], text: "" }, NOW).changed).toBe(false);
    // ask_again by kind and ids, or by kind alone.
    const again = applyCommand(state, { type: "ask_again", kind: "sag", ids: ["a", "b"] }, NOW);
    expect(again.changed).toBe(true);
    expect(again.state.left.map((item) => item.kind)).toEqual(["empty"]);
    expect(applyCommand(again.state, { type: "ask_again", kind: "sag" }, NOW).changed).toBe(false);
    expect(applyCommand(again.state, { type: "ask_again", kind: "empty" }, NOW).state.left).toEqual([]);
  });

  it("fills left in for older boards and drops entries that are not questions (eleventh migration)", () => {
    const { left: _drop, ...older } = seedState(NOW);
    const filled = normalizeState(older as unknown as BoardState);
    expect(filled.left).toEqual([]);
    const messy = { ...seedState(NOW), left: [{ kind: "sag", ids: ["a"], text: "x", since: NOW }, { kind: 3 }, "no"] };
    expect(normalizeState(messy as unknown as BoardState).left).toEqual([{ kind: "sag", ids: ["a"], text: "x", since: NOW }]);
  });
});

describe("when a scene happens (R55)", () => {
  const board = () => boardOf({ id: "a", x: 0, y: 0 }, { id: "b", x: 400, y: 0 });

  it("is empty on a new card and on a card written before it, and claims nothing", () => {
    expect(board().notes[0].when).toBe("");
    const old = { ...board(), notes: board().notes.map((note) => { const { when: _w, ...rest } = note; return rest; }) } as unknown as BoardState;
    expect(normalizeState(old).notes[0].when).toBe("");
  });

  it("is set on cards, cleaned, cleared with an empty string, and carried by create_note and update_note", () => {
    const set = applyCommand(board(), { type: "set_when", ids: ["a", "b"], when: "  day four,   night " }, NOW);
    expect(set.changed).toBe(true);
    expect(set.result).toHaveLength(2);
    expect(set.state.notes.map((note) => note.when)).toEqual(["day four, night", "day four, night"]);
    expect(applyCommand(set.state, { type: "set_when", ids: ["a"], when: "day four, night" }, NOW).state).toBe(set.state);
    const cleared = run(set.state, { type: "set_when", ids: ["a"], when: "" });
    expect(cleared.notes[0].when).toBe("");
    const made = run(cleared, { type: "create_note", id: "c", x: 800, y: 0, when: "dawn" });
    expect(made.notes.find((note) => note.id === "c")?.when).toBe("dawn");
    const updated = run(made, { type: "update_note", id: "c", when: "dusk" });
    expect(updated.notes.find((note) => note.id === "c")?.when).toBe("dusk");
    expect(applyCommand(board(), { type: "set_when", ids: ["ghost"], when: "night" }, NOW).changed).toBe(false);
  });
});

describe("a left question carries the writer's reason (round fourteen, entry 23)", () => {
  it("keeps why when given and leaves it out when not", () => {
    const state = boardOf({ id: "a", x: 0, y: 0 });
    const withWhy = applyCommand(state, { type: "leave_question", kind: "sag", ids: ["a"], text: "Q?", why: " the third act is the third act " }, NOW);
    expect(withWhy.state.left[0]).toEqual({ kind: "sag", ids: ["a"], text: "Q?", since: NOW, why: "the third act is the third act" });
    expect(normalizeState(withWhy.state).left[0].why).toBe("the third act is the third act");
    const without = applyCommand(state, { type: "leave_question", kind: "sag", ids: ["a"], text: "Q?" }, NOW);
    expect("why" in without.state.left[0]).toBe(false);
  });
});
