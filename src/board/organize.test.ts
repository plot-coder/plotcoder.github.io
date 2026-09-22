import { describe, expect, it } from "vitest";
import { arrowOrder, organizePoses, ROW_WIDTH } from "./organize";
import {
  applyCommand,
  emptyState,
  NOTE_HEIGHT,
  NOTE_WIDTH,
  type BoardState,
  type Command,
} from "./reducer";

const NOW = "2026-01-01T00:00:00.000Z";
const STEP_X = NOTE_WIDTH + 28;
const STEP_Y = NOTE_HEIGHT + 28;

function run(state: BoardState, ...commands: Command[]) {
  return commands.reduce((current, command) => applyCommand(current, command, NOW).state, state);
}

/** Cards placed in reading order a, b, c… along one messy row. */
function wall(...ids: string[]) {
  return ids.reduce(
    (state, id, index) =>
      applyCommand(
        state,
        { type: "create_note", id, x: 100 + index * 230, y: 100 + (index % 2) * 30, headline: id },
        NOW,
      ).state,
    emptyState(),
  );
}

function follows(...pairs: Array<[string, string]>): Command[] {
  return pairs.map(([from, to]) => ({ type: "create_arrow", from, to }));
}

function poseOf(poses: ReturnType<typeof organizePoses>, id: string) {
  const pose = poses.find((item) => item.id === id);
  if (!pose) throw new Error(`no pose for ${id}`);
  return pose;
}

