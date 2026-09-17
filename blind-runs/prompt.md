# The blind-run prompt — round fifteen: a series, two boards

Paste everything below the line into a fresh agent session. The credentials are
already in the server's wiring: the test account is `test@test.com`, password
`test`, a throwaway that holds nothing of anyone's. The agent checks and
empties it itself at the start of the round, in case round fourteen left
something.

Round fifteen is the first round on a **project of two boards**. Every round
since four has built one board; a series with two episodes is the case no
round has measured. The treatment is new, "The Weighbridge", two half-hour
episodes with a premise above them, one cast, and things planted in the
first that pay off in the second. Nothing here tells the agent what we expect
to go wrong.

Before you paste:

1. **Land the fixes where the round will find them.** The round reads the
   on-ramp at plotcoder.com and runs `npx -y plotcoder-board@latest`, so
   both have to carry the current code before the session starts. The site
   is deployed from `main` on every merge; the package is not. From a
   current `main`:

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

   The `claude` command is not on this machine, so the wiring is by hand in
   `~/.claude.json`, user scope, with the two variables in `env`. A server
   wired from inside a session connects only on the next one, which is why
   the person does this and not the agent.
3. Start the session with no folder (the app's "No folder" scratch workspace
   is right). Inside a repo worktree the harness puts `CLAUDE.md` in the
   agent's context, and the run is not blind.
4. The agent stops after its first calls with the first friction entries and
   waits for you to say "go on". When it has read the walls back, stay:
   answer its questions and direct it the way you would a person. Directions
   worth giving this round, in your own words and one at a time — the ground
   a second board opens, and the ground past it:
   - the shim under the plate should open episode two, not close episode
     one: put it there;
   - Rooney's driver is at the plate in the last scene of episode two: put
     him in it;
   - Dana's page, across both episodes;
   - the half-hour structure beside episode one, without laying cards;
   - write the re-test in episode two; then the script out as Final Draft
     for an agency — and ask what goes out, one file or two, what each is
     called, and how the unwritten scenes read;
   - how long is it, the series and each episode, as a wall;
   - rename the series;
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
3. Build it: two episodes of a series, in one project, as the treatment
   lays them out — the scenes as cards, the major turns marked, the cast,
   the places, when each scene happens, the arrows, the acts, the plants
   and where each pays off, the series' premise and each episode's central
   question.
4. Read it back to me: what is there, episode by episode, and what it asks.
5. **Then wait for me.** I will answer your questions and give you directions,
   one at a time, and they will go past the wall: a scene to move, a person
   to follow, a scene to write, the script to take out for people who do not
   use a screenwriting app. Do what I ask and nothing more. When a direction
   could mean two things on these walls, ask before you act. After each
   direction, tell me in a line what you did and what the app said back,
   quote the reply whenever it surprised you, and give me the friction
   entries that direction produced.
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
- when both episodes are built, before you read them back;
- with the reading, when you hand me the walls and their questions;
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

## The treatment

# The Weighbridge — two episodes of a series

**What this treatment answers, up front.**

- Length: a half-hour series. Each episode is thirty pages. There are two
  episodes here; the series would run to six.
- The project is "The Weighbridge". It holds two boards, one per episode:
  "Gross Weight" and "Certified", in that order.
- The series premise is stated below, verbatim, and each episode has its own
  central question, stated at its head, verbatim.
- The turns, five in each episode, are named at each episode's head.
  Everything else is a scene.
- Acts: each episode has a cold open and two acts. Where each break falls
  is marked in the text.
- Places are named in each paragraph. The weighbridge is one place: the
  plate, the office beside it, the yard around it, and underneath it. The
  café is one place. The house behind the café is one place. The church at
  Ballinlough is one place.
- When it matters: episode one runs over two days. Episode two runs over
  one day twelve days later, and the dawn after it. The days are named in
  each paragraph, and the time of day where it matters.
- Names: Dana Kerr, Oisín Kerr, Bríd Nolan, Fintan Rooney. The inspector and
  Rooney's driver are unnamed; call them by those roles. They are one cast for
  the series, not one per episode. Tom Kerr, Dana's father, is dead before
  the first scene and is in no scene; he belongs in notes, not the cast. The
  bank, the county and the quarry are not people.
- Planted, and where each pays off:
  - the second column in the ledger is planted in episode one's cold open and
    pays off in episode one, when Bríd says what it is;
  - Oisín's photograph of the ledger is planted in episode one and pays off
    in **episode two**, when the ledger is gone;
  - the inspector's letter is planted in episode one and pays off in
    **episode two**, when the inspector arrives;
  - the shim under the plate is planted at the end of episode one and pays
    off in **episode two**, when Dana takes it out.
  - Dana's job in Manchester is not a plant. It pays off nowhere, in these
    episodes or any other; if the wall asks about it, the answer is that it
    is not planted, so do not fold it.
- Lengths: in episode one, the funeral runs two pages and the inspector's
  letter a quarter of a page. In episode two, the re-test runs three pages
  and the evening in the house half a page. Leave the rest unsized.
- Invent nothing: no looks, no voices, no facts beyond these lines. Where a
  scene is here, its place and its people are here; if a scene seems to need
  someone the treatment does not put in it, ask.

**The series asks:** can a place everyone passes through become the place
someone stays?

---

## Episode one — Gross Weight

**The episode asks:** will Dana sell the weighbridge before she learns what
it was for?

