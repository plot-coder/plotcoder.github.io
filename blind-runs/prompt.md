# The blind-run prompt — round twenty-four: what the door says before anything is read, and an undo through it

Paste everything below the line into a fresh agent session. The credentials
ride in the connector's header: the test account is `test@test.com`,
password `test`, a throwaway that holds nothing of anyone's. The agent
checks and empties it itself at the start of the round — round
twenty-three's "The Tuner" is still on it.

Round twenty-four is on a new page of notes — `round-twenty-four-idea.md`,
"Doyle's" — through the desktop connector and nothing else, as
twenty-three was, against **0.1.50**. It carries everything twenty-three's
working list built, none of it run blind: a cast left open (R69), a thing
not decided about the whole film (R70), a proposed turn (R71), the first
reading meaning the first reading of the wall in hand, a card born as a
version or born set aside, replies that say what a change did to the
story's shape, one number for how long, a tidy that never leaves a cut card
under the rows, the day's rules arriving with the tools at the handshake,
`day-one.md`, each undecided thing listed once, the project's file as a
link, and an undo through the hosted door with a preview. It measures seven
things. **What the agent knows from the connector alone, before it reads a
word** — and how much of the on-ramp it then reads, and whether it goes on
to the whole guide. Whether "half the town is in that room and I could not
tell you who" reaches the cast's own open and not an invented crowd, a
person called "the town", or an open card. Whether "it is about the whole
film" reaches a line about the film and not a reminder, a premise, or a
person's page. Whether "propose the turns and I will strike" reaches a
proposed turn and not a marked one. Whether the second way of a scene and
the cut scene are **born** as a version and as set aside, in one call each,
rather than made and then moved. What the write's tail says after the first
reading of the agent's own wall — the counting tail twenty-three never saw.
And whether an undo through this door is reached for, previewed and
trusted: what it says it would take back, what it takes back, and what it
says of redo. Beside those, unmeasured but worth reading for: what a
reorder's reply says when a card with a version behind it moves; whether
"all of it, what is undecided" lists anything twice; what the tidy does
with the cut scene; what an open title prints as; whether the project's
file comes as a link and whether the agent can fetch it; and what "how long
is it" says first. Nothing here tells the agent what any of these are.

---

Before you paste:

1. **Wire the connector, and nothing else.** In the Claude desktop app,
   Settings › Connectors › Add custom connector: name **PlotCoder**, URL
   `https://mcp.plotcoder.com`; under Authentication choose **No sign-in**
   (the screen says OAuth is "Detected" and preselects "Sign in now": the
   door has no OAuth, and the app reads its 401 as one); and under Request
   headers one header, `authorization`, with the value
   `Basic dGVzdEB0ZXN0LmNvbTp0ZXN0` (that is `test@test.com:test`, base64).
   If the connector is still there from twenty-three, it only needs turning
   on. Make sure it is enabled for the fresh session and not for any session
   of your own work: it is signed in as the test account. **Check that no
   other PlotCoder server is wired:** `~/.claude.json` must hold no
   `plotcoder` or `plotcoder-board` entry, and the fresh session must not be
   in a folder with an `.mcp.json`. Check the door answers, and that it
   carries the release, issues a session and sends its instructions:

   ```bash
   curl -s https://mcp.plotcoder.com
   ```

   ```bash
   curl -si https://mcp.plotcoder.com -H "Authorization: Basic dGVzdEB0ZXN0LmNvbTp0ZXN0" -H "content-type: application/json" -H "accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"check","version":"0"}}}' | grep -i "mcp-session-id\|\"version\""
   ```

   The first says what the door is; the second should print an
   `mcp-session-id` header and a line carrying `"version":"0.1.50"` and an
   `"instructions"` text. **There is no fallback this round.** If the
   connector does not appear in the session or offers no tools, that is the
   round's finding: note what the screen said, and stop.
2. **Land the fixes where the round will find them.** plotcoder.com, the
   registry and the door all carry 0.1.50 as this is written. If code has
   changed since, merge to `main`, wait for the Pages deploy, release from a
   current `main`, then bump the version pinned in
   `supabase/functions/mcp/index.ts` and redeploy the function.
3. Start the session with no folder (the app's "No folder" scratch workspace
   is right). Inside a repo worktree the harness puts `CLAUDE.md` in the
   agent's context, and the run is not blind.
4. **The writer's answers.** Answer only what the agent asks; where it does
   not ask, do not volunteer:
   - **How long: "A feature. I have not counted."** In those words.
   - **The title: "Not decided — leave it open."**
   - **What changes in a scene**, for the first Friday, the man from the
     chain, the range and the last night, say what the notes imply in a
     sentence of your own. For the funeral tea, the pier and the morning
     after: **"I don't know what changes yet"**, in those words, every
     time, and nothing about how.
   - **Who is at the funeral tea: "Mairead and Declan. Half the town is
     there and I could not tell you who. I am not done deciding who is in
     that room."** In those words. If asked whether Priya is there: "I
     don't know yet."
   - **The pier: "I have it two ways. Keep both on the wall until I
     decide."** In those words. If asked which is in front: "alone, for
     now".
   - **The bank: "I have cut it. I do not want it in the film and I am not
     throwing it away."** In those words, every time, and nothing about
     how. If asked what happens in it: the manager tells Declan what the
     building is worth without the business in it.
   - **Whether Declan has signed: "I don't know. It is about Declan, not
     about a scene."** In those words.
   - **When it is set: "Now, or 1987. I don't know, and it is not about one
     scene — it is about the whole film."** In those words, every time, and
     nothing about where to put it.
   - **The acts**, if asked: "I have not decided how it divides. That is
     about the whole film too."
   - **The sign: "I know where it ends, not where it is first seen"** — it
     ends on the last night or the morning after, and even that is not
     chosen: "lit, or down; I don't know" — until the direction below
     decides where it is first seen.
   - "Nobody says the word sell to her face" — if asked where that goes or
     what it is: "it is true of the whole film, until the end".
   - The morning after: "it is last. That is all I know about it."
   - The man from the chain has no name and must not be given one. Tommy
     Reardon is never seen: if asked whether he is in the cast, "no — he is
     dead before it starts".
   - The turns: "propose them and I will strike".
   - **Where a scene happens**, when the notes do not say, and anything
     else the notes do not say: **"I don't know yet — leave it open"**, in
     those words, every time. Do not say how.
