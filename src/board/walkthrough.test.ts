import { describe, expect, it } from "vitest";
import { applyCommand, emptyState, type BoardState, type Command } from "./reducer";
import { placeShots } from "./shots";
import { fileSlug, matchFile, referenceFileName, shotFileName, walkthrough } from "./walkthrough";
import { emptyProject, normalizeProject, setReferenceOutside } from "./project";

const NOW = "2026-09-27T19:00:00.000Z";
const run = (state: BoardState, ...commands: Command[]) => commands.reduce((current, command) => applyCommand(current, command, NOW).state, state);
const PAGE = ["Rain on the one window. NELL sets the ledger on the desk.", "", "ADA", "You kept it.", "", "Ada turns the ledger to face her."].join("\n");
let seed = 0;
const random = () => ((seed += 11) % 31) / 31;

function wall() {
  const placed = placeShots(PAGE, [{ what: "wide on the office, rain on the window", at: "Rain on" }, { what: "two-shot, Ada and Nell either side of the ledger", at: "You kept it", seconds: 8 }, { what: "close on Ada", at: "Ada turns" }], { random });
  const state = run(
    emptyState(),
    { type: "add_character", id: "nell", name: "Nell Carrick" },
    { type: "add_character", id: "ada", name: "Ada Quill" },
    { type: "add_character", id: "bram", name: "Bram Holt" },
    { type: "update_character", id: "nell", looks: "harbourmaster, 44, a coat too big for her" },
    { type: "update_character", id: "ada", looks: "book-keeper, sixties, reading glasses on a chain" },
    { type: "create_note", id: "first", x: 0, y: 0, headline: "The wall, first light", change: "A crack." },
    { type: "create_note", id: "col", x: 300, y: 0, headline: "Ada's column", change: "Ada sees it was kept.", characterIds: ["nell", "ada", "bram"] },
    { type: "set_location", ids: ["col"], location: "INT. THE HARBOUR OFFICE" },
    { type: "set_text", id: "col", text: placed.text },
  );
  return { state, ids: placed.placed.map((shot) => shot.id) };
}
const picture = (subject: string, name: string, note = "") => ({ id: `${subject}-${name}`, kind: "picture", subject, name, note, url: null });

describe("the names of the files (R80)", () => {
  it("names a person by their name, a place by its phrase, a shot by its scene, its number and its id", () => {
    expect(fileSlug("  Róisín O’Dea ")).toBe("roisin-odea");
    expect(referenceFileName("person", "Ada Quill")).toBe("ada-quill.png");
    expect(referenceFileName("place", "INT. THE HARBOUR OFFICE")).toBe("the-harbour-office.png");
    expect(referenceFileName("place", "the slip")).toBe("the-slip.png");
    expect(shotFileName(4, 2, "Q3J9")).toBe("s04-02-q3j9.png");
  });
});

