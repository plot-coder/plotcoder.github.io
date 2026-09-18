# To do — where the last session stopped

Written 2026-09-17, late, at the end of the session that ran round fifteen
and fixed most of it while it ran. Everything here is a handover: what is
done and merged, what is left, and the order I would take it in.
`REQUIREMENTS.md` is still the source of truth; this file is only the queue.

---

## Where things stand

- **Round sixteen has run** (2026-09-17 into 2026-09-18), the same series
  against 0.1.21 with round fifteen's fixes in hand. Its report is
  `blind-runs/round-sixteen-report.md`, verbatim, with a head saying what
  became of each entry. Forty-eight entries; **forty-one fixed the same
  night**, in pull requests #59 to #65, all merged to `main`.
- **The question it was for is answered:** a stranger found the cross-board
  move and the claim from either end without being told, and both boards
  read their payoffs. R57 and R58 hold.
- **Built from it:** `create_note` with `after`/`before`, so a scene added
  under a lock is one call and one number — round fourteen's letter finding,
  back a third time, closed by a tool; `page_count` on an unwritten board;
  cues against the cast; changed lines starred in `read_pages`; the
  runtime's kinds in pages; a written card's kept estimate; undo naming the
  arrows and letters it moved.
- **The suites pass on `main`:** `npm test` 28 files / 544 tests,
  `npm run build` clean. Eighty-one tools.
- **Released as 0.1.23** with all of it, so the package, the site and `main`
  match.

---

## 1. Released

0.1.23 carries round sixteen's fixes. Nothing to release until code
changes; the README's version line follows `npm version` on its own.

---

## 2. Round seventeen, or the real script

Sixteen rounds have run. The last two each drew fewer findings that were
anything but wording — forty-one of forty-eight in sixteen were replies and
descriptions — and every tool a two-board series needs was found unprompted
this time. The cases never measured: a third board; a treatment the writer
did not write (a stranger's, with its own gaps); the account shared with a
second writer while an agent works it. Or stop here and put a real script
through (Roadmap 2, item 0), which the handover before round fifteen already
leaned toward. Robert's call.

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
3. Ask Robert: round seventeen (which case) or the real script; put the three calls in section 3 to him in the same message.
