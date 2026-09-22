import { describe, expect, it } from "vitest";
import { AGENTS, agentsAsText, agentsInstructions, wiringAsText } from "./agents";

describe("the agent on-ramp (R43)", () => {
  it("names the three doors, the three calls in order, and the rule about accounts", () => {
    expect(AGENTS.doors.map((door) => door.id)).toEqual(["mcp", "shell", "hosted", "account", "page", "where"]);
    // Which wall is in hand comes before reading one (round twenty-three, entry 4).
    expect(AGENTS.first.map((item) => item.tool)).toEqual(["list_words", "list_workflows", "list_projects", "read_wall", "list_reminders", "list_board"]);
    expect(AGENTS.doors[0].text).toContain("npx -y plotcoder-board@latest");
    expect(AGENTS.doors[2].text).toContain("--transport http");
    expect(AGENTS.doors[1].text).toContain("plotcoder-board@latest call");
    expect(AGENTS.doors[1].text).toContain("--batch");
    expect(AGENTS.person).toContain("before you start");
    expect(AGENTS.rules.some((rule) => rule.includes("claim_account") && rule.includes("never invent"))).toBe(true);
    expect(AGENTS.doors[0].code).toContain('"plotcoder-board"');
  });

  it("reads as one text for the file and an agent", () => {
    const text = agentsAsText();
    expect(text.startsWith("# PlotCoder — for agents\n")).toBe(true);
    expect(text).toContain("1. list_words — ");
    expect(text).not.toContain("PLOTCODER_PASSWORD=x");
    // Someone holding the tools reads no wiring: the doors are on a page of their own (round twenty-three, entries 1, 2).
    expect(text).not.toContain("## Doors");
    expect(text).not.toContain("npx -y plotcoder-board");
    expect(text).toContain("https://plotcoder.com/day-one.md");
    expect(text).toContain("https://plotcoder.com/wiring.md");
    const wiring = wiringAsText();
    expect(wiring).toContain("## Doors\n- MCP, for the next session:");
    expect(wiring).toContain("## For the person");
  });

  it("hands the day's rules over at the handshake, short enough to be read and naming every first call", () => {
    const text = agentsInstructions();
    for (const item of AGENTS.first) expect(text).toContain(item.tool);
    for (const tool of ["add_open_line", "set_aside", "set_alternative", "set_open", "list_workflows"]) expect(text).toContain(tool);
    expect(text).toContain("nothing is a beat on your word");
    // The Claude desktop app cuts a server's instructions at 2048 characters (pass 1a, entry 1).
    expect(text.length).toBeLessThan(2000);
    for (const word of ["delete_project", "empty_account", "claim_account", "export_project first"]) expect(text).toContain(word);
  });
});
