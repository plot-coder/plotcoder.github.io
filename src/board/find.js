// A card found by a phrase or an id, across every board of the project (R77
// c; pass 3a's entry 32, pass 3b's entry 18): the headline, the change line
// and the page, so an agent working a project it cannot hold whole reads
// the card a direction turns on and not six boards to find it. Pure and
// DOM-free: the wall's records, searched.

import { inStory, storyOrder } from "./reducer.js";

const norm = (value) => String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Every card whose id, headline, change line or page holds the phrase, on
 * every board given ({ meta, state } in the writer's order), in story order
 * on each: { boardId, boardName, id, headline, where, line, inStory }. A
 * page hit quotes the first line the phrase lands on. A card out of the film
 * — set aside, or a version behind another — is found and said so. An empty
 * phrase finds nothing.
 */
export function findCards(boards, phrase) {
  const wanted = norm(phrase);
  if (!wanted) return [];
  const found = [];
  for (const { meta, state } of boards) {
    const order = storyOrder(state);
    const rest = (state.notes ?? []).filter((note) => !order.includes(note));
    for (const note of [...order, ...rest]) {
      let where = null;
      let line = "";
      if (note.id === phrase.trim()) where = "id";
      else if (norm(note.headline).includes(wanted)) where = "headline";
      else if (norm(note.change).includes(wanted)) where = "change";
      else {
        const hit = String(note.text ?? "").split("\n").find((item) => norm(item).includes(wanted));
        if (hit !== undefined) { where = "page"; line = hit.trim(); }
      }
      if (!where) continue;
      found.push({ boardId: meta.id, boardName: meta.name, id: note.id, headline: note.headline, change: note.change, where, line, inStory: inStory(note) });
    }
  }
  return found;
}
