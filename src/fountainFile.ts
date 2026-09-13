// Fountain out, the door on the wall (R23, slice a): the open board as a
// `.fountain` file, named for the board. The text itself comes from the
// kernel-side module every door shares.

import { toFountain } from "./board/fountain";
import { boardById } from "./board/project";
import { boardStore } from "./board/store";

export function fountainText(): string {
  const project = boardStore.getProject();
  const board = boardById(project, project.activeBoardId);
  return toFountain(boardStore.getState(), {
    title: board?.name ?? "Untitled",
    project: project.boards.length > 1 ? project.name : undefined,
    premise: project.premise || undefined,
    draftDate: new Date().toISOString(),
  });
}

export function fountainFileName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "plotcoder"}.fountain`;
}

export function downloadFountain(): void {
  const project = boardStore.getProject();
  const board = boardById(project, project.activeBoardId);
  const blob = new Blob([fountainText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fountainFileName(board?.name ?? "plotcoder");
  link.click();
  URL.revokeObjectURL(url);
}
