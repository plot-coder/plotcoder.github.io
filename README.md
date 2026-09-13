# PlotCoder

A storylining app for screenwriters, live at [plotcoder.com](http://plotcoder.com).

PlotCoder is a set of tools for building a storyline, covering the activities a writer does today in Final Draft. It is designed so that an **agent driven by a person** has every one of those tools: the person directs, the agent operates, and the board on screen is the person's window onto the same records. The first tool is the wall, a digital corkboard for breaking and rearranging plot before writing the script, because that is the part of the job Final Draft does worst. Pages come last. Once the tools exist, workflows get launched on top of them. The horizon, a long way off: a person makes a storyline they believe in, then the app helps them drive agents that build segments of the movie with video generation tools.

The full statement of purpose, every decision, and every requirement lives in [REQUIREMENTS.md](REQUIREMENTS.md). Read it before changing anything. It is the source of truth; this file is the front door.

## The method the tools serve

1. State the **logline**: the central question, what the story is arguing.
2. Mark the **beats**: the 8 to 15 major turns.
3. Fill the space between them with **scene cards**. One card is one scene.
4. **Read the wall**: find the act that sags, the setup with no payoff, the character who disappears.
5. Only then **write pages**.

Steps 1 to 4 are built. Step 4 reads the runs between beats and the setups and their payoffs, and asks nine kinds of question, including a sagging act, a setup with no payoff, a character who disappears, and two scenes doing the same job, in the Reminders modal and as a `read_wall` tool. The Story Map, a strip under the wall, draws the same reading along a page axis and jumps the wall to any card you click. A board has a cast: type "with Maya, Tom" on a card, and see the wall by person from the Cast lens. Step 5 is not started. See "What is built and what is left" in the requirements.

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
- **The MCP server**, `scripts/plotcoder-mcp.mjs`, wired for Cursor in `.cursor/mcp.json` and for Claude Code in `.mcp.json`. Sixty-four tools: reading (`list_board`, `read_wall`, `read_pages`, `page_count`, `list_words`, `list_workflows`, `segment_brief`); the card, cast, place, group and arrow verbs, `set_logline`, `set_target`, `set_rank`, `set_plant`, `write_scene`, `organize`, `apply_template` with `list_structures`, `save_structure`, `remove_structure`; `undo` and `redo`; the project's `list_boards`, `open_board`, `new_board`, `rename_board`, `delete_board`, `set_premise`, `rename_project` and the reminders; Fountain and Final Draft both ways; the production half (`lock_numbers`, `unlock_numbers`, `start_revision`, `end_revision`); and, through the account door, `list_projects`, `open_project`, `new_project`, `add_picture`, `add_take`, `list_takes`, `list_files`, `remove_file`, `build_segment`. If the dev app is open, a tool call lands on the wall within a second; if not, it edits the board file and the wall catches up on the next load.
- **The account door.** With `PLOTCODER_EMAIL` and `PLOTCODER_PASSWORD` in the agent's environment — the writer's own — and no dev app answering, the same server works the writer's project on the account directly, and every change lands live on every open wall. `PLOTCODER_PROJECT` picks a project by name or id.

An agent should call the tools, never fake mouse drags. The skill in `.cursor/skills/plotcoder-board/SKILL.md` says how; `.claude/skills/plotcoder-board` is a symlink to the same file.

## Layout of the repo

| Path | What it is |
| --- | --- |
| `REQUIREMENTS.md` | Purpose, decisions, requirements, open questions, what is left. The source of truth. |
| `src/board/reducer.js` | The kernel. Pure, DOM-free, runs in the browser and in Node. |
| `src/board/store.ts` | Browser store: localStorage, the dev bridge, `window.plotcoder`. |
| `src/App.tsx`, `src/NoteBoard.tsx`, `src/NoteCard.tsx` | The wall. |
| `src/GeneralBar.tsx`, `src/Logline.tsx` | Screen chrome: the bottom-right bar and the logline strip. |
| `src/viewport.ts`, `src/arrowGeometry.ts`, `src/organizeLayout.ts` | Pure helpers, tested. |
| `scripts/plotcoder-mcp.mjs` | The MCP server. |
| `vite.config.ts` | The dev bridge that mirrors the board to a file on localhost. Never ships. |
| `.github/workflows/deploy.yml` | Test, build, deploy to Pages. |

## Status

Version 0.1.0. A project of boards; sign in with your email and a password from the PlotCoder mark and your projects follow you to every device, share one with another writer by email and write it together live, or stay signed out and work on this device as before. Pages sit beside the wall: a scene's text lives on its card, measures it, paginates to the industry's rules, prints, and goes out and comes in as Fountain or Final Draft. It installs as a progressive web app and opens offline; plotcoder.com serves over HTTPS. The wall, beats, card length, groups, arrows, pan and zoom, save and open, and the agent surface are in use.
