// Are you an agent? Start here (R43).
//
// The on-ramp, written once: what PlotCoder is in three sentences, the doors
// in, what to call first, the rules in one breath, and a part for the person
// about trust. The Agents sheet reads it, the file at /llms.txt is generated
// from it, and the README's agent section says the same. DOM-free.

export const AGENTS = {
  lead:
    "A storyline wall. Cards are scenes, beats are the big turns, arrows say what follows or pays off what. An agent driven by a person has every tool a person here has; the person directs, the agent operates. Call the tools; never fake a mouse.",
  doors: [
    {
      id: "mcp",
      name: "MCP",
      text: "For Cursor or Claude Code: the server in the repo, github.com/plot-coder/plotcoder.github.io. Clone it, run npm ci once, then wire it by this. No MCP where you are? node scripts/plotcoder-call.mjs <tool> '{json}' makes one call from a shell; PLOTCODER_ROOT points the server at the folder whose wall you mean.",
      code: '{\n  "mcpServers": {\n    "plotcoder-board": {\n      "command": "node",\n      "args": ["scripts/plotcoder-mcp.mjs"]\n    }\n  }\n}',
    },
    {
      id: "account",
      name: "The account",
      text: "With the writer's own sign-in in the environment, the same server works their project from anywhere, live on every open wall. No account yet? claim_account makes one with the writer's email and a password they chose.",
      code: "PLOTCODER_EMAIL=you@example.com\nPLOTCODER_PASSWORD=…\nPLOTCODER_PROJECT=The Letter   # optional",
    },
    {
      id: "page",
      name: "The page",
      text: "window.plotcoder on an open wall, for a browser session.",
    },
  ],
  first: [
    { tool: "list_words", why: "the room's words, the app's meaning." },
    { tool: "read_wall", why: "what is here, and what it asks. A fresh folder holds a sample wall (Maya, Tom, the letter) and says so; it is not the writer's." },
    { tool: "list_workflows", why: "what a writer can ask you for." },
    { tool: "list_reminders", why: "the writer's principles, before you change anything." },
  ],
  rules: [
    "Questions, not fixes, until the writer says.",
    "No opinions about how many beats there should be.",
    "Page counts are estimates.",
    "Ask before delete_board, unlock_numbers, remove_file, or claim_account — the writer gives the email and the password; never invent one.",
    "Do not invent people or a logline. An unnamed person in a treatment is named by their role — Dana's mother, the dispatcher — which is a name until the writer gives one. A beat is a whole card. Acts are not a thing on the wall; a structure's beats are the act breaks.",
  ],
  person:
    "Give your agent the account door only on a machine you trust; it signs in as you and shows under People as “an agent, as you” while it runs. Your agent can also make your account: give it your email and a password of your choosing.",
  guide: ".cursor/skills/plotcoder-board/SKILL.md in the repo",
  url: "https://plotcoder.com/llms.txt",
};

/** The on-ramp as one text: the file at /llms.txt, and what an agent reads. */
export function agentsAsText() {
  const lines = ["# PlotCoder — for agents", "", AGENTS.lead, "", "## Doors"];
  for (const door of AGENTS.doors) {
    lines.push(`- ${door.name}: ${door.text}`);
    if (door.code) lines.push("", "```", door.code, "```", "");
  }
  lines.push("## Call these first");
  AGENTS.first.forEach((item, index) => lines.push(`${index + 1}. ${item.tool} — ${item.why}`));
  lines.push("", "## Rules");
  for (const rule of AGENTS.rules) lines.push(`- ${rule}`);
  lines.push("", "## For the person", AGENTS.person, "", "## The guide", AGENTS.guide, "");
  return lines.join("\n");
}
