import {
  NOTE_HEIGHT,
  NOTE_WIDTH,
  type MockGroup,
  type MockNote,
} from "./noteMock";

export type NotePose = Pick<MockNote, "id" | "x" | "y" | "rotate">;

const GAP = 28;
const ORIGIN_X = 88;
const ORIGIN_Y = 110;
const GROUP_PAD = 20;
const GROUP_TITLE = 34;

function readingSort(a: MockNote, b: MockNote) {
  return a.y - b.y || a.x - b.x;
}

function maxRowWidth() {
  return Math.max(NOTE_WIDTH, Math.min(920, window.innerWidth - 200));
}

function placeRow(notes: MockNote[], startX: number, startY: number, maxWidth: number) {
  let x = startX;
  let y = startY;
  const next = new Map<string, NotePose>();

  for (const note of notes) {
    if (x > startX && x + NOTE_WIDTH > startX + maxWidth) {
      x = startX;
      y += NOTE_HEIGHT + GAP;
    }
    next.set(note.id, { id: note.id, x, y, rotate: 0 });
    x += NOTE_WIDTH + GAP;
  }

  return { next, bottom: notes.length === 0 ? startY : y + NOTE_HEIGHT };
}

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

export function organizeReadingOrder(
  notes: MockNote[],
  groups: MockGroup[],
  onlyIds?: string[],
) {
  const scope = onlyIds
    ? notes.filter((note) => onlyIds.includes(note.id))
    : notes;
  const scopedIds = new Set(scope.map((note) => note.id));
  const width = maxRowWidth();
  const originX = onlyIds
    ? Math.min(...scope.map((note) => note.x))
    : ORIGIN_X;
  const originY = onlyIds
    ? Math.min(...scope.map((note) => note.y))
    : ORIGIN_Y;

  const groupedIds = new Set<string>();
  const poses = new Map<string, NotePose>();
  let cursorY = originY;

  const scopedGroups = groups
    .map((group) => ({
      ...group,
      noteIds: group.noteIds.filter((id) => scopedIds.has(id)),
    }))
    .filter((group) => group.noteIds.length >= 2)
    .sort((a, b) => {
      const aNotes = scope.filter((note) => a.noteIds.includes(note.id));
      const bNotes = scope.filter((note) => b.noteIds.includes(note.id));
      return readingSort(aNotes[0], bNotes[0]);
    });

  for (const group of scopedGroups) {
    const members = scope
      .filter((note) => group.noteIds.includes(note.id))
      .sort(readingSort);
    members.forEach((note) => groupedIds.add(note.id));
    const placed = placeRow(
      members,
      originX + GROUP_PAD,
      cursorY + GROUP_TITLE + GROUP_PAD,
      width - GROUP_PAD * 2,
    );
    placed.next.forEach((pose, id) => poses.set(id, pose));
    cursorY = placed.bottom + GROUP_PAD + GAP;
  }

  const loose = scope.filter((note) => !groupedIds.has(note.id)).sort(readingSort);
  const loosePlaced = placeRow(loose, originX, cursorY, width);
  loosePlaced.next.forEach((pose, id) => poses.set(id, pose));

  return notes.map((note) => {
    const pose = poses.get(note.id);
    return pose ? { ...note, x: pose.x, y: pose.y, rotate: pose.rotate } : note;
  });
}
