// The wall as pages (R23, slice c): the reading order the panel already
// uses, each card as a scene for the paginator — its heading from the place
// or the headline, its text when written, its change line when not. One
// reading for the panel, the print, the card's corner and the strip.

import { sceneHeading } from "./board/fountain";
import { paginate, type Pagination } from "./board/paginate";
import { type WallReading } from "./board/readWall";
import { isMeasured, type BoardNote, type BoardState } from "./board/reducer";

export type BoardPages = Pagination & {
  /** Card id → the page its scene starts on. */
  pageOf: Map<string, number>;
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
  return { ...result, pageOf, order };
}
