import { describe, expect, it } from "vitest";
import { emptyState } from "./reducer";
import {
  castElsewhere,
  landingsOn,
  laterBoards,
  liftCast,
  mergeRoster,
  sameRoster,
  withRoster,
  addBoard,
  emptyProject,
  findBoard,
  isProjectRecord,
  moveBoard,
  normalizeProject,
  PROJECT_VERSION,
  removeBoard,
  renameBoard,
  renameProject,
  setActiveBoard,
  setPremise,
  type ProjectRecord,
  reidentifyProject,
  addStructure,
  removeStructure,
  scriptTitles,
  setPremiseOpen,
  setBoardNameOpen,
  setProjectNameOpen,
} from "./project";

const NOW = "2026-01-01T00:00:00.000Z";
const LATER = "2026-01-02T00:00:00.000Z";

function season(): ProjectRecord {
  let project = emptyProject(NOW);
  project = renameProject(project, "The Letter", NOW);
  project = renameBoard(project, project.boards[0].id, "Episode 1", NOW);
  project = addBoard(project, "Episode 2", NOW).project;
  project = addBoard(project, "Episode 3", NOW).project;
  return project;
}

describe("emptyProject", () => {
  it("starts with one board, open, and a fallback name", () => {
    const project = emptyProject(NOW);
    expect(project.version).toBe(PROJECT_VERSION);
    expect(project.name).toBe("Untitled project");
    expect(project.premise).toBe("");
    expect(project.boards).toHaveLength(1);
    expect(project.boards[0].name).toBe("Board 1");
    expect(project.activeBoardId).toBe(project.boards[0].id);
  });
});

describe("addBoard", () => {
  it("adds after the others, names it, and opens it", () => {
    const { project, board } = addBoard(emptyProject(NOW), "  Episode 2 ", LATER);
    expect(board.name).toBe("Episode 2");
    expect(project.boards.map((item) => item.name)).toEqual(["Board 1", "Episode 2"]);
    expect(project.activeBoardId).toBe(board.id);
    expect(project.updatedAt).toBe(LATER);
  });

  it("names an unnamed board by its number", () => {
    const { board } = addBoard(emptyProject(NOW), "", NOW);
    expect(board.name).toBe("Board 2");
  });
});

describe("open fields on the project (R61)", () => {
  it("leaves the premise open in the writer's words, a premise decides it, and a load repairs the shape", () => {
    const project = emptyProject(NOW);
    const open = setPremiseOpen(setPremise(project, "The third year", NOW), "  the buyer:  housing, or a supermarket ", LATER);
    expect(open.premise).toBe("");
    expect(open.premiseOpen).toBe("the buyer: housing, or a supermarket");
    expect(setPremiseOpen(open, "the buyer: housing, or a supermarket", LATER)).toBe(open);
    const decided = setPremise(open, "The land is going for housing", LATER);
    expect(decided.premiseOpen).toBe("");
    expect(setPremise(decided, "", LATER).premiseOpen).toBe("");
    const blank = setPremiseOpen(open, "", LATER);
    expect(blank.premise).toBe("");
    expect(blank.premiseOpen).toBe("");
    const old = JSON.parse(JSON.stringify(project));
    delete old.premiseOpen;
    delete old.boards[0].nameOpen;
    const fixed = normalizeProject(old, NOW);
    expect(fixed.premiseOpen).toBe("");
    expect(fixed.boards[0].nameOpen).toBe("");
  });

  it("leaves the project's name open while the name stands, and a rename decides it", () => {
    const project = emptyProject(NOW);
    const open = setProjectNameOpen(project, " The Allotments, or  Plot 14 ", LATER);
    expect(open.name).toBe("Untitled project");
    expect(open.nameOpen).toBe("The Allotments, or Plot 14");
    expect(setProjectNameOpen(open, "The Allotments, or Plot 14", LATER)).toBe(open);
    const named = renameProject(open, "Plot 14", LATER);
    expect(named.nameOpen).toBe("");
    expect(renameProject(open, "Untitled project", LATER).nameOpen).toBe("");
    const old = JSON.parse(JSON.stringify(project));
    delete old.nameOpen;
    expect(normalizeProject(old, NOW).nameOpen).toBe("");
  });

  it("leaves a board's name open while the name stands, and a rename decides it", () => {
    const project = emptyProject(NOW);
    const id = project.boards[0].id;
    const open = setBoardNameOpen(project, id, "the title, or \"Feature\"", LATER);
    expect(open.boards[0].name).toBe("Board 1");
    expect(open.boards[0].nameOpen).toBe("the title, or \"Feature\"");
    expect(setBoardNameOpen(open, id, "the title, or \"Feature\"", LATER)).toBe(open);
    expect(setBoardNameOpen(open, "nope", "x", LATER)).toBe(open);
    const named = renameBoard(open, id, "Plot 14", LATER);
    expect(named.boards[0].nameOpen).toBe("");
    // The same name again, while open, still decides it.
    const sameName = renameBoard(open, id, "Board 1", LATER);
    expect(sameName.boards[0].nameOpen).toBe("");
    const { board } = addBoard(project, "", NOW, "an episode, or the film");
    expect(board.name).toBe("Board 2");
    expect(board.nameOpen).toBe("an episode, or the film");
  });
});

