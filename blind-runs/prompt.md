# The blind-run prompt — round twenty-one: the same notes, with the place and the title open and the tie rule right

Paste everything below the line into a fresh agent session. The credentials are
already in the server's wiring: the test account is `test@test.com`, password
`test`, a throwaway that holds nothing of anyone's. The agent checks and
empties it itself at the start of the round, in case round twenty left
something.

Round twenty-one runs the same page of notes as seventeen to twenty —
`round-seventeen-idea.md`, "The Allotments" — against the package that
carries what twenty produced: a place and a project's name that can be open
(R61's edge), the tie rule holding a thread's cards in story order so it
folds the first card in the story and not the last one added (twenty 40),
`create_note` with `plantsWhat`, and twenty's other fixes. It measures
three things. Whether a stranger, told "leave it open" of the title and of a
scene's place, leaves the field open through the field's own `open` — the
title through `new_project`'s `open` in place of a name, the place through
`set_location`'s `open` — rather than the whole card or nothing. Whether the
tie rule now does both halves right when the writer decides: the key's
first sighting on a card whose fold is the tools' leaves the key a thread
and draws nothing, and the bucket's first sighting on a card whose fold is
free folds that card, names the fold and draws the arrow, and the replies
say so. And whether, with the place open, the wall's questions about the
rest of an open-placed card still stand. Beside those, unmeasured but worth
reading for: whether the fold is named in one call now, and what the
reading's open head looks like with a title, places and whens all open.
Nothing here tells the agent what any of these are.

Before you paste:

1. **Check the wiring.**

   ```bash
   node -e 'const c=require(process.env.HOME+"/.claude.json");const p=c.mcpServers&&c.mcpServers["plotcoder-board"];console.log(p?"wired as "+p.env.PLOTCODER_EMAIL:"NOT WIRED")'
   ```

   If it says not wired, put the entry back by hand — top-level `mcpServers`,
   `"plotcoder-board": { "type": "stdio", "command": "npx", "args": ["-y",
   "plotcoder-board@latest"], "env": { "PLOTCODER_EMAIL": "test@test.com",
   "PLOTCODER_PASSWORD": "test" } }` — and start the session after. It has
   vanished before three rounds now.
2. **Land the fixes where the round will find them.** Both plotcoder.com and
   `npx -y plotcoder-board@latest` carry 0.1.36, which has everything round
   twenty produced and the open place and title; if code has changed since,
   merge to `main`, wait for the Pages deploy, and release from a current
   `main`:

   ```bash
   npm version patch && git push && git push --tags
   ```

3. Start the session with no folder (the app's "No folder" scratch workspace
   is right). Inside a repo worktree the harness puts `CLAUDE.md` in the
   agent's context, and the run is not blind.
4. **The writer's answers.** The same as rounds seventeen to twenty, so
   the walls are comparable, with one change: the title is left open.
   Answer only what the agent asks; where it does not ask, do not volunteer:
   - It is a feature, ninety pages. **The title: "I don't know yet — leave
     it open"**, in those words; the notes' two titles stand. Whether the
     agent starts the project with its name open, picks one, or asks
     again, is the measurement.
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
   - **The key and the bucket**, asked where either is first seen, which
     scene plants it, how the wall should hold it, or anything else about
     it: **"I know where it pays off, not where it is first seen"**, in
     those words, every time, and nothing more.
   - **Where a scene happens**, when the notes do not say: **"I don't know
     yet — leave it open"**, in those words. Whether the agent leaves the
     place open, opens the whole card, or leaves it blank, is the
     measurement.
   - **The logline**, and the board's name: **"I don't know yet — leave it
     open"**, in those words.
   - Anything else the notes do not say: **"I don't know yet — leave it
     open"**, in those words, every time. Do not say how.
5. The agent stops after its first calls with the first friction entries and
   waits for you to say "go on". Then it asks; answer as above. When it has
   built and read the wall, stay, and direct, one at a time:
   - give the order, and have it propose the turns and mark them;
   - "what is still open on this wall, and what would close each one" — ask
     it to answer from the wall, not from memory;
   - "I have decided about Declan's scene: it is at Con's house, in the
     kitchen, and Ruth is not there" — and see what closes, and whether the
     open place closes with it;
   - "add the teaching scene between the first morning and the letter: Con
     shows her the asparagus bed and tells her three years. That is all I
     know about it";
   - "I have decided about the key: it is first seen on the first morning.
     Con unlocks the shed while she stands there with the wrong tools. Put
     that on the wall" — the first morning's fold is the tools', so the key
     should stay a thread and nothing be drawn; see what the reply says and
     whether the wall carries anything it should not;
   - "I have decided about the bucket: it is first seen on the asparagus
     bed. Ruth carries the crowns to it in a bucket. Put that on the wall"
     — the bed's fold is free, so the tie should fold it, name it and draw
     the arrow to the balcony; see what the reply says and what the reading
     says about the bucket after;
   - "the title: I have decided. It is Plot 14" — and see what decides it
     and what the replies call the project after;
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


## The notes

Something about the allotments behind the railway in a midlands town. Con
Brady, seventies, has had plot 14 for forty years. The council is selling
the land — to whom? A supermarket, or housing. Decide.

A younger woman gets the plot next to his. Ruth. Thirties. She is just out
of something — prison, or hospital, or a marriage — and does not say which.
She turns up the first morning with the wrong tools.

He teaches her to grow something. Beans, potatoes — no, something slow.
Asparagus: three years before you cut it. That is the point: three years,
and they have one season. Or is it the third year already? If it takes
three years there is no crop the first season, so maybe it is the third
year and he has been on his own for two.

Ending: I don't know. Either they lose the plots and she keeps the crowns in
a bucket on a balcony, or he dies and she plants them somewhere. Not both.

Scenes I know:
- the first morning, the wrong tools
- the council letter (pinned to the shed door? or posted to the house?)
- a meeting in the parish hall where Con says nothing
- the night the shed is broken into — by whom? kids, or the developer's
  people, or Con himself for the insurance. Probably kids.
- the day she tells him where she was
- the last harvest
- Declan, the son, wants him to sell the house and move to Naas. That is a
  subplot, or it is the plot.
- something with the key to the shed. He has the only one.

Time: one growing season, March to October. Or the third year, see above.

Half-hour? Feature? A feature, I think, but I only have eight scenes.

Names: Con Brady. Ruth — surname? Declan Brady. The council man, no name.
Ruth's sister rings her; we never see the sister.

Things that should pay off: the wrong tools (she buys the right ones with
her first wages, or he gives her his). The key. The bucket.

Title: The Allotments, or Plot 14.
