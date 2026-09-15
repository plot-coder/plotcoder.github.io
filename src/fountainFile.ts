// Fountain out, the door on the wall (R23, slice a): the open board as a
// `.fountain` file, named for the board. The text itself comes from the
// kernel-side module every door shares.

import { describeSetAside, fromFdx, toFdx } from "./board/fdx";
import { fromFountain, mergeFountain, toFountain } from "./board/fountain";
import { toMarkdown, toPlainText } from "./board/markdown";
import { boardById, scriptTitles } from "./board/project";
import { boardStore } from "./board/store";

export function fountainText(): string {
  const project = boardStore.getProject();
  const board = boardById(project, project.activeBoardId);
  return toFountain(boardStore.getState(), {
    ...scriptTitles(project, board),
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

/** A text file out through the browser, named for the open board with the extension asked for. */
function downloadText(text: string, extension: string, type = "text/plain;charset=utf-8"): void {
  const project = boardStore.getProject();
  const board = boardById(project, project.activeBoardId);
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  // The file is named as the script is titled: the project for a one-board film.
  link.download = fountainFileName(scriptTitles(project, board).title).replace(/\.fountain$/, extension);
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadFountain(): void {
  downloadText(fountainText(), ".fountain");
}

/** Take the pages with you (R54): the wall as Markdown, and the script as plain text. */
export function markdownText(): string {
  const project = boardStore.getProject();
  const board = boardById(project, project.activeBoardId);
  return toMarkdown(boardStore.getState(), {
    ...scriptTitles(project, board),
    premise: project.premise || undefined,
  });
}

export function plainText(): string {
  const project = boardStore.getProject();
  const board = boardById(project, project.activeBoardId);
  return toPlainText(boardStore.getState(), scriptTitles(project, board));
}

export function downloadMarkdown(): void {
  downloadText(markdownText(), ".md", "text/markdown;charset=utf-8");
}

export function downloadPlainText(): void {
  downloadText(plainText(), ".txt");
}

/** Fountain in: a document's scenes onto the open board's cards, never deleting. */
export function openFountainText(text: string): { written: number; created: number } {
  const parsed = fromFountain(text);
  const { commands, matched } = mergeFountain(boardStore.getState(), parsed);
  for (const command of commands) boardStore.dispatch(command);
  boardStore.commit();
  return {
    written: commands.filter((command) => command.type === "set_text").length,
    created: matched.filter((item) => item.created).length,
  };
}

export function fdxText(): string {
  const project = boardStore.getProject();
  const board = boardById(project, project.activeBoardId);
  return toFdx(boardStore.getState(), {
    ...scriptTitles(project, board),
    draftDate: new Date().toISOString(),
  });
}

/** Save as Final Draft: the open board as a .fdx file named for the board. */
export function downloadFdx(): void {
  downloadText(fdxText(), ".fdx", "application/xml;charset=utf-8");
}

/** Final Draft in: a document's scenes onto the open board's cards, never deleting. */
export function openFdxText(xml: string): { written: number; created: number; setAside: string } {
  const parsed = fromFdx(xml);
  const { commands, matched } = mergeFountain(boardStore.getState(), parsed);
  for (const command of commands) boardStore.dispatch(command);
  boardStore.commit();
  return {
    written: commands.filter((command) => command.type === "set_text").length,
    created: matched.filter((item) => item.created).length,
    setAside: describeSetAside(parsed.setAside),
  };
}
