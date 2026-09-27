// The record of a session (R76; pass 2a, entries 4, 19, 21, 9, 20 — drawn in
// docs/mockups/pass-2a-the-morning-after.html and built on Robert's word,
// 2026-09-26). The wall had no memory of a session: a person could not tell
// what the agent did last or was waiting on, and a fresh agent could not tell
// what the person did. Now every door that changes the board appends a line
// to `state.record`, in the person's terms — the card, the verb, who, when —
// found by reading the wall before against the wall after, so no door has to
// remember to say what it did. The sheet shows it as "Since you looked", a
// fresh agent's reading opens with it, and a hands-off agent picks up from
// it. Bounded: the last fifty changes. Pure and DOM-free.

import { formatPages, inStory, noteEighths, isMeasured } from "./reducer.js";

/** How many changes the wall remembers. */
export const RECORD_CAP = 50;
/** A gap longer than this between two changes by the same hand starts a new session in the telling. */
const SESSION_GAP_MS = 30 * 60 * 1000;
/** The same lines from the same hand inside this gap are one change (a drag, a line typed key by key). */
const MERGE_GAP_MS = 5 * 60 * 1000;

const quote = (note) => `"${(note?.headline ?? "").trim() || "a card"}"`;

function byId(list) {
  return new Map((list ?? []).map((item) => [item.id, item]));
}
function sameList(a, b) {
  return (a ?? []).length === (b ?? []).length && (a ?? []).every((item, index) => item === (b ?? [])[index]);
}
function names(ids, cast) {
  const people = byId(cast);
  return (ids ?? []).map((id) => people.get(id)?.name).filter(Boolean);
}
function joinNames(list) {
  return list.length <= 1 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

/**
 * What changed between two walls, in the person's terms: lines like
 * `wrote "The morning after" (4/8 pages)`, `set "The bank" aside`,
 * `struck "Now, or 1987"`. Returns the lines and the ids of the cards (and
 * people) they name, for show me. Empty lines when nothing describable moved.
 */
export function describeChange(before, after) {
  const lines = [];
  const ids = new Set();
  const say = (line, ...touched) => {
    lines.push(line);
    for (const id of touched) if (id) ids.add(id);
  };
  const was = byId(before.notes);
  const now = byId(after.notes);
  const castBefore = before.characters ?? [];
  const castAfter = after.characters ?? [];

  // Cards.
  for (const note of after.notes ?? []) {
    const old = was.get(note.id);
    if (!old) {
      const born = note.aside ? " — set aside, not in the film" : note.alternativeOf ? ` — a version behind ${quote(now.get(note.alternativeOf))}` : "";
      say(`made ${quote(note)}${born}`, note.id);
      continue;
    }
    if ((old.headline ?? "") !== (note.headline ?? "")) say(`renamed ${quote(old)} to ${quote(note)}`, note.id);
    if ((old.change ?? "") !== (note.change ?? "") && (note.change ?? "").trim() && note.change !== "What changes?") say(`changed what changes in ${quote(note)}: "${note.change.trim()}"`, note.id);
    if ((old.changeOpen ?? "") !== (note.changeOpen ?? "")) say((note.changeOpen ?? "").trim() ? `left what changes in ${quote(note)} open: "${note.changeOpen.trim()}"` : `decided what changes in ${quote(note)}`, note.id);
    const wroteBefore = (old.text ?? "").trim();
    const wroteAfter = (note.text ?? "").trim();
    if (wroteBefore !== wroteAfter) {
      if (!wroteAfter) say(`took the page off ${quote(note)}`, note.id);
      else if (!wroteBefore) say(`wrote ${quote(note)}${isMeasured(note) ? ` (${formatPages(noteEighths(note))} pages)` : ""}`, note.id);
      else say(`rewrote ${quote(note)}${isMeasured(note) ? ` (${formatPages(noteEighths(note))} pages)` : ""}`, note.id);
    }
    if ((old.rank ?? "scene") !== (note.rank ?? "scene")) say(note.rank === "beat" ? `kept ${quote(note)} as a turn` : `struck ${quote(note)} back to a scene`, note.id);
    if (Boolean(old.proposedBeat) !== Boolean(note.proposedBeat) && note.proposedBeat) say(`proposed ${quote(note)} as a turn`, note.id);
    if (Boolean(old.aside) !== Boolean(note.aside)) say(note.aside ? `set ${quote(note)} aside, out of the film` : `brought ${quote(note)} back into the film`, note.id);
    if ((old.alternativeOf ?? null) !== (note.alternativeOf ?? null)) {
      if (note.alternativeOf) say(`put ${quote(note)} behind ${quote(now.get(note.alternativeOf))} as another version`, note.id, note.alternativeOf);
      else if (!note.aside) say(`chose ${quote(note)} as the scene`, note.id);
    }
    if (!sameList(old.characterIds, note.characterIds) || !sameList(old.maybeCharacterIds, note.maybeCharacterIds)) {
      const on = names(note.characterIds, castAfter);
      const maybes = names(note.maybeCharacterIds, castAfter);
      say(`cast ${quote(note)}: ${on.length ? joinNames(on) : "nobody"}${maybes.length ? `, and ${joinNames(maybes)} as a maybe` : ""}`, note.id);
    }
    if ((old.castOpen ?? "") !== (note.castOpen ?? "")) say((note.castOpen ?? "").trim() ? `left who is in ${quote(note)} open: "${note.castOpen.trim()}"` : `decided who is in ${quote(note)}`, note.id);
    if ((old.location ?? "") !== (note.location ?? "") && (note.location ?? "").trim()) say(`placed ${quote(note)} at ${note.location.trim()}`, note.id);
    if ((old.locationOpen ?? "") !== (note.locationOpen ?? "") && (note.locationOpen ?? "").trim()) say(`left the place of ${quote(note)} open: "${note.locationOpen.trim()}"`, note.id);
    if ((old.when ?? "") !== (note.when ?? "") && (note.when ?? "").trim()) say(`set when ${quote(note)} happens: ${note.when.trim()}`, note.id);
    if ((old.whenOpen ?? "") !== (note.whenOpen ?? "") && (note.whenOpen ?? "").trim()) say(`left when ${quote(note)} happens open: "${note.whenOpen.trim()}"`, note.id);
    if ((old.open ?? "") !== (note.open ?? "")) say((note.open ?? "").trim() ? `left ${quote(note)} open: "${note.open.trim()}"` : `closed ${quote(note)}: it is decided`, note.id);
    if (Boolean(old.plants) !== Boolean(note.plants) || (old.plantsWhat ?? "") !== (note.plantsWhat ?? "")) {
      say(note.plants ? `folded ${quote(note)}: it plants ${(note.plantsWhat ?? "").trim() || "something"}` : `unfolded ${quote(note)}`, note.id);
    }
    if ((old.lengthEighths ?? null) !== (note.lengthEighths ?? null)) say(note.lengthEighths === null ? `unsized ${quote(note)}` : `sized ${quote(note)} at ${formatPages(note.lengthEighths)} pages`, note.id);
    if ((old.x !== note.x || old.y !== note.y) && lines.every((line) => !line.includes(quote(note)))) say(`moved ${quote(note)} on the wall`, note.id);
  }
  for (const old of before.notes ?? []) if (!now.has(old.id)) say(`deleted ${quote(old)}`, old.id);

  // Arrows: the order, and the payoffs.
  const arrowsWere = byId(before.arrows);
  const arrowsNow = byId(after.arrows);
  const follows = (arrow) => (arrow.kind ?? "follows") !== "setup";
  const addedFollows = (after.arrows ?? []).filter((arrow) => follows(arrow) && !arrowsWere.has(arrow.id));
  const goneFollows = (before.arrows ?? []).filter((arrow) => follows(arrow) && !arrowsNow.has(arrow.id));
  if (addedFollows.length + goneFollows.length > 0) {
    if (addedFollows.length + goneFollows.length <= 2) {
      for (const arrow of addedFollows) say(`wired ${quote(now.get(arrow.to))} after ${quote(now.get(arrow.from))}`, arrow.from, arrow.to);
      for (const arrow of goneFollows) say(`unwired ${quote(was.get(arrow.to))} from ${quote(was.get(arrow.from))}`, arrow.from, arrow.to);
    } else {
      const order = (after.notes ?? []).filter((note) => inStory(note));
      say(`changed the order (${addedFollows.length + goneFollows.length} follows arrows)`, ...order.map((note) => note.id));
    }
  }
  for (const arrow of (after.arrows ?? []).filter((arrow) => !follows(arrow) && !arrowsWere.has(arrow.id))) say(`${quote(now.get(arrow.to))} now pays off ${quote(now.get(arrow.from))}`, arrow.from, arrow.to);
  for (const arrow of (before.arrows ?? []).filter((arrow) => !follows(arrow) && !arrowsNow.has(arrow.id))) say(`took the payoff of ${quote(was.get(arrow.from))} off ${quote(was.get(arrow.to))}`, arrow.from, arrow.to);

  // Groups.
  const groupsWere = byId(before.groups);
  const groupsNow = byId(after.groups);
  for (const group of after.groups ?? []) {
    const old = groupsWere.get(group.id);
    if (!old) say(`grouped ${group.noteIds.length} cards as "${group.title || "a group"}"`, ...group.noteIds);
    else if ((old.title ?? "") !== (group.title ?? "")) say(`renamed the group "${old.title}" to "${group.title}"`, ...group.noteIds);
    else if (!sameList(old.noteIds, group.noteIds)) say(`changed the group "${group.title}" (${group.noteIds.length} cards)`, ...group.noteIds);
  }
  for (const old of before.groups ?? []) if (!groupsNow.has(old.id)) say(`ungrouped "${old.title || "a group"}"`, ...old.noteIds);

  // People.
  const peopleWere = byId(castBefore);
  const peopleNow = byId(castAfter);
  for (const person of castAfter) {
    const old = peopleWere.get(person.id);
    if (!old) { say(`added ${person.name} to the cast`, person.id); continue; }
    if (old.name !== person.name) say(`renamed ${old.name} to ${person.name}`, person.id);
    const fields = ["looks", "voice", "wants", "needs", "notes"].filter((field) => (old[field] ?? "") !== (person[field] ?? ""));
    if (fields.length) say(`changed ${person.name}'s page (${fields.join(", ")})`, person.id);
    if ((old.open ?? "") !== (person.open ?? "")) say((person.open ?? "").trim() ? `left something about ${person.name} open: "${person.open.trim()}"` : `decided what was open about ${person.name}`, person.id);
  }
  for (const old of castBefore) if (!peopleNow.has(old.id)) say(`took ${old.name} out of the cast`, old.id);

  // The film.
  if ((before.logline ?? "") !== (after.logline ?? "") && (after.logline ?? "").trim()) say(`set the logline: "${after.logline.trim()}"`);
  if ((before.loglineOpen ?? "") !== (after.loglineOpen ?? "") && (after.loglineOpen ?? "").trim()) say(`left the logline open: "${after.loglineOpen.trim()}"`);
  if ((before.targetEighths ?? null) !== (after.targetEighths ?? null) || (before.targetKind ?? "") !== (after.targetKind ?? "")) say(`set the target: ${after.targetKind ? after.targetKind : `${formatPages(after.targetEighths)} pages`}`);
  const linesWere = new Set(before.openLines ?? []);
  const linesNow = new Set(after.openLines ?? []);
  for (const line of after.openLines ?? []) if (!linesWere.has(line)) say(`held a line about the film: "${line}"`);
  for (const line of before.openLines ?? []) if (!linesNow.has(line)) say(`decided a line about the film: "${line}"`);
  const leftKey = (item) => `${item.kind}:${(item.ids ?? []).join(",")}`;
  const leftWere = new Set((before.left ?? []).map(leftKey));
  const leftNow = new Set((after.left ?? []).map(leftKey));
  for (const item of after.left ?? []) if (!leftWere.has(leftKey(item))) say(`left a question the wall asked (${item.kind})${item.why ? `: "${item.why}"` : ""}`, ...(item.ids ?? []));
  for (const item of before.left ?? []) if (!leftNow.has(leftKey(item))) say(`asked a left question again (${item.kind})`, ...(item.ids ?? []));
  const threadsWere = byId(before.threads);
  const threadsNow = byId(after.threads);
  for (const thread of after.threads ?? []) {
    const old = threadsWere.get(thread.id);
    if (!old) { say(`strung a thread, "${thread.name}"`, ...thread.noteIds); continue; }
    if (old.startOpen && !thread.startOpen) say(`tied where "${thread.name}" is first seen`, ...thread.noteIds);
    if (old.endOpen && !thread.endOpen) say(`tied where "${thread.name}" comes out`, ...thread.noteIds);
    if (!sameList(old.noteIds, thread.noteIds)) say(`changed the cards on "${thread.name}"`, ...thread.noteIds);
  }
  for (const old of before.threads ?? []) if (!threadsNow.has(old.id)) say(`cut the thread "${old.name}"`, ...old.noteIds);
  if (!before.lock && after.lock) say("locked the scene numbers");
  if (before.lock && !after.lock) say("unlocked the scene numbers");
  if (!before.revision && after.revision) say(`started the ${after.revision.color} revision`);
  if (before.revision && !after.revision) say("ended the revision");

  return { lines, ids: [...ids] };
}

/**
 * The wall with one more change on its record: `{ at, by, lines, ids }`.
 * The same lines from the same hand within five minutes are one change (a
 * drag lands a hundred moves; a line is typed key by key), and the record
 * keeps its last fifty. A change with no lines leaves the record as it is.
 */
export function withRecord(state, entry) {
  const lines = (entry.lines ?? []).filter((line) => typeof line === "string" && line.trim());
  if (!lines.length) return state;
  const record = [...(state.record ?? [])];
  const last = record[record.length - 1];
  const at = typeof entry.at === "string" ? entry.at : new Date().toISOString();
  const by = typeof entry.by === "string" && entry.by.trim() ? entry.by.trim() : "someone";
  const ids = [...new Set((entry.ids ?? []).filter((id) => typeof id === "string"))];
  if (last && last.by === by && sameList(last.lines, lines) && Date.parse(at) - Date.parse(last.at) < MERGE_GAP_MS) {
    record[record.length - 1] = { ...last, at, ids: [...new Set([...last.ids, ...ids])] };
  } else {
    record.push({ at, by, lines, ids });
  }
  while (record.length > RECORD_CAP) record.shift();
  return { ...state, record };
}

/**
 * The record told as sessions, newest first: consecutive changes by one hand
 * with no gap over half an hour are one session, with its first and last
 * time, its count, and its lines in order (each line once; the first eight,
 * then "and N more"). `since` (an ISO time) keeps only sessions that ended
 * after it; without it, every session.
 */
export function describeRecord(state, options = {}) {
  const entries = state.record ?? [];
  const sessions = [];
  for (const entry of entries) {
    const open = sessions[sessions.length - 1];
    if (open && open.by === entry.by && Date.parse(entry.at) - Date.parse(open.to) <= SESSION_GAP_MS) {
      open.to = entry.at;
      open.count += 1;
      open.entries.push(entry);
    } else {
      sessions.push({ by: entry.by, from: entry.at, to: entry.at, count: 1, entries: [entry] });
    }
  }
  const since = typeof options.since === "string" ? Date.parse(options.since) : null;
  return sessions
    .filter((session) => since === null || Number.isNaN(since) || Date.parse(session.to) > since)
    .map((session) => {
      const seen = new Set();
      const lines = [];
      const ids = new Set();
      for (const entry of session.entries) {
        for (const id of entry.ids) ids.add(id);
        for (const line of entry.lines) if (!seen.has(line)) { seen.add(line); lines.push({ line, ids: entry.ids }); }
      }
      const shown = lines.slice(0, options.limit ?? 8);
      return { by: session.by, from: session.from, to: session.to, count: session.count, lines: shown, more: lines.length - shown.length, ids: [...ids] };
    })
    .reverse();
}

/** "21:30 to 22:27, today" for a session's span, against `now`; the date when it is not today. */
export function spanWords(from, to, now = new Date().toISOString()) {
  const day = (iso) => iso.slice(0, 10);
  const clock = (iso) => iso.slice(11, 16);
  const when = day(from) === day(now) ? "today" : day(from);
  return clock(from) === clock(to) ? `${when} ${clock(from)}` : `${when} ${clock(from)} to ${clock(to)}`;
}
