// What a project holds, for a row in the writer's list of projects (Robert,
// 2026-09-27: three walls of one name could not be told apart, so a rename
// had nothing to go on). From the project's boards: how many cards are in
// the film, how long they run, and the last change on any board's record
// (R76) — by whom and when. Pure and DOM-free.

import { formatPages, inStory, noteEighths } from "./reducer.js";

/** The facts of a project from its boards' states. */
export function projectFacts(boards) {
  let cards = 0;
  let eighths = 0;
  let changedAt = null;
  let changedBy = null;
  for (const board of boards ?? []) {
    for (const note of board?.notes ?? []) {
      if (!inStory(note)) continue;
      cards += 1;
      eighths += noteEighths(note);
    }
    const last = (board?.record ?? []).at(-1);
    if (last && typeof last.at === "string" && (changedAt === null || Date.parse(last.at) > Date.parse(changedAt))) {
      changedAt = last.at;
      changedBy = typeof last.by === "string" ? last.by : null;
    }
  }
  return { boards: (boards ?? []).length, cards, eighths, changedAt, changedBy };
}

/** "14:41", "yesterday", "24 Sep": when, against now, in the reader's own clock. */
export function whenWords(at, now = new Date()) {
  const then = new Date(at);
  if (Number.isNaN(then.getTime())) return "";
  const day = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  if (day(then) === day(now)) return `${String(then.getHours()).padStart(2, "0")}:${String(then.getMinutes()).padStart(2, "0")}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (day(then) === day(yesterday)) return "yesterday";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${then.getDate()} ${months[then.getMonth()]}`;
}

/**
 * The two halves of a row's line: what is in the project, and who changed it
 * last and when. `me` is the signed-in writer's name, read as "you". With no
 * record yet the second half falls back to when the project was last saved.
 */
export function factsLine(facts, { me = "", savedAt = null, now = new Date() } = {}) {
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const pages = formatPages(facts.eighths);
  const holds = `${plural(facts.boards, "board")} · ${plural(facts.cards, "card")} · ${pages} ${pages === "1" ? "page" : "pages"}`;
  if (facts.changedAt) {
    const agent = /^an agent\b/i.test(facts.changedBy ?? "");
    const who = agent ? "an agent" : facts.changedBy && facts.changedBy !== me ? facts.changedBy : "you";
    return { holds, changed: `changed ${whenWords(facts.changedAt, now)} by ${who}`, agent };
  }
  return { holds, changed: savedAt ? `saved ${whenWords(savedAt, now)}` : "", agent: false };
}
