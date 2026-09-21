// A person who may or may not be in a scene (round twenty-two, H9).
//
// One gesture through every door: a name with a question mark after it —
// "Tomás?" — on the card's cast line, in create_note's characters, in cast's.
// Pure, so the wall and the server read a typed name the same way.

/** "Tomás?" -> { name: "Tomás", maybe: true }; "Tomás" -> { name: "Tomás", maybe: false }. A bare "?" is nobody. */
export function readMaybe(text) {
  const typed = String(text ?? "").replace(/\s+/g, " ").trim();
  const bare = typed.replace(/[\s?]+$/, "");
  return { name: bare, maybe: bare !== typed && bare !== "" };
}

/** The cast line as it is read and typed: "Marta, Tomás?" — the certain first, as cast, then who may be there. */
export function castLine(characterIds, maybeCharacterIds, characters) {
  const byId = new Map((characters ?? []).map((character) => [character.id, character.name]));
  const certain = (characterIds ?? []).map((id) => byId.get(id)).filter(Boolean);
  const maybe = (maybeCharacterIds ?? []).map((id) => byId.get(id)).filter(Boolean).map((name) => `${name}?`);
  return [...certain, ...maybe].join(", ");
}

/** The mark that opens the writer's words on the cast line, as on the place line: "Ada, Callum, ? anyone else: I don't know". */
export const CAST_OPEN_MARK = "?";

/**
 * The cast line as typed, in two parts: the names, and — from the first part
 * that starts with the mark to the end of the line, commas and all — the
 * writer's words for why who is in the scene is not decided. A name with the
 * mark after it ("Tomás?") is a maybe and stays a name.
 */
export function splitCastLine(text) {
  const parts = String(text ?? "").split(",");
  const at = parts.findIndex((part) => part.trim().startsWith(CAST_OPEN_MARK));
  if (at === -1) return { names: String(text ?? ""), open: "" };
  const open = parts.slice(at).join(",").trim().slice(CAST_OPEN_MARK.length).replace(/\s+/g, " ").trim();
  return { names: parts.slice(0, at).join(","), open };
}

/** The whole line as it is typed back: the cast, who may be there, then the open words behind their mark. */
export function castLineWithOpen(characterIds, maybeCharacterIds, characters, castOpen) {
  const names = castLine(characterIds, maybeCharacterIds, characters);
  const open = String(castOpen ?? "").trim();
  return open ? `${names}${names ? ", " : ""}${CAST_OPEN_MARK} ${open}` : names;
}
