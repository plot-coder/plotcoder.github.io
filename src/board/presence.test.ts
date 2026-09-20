import { describe, expect, it } from "vitest";
import { describePresence, presenceTail, readPresence } from "./presence";

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

  it("says presence in a write's tail only when it has changed (entry 95)", () => {
    const first = presenceTail([], null, false);
    expect(first.text).toContain("no wall open right now");
    const second = presenceTail([], first.key, false);
    expect(second.text).toBe(" (saved to the account)");
    const arrived = presenceTail(["Robert"], second.key, false);
    expect(arrived.text).toContain("open on Robert's screen now");
    expect(presenceTail(["Robert"], arrived.key, false).text).toBe(" (saved to the account)");
    expect(presenceTail([], arrived.key, false).text).toContain("no wall open right now");
    // The hosted door cannot see presence in time, and claims nothing.
    expect(presenceTail([], null, true).text).not.toContain("no wall open");
  });

  it("says nobody only when it could see, and says so when it could not", () => {
    expect(describePresence({ b: [{ name: "an agent, as a@b.c" }] }, { synced: true, project: "P" })).toContain('Nobody has a wall of "P" open in the app right now');
    const blind = describePresence({}, { synced: false, project: "P" });
    expect(blind).toContain("Could not see in time");
    expect(blind).not.toContain("Nobody");
  });
});
