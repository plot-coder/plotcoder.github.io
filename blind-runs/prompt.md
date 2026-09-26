# The blind-run prompt — pass 1b: a complete script, from notes

Paste everything below the line into a fresh agent session. The credentials
ride in the connector's header: the test account is `test@test.com`,
password `test`, a throwaway that holds nothing of anyone's. The agent
checks and empties it itself at the start (pass 1a's "Ninety-Nine" is
still on it).

Pass 1b is the second pass of goal 1 in `docs/plan.md`: **a complete
script.** Pass 1a took a finished treatment to eighteen written scenes and
found that the app could say nothing of the whole, which became R74 and is
built at 0.1.53. This pass starts from a **page of notes** — "Doyle's"
(`round-twenty-four-idea.md`), the notes round twenty-four built a wall
from: six scenes the writer knows, one two ways, one cut and kept, one
known only to be last, a room nobody can name, a when undecided for the
whole film, a title not chosen — through the desktop connector alone
against **0.1.53**, builds the wall with the writer answering as
twenty-four's writer did, and then **writes every scene the writer will let
it write**, exports the script three ways, and then decides the film, one
undecided thing at a time, on the writer's word. It measures: what a
complete script does with the homes for "I don't know" — what an open
change line, an open cast, a when true of the whole film, a version
behind, a card set aside and a card wholly open each **print as** in a
finished script, and what the writer has to decide before the script is
whole; whether, asked what the app says of the script as a whole, the agent
reaches for the reading's new head — the pages against the wall — and what
it does with the sentence the reading quotes from a payoff's page; what the
replies say when a version steps forward over a written scene, when a cut
scene comes back into the film, and when an open card is closed and
written; and, through the desktop connector for the first time on a
written script, whether an undo through the door is reached for, previewed
and trusted, and how far back it goes. Beside those, worth reading for:
what "what changed since" says after the pages are rewritten; whether the
title page prints an open title and what it says once decided; whether
the exports say to lock and start a revision before the draft goes out,
and whether the agent does; and how many calls a decision about the whole
film costs once it is made. Nothing here tells the agent what any of these
are.

---

Before you paste:

1. **Wire the connector, and nothing else.** In the Claude desktop app,
   Settings › Connectors: the custom connector **PlotCoder** (the app names
   it `plot_coder`), URL `https://mcp.plotcoder.com`, Authentication **No
   sign-in**, one request header `authorization` with the value
   `Basic dGVzdEB0ZXN0LmNvbTp0ZXN0`. It must be **on before the session's
   first message**, from that session's own composer, and off for any
   session of your own work. `~/.claude.json` must hold no `plotcoder` or
   `plotcoder-board` entry (the user-scope stdio block was taken out on
   2026-09-26; the backup is `~/.claude/backups/claude.json.before-pass-1b`),
   and the fresh session must not be in a folder with an `.mcp.json`. Check
   the door carries the release:

   ```bash
   curl -si https://mcp.plotcoder.com -H "Authorization: Basic dGVzdEB0ZXN0LmNvbTp0ZXN0" -H "content-type: application/json" -H "accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"check","version":"0"}}}' | grep -i "mcp-session-id\|\"version\""
   ```

   It should print an `mcp-session-id` and `"version":"0.1.53"`. **There is
   no fallback.** If the connector does not appear in the session or offers
   no tools, that is the pass's first finding: note what the screen said,
   and stop.
2. **Land the fixes where the pass will find them.** plotcoder.com, the
   registry and the door carry 0.1.53 as this is written. If code has
   changed since, merge to `main`, wait for the Pages deploy, release, bump
   the pin in `supabase/functions/mcp/index.ts`, redeploy the function.
3. Start the session with no folder (the app's "No folder" scratch
   workspace). Inside a repo worktree the harness puts `CLAUDE.md` in the
   agent's context, and the run is not blind.
