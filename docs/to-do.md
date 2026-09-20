# To do — where the last session stopped

Written 2026-09-19, late, at the end of the session that ran rounds
nineteen to twenty-one, built R61, R62 and R65 with Robert's seven calls,
and gave the hosted door its name. Everything here is a handover: what is
done and merged, what is left, and the order I would take it in.
`REQUIREMENTS.md` is still the source of truth; this file is only the queue.

---

## Next, in order (2026-09-19, night, after 0.1.41)

**Now:** everything the last three rounds asked for and Robert decided is
built, merged and released. 0.1.41 is on npm and plotcoder.com; the hosted
door at `https://mcp.plotcoder.com` carries it. The rounds on "The
Allotments" have run five times (seventeen to twenty-one) and their findings
are mostly repeats now, so the next round starts from a new page of notes.
Not yet run blind: R62's named fold and the tie rule's adjacent case, R65's
two versions, the camera marks, the sketch, the open target, the counting
tail, the presence tail, and the door's name as the wiring.

1. ~~**Cue round twenty-two** through the name~~ **Cued 2026-09-19:**
   `blind-runs/prompt.md`, on "The Last Bus" (`round-twenty-two-idea.md`);
   twenty-one's prompt archived. What it was to be: The wiring is the round's
   first measurement: the agent's session gets `https://mcp.plotcoder.com`
   with the test account's Basic header, not the stdio block that vanished
   from `~/.claude.json` before three rounds. Write a new page of notes
   (`round-twenty-two-idea.md`) in the shape of seventeen's: gaps, maybes,
   two versions of one thing, at least one scene the writer has two ways
   of, so R65 gets asked for without being named. Measure: whether a
   stranger reaches `set_alternative` for a scene told "I have it two ways,
   keep both"; whether the fold gets named in one call; whether the camera
   marks on a written scene are read as marks and not as questions; and
   what the tail says before and after the first reading.
2. **Run it**, as before; file the report verbatim under a head; fix what
   it finds; release.
3. **R64's weekly agent, by hand** (the other session's note): a scheduled
   session that, with `SUPABASE_SERVICE_ROLE_KEY` in the server's
   environment, calls `list_questions`, writes each answer into
   `public/writers.html` in the section it names, opens one pull request,
   and calls `answer_question` for each with the section.
   `20260919190000_questions_anyone.sql` is applied — confirmed on the
   plotcoder project 2026-09-19: the `anon` insert policy, the one-paragraph
   check and the nullable `user_id` and `email` are all there. Neither
   questions migration shows in the migration history, because both went in
   through the Management API as SQL; read the table, not the history. Three
   questions on the list, all answered, none waiting.
4. Robert's calls that remain (section 3, all struck; the table stays as
   the record) and the smaller things (section 4). ~~Decide: a placeless
   card's heading on the pages (18:46, 19:44, 20:48)~~ **Built 2026-09-19,
   before the round,** on Robert's "build your recommendations":
   `docs/mockups/the-card-with-no-place.html`, A — `NO PLACE YET:` and then
   the headline, through `sceneHeading`, every door; the changelog has the
   rest. **Still to decide, after round twenty-two:** "Con does not die in
   this film" and the span (20:9, 20:20). The same page draws the answer —
   the premise, said in `set_premise` and both guides, and `read_wall`
   printing a set premise, which it does not today — and the round's notes
   have a span the agent is not told where to put; read where it puts it,
   then build the sentences or something better.

