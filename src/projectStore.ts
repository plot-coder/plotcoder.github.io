// The file's shape and check live in src/board/projectFile.js, shared with the
// MCP server's export_project and import_project (R46), so a file saved by
// one opens in the other. Version 2 (R35): the keys carry a project record
// and one board per key. Version 1 files still open; their keys land as they
// were and the store's migration turns them into a one-board project.
import { PROJECT_APP, PROJECT_PREFIX, PROJECT_VERSION, isProjectFile, type ProjectFile } from "./board/projectFile";

export { PROJECT_APP, PROJECT_PREFIX, PROJECT_VERSION };
export type PlotCoderProject = ProjectFile;

export function listProjectKeys() {
  return Object.keys(localStorage).filter((key) => key.startsWith(PROJECT_PREFIX));
}

export function exportProject(): PlotCoderProject {
  const storage: Record<string, string> = {};
  for (const key of listProjectKeys()) {
    const value = localStorage.getItem(key);
    if (value !== null) storage[key] = value;
  }
  return {
    app: PROJECT_APP,
    version: PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    storage,
  };
}

export function isPlotCoderProject(value: unknown): value is PlotCoderProject {
  return isProjectFile(value);
}

export function importProject(value: unknown) {
  if (!isPlotCoderProject(value)) {
    throw new Error("This file is not a PlotCoder project.");
  }

  for (const key of listProjectKeys()) {
    localStorage.removeItem(key);
  }

  for (const [key, stored] of Object.entries(value.storage)) {
    if (key.startsWith(PROJECT_PREFIX)) {
      localStorage.setItem(key, stored);
    }
  }
}

export function downloadProject() {
  const project = exportProject();
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const stamp = project.exportedAt.slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `plotcoder-${stamp}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function projectFileName(date = new Date()) {
  return `plotcoder-${date.toISOString().slice(0, 10)}.json`;
}
