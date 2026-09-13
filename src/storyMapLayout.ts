// The Story Map (R32): the wall laid along a page axis.
//
// A view, never a model (D20). Everything here is computed from the wall's
// reading order and the cards' lengths, the same reading `readWall` makes, so
// the map and the questions agree. Pure and DOM-free so it can be tested; the
// component only draws what this returns.

import { boardEighths, EIGHTHS_PER_PAGE, type BoardState } from "./board/reducer";
import type { WallReading } from "./board/readWall";

export type MapCard = {
  id: string;
  headline: string;
  beat: boolean;
  plants: boolean;
  characterIds: string[];
  /** Where the card starts, in eighths from the top of the story. */
  start: number;
  length: number;
};

export type MapBand = { from: string; to: string; start: number; end: number; sag: boolean };
export type MapSetup = { id: string; from: string; to: string; start: number; end: number };

export type StoryMapLayout = {
  /** Every card in reading order with its page position. */
  cards: MapCard[];
  beats: MapCard[];
  /** The runs between consecutive beats, as page spans. */
  bands: MapBand[];
  setups: MapSetup[];
  /** Folded cards nothing pays off, by id. */
  unpaid: string[];
  totalEighths: number;
  targetEighths: number;
  /** The axis runs to the larger of the runtime and the target. */
  spanEighths: number;
};

export function storyMapLayout(state: BoardState, reading: WallReading): StoryMapLayout {
  const byId = new Map(state.notes.map((note) => [note.id, note]));
  let cursor = 0;
  const cards: MapCard[] = [];
  for (const id of reading.order) {
    const note = byId.get(id);
    if (!note) continue;
    cards.push({
      id,
      headline: note.headline,
      beat: note.rank === "beat",
      plants: note.plants,
      characterIds: note.characterIds,
      start: cursor,
      length: note.lengthEighths,
    });
    cursor += note.lengthEighths;
  }
  const startOf = new Map(cards.map((card) => [card.id, card.start]));
  const beats = cards.filter((card) => card.beat);

  const sagPairs = new Set(
    reading.findings
      .filter((finding) => finding.kind === "sag")
      .map((finding) => `${finding.ids[0]}>${finding.ids[1]}`),
  );
  const bands: MapBand[] = [];
  for (let i = 0; i < beats.length - 1; i += 1) {
    const from = beats[i];
    const to = beats[i + 1];
    bands.push({
      from: from.id,
      to: to.id,
      start: from.start + from.length,
      end: to.start,
      sag: sagPairs.has(`${from.id}>${to.id}`),
    });
  }

  const setups: MapSetup[] = reading.setups
    .filter((setup) => startOf.has(setup.from) && startOf.has(setup.to))
    .map((setup) => ({
      id: setup.id,
      from: setup.from,
      to: setup.to,
      start: startOf.get(setup.from)!,
      end: startOf.get(setup.to)!,
    }));

  const unpaid = reading.findings
    .filter((finding) => finding.kind === "unpaid")
    .map((finding) => finding.ids[0]);

  const totalEighths = boardEighths(state);
  const targetEighths = state.targetEighths;
  return {
    cards,
    beats,
    bands,
    setups,
    unpaid,
    totalEighths,
    targetEighths,
    spanEighths: Math.max(totalEighths, targetEighths, EIGHTHS_PER_PAGE),
  };
}

/** Eighths -> x in pixels along an axis `width` wide with `pad` at each end. */
export function xFor(eighths: number, spanEighths: number, width: number, pad: number): number {
  const usable = Math.max(width - pad * 2, 1);
  return pad + (eighths / spanEighths) * usable;
}

/** Page ticks along the axis: every 10 pages, or every 5 when the story is short. */
export function pageTicks(spanEighths: number): number[] {
  const pages = spanEighths / EIGHTHS_PER_PAGE;
  const step = pages <= 40 ? 5 : 10;
  const ticks: number[] = [];
  for (let page = 0; page <= pages; page += step) ticks.push(page * EIGHTHS_PER_PAGE);
  return ticks;
}

export type BeatLabel = { id: string; text: string; row: 0 | 1; x: number };

// Roughly how wide a label glyph is at the map's label size. Good enough to
// decide how much of a headline fits; the browser does the real measuring.
const GLYPH_PX = 5.6;
const LABEL_GAP_PX = 8;

/**
 * Where each beat's headline goes, and how much of it fits. Labels sit on two
 * rows, alternating, so a label may run until the next beat on its own row.
 * When even a few letters would not fit, the beat's number stands in — a
 * count, not a judgement (D21).
 */
export function beatLabels(
  beats: ReadonlyArray<MapCard>,
  spanEighths: number,
  width: number,
  pad: number,
): BeatLabel[] {
  return beats.map((beat, index) => {
    const row = (index % 2) as 0 | 1;
    const x = xFor(beat.start, spanEighths, width, pad);
    const next = beats[index + 2];
    const limit = next ? xFor(next.start, spanEighths, width, pad) : width - pad + LABEL_GAP_PX;
    const room = Math.max(0, limit - x - LABEL_GAP_PX);
    const fits = Math.floor(room / GLYPH_PX);
    let text: string;
    if (fits >= beat.headline.length) text = beat.headline;
    else if (fits >= 6) text = `${beat.headline.slice(0, fits - 1).trimEnd()}…`;
    else text = String(index + 1);
    return { id: beat.id, text, row, x };
  });
}
