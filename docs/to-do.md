# To do — where the last session stopped

Written 2026-09-17, at the end of the session that closed round fourteen's
open calls. Everything here is a handover: what is done and merged or waiting,
what is left, and the order I would take it in. `REQUIREMENTS.md` is still the
source of truth; this file is only the queue.

---

## Where things stand

- **Round fourteen is closed.** Its forty-nine entries were worked through on
  2026-09-17 (pull request #43, merged) and **0.1.18 is released**: the
  package on npm and plotcoder.com carry every fix.
- **The last open piece from it is built:** the scene's when on the card
  (R55, option A of `docs/mockups/when-on-the-card.html`), on the branch
  `claude/app-familiarization-c1520c`. The place line reads "at the pier at
  Fenit · night" and is typed as one line. Not yet released.
- **Robert's five calls are decided**, all on the recommendations, and
  recorded in `REQUIREMENTS.md` (R55's "On the card" note and Roadmap 2
  item 0): no length inside a card, no cues tied to the cast, a person in no
  scene stays in notes, `list_reminders` prints in full, and **the blind runs
  stop at fourteen**.
- **The suites pass on that branch:** `npm test` 28 files / 527 tests,
  `npm run build` clean. Eighty tools.

---

## 1. Land the branch, then release

Merge `claude/app-familiarization-c1520c`, then:

```bash
npm version patch && git push && git push --tags
```

The README's version line is now written by npm's `version` hook
(`scripts/write-readme-version.mjs`), so it no longer needs a hand edit.
Check `npm view plotcoder-board version` shows the new number and wait for
the Pages deploy.

---

## 2. The next measurement: a real script

Roadmap 2, item 0, decided 2026-09-17. Nothing to build. Robert puts a
real story through — a treatment broken into a wall, read, structured,
drafted, printed — and what hurts becomes requirements in `REQUIREMENTS.md`,
with dates. Done when one board has a logline, beats, cards with places,
whens and cast, written scenes, and a printed page count.

If a fifteenth round ever runs instead, the unmeasured case is a **second
board**: a plant paying off across boards (R50) and one cast across two
boards (R51). `blind-runs/prompt.md` is still round fourteen's.

---

## 3. What comes after, in the order the requirements give it

Roadmap 2's remaining items, all waiting on the real script's findings: the
page as the editor (item 2), A/B pages under a lock, tagging for a breakdown
and cast reports (the parity table's last "None"), the hosted door deployed
somewhere (R48), and a reset mail sender for a forgotten password (R39).

---

## 4. Smaller things noticed and not done

- **Port 5173** is held by another project's dev server on Robert's Mac, and
  so is 5175. `.claude/launch.json` now has a second entry,
  `plotcoder-dev-5180`. The MCP server's bridge probe scans 5173 to 5177 and
  4173 only, so a shell call will not find a wall on 5180; point
  `PLOTCODER_ROOT` at a folder instead, or add 5180 to the probe if that
  ever matters.
- **`public/guide.md` in the repo lags the skill** between builds: it is
  regenerated from `.cursor/skills/plotcoder-board/SKILL.md` by
  `scripts/write-agents-text.mjs` on every build, so edit the skill, never
  the copy.
- **A second `0.1.16`** exists on npm from a parallel session's bump on
  2026-09-15; harmless, recorded so nobody hunts for the difference.
- **The `claude` command is not installed on this machine**, so
  `claude mcp add …` fails; the server is wired by hand in `~/.claude.json`.

---

## 5. How to pick this up

1. Read the recurrence table in `blind-runs/README.md`, then
   `blind-runs/round-fourteen-report.md`'s head and sections 3 to 5.
2. Land and release (item 1) so the site and the package carry the when
   on the card.
3. Then the real script (item 2). Everything else waits for it.
