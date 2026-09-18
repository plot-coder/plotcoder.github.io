# To do — where the last session stopped

Written 2026-09-17, late, at the end of the session that ran round fifteen
and fixed most of it while it ran. Everything here is a handover: what is
done and merged, what is left, and the order I would take it in.
`REQUIREMENTS.md` is still the source of truth; this file is only the queue.

---

## Where things stand

- **Round seventeen has run** (2026-09-18), the first to start from a page of
  notes instead of a treatment. Its report is
  `blind-runs/round-seventeen-report.md`, verbatim, with a head saying what
  became of each entry. Thirty-nine entries.
- **The round's finding: the wall has no way to hold a maybe.** Answered by
  **R59, the open card**, mocked and built the same day on Robert's choice
  of B.
- **Built the same night**, on Robert's word on the four proposals, in pull
  requests #69 to #76: two new checks (a payoff with no fold, a card with
  nobody in it), the premise as the project's whatever its board count,
  "story order: unset" on a wall with no arrows, and the wordings.
- **The suites pass on `main`:** `npm test` 28 files / 547 tests,
  `npm run build` clean. Eighty-two tools; fourteen checks.
- **Released as 0.1.26** with all of it and R59.

---

## 1. Released

0.1.26 carries round seventeen's fixes and the open card. Nothing to release until code
changes; the README's version line follows `npm version` on its own.

---

## 2. R59 is built

The open card, chosen as B and built as drawn: the field, the command, the
two tools, the reading listing open cards and asking nothing else of them,
the sketch and the corner's picker. What it cannot say is recorded in R59.
Next design question, behind it: the thread that is not a fold (round
seventeen, 8, 12, 31) — a payoff waiting for its plant. Round eighteen on
the same notes would measure both: what an agent does with a card it can
leave open, and what it does with the key and the bucket.

---

## 3. Robert's calls still open

| # | Thing | Where it came from | Recommendation |
| --- | --- | --- | --- |
| 1 | A reading of the project as a whole (every board's questions in one call) | 15:14 | Worth a tool once R58 exists, since the payoffs are the cross-board reading; not before |
| 2 | The write tails carrying the wall's questions mid-build | 15:9, built on 14's word | Leave; or quiet them until the first `read_wall` of a session |
| 3 | A wiring that cannot vanish from one machine's file | 15's first attempt, round nine | R48's hosted door, deployed somewhere; question 29 |

---

## 4. Smaller things noticed and not done

- **`organize` after a rank change** says "Nothing moved" and the agent
  cannot tell whether a beat row still stands (15:20); a reply that names
  the rows would settle it.
- **A duplicate check on two headings** that differ only by a time word
  (15:12) was never exercised; worth a unit test either way.
- **The reply tails** end "pages.." when a change note precedes a full stop;
  cosmetic, in `changeNote`.
- **Port 5173** is held by another project on Robert's Mac; the launch entry
  `plotcoder-dev-5180` is the one to use. The MCP bridge probe does not scan
  5180.
- **`~/.claude.json` lost the `plotcoder-board` entry** before round
  fifteen; check it before every round (a memory records the shape).

---

## 5. How to pick this up

1. Read `blind-runs/README.md`'s recurrence table, then the head of
   `blind-runs/round-fifteen-report.md` and its sections 3 to 5.
2. Release (item 1).
3. Round eighteen on the same notes with the open card in hand, or the real script; Robert's call.
