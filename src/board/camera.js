// What the camera cannot see (the handover's call 6, round eighteen entry
// 44): a line of action that says what someone knows, feels, thinks or
// wants is a fact the page states and the screen cannot show. The house
// principle "write for the camera and the cut" is a reminder every project
// starts with; this marks the lines it is about, on the page and in the
// write's reply, and never asks a question on the wall — a sentence on a
// page is the writer's. Only action is read: a character cue and the
// dialogue under it are theirs to say.

/** Interior verbs, as they appear in present- and past-tense action. */
const INTERIOR = [
  "knows", "knew", "feels", "felt", "thinks", "thought", "remembers", "remembered",
  "realises", "realizes", "realised", "realized", "wants", "wanted", "decides", "decided",
  "understands", "understood", "wonders", "wondered", "hopes", "hoped", "believes", "believed",
  "fears", "feared", "regrets", "regretted", "loves", "loved", "hates", "hated",
];
const INTERIOR_RE = new RegExp(`\\b(${INTERIOR.join("|")})\\b`, "gi");

/** A character cue: capitals and little else, short, no ending full stop; dialogue follows it until a blank line. */
function isCue(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 40) return false;
  if (/[.!?]$/.test(trimmed) && !/\(V\.O\.\)|\(O\.S\.\)|\(CONT'D\)$/i.test(trimmed)) return false;
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  return letters.length >= 2 && letters === letters.toUpperCase();
}

/**
 * The action lines the camera cannot see, with the verbs that say so:
 * `{ at, line, verbs }` per line, in order. Headings (a leading dot),
 * cues, dialogue and parentheticals are skipped.
 */
export function cameraLines(text) {
  const lines = (text ?? "").split("\n");
  const found = [];
  let inDialogue = false;
  for (const [at, line] of lines.entries()) {
    const trimmed = line.trim();
    if (!trimmed) { inDialogue = false; continue; }
    if (trimmed.startsWith(".") || trimmed.startsWith("(")) continue;
    if (isCue(trimmed)) { inDialogue = true; continue; }
    if (inDialogue) continue;
    const verbs = [...new Set([...trimmed.matchAll(INTERIOR_RE)].map((match) => match[1].toLowerCase()))];
    if (verbs.length) found.push({ at, line: trimmed, verbs });
  }
  return found;
}

/** The verbs across every marked line, once each, in order of first use. */
export function cameraVerbs(found) {
  return [...new Set(found.flatMap((item) => item.verbs))];
}
