# The blind-run prompt — round thirteen: a feature, the published package, past the wall

Paste everything below the line into a fresh agent session. The credentials are
already in the server's wiring: the test account is `test@test.com`, password
`test`, a throwaway that holds nothing of anyone's. It was emptied on
2026-09-14 before this prompt was written; the agent checks and empties it
again itself at the start of the round, in case a round left something.

Round thirteen changes two things from round twelve. The treatment is a
**feature**, "Ninety-Nine", so the round exercises a film with no series
premise above it and a thing the writer says is not a plant; every round
since four was an hour of television. And the directions run **past the
wall into pages**: a scene written, the pages read, the script taken out as
Markdown for a collaborator. R50 to R54 have never been measured by a round.

Before you paste:

1. Wire the server into every session on this machine, once, from any
   folder — the published package, no clone and no path — with the sign-in
   beside it:

   ```bash
   claude mcp add plotcoder-board -s user -e PLOTCODER_EMAIL=test@test.com -e PLOTCODER_PASSWORD=test -- npx -y plotcoder-board@latest
   ```

   A server wired from inside a session connects only on the next one, which
   is why the person does this and not the agent (rounds one to eight measured
   the way in; from nine the round measures the app). Take it out again when
   the practice is done with the address:
   `claude mcp remove plotcoder-board -s user`.
2. Wait for the Pages deploy after a merge, so the agent reads the current
   on-ramp.
3. Start the session with no folder (the app's "No folder" scratch workspace
   is right). Inside a repo worktree the harness puts `CLAUDE.md` in the
   agent's context, and the run is not blind.
4. The agent stops after its first calls with the first friction entries and
   waits for you to say "go on". When it has read the wall back, stay: answer
   its questions and direct it the way you would a person, and take the
   directions past the wall — a scene written, the pages read back, the
   script out as Markdown, a question left. It brings you the new entries at
   each step; "log so far" gets the whole log, "stop" gets the
   report.

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
   to read back, the script to take out for someone who does not use a
   screenwriting app. Do what I ask and nothing more. When a direction could mean
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

## The treatment

# Ninety-Nine — feature treatment

**What this treatment answers, up front.**

- Length: a feature, ninety pages.
- The project is "Ninety-Nine"; this board is "Feature". There is no series
  premise: this is a film, not an episode of anything.
- The central question is stated below, verbatim.
- The turns, nine: the repossession letter; Ciara agrees to drive; the van
  dies at Mallow; the fair at Kilmallock; the letter in the glove box; the
  fight on the pier at Fenit; Ciara at the bus station; Joe refuses Noreen's
  price; the chime plays. Everything else is a scene.
- Acts, three: one runs from the yard to Ciara agreeing to drive; two from
  the road out of Cork to Ciara at the bus station; three from Joe alone in
  the van to the end.
- Places are named in each paragraph. The van is a place when a scene
  happens inside it; the road it is on is not. The yard, the kitchen and the
  bedroom are one place: Joe's house.
- When it matters: the film runs over five days in August. Day one is the
  yard through Ciara agreeing. Day two is Mallow. Day three is Kilmallock
  and the glove box. Day four is Fenit and the bus station. Day five is the
  rest.
- Names: Joe Deasy, Ciara Deasy, Noreen Blaney. The mechanic at Mallow and
  the boy at the fair are unnamed; call them by those roles. Maeve, Ciara's
  mother, is in no scene; she belongs in notes, not the cast. The bank is not
  a person.
- Planted: the chime that will not play is planted in the yard and pays off
  in the last scene; Maeve's letter is planted in the glove box and pays off
  on the pier at Fenit; the boy's ten-euro note is planted at the fair and
  pays off at the bus station. Joe's cough is not a plant. It pays off
  nowhere, in this film or any other; if the wall asks about it, the answer
  is that it is not planted, so do not fold it.
- Lengths: the fair at Kilmallock runs four pages; the phone call from the
  bank runs a quarter of a page; the ferry across the Shannon runs half a
  page. Leave the rest unsized.
- Invent nothing: no looks, no voices, no facts beyond these lines. Where a
  scene is here, its place and its people are here; if a scene seems to need
  someone the treatment does not put in it, ask.

**The film asks:** can Joe let the van go without losing the last of what it
carried?

