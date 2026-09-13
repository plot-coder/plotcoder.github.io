// The wall as pages (R23, slice c): the reading order the panel already
// uses, each card as a scene for the paginator — its heading from the place
// or the headline, its text when written, its change line when not. One
// reading for the panel, the print, the card's corner and the strip.

import { sceneHeading } from "./board/fountain";
import { paginate, type Pagination } from "./board/paginate";
import { type WallReading } from "./board/readWall";
import { isMeasured, type BoardNote, type BoardState } from "./board/reducer";

export type PageTurn = {
  /** The page that begins here. */
  page: number;
  /** The scene's source line the new page begins at; -1 when the page begins with the heading. */
  src: number;
  /** The cue the page resumes with, when the turn falls inside a speech. */
  cue: string | null;
};

export type BoardPages = Pagination & {
  /** Card id → the page its scene starts on. */
  pageOf: Map<string, number>;
  /** Card id → the page turns that fall inside or before its scene (R23 c, the editor). */
  turnsOf: Map<string, PageTurn[]>;
  /** Cards in the order the pages take. */
  order: BoardNote[];
};

export function paginateBoard(board: BoardState, reading: WallReading | null): BoardPages {
  const byId = new Map(board.notes.map((note) => [note.id, note]));
  const order = reading
    ? (reading.order.map((id) => byId.get(id)).filter(Boolean) as BoardNote[])
    : board.notes;
  const result = paginate(
    order.map((note) => ({
      id: note.id,
      heading: sceneHeading(note).slice(1),
      text: note.text,
      change: note.change,
      written: isMeasured(note),
    })),
  );
  const pageOf = new Map(result.scenes.map((scene) => [scene.id, scene.page]));
  const turnsOf = new Map<string, PageTurn[]>();
  for (const page of result.pages) {
    if (page.number === 1) continue;
    const first = page.lines.find((line) => line.kind !== "blank");
    if (!first || !first.noteId) continue;
    const list = turnsOf.get(first.noteId) ?? [];
    const resumes = first.kind === "character" && /\(CONT'D\)$/.test(first.text ?? "");
    list.push({ page: page.number, src: first.src ?? -1, cue: resumes ? (first.text ?? null) : null });
    turnsOf.set(first.noteId, list);
  }
  return { ...result, pageOf, turnsOf, order };
}
