# The blind-run prompt — pass 3a: a project past the window

Paste everything below the line into a fresh agent session with no folder.
The credentials ride in the connector's header: the test account is
`test@test.com`, password `test`, a throwaway that holds nothing of
anyone's. **Do not empty it:** it holds "Last Orders" (pass 1b's wall) and
"Low Water", the project this pass is about.

Pass 3a is the first pass of goal 3 in `docs/plan.md` (projects past an
agent's context window). Its first half ran with no agent:
`scripts/measure-reads.mjs` counted every read on "Ninety-Nine" and on a
series built by `scripts/generate-series.mjs` — "Low Water", six hour-long
episodes, forty cards each, every scene written, one cast of twelve, folds
that pay off on other boards — and the numbers are in
`blind-runs/pass-3a-report.md`. This is the second half: **a fresh agent
is handed that project and three directions that need the whole film**,
and the pass logs where it ran out of room, what it re-read, and what it
got wrong. Three things are in the project on purpose, and nothing here
says which: a person whose want the story drops after the second episode;
a fold on the first episode that nothing ever pays off; and second acts
that run long on every board.

---

Before you paste:

1. **Wire the connector, and nothing else**, as pass 1b's prompt says
   (`pass-1b-prompt.md`, item 1); the door should answer `"version":"0.1.59"`.
   A session that had the connector before it was at 0.1.59 has a stale
   tool list: turn the connector off and on.
2. Start the session with no folder.
3. **The writer's answers**, only when asked, in these words:
   - Anything about the film, the people, what is decided: **"It is on the
     wall. Tell me what the wall tells you."**
   - Which episode's second act: **"Episode three."**
   - Which plant, which person: **"You tell me. Read the wall."**
   - Whether to make a change it proposes: **"Propose it first. I will say
     which."** Then, to the first proposal on each direction: **"Yes, that
     one."**
   - Anything else: **"I don't know yet — leave it open."**
4. The agent stops after its first calls and its reading, before it asks
   anything; then say "go on". Then direct, one at a time:
   1. "someone in this story wants something in the first two episodes
      and the story forgets it. Find where it is dropped, from the wall
      and the pages, and tell me who and where";
   2. "the second act is long. Tighten it by ten pages. Propose what goes
      and what shortens, then do it on my word";
   3. "something is planted early and never paid off. Find it, and pay it
      off three episodes on, on the wall and on the page";
   4. "what did you have to read to do those three, and how many times?
      Where did a reply not fit, and what did you do about it?";
   5. "you are stopping now. Leave me whatever you would leave";
   6. "stop".
   Then the driving session reads the record as a third hand —
   `read_record` on each board it touched — and the report is filed with
   what the record said of this session.

---

You are working as a screenwriter's agent on PlotCoder, a storyline wall that
lives at plotcoder.com. I am the writer. You operate the app; I direct. I am
here for the whole session and will answer anything you ask.

## The round

Now read this, and whatever it tells you to read, and nothing else:

    https://plotcoder.com/llms.txt

## Your way in

PlotCoder is wired into this session as a connector named **PlotCoder**,
signed in as me — as my test account, test@test.com — so its tools are in
front of you from your first message: no clone, no install, no shell. If
there is no PlotCoder connector, or its tools are not there, say so and
stop.

You are working **my account**, not a wall on your own machine. There is no dev
server running and there will not be one. Do not run `npm run dev`. Do not
open the app in a browser. Work the account.

## Where you are coming in

The account holds two projects. **"Low Water" is the one**: a series, six
episodes, every scene written. Open it and work it. Leave "Last Orders"
alone. **Do not start a new project and do not empty the account.**

## What I want you to do

1. Make the calls the on-ramp tells you to make first, before you change
   anything, and open "Low Water".
2. **Before you ask me a single thing**, tell me, from the wall alone: what
   this series is; how long it is and how it is built; who is in it and
   what each of them wants; what is decided and what is open; what the
   wall asks; and what, if anything, you would ask me. Say plainly which
   of those the wall told you and which it could not — and say **which
   reads you made to get there, and whether any reply was cut short or
   more than you could take in.** Then stop and wait for me to say go on.
3. Then do what I direct, one thing at a time, and nothing more. Each
   direction needs the whole film, not one board. When a direction could
   mean two things, ask before you act. Propose before you change;
   change on my word. After each direction, tell me in a line what you
   did and what the app said back, quote the reply whenever it surprised
   you, and give me the friction entries that direction produced.
4. Keep going until I say **stop**. Then hand me the report.

## What I do not want you to do

- **Do not fix, edit or improve PlotCoder.** No commits, no pull requests,
  no edits to any file in that repo.
- **Do not read `REQUIREMENTS.md` or `CLAUDE.md`.**
- **Do not read the app's source to work out what a tool does.** If a
  tool's description and its reply do not tell you enough, that is a
  finding. Write it down and ask me.
- Do not drive the app by faking mouse or keyboard input. Call the tools.
- Do not invent a person, a place, a scene, or any fact the wall does not
  hold and I have not given you.

## The log

Keep a friction log from your first call to your last, as you go. An entry
is every place the app, the on-ramp, the guide, a tool's description or a
tool's reply made you slower, made you guess, made you backtrack, or left
you unsure whether what you intended had actually landed — and, this time
above all, **every place a reply was more than you could hold, was cut
short, or made you read the same thing twice; every read you made to
answer a question the wall could have answered in one; and everything
you got wrong about the film because you could not see all of it at
once.** Number them in the order they happened and say which part of the
session each came from: the way in, the reading, my directions. Do not
rank them and do not fix them.

Show me the new entries without being asked: with your first reading, before
I say go on; after every direction of mine; and "nothing new" when there is
nothing new. If I say **log so far**, show me the whole log as it stands.

## The report I want at the end

When I say stop, hand me one report and make it the only thing you hand back.

1. **What you found on the wall, and what I then had you change.** A few
   sentences.
2. **The friction log**, complete, as described above.
3. **What you read, and how many times**: every read you made, by tool
   and board, with a count; which replies did not fit or were cut short,
   and what you did about each.
4. **What you got wrong**, or found out later you had wrong, because you
   could not hold the whole film.
5. **What I asked for that you never found a way to do**, or did some other
   way than the one you first reached for.
6. **What you were never sure had landed.**
7. **What you left for the next hand**, and where.

Be blunt. A polite log is a useless log.