describe("renameBoard and renameProject", () => {
  it("rename, trim, and do nothing for a blank or the same name", () => {
    const project = emptyProject(NOW);
    const id = project.boards[0].id;
    const renamed = renameBoard(project, id, "  The piano ", LATER);
    expect(renamed.boards[0].name).toBe("The piano");
    expect(renamed.boards[0].updatedAt).toBe(LATER);
    expect(renameBoard(renamed, id, "   ", LATER)).toBe(renamed);
    expect(renameBoard(renamed, id, "The piano", LATER)).toBe(renamed);
    expect(renameBoard(renamed, "nope", "X", LATER)).toBe(renamed);

    const named = renameProject(project, " The Letter ", LATER);
    expect(named.name).toBe("The Letter");
    expect(renameProject(named, "", LATER)).toBe(named);
  });
});

describe("removeBoard", () => {
  it("removes a board and opens the one before it when the open one goes", () => {
    const project = season();
    const [first, second, third] = project.boards;
    const opened = setActiveBoard(project, third.id, NOW);
    const removed = removeBoard(opened, third.id, LATER);
    expect(removed.boards.map((board) => board.id)).toEqual([first.id, second.id]);
    expect(removed.activeBoardId).toBe(second.id);

    const removedFirst = removeBoard(removed, first.id, LATER);
    expect(removedFirst.activeBoardId).toBe(second.id);
  });

  it("never removes the last board", () => {
    const project = emptyProject(NOW);
    expect(removeBoard(project, project.boards[0].id, LATER)).toBe(project);
  });
});

describe("moveBoard", () => {
  it("moves a board up or down and stops at the ends", () => {
    const project = season();
    const [a, b, c] = project.boards.map((board) => board.id);
    expect(moveBoard(project, c, -1, NOW).boards.map((board) => board.id)).toEqual([a, c, b]);
    expect(moveBoard(project, a, 1, NOW).boards.map((board) => board.id)).toEqual([b, a, c]);
    expect(moveBoard(project, a, -1, NOW)).toBe(project);
    expect(moveBoard(project, c, 1, NOW)).toBe(project);
    expect(moveBoard(project, "nope", 1, NOW)).toBe(project);
  });
});

describe("setActiveBoard and setPremise", () => {
  it("open a board that exists, and leave the record alone otherwise", () => {
    const project = season();
    const second = project.boards[1].id;
    expect(setActiveBoard(project, second, LATER).activeBoardId).toBe(second);
    expect(setActiveBoard(project, "nope", LATER)).toBe(project);
    expect(setActiveBoard(project, project.activeBoardId, LATER)).toBe(project);
  });

  it("trims the premise and treats an unchanged premise as no change", () => {
    const project = emptyProject(NOW);
    const set = setPremise(project, "  A family that lies. ", LATER);
    expect(set.premise).toBe("A family that lies.");
    expect(setPremise(set, "A family that lies.", LATER)).toBe(set);
  });
});