5. The agent stops after its first calls with the first friction entries and
   waits for you to say "go on". Then it asks; answer as above. When it has
   built and read the wall, stay, and direct, one at a time:
   - "propose the turns" — see whether they land as proposals or as marks,
     and what the reading says of them; then "keep the first and the last
     night; strike the rest";
   - "the order is: the first Friday, the range goes out, the man from the
     chain, the pier, the funeral tea, the last night, the morning after" —
     the pier has a version behind it and now runs before the funeral it
     was written to follow; see how many calls, and what the reply says the
     story now runs and what went with what;
   - "no — put it back as it was" — see what it reaches for: an undo, or a
     second reorder; and what it says before it does it;
   - "is there anything you are waiting on me for?";
   - "what is still undecided on this wall, all of it, and what would close
     each thing" — from the wall, not from memory; see whether the film's
     when, Declan's question, the funeral's room, the cut scene's open
     things and the title are all in it, and whether anything is there
     twice;
   - "Priya is at the funeral tea. I still don't know who else" — one maybe
     decided, the room still open; read what the reply says;
   - "the sign is first seen on the first Friday" — and see what it asks
     about where it ends;
   - "I have decided about the pier: Priya is with her, and it is the
     knife. Keep the other; I may come back to it";
   - "add a scene between the range and the funeral: Declan on the phone
     outside the shop. That is all I know" — then, once it has landed,
     "what would undo take back right now?" and then "undo it" — read both
     replies; then "and bring it back" — read what it says of redo, and
     what the agent does;
   - "tidy the wall" — and ask where the bank scene is now;
   - write the first Friday — and read what the reply says about the
     camera; then "add a line after the first paragraph: She counts them
     twice.";
   - "how long is it, and what is missing";
   - "give me the script as it stands" — see what the title page says;
   - "I want a copy of the whole project on my own machine" — see what
     comes back, and whether the agent can fetch it;
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
   treatment: some of it I know, some of it I have two versions of, some of it
   I have cut, and some of it I have not decided — about a scene, about a
   person, or about the whole film. **Ask me** what you need to build a wall from
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
  anything — and **stop there and wait** for me to say go on. In that first
  message, tell me two more things: what you already knew about working this
  app from the connector itself, before you read a word; and what you then
  read, by name, and roughly how much of it;
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

A chip shop on the front of a seaside town that has been closing for twenty
years. Doyle's. Mairead Doyle, sixty-three, has fried there since she was
fourteen. This is its last winter and she is the only one who does not know
it yet. Or she knows and will not say. Nobody in this film says the word
sell to her face until the very end.

Her son, Declan, forty, came back in the autumn "to help". The Saturday
girl, Priya Nair, seventeen, is the only one besides Mairead who can light
the old range without it going out.

What I know happens:
- the first Friday of the winter: the queue is eleven people, and Mairead
  counts them
- the man from the chain comes in, orders a small chips, eats them at the
  counter, and leaves a card. He is never named
- the range goes out in the middle of a Friday and Priya is the one who
  gets it lit
- Tommy Reardon's funeral tea, upstairs at the Harbour Bar. Half the town
  is in that room and I could not tell you who. Mairead is, and Declan is.
  After that I don't know
- the night on the pier, after the funeral: Mairead throws something in the
  sea. I have this two ways. She is alone, and it is the man's card. Or
  Priya is with her, and it is her husband's fish knife. I cannot choose.
  Keep both
- the last night of service. Mairead serves, Priya fries, and the queue is
  out the door

There was a scene at the bank, Declan and the manager. I have cut it. I do
not want it in the film and I am not throwing it away.

There is a scene after the last night — the morning after. That is all I
know about it, only that it is last.

Declan. Has he already signed something? I go back and forth. It is not a
question about one scene, it is a question about him.

When is this? Now, or 1987. I honestly don't know, and it changes
everything: the prices, the phones, whether there is a chain at all. That is
not about any one scene. It is about the whole film.

The sign: DOYLE'S in red neon over the door, and the Y has been dead for
years. It should be lit at the end, all of it, or it should come down. It
wants to be seen early and I have not decided where.

The order, as far as I have one: the first Friday, the man from the chain,
the range goes out, the funeral tea, the pier, the last night, the morning
after.

What changes in each? For some of them I can tell you. For the funeral and
the pier I can't yet.

How long? A feature. I have not counted.

Names: Mairead Doyle, Declan Doyle, Priya Nair. Tommy Reardon is dead before
the film starts and is never seen. The man from the chain has no name and
should not get one.

Title: Doyle's, or Last Orders, or The Dead Letter. Not decided.
