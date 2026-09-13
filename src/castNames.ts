// Names as a person types them, resolved against the roster (R29).
//
// The card's "with" line is typed text — "Maya, Tom" — and the roster owns the
// spelling. These helpers turn typed names into roster ids and back, so the
// card, the lens and the app agree on what "Maya" means. Pure, so it is tested.

import type { BoardCharacter } from "./board/reducer";

const MAX_COMPLETIONS = 6;

function key(name: string): string {
  return name.trim().toLowerCase();
}

/** "Maya, tom ,, Maya" -> ["Maya", "tom"]. Commas separate; case-insensitive dedupe. */
export function splitNames(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const part of text.split(",")) {
    const name = part.replace(/\s+/g, " ").trim();
    if (!name || seen.has(key(name))) continue;
    seen.add(key(name));
    names.push(name);
  }
  return names;
}

export function findCharacter(
  name: string,
  characters: ReadonlyArray<BoardCharacter>,
): BoardCharacter | undefined {
  const wanted = key(name);
  return characters.find((character) => key(character.name) === wanted);
}

export type ResolvedName = { name: string; id: string | null };

/**
 * Typed names in typed order, each with the roster id it names, or null when
 * nobody in the roster has that name yet. Two spellings of one person collapse
 * to one entry.
 */
export function resolveCast(
  names: ReadonlyArray<string>,
  characters: ReadonlyArray<BoardCharacter>,
): ResolvedName[] {
  const seen = new Set<string>();
  const resolved: ResolvedName[] = [];
  for (const name of names) {
    const match = findCharacter(name, characters);
    const identity = match ? `id:${match.id}` : `name:${key(name)}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    resolved.push({ name: match ? match.name : name.trim(), id: match ? match.id : null });
  }
  return resolved;
}

/** Roster ids -> "Maya, Tom", in the order they were cast. Unknown ids are skipped. */
export function castText(
  characterIds: ReadonlyArray<string>,
  characters: ReadonlyArray<BoardCharacter>,
): string {
  const byId = new Map(characters.map((character) => [character.id, character.name]));
  return characterIds
    .map((id) => byId.get(id))
    .filter((name): name is string => Boolean(name))
    .join(", ");
}

/**
 * Who the roster can offer for a fragment someone is typing. Names that start
 * with it come first, then names that contain it; people already in the line
 * are left out. An empty fragment offers everyone not yet cast.
 */
export function completions(
  fragment: string,
  characters: ReadonlyArray<BoardCharacter>,
  taken: ReadonlyArray<string>,
): BoardCharacter[] {
  const needle = key(fragment);
  const takenKeys = new Set(taken.map(key));
  const open = characters.filter((character) => !takenKeys.has(key(character.name)));
  if (!needle) return open.slice(0, MAX_COMPLETIONS);
  const starts = open.filter((character) => key(character.name).startsWith(needle));
  const contains = open.filter(
    (character) => !key(character.name).startsWith(needle) && key(character.name).includes(needle),
  );
  return [...starts, ...contains].slice(0, MAX_COMPLETIONS);
}