describe("findBoard", () => {
  it("finds by id, by name in any case, or by number", () => {
    const project = season();
    const second = project.boards[1];
    expect(findBoard(project, second.id)).toBe(second);
    expect(findBoard(project, "episode 2")).toBe(second);
    expect(findBoard(project, "2")).toBe(second);
    expect(findBoard(project, "9")).toBeNull();
    expect(findBoard(project, "")).toBeNull();
  });
});

describe("normalizeProject", () => {
  it("returns an empty project for anything that is not a record", () => {
    expect(normalizeProject(null, NOW).boards).toHaveLength(1);
    expect(normalizeProject({ premise: "old shape" }, NOW).name).toBe("Untitled project");
    expect(isProjectRecord({ premise: "old shape" })).toBe(false);
  });

  it("repairs a damaged record without losing what it can keep", () => {
    const project = season();
    const damaged = {
      ...project,
      name: "  ",
      premise: 7,
      boards: [project.boards[0], { id: 3, name: "bad" }, { id: "x", name: "  " }],
      activeBoardId: "gone",
      extra: "kept",
    };
    const fixed = normalizeProject(damaged, NOW);
    expect(fixed.name).toBe("Untitled project");
    expect(fixed.premise).toBe("");
    expect(fixed.boards.map((board) => board.name)).toEqual(["Episode 1", "Board"]);
    expect(fixed.activeBoardId).toBe(project.boards[0].id);
    expect((fixed as unknown as { extra: string }).extra).toBe("kept");
  });

  it("gives a record with no boards a board", () => {
    const fixed = normalizeProject({ id: "p", boards: [] }, NOW);
    expect(fixed.boards).toHaveLength(1);
    expect(fixed.activeBoardId).toBe(fixed.boards[0].id);
  });
});

describe("reidentifyProject (R40)", () => {
  it("keeps everything but the id, which is fresh", () => {
    const project = renameProject(emptyProject("2026-01-01T00:00:00.000Z"), "The Letter");
    const fresh = reidentifyProject(project, "2026-02-01T00:00:00.000Z");
    expect(fresh.id).not.toBe(project.id);
    expect(fresh.name).toBe("The Letter");
    // Every board too, with the open one still the open one, and a map back.
    expect(fresh.boards).toHaveLength(project.boards.length);
    expect(fresh.boards[0].id).not.toBe(project.boards[0].id);
    expect(fresh.boards[0].name).toBe(project.boards[0].name);
    expect(fresh.activeBoardId).toBe(fresh.boards[0].id);
    expect(fresh.renamed[project.boards[0].id]).toBe(fresh.boards[0].id);
    expect(fresh.updatedAt).toBe("2026-02-01T00:00:00.000Z");
    // The map is not part of the record once normalized.
    expect("renamed" in normalizeProject(fresh)).toBe(false);
  });
});

describe("a writer's own structures (Roadmap 2, item 7)", () => {
  it("saves beats on the project, forgets one, and normalizes a record without any", () => {
    const base = emptyProject("2026-01-01T00:00:00.000Z");
    const { project, structure } = addStructure(base, "  Robert's turns ", [{ name: "The turn", prompt: "What turns?", at: 0.5 }]);
    expect(structure.name).toBe("Robert's turns");
    expect(project.structures).toHaveLength(1);
    expect(normalizeProject(project).structures).toEqual(project.structures);
    expect(normalizeProject(base).structures).toEqual([]);
    expect(removeStructure(project, structure.id).structures).toEqual([]);
    expect(removeStructure(project, "nope")).toBe(project);
  });
});

