# The blind-run prompt — pass 1a, as it ran (2026-09-22): a complete script, edited across its length

Archived without its copy of the treatment, which is `round-thirteen-treatment.md` (one treatment, one file). The prompt ended with that treatment under the heading "The treatment".

Paste everything below the line into a fresh agent session. The credentials
ride in the connector's header: the test account is `test@test.com`,
password `test`, a throwaway that holds nothing of anyone's. The agent
checks and empties it itself at the start (round twenty-four's "Doyle's" is
still on it).

Pass 1a is the first pass of goal 1 in `docs/plan.md`: **a complete
script.** Twenty-four rounds measured the wall and the way in, and no round
wrote more than one scene. This pass takes "Ninety-Nine"
(`round-thirteen-treatment.md`, the only full treatment: seventeen scenes,
nine turns, three plants, every treatment question answered) through the
desktop connector alone against **0.1.51**, builds the wall as round
fourteen did, and then **writes all seventeen scenes**, exports the script
three ways, brings the Final Draft file back in, and then edits the film
across its whole length on the writer's word. It measures: whether a
complete, correctly paginated script comes out of the tools; what the
length says while the film is half written and when it is whole; whether
each sweeping edit — a plant moved, the ending changed, a plant and its
payoff cut, a person renamed everywhere, ten pages out of the second act,
an ending put back — lands through tools alone, and what the replies say
about the rest of the film when it does; what the app can say about the
script **as a whole** afterwards, and where the agent had to read pages and
wall side by side because no tool did. Beside those, worth reading for:
the anchor edit at scale; what the exports do with seventeen written
scenes; whether a rename reaches the pages; how far an undo through the
door goes back; and what the tails say when a write shrinks or grows the
film. Nothing here tells the agent what any of these are.

---

Before you paste:

1. **Wire the connector, and nothing else.** In the Claude desktop app,
   Settings › Connectors: the custom connector **PlotCoder** (the app names
   it `plot_coder`), URL `https://mcp.plotcoder.com`, Authentication **No
   sign-in**, one request header `authorization` with the value
   `Basic dGVzdEB0ZXN0LmNvbTp0ZXN0`. It must be **on before the session's
   first message**, from that session's own composer, and off for any
   session of your own work. `~/.claude.json` must hold no `plotcoder` or
   `plotcoder-board` entry, and the fresh session must not be in a folder
   with an `.mcp.json`. Check the door carries the release:

   ```bash
   curl -si https://mcp.plotcoder.com -H "Authorization: Basic dGVzdEB0ZXN0LmNvbTp0ZXN0" -H "content-type: application/json" -H "accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"check","version":"0"}}}' | grep -i "mcp-session-id\|\"version\""
   ```

   It should print an `mcp-session-id` and `"version":"0.1.51"`. **There is
   no fallback.** If the connector does not appear in the session or offers
   no tools, that is the pass's first finding: note what the screen said,
   and stop.
2. **Land the fixes where the pass will find them.** plotcoder.com, the
   registry and the door carry 0.1.51 as this is written. If code has
   changed since, merge to `main`, wait for the Pages deploy, release, bump
   the pin in `supabase/functions/mcp/index.ts`, redeploy the function.
3. Start the session with no folder (the app's "No folder" scratch
   workspace). Inside a repo worktree the harness puts `CLAUDE.md` in the
   agent's context, and the run is not blind.
4. **The writer's answers.** The treatment answers the treatment questions
   up front. Answer only what the agent asks; where it does not ask, do not
   volunteer:
   - Anything about the wall the treatment does not say: **"As in the
     treatment. If it is not there, leave it open."**
   - The scenes' text: **"Your lines, my facts. Write each scene from its
     paragraph and nothing more. A line the paragraph gives, use as given;
     dialogue the paragraph implies is yours to write. Add no fact, no
     person, no place. Where the paragraph says nothing is said, nothing is
     said."**
   - Title page: "Ninety-Nine, by me. No draft date but today's."
   - Direction 12's proposal (what to cut from the second act): **"Cut the
     ferry. Halve the fair. Nothing else."**
   - Direction 14 (the ending back): **"I want the old ending back, as it
     was. The chime plays."**
   - Anything else: "I don't know yet — leave it open", in those words.
