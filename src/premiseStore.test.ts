import { afterEach, describe, expect, it, vi } from "vitest";
import { listProjectKeys } from "./projectStore";
import { PREMISE_KEY, isProjectMeta, readPremise, writePremise } from "./premiseStore";

// Mirrors the stand-in in projectStore.test.ts: the data lives in enumerable own
// properties so Object.keys behaves the way a real Storage object does.
function useStorage(seed: Record<string, string> = {}) {
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

  vi.stubGlobal("localStorage", store as unknown as Storage);
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readPremise", () => {
  it("is empty when nothing has been written", () => {
    useStorage();
    expect(readPremise()).toBe("");
  });

  it("reads back what was written", () => {
    useStorage();
    writePremise("A town that keeps its secrets kills its young.");
    expect(readPremise()).toBe("A town that keeps its secrets kills its young.");
  });

  it("trims on the way in", () => {
    useStorage();
    writePremise("   Loyalty is a debt.   ");
    expect(readPremise()).toBe("Loyalty is a debt.");
  });

  it("survives junk in the key rather than throwing", () => {
    useStorage({ [PREMISE_KEY]: "not json" });
    expect(readPremise()).toBe("");
  });

  it("ignores a value of the wrong shape", () => {
    useStorage({ [PREMISE_KEY]: JSON.stringify({ premise: 42 }) });
    expect(readPremise()).toBe("");
  });
});

describe("writePremise", () => {
  it("removes the key when cleared, so an empty premise leaves no trace", () => {
    const store = useStorage();
    writePremise("Something.");
    expect(PREMISE_KEY in store).toBe(true);
    writePremise("   ");
    expect(PREMISE_KEY in store).toBe(false);
  });
});

// The premise sits beside the board rather than inside it, so the thing that
// makes Save/Open carry it is the plotcoder.* prefix — not any explicit wiring.
describe("the premise rides along with a saved project", () => {
  it("is picked up by listProjectKeys", () => {
    useStorage();
    writePremise("A premise.");
    expect(listProjectKeys()).toContain(PREMISE_KEY);
  });
});

describe("isProjectMeta", () => {
  it.each([
    [{ premise: "" }, true],
    [{ premise: "x" }, true],
    [{ premise: 1 }, false],
    [{}, false],
    [null, false],
    ["premise", false],
  ])("%o -> %s", (value, expected) => {
    expect(isProjectMeta(value)).toBe(expected);
  });
});
