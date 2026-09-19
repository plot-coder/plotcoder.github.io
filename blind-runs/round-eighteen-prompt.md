# Round eighteen — the prompt as it ran (2026-09-18)

The notes it carried, "The Allotments", are `round-seventeen-idea.md`: one
treatment, one file. `prompt.md` is now round nineteen's.

Paste everything below the line into a fresh agent session. The credentials are
already in the server's wiring: the test account is `test@test.com`, password
`test`, a throwaway that holds nothing of anyone's. The agent checks and
empties it itself at the start of the round, in case round seventeen left
something.

Round eighteen runs the same page of notes as seventeen —
`round-seventeen-idea.md`, "The Allotments" — against the package that
carries what seventeen produced: the open card (R59), a payoff with no fold
and a card with nobody in it as questions, the premise as the project's,
"story order: unset". It measures two things. Whether a stranger, told "I
don't know yet, leave it open", finds the card that can be left open without
being told it exists. And what it does with the key and the bucket, the two
threads whose plants have no card yet, which the wall still cannot hold.
Nothing here tells the agent what those are.

Before you paste:

1. **Check the wiring.**

   ```bash
   node -e 'const c=require(process.env.HOME+"/.claude.json");const p=c.mcpServers&&c.mcpServers["plotcoder-board"];console.log(p?"wired as "+p.env.PLOTCODER_EMAIL:"NOT WIRED")'
   ```

   If it says not wired, put the entry back by hand — top-level `mcpServers`,
   `"plotcoder-board": { "type": "stdio", "command": "npx", "args": ["-y",
   "plotcoder-board@latest"], "env": { "PLOTCODER_EMAIL": "test@test.com",
   "PLOTCODER_PASSWORD": "test" } }` — and start the session after.
2. **Land the fixes where the round will find them.** Both plotcoder.com and
   `npx -y plotcoder-board@latest` carry 0.1.26, which has everything round
   seventeen produced and the open card; if code has changed since, merge
   to `main`, wait for the Pages deploy, and release from a current `main`:

   ```bash
   npm version patch && git push && git push --tags
   ```

3. Start the session with no folder (the app's "No folder" scratch workspace
   is right). Inside a repo worktree the harness puts `CLAUDE.md` in the
   agent's context, and the run is not blind.
4. **The writer's answers.** The same as round seventeen's, so the walls are
   comparable. Answer only what the agent asks; where it does not ask, do
   not volunteer:
   - It is a feature, ninety pages. The title is "Plot 14".
   - It is the third year. Con's wife, Bridie, died two years ago; he has
     been on the plot alone since. The crowns were planted the spring before
     she died. This is the first year they can be cut.
   - The land is going for housing. The council man has no name.
   - Ruth was in hospital — a breakdown, four months. She says so on the
     day she tells him. Her surname is Kane. The sister is never seen and
     never named.
   - The letter is posted to the house; Con pins it to the shed door
     himself, which is how Ruth learns of it.
   - The break-in: kids from the estate, and Con knows which ones. Say
     "kids" first; if the agent asks whether Con knows them, yes.
   - Declan's wish to move him to Naas is pressure on the plot, not the
     plot: a subplot.
   - The ending: they lose the plots. Ruth keeps the crowns in a bucket on
     her balcony. Con does not die in this film.
   - The turns: "propose them and I will strike".
   - The wrong tools pay off when Con gives her his; the key pays off after
     the break-in, when he gives her the only one; the bucket pays off in
     the last scene.
   - Anything else the notes do not say: **"I don't know yet — leave it
     open"**, in those words, every time. Do not say how. Whether the agent
     finds the card that can be left open, and what it does instead when it
     does not, is the measurement.
5. The agent stops after its first calls with the first friction entries and
   waits for you to say "go on". Then it asks; answer as above. When it has
   built and read the wall, stay, and direct, one at a time:
   - give the order, and have it propose the turns and mark them;
   - "which cards are still open, and what would close each one" — ask it
     to answer from the wall, not from memory;
   - "I have decided about Declan's scene: it is at Con's house, in the
     kitchen, and Ruth is not there" — and see what closes;
   - "add the teaching scene between the first morning and the letter: Con
     shows her the asparagus bed and tells her three years. That is all I
     know about it";
   - "the key and the bucket: make the wall hold them, so it asks where each
     is first seen" — and see what it reaches for and what it says the wall
     cannot do;
   - write the first morning;
   - how long is it, and what is missing to reach ninety;
   - anything else a writer would ask on day one.
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
2. Read my notes at the end of this message. They are notes, not a
   treatment: some of it I know, some of it I have two versions of, and some
   of it I have not decided. **Ask me** what you need to build a wall from
   them. Ask what the app says a treatment should answer, and anything the
   notes leave open that you need. Where I say I don't know, leave it open
   and tell me how the wall holds an open thing.
3. Build it as one board from what the notes state and what I answer:
   the scenes as cards, the cast, the places, when each scene happens where
   that matters, the arrows, the plants and where they pay off, the film's
   central question if I give you one. Mark no turns until I say.
4. Read the wall back to me: what is there, and what it asks.
5. **Then wait for me.** I will give you directions, one at a time. Do what I
   ask and nothing more. When a direction could mean two things on this wall,
   ask before you act. After each direction, tell me in a line what you did
   and what the app said back, quote the reply whenever it surprised you, and
   give me the friction entries that direction produced.
6. Keep going until I say **stop**. Then hand me the report.

I will not ask you for the log. You bring it to me, as it grows, at the
places the next section names.

Ask me about anything the notes do not say. I would rather answer ten
questions than read one invention.

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
- Do not invent a person, a logline, a scene, or any fact the notes do not
  state and I have not given you. Where the notes have two versions, ask
  which; where they have none, ask, and if I say leave it, leave it.
- Do not write scene text, paginate, export or print until I ask for it. I will.

## The log

Keep a friction log from your first call to your last, as you go, not from
memory at the end. An entry is every place the app, the on-ramp, the guide, a
tool's description or a tool's reply made you slower, made you guess, made you
backtrack, or left you unsure whether what you intended had actually landed.
Include the small ones: a word that read two ways, a reply that did not say what
it had done, a direction of mine you could not map onto any tool, and an open
thing in my notes the wall had no way to hold. Number them in the order they
happened and say which part of the session each one came from: the way in,
the asking, the build, the reading, or my directions. Do not rank them and do
not fix them; that is my job.

**Show me the new entries without being asked**, at five points:

- when you are wired in and have made the first calls, before you ask me
  anything — and **stop there and wait** for me to say go on;
- with your questions, before I answer them;
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
6. **What the notes left open that the wall could not hold**, and what you
   did with it.

Be blunt. A polite log is a useless log. I am going to act on this, and
anything you smooth over is something I will not fix.

---
