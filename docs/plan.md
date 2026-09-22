# The plan — three goals, and the passes that reach them

Written 2026-09-22 on Robert's word, the day 0.1.51 went out with round
twenty-four's fixes. The blind runs measured the wall and the way in for
twenty-four rounds, and by round twenty-one their findings were repeats.
This file is what comes after: **three goals**, each with where it stands,
what a pass toward it looks like, and how we know it is reached. Many
sessions work from it at once, one pass each. `REQUIREMENTS.md` stays the
source of truth (the goals are recorded there as **D28**); this file is the
working plan and the claim board.

## The goals, in Robert's words

1. **A complete script.**
2. **A person can open the app, figure out what is going on, and jump in —
   with the agent or for it — after the agent has done work.**
3. **An app that can host long, complex, nuanced projects, where the total
   text may exceed an agent's context window, and the agent still builds
   productively with the person — and in many cases hands-off from them.**

## How a session works from this file

- **One pass per session, one branch per pass.** Claim a pass by putting
  the branch name in its row of the table below in your first commit;
  merge `origin/main` before you release; small pull requests, merged as
  they land. Two sessions on one pass is a wasted session.
- **Plan, ask, build, test — in that order, for every item**
  (`CLAUDE.md`, Process). At each step ask, in writing, **is this the best
  we can do?** — name the alternatives and why this one wins, and change
  the plan when the honest answer is no. Anything a person sees is mocked
  on the app's own paper first.
- **A pass is a measurement first.** The rules in `blind-runs/README.md`
  still hold where a pass measures the agent surface: the agent under test
  reads the on-ramp and nothing else, fixes nothing, and keeps the friction
  log. The driving session may fix as it goes, as the rounds did. Where a
  pass measures the person's side, the driving session opens the app
  itself and keeps the same kind of log.
- **File what a pass leaves behind** as the rounds were filed: the report
  verbatim under a head (`blind-runs/`), a working list with every entry
  accounted for (`docs/to-do-<pass>.md`), the decisions in
  `REQUIREMENTS.md`, and a line in `docs/to-do.md`'s head saying where it
  stopped. Update the row below when a pass finishes.
- **Material:** "Ninety-Nine" (`blind-runs/round-thirteen-treatment.md`) is
  the only full treatment — seventeen scenes, nine turns, three plants,
  every treatment question answered — and is the material for the first
  pass on each goal. "Doyle's" and "The Tuner" are notes with a writer
  answering, for the second pass on each.

## Goal 1 — a complete script

**Where it stands (2026-09-22).** No pass has written more than one scene.
Every round from thirteen on wrote one (the pier, the re-test, the first
morning five times, the first chapel, the first Friday), edited one line of
it in the later rounds, and exported with the rest printing as
`[Unwritten]` change lines. The tools exist and each has been run once:
`write_scene`, `edit_scene` (an anchor of quoted text; nothing numbers
paragraphs, twenty-three 59), `read_pages`, `page_count`, exports four ways
and Fountain and Final Draft back in (merge by heading, never deleting),
revisions with starred lines, locked numbers. The runtime figure moves the
wrong way while a film is half written (a written scene is measured, an
unwritten card reads as a page: twenty 52, twenty-four 46). The reading
checks the wall's fifteen things and nothing on the pages but the camera.

**The pass, 1a — a script from a treatment.** A blind run in the practice's
shape, through the hosted door: build "Ninety-Nine" as round fourteen did,
then **write all seventeen scenes** through the tools, export three ways,
import the Final Draft file back, and report the length. Then the writer
directs **edits that cut across the whole film**: move a beat, change the
ending, kill a plant and its payoff, rename a person, cut an act's worth of
pages — and asks, each time, what the app can say about the script as a
whole afterwards. Measure: did a complete, correctly paginated script come
out; did each sweeping edit land through tools alone, and what did the
replies say about the rest of the film; where the agent read pages and
wall side by side to answer "is the film still what the logline says",
because no tool did. Expected findings: the anchor edit at scale; the
runtime figure mid-write; the exports' handling of seventeen written
scenes; and **no reading of the pages against the wall** — whether a
written scene does what its change line claims, whether the fold's plant is
on the page, whether a person's want shows in their scenes, whether the
premise's rule holds — which is the first new requirement the wall's
design has not already anticipated.

**The pass, 1b — a script from notes.** The same with "Doyle's": a wall
built from a page of notes with the writer answering, then every scene
written, including the ones born open, set aside and as versions. Measure
what a complete script does with the homes for "I don't know": what an
open change line, an unlinked card and a version behind print as in a
finished script, and what the writer has to decide before the script is
whole.

**Reached when** a treatment and a page of notes have each become a whole
script through the tools, edited across its length, and the app can say
of the result what the wall says of the cards.

## Goal 2 — a person opens the app after the agent has worked

