import { describe, expect, it } from "vitest";
import { applyCommand, emptyState, noteEighths, type BoardState, type Command } from "./reducer";
import { carryShots, describeShots, findShot, newShotId, parseShotLine, placeShots, rewriteShot, shotBrief, shotLine, shotPrompt, shotsOfText, shotSubject } from "./shots";
import { describeChange } from "./record";
import { fromFountain } from "./fountain";
import { readWall } from "./readWall";

const NOW = "2026-09-27T18:00:00.000Z";
const run = (state: BoardState, ...commands: Command[]) => commands.reduce((current, command) => applyCommand(current, command, NOW).state, state);

const PAGE = ["Rain on the one window. NELL sets the ledger on the desk.", "", "ADA", "You kept it.", "", "NELL", "Somebody had to.", "", "Ada turns the ledger to face her."].join("\n");
const SHOTS = [
  { what: "wide on the office, rain on the window", at: "Rain on the one window", seconds: 5 },
  { what: "close on Nell's hand on the ledger", at: "you kept it", move: "slow push in", seconds: 4 },
  { what: "over Ada's shoulder, the ledger turning", at: "Ada turns the ledger" },
];
let seed = 0;
const random = () => ((seed += 7) % 31) / 31;

describe("a shot is a line of the script (R80)", () => {
  it("reads and writes a shot line, the move and the length optional", () => {
    expect(parseShotLine("[[shot k3f9: close on Nell's hand · slow push in · 4s]]")).toEqual({ id: "k3f9", what: "close on Nell's hand", move: "slow push in", seconds: 4 });
    expect(parseShotLine("  [[ Shot AB23 : the slip, empty ]] ")).toEqual({ id: "ab23", what: "the slip, empty", move: "", seconds: null });
    expect(parseShotLine("[[with Nell]]")).toBeNull();
    expect(parseShotLine("Nell takes a shot k3f9: no.")).toBeNull();
    expect(shotLine({ id: "K3F9", what: "close on  the ledger ]] ", move: "push · in", seconds: 4.26 })).toBe("[[shot k3f9: close on the ledger · push, in · 4.3s]]");
    expect(shotSubject("K3F9")).toBe("shot:k3f9");
  });

  it("makes an id no other shot has, in letters that are not mistaken for each other", () => {
    const id = newShotId(["abcd"], random);
    expect(id).toMatch(/^[a-hj-km-np-z2-9]{4}$/);
    expect(newShotId([id], () => 0)).not.toBe(id);
  });

  it("places each shot above the line its words quote, in order, and guesses at none", () => {
    const { text, placed, missing } = placeShots(PAGE, [...SHOTS, { what: "the gull on the sill", at: "a gull lands" }], { random });
    expect(placed).toHaveLength(3);
    expect(missing).toEqual([{ what: "the gull on the sill", at: "a gull lands" }]);
    const { shots, before } = shotsOfText(text);
    expect(before).toBe("");
    expect(shots.map((shot) => shot.what)).toEqual(SHOTS.map((shot) => shot.what));
    expect(shots[0].covers).toBe("Rain on the one window. NELL sets the ledger on the desk.");
    expect(shots[1].covers).toBe("ADA\nYou kept it.\n\nNELL\nSomebody had to.");
    expect(shots[2].covers).toBe("Ada turns the ledger to face her.");
    // The page under the shots is the page as it was.
    expect(text.split("\n").filter((line) => !parseShotLine(line)).join("\n").replace(/\n{3,}/g, "\n\n").trim()).toBe(PAGE);
    // A shot line is a paragraph of its own, above the cue and never between a cue and its speech.
    expect(text).toContain(`\n\n${shotLine(placed[1])}\n\nADA\nYou kept it.`);
    // Taken out, every one, the page is the page.
    expect(placed.reduce((page, shot) => rewriteShot(page, shot.id, { remove: true }).text, text)).toBe(PAGE);
  });

  it("replaces a scene's shots, keeping the id that is passed", () => {
    const first = placeShots(PAGE, SHOTS, { random });
    const keep = first.placed[1].id;
    const again = placeShots(first.text, [{ what: "the whole scene in one", at: "Rain on" }, { id: keep, what: "close on the ledger", at: "You kept it" }], { replace: true, random, taken: first.placed.map((shot) => shot.id).filter((id) => id !== keep) });
    expect(shotsOfText(again.text).shots.map((shot) => shot.id)).toEqual([again.placed[0].id, keep]);
    expect(first.placed.map((shot) => shot.id)).not.toContain(again.placed[0].id);
  });

  it("rewrites one shot, clears its length, and takes it out", () => {
    const { text, placed } = placeShots(PAGE, SHOTS, { random });
    const changed = rewriteShot(text, placed[1].id, { move: "static", seconds: null });
    expect(changed.now).toEqual({ id: placed[1].id, what: "close on Nell's hand on the ledger", move: "static", seconds: null });
    const gone = rewriteShot(changed.text, placed[1].id, { remove: true });
    expect(shotsOfText(gone.text).shots.map((shot) => shot.id)).toEqual([placed[0].id, placed[2].id]);
    expect(rewriteShot(text, "zzzz", { what: "x" })).toEqual({ text, was: null, now: null });
  });

  it("keeps the shots when the page is resent without them, and puts a shot whose line is gone at the end", () => {
    const { text, placed } = placeShots(PAGE, SHOTS, { random });
    const resent = PAGE.replace("Ada turns the ledger to face her.", "Ada closes it.");
    const kept = carryShots(text, resent);
    expect(kept.carried).toEqual([{ id: placed[0].id, placed: true }, { id: placed[1].id, placed: true }, { id: placed[2].id, placed: false }]);
    const { shots } = shotsOfText(kept.text);
    expect(shots.map((shot) => shot.id)).toEqual(placed.map((shot) => shot.id));
    expect(shots[1].covers).toContain("Ada closes it.");
    // A text that carries the lines is left as it is.
    expect(carryShots(text, text)).toEqual({ text, carried: [] });
  });
});

