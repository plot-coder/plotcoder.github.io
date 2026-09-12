export const PROJECT_PREFIX = "plotcoder.";
export const PROJECT_APP = "plotcoder";
export const PROJECT_VERSION = 1;

export type PlotCoderProject = {
  app: typeof PROJECT_APP;
  version: number;
  exportedAt: string;
  storage: Record<string, string>;
};

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
  if (!value || typeof value !== "object") return false;
  const project = value as PlotCoderProject;
  return (
    project.app === PROJECT_APP &&
    typeof project.version === "number" &&
    typeof project.exportedAt === "string" &&
    !!project.storage &&
    typeof project.storage === "object" &&
    !Array.isArray(project.storage) &&
    Object.values(project.storage).every((item) => typeof item === "string")
  );
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
