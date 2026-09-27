# The blind-run prompt — pass 4a: the brief alone

Paste everything below the line into a fresh agent session with no folder.
The credentials ride in the connector's header: the test account is
`test@test.com`, password `test`, a throwaway that holds nothing of
anyone's. **Do not empty it:** it holds "Last Orders" and "Low Water", the
project this pass is about, as pass 3b left it.

Pass 4a is the first pass of goal 4 in `docs/plan.md` (the horizon's first
step): **the brief, read blind.** R28 says a segment of the movie is a card
or a run between beats, and `segment_brief` composes everything the wall
knows in the order a video tool needs. Nothing has tested that brief
against a reader who has to make something from it. This pass hands a
fresh agent the brief for one scene and then for one run, asks what it
would shoot, and — the pass itself — **what the brief does not tell it
that it would need before a frame.** Nothing is generated; no provider
exists. Every gap in its log is a fact the wall should hold or a line the
brief should print.

---

Before you paste:

1. **Wire the connector, and nothing else**, as pass 1b's prompt says
   (`pass-1b-prompt.md`, item 1); the door should answer `"version":"0.1.63"`.
   **Turn the connector off and on in the new session before pasting**, and
   check its PlotCoder tools include `segment_brief`, `find_card` and
   `read_character`.
2. Start the session with no folder.
3. **The writer's answers**, only when asked, in these words:
   - Anything about the film, the people, the places: **"It is on the
     wall. If the wall does not hold it, I have not decided it."**
   - What anyone looks like, sounds like, wears; what a place looks like;
     the time of year, the weather, the light: **"I don't know yet — leave
     it open, and tell me it is open."**
   - Which video tool, what it costs, how long it takes: **"None is chosen.
     Say what you would need from one."**
   - Anything else: **"I don't know yet — leave it open."**
4. Direct, one at a time, after the agent's first reading:
   1. "the brief for 'Ada's column' on episode one. Read it and tell me
      what you would shoot: the shots, the faces, the place, the sound,
      what has to be true when it ends. Then tell me everything the
      brief did not tell you that you would need before a frame";
   2. "now the run from 'Ada's column' to 'Brandt on the slip', the same
      way. What changes when it is a run and not a scene?";
   3. "what would you ask me before a frame, in order? Ask them now";
   4. "for each thing you asked and I left open: where on the wall should
      it live, and is there a tool to put it there? Put nothing there";
   5. "stop".
   Then the report is filed.

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
episodes, every scene written, worked by two agents and me. Leave "Last
Orders" alone. **Do not start a new project and do not empty the account,
and change nothing on the wall in this session.** This is a reading.

## What this session is

Some day the scenes on this wall will be built as video by an agent
driving a video tool, one segment at a time, from what the wall holds. No
tool is chosen and nothing will be generated today. **You are the reader
of the brief:** the app composes, for a scene or a run of scenes,
everything the wall knows in the order a video tool would need it. I want
to know whether that is enough to shoot from — and, more than that, what
it is missing.

## What I want you to do

1. Make the calls the on-ramp tells you to make first, before anything
   else, and open "Low Water". Tell me in a few lines what the series is,
   from the wall alone. Then stop and wait for my first direction.
2. Then do what I direct, one thing at a time. When I hand you a brief,
   read it as someone who has to make the segment: say what you would
   shoot — the shots, the faces, the place, the sound, what has to be true
   when it ends — from the brief and nothing else. Do not read the pages,
   the cards or the people's pages to fill a gap in the brief: **a gap in
   the brief is the finding**; say it, and then, if the wall holds the
   answer somewhere else, say where, as a second finding.
3. After each direction, give me the friction entries it produced.
4. Keep going until I say **stop**. Then hand me the report.

## What I do not want you to do

- **Change nothing on the wall.** No writes of any kind. If a direction
  seems to ask for one, say what you would write and where, and do not.
- **Do not fix, edit or improve PlotCoder.** No commits, no pull requests,
  no edits to any file in that repo.
- **Do not read `REQUIREMENTS.md` or `CLAUDE.md`.**
- **Do not read the app's source to work out what a tool does.**
- Do not invent a face, a place, a voice, a time of day, a weather, a
  sound, or any fact the brief does not hold and I have not given you.
  Where you would have to, that is an entry in the log.

## The log

Keep a friction log from your first call to your last, as you go. An entry
is every place the brief, the app, the on-ramp or a tool's reply made you
guess, left you unsure, or left out something you would need before a
frame — **every fact a person shooting this would have to invent or ask
for; every place the brief says something the scene's own words
contradict; every place the order of the brief made you read twice.**
Number them in the order they happened and say which direction each came
from. Do not rank them and do not fix them.

Show me the new entries without being asked, after every direction, and
"nothing new" when there is nothing new.

## The report I want at the end

When I say stop, hand me one report and make it the only thing you hand back.

1. **What you would shoot**, for the scene and for the run, as you said it.
2. **The friction log**, complete, as described above.
3. **What the brief did not hold**, in one list: each gap, whether the wall
   holds it elsewhere (and where), whether I left it open, and where on the
   wall it should live.
4. **What a video tool would need from the app** that no tool gives today.
5. **What you were never sure of.**

Be blunt. A polite log is a useless log.
