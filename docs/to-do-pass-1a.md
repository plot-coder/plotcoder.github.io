# To do — everything material from pass 1a

Written 2026-09-22 while the pass ran (`blind-runs/prompt.md`, "Ninety-Nine"
through the stdio package at 0.1.51 on the test account; the report will be
`blind-runs/pass-1a-report.md`). Every entry is accounted for at the foot of
this file as it comes in: here as an item, a matter of procedure, left on
purpose, or decided against, with the reason. Fixed on the branch
`claude/pass-1a` as the run went, on Robert's "I would like to fix all of the
friction it mentioned".

**The pattern for every item, in this order, and no skipping**: **plan**;
**ask whether it is the best we can do**, in writing; **build**, through
the kernel; **test**, and look at it in the app when a person can see it.

Status marks: `[ ]` open · `[~]` planned and asked · `[x]` built and tested.

**The way in, as it happened.** The session went in through the user-scope
stdio block in `~/.claude.json` (`npx -y plotcoder-board@latest`, signed in
as the test account), which this Mac still had, not the desktop connector
`plot-coder` beside it: same package, same account; the door's session
memory and undo trail are not what it measured. Recorded here so the report
reads right; the block comes out before pass 1b.

## D. Decisions — a rule of the wall, or a hand at a screen

- [x] **D1 · The desktop app cuts a server's instructions at 2048
  characters** (entry 1; round twenty-four's D4). "The connector's own
  instructions arrive cut off mid-sentence: '…which is a name until th…
  [truncated]'." The cut falls at exactly 2048 characters of a 3072-character
  text, and the same cut shows in the driving session's own context. So D4's
  answer: the handshake's instructions do reach a desktop-app agent, cut at
  2048. *Plan:* the text stays under 2000, essentials first — the first
  calls, the workflow before asking, the homes for "I don't know", the rules
  in fewer words, the two guides. *Alternatives:* leave the long text and
  let the on-ramp repeat it (the agent then reads 6 KB to learn what 2 KB
  could say; and the cut lands mid-rule); split into two servers (no).
  *Best?* Under the cut, and a test that keeps it there.
  *Test:* `agents.test.ts` — under 2000, naming every first call and the
  tools an "I don't know" lands in.
  *Built:* 1923 characters.

## N. Now — fixes a session can make, each with a test

- [x] **N1 · A call that fails before it answers says so in words** (entry
  8). `list_projects` once answered a bare "TypeError: fetch failed". *Plan:*
  the tool lane catches any error a handler throws and answers with what
  failed, what a network failure means (the account not answering for a
  moment: call again) and what to do; anything written before the failure
  stands, and `list_board` shows it. *Test:* `failedCallReply` for a network
  error and another.
  *Built.*
- [x] **N2 · The emptying names the files it takes** (entry 7). "deleted 1
  file(s)" for a file the agent never listed. *Plan:* `describePlan` names
  each file; `empty_account`'s description says the reply names them and
  `list_files` shows them first. *Built.*
- [x] **N3 · `new_project` with a kind and a number** (entry 4). "A feature,
  ninety pages": both passed, the word dropped in silence. The kernel keeps
  one or the other (round twenty-two, entry 91: a number clears the word).
  *Plan:* keep the kernel's rule and say it in the reply: the number is the
  target, the word is not kept, pass kind alone to keep it. *Alternative:*
  hold both in the kernel — a word for the shape and a number for the count;
  the reading's target line would then say two things. Not until a wall
  needs the word beside a number. *Built.*
- [x] **N4 · A named board on a film** (entry 5). *Plan:* the reply says the
  board is named by the writer's word and a one-board film goes out under
  the project's name either way. *Built.*
- [x] **N5 · `export_project`'s disk** (entry 6). *Plan:* the description
  says a path writes on the machine the server runs on — a stdio server's is
  the session's own. *Built.*
- [x] **N6 · The on-ramp's first-calls words** (entries 2, 3, 9, 10). "The
  guide wins" without saying day-one cannot differ from it (2); "before your
  first call if you can" (3); "read the wall once it holds cards" (9); the
  writer's order against the on-ramp's (10). *Plan:* day-one is cut from the
  guide word for word, so the two cannot differ, and either wins over the
  page; the first calls change nothing, so making them while the guide
  downloads costs nothing; after `new_project` make the three reads at once,
  an empty board's reading counts; when the writer's brief orders the first
  calls another way, the writer's word wins, at the cost of a tail that
  counts until the next reading. *Built* in `agents.js`; `llms.txt`
  regenerated.
- [x] **N7 · The premise's words** (entries 11, 12). The workflow's premise
  question did not say a film may leave it blank (11); "five days in August"
  had no home the agent could see (12). The premise already holds what is
  true of the whole film (2026-09-20). *Plan:* the workflow hint and
  `set_premise` say when the whole film is set is the premise's, and that a
  film with nothing true before it starts leaves the premise blank and the
  reading does not ask. *Built.*
- [x] **N8 · `set_logline` keeps the line as given** (entry 13). *Built:*
  "kept as given, capitals and all".

- [x] **N9 · `create_cards`: a treatment's scenes in one call** (entry 18).
  Eighteen cards were eighteen round trips, each wired `after` the last.
  *Plan:* one tool, `create_cards`, taking a list of everything
  `create_note` takes and wiring each after the one before (the first after
  `after`); one reply names every card's id and what it landed as, then the
  last card's reply for the wall's state; a refused card is named and the
  rest still land; one undo per card. *Alternatives:* leave it (a build is
  a build); let `create_note` take an array (two shapes in one tool).
  *Best?* A tool of its own, sharing `create_note`'s schema and handler so
  the two cannot drift; it is also goal 3's first tool, since a big project
  is built in batches. *Test:* three cards after a fourth, the arrows in
  order, a cast name added to the roster.
  *Built:* `createNoteCall` shared; `create_cards`; the guide's line.
- [x] **N10 · The sag waits for half the cards** (entry 21). One sized
  card among fifteen made the median the default page and a run a question.
  *Plan:* the sag is read once half the cards in the runs are sized or
  written, and until then the clean line says "not read yet: N of M cards
  in the runs read as a page each". *Alternative:* keep one card as the
  claim (round fourteen's rule) and say the median is the default — still
  a question about card counts. *Test:* four unsized and one sized: no sag,
  `sagWaiting` says 4 of 5; three sized: read.
  *Built:* `sagWaiting` on the reading; the clean line.
- [x] **N11 · A left question keeps its word when only its figures move**
  (entry 36). The writer's leave on the sag came undone when a written
  scene moved the median: "your reason had not changed, a number had", and
  the tail then quoted the sag as "changed shape" on four later writes.
  *Plan:* a left question is the same question while its ids and its words
  are the same with the figures blanked; the run's end changing, or a card's
  headline, re-asks it; and the tail's "changed shape" compares the words
  without figures too. *Alternative:* R53 as it was (a page moves, the
  question is asked again) — right for a question the numbers make, wrong
  for a writer who said "that run is the story". *Best?* The words are the
  question; a measure is a measure. Robert's to overrule: it changes what a
  left question means. *Test:* a longer scene in a left run holds the
  word; a new end re-asks it (kernel and door).
  *Built:* `withoutFigures` in the reading and the tail; R53's tests
  rewritten to say so.
- [x] **N12 · The duplicate question names what matched** (entry 20).
  *Built:* "their headlines share \"bus station tralee ciara\", and the
  cast's names are not counted".
- [x] **N13 · The uncast question and the roster** (entries 16, 17).
  `add_character` before `cast` raised five "[uncast]" questions the cards
  then answered; a maybe made one go quiet as if decided. *Plan:*
  `add_character`'s reply says a name given to `create_note` or `cast` is
  added by itself, so the tool is for a person before their card, and the
  guide says the same; a maybe for a person on no certain card says the
  wall stops asking where they come in and lists them under open, and that
  the question comes back if the maybe is struck. *Built.*
- [x] **N14 · `create_group` says how it read the title** (entry 22).
  *Built:* "read as an act, so its length is not questioned" or "read as
  a sequence, asked about if it runs long".
- [x] **N15 · The reading's numbers say what they are made of** (entries
  27, 28, 29, 46). *Built:* the blank line says unsized is ordinary while
  the wall is built; each act's share of the wall; "N of M cards unsized,
  read as a page each" beside under or over; a card the writer sized and
  then wrote is said as such, its figure kept underneath.
- [x] **N16 · `leave_question`'s reply and description** (entries 30, 31).
  *Built:* a question left in this change is counted, not quoted again
  under gone; the description says whose ids a question wants.
- [x] **N17 · The cue check** (entries 32, 34, 35). The guide's example
  cues JOE and CIARA; the reply said cues match by the whole name. *Plan:*
  a cue that is one word of one name is that person; two by that word ask
  for the word that tells them apart; a cue for someone the card holds as a
  maybe says the page has given them a line and the card has not decided
  them. *Built.*
- [x] **N18 · `write_scene`'s fixed paragraph** (entry 33). *Built:* the
  explanations are said once a session; the numbers every time.
- [x] **N19 · How long it is, once the script is whole** (entries 42, 45,
  47). Two tools gave two numbers and said to tell the smaller; the
  "guess about a guess" line printed for a finished draft; no short read for
  length. *Plan:* once every scene is written, `page_count` leads with the
  paginated count as the script's length and gives the cards' measure as
  the production's eighths beside it; the runtime block drops the sketch
  guess and says the script as it prints is `page_count`'s; `read_wall`
  takes `only: "length"`. *Built.*

## Decided against, with the reason

- **The [empty] question mid-build** (entry 19). The reading reads what is
  there; after the first reading the tail quotes what changed, by design
  (round twenty-three, N1). The writer's answer — "that is the pace" — is a
  leave with a reason, which is what happened.
- **A decided fact about the film's time** (entry 23) is N7: the premise.
- **"Not a plant" as a thing to hold** (entry 24). The wall asks about a
  fold or a thread; a thing the writer says is not one needs no home but
  the notes, where the agent put it.
- **The headline picking one of two phrasings** (entry 25) and the batches
  of friction (entry 43): not the app's.
- **A film with no premise** (entry 26) resolved entry 11: N7's words.
- **The writer's figures replaced by measures** (entry 37): R23 b — the
  measure is the length while the text stands, the estimate kept beneath
  and now said (N15).
- **"Sketch" on a finished draft** (entry 38). A written scene under the
  page it was read as is a sketch; sixteen of eighteen scenes written from
  one paragraph each are sketches. The label is right; the reading now says
  it is a fact about the draft, not a length (N19).
- **The camera mark on "Nobody knows why."** (entry 40). The check marks
  and never asks; the writer's sentence stands as given.
- **Where the extra page and a quarter falls** (entry 44). `page_count`
  gives the page each scene starts on; the paginated count is now the
  length once the script is whole (N19), and the difference is named.

- **A length for a moment inside a scene** (entry 14: the quarter-page
  call inside the lay-by). Decided against twice already (thirteen 9,
  fourteen 14, `blind-runs/README.md`): a card is the unit; the writer's
  answer made the lay-by scene the quarter page.
- **"go on" from another session** (entry 15). Procedure: the driving
  session relays the writer, as every round since fifteen.

## Every entry, accounted for

**Here as an item:** 1 → D1 · 8 → N1 · 7 → N2 · 4 → N3 · 5 → N4 · 6 → N5 ·
2, 3, 9, 10 → N6 · 11, 12, 23 → N7 · 13 → N8 · 18 → N9 · 21 → N10 · 36 →
N11 · 20 → N12 · 16, 17 → N13 · 22 → N14 · 27, 28, 29, 46 → N15 · 30, 31 →
N16 · 32, 34, 35 → N17 · 33 → N18 · 42, 45, 47 → N19.

**Decided against, above:** 14, 15, 19, 24, 25, 26, 37, 38, 40, 43, 44.

**Not the app's:** 39, 41 (nothing new).
