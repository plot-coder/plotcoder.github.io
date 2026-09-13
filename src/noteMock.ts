// Backwards-compatible surface for the note board UI. The canonical records and
// constants now live in the board kernel (src/board/reducer.ts); this module
// keeps the historical import names the components already use.

import { NOTE_COLORS, NOTE_HEIGHT, NOTE_WIDTH, seedState } from "./board/reducer";

export { NOTE_COLORS, NOTE_HEIGHT, NOTE_WIDTH };
export { NOTE_RANKS } from "./board/reducer";
export type {
  NoteColor,
  NoteRank,
  BoardNote as MockNote,
  BoardGroup as MockGroup,
  BoardArrow as MockArrow,
} from "./board/reducer";

export const SAMPLE_NOTES = seedState().notes;
