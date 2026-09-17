# To do — where the last session stopped

Written 2026-09-17, at the end of the session that worked through round
fourteen. Everything here is a handover: what is done and merged or waiting,
what is left, and the order I would take it in. `REQUIREMENTS.md` is still the
source of truth; this file is only the queue.

---

## Where things stand

- **Round fourteen has run** (2026-09-16) and its report is
  `blind-runs/round-fourteen-report.md`, verbatim, with a head saying what
  became of each entry. Forty-nine entries.
- **All forty-nine were worked through** on 2026-09-17 and are on the branch
  `claude/round-fourteen`, open as
  [pull request #43](https://github.com/plot-coder/plotcoder.github.io/pull/43).
  Two new requirements came out of it: **R55** (when a scene happens) and
  **R56** (story order is the arrows where they exist).
- **The suites pass on that branch:** `npm test` 27 files / 518 tests,
  `npm run test:e2e` green, `npm run build` clean. Eighty tools.
- **The last release is 0.1.17.** Nothing since the merge of pull request #42
  has been published, so the package and plotcoder.com are one release behind
  the work in #43.

---

## 1. Land pull request #43

Merge it, then release, because the next blind run reads the on-ramp from the
site and runs the published package:

```bash
npm version patch && git push && git push --tags
```

Check `npm view plotcoder-board version` shows the new number and wait for the
Pages deploy before any round is started.

---

## 2. The one thing from round fourteen that is not built

**R55's card line.** The kernel, the tools, the readings and every export hold
a scene's `when`; what a person sees and types is not built, because rule 5
says anything a person sees is mocked first, then asked about in writing,
then built.

The mockup is written and in the repo: `docs/mockups/when-on-the-card.html`.
Open it after `npm run build` (it links the built stylesheet, so it is the
app's own paper). It draws the same card four ways — as it ships, with the
when on the place line (A), as a fifth line (B), and on the top edge beside
the scene number (C) — with the recommendation and the honest question at the
foot.

**Recommended: A**, the when after a dot on the place line, because the place
line is the heading's home on the card and it costs no height and no new
gesture. **The honest question, unanswered:** A cannot say "when unknown" as
distinct from nothing, and B can. Robert's call.

Once chosen: build it in `src/PlaceLine.tsx` (or a new line beside it for B),
dispatch `set_when`, and the card is finished. The strip's scrub label and the
Pages outline already read a card's when.

---

## 3. Robert's calls still open

These were recommended and not decided, or decided against and worth keeping
visible:

| # | Thing | Where it came from | Recommendation |
| --- | --- | --- | --- |
| 1 | The when on the card | R55, round fourteen | Option A, above |
| 2 | A length inside a card ("the call is a quarter page, the card is more") | 13:9, 14:14 | **Decided against**: the change line and the pages are for that |
| 3 | Cues in a scene tied to the cast record | 14:28 | **Decided against** as a fix; a sentence in the guide would do |
| 4 | A person in no scene living in two people's notes (Maeve) | 13:12 | **Decided against**: notes are notes |
| 5 | `list_reminders` printing the six principles in full on every read | 14:7 | **Left as is**: a read is a read |

---

## 4. The next round, and then the real script

- **Round fifteen** has no prompt yet. `blind-runs/prompt.md` is round
  fourteen's. If another round runs, the case never measured is a **second
  board** — a series plant paying off on another board (R50), one cast across
  two boards (R51) — since every round since four has been one board.
- **The bigger call Robert already leaned toward:** stop rounds here and put a
  real script through, which is Roadmap 2's item 0 and has been the plan since
  2026-09-13. The five calls in the table above are all better decided on real
  pages than on Joe's van. My view, stated in the session: after #43 lands,
  the rounds are into diminishing returns and the real script is the better
  next measurement.

---

## 5. What a round leaves behind (settled 2026-09-17)

Robert asked whether keeping whole reports is signal or noise. Measured, the
reports were the cheap part: two of them were 28 KB of unique content, while
the round paragraphs inside `REQUIREMENTS.md` were 34 KB restating them and
two prompts were 31 KB carrying a third copy of the treatment. So:

- **Keep every report, whole and unedited.** It is the only record not written
  by whoever did the fixing, and its last three sections — what the on-ramp
  left the agent to work out, what they never found a way to do, what they
  were never sure had landed — outlast any one fix. Each head now says which
  version it is a snapshot of, so nobody reads a stale log as current.
- **The round's paragraph in `REQUIREMENTS.md` says what was decided and why,**
  and points at the report for the rest. Rounds thirteen and fourteen were cut
  back on that rule.
- **One treatment, one file.** A prompt that must paste without editing keeps
  its copy; an archived one does not.
- **`blind-runs/README.md` now carries the recurrence table** — the ten
  requirements that exist because a finding came back, and the two things that
  came back and were deliberately not built. That table is the page someone
  else should read first, ahead of any single report.

The rule if the reports ever become a burden: rounds one to twelve have none
and have not been missed, so the last two or three are the ones that earn
their place.

---

## 6. Smaller things noticed and not done

- **`README.md`'s status line** still said 0.1.14 two releases ago; it now says
  0.1.15 and will be wrong again after the next release. Worth a line in the
  release step rather than a fix each time.
- **A second `0.1.16`** exists on npm from a parallel session's version bump on
  2026-09-15; 0.1.17 is `latest` and carries the same fixes. Harmless, recorded
  so nobody hunts for the difference.
- **The `claude` command is not installed on this machine**, so
  `claude mcp add …` fails. The server is wired by hand in `~/.claude.json`
  (user scope, with `PLOTCODER_EMAIL` and `PLOTCODER_PASSWORD` for the test
  account); a backup of that file sits beside it. Any prompt that tells a
  person to run `claude mcp add` should say this, or the round stops at the
  door as round fourteen's first attempt did.
- **Port 5173** is held by another project's dev server on this machine, and
  `.claude/launch.json` pins that port. A local wall with the dev bridge needs
  a second entry on another port.

---

## 7. How to pick this up

1. Read the recurrence table in `blind-runs/README.md`, then
   `blind-runs/round-fourteen-report.md`'s head and its log. The table is what
   more than one round has said; the report is the most recent picture of what
   the app does to a stranger.
2. Read round fourteen's paragraph in `REQUIREMENTS.md` under "The blind run":
   it says what each of the forty-nine entries became.
3. Merge and release #43 before anything else, so the site and the package
   match the code.
4. Then item 2 above (the card's when), and put the calls in section 3 to
   Robert in one message rather than one at a time.
