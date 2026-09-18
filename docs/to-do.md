# To do — where the last session stopped

Written 2026-09-18, late, at the end of the session that ran rounds
seventeen and eighteen and fixed most of both while they ran. Everything
here is a handover: what is done and merged, what is left, and the order I
would take it in. `REQUIREMENTS.md` is still the source of truth; this file
is only the queue.

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
- **The suites pass on `main`:** `npm test` 28 files / 550 tests,
  `npm run build` clean. Eighty-two tools; fourteen checks.
- **Released as 0.1.28** with round eighteen's fixes.

---

## 1. The next design question: a thread that is not a fold

**Mocked, not built:** `docs/mockups/r60-the-payoff-first.html`, recorded
as **R60, proposed** — the paying-off card three ways beside what ships; A
recommended (the receiving corner folded in over nothing, the writer's
words on the edge, one field `paysOff` on the payoff card, no new mark and
no new question kind). Waiting on Robert's word; build on it kernel first,
then the tools, then the wall. What the rounds have shown, twice:

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
2. The thread is mocked (item 1, R60); build it on Robert's word, kernel
   first, then the tools, then the wall.
3. Cue round nineteen only when there is something new to measure: the
   thread, or a fresh idea from a different writer.
