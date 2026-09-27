// The generator builds the same project every run, through the kernel, at the
// size pass 3a asks for (docs/plan.md, goal 3): six boards of forty written
// cards, one cast, folds across boards, and one fold nothing pays off.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fromProjectFile } from "../src/board/projectFile.js";
import { readWall } from "../src/board/readWall.js";
import { inStory, isMeasured } from "../src/board/reducer.js";

const SCRIPT = fileURLToPath(new URL("./generate-series.mjs", import.meta.url));

function generate() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-series-"));
  const out = path.join(dir, "low-water.json");
  execFileSync("node", [SCRIPT, out], { stdio: "pipe" });
  const text = fs.readFileSync(out, "utf8");
  fs.rmSync(dir, { recursive: true, force: true });
  return text;
}

describe("generate-series", () => {
  const text = generate();
  const opened = fromProjectFile(JSON.parse(text));

  it("builds six boards of forty written cards on one cast", () => {
    expect(opened).not.toBeNull();
    expect(opened.project.boards).toHaveLength(6);
    expect(opened.project.characters).toHaveLength(12);
    for (const meta of opened.project.boards) {
      const state = opened.boards[meta.id];
      expect(state.notes).toHaveLength(40);
      expect(state.notes.every((note) => inStory(note) && isMeasured(note))).toBe(true);
      expect(state.characters.map((person) => person.id)).toEqual(opened.project.characters.map((person) => person.id));
      expect(state.groups.map((group) => group.title)).toEqual(["Act One", "Act Two", "Act Three"]);
      expect(state.arrows.filter((arrow) => arrow.kind === "follows")).toHaveLength(39);
    }
  });

  it("folds pay off across boards, and the brass key never does", () => {
    const first = opened.boards[opened.project.boards[0].id];
    const key = first.notes.find((note) => note.plantsWhat.includes("brass key"));
    expect(key.plants).toBe(true);
    expect(key.payoffBoardId).toBeNull();
    expect(readWall(first).findings.some((finding) => finding.kind === "unpaid" && finding.text.includes("brass key"))).toBe(true);
    const crossing = Object.values(opened.boards).flatMap((state) => state.notes.filter((note) => note.payoffBoardId));
    expect(crossing.length).toBeGreaterThanOrEqual(4);
    expect(crossing.some((note) => note.payoffNoteId)).toBe(true);
    expect(crossing.some((note) => !note.payoffNoteId)).toBe(true);
  });

  it("drops Kit Fenn's want after the second episode", () => {
    const kit = opened.project.characters.find((person) => person.name === "Kit Fenn");
    const boards = opened.project.boards.map((meta) => opened.boards[meta.id]);
    const speaks = (state) => state.notes.some((note) => note.characterIds.includes(kit.id) && /leav|berth|winter boat/i.test(note.change));
    expect(speaks(boards[0])).toBe(true);
    expect(speaks(boards[1])).toBe(true);
    expect(boards.slice(2).some((state) => state.notes.some((note) => note.characterIds.includes(kit.id)))).toBe(true);
    expect(boards.slice(2).some(speaks)).toBe(false);
  });

  it("is the same wall every run, ids aside", () => {
    const shape = (file) => {
      const opened = fromProjectFile(JSON.parse(file));
      return opened.project.boards.map((meta) => opened.boards[meta.id].notes.map((note) => [note.headline, note.change, note.rank, note.location, note.when, note.characterIds.length, note.plantsWhat, note.text]));
    };
    expect(shape(generate())).toEqual(shape(text));
  });
});
