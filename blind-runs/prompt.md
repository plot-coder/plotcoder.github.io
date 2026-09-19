# The blind-run prompt — round twenty-two: new notes, through the door's name

Paste everything below the line into a fresh agent session. The credentials
ride in the connector's header: the test account is `test@test.com`,
password `test`, a throwaway that holds nothing of anyone's. The agent
checks and empties it itself at the start of the round, in case round
twenty-one left something.

Round twenty-two is the first on a new page of notes — `round-twenty-two-idea.md`,
"The Last Bus" — and the first through the hosted door's name,
`https://mcp.plotcoder.com`, wired into the session as a desktop-app
connector rather than a stdio block in a file (Robert's call 3: a wiring
that cannot vanish). It runs against 0.1.41, which carries what rounds
twenty and twenty-one produced and Robert's seven calls: the tails that
count until the first reading, presence, R65's two versions of a scene, the
camera marks, the open target and the sketch. It measures five things.
Whether the connector answers from the first message, with the writer
signed in and nothing to install. Whether a stranger, told of a scene "I
have it two ways, keep both", reaches `set_alternative` and later
`choose_version`, rather than two plain cards or one card with a note.
Whether the fold gets named in one call now, and the tie rule does the
adjacent half right. What the write's reply says about the camera, and
whether the agent reads those marks as marks and not as questions to bring
the writer. And what the tail says about the wall's questions before the
first `read_wall` and after it. Beside those, unmeasured but worth reading
for: the target left open by the writer's word, and what the runtime line
and the reading do with it; whether a written scene comes out a sketch and
what the reply calls it; and what the presence line says with no wall open.
Nothing here tells the agent what any of these are.

Before you paste:

1. **Wire the name.** In the Claude desktop app, Settings › Connectors ›
   Add custom connector: name **PlotCoder**, URL
   `https://mcp.plotcoder.com`, and under Request headers one header,
   `authorization`, with the value `Basic dGVzdEB0ZXN0LmNvbTp0ZXN0` (that is
   `test@test.com:test`, base64). Make sure the connector is enabled for
   the fresh session and not for any session of your own work: it is
   signed in as the test account. Check the door answers first:

   ```bash
   curl -s https://mcp.plotcoder.com
   ```

   It should say what the door is. If the connector does not appear in the
   session or offers no tools, that is the round's first finding; note it,
   and fall back to `claude mcp add --transport http plotcoder https://mcp.plotcoder.com --header "Authorization: Basic dGVzdEB0ZXN0LmNvbTp0ZXN0" --scope user`
   so the round can go on.
2. **Land the fixes where the round will find them.** plotcoder.com, the
   registry and the door all carry 0.1.41; if code has changed since, merge
   to `main`, wait for the Pages deploy, release from a current `main`, then
   bump the version pinned in `supabase/functions/mcp/index.ts` and
   redeploy the function:

   ```bash
   npm version patch && git push && git push --tags
   ```

3. Start the session with no folder (the app's "No folder" scratch workspace
   is right). Inside a repo worktree the harness puts `CLAUDE.md` in the
   agent's context, and the run is not blind.
4. **The writer's answers.** Answer only what the agent asks; where it does
   not ask, do not volunteer:
   - **Half an hour or a feature: "I don't know yet — leave it open"**, in
     those words. Whether the agent leaves the target open, picks one, or
     asks again, is worth reading for.
   - **The title: "The Last Bus."**
   - Tomás's surname is Ó Ceallaigh. The mother is Bríd Ó Ceallaigh. The
     inspector has no name.
   - What he goes to the town for: a music lesson — the fiddle, with an old
     man above a shop, paid for from the jar. Nuala finds out when she sees
     the fiddle case. Say this only when asked what he goes for; before
     that, if asked whether it is decided, "yes, but not yet on the wall".
   - The cut is announced in September, in the first scene; the film is
     September to New Year.
   - **The breakdown: "I have it two ways. Keep both on the wall until I
     decide."** In those words, every time it is asked about, and nothing
     about how. Whether the agent finds a way to hold two versions of one
     scene, and what it calls them, is the measurement.
   - **The depot: the same words**, "I have it two ways. Keep both on the
     wall until I decide."
   - The ending: nobody on the last run but the boy.
   - The turns: "propose them and I will strike".
   - The jar pays off on the last run: he empties it into her hand. The
     timetable pays off when the mother reads it in the shelter. The keys:
     **"I know where they pay off, not where they are first seen"** — the
     inspector's hand, the last scene — in those words, every time, and
     nothing more.
   - **Where a scene happens**, when the notes do not say: **"I don't know
     yet — leave it open"**, in those words.
   - Anything else the notes do not say: **"I don't know yet — leave it
     open"**, in those words, every time. Do not say how.
