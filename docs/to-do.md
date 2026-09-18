# To do — where the last session stopped

Written 2026-09-17, late, at the end of the session that ran round fifteen
and fixed most of it while it ran. Everything here is a handover: what is
done and merged, what is left, and the order I would take it in.
`REQUIREMENTS.md` is still the source of truth; this file is only the queue.

---

## Where things stand

- **Round fifteen has run** (2026-09-17), the first on a project of two
  boards, and its report is `blind-runs/round-fifteen-report.md`, verbatim,
  with a head saying what became of each entry. Forty-five entries.
- **Thirty-four were fixed the same evening**, in pull requests #47 to #52,
  all merged to `main`. Two requirements came out of it and both are built:
  **R57**, a scene moves to another board, and **R58**, the receiving end of
  a series plant (mocked, then built on Robert's word).
- **The suites pass on `main`:** `npm test` 28 files / 540 tests,
  `npm run build` clean. Eighty-one tools.
- **Round sixteen is cued:** `blind-runs/prompt.md`, the same series against
  0.1.21 with the fixes in hand — does a stranger find the cross-board move
  and the claim from either end unprompted; a revision and a lock across
  two boards; undo per board. Not yet run. Its first step checks the server
  wiring that vanished before round fifteen.
- **The last release is 0.1.21**, with everything above in it.

---

## 1. Released

0.1.21 is on npm and matches `main` and the site: round fifteen's fixes,
R57 and R58. Nothing to release until code changes. The README's version
line follows `npm version` on its own.

---

## 2. R58 is built

The receiving end of a series plant, mocked and built the same evening on
Robert's "I trust your judgement": the corner folded in, the edge line, the
picker, one record on the fold's card, `set_plant` with `at` and
`set_payoff`, the reading asking which scene once the promised board holds
cards. Merged; released with the round's fixes. What it cannot say is
recorded in R58: a card paying off two folds says "2 folds", and the page
carries nothing. Round sixteen, if one runs, should put a two-board
treatment through again and see whether an agent finds `at` and `set_payoff`
without being told.

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
3. Run round sixteen from `blind-runs/prompt.md`; put the three calls in section 3 to Robert in one message.