**Where it stands.** Everything is there to look at — the wall, the strip,
the pages panel, the cast lens, Read the wall in Reminders, Help (R64),
the writer's guide (R63), who is here (R41) — and nothing has ever been
tested from the person's side after an agent's session. Every round ended
with the agent's report and an emptied account; nobody opened the wall the
agent left and asked what it says. There is no record on the wall of what
the agent did or asked; undo holds the steps but names none to a person;
the agent's questions live in the reading, which a person reaches through
a tab in Reminders. The person's way to direct the agent is a sentence
copied from Reminders into the agent's own window (R27).

**The pass, 2a — the morning after.** Take a wall a goal-1 pass leaves on
the test account (do not empty it). A session opens plotcoder.com signed
in as the test writer, in the built-in browser, and as a person tries to
answer from the screen alone, keeping a log of every step: what is this
film; what is decided and what is open; what did the agent do last, and
what is it waiting on me for; which scenes are written; where do I type to
change something, and does the agent see it. Then make five changes on the
wall — decide an open thing, move a card, cut a scene, write a line into a
scene, strike a proposed turn — and have an agent session read the wall
after: does its reading say what the person did, in the person's terms.
Measure: the questions a person cannot answer from the screen, the
gestures that are missing, and where the person's screen and the agent's
reading disagree.

**The pass, 2b — jumping in for the agent.** The reverse: the person
answers the agent's open questions on the wall itself, with no agent
running, and the agent picks up in a fresh session from the wall alone
(the session memory is the wall's, not the transcript's — which is also
goal 3's question). Measure what the agent had to be told again.

**Likely needs, to be drawn before they are built** (anything a person
sees: a mockup on the app's own paper, and Robert's word): what changed
since you last looked, on the wall; the agent's questions on the wall
where they are asked, not only in a tab; the person's word back to the
agent from the app; a mark on an unlinked card (already asked for by round
twenty-four's list).

**Reached when** a person who did not watch the agent can say from the
screen what the film is, what is open, what the agent did and what it
wants, and can change any of it and be understood.

## Goal 3 — projects bigger than a context window, and hands-off

**Where it stands.** Every read is whole: `read_wall`, `list_board` and
`read_pages` return the wall or the script entire, and the reply tails
repeat the prose (`only: "questions"` is the one short read). The person's
page and the places list are the only reads that select. The hosted door
keeps a session's memory in `public.agent_sessions` — whether a wall was
read, the advice given, the last reading's questions — and ten steps of
undo, and nothing the agent wrote for itself; reminders are the nearest
thing to a note across sessions. Workflows (R27) are prompts; nothing runs
an agent unattended, and the practice's rules ("questions, not fixes, until
the writer says") are built for a writer in the room.

**The pass, 3a — measure the size.** No blind run: a session takes the
complete "Ninety-Nine" from goal 1 and counts the tokens of every read at
seventeen written scenes; then builds a project past any window through
the kernel with a generator script (a series of six boards, forty cards
each, every scene written, one cast, plants across boards — under
`scripts/`, kept, so the size can be rebuilt) and counts again. Report
which replies exceed a working budget, and which calls an agent cannot
avoid making. Then hand that project to a blind agent with three
directions that need the whole film — find where a person's want is
dropped, tighten the second act by ten pages, pay off a plant left open
three episodes back — and log where it ran out of room, what it re-read,
and what it got wrong.

**The pass, 3b — hands-off.** The same project, and the writer leaves a
list of directions and standing answers — the length, the acts, "propose
and I will strike", what to do with anything undecided — and is not in the
room. Measure what the agent could finish alone, what it stopped on that
the list should have covered, and what it did that it should have asked.

**Likely needs:** reads that select — a run, a sequence, an act's pages, a
person's scenes with their text, a card found by a phrase — and reads that
scale, a reading that is O(beats) not O(cards); a way for the agent to
leave itself a note and a place it stopped, on the project, that the next
session and the person both read (goal 2's record and this are one thing);
standing answers the writer gives once; a rule for what "propose, do not
fix" means when nobody is there to say.

**Reached when** an agent can work a project it cannot hold whole, across
sessions, from the project's own record, and finish a writer's list alone
with nothing the writer would not have said yes to.

## Order

Goal 1 first: its wall is what goals 2 and 3 measure. 1a and 3a's
generator can start at once; 2a waits for a wall; 1b, 2b and 3b follow
their firsts. Each pass ends in a working list with every entry accounted
for, and the first new requirements (a reading of the pages against the
wall; what changed since you looked; reads that select) each get their
mockup or their alternatives before they are built.

## The claim board

| Pass | What | Branch | Where it stands |
| --- | --- | --- | --- |
| 1a | Ninety-Nine to a complete script, edited across its length | — | not started |
| 1b | Doyle's to a complete script, from notes | — | not started |
| 2a | The morning after: a person reads the wall the agent left | — | not started |
| 2b | Jumping in for the agent: the person answers, the agent resumes | — | not started |
| 3a | Measure the size; a project past the window; three directions | — | not started |
| 3b | Hands-off: a list of directions and standing answers | — | not started |
