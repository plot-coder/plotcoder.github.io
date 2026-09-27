import { describe, expect, it } from "vitest";
import { AGENTS, agentsAsText, agentsInstructions, wiringAsText } from "./agents";
import { AGENTS_SHEET } from "./agents";

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

describe("the on-ramp as a person meets it (the Agents sheet, refreshed)", () => {
  it("holds every tab to doors the on-ramp has, and every line to copy to a phrase of its door", () => {
    const doors = new Map(AGENTS.doors.map((door) => [door.id, `${door.text}\n${door.code ?? ""}`]));
    expect(AGENTS_SHEET.tabs.map((tab) => tab.name)).toEqual(["Claude app", "Claude Code · Cursor", "A shell, no setup", "Your own server"]);
    for (const tab of AGENTS_SHEET.tabs) {
      expect(tab.doors.length).toBeGreaterThan(0);
      for (const id of tab.doors) expect(doors.has(id), `${tab.id}: door ${id}`).toBe(true);
      const words = tab.doors.map((id) => doors.get(id)).join("\n");
      for (const step of tab.steps) {
        expect(step.say.length).toBeLessThan(200);
        if (!step.copy) continue;
        expect(step.from, `${tab.id}: a line to copy names the phrase it is held to`).toBeTruthy();
        expect(step.copy).toContain(step.from);
        expect(words, `${tab.id}: "${step.from}" is the door's own`).toContain(step.from);
      }
    }
    // Every door is behind some tab: nothing the agent is told is out of a person's reach.
    const reached = new Set(AGENTS_SHEET.tabs.flatMap((tab) => tab.doors));
    expect(AGENTS.doors.map((door) => door.id).filter((id) => !reached.has(id))).toEqual([]);
  });

  it("folds the agent's own sections, and shortens the rules without adding one", () => {
    expect(AGENTS_SHEET.folds.map((fold) => fold.whole)).toEqual(["firstNote", "rules", "person"]);
    const rules = AGENTS.rules.join(" ");
    expect(rules).toContain("Questions, not fixes, until the writer says.");
    expect(rules).toContain("Page counts are estimates.");
    for (const tool of ["delete_board", "delete_project", "delete_account", "unlock_numbers", "remove_file", "claim_account"]) expect(rules).toContain(tool);
    expect(rules).toContain("Do not invent people or a logline.");
    expect(AGENTS_SHEET.folds[1].lines).toHaveLength(5);
  });
});
