# The blind-run prompt — the account door, with the writer in the room

Paste everything below the line into a fresh agent session. The credentials are
already filled in: the test account is `test@test.com`, password `test`. It is a
throwaway and holds nothing of anyone's; the agent empties it itself at the
start of the round.

Before you paste:

1. Start the session in an empty folder, not in the repo, so the agent has to
   find its own way in. Round four was started inside a worktree of the repo,
   and the harness put `CLAUDE.md` in the agent's context before it read a
   word: the run was not blind.
2. Nothing to clear by hand: the prompt has the agent save a copy of what it
   finds on the account and empty it, signed in as the test writer, with the
   tools every writer's agent has. No key of yours is involved.
3. Sign in as the test account at plotcoder.com in your own browser if you want
   to watch the wall move. An empty account adopts whatever project that
   browser holds, so the agent will see one project already there; the prompt
   has it start its own regardless.
4. When it has read the wall back, direct it the way you would a person. It
   brings you the new friction entries at each step without being asked; "log
   so far" gets the whole log, "stop" gets the report.

---

You are working as a screenwriter's agent on PlotCoder, a storyline wall that
lives at plotcoder.com. I am the writer. You operate the app; I direct. I am
here for the whole session and will answer anything you ask.

## The round

Now read this, and whatever it tells you to read, and nothing else:

    https://plotcoder.com/llms.txt

## Your way in

You are working **my account**, not a wall on your own machine. There is no dev
server running and there will not be one. Nothing you build lives in a folder.

The server you need is in the repo, so clone it; you need it only to run the
server:

    git clone https://github.com/plot-coder/plotcoder.github.io
    cd plotcoder.github.io
    npm ci

Wire the server the way the on-ramp tells you, with these two in its
environment:

    PLOTCODER_EMAIL=test@test.com
    PLOTCODER_PASSWORD=test

Do not run `npm run dev`. Do not open the app in a browser. Work the account.

Before you build anything, start a project of your own with `new_project`, so
nothing you do touches my other work.

## This account is a throwaway

Nothing on it is anyone's work. Once you are in and have made the first calls, before you build: save a copy
of whatever you find there with `export_project` into a folder of your own,
then `empty_account`. This is housekeeping, not part of the run: do not log
it. If the account is already empty, say so and carry on.

## What I want you to do

1. Make the calls the on-ramp tells you to make first, before you change
   anything.
2. Read the treatment at the end of this message.
3. Build it as a wall: the scenes as cards, the major turns marked, the cast,
   the places, the arrows, the acts if the treatment has them, the episode's
   central question, and the series premise above it.
4. Read the wall back to me: what is there, and what it asks.
5. **Then wait for me.** I will answer your questions and give you directions,
   one at a time. Do what I ask and nothing more. When a direction could mean
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
- Do not write scene text, paginate, export or print unless I ask for it.

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
3. **Could you have got here without cloning the repo?** Say plainly what you
   had to work out that the on-ramp did not tell you.
4. **What I asked for that you never found a way to do**, or did some other way
   than the one you first reached for.
5. **What you were never sure had landed.** Anything you did that you could not
   confirm from a reply.

Be blunt. A polite log is a useless log. I am going to act on this, and
anything you smooth over is something I will not fix.

---

## The treatment

# Low Season — pilot treatment

**Series premise.** A seaside town earns its living in three months and keeps its
secrets in the other nine. The people who stay behind are the ones with reasons.

**The pilot asks:** what was her father being paid for?

---

Nessa Boyd comes back to Ardnacrusha Bay after fourteen years, to bury her father
and sell the caravan park he ran into the ground. She is thirty-eight and has
nothing waiting for her anywhere else, which she does not say out loud.

She arrives in the last week of September, on the day the site closes for winter.
Dessie Kane, who has managed the place since before she was born, walks her round
the emptying rows. He is in his sixties and his knee has been bad for a decade;
he will not be walked away from. He tells her the sale is a fine idea and that
her father would have hated it.

At the office she finds the ledger. Her father kept the site's books by hand, and
in the back of the book, every month for eleven years, the same entry: cash in,
no name against it, always on the fourth. She asks Dessie about it. He says her
father did his own books and changes the subject to the drains.

That night she walks the closed rows and finds a light on in caravan 42. A man is
living in it. He is perhaps fifty, he has been there long enough to have a kettle
and a routine, and he will not give her a name. He says he pays. She says nobody
pays in September. He closes the door.

Her sister Fiona still lives in the town and runs the launderette. They have not
spoken properly since their mother's funeral. Fiona will not come to the site and
will not say why; she tells Nessa to sell it and go, and that some things were
better the way they were.

Nessa asks Mrs. Lynch at the chip shop about the man in 42. Mrs. Lynch knows
everyone in Ardnacrusha and says she has never seen him, which is the first lie
Nessa is sure of.

A young guard comes out to the site about the licence for the sale, and Nessa
nearly tells him about the man, and does not. She cannot say why she does not.

She goes through her father's things. On his key ring there is a key that fits
nothing on the site — not the office, not the gate, not the shed, not any
caravan. She keeps it. Nobody ever tells her what it opens.

She closes the site with Dessie: the shutters, the standpipes drained, the flags
down, the whole park put to sleep for the winter. It takes a day and they barely
speak.

On the fourth of October the cash arrives. An envelope, through the office door,
no name. She stands with it in her hand and does not open it for a long time.

She takes it to caravan 42 and puts it on the step and knocks and stands back.
The man opens the door, looks at the envelope, and does not pick it up. He says:
"That was never for me."

She goes back to the ledger. Eleven years of entries on the fourth, and against
the very first one, in her father's hand, two initials she recognises — and they
are not the man's, and they are not Dessie's.

She drives to the launderette. Fiona is closing up. Nessa puts the ledger on the
counter, open at the first entry, and Fiona looks at it and does not look
surprised, and says: "You were better off not knowing."

Nessa takes the sale sign off the gate.