**Done today, in order:** round twenty run and fixed (#104, 0.1.34); R61's
edge (#106, 0.1.35); the other session's R63 writer's guide and R64 Help
(#107, #110, 0.1.36, 0.1.40); round twenty-one run and fixed (#113,
0.1.37); the outstanding to-dos with `read_project` (#115, 0.1.38);
Robert's seven calls drawn before and after (#118), decided and built
(#119, 0.1.39); the hosted door's name (#124, 0.1.41).

**Done this stretch, in order:**

1. ~~**Write the prompt for round nineteen**~~ **Done 2026-09-18:**
   `blind-runs/prompt.md` is round nineteen's; eighteen's is archived as
   `round-eighteen-prompt.md`. The same notes, "The Allotments", against
   0.1.29 with the thread in hand. The writer answers as before; for the
   key and the bucket the writer says only "I know where it pays off, not
   where it is first seen". The round measures whether a stranger reaches
   for `create_thread` with only the on-ramp's one sentence and the guide
   to go on, whether the loose-end question lands where the writer wanted
   it, and whether the thread and the fold ever contradict each other on
   one wall (the combine log's rule) — the sixth direction decides the
   key's first sighting to find out. Note that the on-ramp's rules now
   name the open card and the thread in one sentence (added 2026-09-18,
   after eighteen, pull request #96), so nineteen measures the on-ramp's
   sentence plus the guide, not the guide alone; and that sentence's
   example is "the key", which is this film's, the thing eighteen's entry
   5 had the guide's examples changed for. `~/.claude.json` had lost the
   `plotcoder-board` entry again; it was put back the same night (a copy
   of the file before the edit is in `~/.claude/backups`). The server
   never ships the on-ramp's text, so 0.1.29 on npm and the deployed site
   together carry everything the round needs; no release before it.
2. ~~**Run it**~~ **Done 2026-09-18:** round nineteen ran the same
   night, driven from the cueing session by cross-session messages (the
   agent noticed, entry 12). Fifty-two entries in
   `blind-runs/round-nineteen-report.md`, verbatim under a head; eighteen
   fixed on the branch while it ran, recorded in `REQUIREMENTS.md` and the
   two tables. The three measurements are answered in the head. Merged as
   pull request #97 and **released as 0.1.30** the same night (561 unit
   tests, build clean).
3. ~~**Mock the open fields**~~ **R61 mocked and built 2026-09-18**, on
   Robert's "Build A": `open` beside the logline, the premise, a card's when
   and a board's name; the four tools grown by `open`; the offer on the
   wall. Merged as pull request #99 and released as 0.1.31 the same night.
   Not yet run blind. Left for a round to ask: the offer on a board's
   name from the wall (the crumb draws the words; typing a name decides
   it), and a check for a missing when, which the rounds said blank must
   not become.
4. ~~**The thread's own edges**~~ **R62 mocked and built 2026-09-19**, on
   Robert's "Build A": the fold says what it plants, in the writer's words;
   the tie rule runs in the kernel, both halves; a known payoff with no
   scene is an open card at the payoff end, said by the guide. Merged as
   pull request #101 and released as 0.1.32. Not yet run blind. Left for a
   wall to need: several named plants on one card (B). What it answers:
   **a fold is one flag per card and cannot say which of two things a
   scene plants** (nineteen 42); **a payoff the writer knows without a
   scene has no home** (nineteen 21). The earlier edges, still not decided:
   a thread's name can be typed only when it is started on the wall (the
   tag on the string is not editable; `update_thread` renames it); a thread
   is one board's, so a strand across episodes is still R50's fold; a
   subplot thread has a start and an end but the reading says nothing
   about the cards between; and the reading's `loose` question is asked
   even when the thread's only card is open — by design, recorded in R60,
   worth a look if a round finds it wrong.

---

## Orientation, for whoever picks this up

**Read in this order:** this file; `CLAUDE.md` (the rules); the head of
`blind-runs/round-twenty-one-report.md` and its sections 3 to 6; the
recurrence table in `blind-runs/README.md`; then `REQUIREMENTS.md` for any
requirement you touch (R61 to R65 are the newest, at the end of the
numbered list; R48 has the hosted door and its name).

**Run it:** `npm ci` once; `npm test` (30 files, 595 tests, DOM-free:
kernel, reading, camera, server); `npm run build` (typecheck and bundle);
`npm run test:e2e` (ten Playwright specs over the doors; chromium is
installed on this Mac). The dev server is the launch entry
`plotcoder-dev-5180`, or `plotcoder-dev-5181` when another worktree's
session holds 5180 (5173 and 5175 belong to another project);
`window.plotcoder` is on the page for driving the wall from the console.

**Land a change:** run the suite and the build first, and read the suite's
own summary line — a plain grep for "failed" matches test titles. Then
commit on the session's working branch in its worktree under
`.claude/worktrees/`, push, open a pull request against `main`, merge.
Every change since round fifteen went in that way, one pull request per
fix or per round. Two sessions often work at once; merge `origin/main`
before a release and expect the version number to have moved.

**Release:** from a clean tree with main merged, `npm version patch`
(a hook rewrites the README's "Version x.y.z." line), `git push`,
`git push --tags`; the tag runs the "Publish to npm" workflow, and the
registry lags a few minutes (`npm view plotcoder-board dist-tags.latest
--prefer-online`). Then a pull request for the version commit. The hosted
door pins the package version in `supabase/functions/mcp/index.ts`; bump
it and redeploy (`supabase functions deploy mcp --no-verify-jwt --use-api
--project-ref kmpahjsggbleygsnuwug`) when the door should carry the
release. The name in front of it, `cloudflare/mcp-door`, changes only if
the function's address does. 0.1.42 is the latest (the card with no place).

**Drive a blind run:** Robert opens a fresh session with
`blind-runs/prompt.md`; this side relays the writer's answers and the
prompt's directions with the session tools (list the sessions, read the
latest events, send a message), waits with a background sleep, fixes the
friction entries while the round runs, and at "stop" files the report
verbatim under a head. Before a round, check the registry and the door
carry the version the round is meant to test, and that the session's
wiring answers: from round twenty-two on, that is the name,
`https://mcp.plotcoder.com` with the test account's Basic header; before
it, a stdio block in `~/.claude.json` that vanished three times.

**Where the thread (R60) lives, if you are continuing it:** the record and
its three commands in `src/board/reducer.js` (search `create_thread`), types
in `reducer.d.ts`; the `loose` check and the `threads` list in
`src/board/readWall.js`; the three tools, `threadLine`, and the sections in
`list_board` and `read_wall` in `scripts/plotcoder-mcp-server.mjs` (search
`Threads (R60)`); the string on the wall in `src/NoteBoard.tsx` (search
`note-thread`), the corner picker and the edge input in `src/NoteCard.tsx`
(search `editingThread`), the handlers in `src/App.tsx` (`startThread`,
`tieThread`), the styles under `.note-thread` in `src/styles.css`; the words
in `src/board/words.js`, the guide's bullet in
`.cursor/skills/plotcoder-board/SKILL.md`, the workflow's tool list in
`src/board/workflows.js`; tests in `reducer.test.ts`, `readWall.test.ts`
and `scripts/plotcoder-mcp.test.mjs` (search `R60`). The mockup that led
to it is `docs/mockups/r60-the-payoff-first.html`.

**On another machine (2026-09-19):** everything that matters is in the
repo on `main`; a Claude session's own transcript and memory stay on the
Mac they ran on, so a person picking up elsewhere starts from this file and
the latest round's report, not from a session. What a new machine needs,
none of it in the repo:

- **The repo and its tools:** `git clone`, `npm ci`, `npx playwright
  install chromium` for the e2e suite. Node 20 runs the app and the tests;
  wrangler wants 22.
- **GitHub:** `gh auth login`, to open and merge pull requests. Pushing a
  `v*` tag publishes to npm through the "Publish to npm" workflow with
  `NPM_TOKEN` in the repo's secrets; no npm login is needed on the machine.
- **Supabase:** the CLI (`brew install supabase/tap/supabase`) and
  `supabase login`, to redeploy the hosted door's function (project ref
  `kmpahjsggbleygsnuwug`). The Management API route the other session used
  for a migration takes a personal access token from the dashboard; make
  one there when needed and remove it after. `SUPABASE_SERVICE_ROLE_KEY`,
  for the wipe script and R64's two tools, comes from the dashboard's API
  settings and lives only in an ignored `.env.local` or the shell; it is
  on Robert's Mac in the other worktree's `.env.local` and nowhere else.
- **Cloudflare:** `wrangler login` (the account is Robert's, the one
  plotcoder.com's DNS is on), to redeploy the name in `cloudflare/mcp-door`;
  the folder's README has the Node and architecture wrinkle.
- **The agent's wiring:** the PlotCoder connector in the desktop app
  (Settings › Connectors) is on the claude.ai account, so it follows the
  person, not the machine; the prompt's first step says how to add it. The
  stdio block in `~/.claude.json` is no longer needed for a round.
- **The test account** is in `blind-runs/prompt.md`; nothing on it is
  anyone's work.

---

## Where things stand

- **Rounds twenty and twenty-one have run** (2026-09-19), the same notes as
  seventeen to nineteen with the open fields and the thread's edges in hand.
  Their reports are `blind-runs/round-twenty-report.md` (fifty-seven
  entries, twenty-two fixed) and `round-twenty-one-report.md` (forty-two,
  eight fixed), verbatim under heads saying what became of each entry.
- **What they measured:** the fields left open through their own `open`
  (the logline, a when, the premise, the place, the title); the fold named
  in one call; the tie rule doing both halves right once the thread's cards
  were held in story order; an open-placed card's other questions standing.
- **Robert's seven calls are built** (2026-09-19): the tails count and point
  until the session's first reading; the hosted door runs on Supabase and
  is named `https://mcp.plotcoder.com`; the account tail says whose screen
  the wall is open on; R65 holds two versions of one scene; the camera's
  lines are marked, never asked; a target can be open; a written sketch is
  named. `docs/mockups/roberts-calls.html` is the drawing and the decisions.
- **The other session built R63**, the writer's guide at
  plotcoder.com/writers.html, and **R64**, Help in the app with `questions`
  on the account and its two tools.
- **The suites pass on `main`:** `npm test` 30 files, 595 tests;
  `npm run build` clean; `npm run test:e2e` ten of ten. Ninety tools;
  fifteen checks.
- **Released as 0.1.42** (2026-09-19, the card with no place; 599 unit tests).

---

## 1. The thread that is not a fold, and its edges

**Built:** R60 (the thread, a record of its own, on Robert's choice of B,
`docs/mockups/r60-the-payoff-first.html`), then R62 (the fold says what it
plants; the tie rule in the kernel, both halves; a known payoff with no
scene is an open card at the payoff end,
`docs/mockups/r62-what-the-fold-plants.html`). Rounds nineteen to
twenty-one ran them. Still not decided, for a round to find wrong: a
thread's name is typed only when it is started on the wall; a thread is one
board's, so a strand across episodes is R50's fold; a subplot thread says
nothing about the cards between its ends; the `loose` question is asked
even when the thread's only card is open. Several named plants on one card
(R62's B) waits for a wall to need it.

## 2. The open fields

**Built:** R61 (`docs/mockups/r61-the-open-field.html`) and its edge — the
logline, the premise, a when, a place, a board's name, a project's name and
the target can each be open by the writer's word, through the field's own
`open`, listed by the reading and not asked. Rounds twenty and twenty-one
ran all but the target. Left for a round to ask: the offer on a board's
name from the wall, and a check for a missing when, which the rounds said
blank must not become.

## 3. Robert's calls still open

**Drawn before and after, 2026-09-19:** `docs/mockups/roberts-calls.html` —
calls 2 to 6 below, the target that cannot be open (twenty-one 7) and the
written sketch that shrinks the wall (18:43, 19:47, 20:49, 21:37), each as
it ships beside the change, with its cost and a recommendation. Robert's
word on each is the word to build it.

| # | Thing | Where it came from | Recommendation |
| --- | --- | --- | --- |
| 1 | ~~A reading of the project as a whole (every board's questions in one call)~~ | 15:14 | **Built 2026-09-19 as `read_project`**, once the thread existed, as recommended |
| 2 | ~~The write tails carrying the wall's questions mid-build~~ | 15:9, built on 14's word; 18:20 | **Built 2026-09-19:** the tail counts and points until the session's first `read_wall`, then quotes |
| 3 | ~~A wiring that cannot vanish from one machine's file~~ | 15's first attempt, round nine; it vanished again before nineteen | **Deployed 2026-09-19 on Supabase**, `supabase/functions/mcp`, named `https://mcp.plotcoder.com` by the Cloudflare Worker in `cloudflare/mcp-door` (deploy: `npx -y wrangler@latest deploy` in that folder, signed in once with `wrangler login`); the on-ramp names it. The next round can wire the agent through it as a desktop-app connector instead of the stdio block. Redeploy with `supabase functions deploy mcp --no-verify-jwt --use-api --project-ref kmpahjsggbleygsnuwug` after bumping the pinned package version |
| 4 | ~~A reply that shows a wall is open on someone's screen~~ | 18:54 | **Built 2026-09-19:** the account tail says "open on Robert's screen now" or "no wall open right now", from the presence the server follows; `list_projects` says the same |
| 5 | ~~Two versions of one scene~~ | 18:8 | **Built 2026-09-19 as R65:** a card behind another as its other version, out of the story until chosen |
| 6 | ~~A written scene's lines the camera cannot see~~ | 18:44 | **Built 2026-09-19:** marked on the page and in the write's reply, never asked |

---

## 4. Smaller things noticed and not done

- ~~**`organize` after a rank change** says "Nothing moved"~~ Done
  2026-09-19: it says what already stands, in the same words as a tidy.
- ~~**A duplicate check on two headings** that differ only by a time word~~
  Done 2026-09-19: a unit test says a leading day phrase is the when and a
  time word inside the headline is the scene's.
- **A person only spoken of** lives in another's notes, and if they get a
  scene the notes move by hand (18:12). Design; a round has not asked twice.
- ~~**The reply tails** end "pages.."~~ Done 2026-09-19: a finding's own
  full stop never doubles the reply's.
- ~~**The door says it runs "0.1.0"** whatever it runs~~ Fixed 2026-09-19, after 0.1.42: `serverInfo.version` is the package's own, so a redeploy can be checked with one `initialize`. Goes out with round twenty-two's fixes; until then a `read_pages` that prints `NO PLACE YET:` is how to tell the door carries 0.1.42.
- **Port 5173** is held by another project on Robert's Mac; the launch entry
  `plotcoder-dev-5180` is the one to use, and `plotcoder-dev-5181` when a
  second worktree's session already holds 5180. The MCP bridge probe scans
  neither.
- ~~**`~/.claude.json` lost the `plotcoder-board` entry**~~ The name is the
  answer (call 3): from round twenty-two the wiring is
  `https://mcp.plotcoder.com`, held where the app keeps it, not in that
  file. The stdio block is still there for a session that wants a local
  server.
- ~~**Playwright's chromium is not installed** on this Mac~~ Installed
  2026-09-19 on Robert's word; `npm run test:e2e` passes locally, ten of
  ten, on its own port.
- ~~**R64's `questions` table** needs its migration applied~~ Applied
  2026-09-19 by the other session through the Management API, and
  `20260919190000_questions_anyone.sql` with it — confirmed from the
  table's policies and constraints the same night (queue item 3).
- **wrangler wants Node 22**, and this Mac's default is 20; the Homebrew
  `node@22` at `/usr/local/opt/node@22/bin` is x64 while npx's cache had an
  arm64 wrangler. `cloudflare/mcp-door/README.md` says how to get round it.

---

## 5. How to pick this up

1. Read the head of `blind-runs/round-twenty-one-report.md` and its
   sections 3 to 6, then `blind-runs/README.md`'s recurrence table.
2. Cue round twenty-two through the name, on a new page of notes, as the
   queue above says; run it; fix what it finds; release.
3. Then R64's weekly agent, and the two decisions in item 4 of the queue.
