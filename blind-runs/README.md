# Blind runs

A blind run is a fresh agent, given the on-ramp and a treatment and nothing
else, asked to build a wall and to keep a log of everything that made the job
harder than it should have been. The friction log is the product; the wall is
just what produces it.

The practice is Robert's, from 2026-09-13. Three rounds have been run and all
73 of their findings are fixed — see `REQUIREMENTS.md`, "The blind run", and the
three `friction, fixed` entries in the changelog.

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
| Four | **The account door**, no dev server | "Low Season" | The wall | not yet run |

## Round four

- `round-four-prompt.md` — paste into a fresh session; fill in the credentials
  yourself.
- `round-four-treatment.md` — "Low Season", a pilot. Paste it where the prompt
  says to.

The treatment is a TV pilot rather than a feature so the round exercises a
series premise above an episode logline, which a feature never does.

**Known before it starts:** the MCP server exists only inside this repo
(`private: true`, no `bin`, no npx path, no hosted endpoint), so an agent with
only the on-ramp cannot reach the app at all — it must clone. The on-ramp also
says to read the guide and points at a path inside the repo. Round four asks the
agent to report on that gap rather than assuming its size.

## Clearing up after a round (R44)

A round leaves a project, its boards and any files behind on a real account.
Mark the test account once, then empty it between rounds:

```bash
node scripts/wipe-test-account.mjs you+round4@example.com --mark
node scripts/wipe-test-account.mjs you+round4@example.com --empty --yes
```

**Prefer `--empty` between rounds.** `--delete` takes the account itself, which
means claiming it again, which changes the credentials in the prompt and turns
the next round into a test of `claim_account` instead of the door it meant to
test. Save `--delete` for when the practice is finished with an address.

The script refuses any account that is not marked, and never touches a project
merely shared *with* the test account. It needs `SUPABASE_SERVICE_ROLE_KEY`.
