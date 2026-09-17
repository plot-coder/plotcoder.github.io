// The Story Map (R32): the wall laid along a page axis.
//
// A view, never a model (D20). Everything here is computed from the wall's
// reading order and the cards' lengths, the same reading `readWall` makes, so
// the map and the questions agree. Pure and DOM-free so it can be tested; the
// component only draws what this returns.

import {
  boardEighths,
  EIGHTHS_PER_PAGE,
  isMeasured,
  noteEighths,
  type BoardState,
  type NoteColor,
} from "./board/reducer";
import type { WallReading } from "./board/readWall";

export type MapCard = {
  id: string;
  headline: string;
  change: string;
  color: NoteColor;
  beat: boolean;
  /** 1-based, in wall order; null for a scene. */
  number: number | null;
  plants: boolean;
  characterIds: string[];
  /** The cast by name, in cast order. */
  castNames: string[];
  /** Where the scene happens (R37), or empty. */
  location: string;
  /** When it happens (R55), or empty. */
  when: string;
  /** True when the length is measured from the scene's text (R23 b). */
  measured: boolean;
  /** Where the card starts, in eighths from the top of the story. */
  start: number;
  length: number;
};

/** A group as a span of pages: from its first member's start to its last member's end. */
export type MapGroup = { id: string; title: string; start: number; end: number };

export type MapBand = { from: string; to: string; start: number; end: number; sag: boolean };
export type MapSetup = { id: string; from: string; to: string; start: number; end: number };

export type StoryMapLayout = {
  /** Every card in reading order with its page position. */
  cards: MapCard[];
  beats: MapCard[];
  /** The runs between consecutive beats, as page spans. */
  bands: MapBand[];
  setups: MapSetup[];
  groups: MapGroup[];
  /** Folded cards nothing pays off, by id. */
  unpaid: string[];
  totalEighths: number;
  targetEighths: number;
  /** How far the axis runs; see axisSpan. */
  spanEighths: number;
  /** False while the story is well short of the target and the target sits off the end. */
  targetInRange: boolean;
};

// The axis fits the story with a quarter of headroom while the story is well
// short of the target, so a twenty-page wall fills the strip instead of
// huddling in a corner of a hundred and twenty. As the story grows the axis
// grows with it, until the target comes into view and holds; past the target
// it extends again. Never shorter than ten pages, so an empty wall has a ruler.
const HEADROOM = 1.25;
const MIN_SPAN_EIGHTHS = 10 * EIGHTHS_PER_PAGE;

export function axisSpan(totalEighths: number, targetEighths: number): number {
  const fitted = Math.max(totalEighths * HEADROOM, MIN_SPAN_EIGHTHS);
  if (fitted < targetEighths) return fitted;
  return Math.max(totalEighths, targetEighths);
}

export function storyMapLayout(state: BoardState, reading: WallReading): StoryMapLayout {
  const byId = new Map(state.notes.map((note) => [note.id, note]));
  const nameOf = new Map(state.characters.map((character) => [character.id, character.name]));
  let cursor = 0;
  let beatCount = 0;
  const cards: MapCard[] = [];
  for (const id of reading.order) {
    const note = byId.get(id);
    if (!note) continue;
    const beat = note.rank === "beat";
    if (beat) beatCount += 1;
    cards.push({
      id,
      headline: note.headline,
      change: note.change,
      color: note.color,
      beat,
      number: beat ? beatCount : null,
      plants: note.plants,
      characterIds: note.characterIds,
      castNames: note.characterIds
        .map((characterId) => nameOf.get(characterId))
        .filter((name): name is string => Boolean(name)),
      location: note.location ?? "",
      when: note.when ?? "",
      start: cursor,
      length: noteEighths(note),
      measured: isMeasured(note),
    });
    cursor += noteEighths(note);
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

  const cardById = new Map(cards.map((card) => [card.id, card]));
  const groups: MapGroup[] = state.groups
    .map((group) => {
      const members = group.noteIds
        .map((id) => cardById.get(id))
        .filter((card): card is MapCard => Boolean(card));
      if (members.length < 2) return null;
      return {
        id: group.id,
        title: group.title,
        start: Math.min(...members.map((card) => card.start)),
        end: Math.max(...members.map((card) => card.start + card.length)),
      };
    })
    .filter((group): group is MapGroup => group !== null);

  const totalEighths = boardEighths(state);
  const targetEighths = state.targetEighths;
  const spanEighths = axisSpan(totalEighths, targetEighths);
  return {
    cards,
    beats,
    bands,
    setups,
    groups,
    unpaid,
    totalEighths,
    targetEighths,
    spanEighths,
    targetInRange: targetEighths <= spanEighths,
  };
}

/** Eighths -> x in pixels along an axis `width` wide with `pad` at each end. */
export function xFor(eighths: number, spanEighths: number, width: number, pad: number): number {
  const usable = Math.max(width - pad * 2, 1);
  return pad + (eighths / spanEighths) * usable;
}

/** Page ticks along the axis: every 10 pages, 5 for a short axis, 2 for a very short one. */
export function pageTicks(spanEighths: number): number[] {
  const pages = spanEighths / EIGHTHS_PER_PAGE;
  const step = pages <= 16 ? 2 : pages <= 40 ? 5 : 10;
  const ticks: number[] = [];
  for (let page = 0; page <= pages; page += step) ticks.push(page * EIGHTHS_PER_PAGE);
  return ticks;
}

export type BeatLabel = { id: string; text: string; x: number };

// Roughly how wide a label glyph is at the map's label size. Good enough to
// decide how much of a headline fits; the browser does the real measuring.
const GLYPH_PX = 5.8;
const LABEL_GAP_PX = 6;
const MIN_NAME_CHARS = 6;

/**
 * Which beats get a name above their block, and how much of it. One row: a
 * label may run until the next beat. Every beat block carries its number, so a
 * name that will not fit is simply left off rather than replaced — the number
 * is always there to anchor the scrub label.
 */
export function beatLabels(
  beats: ReadonlyArray<MapCard>,
  spanEighths: number,
  width: number,
  pad: number,
): BeatLabel[] {
  const labels: BeatLabel[] = [];
  beats.forEach((beat, index) => {
    const x = xFor(beat.start, spanEighths, width, pad);
    const next = beats[index + 1];
    const limit = next ? xFor(next.start, spanEighths, width, pad) : width - pad + LABEL_GAP_PX;
    const room = Math.max(0, limit - x - LABEL_GAP_PX);
    const prefix = `${beat.number ?? index + 1} · `;
    const avail = Math.floor(room / GLYPH_PX) - prefix.length;
    if (avail < MIN_NAME_CHARS) return;
    const name =
      avail >= beat.headline.length
        ? beat.headline
        : `${beat.headline.slice(0, avail - 1).trimEnd()}…`;
    labels.push({ id: beat.id, text: `${prefix}${name}`, x });
  });
  return labels;
}
