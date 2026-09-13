// Scatter's memory: the poses a wall had before Organize, so it can be put
// back. Organize itself lives in src/board/organize.js (R34), shared with the
// agent's tool.
import { type MockNote } from "./noteMock";

export type NotePose = Pick<MockNote, "id" | "x" | "y" | "rotate">;


export function snapshotPoses(notes: MockNote[]): NotePose[] {
  return notes.map((note) => ({
    id: note.id,
    x: note.x,
    y: note.y,
    rotate: note.rotate,
  }));
}

export function applyPoses(notes: MockNote[], poses: NotePose[]) {
  const byId = new Map(poses.map((pose) => [pose.id, pose]));
  return notes.map((note) => {
    const pose = byId.get(note.id);
    return pose ? { ...note, x: pose.x, y: pose.y, rotate: pose.rotate } : note;
  });
}