describe("one cast for the project (R51)", () => {
  const NOW = "2026-09-14T00:00:00.000Z";
  const person = (id: string, name: string, notes = "") => ({ id, name, looks: "", voice: "", wants: "", needs: "", notes, createdAt: NOW, updatedAt: NOW });
  const card = (id: string, characterIds: string[]) => ({
    id, headline: id, change: "Turns.", color: "yellow" as const, x: 0, y: 0, rotate: 0, z: 1, rank: "scene" as const, lengthEighths: null, characterIds, plants: false, plantsWhat: "", payoffBoardId: null, payoffNoteId: null, open: "", location: "", locationOpen: "", when: "", whenOpen: "", text: "", createdAt: NOW, updatedAt: NOW,
  });

  it("lifts the boards' rosters onto a record written before it, merging by name and recasting folded ids", () => {
    const project = { ...emptyProject(NOW), boards: [{ id: "pilot", name: "Pilot", nameOpen: "", createdAt: NOW, updatedAt: NOW }, { id: "ep2", name: "Episode two", nameOpen: "", createdAt: NOW, updatedAt: NOW }], activeBoardId: "pilot" };
    delete (project as { characters?: unknown }).characters;
    const boards = {
      pilot: { ...emptyState(), characters: [person("n1", "Nessa Boyd"), person("d1", "Dessie Kane", "a bad knee")], notes: [card("a", ["n1", "d1"])] },
      ep2: { ...emptyState(), characters: [person("n2", "nessa boyd", "back after fourteen years"), person("f1", "Fiona Boyd")], notes: [card("b", ["n2", "f1"])] },
    };
    const lifted = liftCast(project, boards, NOW);
    expect(lifted.changed).toBe(true);
    expect(lifted.project.characters?.map((item) => item.id)).toEqual(["n1", "d1", "f1"]);
    // The first board's record keeps its id; a page line fills from the board that had it.
    expect(lifted.project.characters?.[0].notes).toBe("back after fourteen years");
    expect(lifted.boards.ep2.notes[0].characterIds).toEqual(["n1", "f1"]);
    expect(lifted.boards.ep2.characters).toBe(lifted.project.characters);
    // Lifted once, a second lift composes and changes nothing.
    const again = liftCast(lifted.project, lifted.boards, NOW);
    expect(again.changed).toBe(false);
    expect(again.project).toBe(lifted.project);
  });

  it("composes a board with the project's cast and drops a cast id the project no longer has", () => {
    const project = { ...emptyProject(NOW), characters: [person("n1", "Nessa Boyd")] };
    const state = { ...emptyState(), characters: [person("n1", "Nessa Boyd"), person("t1", "Tom")], notes: [card("a", ["n1", "t1"])] };
    const composed = withRoster(state, project);
    expect(composed.characters).toEqual(project.characters);
    expect(composed.notes[0].characterIds).toEqual(["n1"]);
    expect(withRoster(composed, project)).toBe(composed);
    expect(sameRoster(project.characters, [person("n1", "Nessa Boyd")])).toBe(true);
    expect(sameRoster(project.characters, [person("n1", "Nessa")])).toBe(false);
  });

  it("merges a board's own roster into the project's, keeping the record a name already has", () => {
    const project = { ...emptyProject(NOW), characters: [person("n1", "Nessa Boyd", "kept")] };
    const state = { ...emptyState(), characters: [person("n9", "Nessa Boyd"), person("f1", "Fiona Boyd")], notes: [card("a", ["n9", "f1"])] };
    const merged = mergeRoster(project, state, NOW);
    expect(merged.project.characters?.map((item) => item.id)).toEqual(["n1", "f1"]);
    expect(merged.project.characters?.[0].notes).toBe("kept");
    expect(merged.state.notes[0].characterIds).toEqual(["n1", "f1"]);
    expect(merged.state.characters).toBe(merged.project.characters);
    // Nothing new: the same record and a composed state.
    const same = mergeRoster(merged.project, merged.state, NOW);
    expect(same.project).toBe(merged.project);
  });

  it("says who is on a card of another board, and leaves the cast absent from a record that has none", () => {
    const project = { ...emptyProject(NOW), boards: [{ id: "pilot", name: "Pilot", nameOpen: "", createdAt: NOW, updatedAt: NOW }, { id: "ep2", name: "Episode two", nameOpen: "", createdAt: NOW, updatedAt: NOW }], activeBoardId: "ep2" };
    const boards = { pilot: { ...emptyState(), notes: [card("a", ["n1", "d1"]), card("b", ["n1"])] }, ep2: { ...emptyState(), notes: [] } };
    expect(castElsewhere(project, boards, "ep2")).toEqual({ n1: [{ board: "Pilot", boardId: "pilot", cards: 2 }], d1: [{ board: "Pilot", boardId: "pilot", cards: 1 }] });
    expect(castElsewhere(project, boards, "pilot")).toEqual({});
  });

  it("composes what lands on a board from the other boards' folds (R58): paid where a scene here claims it, waiting otherwise", () => {
    const project = { ...emptyProject(NOW), boards: [{ id: "pilot", name: "Pilot", nameOpen: "", createdAt: NOW, updatedAt: NOW }, { id: "ep2", name: "Episode two", nameOpen: "", createdAt: NOW, updatedAt: NOW }], activeBoardId: "ep2" };
    const fold = (id: string, headline: string, payoffNoteId: string | null) => ({ ...card(id, []), headline, color: "yellow" as const, plants: true, payoffBoardId: "ep2", payoffNoteId });
    const boards = {
      pilot: { ...emptyState(), notes: [fold("p1", "The ledger", "e1"), fold("p2", "The letter", null), fold("p3", "The shim", "gone"), { ...card("p4", []), plants: true, payoffBoardId: null, payoffNoteId: null }] },
      ep2: { ...emptyState(), notes: [card("e1", []), card("e2", [])] },
    };
    const landings = landingsOn(project, boards, "ep2");
    expect(landings.paid).toEqual([{ id: "e1", fromBoardId: "pilot", fromBoardName: "Pilot", fromNoteId: "p1", fromHeadline: "The ledger", fromColor: "yellow" }]);
    expect(landings.waiting.map((item) => [item.fromNoteId, item.id])).toEqual([["p2", null], ["p3", "gone"]]);
    expect(landingsOn(project, boards, "pilot")).toEqual({ paid: [], waiting: [] });
    expect(laterBoards(project, boards)).toEqual({ pilot: { name: "Pilot", cards: 4, noteIds: ["p1", "p2", "p3", "p4"] }, ep2: { name: "Episode two", cards: 2, noteIds: ["e1", "e2"] } });
    const bare = normalizeProject({ id: "p", boards: [{ id: "b", name: "B" }] } as unknown as Parameters<typeof normalizeProject>[0], NOW);
    expect("characters" in bare).toBe(false);
    expect(normalizeProject({ ...bare, characters: [person("n1", "Nessa"), { id: 3 }] } as unknown as Parameters<typeof normalizeProject>[0], NOW).characters).toEqual([person("n1", "Nessa")]);
  });
});

describe("scriptTitles (round thirteen, entry 26)", () => {
  const board = (name: string) => ({ id: name.toLowerCase(), name, nameOpen: "", createdAt: NOW, updatedAt: NOW });

  it("titles a one-board film for its project, an episode for its board with the project beside it, and an untitled project's board for itself", () => {
    const film = { ...emptyProject(NOW), name: "Ninety-Nine", boards: [board("Feature")], activeBoardId: "feature" };
    expect(scriptTitles(film, film.boards[0])).toEqual({ title: "Ninety-Nine" });
    const season = { ...film, name: "Low Season", boards: [board("Pilot"), board("Episode two")] };
    expect(scriptTitles(season, season.boards[0])).toEqual({ title: "Low Season", episode: "Episode 1 of 2 · Pilot" });
    expect(scriptTitles(season, season.boards[1])).toEqual({ title: "Low Season", episode: "Episode 2 of 2 · Episode two" });
    const untitled = { ...film, name: "Untitled project" };
    expect(scriptTitles(untitled, untitled.boards[0])).toEqual({ title: "Feature" });
    expect(scriptTitles(untitled, null)).toEqual({ title: "Untitled" });
  });
});
