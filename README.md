# PlotCoder

A storylining app for screenwriters, live at [plotcoder.com](http://plotcoder.com).

PlotCoder is a set of tools for building a storyline, covering the activities a writer does today in Final Draft. It is designed so that an **agent driven by a person** has every one of those tools: the person directs, the agent operates, and the board on screen is the person's window onto the same records. The first tool is the wall, a digital corkboard for breaking and rearranging plot before writing the script, because that is the part of the job Final Draft does worst. Pages come last. Once the tools exist, workflows get launched on top of them. The horizon, a long way off: a person makes a storyline they believe in, then the app helps them drive agents that build segments of the movie with video generation tools.

**Using it as a writer:** [plotcoder.com/writers.html](https://plotcoder.com/writers.html) says how, from the door to the script out, the agent first. Its source is `public/writers.html`, and a change to a gesture or a sheet changes it in the same pull request (R63).

The full statement of purpose, every decision, and every requirement lives in [REQUIREMENTS.md](REQUIREMENTS.md). Read it before changing anything. It is the source of truth; this file is the front door.

## The method the tools serve

1. State the **logline**: the central question, what the story is arguing.
2. Mark the **beats**: the 8 to 15 major turns.
3. Fill the space between them with **scene cards**. One card is one scene.
4. **Read the wall**: find the act that sags, the setup with no payoff, the character who disappears.
5. Only then **write pages**.

Steps 1 to 4 are built. Step 4 reads the runs between beats and the setups and their payoffs, and asks ten kinds of question, including a sagging act, a setup with no payoff, a character who disappears, and two scenes doing the same job, in the Reminders modal and as a `read_wall` tool. The Story Map, a strip under the wall, draws the same reading along a page axis and jumps the wall to any card you click. A board has a cast: type "with Maya, Tom" on a card, and see the wall by person from the Cast lens. Step 5 is not started. See "What is built and what is left" in the requirements.

## Run it

```bash
npm ci
npm run dev
```

Opens on `http://localhost:5173`. The board lives in the browser's localStorage and, while the dev server runs, is mirrored to `.plotcoder/board.json` so an agent can read and write it.

```bash
npm test          # kernel, geometry, layout, project file, MCP server
npm run test:e2e  # the doors into the kernel, in a real browser (Playwright)
npm run build     # typecheck and bundle to dist/
```

The end-to-end suite starts its own dev server on port 5174 with its own board file, so it never touches your wall. It needs Chromium once: `npx playwright install chromium`.

Pushes to `main` run both suites and deploy `dist/` to GitHub Pages. A failing test blocks the deploy.

## Drive it from an agent

Every board verb goes through one command kernel, `src/board/reducer.js`, and there are three doors into it:

- **The wall.** Tap the words to type, drag the paper to move. Lasso to select, then Group. Drag a card's handle onto another card for an arrow. ⌘Z takes back any change, whichever door made it.
- **`window.plotcoder`** on the page, for a console or a CDP session.
- **The MCP server**, published to npm as `plotcoder-board`: `npx -y plotcoder-board@latest` is the server, `npx -y plotcoder-board@latest call <tool> '{json}'` one call from a shell, `npx -y plotcoder-board@latest serve` the hosted door on a port (a `Dockerfile` is here too). Inside the repo it is `scripts/plotcoder-mcp.mjs`, wired for Cursor in `.cursor/mcp.json` and for Claude Code in `.mcp.json` (run `npm ci` once first). A version tag (`v0.2.0`) publishes it, with `NPM_TOKEN` in the repo's secrets. Ninety tools: reading (`list_board`, `read_wall`, `read_project`, `read_pages`, `read_character`, `page_count`, `list_words`, `list_workflows`, `segment_brief`, `compare_structure`); the card, cast, place and when (`set_when`), group (with `add_to_group`) and arrow verbs, `set_logline`, `set_target`, `set_rank`, `set_open` (a card the writer has not decided), `create_thread`, `update_thread` and `delete_thread` (a named string through cards, either end open until tied), `set_plant` (with `later`, `at` and `what`) and `set_payoff`, `set_alternative` and `choose_version` (two versions of one scene, one chosen), `write_scene`, `edit_scene`, `move_scene`, `organize`, `apply_template` with `list_structures`, `save_structure`, `remove_structure`; `leave_question` and `ask_again`; `undo` and `redo`; the project's `list_boards`, `open_board`, `new_board`, `rename_board`, `delete_board`, `set_premise`, `rename_project` and the reminders; Fountain and Final Draft both ways, Markdown and plain text out (`export_markdown`, `export_text`); the production half (`lock_numbers`, `unlock_numbers`, `start_revision`, `end_revision`); the project as a file both ways (`export_project`, `import_project`); and, through the account door, `list_projects`, `open_project`, `new_project`, `delete_project`, `empty_account`, `delete_account`, `add_picture`, `add_take`, `list_takes`, `list_files`, `remove_file`, `build_segment`. If the dev app is open, a tool call lands on the wall within a second; if not, it edits the board file and the wall catches up on the next load.
- **The account door.** With `PLOTCODER_EMAIL` and `PLOTCODER_PASSWORD` in the agent's environment — the writer's own — and no dev app answering, the same server works the writer's project on the account directly, and every change lands live on every open wall. `PLOTCODER_PROJECT` picks a project by name or id. No account yet? `claim_account` makes one with the writer's email and a password they chose. The on-ramp — the doors, what to call first, the rules — is in the app behind *Are you an agent? Start here* and served at [plotcoder.com/llms.txt](https://plotcoder.com/llms.txt), both from `src/board/agents.js`.

An agent should call the tools, never fake mouse drags. The skill in `.cursor/skills/plotcoder-board/SKILL.md` says how; `.claude/skills/plotcoder-board` is a symlink to the same file.

## Blind runs, and the test account

A **blind run** is a fresh agent given the on-ramp and a treatment and nothing
else, asked to build a wall and to keep a log of everything that made the job
harder than it should have been. The friction log is the product; the wall is
just what produces it. Twenty-one rounds have been run, the first three through a
repo checkout and the rest through the account door; every finding from the
first seventeen is fixed or decided. Round seventeen, the first to start from
a page of notes instead of a treatment, found the wall has no way to hold a
maybe — the open card, R59, built from it; round eighteen confirmed that a
thread is not a fold — the thread, R60, built from it, a named string through
cards with either end open until the writer ties it; round nineteen measured
the thread and found the fold beside it cannot say which of two things a
scene plants — the open field, R61, and the fold's words, R62, built from it,
and round twenty measured both. [`blind-runs/`](blind-runs/) holds the rules that keep a round honest,
the table of rounds, and the next round's prompt with the test account filled in.

A round works a **test account** — a throwaway marked on its writer row, and the
only kind of account the wipe script will touch (R44). Mark it once, then empty
it between rounds:

```bash
node scripts/wipe-test-account.mjs test@test.com --mark        # once, to make it wipeable
node scripts/wipe-test-account.mjs test@test.com               # the plan; changes nothing
node scripts/wipe-test-account.mjs test@test.com --empty --yes # projects go, account stays
node scripts/wipe-test-account.mjs test@test.com --delete --yes # the account goes too
node scripts/wipe-test-account.mjs test@test.com --unmark      # back to a writer's account
```

Needs `SUPABASE_SERVICE_ROLE_KEY` in the shell; it is not in the repo and must
not be. Nothing changes without `--yes`, and the script refuses any address that
is not marked, so a mistyped address cannot take a writer's work. A project
merely *shared with* the test account belongs to whoever made it and survives.

**Prefer `--empty` between rounds.** `--delete` means claiming the address
again, which changes the credentials in the round's prompt and quietly turns the
next round into a test of `claim_account` instead of the door it meant to test.

## Layout of the repo

| Path | What it is |
| --- | --- |
| `REQUIREMENTS.md` | Purpose, decisions, requirements, open questions, what is left. The source of truth. |
| `src/board/reducer.js` | The kernel. Pure, DOM-free, runs in the browser and in Node. |
| `src/board/store.ts` | Browser store: localStorage, the dev bridge, `window.plotcoder`. |
| `src/App.tsx`, `src/NoteBoard.tsx`, `src/NoteCard.tsx` | The wall. |
| `src/GeneralBar.tsx`, `src/Logline.tsx` | Screen chrome: the bottom-right bar and the logline strip. |
| `src/viewport.ts`, `src/arrowGeometry.ts`, `src/organizeLayout.ts` | Pure helpers, tested. |
| `scripts/plotcoder-mcp.mjs` | The MCP server's front door: starts `plotcoder-mcp-server.mjs`, or answers in words when `npm ci` has not been run. |
| `scripts/plotcoder-mcp-server.mjs` | The MCP server. |
| `vite.config.ts` | The dev bridge that mirrors the board to a file on localhost. Never ships. |
| `.github/workflows/deploy.yml` | Test, build, deploy to Pages. |
| `blind-runs/` | The blind-run practice: the rules, the rounds, and each round's prompt and treatment. |
| `docs/to-do.md` | The handover queue: what is done, what is waiting, what is next. |
| `docs/mockups/` | Interfaces drawn on the app's own paper before they are built (rule 5). |
| `scripts/wipe-test-account.mjs` | Empty or remove a marked test account (R44). `wipe-plan.mjs` is the pure rail it decides by. |

## Status

Version 0.1.39. A project of boards; sign in with your email and a password from the PlotCoder mark and your projects follow you to every device, share one with another writer by email and write it together live, or stay signed out and work on this device as before. Pages sit beside the wall: a scene's text lives on its card, measures it, paginates to the industry's rules, prints, goes out and comes in as Fountain or Final Draft, and goes out as Markdown or plain text for a collaborator in Google Docs. It installs as a progressive web app and opens offline; plotcoder.com serves over HTTPS. The wall, beats, card length, groups, arrows, pan and zoom, save and open, and the agent surface are in use.