---

Joe Deasy, sixty-one, sells ice cream from a 1994 van in the estates of
Cork's north side, as he has for thirty years. In the yard beside his house
he is under the bonnet when the post comes: a letter from the bank. The van is
to be repossessed in fourteen days unless the arrears are paid. He reads it
twice, folds it into his shirt pocket, and goes back under the bonnet. The
chime on the roof has not played in three years. He tries it. It does not.

In the kitchen that evening Joe rings Ciara, his daughter, thirty-four, a
stenographer in Dublin. He does not mention the bank. He asks whether she
would come down for a few days. She says she will think about it, which they
both know means no.

Ciara comes anyway. In the yard the next morning she finds the letter in his
shirt on the line. She tells him the van is a write-off and the bank can have
it. He tells her a man in Donegal will pay four thousand for it, cash, if it
is driven up to him by Friday. She says he cannot drive four hundred miles in
that. He says no, but she can. She agrees to drive.

On the road out of Cork, inside the van, they do not talk. Ciara drives; Joe
works the till drawer open and shut.

The van dies on the main street of Mallow. The mechanic, a man Joe's age, looks
at it and says the fuel pump is gone and he can have one by tomorrow. Joe
counts what he has. It is not enough for the pump and the fuel to Donegal
both.

In the mechanic's yard that night, inside the van, Joe tells Ciara they will
sell ice cream at the fair in Kilmallock tomorrow and make the difference. She
says she has not scooped since she was eleven. He says it comes back.

At the fair at Kilmallock, the van open, they sell all day. Ciara is bad at it
and then good at it. A boy of about ten pays for a cone with a ten-euro note,
takes his change, and comes back an hour later to say she gave him too much.
She tells him to keep it. He will not. He puts the note on the counter and
runs. By evening they have the money for the pump and the fuel and forty euro
over. It is the first time in the film either of them laughs.

Inside the van, parked on the road out of Kilmallock, Ciara looks in the glove
box for the map and finds a letter in her mother's hand, addressed to her,
dated the year she was fourteen, never posted. She does not open it. She puts
it back.

They cross the Shannon on the ferry at Tarbert. Half a page: the two of them
at the rail, the van behind them, nothing said.

On the pier at Fenit, where the van is parked for the night, Ciara asks Joe
what the letter is. He says he does not know what she means. She takes it out
and shows him. He says Maeve wrote it the week before she left and asked him
to give it to Ciara when she was old enough, and he never decided when that
was. Ciara says he had twenty years to decide. She opens it on the pier and
reads it and does not tell him what it says. She says she is going home in
the morning.

In the van at dawn Joe drives, badly, to Tralee, and Ciara gets out at the
bus station. She stands with her bag. Joe says the van will not make Donegal
without her. She says he should have thought of that. In her coat pocket she
finds the boy's ten-euro note, which she had put there at the fair. She looks
at it. She gets on the bus.

Joe alone in the van, on the road north of Tralee. He pulls in. He coughs for a
long time. He rings the bank from the lay-by: a quarter of a page. He asks for
one more week. They say no.

At the bus station in Tralee, Ciara has not gone. The bus has, and she is
sitting where it was. Joe finds her there when he drives back. Neither of them
says anything about it. She gets in.

Inside the van, on the road through Clare, Ciara tells Joe what the letter
said. It said her mother was leaving and was not coming back, and that it was
not because of Ciara, and that she was to look after her father because he
would not look after himself. Joe says that last part was true.

At Noreen Blaney's yard in Donegal, on the fifth day, Noreen walks round the
van and offers two thousand. The bank will take three. Joe says four was the
price. Noreen says four was the price on Monday for a van that ran. Joe
refuses. Ciara watches him refuse and does not stop him.

In the van outside Noreen's gate, Ciara asks him what he is going to do. He
says he is going to drive it home and let them come and take it, and at least
it will be in the yard when they do. She says that is the stupidest thing she
has ever heard. Then she says she will drive.

In Noreen's yard, the next morning, Joe hands Noreen the keys for three
thousand and a promise that she will not scrap it. Ciara stands beside him.
Noreen starts the van to move it in, and the chime plays: the whole tune,
first time in three years. Nobody knows why. Joe laughs. That is the end.
