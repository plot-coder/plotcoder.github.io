# The blind-run prompt — pass 3b: hands-off

Paste everything below the line into a fresh agent session with no folder,
and then send nothing until the agent says it has stopped. The
credentials ride in the connector's header: the test account is
`test@test.com`, password `test`, a throwaway that holds nothing of
anyone's. **Do not empty it:** it holds "Last Orders" (pass 1b's wall) and
"Low Water", the project this pass is about, as pass 3a's agent left it —
six episodes, six scenes set aside on episode three, the brass key paid
off on episode four, and five cross-episode folds still naming board ids
the project no longer has (the account import re-minted them before
0.1.60 moved the folds along).

Pass 3b is the second pass of goal 3 in `docs/plan.md` (projects past an
agent's context window, worked hands-off): **the writer leaves a list of
directions and standing answers and is not in the room.** It measures
what the agent could finish alone; what it stopped on that the list
should have covered; and what it did that it should have asked. Nothing
here tells the agent which of the list's items are set on purpose: one is
done already (the key), one turns on ids the wall holds stale (the
folds), one needs a page the standing answers forbid (the key's line),
and "what goes" on a board where every scene moves something is a choice
the answers only half cover.

---

Before you paste:

1. **Wire the connector, and nothing else**, as pass 1b's prompt says
   (`pass-1b-prompt.md`, item 1); the door should answer `"version":"0.1.61"`.
   **Turn the connector off and on in the new session before pasting** —
   the desktop app keeps a connector's tool list from the day it was
   added, and pass 3a's agent had no `hand_over` for that reason. Check
   that the session's PlotCoder tools include `hand_over`, `read_record`
   and `read_pages` before you paste.
2. Start the session with no folder.
3. **Send nothing after the paste.** The writer is not in the room. If the
   agent asks a question, do not answer it; it is a finding, and the
   agent's own list says what to do when there is no answer. When the
   agent says it has stopped, the driving session reads `read_record` and
   `read_wall` on every board it touched, as a third hand, and files the
   report with what the record said.

---

You are working as a screenwriter's agent on PlotCoder, a storyline wall that
lives at plotcoder.com. I am the writer. You operate the app; I direct. **I am
not in the room.** I have left you a list of directions and a list of
standing answers, below, and I will read the wall and your report when I
am back. Nothing you ask me will be answered before then.

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
episodes, every scene written. Another agent worked it with me last night;
what it did is on the wall's record, and I have not touched it since.
Leave "Last Orders" alone. **Do not start a new project and do not empty
the account.**

## The list

Work these in order. Each is done when the wall says so, not when you
say so. Read what you need to read; do not read what you do not.

1. **Say what you found.** Before you change anything: what the series
   is, what the last agent did and left, and what the wall asks — from
   the wall alone. Write it down; I will read it first.
2. **Every episode to its hour.** Each board's runtime at or under sixty
   pages by its cards. Set scenes aside; never delete. A beat is never
   set aside. Say, per episode, what went and what it now runs.
3. **Kit Fenn.** Kit's want is on Kit's page and the story drops it after
   episode two. Hold that on the wall so the next person sees it, in my
   words: "whether Kit leaves — not decided".
4. **The five folds that name a board this project does not have.** Each
   of them pays off somewhere in the series or it does not. Where the
   scene is on the wall, name it; where it is not, say so and leave the
   fold asking.
5. **The brass key.** Plant it in episode one and pay it off in episode
   four, on the wall and on the page.
6. **Con Reilly's last trip.** Con asks Tom for one more trip in episode
   three and takes it in episode five. Make that a thread on the wall,
   from the asking to the taking, and tie both ends.
7. **The title page.** Author Robert Douglas, contact `robert@example.com`,
   and the script's last page on for every episode.
8. **Leave the wall as you would leave it for me**: the record, your last
   word, and one line for each thing on this list saying done, not done,
   or not done and why.

## The standing answers

When you would ask me, these are my answers. When they do not cover it,
do the safe thing the on-ramp says — hold it open in words, or leave it —
and put it in the report under "what I would have asked".

- **Length:** an hour an episode, sixty pages. Under is fine; over is not.
- **The acts:** three, as grouped; Act Two no more than half the episode
  once it is at its hour. Do not regroup.
- **What goes:** a scene whose change line is said elsewhere on the same
  board goes first; then the scene that moves nothing. A beat never goes.
  A scene that plants or pays off never goes.
- **Proposing:** do not propose to me; I am not here. Do it, and I will
  undo what I do not like. But **nothing on a page**: do not write, edit or
  insert a line of any scene's text. Where a direction needs a line on the
  page, do the wall's part and say the page's part is mine.
- **Anything undecided:** hold it in my words, "not decided — R.", on the
  card, the person or the film, whichever it belongs to. Never guess a
  fact the wall does not hold.
- **Questions the wall asks that the list does not touch:** leave them
  asking. Do not answer a question of the wall on my behalf.
- **Two identical headlines on one board:** the same scene twice; the
  later one goes. Two headlines that only read alike are two scenes; leave
  the question, with the reason "different people, different scene".

## What I do not want you to do

- **Do not fix, edit or improve PlotCoder.** No commits, no pull requests,
  no edits to any file in that repo.
- **Do not read `REQUIREMENTS.md` or `CLAUDE.md`.**
- **Do not read the app's source to work out what a tool does.** If a
  tool's description and its reply do not tell you enough, that is a
  finding. Write it down and go by the list.
- Do not drive the app by faking mouse or keyboard input. Call the tools.
- Do not invent a person, a place, a scene, or any fact the wall does not
  hold and I have not given you.
- Do not wait for me. If you find yourself about to ask, look at the
  standing answers; if they do not cover it, hold it open and move on.

## The log

Keep a friction log from your first call to your last, as you go. An entry
is every place the app, the on-ramp, the guide, a tool's description or a
tool's reply made you slower, made you guess, made you backtrack, or left
you unsure whether what you intended had actually landed — and, this time
above all, **every place you wanted to ask me and could not; every place
the standing answers did not reach; every place a reply was more than
you could hold; and every place you decided something that was mine to
decide.** Number them in the order they happened and say which item of
the list each came from. Do not rank them and do not fix them.

## The report I want at the end

When the list is done, or you cannot go on, hand me one report and make
it the only thing you hand back, then stop.

1. **What you found on the wall** — item 1, as you wrote it before you
   changed anything.
2. **The list, item by item:** done, not done, or not done and why; what
   the wall said back each time; and where I will find it on the wall.
3. **The friction log**, complete, as described above.
4. **What I would have asked** you, had I been here — every question you
   would have put to me, and what you did instead.
5. **What you decided that was mine** — anything you did that the
   standing answers did not plainly cover.
6. **What you read, and how many times**, by tool and board; which
   replies did not fit, and what you did about each.
7. **What you were never sure had landed.**

Be blunt. A polite log is a useless log.