describe("arrowOrder", () => {
  it("is reading order when there are no arrows", () => {
    expect(arrowOrder(wall("a", "b", "c"))).toEqual(["a", "b", "c"]);
  });

  it("follows the arrows over where the cards sit", () => {
    // c sits last but the arrows say it comes first.
    const state = run(wall("a", "b", "c"), ...follows(["c", "a"], ["a", "b"]));
    expect(arrowOrder(state)).toEqual(["c", "a", "b"]);
  });

  it("places a card nothing points at last, once half the film is wired (round twenty-four, entry 21)", () => {
    const state = run(wall("a", "b", "c", "d"), ...follows(["a", "c"]));
    // b and d have no arrows and half the film is wired: they are unlinked, and come last in reading order.
    expect(arrowOrder(state)).toEqual(["a", "c", "b", "d"]);
    // Below half wired, the rows are the order and nothing is unlinked.
    const barely = run(wall("a", "b", "c", "d", "e", "f"), ...follows(["a", "c"]));
    expect(arrowOrder(barely)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("ignores setups: a payoff is not pulled forward", () => {
    const state = run(
      wall("a", "b", "c"),
      { type: "create_arrow", from: "c", to: "a", kind: "setup" },
      ...follows(["a", "b"], ["b", "c"]),
    );
    expect(arrowOrder(state)).toEqual(["a", "b", "c"]);
  });

  it("breaks a two-way pair by reading order rather than failing", () => {
    const state = run(wall("a", "b", "c"), ...follows(["a", "b"], ["b", "c"], ["c", "b"]));
    expect(arrowOrder(state)).toEqual(["a", "b", "c"]);
  });

  it("restricts itself to the ids given and ignores arrows to the rest", () => {
    const state = run(wall("a", "b", "c"), ...follows(["c", "b"], ["a", "b"]));
    expect(arrowOrder(state, ["a", "b"])).toEqual(["a", "b"]);
  });
});

describe("organizePoses without beats", () => {
  it("does not lay an unlinked card: it stays where it is, or goes beneath the rows when they would run under it (round twenty-four, entry 21)", () => {
    // a → b → c wired; "sign" on no arrow, standing where the second card of the row would be laid.
    let state = run(wall("a", "b", "c"), ...follows(["a", "b"], ["b", "c"]));
    state = run(state, { type: "create_note", id: "sign", x: 88 + STEP_X, y: 110, headline: "sign" });
    const poses = organizePoses(state);
    const sign = poseOf(poses, "sign");
    expect(sign.unlinked).toBe(true);
    expect(sign.y).toBeGreaterThan(110);
    // Out of the rows' way, it is not touched at all.
    let clear = run(wall("a", "b", "c"), ...follows(["a", "b"], ["b", "c"]));
    clear = run(clear, { type: "create_note", id: "sign", x: 2000, y: 2000, headline: "sign" });
    expect(organizePoses(clear).some((pose) => pose.id === "sign")).toBe(false);
  });

  it("wraps the arrow order into rows five cards wide from the wall's origin", () => {
    const state = run(
      wall("a", "b", "c", "d", "e", "f", "g"),
      ...follows(["g", "a"]),
    );
    const poses = organizePoses(state);
    const g = poseOf(poses, "g");
    const a = poseOf(poses, "a");
    expect([g.x, g.y]).toEqual([88, 110]);
    expect([a.x, a.y]).toEqual([88 + STEP_X, 110]);
    // Five to a row, then the next row at the left edge.
    const sixth = poses[5];
    expect([sixth.x, sixth.y]).toEqual([88, 110 + STEP_Y]);
    expect(poses.every((pose) => pose.rotate === 0)).toBe(true);
    expect(ROW_WIDTH).toBe(5 * NOTE_WIDTH + 4 * 28);
  });

  it("keeps a group together as a block where its first card falls", () => {
    const state = run(
      wall("a", "b", "c", "d"),
      ...follows(["a", "b"], ["b", "c"], ["c", "d"]),
      { type: "create_group", title: "Pair", noteIds: ["b", "d"] },
    );
    const poses = organizePoses(state);
    // b comes second; d is pulled up beside it, and c follows the block.
    expect(poses.map((pose) => pose.id)).toEqual(["a", "b", "d", "c"]);
  });
});

describe("organizePoses with beats", () => {
  it("starts a row at every beat and fills it with what follows", () => {
    const state = run(
      wall("open", "b1", "s1", "s2", "b2", "s3"),
      { type: "set_rank", ids: ["b1", "b2"], rank: "beat" },
      ...follows(["open", "b1"], ["b1", "s1"], ["s1", "s2"], ["s2", "b2"], ["b2", "s3"]),
    );
    const poses = organizePoses(state);
    // The opening scene gets a row of its own, then a row per beat.
    expect(poseOf(poses, "open")).toMatchObject({ x: 88, y: 110 });
    expect(poseOf(poses, "b1")).toMatchObject({ x: 88, y: 110 + STEP_Y });
    expect(poseOf(poses, "s1")).toMatchObject({ x: 88 + STEP_X, y: 110 + STEP_Y });
    expect(poseOf(poses, "s2")).toMatchObject({ x: 88 + 2 * STEP_X, y: 110 + STEP_Y });
    expect(poseOf(poses, "b2")).toMatchObject({ x: 88, y: 110 + 2 * STEP_Y });
    expect(poseOf(poses, "s3")).toMatchObject({ x: 88 + STEP_X, y: 110 + 2 * STEP_Y });
  });

  it("wraps a long run under itself, indented one card, never under the beat", () => {
    const ids = ["b1", "s1", "s2", "s3", "s4", "s5", "s6"];
    const state = run(
      wall(...ids),
      { type: "set_rank", ids: ["b1"], rank: "beat" },
      ...follows(...ids.slice(0, -1).map((id, index): [string, string] => [id, ids[index + 1]])),
    );
    const poses = organizePoses(state);
    expect(poseOf(poses, "s4")).toMatchObject({ x: 88 + 4 * STEP_X, y: 110 });
    // The sixth card of the run does not fit: it drops a line and indents.
    expect(poseOf(poses, "s5")).toMatchObject({ x: 88 + STEP_X, y: 110 + STEP_Y });
    expect(poseOf(poses, "s6")).toMatchObject({ x: 88 + 2 * STEP_X, y: 110 + STEP_Y });
  });

  it("organizes only a selection, from the selection's own top-left", () => {
    const state = run(
      wall("a", "b", "c", "d"),
      { type: "set_rank", ids: ["c"], rank: "beat" },
      ...follows(["d", "c"]),
    );
    const poses = organizePoses(state, { onlyIds: ["c", "d"] });
    expect(poses.map((pose) => pose.id).sort()).toEqual(["c", "d"]);
    const left = Math.min(state.notes[2].x, state.notes[3].x);
    const top = Math.min(state.notes[2].y, state.notes[3].y);
    // d comes first (it points at c), in the opening row; c, a beat, starts the next.
    expect(poseOf(poses, "d")).toMatchObject({ x: left, y: top });
    expect(poseOf(poses, "c")).toMatchObject({ x: left, y: top + STEP_Y });
  });

  it("returns nothing for an empty board or an empty selection", () => {
    expect(organizePoses(emptyState())).toEqual([]);
    expect(organizePoses(wall("a"), { onlyIds: ["nope"] })).toEqual([]);
  });

  it("never mutates the state it reads", () => {
    const state = run(wall("a", "b"), ...follows(["b", "a"]));
    const snapshot = JSON.stringify(state);
    organizePoses(state);
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe("a card set aside and the tidy (round twenty-three, entry 22)", () => {
  it("is left where the writer put it when the rows do not run under it", () => {
    const state = run(wall("a", "b", "c"), ...follows(["a", "b"], ["b", "c"]), { type: "create_note", id: "cut", headline: "cut", x: 3000, y: 3000 }, { type: "set_aside", ids: ["cut"], aside: true });
    expect(organizePoses(state).some((pose) => pose.id === "cut")).toBe(false);
  });

  it("is moved to a row of its own under the rows when they would run under it, and marked", () => {
    // The app put it "after the last card", in the first row, and the writer then cut it.
    let state = run(wall("a", "b", "c"), ...follows(["a", "b"], ["b", "c"]));
    const laid = organizePoses(state);
    const last = poseOf(laid, "c");
    state = run(state, { type: "create_note", id: "cut", headline: "cut", x: last.x + 20, y: last.y + 20 }, { type: "set_aside", ids: ["cut"], aside: true });
    const poses = organizePoses(state);
    const moved = poses.find((pose) => pose.id === "cut")!;
    expect(moved.aside).toBe(true);
    for (const pose of poses.filter((item) => item.id !== "cut")) expect(Math.abs(pose.x - moved.x) >= NOTE_WIDTH || Math.abs(pose.y - moved.y) >= NOTE_HEIGHT).toBe(true);
    expect(moved.y).toBeGreaterThan(Math.max(...poses.filter((item) => item.id !== "cut").map((pose) => pose.y)));
  });
});
