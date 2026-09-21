# PlotCoder — wiring a server in

For whoever connects PlotCoder's tools to an agent's session. An agent with the tools already in front of it needs none of this: its page is https://plotcoder.com/llms.txt.

## Doors
- MCP, for the next session: For Cursor or Claude Code, once, from any folder — nothing to clone: claude mcp add plotcoder-board -s user -- npx -y plotcoder-board@latest — then start the session again. A server wired from inside a session connects on the next one, never the one you are in; an agent already inside a session takes the shell door below. The block is the same wiring for a config file; npx fetches the current server each time. A server that comes up with one tool, plotcoder_not_installed, is a checkout of the repo whose npm ci was never run: that only happens with the repo as the session's folder.

```
{
  "mcpServers": {
    "plotcoder-board": {
      "command": "npx",
      "args": ["-y", "plotcoder-board@latest"]
    }
  }
}
```

- The shell, for this session: npx -y plotcoder-board@latest call <tool> '{json}' makes one call, with no MCP and no restart. One server per call, so undo and the project you opened do not carry between calls; npx -y plotcoder-board@latest call --batch < calls.jsonl runs a file of calls — one per line, {"tool": "…", "arguments": {…}} — on one server, so they do. With the account door the sign-in is kept in the folder's .plotcoder between calls (PLOTCODER_SESSION=0 to sign in every time). PLOTCODER_PROJECT names the project for each call. The JSON tail is off on every door; PLOTCODER_JSON=1 in the server's environment adds it. PLOTCODER_ROOT points the server at the folder whose wall you mean; without it, the folder you run it from.
- The hosted door, with nothing installed: Where someone runs PlotCoder's server for you — npx -y plotcoder-board@latest serve puts it on a port, and the repo has a Dockerfile — an MCP client connects over HTTP with the writer's sign-in on the request: claude mcp add plotcoder --transport http https://<that host>/mcp --header "Authorization: Basic <base64 of email:password>", then start the session again. The same server, the same tools, the account as the wall, no disk. PlotCoder runs one at https://mcp.plotcoder.com — claude mcp add plotcoder --transport http https://mcp.plotcoder.com --header "Authorization: Basic <base64 of email:password>", or in the Claude desktop app, Settings › Connectors › add a custom connector with that address and header, choosing No sign-in on its Authentication screen (the screen says OAuth is detected; the door has none, and the header is the sign-in): the app keeps a connector in its own settings, where a stdio block in a file can vanish. The password rides in the header, base64 over https, as the env block carries it; share a machine and know it.
- The account: With the writer's own sign-in in the server's environment, the same server works their project from anywhere, live on every open wall. The two variables go where the server is started: in the MCP config's env, as -e flags on claude mcp add, or exported in the shell before a call. With the sign-in set, the account is the wall, even when a dev app is open on the machine. Without PLOTCODER_PROJECT it works the project touched most recently. Every read of the wall or the project names the project it read; the app's own lists — list_words, list_workflows — belong to no project. A wrong password is refused by every tool, never worked around. No account yet? claim_account makes one with the writer's email and a password they chose, and starts it empty.

```
{
  "mcpServers": {
    "plotcoder-board": {
      "command": "npx",
      "args": ["-y", "plotcoder-board@latest"],
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
  -- npx -y plotcoder-board@latest
```

- The page: window.plotcoder on an open wall, for a browser session.
- Where the wall lives, without an account: Skip this when the account is the wall. Without an account, a wall is a folder: any folder, empty is fine — choose one that will outlive your session, never a scratch one. The app run from that folder shows the wall, and the server writes it there (PLOTCODER_ROOT, or the folder it is run from). A fresh folder holds the sample; new_board for the writer's wall, then rename_project. No app running? export_fountain is the wall in order, as text.
## For the person
Give your agent the account door only on a machine you trust; it signs in as you and shows under People as “an agent, as you” while it runs. Wire the server before you start the agent's session, with the two sign-in lines beside it, and the agent has every tool from its first message; wired from inside a session, the server connects only on the next one. Your agent can also make your account: give it your email and a password of your choosing. Your own guide — how a writer uses PlotCoder, from the door to the script out, the agent first — is at https://plotcoder.com/writers.html.