4. **The writer's answers.** The notes are notes; the agent will ask.
   Answer only what it asks; where it does not ask, do not volunteer.
   *At the build*, as round twenty-four's writer answered:
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

   *While it writes*, only if it asks:
   - **The scenes' text: "Your lines, my facts. Write each scene from my
     notes and nothing more. Add no fact, no person, no place. Where I have
     not decided, put nothing on the page that decides it for me."**
   - **The when, on the page: "Write it so it could be either. No prices,
     no phones, no year."**
   - **The funeral tea, on the page: "Mairead and Declan, and a room.
     Nobody else gets a line."**
   - **The pier: "Write the one in front. Leave the other as it is."**
   - **The bank: "Don't write it. It is not in the film."**
   - **The morning after: "I don't know what happens. Leave it."**
   - **The title page: "Not decided. Whatever the app prints for that."**
   - Anything else: "I don't know yet — leave it open", in those words.
5. The agent stops after its first calls with the first friction entries
   and waits for you to say "go on". Then it asks; answer as above. When
   it has built and read the wall, stay, and direct, one at a time:
   1. "propose the turns" — then "keep the first Friday and the last
      night; strike the rest";
   2. "the order is the one in my notes: the first Friday, the man from
      the chain, the range goes out, the funeral tea, the pier, the last
      night, the morning after";
   3. "the sign is first seen on the first Friday" — and see what it asks
      about where it pays off;
   4. "write every scene you can, in story order, from my notes. Bring me
      the friction after each scene, not the scene. Where I have not
      decided something about a scene, tell me what you did with that.
      After the last one, how long it is, and what is not written, and
      why" — read what it does with the funeral room, the pier's two ways,
      the bank scene, the morning after, and the year;
   5. "the script as Final Draft for the agency, as Markdown for the
      producer, and as plain text for me. Tell me what each is called,
      what the title page says, and what my undecided things printed as";
   6. "read the whole script and tell me what the app says of it against
      the wall. Say what a tool said and, separately, what you read for
      yourself" — see whether it reaches for the reading's head on the
      pages, and what it does with the line the reading quotes from a
      payoff's page;
   7. "what do I have to decide before this script is whole? All of it, in
      the order you would ask me";
   8. "it is now, not 1987. Put that wherever it matters" — see what it
      closes, and whether it touches a page;
   9. "the funeral tea: Priya is there, and Father Lyons, who buried Tommy.
      Nobody else I can name. Write it again" — then "what did the rewrite
      do to what the wall claims of that scene?";
   10. "the pier: I am keeping the knife. Priya is with her. The card and
       the page" — see what a version stepping forward does to a written
       scene, and what the reply says; then "write it";
   11. "no — put the pier back the way it was" — see what it reaches for:
       an undo through the door, and what it says it would take back
       before it does; then "and now forward again to the knife";
   12. "the bank scene is back in the film, between the man from the chain
       and the range. Write it: the manager tells Declan what the building
       is worth without the business in it";
   13. "the morning after: I know it now. Mairead lights the range herself,
       the Y is lit, and she opens. Write it, and close whatever I left
       open on it" — see whether the sign's payoff lands on the wall and
       whether the pages check quotes it;
   14. "the title is Last Orders. Title page: by me. My email is
       test@test.com" — see what it reaches for, and what the title page
       says now;
   15. "how long is it now, and what changed since the last time I asked";
   16. "is anything still open on this wall? Read the whole thing against
       the wall again" — then leave one page question with a reason, and
       see what a later reading does with it;
   17. "the script for the agency" — see whether it locks the numbers and
       starts a revision first, and what it says about that;
   18. "a copy of the whole project" — see what comes back through the
       connector;
   19. "who has this wall open right now?";
   20. anything else a writer would ask of a first draft from notes.
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

Nothing on it is anyone's work. Once you are in and have made the first
calls, before you build: save a copy of whatever you find there with
`export_project`, then `empty_account`. The on-ramp says to ask before
emptying an account; this is the asking, so do not ask again. This is
housekeeping, not part of the run: do not log it. If the account is already
empty, say so and carry on.

