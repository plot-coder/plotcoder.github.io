// The series premise — what the whole show is arguing, above any one board.
//
// This sits a level up from the board's logline (R19). A feature has one board
// and no premise; a season has many boards that share one. It lives in its own
// `plotcoder.*` key, the same way reminders do, which means Save/Open already
// carries it: exportProject sweeps every plotcoder.* key.
//
// It deliberately does NOT go through the board kernel. A premise outlives any
// single board, so putting it in BoardState would copy it into every episode
// and leave no obvious owner when they disagree.

export const PREMISE_KEY = "plotcoder.project";

export type ProjectMeta = {
  premise: string;
};

export const EMPTY_META: ProjectMeta = { premise: "" };

export function isProjectMeta(value: unknown): value is ProjectMeta {
  if (!value || typeof value !== "object") return false;
  return typeof (value as ProjectMeta).premise === "string";
}

export function readPremise(): string {
  try {
    const raw = localStorage.getItem(PREMISE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as unknown;
    return isProjectMeta(parsed) ? parsed.premise : "";
  } catch {
    return "";
  }
}

export function writePremise(premise: string): void {
  try {
    const trimmed = premise.trim();
    if (!trimmed) {
      localStorage.removeItem(PREMISE_KEY);
      return;
    }
    localStorage.setItem(PREMISE_KEY, JSON.stringify({ premise: trimmed }));
  } catch {
    /* storage might be full or blocked; the app still works in memory */
  }
}