describe("the wall with shots on it (R80)", () => {
  const wall = () => {
    const base = run(
      emptyState(),
      { type: "add_character", id: "nell", name: "Nell Carrow" },
      { type: "add_character", id: "ada", name: "Ada Finch" },
      { type: "update_character", id: "nell", looks: "Forty, oilskin, a burn on the left wrist" },
      { type: "create_note", id: "col", x: 0, y: 0, headline: "Ada's column", change: "Ada sees the ledger was kept.", characterIds: ["nell", "ada"] },
      { type: "set_location", ids: ["col"], location: "INT. THE HARBOUR OFFICE" },
      { type: "set_when", ids: ["col"], when: "night" },
      { type: "set_light", ids: ["col"], light: "rain, one lamp" },
      { type: "set_text", id: "col", text: PAGE },
    );
    const placed = placeShots(PAGE, SHOTS, { random });
    return { before: base, state: run(base, { type: "set_text", id: "col", text: placed.text }), ids: placed.placed.map((shot) => shot.id) };
  };

  it("measures, reads and asks of the scene as it did before its shots", () => {
    const { before, state } = wall();
    expect(noteEighths(state.notes[0])).toBe(noteEighths(before.notes[0]));
    expect(readWall(state).findings).toEqual(readWall(before).findings);
  });

  it("says on the record that a scene was broken into shots, not that its page changed", () => {
    const { before, state, ids } = wall();
    expect(describeChange(before, state).lines).toEqual(['broke "Ada\'s column" into 3 shots']);
    const fewer = run(state, { type: "set_text", id: "col", text: rewriteShot(state.notes[0].text, ids[0], { remove: true }).text });
    expect(describeChange(state, fewer).lines).toEqual(['changed the shots of "Ada\'s column" (3 to 2)']);
  });

  it("says the shots' seconds against the scene's, and which have no length, as facts", () => {
    const { state } = wall();
    const [scene] = describeShots(state);
    expect(scene).toMatchObject({ headline: "Ada's column", written: true, seconds: 9, unsaid: 1, uncovered: false });
    expect(scene.sceneSeconds).toBe(Math.round((noteEighths(state.notes[0]) / 8) * 60));
  });

  it("briefs one shot in the wall's words, names who is in it, and says what the wall does not hold", () => {
    const { state, ids } = wall();
    const options = { look: "35mm, desaturated greens --sref 1234", places: [{ name: "INT. THE HARBOUR OFFICE", looks: "One room over the slip", sound: "", notes: "", open: "" }], title: "The Survey", order: state.notes };
    expect(findShot(state, `shot:${ids[1]}`)?.number).toBe(2);
    expect(shotPrompt(state, ids[1], options)).toBe("close on Nell's hand on the ledger. INT. THE HARBOUR OFFICE: One room over the slip. Nell Carrow: Forty, oilskin, a burn on the left wrist. night, rain, one lamp. 35mm, desaturated greens --sref 1234.");
    const brief = shotBrief(state, ids[1], options) ?? "";
    expect(brief).toContain(`SHOT ${ids[1]}: shot 2 of 3 in "Ada's column" [[id: col]] — scene 1 of 1 on "The Survey"`);
    expect(brief).toContain("THE MOVE: slow push in");
    expect(brief).toContain("LENGTH: 4 seconds");
    expect(brief).toContain("FIRST FRAME: (no still filed yet)");
    expect(brief).toContain("THE SCRIPT IT COVERS:\nADA\nYou kept it.");
    // Nell and Ada are both named in the stretch; Ada has no looks, and the brief says so rather than inventing them.
    expect(brief).toContain("Ada Finch — (no looks on their page)");
    expect(brief).toContain("NOT ON THE WALL: what Ada Finch looks like.");
    expect(shotBrief(state, "zzzz", options)).toBeNull();
  });

  it("comes back from a Fountain file with its shot lines where they stood", () => {
    const { state } = wall();
    const parsed = fromFountain(`.INT. THE HARBOUR OFFICE - NIGHT\n\n[[with Nell, Ada]]\n\n${state.notes[0].text}\n`);
    expect(parsed.scenes[0].text).toBe(state.notes[0].text);
    expect(parsed.scenes[0].notes).toEqual(["with Nell, Ada"]);
  });
});
