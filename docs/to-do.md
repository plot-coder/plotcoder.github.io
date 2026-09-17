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
  (R55, option A of `docs/mockups/when-on-the-card.html`), merged to `main`
  in pull request #44. The place line reads "at the pier at Fenit · night"
  and is typed as one line. On the site; **not yet released** as a package.
- **Robert's five calls are decided**, all on the recommendations, and
  recorded in `REQUIREMENTS.md` (R55's "On the card" note and Roadmap 2
  item 0): no length inside a card, no cues tied to the cast, a person in no
  scene stays in notes, `list_reminders` prints in full. **The blind runs
  continue** — Robert reversed the "stop at fourteen" recommendation the
  same day, because the rounds measure what the app is for: an agent
  helping a person make a story from an idea.
- **Round fifteen is cued:** `blind-runs/prompt.md`, "The Weighbridge", two
  half-hour episodes in one project — the two-board case no round has
  measured. Not yet run.
- **The suites pass on `main`:** `npm test` 28 files / 527 tests,
  `npm run build` clean. Eighty tools.

---

## 1. Release

`main` carries everything; the package does not. From a current `main`:

```bash
npm version patch && git push && git push --tags
```

The README's version line is now written by npm's `version` hook
(`scripts/write-readme-version.mjs`), so it no longer needs a hand edit.
Check `npm view plotcoder-board version` shows the new number and wait for
the Pages deploy.

---

## 2. Run round fifteen

`blind-runs/prompt.md` is ready to paste. Its "Before you paste" says the
order: release first (item 1), because the round runs the published
package and the workflow's words about the when changed in this branch;
then wire, then a session with no folder. The directions to give are
listed there. Afterwards: the report to `blind-runs/round-fifteen-report.md`
verbatim with a head, the round's paragraph in `REQUIREMENTS.md` under "The
blind run", and the recurrence table in `blind-runs/README.md` if anything
came back.

After that, the real script (Roadmap 2, item 0) is still the measurement
Robert leaned toward once the rounds are into diminishing returns.

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
2. Release (item 1) so the package carries the when on the card and the
   checklist's words about it.
3. Then round fifteen (item 2), and the real script after it.
