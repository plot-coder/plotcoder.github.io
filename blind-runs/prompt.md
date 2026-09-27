# The blind-run prompt — pass 2b: jumping in for the agent

Paste everything below the line into a fresh agent session. The credentials
ride in the connector's header: the test account is `test@test.com`,
password `test`, a throwaway that holds nothing of anyone's. **Do not
empty it:** "Last Orders" is the wall this pass is about.

Pass 2b is the second pass of goal 2 in `docs/plan.md` (a person opens the
app after the agent has worked) — the reverse of 2a: **a fresh agent picks
up a wall it has never seen, from the wall alone**, and the pass measures
what it had to be told again. The wall is "Last Orders" as pass 1b's agent
left it on the test account and pass 2a's person looked at it — eight
scenes written, one set aside, two beats, fifteen things open by the
writer's word, one question left with a reason, and the record of a session
(R76, at 0.1.57) on the door for every change from now on; the changes
before it are not on the record, and that is part of what the pass
measures. Through the desktop connector alone. It measures: what the agent
can say of the film, of what is decided and open, of what the agent before
it did and was waiting on, and of which scenes are written, **from the
wall alone before it asks anything**; what it then has to ask; whether it
reaches for the record and the last word when they are there; what its
own changes leave on the record for the next hand, and whether `hand_over`
is reached for at the end. Beside those: whether the since-anyone line and
Since you looked say the same thing; and what the agent makes of a wall
whose history begins mid-way. Nothing here tells the agent what any of
these are.

---

Before you paste:

1. **Wire the connector, and nothing else**, as pass 1b's prompt says
   (`pass-1b-prompt.md`, item 1); the door should answer `"version":"0.1.57"`.
2. Start the session with no folder.
3. **The writer's answers**, only when asked, in these words:
   - What the film is, who is in it, what is decided: **"It is on the
     wall. Tell me what the wall tells you."**
   - Anything the wall does not hold: **"I don't know yet — leave it
     open."**
   - Whether the man's card comes back: **"Yes — on the last night, Priya
     finds it in the till and puts it on the counter. Nobody says
     anything."**
   - Where the fish knife is first seen: **"On the first Friday, on the
     counter, by the till."**
   - What changes in the funeral tea, the pier: "I don't know what changes
     yet."
4. The agent stops after its first calls and its reading of the wall,
   before it asks anything; then say "go on" and answer as above. Then
   direct, one at a time:
   1. "what did the agent before you do on this wall, and what was it
      waiting on me for? Say what the wall told you and what you cannot
      tell";
   2. "the man's card comes back: on the last night, Priya finds it in the
      till and puts it on the counter. Nobody says anything. The wall and
      the page";
   3. "the fish knife is first seen on the first Friday, on the counter by
      the till. The wall and the page";
   4. "what did you change, in my terms? Read it back to me from the
      wall, not from memory";
   5. "you are stopping now. Leave me whatever you would leave";
   6. "stop".
   Then the driving session reads the wall as a third hand — `read_wall`
   and `read_record` through its own door — and the report is filed with
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

Another agent worked this wall with me last night, and I have been at it
myself since. You have not seen any of it. **Do not start a new project and
do not empty the account:** the project on it, "Last Orders", is the one,
and it is mine.

## What I want you to do

1. Make the calls the on-ramp tells you to make first, before you change
   anything.
2. **Before you ask me a single thing**, tell me, from the wall alone: what
   this film is; what is decided and what is open; what the agent before
   you did last and what it was waiting on me for; which scenes are
   written and which are not; and what, if anything, you would ask me.
   Say plainly which of those the wall told you and which it could not.
   **Then stop and wait** for me to say go on.
3. Then do what I direct, one thing at a time, and nothing more. When a
   direction could mean two things on this wall, ask before you act. After
   each direction, tell me in a line what you did and what the app said
   back, quote the reply whenever it surprised you, and give me the
   friction entries that direction produced.
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
above all, **every place the wall could not tell you something you had to
ask me, or something you would have wanted to know before you touched it.**
Number them in the order they happened and say which part of the session
each came from: the way in, the reading, my directions. Do not rank them
and do not fix them.

Show me the new entries without being asked: with your first reading, before
I say go on; after every direction of mine; and "nothing new" when there is
nothing new. If I say **log so far**, show me the whole log as it stands.

## The report I want at the end

When I say stop, hand me one report and make it the only thing you hand back.

1. **What you found on the wall, and what I then had you change.** A few
   sentences.
2. **The friction log**, complete, as described above.
3. **What the wall told you and what it could not**: for each of the five
   things I asked for up front — the film, decided and open, the agent
   before you, which scenes are written, what to ask — where the answer
   came from, or that it had none.
4. **What I asked for that you never found a way to do**, or did some other
   way than the one you first reached for.
5. **What you were never sure had landed.**
6. **What you left for the next hand**, and where.

Be blunt. A polite log is a useless log.
