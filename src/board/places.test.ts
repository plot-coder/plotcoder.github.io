import { describe, expect, it } from "vitest";
import { emptyProject, normalizeProject } from "./project";
import { normalizePlaces, placeKey, placeLine, placePage, renamePlacePage, updatePlace } from "./places";

const NOW = "2026-09-27T09:00:00.000Z";

describe("a place's page (R79)", () => {
  it("makes a page when the first line is written, finds it spelt any way, and drops it when every line is cleared", () => {
    const project = emptyProject(NOW);
    expect(placePage(project, "the harbour office")).toBeNull();
    const written = updatePlace(project, "  INT. THE HARBOUR  OFFICE ", { looks: "One room over the slip.", open: "the era — not decided — R." }, NOW);
    expect(written.places).toEqual([{ name: "INT. THE HARBOUR OFFICE", looks: "One room over the slip.", sound: "", notes: "", open: "the era — not decided — R." }]);
    expect(placePage(written, "int. the harbour office")?.looks).toBe("One room over the slip.");
    expect(placeKey(" Int.  The Harbour Office")).toBe("int. the harbour office");
    const more = updatePlace(written, "int. the harbour office", { sound: "Rain on the one window." }, NOW);
    expect(more.places?.[0]).toMatchObject({ name: "INT. THE HARBOUR OFFICE", looks: "One room over the slip.", sound: "Rain on the one window." });
    expect(updatePlace(more, "INT. THE HARBOUR OFFICE", { sound: "Rain on the one window." }, NOW)).toBe(more);
    const cleared = updatePlace(more, "INT. THE HARBOUR OFFICE", { looks: "", sound: "", open: "" }, NOW);
    expect(cleared.places).toEqual([]);
    expect(placeLine(more.places![0])).toBe("looks: One room over the slip.; sound: Rain on the one window.; not decided, by the writer's word: the era — not decided — R.");
  });

  it("moves a page with a rename and merges two pages line by line", () => {
    let project = updatePlace(emptyProject(NOW), "the office", { looks: "Small.", notes: "Nell's father's." }, NOW);
    project = updatePlace(project, "the harbour office", { looks: "One room.", sound: "Rain." }, NOW);
    const merged = renamePlacePage(project, "the office", "The Harbour Office", NOW);
    expect(merged.places).toEqual([{ name: "The Harbour Office", looks: "One room.", sound: "Rain.", notes: "Nell's father's.", open: "" }]);
    expect(renamePlacePage(project, "nowhere", "somewhere", NOW)).toBe(project);
  });

  it("is repaired on the project record, and absent stays absent", () => {
    const repaired = normalizePlaces([{ name: " the slip " , looks: " Weed. " }, { name: "THE SLIP", looks: "twice" }, { name: "empty" }, "junk", null]);
    expect(repaired).toEqual([{ name: "the slip", looks: "Weed.", sound: "", notes: "", open: "" }]);
    const project = emptyProject(NOW);
    expect("places" in normalizeProject(project, NOW)).toBe(false);
    expect(normalizeProject({ ...project, places: [{ name: "the slip", sound: "Gulls." }] }, NOW).places).toEqual([{ name: "the slip", looks: "", sound: "Gulls.", notes: "", open: "" }]);
  });
});
