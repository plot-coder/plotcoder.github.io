import { describe, expect, it } from "vitest";
import {
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
