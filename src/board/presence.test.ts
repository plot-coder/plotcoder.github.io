import { describe, expect, it } from "vitest";
import { describePresence, readPresence } from "./presence";

describe("who has the wall open (round twenty-two, entries 93, 94)", () => {
  const state = {
    a: [{ name: "Robert" }],
    b: [{ name: "an agent, as test@test.com" }],
    c: [{ name: "Robert" }, { name: "" }, {}],
  };

  it("reads people apart from agents, each once", () => {
    expect(readPresence(state)).toEqual({ people: ["Robert"], agents: ["an agent, as test@test.com"] });
    expect(readPresence(null)).toEqual({ people: [], agents: [] });
  });

  it("says whose screen, and says the agent apart", () => {
    const line = describePresence(state, { synced: true, project: "The Last Bus" });
    expect(line).toContain('"The Last Bus" is open on Robert\'s screen right now.');
    expect(line).toContain("an agent, as test@test.com — this session");
  });

  it("says nobody only when it could see, and says so when it could not", () => {
    expect(describePresence({ b: [{ name: "an agent, as a@b.c" }] }, { synced: true, project: "P" })).toContain('Nobody has a wall of "P" open in the app right now');
    const blind = describePresence({}, { synced: false, project: "P" });
    expect(blind).toContain("Could not see in time");
    expect(blind).not.toContain("Nobody");
  });
});
