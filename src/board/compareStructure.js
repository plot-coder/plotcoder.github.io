// A structure beside the wall (R52).
//
// A structure's beats each carry the share of the story they tend to fall
// near. Laying one out makes cards; this is the other thing the sheet's
// words promise — a comparison. Each of the structure's beats gets the page
// it falls near on this board's target, and the nearest of the wall's own
// beats within reach, one to one and in order, with how far off it is. A
// reading, like read_wall: it moves nothing and makes nothing.
//
// Pure and DOM-free, like the kernel: the sheet, the strip and the MCP
// server all read the same rows.

import { readingOrder } from "./readWall.js";
import { EIGHTHS_PER_PAGE, noteEighths } from "./reducer.js";
import { beatPage } from "./templates.js";

/** Within this many pages a beat of the wall answers a beat of the structure. */
export const MATCH_PAGES = 6;
/** Within this many pages the match is "near" rather than early or late. */
export const NEAR_PAGES = 2;

/**
 * Set a structure's beats beside this wall's. `beats` are a template's or a
 * saved structure's: `{ name, at }`. The wall's beats are taken in reading
 * order; each of the structure's takes the nearest wall beat not yet taken
 * and not before the last one taken, within MATCH_PAGES, so the matching
 * never crosses.
 */
export function compareStructure(state, beats) {
  const order = readingOrder(state.notes);
  const wallBeats = [];
  let at = 0;
  for (const note of order) {
    if (note.rank === "beat") {
      wallBeats.push({ id: note.id, headline: note.headline, page: Math.floor(at / EIGHTHS_PER_PAGE) + 1 });
    }
    at += noteEighths(note);
  }
  const soFar = Math.ceil(at / EIGHTHS_PER_PAGE);
  let from = 0;
  const taken = new Set();
  const rows = beats.map((beat) => {
    const page = beatPage(beat.at, state.targetEighths);
    let best = -1;
    for (let i = from; i < wallBeats.length; i += 1) {
      const gap = Math.abs(wallBeats[i].page - page);
      if (gap > MATCH_PAGES) continue;
      if (best < 0 || gap < Math.abs(wallBeats[best].page - page)) best = i;
    }
    if (best >= 0) {
      taken.add(best);
      from = best + 1;
    }
    const match = best >= 0 ? wallBeats[best] : null;
    return {
      name: beat.name,
      at: beat.at,
      page,
      match,
      drift: match ? match.page - page : null,
      // No match and the page is past the story so far: nothing is there yet.
      beyond: !match && page > soFar,
    };
  });
  const unmatched = wallBeats.filter((_, index) => !taken.has(index));
  return { rows, unmatched, soFar, targetEighths: state.targetEighths };
}

/** The drift as a word or two: here, near, 3 pp early, 12 pp late. */
export function driftWord(drift) {
  if (drift === null || drift === undefined) return null;
  if (drift === 0) return "here";
  if (Math.abs(drift) <= NEAR_PAGES) return "near";
  return drift < 0 ? `${-drift} pp early` : `${drift} pp late`;
}

/** One line per row, for a reply or a sheet: the structure's beat, its page, and the wall's answer. */
export function describeComparison(comparison) {
  return comparison.rows.map((row) => {
    const head = `${row.name} (p. ${row.page})`;
    if (row.match) return `${head} — yours: "${row.match.headline}" p. ${row.match.page} · ${driftWord(row.drift)}`;
    if (row.beyond) return `${head} — nothing yet: past p. ${comparison.soFar}, the story so far`;
    return `${head} — none of yours within ${MATCH_PAGES} pages`;
  });
}