describe("the walkthrough (R80): the references come before the stills", () => {
  it("lists who and where the shots name, and holds each shot until its own references are done", () => {
    const { state, ids } = wall();
    const walk = walkthrough(state, { look: "35mm, overcast", files: [] });
    // Bram is in the scene's cast and in no shot's line: he is no reference yet.
    expect(walk.people.map((item) => [item.name, item.shots, item.fileName, item.done])).toEqual([["Nell Carrick", 1, "nell-carrick.png", false], ["Ada Quill", 2, "ada-quill.png", false]]);
    expect(walk.places.map((item) => [item.key, item.fileName, item.prompt])).toEqual([["place:int. the harbour office", "the-harbour-office.png", null]]);
    expect(walk.scenes).toHaveLength(1);
    expect(walk.scenes[0]).toMatchObject({ headline: "Ada's column", number: 2, of: 2, made: 0 });
    expect(walk.scenes[0].shots.map((shot) => [shot.fileName, shot.waiting.map((item) => item.name)])).toEqual([
      [`s02-01-${ids[0]}.png`, ["INT. THE HARBOUR OFFICE"]],
      [`s02-02-${ids[1]}.png`, ["Nell Carrick", "Ada Quill", "INT. THE HARBOUR OFFICE"]],
      [`s02-03-${ids[2]}.png`, ["Ada Quill", "INT. THE HARBOUR OFFICE"]],
    ]);
    expect(walk.counts).toEqual({ people: { done: 0, of: 2 }, places: { done: 0, of: 1 }, shots: { done: 0, of: 3, waiting: 3 } });
    expect(walk.next).toBeNull();
  });

  it("takes a picture or a tick for a reference, a picture only for a shot, and says where to go next", () => {
    const { state, ids } = wall();
    const files = [picture("ada", "ada-quill.png"), picture(`shot:${ids[0]}`, "first.png"), picture(`shot:${ids[0]}`, "second.png", "chosen"), picture(`shot:${ids[0]}`, "third.png")];
    const walk = walkthrough(state, { look: "35mm, overcast", files, outside: ["place:int. the harbour office"] });
    expect(walk.people.map((item) => [item.name, item.done, item.picture?.name ?? null])).toEqual([["Nell Carrick", false, null], ["Ada Quill", true, "ada-quill.png"]]);
    expect(walk.places[0]).toMatchObject({ done: true, outside: true, picture: null });
    const [one, two, three] = walk.scenes[0].shots;
    expect(one).toMatchObject({ stills: 3, waiting: [] });
    expect(one.still?.name).toBe("second.png");
    expect(two.waiting.map((item) => item.name)).toEqual(["Nell Carrick"]);
    // The prompt leaves a person with a reference to the picture, and spells out the one without.
    expect(two.prompt).toBe("two-shot, Ada and Nell either side of the ledger. interior, the harbour office. Nell Carrick: harbourmaster, 44, a coat too big for her. Identical face and build to the reference. 35mm, overcast.");
    expect(three.prompt).toBe("close on Ada. interior, the harbour office. Identical face and build to the reference. 35mm, overcast.");
    expect(walk.next).toEqual({ scene: "col", shot: ids[2] });
    expect(walk.counts.shots).toEqual({ done: 1, of: 3, waiting: 1 });
  });

  it("signed out, knows no picture and still takes a tick", () => {
    const { state } = wall();
    const walk = walkthrough(state, { files: null, outside: ["ada", "nell", "place:int. the harbour office"] });
    expect(walk.signedIn).toBe(false);
    expect(walk.look.done).toBe(false);
    expect(walk.counts.shots.waiting).toBe(0);
  });

  it("finds the row a dropped file is for by its name, and says nothing of a name it does not know", () => {
    const { state, ids } = wall();
    const walk = walkthrough(state, { files: [] });
    expect(matchFile("Ada-Quill.PNG", walk)).toMatchObject({ kind: "reference", key: "ada" });
    expect(matchFile("the-harbour-office-2.jpg", walk)).toMatchObject({ kind: "reference", key: "place:int. the harbour office" });
    expect(matchFile(`s09-07-${ids[1]}.png`, walk)).toMatchObject({ kind: "shot", key: `shot:${ids[1]}`, scene: "col" });
    expect(matchFile(`${ids[1]}-3.webp`, walk)).toMatchObject({ kind: "shot", shot: ids[1] });
    expect(matchFile("grok-image-8841.png", walk)).toBeNull();
  });
});

describe("the tick on the project (R80)", () => {
  it("ticks a reference kept outside the app, takes the tick off, and repairs a project that has none", () => {
    const project = emptyProject(NOW);
    expect(normalizeProject({ ...project, referencesOutside: undefined }, NOW).referencesOutside).toEqual([]);
    const ticked = setReferenceOutside(project, "ada", true, NOW);
    expect(ticked.referencesOutside).toEqual(["ada"]);
    expect(setReferenceOutside(ticked, "ada", true, NOW)).toBe(ticked);
    expect(setReferenceOutside(ticked, "ada", false, NOW).referencesOutside).toEqual([]);
    expect(normalizeProject({ ...project, referencesOutside: ["ada", "ada", 3, " "] }, NOW).referencesOutside).toEqual(["ada"]);
  });
});
