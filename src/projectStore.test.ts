import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportProject,
  importProject,
  isPlotCoderProject,
  listProjectKeys,
  projectFileName,
} from "./projectStore";

// A stand-in for localStorage. The data lives in enumerable own properties so
// that Object.keys(localStorage) behaves the way the real Storage object does,
// which is how listProjectKeys finds the project keys.
function fakeStorage(seed: Record<string, string> = {}) {
  const store: Record<string, string> = { ...seed };
  const method = (value: unknown) => ({ value, enumerable: false, writable: true });

  Object.defineProperties(store, {
    getItem: method((key: string) => (key in store ? store[key] : null)),
    setItem: method((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: method((key: string) => {
      delete store[key];
    }),
  });

  return store as unknown as Storage;
}

function useStorage(seed: Record<string, string> = {}) {
  const storage = fakeStorage(seed);
  vi.stubGlobal("localStorage", storage);
  return storage as unknown as Record<string, string>;
}

const BOARD = '[{"id":"a","headline":"Maya finds the letter"}]';

beforeEach(() => {
  useStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isPlotCoderProject", () => {
  const valid = {
    app: "plotcoder",
    version: 1,
    exportedAt: "2026-01-01T00:00:00.000Z",
    storage: { "plotcoder.notes": BOARD },
  };

  it("accepts a file this app wrote", () => {
    expect(isPlotCoderProject(valid)).toBe(true);
  });

  it("accepts a project with nothing saved yet", () => {
    expect(isPlotCoderProject({ ...valid, storage: {} })).toBe(true);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "plotcoder"],
    ["a number", 42],
    ["an array", []],
    ["some other app's export", { ...valid, app: "notplotcoder" }],
    ["a version that is not a number", { ...valid, version: "1" }],
    ["a missing timestamp", { ...valid, exportedAt: undefined }],
    ["no storage bag", { ...valid, storage: undefined }],
    ["a storage array", { ...valid, storage: [] }],
    ["storage values that are not strings", { ...valid, storage: { "plotcoder.notes": [1, 2] } }],
  ])("rejects %s", (_label, value) => {
    expect(isPlotCoderProject(value)).toBe(false);
  });
});

describe("exportProject", () => {
  it("collects the app's keys and ignores everything else on the origin", () => {
    useStorage({
      "plotcoder.notes": BOARD,
      "plotcoder.theme": "dark",
      "some-other-app.token": "secret",
    });

    const project = exportProject();

    expect(project.app).toBe("plotcoder");
    expect(project.version).toBe(2);
    expect(Object.keys(project.storage).sort()).toEqual(["plotcoder.notes", "plotcoder.theme"]);
    expect(project.storage["plotcoder.notes"]).toBe(BOARD);
  });

  it("writes a file the importer will accept", () => {
    useStorage({ "plotcoder.notes": BOARD });
    expect(isPlotCoderProject(exportProject())).toBe(true);
  });
});

describe("importProject", () => {
  it("refuses a file that is not a PlotCoder project", () => {
    const storage = useStorage({ "plotcoder.notes": BOARD });

    expect(() => importProject({ hello: "world" })).toThrow(/not a PlotCoder project/);
    expect(() => importProject(null)).toThrow();
    expect(storage["plotcoder.notes"]).toBe(BOARD);
  });

  it("replaces the board rather than merging into it", () => {
    const storage = useStorage({
      "plotcoder.notes": BOARD,
      "plotcoder.arrows": '[{"id":"x"}]',
    });

    importProject({
      app: "plotcoder",
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      storage: { "plotcoder.notes": "[]" },
    });

    expect(storage["plotcoder.notes"]).toBe("[]");
    // The old arrows are gone, not left over from the board being replaced.
    expect(listProjectKeys()).toEqual(["plotcoder.notes"]);
  });

  it("leaves other apps' keys on the origin alone", () => {
    const storage = useStorage({
      "plotcoder.notes": BOARD,
      "some-other-app.token": "secret",
    });

    importProject({
      app: "plotcoder",
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      storage: { "plotcoder.notes": "[]", "some-other-app.token": "overwritten" },
    });

    expect(storage["some-other-app.token"]).toBe("secret");
  });

  it("round-trips a board through save and open", () => {
    const storage = useStorage({ "plotcoder.notes": BOARD, "plotcoder.theme": "dark" });
    const saved = exportProject();

    storage["plotcoder.notes"] = "[]";
    delete storage["plotcoder.theme"];

    importProject(saved);

    expect(storage["plotcoder.notes"]).toBe(BOARD);
    expect(storage["plotcoder.theme"]).toBe("dark");
  });
});

describe("projectFileName", () => {
  it("stamps the file with the date", () => {
    expect(projectFileName(new Date("2026-09-12T22:03:33.837Z"))).toBe("plotcoder-2026-09-12.json");
  });
});
