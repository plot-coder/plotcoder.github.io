// Locked scene numbers and revision marks (Roadmap 2, item 8; question 23).
//
// Until a draft goes out, scene numbers follow the wall's order. Lock them
// and they stop moving: every scene keeps the number it had, a scene added
// between 14 and 15 is 14A (then 14B), one added before the first is A1, and
// moving cards never renumbers what is locked. A scene added after the lock
// has no number of its own: its letter is its place between two locked
// numbers, so it follows the scene if the scene moves (round fourteen, 39).
// A revision is a name and a colour over a snapshot of the scenes; a line
// that differs from the snapshot is marked, so the changed lines print in the
// revision's colour with a star — on the page, in plain text, in Final Draft.
// All pure: the kernel holds the lock and the snapshot, this module reads them.

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function letter(index) {
  return index < LETTERS.length ? LETTERS[index] : `${LETTERS[Math.floor(index / LETTERS.length) - 1]}${LETTERS[index % LETTERS.length]}`;
}

/**
 * Scene numbers for cards in wall order. `lock` is the board's lock, or null:
 * { numbers: { [noteId]: "14" } }. Returns a Map of id → number as printed.
 */
export function sceneNumbers(order, lock) {
  const numbers = new Map();
  if (!lock || !lock.numbers) {
    order.forEach((note, index) => numbers.set(note.id, String(index + 1)));
    return numbers;
  }
  let lastLocked = null;
  let sinceLocked = 0;
  const leading = [];
  for (const note of order) {
    const locked = lock.numbers[note.id];
    if (locked) {
      // Scenes before the first locked one count backwards from it: A1, B1…
      if (lastLocked === null && leading.length) {
        leading.forEach((id, index) => numbers.set(id, `${letter(index)}${locked}`));
        leading.length = 0;
      }
      numbers.set(note.id, locked);
      lastLocked = locked;
      sinceLocked = 0;
      continue;
    }
    if (lastLocked === null) {
      leading.push(note.id);
      continue;
    }
    numbers.set(note.id, `${lastLocked}${letter(sinceLocked)}`);
    sinceLocked += 1;
  }
  // Nothing locked came after: the leading scenes run on from a lock of none.
  leading.forEach((id, index) => numbers.set(id, `A${index + 1}`));
  return numbers;
}

/** The lock to store: every scene's number as it stands, by wall order. */
export function lockFrom(order, existing, at) {
  const current = sceneNumbers(order, existing);
  const numbers = {};
  for (const note of order) numbers[note.id] = current.get(note.id);
  return { at, numbers };
}

/**
 * The lines of a scene's text that are not in its snapshot: those are the
 * revised ones. A scene with no snapshot is wholly new, and every line is.
 */
export function revisedLines(text, snapshotText) {
  const now = (text ?? "").replace(/\r\n?/g, "\n").split("\n");
  if (snapshotText === undefined || snapshotText === null) return now.map((_line, index) => index);
  const before = new Set(snapshotText.replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()));
  const revised = [];
  now.forEach((line, index) => {
    if (line.trim() && !before.has(line.trim())) revised.push(index);
  });
  return revised;
}

/** True when anything on the card — headline, change, place, text — differs from the snapshot. */
export function isRevised(note, snapshot) {
  if (!snapshot) return true;
  return (
    note.headline !== snapshot.headline ||
    note.change !== snapshot.change ||
    (note.location ?? "") !== (snapshot.location ?? "") ||
    (note.text ?? "") !== (snapshot.text ?? "")
  );
}

export const REVISION_COLORS = ["white", "blue", "pink", "yellow", "green", "goldenrod", "buff", "salmon", "cherry"];

/** The industry's revision colours as Final Draft writes them. */
export const REVISION_HEX = { white: "#FFFFFF", blue: "#5B8DEF", pink: "#E879A5", yellow: "#D9B400", green: "#4CAF6A", goldenrod: "#C99A1B", buff: "#C9A978", salmon: "#E28466", cherry: "#C0392B" };

/**
 * What the revision marks on each card, for every export (round fourteen,
 * entry 45: the marks lived only on the page). Card id → { revised, lines }:
 * `revised` when anything on the card differs from the snapshot, `lines` the
 * source lines of its text that do. Empty when no revision is in progress.
 */
export function revisionMarks(state) {
  const marks = new Map();
  const revision = state.revision;
  if (!revision) return marks;
  for (const note of state.notes) {
    const snapshot = revision.snapshot?.[note.id];
    const revised = isRevised(note, snapshot);
    marks.set(note.id, { revised, lines: new Set(revised ? revisedLines(note.text, snapshot?.text ?? null) : []) });
  }
  return marks;
}

/** One line naming the revision for the head of a document: "Blue revision · 2026-09-17". */
export function revisionLine(state) {
  const revision = state.revision;
  if (!revision) return "";
  const colour = `${revision.color.charAt(0).toUpperCase()}${revision.color.slice(1)}`;
  const name = revision.name && revision.name.toLowerCase() !== revision.color ? ` "${revision.name}"` : "";
  return `${colour} revision${name} · ${String(revision.since).slice(0, 10)}`;
}
