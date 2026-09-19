# To do — where the last session stopped

Written 2026-09-18, late, at the end of the session that ran rounds
seventeen and eighteen and fixed most of both while they ran; brought up
to date the same night by the session that cued round nineteen. Everything
here is a handover: what is done and merged, what is left, and the order I
would take it in. `REQUIREMENTS.md` is still the source of truth; this file
is only the queue.

---

## Next, in order (2026-09-19, after R61 and R62 shipped)

**Now:** round twenty has run (2026-09-19) — `blind-runs/round-twenty-report.md`,
fifty-seven entries, twenty-two fixed the same morning, the four
measurements answered in its head: the fields left open through their own
`open`, the fold named, the known payoff on an open card with its arrow,
and the key's decision finding a bug in the tie rule (the thread's list
order), fixed. Merged as pull request #104 and released as 0.1.34.
**Next, in order:**

0. ~~**R63, the writer's guide**~~ **Built 2026-09-19** on Robert's "A":
   `public/writers.html` at plotcoder.com/writers.html, linked from the
   on-ramp's "For the person", the Agents sheet and the README; the rule in
   `CLAUDE.md`. Left: Robert's read of the text against the wall, and a
   Help sheet in the bar (B) if a writer asks for help in place.
1. **R61's edge: a place and a project's name that can be open** (twenty 6,
   16). The same drawing as the when's — the place line reads "at · Open
   words", the project's name in the panel — so no new mockup: `locationOpen`
   on the card and `nameOpen` on the project, `set_location` and
   `rename_project` with `open`, `new_project` with `open` for its name,
   the reading's open head, the place line's offer. Ask in writing first
   whether the drawing carries, then build.
