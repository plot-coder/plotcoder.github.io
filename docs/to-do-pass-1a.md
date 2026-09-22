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

- [~] **D2 · The pages read against the wall** (entries 68, 71, 72, 73;
  the pass's own question). With every scene written and the ending
  rewritten, the wall still said the chime pays off, the logline stood
  unchecked, and the eighth turn was undone by the ninth on the page
  without a word: "the wall reads beats singly, never one against the next,
  and nothing reads the page against the arrow". This is goal 1's first
  new requirement (`docs/plan.md`), the one the wall's design has not
  anticipated.
  *Plan, as questions and never verdicts (D21's spirit):* a reading of the
  pages beside the reading of the wall — **R74, proposed** — with checks
  the app can make from words: a payoff scene whose page never mentions
  what the fold planted ("'Noreen's yard: the keys' pays off the chime and
  its page does not say chime — does it pay off there, or is the plant
  unpaid now?"); a written scene whose page has none of its change line's
  words; a person's want, from their page, that no scene of theirs says;
  a logline whose words the last scene does not touch. Each a question
  with ids, left with a reason like any other; listed under its own head
  ("the pages, against the wall") in `read_wall` and in Read the wall on
  the app, so a person sees it too.
  *Alternatives:* leave it to the agent (which is what happened — it read
  pages and wall side by side and told the writer, and that is the friction
  the pass was for); a judgement of meaning (not the app's: it counts and
  asks, it does not read for sense).
  *Best?* The word checks: they are the duplicate check's kind of reading,
  honest about being words, and they ask what a writer would want asked.
  A person sees them in Read the wall, so a mockup first and Robert's
  word; the checks themselves are pure and testable.
  *Not built:* waiting on the word. Mockup to draw: the reading's new
  head beside the wall's, on the app's own paper.

- [~] **D3 · A proposed cut** (entry 92). "Nothing on the wall can hold a
  proposed cut: set_rank proposed is for turns only, and set_aside cuts
  for real. A proposal has to live in chat, where the writer cannot see it
  beside the cards." *Plan:* as R71's proposed turn — a card marked
  *proposed aside* by the agent, drawn on the wall as set aside would be
  but held less firmly (dashed), in the film and the count until the
  writer keeps or strikes it; `set_aside` with `proposed: true`, and the
  reading lists proposals under "waiting on the writer" as it does turns.
  *Alternative:* a reminder naming the cards (not beside the cards; the
  wall does not draw it). A person sees it: a mockup on the app's own
  paper first, and Robert's word. *Not built.*

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

- [x] **N20 · The title page: a byline and a contact** (entries 50, 55).
  "A script going to an agency has nothing on its front but a title", and
  the Final Draft page printed today's date unlabelled. *Plan:* the byline
  and the contact live on the project (`author`, `contact`), since every
  board's script goes out under them; `set_title_page` sets or clears them;
  every export prints them — Fountain's Author and Contact keys, Final
  Draft's "Written by" and the contact lines under a labelled "Draft
  date:", Markdown's byline under the title, plain text's centred byline
  and the contact at the left — and the draft date stays the day it goes
  out, as the writer said. *Alternatives:* a draft date the writer sets
  (a date on a project goes stale; the export's day is a fact); the fields
  on the board (a series would carry them per episode). *Best?* On the
  project, three fields, one tool. A person sees the byline only in the
  file for now: the app's own field for it is a mockup for Robert
  (`docs/mockups/` to come); the writer's guide says the agent sets it.
  *Test:* the kernel keeps and clears them and a load repairs the shape;
  each writer prints them; the door sets them and the exports carry them.
  *Built.*
- [x] **N21 · Page turns in plain text** (entry 51). Eleven joins read as
  typesetting faults. *Plan:* a page turn prints as the new page's number
  in the right margin between two blank lines, the way a script prints;
  the first page unnumbered — never a bare blank line, which round
  fourteen (entry 33) found reads as a paragraph break. *Built,* the
  round-fourteen test rewritten to say so.
- [x] **N22 · The exports' words** (entries 49, 52, 53, 56, 57, 58).
  *Built:* each export without a path says the reply is the file itself
  and what to name it; Markdown says a beat's headline is its heading, not
  printed twice; Final Draft says what an unlocked, unrevised title page
  shows and that headlines ride as scene titles; `write_scene` names every
  form the page takes.

- [x] **N23 · A left question that dropped is named** (entry 65). *Built:*
  the tail says which left question the wall asks again and why, with the
  writer's reason beside it, so it can be given again.
- [x] **N24 · A rewrite measures against the last measure** (entries 66,
  74). The tail measured a rewritten scene against the default page and
  said "moved 5/8 down" for a move up. *Built:* a card already written
  measures against its last measure.
- [x] **N25 · The duplicate check and a place prefix** (entries 67, 70).
  Two headlines that lead with the same words before a colon share the
  card's place, not the scene's job. *Built:* compared after the colon. Two
  scenes at one place about "two thousand" still read alike (70); the
  question names what matched, and the writer leaves it.
- [x] **N26 · The pages say where a plant pays off** (entry 68). *Built:*
  the folded card's note says where it pays off and the paying-off card's
  says what it pays off and from where, in Fountain and every export cut
  from it.
- [x] **N27 · A move names the plants that travelled** (entry 69). *Built:*
  "setup arrows untouched (its plant still pays off in 'The pier at
  Fenit', about 2 2/8 pages later)".

- [x] **N28 · A rename follows onto every page** (entries 83, 84).
  `rename_character` renamed the roster and the cards and not a word of any
  page; "everywhere" took a rename and two full rewrites, and nothing said
  the script still said Blaney. *Plan:* the old name, whole, as written
  and in capitals, is rewritten on every scene in the same step — one undo
  for all of it — and the reply names the scenes and where a word of the
  old name still stands alone (a surname), for `edit_scene` with `all`.
  *Alternatives:* leave the pages alone and only warn (the writer's
  "everywhere" is the word; a warning makes them do it by hand); rewrite
  any word of the old name (a surname alone may be another person's).
  *Best?* The whole name follows, the rest is named. *Test:* a written cue
  and an action line follow the rename; one undo takes both back.
  *Built,* with `edit_scene`'s `all` for a line that recurs (entry 83).
- [x] **N29 · Three replies** (entries 78, 79, 81). *Built:* deleting a
  setup arrow says the fold is unpaid now and the way off; a rewrite of a
  card the writer sized says the estimate was for the scene as it was; a
  removed person's reply says their page goes with them and undo brings it
  back.

- [x] **N30 · A reading says what changed since the last one** (entries
  90, 91). "What changed since" had no tool; the write tails' figures were
  wrong six times (N24 fixed the tails). *Plan:* the session already keeps
  the changes since the last reading; the next reading says them at its
  head with how long the wall was then and is now. On the hosted door the
  memory rides `agent_sessions`, so it holds across calls. *Built.*
- [x] **N31 · `measure`: a stretch's length in one call** (entry 94).
  Eight measures added by hand. *Plan:* from one card to another
  inclusive, each card's pages and what kind of number it is, and the
  total against the film's — a fact, never a verdict (D21). *Built.*
- [x] **N32 · An empty want is listed as blank** (entries 88, 89). The
  house reminder says give a clear want; no reading listed a blank one.
  *Built:* "no want on the page" among the blanks, never asked.
- [x] **N33 · The setup lines carry their pages** (entry 86). *Built:*
  "(p. 4 → p. 6)" once both ends are written.
- [x] **N34 · The guide says what "cut" means** (entry 95): set aside
  keeps the card on the wall and out of the film; delete takes it off.
  *Built* in the guide's words.

- [x] **N35 · Before a draft goes out** (entries 98, 99). The revision
  marked one line because it began after five scenes had changed; the
  numbers shifted with a cut because no lock was set; nothing at export
  said either. *Plan:* every export's words say it: lock_numbers keeps the
  numbers for the next file, start_revision marks what changes after,
  and the agent says both to the writer at the first export — the reply
  without a path is the file itself, so the words live in the
  description. *Built.*

- [x] **N36 · A lock numbers the film's cards only** (entry 103). The
  ferry, set aside, was given locked number 18 at the end and would have
  come back there. *Plan:* only cards in the film take a locked number; a
  card brought back gets a letter where it lands, like any added scene.
  *Test:* kernel. *Built.*

- [x] **N37 · The plain text keeps the lock's promise** (entries 108,
  110). *Built:* "SCENE NUMBERS LOCKED <date>" under the title; the
  revision's reply says its count is lines of the text and the page stars
  every printed line a long one wraps to.

- [x] **N38 · The project file says what it holds and what it does not**
  (entries 112, 113). Seven left records in the file, two live on the
  wall; "pictures and takes are not in the file" with no count. *Built:*
  the reply counts left records against the ones holding now (a dropped
  leave waits for its question to read the same again), and counts the
  account's files that are not in the file, or says there are none.

## Decided against, with the reason

- **The file inside a prose reply** (entry 111): the stdio door writes to
  disk with `path`, which N5's words now say is this machine's; the agent
  chose inline on entry 6's doubt.
- **Nobody watching** (entry 114): not the app's; goal 2's pass is the
  person's side.

- **The page turns** (entry 109): N21, built after this run's server
  started.

- **"Put it back as it was" with no tool** (entry 104). Undo is a stack,
  newest first; a targeted undo of one older change is a design of its
  own (goal 3's record of changes is the nearer answer). Left for the plan.
- **A restore starred as new** (entry 106): a revision marks what differs
  from its snapshot, and a restore differs. By design.
- **The dissolved leave named** (entry 105): N23. **The camera mark**
  (entry 107): entry 40.

- **The "!" marks coming off on export** (entry 101): the round trip no
  longer rewrites the stored text (entry 61's fix), so the two agree.
- **No byline on the revision's title page** (entry 102): N20, built after
  this run's server started.
- **A clean edit** (entry 100): nothing to fix.

- **A second payoff on the page** (entry 87): the guide allows a second
  setup arrow; drawing one is the agent's reading of the page, which is
  the writer's to ask for.
- **"The second act runs long" as the app's judgement** (entry 93): D21 —
  the app counts and stays quiet; each act's share of the wall is now a
  fact on the reading (N15), and `measure` gives any stretch.
- **A leave re-asked as a chain grows** (entry 96). A chain of three turns
  is a different question from a chain of two; the reason must be given
  again. Left for a round to ask twice: a leave that holds for a pair
  inside a longer chain.
- **The rewrite's tail** (entry 97): N24.

- **"Cut the boy" and the roster** (entry 82): the agent's inference,
  confirmed. Not the app's.
- **The dropped leave on the mechanic's-yard duplicate** (entry 76): N23
  names it now; the question changed because a card in it was rewritten.
- **Two counts of left questions** (entry 77): entry 62's fix.
- **The runtime tail on a rewrite** (entry 80): N24.

- **Move it, when a card is already there** (entry 64). The rule (one
  place, one stretch of time, one card) and the direction met; the agent
  asked, which is the rule. Not the app's.
- **"Scraps it" as a line or a thing seen** (entry 75). The agent's
  reading of a treatment that shows no machinery. Not the app's.

- **The run's own permission gate** (entries 48, 54, 59): the session's,
  not the app's.

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

**Decided against, above:** 14, 15, 19, 24, 25, 26, 37, 38, 40, 43, 44, 48, 54, 59.

**Here as an item, the exports:** 50, 55 → N20 · 51 → N21 · 49, 52, 53, 56, 57, 58 → N22.

**Here as an item, the import and the edits:** 60 → the import names its cards · 61 → a forced-action mark is no change · 62 → the records count what the reading counts · 65 → N23 · 66, 74 → N24 · 67, 70 → N25 · 68 → N26 · 69 → N27 · 68, 71, 72, 73 → D2 (R74, proposed).

**Decided against, the edits:** 63 (the gate), 64, 75, 76, 77, 80, 82.

**Here as an item, the cut and the rename:** 78, 79, 81 → N29 · 83, 84 → N28.

**Here as an item, the reading of the whole and the cuts:** 85 → D2 · 86 → N33 · 88, 89 → N32 · 90, 91 → N30 · 92 → D3 · 94 → N31 · 95 → N34.

**Decided against, the reading of the whole:** 87, 93, 96, 97.

**The revision and the export:** 98, 99 → N35 · 100, 101, 102 decided against, above.

**The lock and the restore:** 103 → N36 · 104, 105, 106, 107 decided against, above.

**The script as it prints:** 108, 110 → N37 · 109 → N21.

**The copy and the presence:** 112, 113 → N38 · 111, 114 decided against, above.

**Not the app's:** 39, 41 (nothing new).
