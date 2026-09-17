# Round fourteen — the prompt as it ran (2026-09-16)

The treatment it carried, "Ninety-Nine", is `round-thirteen-treatment.md`: one
treatment, one file. `prompt.md` is now round fifteen's.

Paste everything below the line into a fresh agent session. The credentials are
already in the server's wiring: the test account is `test@test.com`, password
`test`, a throwaway that holds nothing of anyone's. The agent checks and
empties it itself at the start of the round, in case round thirteen left
something.

Round fourteen runs "Ninety-Nine" again through the published package, so the
wall is comparable with round thirteen's, and takes the directions further
past the wall. Round thirteen's six chosen findings were fixed on 2026-09-15
(`round-thirteen-report.md`); this round measures whether the fixes hold in a
stranger's hands, and what the directions round thirteen never gave will find.
Nothing here tells the agent what those were.

Before you paste:

1. **Land the fixes where the round will find them.** The round reads the
   on-ramp at plotcoder.com and runs `npx -y plotcoder-board@latest`, so
   both have to carry the fixes before the session starts: merge the pull
   request to `main`, wait for the Pages deploy (the on-ramp and the guide),
   then release the package — from a current `main`:

   ```bash
   npm version patch && git push && git push --tags
   ```

   The tag runs the publish workflow. Check `npm view plotcoder-board version`
   shows the new number before you start, or the agent runs last week's server.
2. The server is wired from round thirteen; `@latest` fetches the released
   version each session, so nothing to change. If it was taken out:

   ```bash
   claude mcp add plotcoder-board -s user -e PLOTCODER_EMAIL=test@test.com -e PLOTCODER_PASSWORD=test -- npx -y plotcoder-board@latest
   ```

   A server wired from inside a session connects only on the next one, which
   is why the person does this and not the agent.
3. Start the session with no folder (the app's "No folder" scratch workspace
   is right). Inside a repo worktree the harness puts `CLAUDE.md` in the
   agent's context, and the run is not blind.
4. The agent stops after its first calls with the first friction entries and
   waits for you to say "go on". When it has read the wall back, stay: answer
   its questions and direct it the way you would a person. Directions worth
   giving this round, in your own words and one at a time — they are the
   ones round thirteen had no tool for, and the ground past them:
   - the lay-by: take the quarter page off it and leave it unsized;
   - delete the ferry card, then bring it back;
   - the bus station at dawn belongs in Act three: put it there;
   - after an edit or two, leave whichever questions you would leave;
   - write the pier at Fenit; then the script out as Markdown for a producer
     in Google Docs, as plain text for an email, and as Final Draft for an
     agency — and ask what each one is called and how the unwritten scenes
     read in it;
   - how long is it, as a script and as a wall;
   - anything else a writer would ask on day two.
   It brings you the new entries at each step; "log so far" gets the whole
   log, "stop" gets the report.

---

You are working as a screenwriter's agent on PlotCoder, a storyline wall that
lives at plotcoder.com. I am the writer. You operate the app; I direct. I am
here for the whole session and will answer anything you ask.

## The round

Now read this, and whatever it tells you to read, and nothing else:

    https://plotcoder.com/llms.txt

## Your way in

The PlotCoder server is already wired into this session and signed in as me
— as my test account, test@test.com — so its tools are in front of you from
your first message: no clone, no install, no shell. If there is no `plotcoder-board` server, or it offers one
tool called `plotcoder_not_installed`, say so and stop.

You are working **my account**, not a wall on your own machine. There is no dev
server running and there will not be one. Nothing you build lives in a folder.
Do not run `npm run dev`. Do not open the app in a browser. Work the account.

Before you build anything, start a project of your own with `new_project`, so
nothing you do touches my other work.

## This account is a throwaway

Nothing on it is anyone's work. Once you are in and have made the first calls, before you build: save a copy
of whatever you find there with `export_project` into a folder of your own,
then `empty_account`. The on-ramp says to ask before emptying an account;
this is the asking, so do not ask again. This is housekeeping, not part of
the run: do not log it. If the account is already empty, say so and carry on.

## What I want you to do

1. Make the calls the on-ramp tells you to make first, before you change
   anything.
2. Read the treatment at the end of this message. It answers, up front, the
   questions the app says a treatment should answer. Use those answers; ask
   me only about what they leave open.
3. Build it as a wall: the scenes as cards, the major turns marked, the cast,
   the places, the arrows, the acts, the plants and their payoffs, the film's
   central question. It is a feature: there is no series premise, and the
   project holds this one board.
4. Read the wall back to me: what is there, and what it asks.
5. **Then wait for me.** I will answer your questions and give you directions,
   one at a time, and they will go past the wall: a scene to write, the pages
   to read back, the script to take out, in more than one form, for people who do not use
   a screenwriting app. Do what I ask and nothing more. When a direction could mean
   two things on this wall, ask before you act. After each direction, tell me
   in a line what you did and what the app said back, quote the reply whenever
   it surprised you, and give me the friction entries that direction produced.
6. Keep going until I say **stop**. Then hand me the report.

I will not ask you for the log. You bring it to me, as it grows, at the
places the next section names.

Ask me about anything the treatment does not say. I would rather answer four
questions than read four inventions.

## What I do not want you to do

- **Do not fix, edit or improve PlotCoder.** You are using the app, not building
  it. No commits, no pull requests, no edits to any file in that repo.
- **Do not read `REQUIREMENTS.md` or `CLAUDE.md`.** They would tell you what the
  app intends. I want to know what it actually does for someone who arrived with
  only the on-ramp.
- **Do not read the app's source to work out what a tool does.** If a tool's
  description and its reply do not tell you enough, that is a finding. Write it
  down and ask me.
- Do not drive the app by faking mouse or keyboard input. Call the tools.
- Do not invent a person, a logline, or any fact the treatment does not state.
- Do not write scene text, paginate, export or print until I ask for it. I will.

## The log

Keep a friction log from your first call to your last, as you go, not from
memory at the end. An entry is every place the app, the on-ramp, the guide, a
tool's description or a tool's reply made you slower, made you guess, made you
backtrack, or left you unsure whether what you intended had actually landed.
Include the small ones: a word that read two ways, a reply that did not say what
it had done, a direction of mine you could not map onto any tool. Number them in
the order they happened and say which part of the session each one came from:
the way in, the build, the reading, or my directions. Do not rank them and do
not fix them; that is my job.

**Show me the new entries without being asked**, at four points:

- when you are wired in and have made the first calls, before you build —
  and **stop there and wait** for me to say go on, so I see the way in
  before the wall;
- when the wall is built, before you read it back;
- with the reading, when you hand me the wall and its questions;
- after every direction of mine, with the line that says what you did.

Each time, the entries since the last time, numbered on from where the log
left off, and "nothing new" when there is nothing new. Never wait for me to
ask, and never hold an entry back for the report: if a reply made you guess,
I want to hear it in the same message as the guess. If I say **log so far**,
show me the whole log as it stands and carry on.

## The report I want at the end

When I say stop, hand me one report and make it the only thing you hand back.

1. **What you built and what I then had you change.** A few sentences.
2. **The friction log**, complete, as described above.
3. **What the on-ramp told you that you did not need, and what it did not
   tell you that you did.** Say plainly what you had to work out yourself.
4. **What I asked for that you never found a way to do**, or did some other way
   than the one you first reached for.
5. **What you were never sure had landed.** Anything you did that you could not
   confirm from a reply.

Be blunt. A polite log is a useless log. I am going to act on this, and
anything you smooth over is something I will not fix.

---

