// A stretch of the film, selected (R77 a; pass 3a, entries 15, 17, 32): one
// scene, from one card to another in story order, or a group — an act, a
// sequence — by its title. The pages and the exports take it so an agent
// working a project it cannot hold whole reads what a direction turns on
// and nothing else. Pure and DOM-free: the wall's records, selected.

import { storyOrder } from "./reducer.js";

const key = (value) => String(value ?? "").trim();

/**
 * The cards a selection names, in story order: `scene` is one card by id or
 * headline; `from` and `to` a stretch inclusive, either order, as measure
 * takes them (one alone runs to the start or the end); `group` a group by id
 * or title. Nothing named is the whole film. Returns { cards, whole, words }
 * or { error } in the reply's own words. A card not in the film — set
 * aside, or a version behind another — is not in the order and not found.
 */
export function selectStretch(state, selection = {}) {
  const order = storyOrder(state);
  const scene = key(selection.scene);
  const from = key(selection.from);
  const to = key(selection.to);
  const group = key(selection.group);
  const find = (wanted) => order.find((note) => note.id === wanted) ?? order.find((note) => note.headline.trim().toLowerCase() === wanted.toLowerCase()) ?? null;
  const missing = (wanted) => ({ error: `No card with id or headline "${wanted}" in the film's order. Call list_board; a card set aside or behind another version is not on the pages.` });
  if (group) {
    const found = (state.groups ?? []).find((item) => item.id === group) ?? (state.groups ?? []).find((item) => (item.title ?? "").trim().toLowerCase() === group.toLowerCase()) ?? null;
    if (!found) return { error: `No group with id or title "${group}". list_board names the groups.` };
    const cards = storyOrder(state, found.noteIds);
    if (!cards.length) return { error: `The group "${found.title}" has no card in the film.` };
    return { cards, whole: cards.length === order.length, words: `the group "${found.title}"` };
  }
  if (scene) {
    const card = find(scene);
    if (!card) return missing(scene);
    return { cards: [card], whole: order.length === 1, words: `"${card.headline}"` };
  }
  if (!from && !to) return { cards: order, whole: true, words: "" };
  for (const wanted of [from, to]) if (wanted && !find(wanted)) return missing(wanted);
  const a = from ? order.indexOf(find(from)) : 0;
  const b = to ? order.indexOf(find(to)) : order.length - 1;
  const [first, last] = a <= b ? [a, b] : [b, a];
  const cards = order.slice(first, last + 1);
  const words = cards.length === 1 ? `"${cards[0].headline}"` : `"${cards[0].headline}" to "${cards[cards.length - 1].headline}"`;
  return { cards, whole: cards.length === order.length, words };
}

/**
 * The board narrowed to a stretch: those cards, the arrows between them, the
 * groups' parts that fall in it, and everything else of the wall as it is —
 * so the exports print the stretch in the film's order and nothing else.
 */
export function stretchState(state, cards) {
  const keep = new Set(cards.map((note) => note.id));
  return {
    ...state,
    notes: state.notes.filter((note) => keep.has(note.id)),
    arrows: (state.arrows ?? []).filter((arrow) => keep.has(arrow.from) && keep.has(arrow.to)),
    groups: (state.groups ?? []).map((group) => ({ ...group, noteIds: group.noteIds.filter((id) => keep.has(id)) })).filter((group) => group.noteIds.length),
    threads: (state.threads ?? []).map((thread) => ({ ...thread, noteIds: thread.noteIds.filter((id) => keep.has(id)) })),
  };
}