## What I want you to do

1. Make the calls the on-ramp tells you to make first, before you change
   anything.
2. Read my notes at the end of this message. They are notes, not a
   treatment: some of what the app says a treatment should answer is
   there, some is not, and some I have not decided. **Ask me** what they
   do not say, and only that. Invent nothing. Where my answer is that I
   have not decided, hold that on the wall in my words: I want to see
   every one of those again, not lose them.
3. Build it as one board from what the notes state and what I answer: the
   scenes as cards, the cast, the places, the arrows, the plants and where
   they pay off, and what I have not decided held where the app holds it.
4. Read the wall back to me: what is there, and what it asks.
5. **Then wait for me.** I will give you directions, one at a time — first
   the turns and the order, then to write the film, then to decide it.
   Do what I ask and nothing more. When a direction could mean two things
   on this wall, ask before you act. After each direction, tell me in a
   line what you did and what the app said back, quote the reply whenever
   it surprised you, and give me the friction entries that direction
   produced. When I ask what the app can say about the film as a whole,
   tell me what a tool said and, separately, what you worked out by reading
   the pages and the wall yourself.
6. Keep going until I say **stop**. Then hand me the report.

I will not ask you for the log. You bring it to me, as it grows, at the
places the next section names.

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
- Do not invent a person, a place, a scene, or any fact the notes do not
  state and I have not given you. When you write a scene, the lines are
  yours and the facts are mine: nothing on the page the notes do not
  license, and nothing on the page that decides what I have said I have
  not decided.
- Do not write scene text, paginate, export or print until I ask for it. I will.

## The log

Keep a friction log from your first call to your last, as you go, not from
memory at the end. An entry is every place the app, the on-ramp, the guide, a
tool's description or a tool's reply made you slower, made you guess, made you
backtrack, or left you unsure whether what you intended had actually landed.
Include the small ones: a word that read two ways, a reply that did not say what
it had done, a direction of mine you could not map onto any tool, a thing I
had not decided that you found no place to hold, and a thing I asked about
the whole film that no tool could answer. Number them in the order they
happened and say which part of the session each one came from: the way in,
the asking, the build, the reading, the writing, or my directions. Do not
rank them and do not fix them; that is my job.

**Show me the new entries without being asked**, at five points:

- when you are wired in and have made the first calls, before you ask me
  anything — and **stop there and wait** for me to say go on. In that first
  message, tell me two more things: what you already knew about working this
  app from the connector itself, before you read a word; and what you then
  read, by name, and roughly how much of it;
- with your questions, before I answer them;
- when the wall is built, before you read it back;
- with the reading, when you hand me the wall and its questions;
- after every direction of mine, with the line that says what you did — and
  while you are writing the scenes, after every scene.

Each time, the entries since the last time, numbered on from where the log
left off, and "nothing new" when there is nothing new. Never wait for me to
ask, and never hold an entry back for the report: if a reply made you guess,
I want to hear it in the same message as the guess. If I say **log so far**,
show me the whole log as it stands and carry on.

## The report I want at the end

When I say stop, hand me one report and make it the only thing you hand back.

1. **What you built, what you wrote, and what I then had you decide.** A
   few sentences.
2. **The friction log**, complete, as described above.
3. **What the on-ramp told you that you did not need, and what it did not
   tell you that you did.** Say plainly what you had to work out yourself.
4. **What I asked for that you never found a way to do**, or did some other way
   than the one you first reached for.
5. **What you were never sure had landed.** Anything you did that you could not
   confirm from a reply.
6. **What I had not decided, and what became of each one on the page:**
   where the wall held it, what the script printed for it, what the app said
   of it once the scenes were written, and what it took to close it once I
   decided. And what I asked about the film as a whole that no tool could
   answer, and how you answered it instead.

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
