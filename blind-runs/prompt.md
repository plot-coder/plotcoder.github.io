# The blind-run prompt — round twenty-three: the connector alone, and a session behind the door

Paste everything below the line into a fresh agent session. The credentials
ride in the connector's header: the test account is `test@test.com`,
password `test`, a throwaway that holds nothing of anyone's. The agent
checks and empties it itself at the start of the round, in case round
twenty-two left something.

Round twenty-three is on a new page of notes — `round-twenty-three-idea.md`,
"The Tuner" — and is the first through **the desktop connector and nothing
else**: twenty-two's agent found a fallback the cueing session had left in
`~/.claude.json` and worked the whole round through that, so whether a
stranger holding only the connector is in from the first message is still
unmeasured. It runs against the release after 0.1.44, which carries
everything round twenty-two's to-do built, none of it run blind: set aside
(R66), the change line's own open (R67), "a feature" as the writer's word,
the open line on a person's page, `set_order`, `who_is_here`, the one view
of everything undecided, the short read, no tool tidying the wall on its
own, a version that steps forward inheriting what was tied to the scene —
and a session for the hosted door, so that the door remembers, from one
call to the next, what the agent has read and been told. It measures six
things. Whether the connector answers from the first message with nothing
else wired. Whether a stranger, told "I have cut it; I do not want it in the
film and I do not want to lose it", reaches `set_aside` rather than a
deleted card, an open card or a group called "cut". Whether "I don't know
what changes" reaches the change line's own open and leaves the card's
other questions standing. Whether "it is a feature" is kept as the writer's
word and not turned into a number. Whether a thing undecided about a person
lands on the person and not on a scene. And what the write's tail says
before the agent's first `read_wall` and after it, and whether advice is
said once — the session, which the agent cannot see and the report's quoted
replies can. Beside those, unmeasured but worth reading for: what the agent
does with someone who may or may not be in a scene, which the wall has no
field for; whether the order given as a list becomes one call; what "is
there anything I owe you?" costs to answer; and what happens to the fork's
thread when the version behind is chosen. Nothing here tells the agent what
any of these are.

---

Before you paste:

