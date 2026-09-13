# PlotCoder — for agents

A storyline wall. Cards are scenes, beats are the big turns, arrows say what follows or pays off what. An agent driven by a person has every tool a person here has; the person directs, the agent operates. Call the tools; never fake a mouse.

## Doors
- MCP: For Cursor or Claude Code: the server in the repo, github.com/plot-coder/plotcoder.github.io. Clone it, run npm ci once, then wire it by this. The wiring is project-scoped: it loads when a session opens with the repo as its folder. For any session anywhere, once: claude mcp add plotcoder-board -s user -- node /path/to/plotcoder.github.io/scripts/plotcoder-mcp.mjs. No MCP at all? node scripts/plotcoder-call.mjs <tool> '{json}' makes one call from a shell. PLOTCODER_ROOT points the server at the folder whose wall you mean; without it, the server uses the folder it runs from.

```
{
  "mcpServers": {
    "plotcoder-board": {
      "command": "node",
      "args": ["scripts/plotcoder-mcp.mjs"]
    }
  }
}
```

- The account: With the writer's own sign-in in the environment, the same server works their project from anywhere, live on every open wall. No account yet? claim_account makes one with the writer's email and a password they chose.

```
PLOTCODER_EMAIL=you@example.com
PLOTCODER_PASSWORD=…
PLOTCODER_PROJECT=The Letter   # optional
```

- The page: window.plotcoder on an open wall, for a browser session.
- Where the wall lives: Without an account, a wall is a folder: the app run from that folder shows it, and the server writes it there (PLOTCODER_ROOT). A fresh folder holds the sample; new_board for the writer's wall, or replace the sample. No app running? export_fountain is the wall in order, as text. PLOTCODER_JSON=0 drops the JSON tail from replies.
## Call these first
1. list_words — the room's words, the app's meaning.
2. read_wall — what is here, and what it asks. A fresh folder holds a sample wall (Maya, Tom, the letter) and says so; it is not the writer's.
3. list_workflows — what a writer can ask you for.
4. list_reminders — the writer's principles, before you change anything.

## Rules
- Questions, not fixes, until the writer says.
- No opinions about how many beats there should be.
- Page counts are estimates.
- Ask before delete_board, unlock_numbers, remove_file, or claim_account — the writer gives the email and the password; never invent one.
- Do not invent people or a logline. An unnamed person in a treatment is named by their role — Dana's mother, the dispatcher — which is a name until the writer gives one. A beat is a whole card; a setup arrow lands on the scene's card, so a payoff never needs a card of its own. Acts are groups titled Act one, Act two, when the treatment has them. Paper colour means nothing to the app.

## For the person
Give your agent the account door only on a machine you trust; it signs in as you and shows under People as “an agent, as you” while it runs. Your agent can also make your account: give it your email and a password of your choosing.

## The guide
.cursor/skills/plotcoder-board/SKILL.md in the repo
