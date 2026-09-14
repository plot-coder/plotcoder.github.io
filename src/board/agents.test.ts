import { describe, expect, it } from "vitest";
import { AGENTS, agentsAsText } from "./agents";

describe("the agent on-ramp (R43)", () => {
  it("names the three doors, the three calls in order, and the rule about accounts", () => {
    expect(AGENTS.doors.map((door) => door.id)).toEqual(["mcp", "shell", "account", "page", "where"]);
    expect(AGENTS.first.map((item) => item.tool)).toEqual(["list_words", "read_wall", "list_workflows", "list_reminders"]);
    expect(AGENTS.doors[0].text).toContain("npm ci");
    expect(AGENTS.doors[1].text).toContain("plotcoder-call.mjs");
    expect(AGENTS.doors[1].text).toContain("--batch");
    expect(AGENTS.person).toContain("before you start");
    expect(AGENTS.rules.some((rule) => rule.includes("claim_account") && rule.includes("never invent"))).toBe(true);
    expect(AGENTS.doors[0].code).toContain('"plotcoder-board"');
  });

  it("reads as one text for the file and an agent", () => {
    const text = agentsAsText();
    expect(text.startsWith("# PlotCoder — for agents\n")).toBe(true);
    expect(text).toContain("## Doors\n- MCP, for the next session:");
    expect(text).toContain("1. list_words — ");
    expect(text).toContain("## For the person");
    expect(text).not.toContain("PLOTCODER_PASSWORD=x");
  });
});