0a. ~~**R64, Help in the app**~~ **Built 2026-09-19** on Robert's "A": Help,
   top right; the sheet; `questions` on the account; `list_questions` and
   `answer_question`. Merged as pull request #110 and released as 0.1.36.
   **The migration is applied** (2026-09-19, through the Management API with
   a personal access token, since no session held the connector; the token
   was removed after use). **The two tools were run live** on 2026-09-19:
   the test question listed waiting, answered, filed under #s6, read back
   answered by the writer; two bugs found and fixed on the way, released as
   0.1.40. The service key for them sits in this worktree's ignored
   `.env.local` on Robert's Mac. **Anyone may ask** since the same evening:
   `20260919190000_questions_anyone.sql`, applied and tested live the same
   evening (a stranger's row goes in, a named or over-long one is refused). **One thing
   to do by hand:** set up the weekly
   agent — a scheduled session that, with `SUPABASE_SERVICE_ROLE_KEY` in the
   server's environment, calls `list_questions`, writes each answer into
   `public/writers.html` in the section it names, opens one pull request,
   and calls `answer_question` for each with the section.
1. ~~**R61's edge: a place and a project's name that can be open**~~
   **Built 2026-09-19** (twenty 6, 16), on the R61 drawing, the question
   asked and answered in writing in R61's entry: `locationOpen` on the card,
   `nameOpen` on the project, `set_location` and `rename_project` with
   `open`, `new_project` with `open` in place of a name, the reading's
   open head, the place line's offer before the dot, the panel. Merged as
   pull request #106 and released as 0.1.35. Not yet run blind.
2. ~~**Round twenty-one is cued**~~ **Run 2026-09-19** —
   `blind-runs/round-twenty-one-report.md`, forty-two entries, eight fixed
   the same morning, the three measurements answered in its head: the
   title and the places left open through the fields' own `open`, the tie
   rule right both ways, an open-placed card's other questions standing.
   Merged as pull request #113 and released as 0.1.37.
   **Next:** the rounds on "The Allotments" have run five times and the
   findings are now mostly repeats (a target, acts and lengths that cannot
   be open; a measured eighth under an unsized page; the three lengths).
   The next round should start from a new page of notes, or the practice
   pauses for the calls below. The two guide sentences from twenty-one are
   written (24, 2), with the rest of the outstanding to-dos, 2026-09-19;
   merged as pull request #115 and released as 0.1.38. Robert's seven
   calls decided on the calls page and built the same day — the tails,
   the hosted door on Supabase, presence, R65's two versions of a scene,
   the camera, the open target, the sketch, and Playwright installed —
   merged as pull request #119 and released as 0.1.39. **Next:** round
   twenty-two, wired through the hosted door as a desktop-app connector
   (call 3), on a new page of notes; the section 3 calls that remain are
   the smaller ones in section 4.
3. Robert's calls (section 3) and the smaller things (section 4). New in
   twenty: a placeless card's heading on the pages, said by three rounds
   (18:46, 19:44, 20:48) — decide; "Con does not die in this film" and the
   span have no home but the premise and a person's notes (20:9, 20:20).

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
`blind-runs/round-eighteen-report.md` and its sections 3 to 6; the
recurrence table in `blind-runs/README.md`; then `REQUIREMENTS.md` for any
requirement you touch (R58, R59, R60 are the newest, at the end of the
numbered list, with a combine-log row for the thread).

**Run it:** `npm ci` once; `npm test` (28 files, DOM-free: kernel, reading,
server); `npm run build` (typecheck and bundle). The dev server on this Mac
is the launch entry `plotcoder-dev-5180` (5173 and 5175 belong to another
project); `window.plotcoder` is on the page for driving the wall from the
console. Playwright's chromium is not installed here, so `npm run test:e2e`
runs only in CI on the Pages deploy.

**Land a change:** run the suite and the build first, and read the suite's
own summary line — a plain grep for "failed" matches test titles. Then
commit on the working branch (`claude/app-familiarization-c1520c` in the
worktree `.claude/worktrees/app-familiarization-c1520c`), push, open a pull
request against `main`, merge. Every change since round fifteen went in
that way, one pull request per fix or per round.

**Release:** from a clean tree with main merged, `npm version patch`
(a hook rewrites the README's "Version x.y.z." line), `git push`,
`git push --tags`; the tag runs the "Publish to npm" workflow, and the
registry lags a few minutes (`npm view plotcoder-board dist-tags.latest
--prefer-online`). Then a pull request for the version commit. The hosted
door pins the package version in `supabase/functions/mcp/index.ts`; bump
it and redeploy when the door should carry the release. 0.1.40 is the
latest (0.1.33 was cut from `main` between #103 and #104 by another
session, before the round's fixes).

**Drive a blind run:** Robert opens a fresh session with
`blind-runs/prompt.md`; this side relays the writer's answers and the
prompt's directions with the session tools (list the sessions, read the
latest events, send a message), waits with a background sleep, fixes the
friction entries while the round runs, and at "stop" files the report
verbatim under a head. Before a round, check `~/.claude.json` still has the
`plotcoder-board` entry (it has vanished once) and that the registry serves
the version the round is meant to test.

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

---

## Where things stand

- **Round nineteen has run** (2026-09-18), the same notes with the thread
  in hand and the on-ramp naming it. Its report is
  `blind-runs/round-nineteen-report.md`, verbatim, with a head saying what
  became of each entry. Fifty-two entries; eighteen fixed the same night,
  merged in pull request #97 and released as 0.1.30.
- **The round measured what it was cued to measure:** both threads named at
  build (on the on-ramp's sentence — its example "the key" was this film's
  and was changed to the sample's); the loose question lands from the
  payoff end and stands until tied; the thread's start tied without a setup
  arrow because the fold was the tools' — the agent asked, and the finding
  is the fold's, above.
- **Round eighteen has run** (2026-09-18), the same page of notes as
  seventeen with the open card in hand. Its report is
  `blind-runs/round-eighteen-report.md`, verbatim, with a head saying what
  became of each entry. Fifty-four entries; twenty-four fixed the same
  night in pull requests #81 to #88.
- **The round measured what it was cued to measure:** told "leave it open"
  in those words, a stranger found `set_open` and `create_note`'s `open`
  unprompted.
- **The round's finding: a thread is not a fold, confirmed.** The key and
  the bucket both run payoff-first — the writer knows where each pays off,
  not where it is first seen — and a plant is one-directional, so neither
  is visible to the app (entries 11, 14, 15, 39, 41; seventeen's 8, 12,
  31). Beside it, **only a card can be open**: the logline, a when, the
  premise cannot say "not decided" (9, 22, 23, 32).
- **R60, the thread, is built** on Robert's choice of B; see item 1.
- **The suites pass on `main`:** `npm test` 28 files, `npm run build`
  clean. Eighty-five tools; fifteen checks.
- **Released as 0.1.29** with round eighteen's fixes and the thread.

---

## 1. The next design question: a thread that is not a fold

**Built as B, on Robert's word** (2026-09-18): `docs/mockups/r60-the-payoff-first.html`
showed three ways, A was recommended, Robert chose B — a thread as a
record of its own. **R60, built:** `threads` on the board, three tools,
the fifteenth check (loose), the string on the wall, the corner's picker.
The second-model concern is recorded in the combine log. Not yet run
blind: round nineteen should measure whether a stranger names a thread
unprompted for the key and the bucket. What the rounds had shown, twice:

- A **plant** is one record on the fold card, and every question the wall
  asks about it starts there: unpaid, unplanted, backwards. A payoff card
  cannot ask for its setup.
- A writer with an idea often knows the **payoff first** — the bucket on
  the balcony, the key that opens the shed — and not where the thing is
  first seen. Today that lives as an open card at the payoff end (listed,
  not asked) or as a sentence on a person's page (never read).
- A **subplot** (Declan) has colour and groups, and colour means nothing to
  the app.

The shape to mock, on the app's paper beside what ships, then ask in
writing: a claim on the *payoff* card — "pays off something not yet
planted", in the writer's words — that the reading asks about from that
end ("where is the bucket first seen?") until a setup arrow lands on it,
the mirror of the fold. Whether that is a second corner, a second fold, or
the same fold read from either end is the mockup's question. One record,
on the card; no second model for a thread. R58's receiving end and R59's
open card are the two nearest shapes.

## 2. Beside it: open fields

The open card's claim on a field. The logline, the premise and a card's
when can be blank, and blank cannot say "not decided" (eighteen 9, 22, 23,
32). Same words as R59, on a field: the writer's words in place of a
value, listed by the reading, not asked. Mock with the thread or after
it; the two share the words "open, by the writer's word".

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
| 3 | ~~A wiring that cannot vanish from one machine's file~~ | 15's first attempt, round nine; it vanished again before nineteen | **Deployed 2026-09-19 on Supabase**, `supabase/functions/mcp`, at `https://kmpahjsggbleygsnuwug.supabase.co/functions/v1/mcp`, verified; the on-ramp names it. The next round can wire the agent through it as a desktop-app connector instead of the stdio block. Redeploy with `supabase functions deploy mcp --no-verify-jwt --use-api --project-ref kmpahjsggbleygsnuwug` after bumping the pinned package version |
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
- **Port 5173** is held by another project on Robert's Mac; the launch entry
  `plotcoder-dev-5180` is the one to use, and `plotcoder-dev-5181` when a
  second worktree's session already holds 5180. The MCP bridge probe scans
  neither.
- **`~/.claude.json` lost the `plotcoder-board` entry** before round
  fifteen; check it before every round (a memory records the shape).
- ~~**Playwright's chromium is not installed** on this Mac~~ Installed
  2026-09-19 on Robert's word; `npm run test:e2e` passes locally, ten of
  ten, on its own port.
- **R64's `questions` table** needs its migration applied on the
  plotcoder Supabase project by a session with the Supabase connector
  (`supabase/migrations/20260919170000_questions.sql`); this session had
  none and said so when asked.

---

## 5. How to pick this up

1. Read `blind-runs/README.md`'s recurrence table, then the head of
   `blind-runs/round-twenty-report.md` and its sections 3 to 6.
2. Build R61's edge — the place and the project's name open — as the queue
   above says, then cue round twenty-one.
3. Then Robert's calls (section 3), and the smaller things (section 4).