1. **Wire the connector, and nothing else.** In the Claude desktop app,
   Settings › Connectors › Add custom connector: name **PlotCoder**, URL
   `https://mcp.plotcoder.com`; under Authentication choose **No sign-in**
   (the screen says OAuth is "Detected" and preselects "Sign in now": the
   door has no OAuth, and the app reads its 401 as one); and under Request
   headers one header, `authorization`, with the value
   `Basic dGVzdEB0ZXN0LmNvbTp0ZXN0` (that is `test@test.com:test`, base64).
   Make sure the connector is enabled for the fresh session and not for any
   session of your own work: it is signed in as the test account. **Check
   that no other PlotCoder server is wired:** `~/.claude.json` must hold no
   `plotcoder` or `plotcoder-board` entry (twenty-two's mistake), and the
   fresh session must not be in a folder with an `.mcp.json`. Check the door
   answers, and that it carries the release and issues a session:

   ```bash
   curl -s https://mcp.plotcoder.com
   ```

   ```bash
   curl -si https://mcp.plotcoder.com -H "Authorization: Basic dGVzdEB0ZXN0LmNvbTp0ZXN0" -H "content-type: application/json" -H "accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"check","version":"0"}}}' | grep -i "mcp-session-id\|\"version\""
   ```

   The first says what the door is; the second should print an
   `mcp-session-id` header and the release's version. **There is no
   fallback this round.** If the connector does not appear in the session or
   offers no tools, that is the round's finding: note what the screen said,
   and stop.
2. **Land the fixes where the round will find them.** plotcoder.com, the
   registry and the door must all carry the release after 0.1.44; if code
   has changed since, merge to `main`, wait for the Pages deploy, release
   from a current `main`, then bump the version pinned in
   `supabase/functions/mcp/index.ts` and redeploy the function:

   ```bash
   npm version patch && git push && git push --tags
   ```

3. Start the session with no folder (the app's "No folder" scratch workspace
   is right). Inside a repo worktree the harness puts `CLAUDE.md` in the
   agent's context, and the run is not blind.
4. **The writer's answers.** Answer only what the agent asks; where it does
   not ask, do not volunteer:
   - **How long: "It is a feature."** In those words, and if asked for a
     number of pages or minutes, "a feature; I have not counted".
   - **The title: "Not decided — leave it open."**
   - **What changes in a scene**, for the chapel the first time, the school
     hall and the concert, say what the notes imply in a sentence of your
     own. For Mrs Hallam, the pub, and the chapel again: **"I don't know
     what changes yet"**, in those words, every time, and nothing about how.
   - **The pub: "I have it two ways. Keep both on the wall until I
     decide."** In those words.
   - **The audiologist's: "I have cut it. I do not want it in the film and I
     do not want to lose it."** In those words, every time it comes up, and
     nothing about how. If asked what happens in it: she is told the left
     ear is going and the right will follow, and she asks how long.
   - **Whether Ngozi knows: "I don't know. It is about Ngozi, not about a
     scene."** In those words.
   - **Whether Ngozi is at the pub: "I don't know yet."** Nothing more.
   - **The fork: "I know where it ends, not where it is first seen"** — it
     ends at the concert, she gives it to Callum — in those words, every
     time, until the direction below decides it.
   - "Nobody says the word deaf" — if asked where that goes or what it is:
     "it is true of the whole film".
   - The scene where she finds out about his pitch: "just after the school
     hall. That is all I know about it."
   - The organist is a man in his seventies; the pianist is a woman, young,
     foreign. No names.
   - The turns: "propose them and I will strike".
   - **Where a scene happens**, when the notes do not say, and anything else
     the notes do not say: **"I don't know yet — leave it open"**, in those
     words, every time. Do not say how.
5. The agent stops after its first calls with the first friction entries and
   waits for you to say "go on". Then it asks; answer as above. When it has
   built and read the wall, stay, and direct, one at a time:
   - "the order is: the chapel, the job centre, the school hall, the scene
     where she finds out, Mrs Hallam, the pub, the chapel again, the
     concert" — and see how many calls it takes and what the reply says the
     story now runs;
   - have it propose the turns and mark them on your word;
   - "is there anything you are waiting on me for?" — see what it reads to
     answer, and how long the answer is;
   - "what is still undecided on this wall, all of it, and what would close
     each thing" — ask it to answer from the wall, not from memory; see
     whether Ngozi's question and the cut scene's open things are in it;
   - "the fork is first seen in the pub scene, either way of it" — the pub
     has two versions; see what it does, what it asks, and whether it says
     it once or twice;
   - "I have decided about the pub: she is there with Callum. Keep the
     other; I may come back to it" — if the version with Callum is the one
     behind, this is the one that tests what a version stepping forward
     inherits; see where the other goes, and whether the fork is still
     planted;
   - "I have changed my mind about Mrs Hallam: cut it, but keep it" — a
     second cut, by direction this time, of a card already wired into the
     order; see what happens to the order and the count;
   - "add a scene after the concert. That is all I know about it" — see
     whether any other card moves;
   - write the chapel scene, the first one — and read what the reply says
     about the camera; then "add a line after the first paragraph: She
     hears it a half-second late.";
   - how long is it, and what is missing — see what "a feature" reads as;
   - "who has this wall open right now?";
   - "undo that last scene you added" — through this door; read what it
     says;
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
   I have cut, and some of it I have not decided. **Ask me** what you need to build a wall from
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

A piano tuner in a mill town in the north, the last one for forty miles.
Ada Okafor, fifty-eight. She is losing the hearing in her left ear and has
told nobody. Nobody in this film says the word deaf, not once, not even her.

She takes on a lad, Callum Reed, nineteen, sent by the job centre, who
cannot play a note and has perfect pitch and does not know it. She finds out
before he does.

The pianos I know:
- the chapel upright she has tuned every spring for thirty years, and this
  spring she gets it wrong and the organist hears it
- the school hall grand, where Callum first names a note out loud without
  meaning to
- the pub piano nobody has asked her to tune, which she tunes anyway, at
  night, alone — or with Callum; I have this two ways and cannot choose.
  Alone, she tests what she can still hear. With him, she tests what he can.
  Keep both until I know.
- the house of the widow, Mrs Hallam, who wants her husband's piano tuned
  and never played
- the concert: the visiting pianist, the hired Steinway, and Ada hands
  Callum the lever

There was a scene at the audiologist's. I have cut it. I do not want it in
the film and I do not want to lose it; keep it somewhere I can find it.

Her sister, Ngozi, runs the shop below the flat. Does Ngozi know about the
ear? I go back and forth. It is not a question about any one scene, it is a
question about Ngozi. And the night at the pub — is Ngozi there? I don't
know that either.

The tuning fork: her father's, an A, 440. She carries it everywhere. At the
end she gives it to Callum, or she drops it in the canal. It should be seen
early; I know where it ends, not where it starts.

The order, as far as I have one: the chapel, the job centre sends Callum,
the school hall, Mrs Hallam, the pub, the chapel again when the organist
hears it, the concert. The scene where she finds out about his pitch is the
school hall or just after it; I have not written it.

What changes in each? For half of these I honestly could not tell you yet.

How long? It is a feature. I know that much.

Names: Ada Okafor, Ngozi Okafor, Callum Reed, Mrs Hallam. The organist and
the pianist have no names yet.

Title: The Tuner, or Four Forty. Not decided.
