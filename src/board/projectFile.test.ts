import { describe, expect, it } from "vitest";
import { applyCommand, emptyState } from "./reducer";
import { addBoard, emptyProject, renameProject } from "./project";
import { fromProjectFile, isProjectFile, toProjectFile } from "./projectFile";

describe("the project as a file", () => {
  it("round-trips a project of two boards, its cards and its reminders", () => {
    let project = renameProject(emptyProject(), "Low Season");
    const first = project.activeBoardId;
    project = addBoard(project, "Episode two").project;
    const second = project.boards[1].id;
    let wall = emptyState();
    wall = applyCommand(wall, { type: "create_note", headline: "Nessa comes back", change: "She decides to sell.", x: 0, y: 0, rank: "beat" }).state;
    const reminders = [{ id: "r1", text: "One card, one change." }];
    const file = toProjectFile({ project, boards: { [first]: wall, [second]: emptyState() }, reminders, exportedAt: "2026-09-13T00:00:00.000Z" });
    expect(isProjectFile(file)).toBe(true);
    expect(file.version).toBe(2);
    expect(Object.keys(file.storage).sort()).toEqual(["plotcoder.board." + first, "plotcoder.board." + second, "plotcoder.project", "plotcoder.reminders"].sort());
    const back = fromProjectFile(JSON.parse(JSON.stringify(file)));
    expect(back).not.toBeNull();
    expect(back!.project.name).toBe("Low Season");
    expect(back!.project.boards.map((board) => board.id)).toEqual([first, second]);
    expect(back!.boards[first].notes[0].headline).toBe("Nessa comes back");
    expect(back!.boards[second].notes).toEqual([]);
    expect(back!.reminders).toEqual(reminders);
  });

  it("opens a version 1 file as a one-board project", () => {
    const file = {
      app: "plotcoder",
      version: 1,
      exportedAt: "2026-09-12T00:00:00.000Z",
      storage: {
        "plotcoder.notes": JSON.stringify([{ id: "n1", headline: "The gate", change: "Miguel checks the glovebox.", x: 0, y: 0 }]),
        "plotcoder.groups": "[]",
        "plotcoder.arrows": "[]",
        "plotcoder.logline": "Who pays?",
      },
    };
    const back = fromProjectFile(file);
    expect(back).not.toBeNull();
    expect(back!.project.boards).toHaveLength(1);
    const board = back!.boards[back!.project.activeBoardId];
    expect(board.notes[0].headline).toBe("The gate");
    expect(board.logline).toBe("Who pays?");
  });

  it("refuses what is not a project file, and a file with nothing in it", () => {
    expect(fromProjectFile({ hello: "world" })).toBeNull();
    expect(fromProjectFile({ app: "plotcoder", version: 2, exportedAt: "x", storage: { "plotcoder.theme": "\"dark\"" } })).toBeNull();
    expect(isProjectFile(null)).toBe(false);
  });
});
