# To do — where the last session stopped

Written 2026-09-18, late, at the end of the session that ran rounds
seventeen and eighteen and fixed most of both while they ran. Everything
here is a handover: what is done and merged, what is left, and the order I
would take it in. `REQUIREMENTS.md` is still the source of truth; this file
is only the queue.

---

## Next, in order (Robert's word, 2026-09-18, after the thread shipped)

1. **Write the prompt for round nineteen** into `blind-runs/prompt.md`
   (archive eighteen's as `round-nineteen-prompt.md`'s predecessor): the
   same notes, "The Allotments", against 0.1.29 with the thread in hand.
   The writer answers as before; for the key and the bucket the writer
   says only "I know where it pays off, not where it is first seen". The
   round measures whether a stranger reaches for `create_thread`
   unprompted, whether the loose-end question lands where the writer
   wanted it, and whether the thread and the fold ever contradict each
   other on one wall (the combine log's rule). Check `~/.claude.json` for
   the `plotcoder-board` entry first. Note that the on-ramp's rules now
   name the open card and the thread in one sentence (added 2026-09-18,
   after eighteen), so nineteen measures the on-ramp's sentence plus the
   guide, not the guide alone.
2. **Run it**: Robert opens the session, this side drives it from the
   prompt's list of directions, fixes the friction while it runs, files
   `blind-runs/round-nineteen-report.md` verbatim with a head, records the
   round in `REQUIREMENTS.md` and the two tables, and releases.
3. **Mock the open fields** (item 2 below): the logline, the premise and a
   card's when able to say "not decided" in the writer's words, listed by
   the reading and not asked. Ask in writing before building.
4. **The thread's own edges**, found while building it, not yet decided:
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
--prefer-online`). Then a pull request for the version commit. 0.1.29 is the
latest.

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

| # | Thing | Where it came from | Recommendation |
| --- | --- | --- | --- |
| 1 | A reading of the project as a whole (every board's questions in one call) | 15:14 | Worth a tool once the thread exists, since the payoffs are the cross-board reading; not before |
| 2 | The write tails carrying the wall's questions mid-build | 15:9, built on 14's word; 18:20 (they are snapshots and say "now") | Leave; or quiet them until the first `read_wall` of a session |
| 3 | A wiring that cannot vanish from one machine's file | 15's first attempt, round nine | R48's hosted door, deployed somewhere; question 29 |
| 4 | A reply that shows a wall is open on someone's screen | 18:54 | The mirror is a mirror; presence is not the server's to know. Leave, unless the account door grows a "who has it open" read |
| 5 | Two versions of one scene | 18:8 | Two cards, one open, until a better shape comes; no second model |
| 6 | A written scene's lines the camera cannot see | 18:44 | No check reads prose; a reminder is the house's answer. Leave |

---

## 4. Smaller things noticed and not done

- **`organize` after a rank change** says "Nothing moved" and the agent
  cannot tell whether a beat row still stands (15:20); a reply that names
  the rows would settle it.
- **A duplicate check on two headings** that differ only by a time word
  (15:12) was never exercised; worth a unit test either way.
- **A person only spoken of** lives in another's notes, and if they get a
  scene the notes move by hand (18:12).
- **The reply tails** end "pages.." when a change note precedes a full stop;
  cosmetic, in `changeNote`.
- **Port 5173** is held by another project on Robert's Mac; the launch entry
  `plotcoder-dev-5180` is the one to use. The MCP bridge probe does not scan
  5180.
- **`~/.claude.json` lost the `plotcoder-board` entry** before round
  fifteen; check it before every round (a memory records the shape).
- **Playwright's chromium is not installed** on this Mac, so the e2e suite
  runs only in CI (the Pages deploy). A change to a door shows up there.

---

## 5. How to pick this up

1. Read `blind-runs/README.md`'s recurrence table, then the head of
   `blind-runs/round-eighteen-report.md` and its sections 3 to 6.
2. Cue round nineteen: the same notes, the thread in hand — does a
   stranger name one for the key and the bucket unprompted, and does the
   loose-end question land where the writer wanted it.
3. The open fields (item 2) are the mockup after that.