5. The agent stops after its first calls with the first friction entries
   and waits for you to say "go on". Then it asks; answer as above. When
   it has built and read the wall, stay, and direct, one at a time:
   1. "mark the nine turns the treatment names" — if it has not;
   2. "write every scene, in story order, from its paragraph. Bring me the
      friction after each scene, not the scene. After the last one, how
      long it is" — seventeen writes; read what the length says after the
      first, the ninth and the last, and whether any reply says what a
      short scene did to the film;
   3. "how long is it, as a script and as a wall, and what is measured and
      what is guessed";
   4. "the script as Final Draft for the agency, as Markdown for the
      producer, and as plain text for me. Tell me what each is called and
      what the title page says";
   5. "take the Final Draft file back in and tell me what changed on the
      wall" — should be nothing;
   6. "the letter in the glove box is found at Mallow — in the mechanic's
      yard that night, not on the road out of Kilmallock. Move it: the
      card, the scene's text, the plant" — then "does it still pay off on
      the pier, and does the page say so?";
   7. "new ending: Noreen scraps it. Joe takes the two thousand. The chime
      never plays. Rewrite the last scene" — then "what did that do to the
      film: the question it asks, the chime's plant, the turns?";
   8. "cut the boy at the fair and the ten-euro note — out of the fair, out
      of the bus station, the fold and the arrow too" — then "is there a
      word about the note left on any page?";
   9. "Noreen Blaney is Noreen Gallagher now — everywhere: the roster, the
      cards, every page" — see whether the pages follow;
   10. "read the whole script and tell me: is it still the film the
       question asks? where on the page does each plant land and pay off?
       does Ciara's want show in her scenes? Say what the app told you
       and what you had to read for yourself";
   11. "how long is it now, and what changed since the last time I asked";
   12. "the second act runs long. Propose ten pages' worth to cut between
       Mallow and the bus station, and why. Do nothing until I say" — then
       answer as above, and "do it";
   13. "start a blue revision and change Joe's last line to whatever the
       new ending needs; then the script for the agency again";
   14. "put the ending back as it was" — see what it reaches for: undo,
       and how far back it can go; or a rewrite; and what it says before
       it does it;
   15. "the whole script, as it prints, and how long it is";
   16. "a copy of the whole project" — see what comes back;
   17. "who has this wall open right now?";
   18. anything else a writer would ask of a finished draft.
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
2. Read my treatment at the end of this message. It answers, up front, what
   the app says a treatment should answer. **Ask me** anything it does not,
   and only that. Invent nothing.
3. Build it as one board from what the treatment states: the scenes as
   cards, the turns it names as beats, the cast, the places, the days, the
   arrows, the plants and where they pay off, the lengths it gives, the
   film's central question verbatim.
4. Read the wall back to me: what is there, and what it asks.
5. **Then wait for me.** I will give you directions, one at a time — first
   to write the film, then to change it. Do what I ask and nothing more.
   When a direction could mean two things on this wall, ask before you act.
   After each direction, tell me in a line what you did and what the app
   said back, quote the reply whenever it surprised you, and give me the
   friction entries that direction produced. When I ask what the app can
   say about the film as a whole, tell me what a tool said and, separately,
   what you worked out by reading the pages and the wall yourself.
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
- Do not invent a person, a place, a scene, or any fact the treatment does
  not state and I have not given you. When you write a scene, the lines are
  yours and the facts are mine: nothing on the page the paragraph does not
  license.
- Do not write scene text, paginate, export or print until I ask for it. I will.

## The log

Keep a friction log from your first call to your last, as you go, not from
memory at the end. An entry is every place the app, the on-ramp, the guide, a
tool's description or a tool's reply made you slower, made you guess, made you
backtrack, or left you unsure whether what you intended had actually landed.
Include the small ones: a word that read two ways, a reply that did not say what
it had done, a direction of mine you could not map onto any tool, and a thing
I asked about the whole film that no tool could answer. Number them in the
order they happened and say which part of the session each one came from: the
way in, the asking, the build, the reading, the writing, or my directions. Do
not rank them and do not fix them; that is my job.

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

1. **What you built, what you wrote, and what I then had you change.** A
   few sentences.
2. **The friction log**, complete, as described above.
3. **What the on-ramp told you that you did not need, and what it did not
   tell you that you did.** Say plainly what you had to work out yourself.
4. **What I asked for that you never found a way to do**, or did some other way
   than the one you first reached for.
5. **What you were never sure had landed.** Anything you did that you could not
   confirm from a reply.
6. **What I asked about the film as a whole that no tool could answer**, and
   how you answered it instead: what you read, in what order, and what you
   could not tell from any of it.

Be blunt. A polite log is a useless log. I am going to act on this, and
anything you smooth over is something I will not fix.

---
