# Blind runs

A blind run is a fresh agent, given the on-ramp and a treatment and nothing
else, asked to build a wall and to keep a log of everything that made the job
harder than it should have been. The friction log is the product; the wall is
just what produces it.

The practice is Robert's, from 2026-09-13. Twenty-one rounds have been run;
every finding is fixed, decided, or waiting on a mockup — see
`REQUIREMENTS.md`, "The blind run", and the `friction, fixed` entries in the
changelog. The latest report, round twenty-one's, says at its head what
was fixed from it the same morning and what waits; twenty asked for the
open place and title and found the tie rule's bug, and twenty-one measured
both. The practice continues because it
measures the thing the app is for — an agent helping a person turn an idea
into a story (Robert, 2026-09-17).

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
| Fifteen | The published package, a series of two episodes | "The Weighbridge" | Two boards: a scene moved between episodes, a person's page across both, a structure beside one, the re-test written, Final Draft out for both, the length, a rename, the plants from both sides | 45 (`round-fifteen-report.md`); 34 fixed the same evening, R57 and R58 built |
| Sixteen | The published package, the same series, the fixes in hand | "The Weighbridge" | The move and the claims found as tools unprompted; a revision, a lock and a scene added under it, Final Draft out for both, the lengths, undo | 48 (`round-sixteen-report.md`); 41 fixed the same night, create_note with after/before built |
| Seventeen | The published package, a page of notes instead of a treatment, the writer answering | "Plot 14" (`round-seventeen-idea.md`) | Twenty questions asked first; the turns proposed, the gaps proposed, a change of mind, the folds, a scene written, the length | 39 (`round-seventeen-report.md`); the wall has no way to hold a maybe — R59 mocked and built the same day; two new checks and the wordings |
| Eighteen | The published package, the same notes, the open card in hand | "Plot 14" (`round-seventeen-idea.md`) | Told "leave it open" in those words: the open card found unprompted; Declan wired in, the turns marked, the asparagus bed added, the key and the bucket, the first morning written, the length, what a writer would ask next | 54 (`round-eighteen-report.md`); 24 fixed the same night; the thread that is not a fold confirmed — the next design question, and the open field beside it |
| Nineteen | The published package, the same notes, the thread in hand, the on-ramp naming it | "Plot 14" (`round-seventeen-idea.md`) | Told only "I know where it pays off, not where it is first seen": both threads named at build; the loose end asked from the payoff end until tied; the key's start tied and the setup arrow declined because the first morning's one fold is the tools'; the asparagus bed, the first morning written, the length, what a writer would ask next | 52 (`round-nineteen-report.md`); 18 fixed the same night; a fold cannot say which of two things a scene plants — the thread's edges |
| Twenty | The published package, the same notes, the open field and the fold's words in hand | "Plot 14" (`round-seventeen-idea.md`) | Told "leave it open" of the logline and the board's name: the fields left open through their own `open`, the fold named, the known payoff born open with its arrow; the key's decision folded the wrong card — the tie rule's bug, found and fixed; the bucket, the first morning written, the length, what a writer would ask next | 57 (`round-twenty-report.md`); 22 fixed the same morning; a place and a project's name cannot be open — R61's edge |
| Twenty-one | The published package, the same notes, the open place and title in hand, the tie rule in story order | "Plot 14" (`round-seventeen-idea.md`) | Told "leave it open" of the title and the places: both left open through the fields' own `open`; the key on a taken fold stayed a thread, the bucket on a free fold made the fold and the arrow; the title decided, the first morning written, the length, what a writer would ask next | 42 (`round-twenty-one-report.md`); 8 fixed the same morning; a target, acts and lengths cannot be open |

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
| A scene cannot cross from one board of the project to another | Fifteen (16) | **R57**, a scene moves to another board |
| A series plant is remembered at one end: the board it lands on knows nothing | Ten to thirteen asked for the fold; fifteen (5, 11, 43, 45) asked for its other end | **R58**, proposed: the receiving end, mocked first |
| The hand-wired server entry is gone when the session starts | Nine; fifteen's first attempt | **R48** again: a door that does not live in a file on one machine |
| A scene added under a lock gets one letter where it lands and another when moved, and the reply says the letter follows the scene | Fourteen (38–44), sixteen (35, 36) | `create_note` with `after`/`before`: the scene lands where the writer said, one call, one number; the wording gone |
| The on-ramp's doors stand between an agent with the tools and its first call | Eleven, fifteen (1), sixteen (1, 3), seventeen (1, 2), eighteen (1, 2) | The calls and rules before the doors; five first calls; the first-line rule with its exception; the lead counts five; the doors' length stands, decided in seventeen |
| A thing the writer has not decided has no home on the wall but an absence or an invention | Seventeen (6, 7, 10, 13, 15, 30) | **R59**, the open card, mocked and built; found unprompted in eighteen |
| A payoff whose plant has no card yet cannot be folded, drawn or asked about | Seventeen (8, 9, 12, 31); eighteen (11, 14, 15, 39, 41) | **R60**, the thread: mocked three ways, B chosen by Robert and built — a named string through cards with either end open, asked about from the loose end; named at build in nineteen, on the on-ramp's sentence; the tie into the fold (R62) found wrong in twenty and right both ways in twenty-one |
| A fold is one flag per card: a scene that plants two things cannot say which, and a payoff the writer knows without a scene for it has no home | Eighteen (16, 39); nineteen (21, 42, 43) | Open: the thread's edges in the handover; whether the fold learns what it plants, or the thread absorbs it, is the next design question after the open fields |
| Only a card can be open: the logline, a when, the premise cannot say "not decided", and an empty one cannot tell undecided from unconsidered | Eighteen (9, 22, 23, 32); nineteen (8, 10, 13, 25, 32); twenty (6, 16); twenty-one (7, 14, 15) | **R61**, the open field, mocked and built; the place and the project's name added as its edge after twenty; twenty-one used both and asked for a target, acts and lengths — a number, a group and unsized are their forms, and the reply says which is the default |
| The reading and the records are two reads an agent merges by hand, and they tell the runtime with different honesty | Sixteen, seventeen (37, 39), eighteen (26, 45, 47, 50) | The reading now carries the runtime's breakdown and the beats' own pages; two reads by design, and the reading says so |

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

