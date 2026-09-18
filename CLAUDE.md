# PlotCoder — notes for agents

Read `REQUIREMENTS.md` before reviewing or adding code. It is the source of truth for what PlotCoder is and why. Treat **confirmed** items as constraints and **proposed** or **open** items as discussion. Challenge the design against the requirements rather than inventing scope.

## Purpose

PlotCoder is a set of tools for building a storyline, covering what a writer does in Final Draft, built so that an **agent driven by a person** has every one of those tools (D24, R26). The person directs; the agent operates. A feature is not done until it has a tool. The far horizon (D25, R28) is agents building video segments of the movie from the storyline; nothing is built toward it yet, but do not add a second model for scenes, sequences, or segments — the wall's records are already those things.

## Rules that shape every change

- **One kernel.** Every board mutation goes through `src/board/reducer.js`. The wall, `window.plotcoder`, and the MCP server all call it. Never mutate board records anywhere else.
- **Keep the kernel DOM-free.** No `window`, `localStorage`, or `import.meta` in `reducer.js`. It runs in Node for the MCP server.
- **Adding a field** to a card or the board: leave `isBoardState` alone, repair shape in `normalizeState`, and choose the default that claims nothing. Every load boundary already calls `normalizeState`.
- **Viewport is not board data.** Pan and zoom stay out of `BoardState`, the project file, and later Postgres (D18).
- **Rank is on the card, not the wall.** Marking a beat never moves it (D20). The app counts beats and stays quiet (D21).
- **Project data** — the boards, their order, the premise — lives on the project record in `src/board/project.js`; reminders keep their own `plotcoder.*` key but ride the bridge's project channel so agents can read and add them (defaults in `src/board/reminders.js`). One `plotcoder.board.<id>` per board.
- **New editable text** uses `src/EditableText.tsx`. Do not write another `contentEditable`.
- **The account mirror is a mirror, not a lock.** `src/board/account.ts` keeps a signed-in writer's open project on PlotCoder's own Supabase project and follows a Realtime channel for the people on it; the rules are in `src/board/sync.js` and are pure — change them there, with a test. Signed out, none of it runs; tests and the e2e suite never touch the network. Never put a secret in the client: the URL and publishable key are meant to ship, and row-level security by membership is the wall. A writer is an email (R39); the password is hashed on the device before it is sent, so never add a password rule.
- **A card's length is `noteEighths(note)`**, never `lengthEighths` read directly: measured from the scene's text when there is one, the writer's estimate otherwise (R23 b). Every total, position and reading goes through it.
- **Undo lives in the store, not the kernel.** `src/board/history.ts` decides what a step is; the reducer never knows history exists. A new command that edits one line should get a coalesce key in `store.ts`.
- **Agents call tools, never fake pointer drags.** The MCP server is `scripts/plotcoder-mcp-server.mjs`, behind the front door `scripts/plotcoder-mcp.mjs`; the skill is in `.cursor/skills/plotcoder-board/SKILL.md`.

## Process

- When Robert states a need, add it to `REQUIREMENTS.md` as a numbered requirement with date, status, and reason. Do not renumber. Record decisions in the file, not only in chat.
- **Mock before building anything a person will see**, on the app's own paper beside what ships, then ask in writing whether it is the best we could do, then build. Tools and plumbing skip the mockup, not the question.
- When two tools overlap, add a row to the combine log rather than building a second model.
- Update "What is built and what is left" when a status changes.
- Tests: `npm test` covers the DOM-free half — kernel, pure helpers, MCP server. `npm run test:e2e` is a ten-spec Playwright suite over the doors into the kernel (wall, `window.plotcoder`, dev bridge, MCP), not pixels. A change to the kernel or the MCP server needs a unit test; add an end-to-end spec only for a new door or a bug in one. Gestures themselves stay untested.
- **Picking up mid-stream:** `docs/to-do.md` is the handover — what the last session finished, what is waiting, and in what order. Read it before the requirements file when you are continuing someone else's work.
- **Blind runs** are how the agent surface gets tested: a fresh agent, the on-ramp and a treatment, nothing else, and a friction log we work through. The rules and the rounds are in `blind-runs/`. **The open queue is the latest round's report** — today `blind-runs/round-eighteen-report.md`; its head says what was fixed from it and what was decided against. Read it before starting on the agent surface. A round works a marked test account, cleared with `scripts/wipe-test-account.mjs` (R44) — prefer `--empty` between rounds so the credentials in the prompt stay put.
- Build: `npm run build` typechecks and bundles. A failing test blocks the Pages deploy.
