// Who has the wall open (round twenty-two, entries 93, 94).
//
// Pure: the Realtime channel's presence state in, words out. The MCP server
// follows the project's channel as "an agent, as <email>"; people in the app
// track themselves by name. DOM-free, so it is tested without a network.

const AGENT = /^an agent, as /;

/** The names on a presence state, people apart from agents, each once. */
export function readPresence(state) {
  const people = new Set();
  const agents = new Set();
  for (const entries of Object.values(state ?? {})) {
    for (const entry of entries ?? []) {
      if (!entry || typeof entry.name !== "string" || !entry.name.trim()) continue;
      (AGENT.test(entry.name) ? agents : people).add(entry.name.trim());
    }
  }
  return { people: [...people], agents: [...agents] };
}

/**
 * What a write's tail says about presence, and the key to remember it by.
 * "No wall open right now" rode on forty writes and stopped being read, so a
 * change to it would have been missed (round twenty-two, entry 95): it is said
 * when it changes, and otherwise the tail says only where the write landed.
 * The hosted door is a server per request and answers before presence
 * arrives, so an empty list there is not "nobody" and it claims nothing.
 */
export function presenceTail(people, lastKey, hosted) {
  const key = [...people].sort().join("|");
  // Said on every reply, "it shows on any open wall the moment it lands" read as though someone might be watching, all session, when nobody was (round twenty-three, entry 68). The door says where the write landed; the server says once whose tool the question is.
  if (people.length === 0 && hosted) return { key, text: " (saved to the account)" };
  if (key === lastKey) return { key, text: " (saved to the account)" };
  if (people.length === 0) return { key, text: " (saved to the account; no wall open right now — it shows the moment one opens)" };
  return { key, text: ` (saved to the account; open on ${people.length === 1 ? `${people[0]}'s screen` : `${people.length} screens: ${people.join(", ")}`} now)` };
}

/**
 * The answer to "who has this wall open right now?", as a sentence or two.
 * `synced` is whether presence arrived before the door had to answer: when it
 * did not, the door says it could not see, never "nobody".
 */
export function describePresence(state, { synced, project }) {
  const name = project ? `"${project}"` : "this project";
  if (!synced) return `Could not see in time who has ${name} open: presence had not arrived when the door had to answer. Ask again, or look at People in the app.`;
  const { people, agents } = readPresence(state);
  const who = people.length
    ? `${name} is open on ${people.length === 1 ? `${people[0]}'s screen` : `${people.length} screens: ${people.join(", ")}`} right now.`
    : `Nobody has a wall of ${name} open in the app right now; a write shows the moment one opens.`;
  const us = agents.length
    ? ` Beside ${people.length ? "them" : "that"}: ${agents.join(", ")} — this session, as the app's People sheet shows it${agents.length > 1 ? " (more than one agent session is on it)" : ""}.`
    : "";
  return `${who}${us} Presence lags a second or two, so this is now, not "seen by".`;
}
