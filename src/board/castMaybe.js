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
