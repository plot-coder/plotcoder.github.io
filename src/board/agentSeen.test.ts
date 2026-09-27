import { describe, expect, it } from "vitest";
import { agentSeen, agoShort, agoWords, basicHeader, firstMessage } from "./agentSeen";

const NOW = "2026-09-27T20:00:00.000Z";

describe("whether an agent is on the wall, and when one last was (R81)", () => {
  it("says an agent is here when one follows the project's channel, whatever the record says", () => {
    const seen = agentSeen({ present: ["Robert", "an agent, as robert@example.com"], sessionAt: "2026-09-20T10:00:00.000Z", now: NOW });
    expect(seen).toMatchObject({ state: "here", short: "Agent · here", words: "An agent is on this wall now." });
  });

  it("says when one last was, by the newer of its session and its last change, and what it changed", () => {
    const record = [
      { by: "an agent", at: "2026-09-27T18:00:00.000Z", lines: ['made "The wall"', 'wrote "The wall" (1/8 pages)'] },
      { by: "Robert", at: "2026-09-27T19:50:00.000Z", lines: ['moved "The wall" on the wall'] },
    ];
    expect(agentSeen({ present: ["Robert"], sessionAt: "2026-09-27T19:48:00.000Z", record, now: NOW })).toEqual({
      state: "seen",
      at: "2026-09-27T19:48:00.000Z",
      short: "Agent · 12 min",
      words: "An agent was last here 12 minutes ago.",
      changed: { at: "2026-09-27T18:00:00.000Z", line: 'wrote "The wall" (1/8 pages)' },
    });
    // Signed out there is no session to read: the record alone says.
    expect(agentSeen({ record, now: NOW })).toMatchObject({ state: "seen", at: "2026-09-27T18:00:00.000Z", short: "Agent · 2 h" });
  });

  it("says no agent has been, and never that one is available", () => {
    const seen = agentSeen({ present: ["Robert"], record: [{ by: "Robert", at: NOW, lines: ["x"] }], now: NOW });
    expect(seen).toEqual({ state: "never", at: null, short: "Add your agent", words: "No agent has been on this wall yet.", changed: null });
    expect(JSON.stringify([agentSeen({ now: NOW }), agentSeen({ present: ["an agent, as a@b.c"], now: NOW })])).not.toMatch(/available/i);
  });

  it("says how long ago in words a person reads", () => {
    const at = (minutes: number) => new Date(Date.parse(NOW) - minutes * 60000).toISOString();
    expect([0, 1, 2, 59, 60, 119, 120, 60 * 23, 60 * 30, 60 * 72].map((minutes) => agoWords(at(minutes), NOW))).toEqual([
      "just now", "just now", "2 minutes ago", "59 minutes ago", "an hour ago", "an hour ago", "2 hours ago", "23 hours ago", "yesterday", "on 24 September",
    ]);
    expect([0, 12, 60, 180, 60 * 30, 60 * 72].map((minutes) => agoShort(at(minutes), NOW))).toEqual(["now", "12 min", "1 h", "3 h", "yesterday", "24 Sep"]);
  });
});

describe("what the writer copies (R81)", () => {
  it("makes the connector's header on the device, from any character", () => {
    expect(basicHeader(" test@test.com ", "test")).toBe("Basic dGVzdEB0ZXN0LmNvbTp0ZXN0");
    expect(atob(basicHeader("a@b.c", "p:ss wörd").slice(6))).toBe(String.fromCharCode(...new TextEncoder().encode("a@b.c:p:ss wörd")));
  });

  it("writes a first message that names the project and changes nothing", () => {
    expect(firstMessage("Low Water")).toBe('I am working in PlotCoder on my project "Low Water", and I have it open on my screen. Use the PlotCoder tools: call list_projects, open_project with "Low Water", then read_wall, and tell me in a few sentences what is on the wall and what it asks. Change nothing until I say.');
    expect(firstMessage("")).toContain("call list_projects, then read_wall");
  });
});