5. The agent stops after its first calls with the first friction entries and
   waits for you to say "go on". Then it asks; answer as above. When it has
   built and read the wall, stay, and direct, one at a time:
   - give the order, and have it propose the turns and mark them;
   - "what is still open on this wall, and what would close each one" — ask
     it to answer from the wall, not from memory;
   - "I have decided about the breakdown: it is the second way, she walks
     him home and meets the mother. Keep the other; I may come back to it"
     — and see what it does with the two, and whether the one not chosen
     leaves the count and the order;
   - "the jar is first seen on the first morning: he counts the fare out of
     it on the step of the bus. Put that on the wall" — the first morning's
     fold is free, so the tie should fold it, name it and draw the arrow to
     the last run; see what the reply says and whether it took one call;
   - "the keys are first seen in the depot scene, either way of it" — the
     depot has two versions; see what it does and what it asks;
   - "add the scene where the mother comes to the stop, between the
     breakdown and the day Nuala finds out. That is all I know about it";
   - write the first morning — and read what the reply says about the
     camera, then "are those questions for me?";
   - how long is it, and what is missing — with the target open, see what it
     reads against;
   - "the target: I have decided. It is a feature" — and see what closes;
   - "who has this wall open right now?";
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

PlotCoder is wired into this session as a connector named **PlotCoder**,
signed in as me — as my test account, test@test.com — so its tools are in
front of you from your first message: no clone, no install, no shell. If
there is no PlotCoder connector, or its tools are not there, say so and
stop.

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

A country bus route in the west, one bus a day each way, and the company is
cutting it at the end of the year. Nuala Feeney, sixties, has driven it for
twenty-two years. She knows every passenger by their stop.

A boy, Tomás, fourteen, starts riding it into the town every morning and
back on the evening run. He pays in coins from a jar. He will not say what he
goes to the town for. School is in the other direction.

Somewhere in the middle: the bus breaks down on the bog road at night, with
only the two of them on it. I have this two ways and I cannot choose yet.
One: they sit it out till morning and he talks. Two: she walks him the four
miles home and meets the mother. Keep both until I know.

The depot: an inspector comes out from the city about the cut. Either he
comes to the depot and she says nothing, or she drives to the city and says
too much. Two ways of that one as well.

Ending: the last run. Who is on it? Everyone, or nobody but the boy. I lean
to nobody but the boy.

Scenes I know:
- the first morning he gets on, the jar of coins
- the timetable she rewrites by hand every winter and pins in the shelter
- the breakdown (two ways, above)
- the depot (two ways, above)
- the mother comes to the stop to see who is driving her son about
- the day Nuala finds out what he goes to the town for
- the last run

What is he going to the town for? A hospital visit, a music lesson, or the
courthouse. I keep changing my mind. Decide, or leave it.

Time: September to New Year. The cut is announced in September. Or it is
announced in the first scene, and the film is the last month only.

Half an hour? A feature? I honestly do not know; it could be either.

Things that should pay off: the jar of coins (he empties it on the last run,
or she gives it back full). The hand-written timetable. The keys to the
bus — she keeps them when it is over, or hands them to the inspector.

Names: Nuala Feeney. Tomás — surname? The mother: Bríd. The inspector, no
name.

Title: The Last Bus, or Route 43.