**The turns, five:** Fintan makes his offer; Bríd says what the second column
is; Dana weighs the truck true; Bríd says the plate reads light; the shim.

**Cold open.** The weighbridge at Ballinlough, dawn, day one. A quarry truck
rolls onto the plate. In the office beside it Bríd Nolan, fifty-eight, who
cooks in the café and has read the scale every morning for twelve years,
writes the weight in a ledger, then writes a second number beside it, and
hands the driver a docket with the first.

**Act one.** The café, morning, day one. Dana Kerr, forty-four, arrives from
Manchester with her son Oisín, fifteen. Bríd gives her the keys to
everything and says the funeral is at eleven. Dana says she is selling the
place. Bríd says people generally do.

The church at Ballinlough, midday, day one. Tom Kerr's funeral; two pages.
Fintan Rooney, sixty, who runs the haulage out of the quarry, shakes Dana's
hand at the door and says her father was a fair man to deal with, and that
he will make her an offer on the place before she goes back.

The office at the weighbridge, afternoon, day one. Dana goes through her
father's drawers and finds the ledger. Two columns of weights, side by side,
every day for years, the second always heavier. She does not know what the
second is. Oisín photographs the open pages on his phone for something to do.

The café, evening, day one. Dana asks Bríd about the second column. Bríd says
the first is what goes on the docket and the second is what the truck
weighed. Tom under-weighed Rooney's loads by a tonne for twelve years, and
Rooney's trucks crossed the county bridge at Ballinlough overloaded on legal
paper every day of it. The second column was Tom's own conscience. Nobody
else has ever seen it.

The house behind the café, night, day one. Oisín asks Dana whether they are
staying. She says no. He says he liked the café. She says he liked the chips.

**Act two.** The weighbridge, dawn, day two. Rooney's truck comes onto the
plate. Rooney's driver waits at the office window for his docket. Dana
weighs it, writes the number the scale shows, once, and hands it to him.
He reads it, looks at her, and rings Rooney from the cab.

The café, morning, day two. Fintan comes in and sits down. He offers to buy
the weighbridge and the café for a good price, today, and says this
morning's docket was a mistake she will want to correct. Dana asks what
happens if she does not. He says the bridge at Ballinlough is rated for
forty tonnes and the county has never had cause to wonder what crosses it.

The office, afternoon, day two. In the post, a letter from the county's
weights and measures inspector: the weighbridge's annual certification is
due, and the inspector will attend on the fourteenth with test weights. A
quarter of a page.

The café, evening, day two. Dana tells Bríd she is not selling yet. Bríd
says in that case there is a thing she will want to know: the plate reads a
tonne light and always has, since before Bríd's time, and Tom's second
column was the correction, not the crime.

The weighbridge, night, day two. Dana and Oisín underneath the plate with a
torch. Oisín finds a steel wedge, the size of a fist, jammed under one of the
load cells. Dana looks at it for a long time and leaves it where it is. She
does not tell him why. End of episode.

---

## Episode two — Certified

**The episode asks:** can Dana keep the weighbridge honest and keep it at
all?

**The turns, five:** the plate fails; the shim comes out; Dana refuses
Fintan; the photograph shown; one column.

**Cold open.** The weighbridge, morning, day fourteen. The inspector, a woman
with a van of test weights and a clipboard, arrives at nine and says she
will need the plate clear for an hour.

The office, morning, day fourteen. Dana goes to the drawer for the ledger.
It is not there. Bríd says Fintan was in the café yesterday afternoon and
went through to the office for the toilet. Dana says nothing. Oisín says he
has it, and holds up his phone.

**Act one.** The café, morning, day fourteen. Fintan arrives, sits, and
orders tea. He says the inspection is a formality and Tom always managed it
without fuss. Dana understands that the wedge has been under the plate for
every certification for twelve years and that her father passed each one.

The weighbridge, midday, day fourteen. The inspector sets the test weights
on the plate. It reads a tonne light. She says it fails, and that it can be
adjusted and re-tested this afternoon or she can fail it today and come back
in a month; she can be back at four.

Underneath the plate, early afternoon, day fourteen. Dana and Oisín with the
torch. Dana takes the wedge out and puts it in her coat pocket. Oisín asks
whether that is the fix or the crime. She says both.

**Act two.** The café, afternoon, day fourteen. Fintan has heard. He says a
true plate costs him a tonne a load and he runs forty loads a week, the
quarry contract is on the tonnage, and there is a bridge at Kilbeg that will
weigh him the way he likes, and when his trucks go to Kilbeg the café's trade
goes with them. Dana says then go to Kilbeg.

The weighbridge, four o'clock, day fourteen. The inspector re-tests; three
pages. The plate reads true. She signs the certificate. Then she asks, as
she always does, to see the ledger for the last year. Dana looks at Oisín.
Oisín gives her his phone. Two columns. The inspector reads for a long time
and asks whose hand the second column is in. Dana says her father's. The
inspector says she will be back in a month, and not alone.

The house behind the café, evening, day fourteen. Half a page. Oisín asks
why she showed it. Dana says because it was true, and because Fintan Rooney
would have found the ledger useful for the rest of her life.

The weighbridge, dawn, day fifteen. A truck comes onto the plate. It is not
one of Rooney's. In the office, Bríd reads the weight and writes it down
once. Dana watches from the window. End of episode.
