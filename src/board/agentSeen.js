// Whether an agent is on the wall, and when one last was (R81; Robert,
// 2026-09-27: the site should say when an agent last interacted, so a writer
// can see theirs is reaching the wall). Three facts the app already has, read
// together: who is on the project's channel now (an agent follows it as
// "an agent, as <email>"), when an agent's session last touched the account
// (public.agent_sessions, the writer's own rows), and the last change an
// agent made to this board (the record, R76). Never "available": an agent
// acts when its writer speaks to it, and the app cannot know that it will.
// Pure and DOM-free.

const AGENT = /^an agent\b/i;

/** The newest of some ISO times, or null. */
function newest(times) {
  let best = null;
  for (const time of times) {
    if (typeof time !== "string" || Number.isNaN(Date.parse(time))) continue;
    if (best === null || Date.parse(time) > Date.parse(best)) best = time;
  }
  return best;
}

/** "just now", "12 minutes ago", "3 hours ago", "yesterday", "on 24 September". */
export function agoWords(at, now = new Date().toISOString()) {
  const gap = Date.parse(now) - Date.parse(at);
  if (Number.isNaN(gap)) return "";
  const minutes = Math.floor(gap / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours === 1 ? "an hour" : `${hours} hours`} ago`;
  if (hours < 48) return "yesterday";
  const date = new Date(at);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `on ${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
}

/** The same, for a button: "now", "12 min", "3 h", "yesterday", "24 Sep". */
export function agoShort(at, now = new Date().toISOString()) {
  const words = agoWords(at, now);
  return words
    .replace(/^just now$/, "now")
    .replace(/^(\d+) minutes ago$/, "$1 min")
    .replace(/^an hour ago$/, "1 h")
    .replace(/^(\d+) hours ago$/, "$1 h")
    .replace(/^on (\d+) (\w{3})\w*$/, "$1 $2");
}

/**
 * `present`: the names on the project's channel now. `sessionAt`: when an
 * agent's session last touched the account, or null. `record`: the open
 * board's record. Returns `state` — "here", "seen" or "never" — the time it
 * rests on, the short words for the bar and the sentence for the sheet, and
 * the last thing an agent changed on this board, when it changed anything.
 */
export function agentSeen({ present = [], sessionAt = null, record = [], now = new Date().toISOString() } = {}) {
  const changes = (record ?? []).filter((entry) => AGENT.test(entry?.by ?? ""));
  const lastChange = changes.at(-1) ?? null;
  const changed = lastChange ? { at: lastChange.at, line: (lastChange.lines ?? []).at(-1) ?? "" } : null;
  if ((present ?? []).some((name) => AGENT.test(name))) {
    return { state: "here", at: now, short: "Agent · here", words: "An agent is on this wall now.", changed };
  }
  const at = newest([sessionAt, lastChange?.at]);
  if (!at) return { state: "never", at: null, short: "Add your agent", words: "No agent has been on this wall yet.", changed: null };
  const ago = agoWords(at, now);
  return { state: "seen", at, short: `Agent · ${agoShort(at, now)}`, words: `An agent was last here ${ago}.`, changed };
}

/**
 * The header a connector is given, made on the writer's own device from
 * what they type: "Basic " and the base64 of email:password, any character.
 */
export function basicHeader(email, password) {
  const bytes = new TextEncoder().encode(`${String(email ?? "").trim()}:${String(password ?? "")}`);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `Basic ${btoa(binary)}`;
}

/** The first message to an agent: which project, what to read, and to change nothing yet. */
export function firstMessage(projectName) {
  const name = String(projectName ?? "").trim();
  return `I am working in PlotCoder${name ? ` on my project "${name}"` : ""}, and I have it open on my screen. Use the PlotCoder tools: call list_projects${name ? `, open_project with "${name}"` : ""}, then read_wall, and tell me in a few sentences what is on the wall and what it asks. Change nothing until I say.`;
}