- `round-twenty-one-report.md` — the agent's report from round twenty-one,
  verbatim, under a head saying what was fixed from it the same morning and
  what waits. The next session on the agent surface starts here.
- `round-twenty-report.md` — the agent's report from round twenty,
  verbatim, under a head saying what was fixed from it the same morning and
  what waits.
- `prompt.md` — round twenty-two, as it runs: a new page of notes, "The
  Last Bus" (`round-twenty-two-idea.md`), through the hosted door's name
  `https://mcp.plotcoder.com` wired as a desktop-app connector, against
  0.1.41 with Robert's seven calls in it. It measures the wiring, whether a
  stranger holds a scene two ways through `set_alternative`, the fold named
  in one call, the camera marks read as marks, and the tail before and after
  the first reading. The writer's private answers sit above the divider. Its
  first step wires the name. Paste everything below its divider.
- `round-twenty-two-idea.md` — "The Last Bus", the notes: seven scenes the
  writer knows, two of them two ways, a target not chosen, three things that
  should pay off. Embedded in the current prompt.
- `round-twenty-one-prompt.md` — round twenty-one's own instructions, as
  they ran, without their copy of the notes.
- `round-twenty-prompt.md` — round twenty's own instructions, as they ran,
  without their copy of the notes.
- `round-nineteen-prompt.md` — round nineteen's own instructions, as they
  ran, without their copy of the notes.
- `round-nineteen-report.md` — the agent's report from round nineteen,
  verbatim, under a head saying what was fixed from it the same night and
  what waits.
- `round-eighteen-prompt.md` — round eighteen's own instructions, as they
  ran, without their copy of the notes.
- `round-eighteen-report.md` — the agent's report from round eighteen,
  verbatim, under a head saying what was fixed from it the same night and
  what was decided against.
- `round-seventeen-prompt.md` — round seventeen's own instructions, as they
  ran, without their copy of the notes.
- `round-seventeen-report.md` — the agent's report from round seventeen,
  verbatim, under a head saying what was fixed from it the same night and
  what was proposed.
- `round-seventeen-idea.md` — "The Allotments", the notes: eight scenes the
  writer knows, two versions of the time, an ending not chosen, a break-in
  with three suspects. Embedded in the current prompt.
- `round-sixteen-prompt.md` — round sixteen's own instructions, as they ran,
  without their copy of the treatment.
- `round-sixteen-report.md` — round sixteen's, the same way.
- `round-fifteen-prompt.md` — round fifteen's own instructions, as they ran,
  without their copy of the treatment.
- `round-fifteen-report.md` — round fifteen's, the same way.
- `round-fifteen-treatment.md` — "The Weighbridge", two half-hour episodes
  with a premise, one cast, three plants that pay off in the second episode
  and one thing that is not a plant. Embedded in the current prompt.
- `round-fourteen-prompt.md` — round fourteen's own instructions, as they
  ran, without their copy of the treatment.
- `round-thirteen-prompt.md` — round thirteen's own instructions, as they
  ran. Its copy of the treatment is not kept: one treatment, one file.
- `round-fourteen-report.md` — round fourteen's, the same way.
- `round-thirteen-report.md` — round thirteen's, the same way.
- `round-thirteen-treatment.md` — "Ninety-Nine", a feature, used by rounds
  thirteen and fourteen and embedded in the current prompt. It answers the
  eleven questions up front and includes one thing the writer says is not a
  plant, so the round measures what the wall does with an answered question.
  A treatment is named for the round that introduced it and kept once.
- `round-four-treatment.md` — "Low Season", the pilot rounds four to twelve
  used.

Rounds four to twelve used a TV pilot so they exercised a series premise
above an episode logline. Rounds thirteen and fourteen used a feature so the
app is measured on the primary user's form, with no premise and one board.
Rounds fifteen and sixteen used two episodes so the project model was
measured at last: one cast across two boards (R51), a fold paying off on
another board (R50), and what a writer asks of a wall that is two walls.
Round seventeen uses notes, not a treatment, because every round since
twelve fed the agent a finished story and the app is for making one from
an idea. Rounds seventeen to twenty-one ran the same notes so the walls
were comparable; round twenty-two starts a second page of notes, with a
scene the writer has two ways, because the findings on the first had
become repeats.

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
