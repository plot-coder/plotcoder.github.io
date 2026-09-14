# PlotCoder — for agents

A storyline wall. Cards are scenes, beats are the big turns, arrows say what follows or pays off what. An agent driven by a person has every tool a person here has; the person directs, the agent operates. Call the tools; never fake a mouse.

The guide, read once before anything: https://plotcoder.com/guide.md — the same file as .cursor/skills/plotcoder-board/SKILL.md in the repo.

## Doors
- MCP: For Cursor or Claude Code: the server in the repo, github.com/plot-coder/plotcoder.github.io. Read the guide first, at the address above; then clone the repo, run npm ci once in it, and wire the server. From any session anywhere, once, with the repo's real path: claude mcp add plotcoder-board -s user -- node /path/to/plotcoder.github.io/scripts/plotcoder-mcp.mjs — then start the session again; a server added mid-session connects on the next one. The block below is the same wiring for a config file; give it the absolute path too, since a relative one only works with the repo as the session's folder. A server that comes up with one tool, plotcoder_not_installed, is telling you npm ci was not run in that folder. No MCP at all? node scripts/plotcoder-call.mjs <tool> '{json}' makes one call from a shell — one server per call, so undo and the project you opened do not carry to the next call; PLOTCODER_PROJECT names the project for each, and PLOTCODER_JSON=0 drops the JSON tail from its replies. PLOTCODER_ROOT points the server at the folder whose wall you mean; without it, the server uses the folder it runs from.

```
{
  "mcpServers": {
    "plotcoder-board": {
      "command": "node",
      "args": ["/path/to/plotcoder.github.io/scripts/plotcoder-mcp.mjs"]
    }
  }
}
```

- The account: With the writer's own sign-in in the server's environment, the same server works their project from anywhere, live on every open wall. The two variables go where the server is started: in the MCP config's env, as -e flags on claude mcp add, or exported in the shell before plotcoder-call. With the sign-in set, the account is the wall, even when a dev app is open on the machine. Without PLOTCODER_PROJECT it works the project touched most recently; every reply's first line names the project it read, and list_projects shows the rest. A wrong password is refused by every tool, never worked around. No account yet? claim_account makes one with the writer's email and a password they chose, and starts it empty.

```
{
  "mcpServers": {
    "plotcoder-board": {
      "command": "node",
      "args": ["/path/to/plotcoder.github.io/scripts/plotcoder-mcp.mjs"],
      "env": {
        "PLOTCODER_EMAIL": "you@example.com",
        "PLOTCODER_PASSWORD": "…",
        "PLOTCODER_PROJECT": "The Letter"
      }
    }
  }
}

claude mcp add plotcoder-board -s user \
  -e PLOTCODER_EMAIL=you@example.com \
  -e PLOTCODER_PASSWORD=… \
  -- node /path/to/plotcoder.github.io/scripts/plotcoder-mcp.mjs
```

- The page: window.plotcoder on an open wall, for a browser session.
- Where the wall lives: Without an account, a wall is a folder: any folder, empty is fine — choose one that will outlive your session, never a scratch one. The app run from that folder shows the wall, and the server writes it there (PLOTCODER_ROOT). A fresh folder holds the sample; new_board for the writer's wall, then rename_project. No app running? export_fountain is the wall in order, as text. PLOTCODER_JSON=0 drops the JSON tail from replies.
## Call these first
On the wall you will work, so after open_project or open_board, read_wall again.
1. list_words — the room's words, the app's meaning.
2. read_wall — what is here, and what it asks. A fresh folder holds a sample wall (Maya, Tom, the letter) and says so; it is not the writer's.
3. list_workflows — what a writer can ask you for.
4. list_reminders — the writer's principles, before you change anything.

## Rules
- Questions, not fixes, until the writer says.
- No opinions about how many beats there should be.
- Page counts are estimates.
- Ask before delete_board, unlock_numbers, remove_file, or claim_account — the writer gives the email and the password; never invent one.
- Do not invent people or a logline. What the treatment states — an age, a job, a bad knee — is not invented: it goes in the person's notes. An unnamed person is named by their role — Dana's mother, the dispatcher — which is a name until the writer gives one. A scene is one place and one stretch of time; a new place or time is a new card. A beat is a whole card; a setup arrow lands on the scene's card, so a payoff never needs a card of its own. Acts are groups titled Act one, Act two, when the treatment has them; the wall never asks whether an act is a sequence. Paper colour means nothing to the app. Under target is a fact to report plainly, like over; neither is a verdict.

## For the person
Give your agent the account door only on a machine you trust; it signs in as you and shows under People as “an agent, as you” while it runs. Your agent can also make your account: give it your email and a password of your choosing.

## The guide
https://plotcoder.com/guide.md — the same file as .cursor/skills/plotcoder-board/SKILL.md in the repo
