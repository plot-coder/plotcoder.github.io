// A place's page (R79; pass 4a, entries 7, 18, 45; drawn in
// docs/mockups/r79-a-places-page.html): what the camera sees there, what is
// heard when nobody speaks, notes, and what is open by the writer's word —
// kept on the project, one page for every board, keyed by the phrase the
// cards already carry, spelt any way (as boardPlaces reads it). A page exists
// only once a line is written on it: an unwritten place is its phrase and its
// cards, and asks nothing. Pure and DOM-free: the project's own record.

export const PLACE_FIELDS = ["looks", "sound", "notes"];

const clean = (value) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "");
const text = (value) => (typeof value === "string" ? value.trim() : "");
/** The key a place is found by: case and spacing aside, as the wall reads two spellings of one place. */
export const placeKey = (name) => clean(name).toLowerCase();

function hasLine(page) {
  return [...PLACE_FIELDS, "open"].some((field) => (page[field] ?? "").trim());
}

/** The project's pages, repaired: named, each line a string, one page a place, no page without a line. */
export function normalizePlaces(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const name = clean(item.name);
    const key = placeKey(name);
    if (!name || seen.has(key)) continue;
    const page = { name, looks: text(item.looks), sound: text(item.sound), notes: text(item.notes), open: clean(item.open) };
    if (!hasLine(page)) continue;
    seen.add(key);
    out.push(page);
  }
  return out;
}

/** True when two lists of pages say the same. */
function samePages(a, b) {
  return a.length === b.length && a.every((page, index) => ["name", ...PLACE_FIELDS, "open"].every((field) => page[field] === b[index][field]));
}

/** The page of a place, spelt any way, or null when nothing is written on it. */
export function placePage(project, name) {
  const key = placeKey(name);
  return (project.places ?? []).find((page) => placeKey(page.name) === key) ?? null;
}

/**
 * Write lines on a place's page: any of looks, sound, notes, open; undefined
 * leaves a line as it is, "" clears it. The first line written makes the
 * page, spelt as given; a page with every line cleared is gone. Returns the
 * project, the same object when nothing changed.
 */
export function updatePlace(project, name, fields, now = new Date().toISOString()) {
  const spelt = clean(name);
  if (!spelt) return project;
  const pages = normalizePlaces(project.places);
  const at = pages.findIndex((page) => placeKey(page.name) === placeKey(spelt));
  const was = at >= 0 ? pages[at] : { name: spelt, looks: "", sound: "", notes: "", open: "" };
  const next = { ...was };
  for (const field of PLACE_FIELDS) if (typeof fields?.[field] === "string") next[field] = text(fields[field]);
  if (typeof fields?.open === "string") next.open = clean(fields.open);
  const list = [...pages];
  if (at >= 0) list.splice(at, 1, next);
  else list.push(next);
  const places = normalizePlaces(list);
  if (samePages(places, normalizePlaces(project.places))) return project;
  return { ...project, places, updatedAt: now };
}

/**
 * A place renamed (the cards follow through the kernel, board by board): its
 * page follows the new phrase. When the new phrase already has a page, the
 * two merge line by line, the line already written on the new one standing
 * and an empty one taking the old one's.
 */
export function renamePlacePage(project, from, to, now = new Date().toISOString()) {
  const old = placePage(project, from);
  const spelt = clean(to);
  if (!old || !spelt || placeKey(from) === placeKey(spelt) && old.name === spelt) return project;
  const there = placeKey(from) === placeKey(spelt) ? null : placePage(project, spelt);
  const merged = { name: spelt, looks: "", sound: "", notes: "", open: "" };
  for (const field of [...PLACE_FIELDS, "open"]) merged[field] = (there?.[field] ?? "") || old[field];
  const places = normalizePlaces([
    ...(project.places ?? []).filter((page) => placeKey(page.name) !== placeKey(from) && placeKey(page.name) !== placeKey(spelt)),
    merged,
  ]);
  return { ...project, places, updatedAt: now };
}

/** The page as one line for a brief or a reading: "looks: …; sound: …; notes: …; not decided, by the writer's word: …", or "". */
export function placeLine(page) {
  if (!page) return "";
  return [
    page.looks ? `looks: ${page.looks}` : "",
    page.sound ? `sound: ${page.sound}` : "",
    page.notes ? `notes: ${page.notes}` : "",
    page.open ? `not decided, by the writer's word: ${page.open}` : "",
  ].filter(Boolean).join("; ");
}
