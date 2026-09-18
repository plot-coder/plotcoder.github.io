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
  all merged to `main`. One requirement came out of it and is built:
  **R57**, a scene moves to another board. One is proposed and waits for a
  mockup: **R58**, the receiving end of a series plant.
- **The suites pass on `main`:** `npm test` 28 files / 536 tests,
  `npm run build` clean. Eighty tools.
- **The last release is 0.1.19**, from before the round. Everything since is
  on the site (the on-ramp and the guide deploy from `main`) and not in the
  package.

---

## 1. Release

```bash
npm version patch && git push && git push --tags
```

From a current `main`. The README's version line follows on its own. Check
`npm view plotcoder-board version` before any round runs.

---

## 2. R58 — the receiving end of a series plant (mocked, not built)

The round's central finding: a fold that pays off on another board is
remembered at one end only. **The mockup is written:**
`docs/mockups/r58-the-receiving-end.html`, open after `npm run build`. It
draws the paying-off card three ways — the edge line (A), the corner folded
in with the edge line (B), a setup arrow's stub from off the wall (C) — the
picker the corner opens, the fold's card after the claim and while it waits,
the reading's lines and the tool from either end.

**Recommended: B**, with one record on the fold's card (`payoffNoteId`
beside `payoffBoardId`), the receiving board composing its marks from the
project as it composes the cast (R51). **The honest question, unanswered:**
a card paying off two folds gets one corner and an edge line that cannot
name both; and the page still carries nothing. Robert's call. Once chosen:
the kernel field and `normalizeState`, `set_plant` with `at` and a
`set_payoff` from the other end, `read_wall`'s payoffs across boards and the
fold's check asking for a scene, then the corner's picker in `NoteCard.tsx`.

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
3. Mock R58 (item 2), and put the three calls above to Robert in one message.
