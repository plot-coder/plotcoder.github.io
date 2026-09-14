# PlotCoder — for agents

A storyline wall. Cards are scenes, beats are the big turns, arrows say what follows or pays off what. An agent driven by a person has every tool a person here has; the person directs, the agent operates. Call the tools; never fake a mouse.

The guide, read once before anything: https://plotcoder.com/guide.md — the same file as .cursor/skills/plotcoder-board/SKILL.md in the repo.

## Doors
- MCP, for the next session: For Cursor or Claude Code. Clone the repo, github.com/plot-coder/plotcoder.github.io, run npm ci once in it, then wire the server with the repo's real path: claude mcp add plotcoder-board -s user -- node /path/to/plotcoder.github.io/scripts/plotcoder-mcp.mjs — and start the session again. A server wired from inside a session connects on the next one, never the one you are in; an agent already inside a session takes the shell door below. The block is the same wiring for a config file; give it the absolute path too, since a relative one only works with the repo as the session's folder. A server that comes up with one tool, plotcoder_not_installed, is telling you npm ci was not run in that folder.

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

- The shell, for this session: node scripts/plotcoder-call.mjs <tool> '{json}' makes one call, with no MCP and no restart. One server per call, so undo and the project you opened do not carry between calls; node scripts/plotcoder-call.mjs --batch < calls.jsonl runs a file of calls — one per line, {"tool": "…", "arguments": {…}} — on one server, so they do. With the account door the sign-in is kept in the repo's .plotcoder folder between calls (PLOTCODER_SESSION=0 to sign in every time). PLOTCODER_PROJECT names the project for each call. The JSON tail is off on this door; PLOTCODER_JSON=1 keeps it. PLOTCODER_ROOT points the server at the folder whose wall you mean; without it, the server uses the folder it runs from.
- The account: With the writer's own sign-in in the server's environment, the same server works their project from anywhere, live on every open wall. The two variables go where the server is started: in the MCP config's env, as -e flags on claude mcp add, or exported in the shell before plotcoder-call. With the sign-in set, the account is the wall, even when a dev app is open on the machine. Without PLOTCODER_PROJECT it works the project touched most recently. Every read of the wall or the project names the project it read; the app's own lists — list_words, list_workflows — belong to no project. A wrong password is refused by every tool, never worked around. No account yet? claim_account makes one with the writer's email and a password they chose, and starts it empty.

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
- Where the wall lives, without an account: Skip this when the account is the wall. Without an account, a wall is a folder: any folder, empty is fine — choose one that will outlive your session, never a scratch one. The app run from that folder shows the wall, and the server writes it there (PLOTCODER_ROOT). A fresh folder holds the sample; new_board for the writer's wall, then rename_project. No app running? export_fountain is the wall in order, as text.
## Call these first
On the wall you will work, so after open_project or open_board, read_wall again. No server in front of you, and no shell to take the shell door? Nothing gets you in from inside the session: say so, and ask the person to wire the server and start a new session.
1. list_words — the room's words, the app's meaning.
2. read_wall — what is here, and what it asks. A fresh folder holds a sample wall (Maya, Tom, the letter) and says so; it is not the writer's.
3. list_workflows — what a writer can ask you for.
4. list_reminders — the house principles the app starts with, and the writer's own; read them before you change anything.

## Rules
- Questions, not fixes, until the writer says.
- No opinions about how many beats there should be.
- Page counts are estimates.
- Ask before delete_board, delete_project, empty_account, delete_account, unlock_numbers, remove_file, an import_project that replaces, or claim_account — the writer gives the email and the password; never invent one. export_project first, when something might be wanted back.
- Do not invent people or a logline. What the treatment states — an age, a job, a bad knee — is not invented: it goes in the person's notes. An unnamed person is named by their role — Dana's mother, the dispatcher — which is a name until the writer gives one. A scene is one place and one stretch of time; a new place or time is a new card. A beat is a whole card; a setup arrow lands on the scene's card, so a payoff never needs a card of its own. Acts are groups titled Act one, Act two, when the treatment has them; the wall never asks whether an act is a sequence. Paper colour means nothing to the app. Under target is a fact to report plainly, like over; neither is a verdict.

## For the person
Give your agent the account door only on a machine you trust; it signs in as you and shows under People as “an agent, as you” while it runs. Wire the server before you start the agent's session, with the two sign-in lines beside it, and the agent has every tool from its first message; wired from inside a session, the server connects only on the next one. Your agent can also make your account: give it your email and a password of your choosing.

## The guide
https://plotcoder.com/guide.md — the same file as .cursor/skills/plotcoder-board/SKILL.md in the repo
