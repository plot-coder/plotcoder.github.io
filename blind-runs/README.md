# Blind runs

A blind run is a fresh agent, given the on-ramp and a treatment and nothing
else, asked to build a wall and to keep a log of everything that made the job
harder than it should have been. The friction log is the product; the wall is
just what produces it.

The practice is Robert's, from 2026-09-13. Fourteen rounds have been run;
every finding is fixed or decided — see `REQUIREMENTS.md`, "The blind run",
and the `friction, fixed` entries in the changelog. Round fourteen's report
says at its head what was built from it and what was left on purpose.

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
| Thirteen | The published package, a feature, past the wall | "Ninety-Nine" | Pages: a scene written, Markdown out, the page count | 32 (`round-thirteen-report.md`); the six chosen first fixed, the rest open |
| Fourteen | The published package, the same feature, the fixes in hand | "Ninety-Nine" | Past the wall and into production: exports three ways and back, the lock, a revision, a person's page | 49 (`round-fourteen-report.md`); fixed or decided the next day |

## What the rounds keep finding

The strongest argument for the practice is not any one round; it is what more
than one round says. Ten requirements exist because a finding came back, and
the recurrence is the evidence — a single agent's complaint is an opinion, the
same complaint from four agents who never met is a design fault. Round numbers
point into `REQUIREMENTS.md`, "The blind run".

| What kept coming back | Rounds | What it became |
| --- | --- | --- |
| The server lives inside a clone, so every way in starts with `git clone`, `npm ci` and an absolute path | One to nine, the same friction in different clothes | **R47**, the server as a package |
| A person without the `claude` command has no supported way to wire it at all | Nine | **R48**, the hosted door; question 29 |
| A round leaves a project behind and only a service key clears it | Four to seven | **R44**, a marked test account; then **R45** and **R46**, so an agent clears up signed in as the writer |
| The build ends with the same questions to the writer — the length, the acts, the surname | Every round to eleven | **R49**, what a treatment should say |
| A fold pays off on this board or is asked about forever | Ten to thirteen | **R50**, a fold that pays off on another board |
| Casting a person on a second board makes a second person with an empty page | Eleven (50) | **R51**, one cast for the project |
| Laying a structure pastes cards where a comparison was meant | Eleven (55, 56) | **R52**, a structure beside the wall |
| A question the writer has answered is asked again on every read | Twelve (21) | **R53**, leaving a question |
| A scene's day has nowhere to live but the headline, where the duplicate check reads it as the scene's words | Ten, thirteen, fourteen, from three sides | **R55**, when a scene happens |
| The wall's order is the cards' positions, so a card wired between two others reads somewhere else | Fourteen (38–42) | **R56**, story order is the arrows |

Two things came back and were deliberately **not** built: a length for part of
a card (thirteen 9, fourteen 14), which is what the change line and the pages
are for, and a tie between a scene's cues and the card's cast (fourteen 28). A
finding returning is a reason to decide, not a reason to build; write the
decision down either way.

**What a round's report is worth later.** The numbered log perishes — most of
it is fixed within a day, and it then describes an app that no longer exists.
What lasts is the report's last three sections: what the on-ramp said that the
agent did not need and what it left them to work out, what they never found a
way to do, and what they were never sure had landed. Those are about the shape
of the surface, and they are what the next round should be read against.

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

- `prompt.md` — round fourteen: the same door and the same feature, run
  against the package that carries round thirteen's six fixes, with the
  writer directing past the wall again and further — the directions that
  round thirteen found no tool for, and the script out three ways. The test
  account is filled in (`test@test.com`, password `test`; Robert's decision,
  so the prompt pastes without editing). Paste everything below its divider.
- `round-thirteen-prompt.md` — round thirteen's own instructions, as they
  ran. Its copy of the treatment is not kept: one treatment, one file.
- `round-fourteen-report.md` — the agent's report from round fourteen,
  verbatim, under a head saying what was fixed from it. The next session on
  the agent surface starts here.
- `round-thirteen-report.md` — round thirteen's, the same way.
- `round-thirteen-treatment.md` — "Ninety-Nine", a feature, used by rounds
  thirteen and fourteen and embedded in the current prompt. It answers the
  eleven questions up front and includes one thing the writer says is not a
  plant, so the round measures what the wall does with an answered question.
  A treatment is named for the round that introduced it and kept once.
- `round-four-treatment.md` — "Low Season", the pilot rounds four to twelve
  used.

Rounds four to twelve used a TV pilot so they exercised a series premise
above an episode logline. Rounds thirteen and fourteen use a feature so the
app is measured on the primary user's form, with no premise and one board.

**What a round leaves behind, and what it does not.** Keep the report, whole
and unedited: it is cheap, and it is the only record not written by whoever
did the fixing. Keep the treatment, once, so a round can be re-run
comparably. Keep the round's own instructions where they differ from the
current prompt. Do **not** keep a second copy of a treatment inside a prompt,
and do not restate a report at length in `REQUIREMENTS.md` — the round's
paragraph there says what was decided and why, and points here for the rest.
Rounds one to twelve have no verbatim report and have not been missed, so if
the reports ever become a burden, the last two or three are the ones that
earn their place.

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
