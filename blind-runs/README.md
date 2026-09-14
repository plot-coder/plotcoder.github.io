# Blind runs

A blind run is a fresh agent, given the on-ramp and a treatment and nothing
else, asked to build a wall and to keep a log of everything that made the job
harder than it should have been. The friction log is the product; the wall is
just what produces it.

The practice is Robert's, from 2026-09-13. Twelve rounds have been run and
every finding they logged is fixed — see `REQUIREMENTS.md`, "The blind run",
and the `friction, fixed` entries in the changelog.

## The rules that make a round worth running

- **The agent has not read this repo's documents.** No `REQUIREMENTS.md`, no
  `CLAUDE.md`. The on-ramp and the skill are what a stranger gets, so they are
  what the round tests.
- **The agent does not fix anything.** It is a user of the app, not a developer
  of it. An agent that starts editing the repo stops being a measurement.
- **The agent is not told what we expect to go wrong.** Naming the suspected
  friction in the prompt guarantees you get it back and little else.
- **Run from a current checkout.** Rounds one and two were run from a folder
  three merges behind `main`, and a third of round two's findings were round
  one's, already fixed.
- **One door per round**, so the findings say something about that door.

## The rounds

| Round | Door | Material | How far | Findings |
| --- | --- | --- | --- | --- |
| One | Repo checkout, dev bridge | "The Long Way Round" | The wall | 22 logged, 20 real, all fixed |
| Two | Repo checkout, dev bridge | same | The wall | 30 logged, a third stale, the rest fixed |
| Three | Repo checkout, current server | same | The wall | 31, most new, all fixed |
| Four | **The account door**, no dev server | "Low Season" | The wall | 23 before the directions phase, all fixed |
| Five | The account door, the writer in the room | "Low Season" | The wall | 17, all fixed |
| Six | The account door | "Low Season" | The wall | needed the account cleared; not itemised in the requirements file |
| Seven | The account door, from an empty folder at last | "Low Season" | The wall's questions | 12, all fixed |
| Eight | The account door, first checkpoint only | "Low Season" | The way in | 9, all fixed |
| Nine | The account door, wired before the session | "Low Season" | Never got in | 4, all fixed; opened question 29 |
| Ten | The published package, wired before the session | "Low Season" | The directions | 9 + 12 + 14, all fixed; found undo one step deep on the account |
| Eleven | The published package | "Low Season" | The directions | 11 + 16 + 20, all fixed; asked for R50 and R51 |
| Twelve | The published package, the treatment complete | "Low Season" | The directions | 33, all fixed; asked for R52 and R53 |
| Thirteen | The published package, a feature, past the wall | "Ninety-Nine" | Pages | not yet run |

## The rounds so far, and the next round

Round four (2026-09-13) was the first through the account door and stopped at
the wall with twenty-three findings: the account did not exist yet, the sign-in
failed, and the server fell silently to the folder's wall. It was also not
quite blind — the session was started inside a worktree of the repo, and the
harness put `CLAUDE.md` in the agent's context before it read a word. Rounds
seven onward started in an empty folder; rounds ten to twelve ran through the
published package, wired before the session, and were the first to reach the
directions phase. Each round's findings are itemised in `REQUIREMENTS.md`,
"The blind run".

- `prompt.md` — round thirteen: the same door, a **feature** treatment for
  the first time, the writer in the room after the wall is read and directing
  past the wall into pages — a scene written, the pages read, the script out
  as Markdown. The test account is
  filled in (`test@test.com`, password `test`; Robert's decision, so the prompt
  pastes without editing). Paste everything below its divider.
- `round-thirteen-treatment.md` — "Ninety-Nine", a feature, embedded in the
  prompt. It answers the eleven questions up front and includes one thing
  the writer says is not a plant, so the round measures what the wall does
  with an answered question.
- `round-four-treatment.md` — "Low Season", the pilot rounds four to twelve
  used.

Rounds four to twelve used a TV pilot so they exercised a series premise
above an episode logline. Round thirteen uses a feature so the app is measured
on the primary user's form, with no premise and one board.

## Clearing up after a round (R44)

A round leaves a project, its boards and any files behind on a real account.
Since R45 the agent clears up itself, signed in as the test writer, with the
tools every writer's agent has: `export_project` to keep a copy, then
`empty_account`. No service key is involved; the prompt says so. The wipe
script remains for a total reset by hand, and the mark it needs:

```bash
node scripts/wipe-test-account.mjs test@test.com --mark
node scripts/wipe-test-account.mjs test@test.com --empty --yes
```

**Prefer `--empty` between rounds.** `--delete` takes the account itself, which
means claiming it again, which changes the credentials in the prompt and turns
the next round into a test of `claim_account` instead of the door it meant to
test. Save `--delete` for when the practice is finished with an address.

The script refuses any account that is not marked, and never touches a project
merely shared *with* the test account. It needs `SUPABASE_SERVICE_ROLE_KEY`.
