# PlotCoder board

This is the whole guide; the on-ramp at plotcoder.com/llms.txt is its first
page, and where the two differ, this wins. **The day's part of it, cut from
this file word for word, is plotcoder.com/day-one.md** — about two thirds the
size, and all a day's work needs. The same rules, shorter still, arrive with
the tools themselves, in the server's instructions at the handshake.

**Holding the tools already — a connector, or a server someone wired? Read
this much on day one, and leave the rest until the writer asks for it.**

- **Read now:** this page down to the end of **Cast** — the method, the
  first calls, **Reading**, **Cards** (open things, threads, two versions,
  set aside) and **Cast** — then **What the tools will refuse**, **The
  reply's tail**, and **Do not have opinions about beat count**. That is
  the day's work: build a wall from a writer's notes, read it back, take
  their directions.
- **Before you ask the writer anything:** `list_workflows`. Its first
  workflow, "break a treatment", carries **what a treatment should
  answer** — the questions to put to the writer, and the tool each answer
  lands in. It is the asking's checklist: ask these, and then anything the
  writer's notes raise that these do not. Invent no fact; a question is not
  an invention.
- **Leave until the writer says the words:** **Pages** (they say "write
  it", "how long", "export"); **The project** beyond one board (a series,
  an episode, a second board); **Structure** (they name a structure to
  compare with); **The production half** (locked numbers, a revision);
  **Workflows** as a section (the tool lists them).
- **Not for you at all:** wiring — **The account, the app, or the file**,
  **The account door**, and the wiring paragraph under those heads — is for
  whoever connects a server. If the tools are in front of you, you are
  connected.

PlotCoder serves one method, and its tools follow it:

1. State the **logline**: the central question, what the story is arguing.
2. Mark the **beats**: the 8 to 15 major turns.
3. Fill the space between them with **scene cards**. One card is one scene.
4. **Read the wall**: the run that sags, the setup with no payoff, the person
   who disappears.
5. Only then **write pages**.

PlotCoder is a storylining wall of cards (post-its). Each card is one **scene**:
a `headline` plus the `change` it causes. Cards also have a `color`, a position
(`x`,`y`), a rotation, a `rank`, and a `length`.

The board holds five kinds of thing:

- **cards** — one scene each.
- **rank** — a card is a `scene` or a `beat`. A beat is one of the 8–15 major
  turns the story hangs on. Rank is carried by the card, never by where it sits.
- **length** — how many pages a card runs. An unsized card is taken to be about
  one page. Like rank, it belongs to the card and never moves it.
- **plants** — the corner is folded: this scene sets something up that must
  pay off later. A setup arrow leaving the card is the payoff; a fold can
  pay off more than once — the key is given, then used — and each setup
  arrow leaving it is one payoff, listed in the reading with its distance.
- **groups** — a named frame around two or more cards: a sequence, a set piece.
- **arrows** — directed links between cards, each with a `kind`: `follows` (what
  comes after what, the default) or `setup` (the tail plants what the head pays
  off).
- **cast** — the roster: every person in the story, one record each with an id.
  A card says who is in the scene by pointing at people in the roster.

Above them all sits the **logline**: the central question, what the story is
arguing. And above the board sits the **project**: an ordered set of boards (a
season's episodes, or a writer's stories) under one name and one premise.

## Use the MCP tools, not the mouse

Drive the board through its tools. **Do not** open a browser and fake
pointer drags — the tools and the human UI share one command kernel, so a
tool call lands on the exact same board a person sees. (Wiring a server, the
shell caller and the hosted door are under **The account, the app, or the
file**, at the end; with the tools in front of you, skip them.)

**Call these first, as the on-ramp says:** `list_words` (the room's words),
`list_workflows` (what a writer can ask for — and, in its first workflow, what
a treatment should answer: the questions to ask the writer before building),
`list_projects` (which wall is in hand; on an account, `new_project` or
`open_project` comes next when it is not the writer's) — those three before
anything else — then the three reads of the wall you are to work:
`read_wall` (what is here and what it asks — a fresh folder holds a sample
wall, Maya and Tom and the letter, and says so; it is not the writer's),
`list_reminders` (the writer's principles), `list_board` (the records and
their ids) — and only then change anything.

### Reading

Three reads, three things: `list_boards` is the **project** (its boards);
`list_board` is **one board's records**, in story order, with the wall's rows
under them; `read_wall` is the **reading** of that board — what it asks. Every
reading, numbering and page uses **story order**: the rows top to bottom and
left to right, with each `follows` arrow pulling its source in front of its
target — the order `organize` lays the wall out in. A card wired between two
others reads there before any tidy. `list_board`'s rows are the nearest thing
to a look at the wall; with no app running, `export_fountain` is the wall in
order as text. Every reply's first line names the project it read and how
many the account holds; the app's own lists, `list_words` and
`list_workflows`, read no project and say so instead. Replies are prose; the same reading as JSON follows
only when the server is started with `PLOTCODER_JSON=1`.

- `list_board` — the logline, the beat/scene counts, the runtime estimate against
  the target, then every **card**, **group**, and **arrow** with its **id**. Ids
  come from here and from the reply of the tool that made the thing.
- `read_project` — every board's reading in one call: each board's
  questions and what it leaves open by the writer's word, its loose
  threads, the folds that pay off on another board, and the project's
  length — the same checks `read_wall` runs, board by board, so it never
  says what `read_wall` would not. For a series, read this first;
  `read_wall` for one board in full.
- `read_wall` — step 4 of the method. The beats in wall order, the pages of
  scenes between consecutive beats, and the **questions the wall raises**: a run
  out of proportion with the others, a card with no change line, a card no arrow
  touches, two headlines that read like the same scene, a group too long to be
  one sequence, a person in the cast who is on no card, a person gone for more
  than a third of the story (and ten pages at least, so a short wall's gaps are
  not disappearances), a payoff that comes before its setup on the wall,
  a folded card no setup arrow pays off, a setup arrow leaving a card that
  is not folded, a card with nobody in it once the wall has a cast, beats
  back to back with nothing
  between them (a chain of them is one question naming every turn), cards
  that say no place once any card has one, and a thread with a loose end —
  where is it first seen, or where does it come out. It also lists every
  setup with the distance to its payoff, and every thread with its cards. The tool's own description carries the same list,
  and a reply names each question's kind. Put the questions to the writer. Do
  not act on them unasked, and do not add an opinion about the number of beats.
  `read_wall` with `only: "questions"` is the short read — the three counts,
  what the wall asks, what the writer has left — for "do I owe the writer
  anything?" after a write. **"What is still open?" is answered here, in one call.** The reading opens
  with three counts — questions asked, things left open by the writer's word,
  scenes unwritten — so a quiet wall is never taken for a finished one. Its
  open section lists the project's open fields, one grouped line where the
  same words sit on three or more cards, then each card once with everything
  open on it. Under a separate head, "blank on the wall", it lists what has
  no value and no words of the writer's beside it — no place, no when, no
  length, nobody in it. Blank is a fact about the wall, not about the writer:
  never tell the writer they left something open that they only have not said,
  and never tell them they have not said something they told you. A place, a
  when, a change line, a named person and who is in a scene each have an open
  of their own. **What is undecided about the film itself** — when it happens,
  whether it has acts, what runs long or short, whether there are other
  plants, a place that may or may not be in it — is true of no one card:
  `add_open_line` holds it as the writer's own sentence, under the logline on
  the wall and first under open in the reading, never asked;
  `strike_open_line` takes it off when they decide. One sentence a call, only
  what the writer said they do not know, never a sentence of yours. A card's
  length stays unsized — that already claims nothing — so
  a writer's "I don't know" about those lives with you until they decide, and
  a question the wall asks about one of them is `leave_question`'s, with their
  reason.
- `leave_question` / `ask_again` — the writer's word on a question: "leave
  it". Pass the kind as `read_wall` names it, and the ids when that kind is
  asked more than once. A leave is the open board's: to leave a question on
  another board, `open_board` there first. The wall stops asking and lists it under "left, for
  now"; it asks again on its own the moment the question would read
  differently (a card in it changes, a page moves), and `ask_again` brings it
  back now. Only on the writer's word, never unasked; a left question is not
  a dismissed one. **Edits first, then read, then leave:** a leave answers the
  reading in front of you, and an edit changes the questions — so make the
  writer's changes, `read_wall` again, then leave what they still want left.
  A leave the edits have overtaken is refused, with the question as it was
  and what the wall asks now. Give `why` — the writer's reason, in their
  words — so the next reader sees it on the wall; leave several at once with
  `questions`, one step. The reply says what the wall still asks, so no read
  after is needed. Every write's reply says when the wall's questions changed
  because of it, and the runtime when that moved. **"Leave it open" on a
  question the wall asks is not a leave:** when the writer says a thing the
  wall asks about is not decided — where a scene happens, when, who is in
  it — the field's own `open` is the answer (`set_location`, `set_when`,
  `set_open`): the question goes, the words are listed, and the card's
  other questions stand. `leave_question` is for a question that is to
  stand as it is, with the writer's reason.

### Cards

- `create_cards` — several cards in one call, wired in the order given, each
  after the one before (the first after `after`); everything `create_note`
  takes, on each. A treatment's scenes in one round trip; one reply names
  every card's id, then the last card's reply for the wall's state.
- `create_note` — add a card. Requires `headline` **and** `change` — unless
  the writer has not decided what changes: then pass **`changeOpen`** with
  their words ("I don't know yet") in place of `change`. The change line
  waits, the reading lists it as open and does not ask for it, and the card
  is otherwise an ordinary card: still asked about its place, its cast, its
  arrows and its fold. That is the usual answer to "I don't know what
  changes". `open` is a different and larger thing — the whole card is
  undecided ("whether this scene exists") — and it silences every question
  about the card, the change line among them; do not reach for it because a
  change line is missing, or a wall of honest "I don't know"s asks nothing
  (the schema can only mark the headline required; this is the rule).
  `update_note` takes `changeOpen` too; a change line decides it. Optional `color` (yellow, pink, blue, green, orange), `rank`,
  `pages`, `plants` and `plantsWhat`, `location` or `locationOpen`, `when`
  or `whenOpen`, `open`, `characters` (names; a name not in the cast is
  added to it), and `x`/`y`. The reply names the card's id and what landed. Make cards
  one call at a time, in story order, or wire each with `after`: an unwired
  card's place in the order is its position on the wall, and calls run in
  parallel land in whatever order they arrive. **A scene is one
  place and one stretch of time**: a new place or a new time is a new card,
  which is how a treatment's paragraph splits. A **beat is a whole card** — the
  scene where the turn happens — not a moment inside one; when a treatment's
  "midpoint" spans two scenes, mark the card where the turn lands.
- `update_note` — change a card's `headline`, `change`, `location` and/or
  `when` by `id`; the reply says which field changed, from what to what.
  **A decided fact about one scene** — "the cut is announced in this scene" —
  has three homes and no fourth: the change line when it *is* what changes;
  a `[[note]]` in the scene's text when it is not, which neither prints nor
  counts; the premise when it is true of the whole film. A card has two lines
  on purpose: do not park a fact in the change line beside the change.
- `move_note` — set a card's absolute `x`,`y` (top-left, pixels).
- `recolor_note` — change a card's paper `color` by `id`.
- `set_rank` — mark cards `beat` or `scene`. Takes a list of ids.
  **"Propose the turns and I will strike":** `set_rank` with `rank:
  "proposed"` puts your candidates on the wall — a dashed bar and "proposed
  turn" on each card, a list in the reading, and in the wall's questions
  sheet with keep and strike — so the proposal is where the writer can see it
  and not only in the chat. A proposed card is still a scene in the count,
  the runs and every question. Name your candidates to the writer by
  **headline, never by number**; on their word, keep is `rank: "beat"` and
  strike is `rank: "scene"`. Never mark a beat on your own word, and never
  propose a number of turns. **A beat marked on a wholly open card is an
  ordinary beat:** it ends and starts runs like any other and the story
  around it is still asked about — two turns back to back, a run out of
  proportion — while the card itself, being open, is asked nothing.
- `set_length` — how long cards run, in `pages`. Takes a list of ids. Fractions
  are fine (`0.5`); they are stored in eighths of a page. A card nobody has
  sized is **unsized** — `list_board` says so — and reads as about a page; a
  card sized at one page is a claim the writer made. `pages: "unsized"` (or
  `0`) takes a length away, so "leave it unsized" never means deleting and
  remaking the card.
- `set_plant` — fold or unfold the corner of cards: `ids` and `plants`
  true/false (the card tools that take several cards take `ids`; the group and
  cast tools take `noteIds`, because a group has an `id` of its own). Fold a
  card when the writer says it sets something up, and say **what** in the
  writer's words — `what: "the letter"` — which folds the card and
  puts the words on its edge ("Plants · the letter"); `create_note`
  takes `plantsWhat`. `read_wall` then asks where the letter comes back,
  and the setup line names them; `what: ""` keeps the fold and drops the
  words. **The fold's words are a short label** — "the jar of coins" — and
  are repeated wherever the fold is named. *How* a plant is first seen, and
  *how* it pays off, are what happens in those two scenes, so they are those
  cards' change lines, or their text: "he counts the fare out of a jar" is
  the first morning's, "he empties it into her hand" is the last run's.
  Never a sentence in the label, and never in a headline. (What tells two
  versions of one scene apart is not "how": "The pub, alone" and "The pub,
  with Callum" are headlines, and when the writer does not yet know what
  changes in either, the headline is the only place that difference can go.)
  **When the change
  line is the writer's own words**, do not append to it: ask whether the line
  should say it, and meanwhile put it on the card as a note in the scene's
  text — `[[she gives the fork to Callum]]` with `write_scene`. A note neither
  prints nor counts, and a scene whose text is only notes is still unwritten
  and unmeasured, so this is not writing the scene; the writer sees the note
  in Pages. A card has one
  fold: a second thing the same scene plants is a thread. A payoff the writer knows without a scene for it — "he gives her
  his tools", which scene undecided — is a card born open at the payoff end
  with the setup arrow landed on it, not an unpaid fold. `read_wall` will
  ask where a fold pays off until a `setup` arrow leaves it — or until `later` names another
  board of the project where it pays off (a series plant: `later: "Episode
  two"`, by name, id or number from `list_boards`; `later: ""` forgets it).
  The card then says "pays off in Episode two", and the reading lists it. A
  board alone is a promise: once that board holds cards, its reading and
  this one ask which scene pays it off until one claims it. Name the scene
  with `at` (its id or headline on that board) — `later: "Episode two", at:
  "The ledger is gone"` — or from the other board with `set_payoff`. Then
  the fold's card says "paid off in Ep 2, sc 2", the paying-off card says
  "Pays off · Ep 1, sc 4" with its corner folded in, `read_wall` lists the
  payoff on both boards, and `list_board` names it on both cards. `at: ""`
  keeps the board and forgets the scene. One claim, one record, on the
  fold's card; the receiving board composes its side from the project.
- `set_payoff` — the same claim from the receiving board: `id` (the card
  here), `from` (the fold's board), `fold` (the folded card there, by id or
  headline); `fold: ""` takes back every claim that board makes on this
  card. The other board is opened for the write and this one reopened
  after, and undo on that board takes the claim back.
- `set_location` — where one or more cards happen, as the writer would say it
  ("the piano shop", not "INT. PIANO SHOP"). `create_note` and `update_note`
  take `location` too; `list_board` shows it as `at: …`. No roster of places:
  the same phrase on several cards is one place in the Cast panel, and the
  app relates no two phrases. A scene that moves through spots of one
  location — the kitchen, the yard, the barn of one farm — is one place:
  name the location. A treatment that names a spot per paragraph is naming
  where the camera is, which may still be one place.
  Not decided: `open` with the writer's words — "where it happens" — leaves
  the place open; the reading lists it and stops asking where, while the
  card's other questions stand (unlike `set_open` on the whole card); a
  place decides it, `open: ""` leaves it blank; `create_note` takes
  `locationOpen`.
- `set_alternative` / `choose_version` — **two versions of one scene**:
  **which card is in front decides nothing** — it is only the one drawn on
  top, and the one counted until the writer chooses. Put the way the writer
  named first in front, say so, and do not ask them to pick: "keep both"
  is not a choice to be half-made. A version is one card: when one way of a
  scene is two scenes, the version is the first of them, and the second is
  a card set aside (`set_aside`), brought back if that way is chosen.
  Set a card behind another as its other version, by id or headline, and it
  leaves the story — out of the order, the count, the pages and every
  export, its follows arrows dropped — and waits there; the wall draws it
  tucked behind its sibling and `read_wall` lists the pair under "two
  versions, not chosen", asking nothing of it. `choose_version` decides: the
  chosen card is the scene, in the front card's place with its arrows, rank,
  group and threads, and the front card's fold when it has none of its own —
  so a thing true of the scene "either way of it" (a plant, a thread) is
  said once, on the front card, and whichever version is chosen carries it; the other goes, or with `keep` is **set aside** beside it — on
  the wall where the writer can see it, and not in the film. "Keep the
  other, I may come back to it" is `keep`. `of: ""` takes a card out from
  behind. Only on the writer's word:
  two versions the notes hold, never two the agent could not choose between.
- **A card born as a version, or born set aside:** `create_note` with `of`
  (the front card's id or headline) makes the new card the other version of
  that scene in one call — no loose card for the wall to ask about in
  between — and with `aside: true` makes a scene the writer has cut and wants
  kept, placed under the story's rows. Neither takes `after` or `before`: it
  is not in the order.
- A writer's **"cut it"** means `set_aside` unless they say delete: set aside
  keeps the card on the wall, out of the film, the count and every export,
  where they can bring it back; `delete_note` takes it off the wall. When
  the word could mean either, keep it (pass 1a, entry 95).
- `set_aside` — a card **on the wall and not in the film**: a scene the
  writer cuts and will not throw away, an idea with no place in the story
  yet, the version not chosen. By id or headline. It keeps its words, its
  cast, its fold and its place on the wall, and leaves the order, the
  count, the pages and every export; its follows arrows go, and where it
  stood between two cards the story closes over it (setup arrows, being
  claims, stay); a beat set aside is a scene. `read_wall` lists it under
  "set aside" and asks nothing of it, `list_board` lists it apart from the
  cards in story order, `organize` leaves it where the writer put it, and
  it takes no follows arrow and no thread while it is aside. `aside: false`
  brings it back as a plain unwired card, and the wall asks where it goes.
  Only on the writer's word — cutting a scene is theirs — and not a way to
  quiet a question: a card the writer is unsure of is `set_open`.
- `set_target` with **`kind`** — when the writer says a kind and not a
  number ("it is a feature"), pass `kind: "feature"` (`hour`, `half-hour`):
  the target keeps their word, is read as 120 (60, 30) pages, and the
  readout and the reading say "a feature". Do not turn their word into a
  page count they never gave; `pages` is for when they give a number.
- `set_open` — leave a card **open**, with the writer's words for what is
  not decided: "whether Tom knows", "who sent the letter". The reading
  lists open cards under their own head and asks nothing of the card itself
  while the words stand — not its place, its change line, its arrows, its
  cast, its fold; a question about the run it sits in, beats back to back
  or a sag, is still asked, because that is about the story around it. The
  reading says beside each open card what it would be asked if closed. It
  is still counted, in the order, and a page. `open: ""`
  closes the card and its questions come back. `create_note` takes `open`
  too, so a card born from a maybe is born open. One undecided field is
  not an open card: a place, a when and a change line each have an open of
  their own (`locationOpen`, `whenOpen`, `changeOpen`), and the card's
  other questions stand. Only on the writer's word:
  where the notes have two versions, ask; where the writer says "I don't
  know yet, leave it open", this is how, and invent nothing to fill it.
- `create_thread` / `update_thread` / `delete_thread` — a **thread**: a
  named string through the cards a thing runs through — "the letter", "the
  key", a subplot — with either end open until the writer ties it. Name it
  and string it through cards by id or headline in story order; say
  `startOpen` when the writer knows where it comes out and not where it is
  first seen, `endOpen` when the card it comes out on is not decided — the
  writer may know it comes out at the end and not on which card, or not what
  happens when it does: what happens is the end card's change line, open in
  their words, not the thread's. The reading lists every thread
  and asks about each open end from that end — "where is the ring first
  seen?" — until `update_thread` ties it (`add` the card and `startOpen`
  false in one call). The wall draws it as a dashed string through its
  cards, a ring where an end is loose. A thread is beside the fold and the
  setup arrow, not instead of them, and the app keeps the rule: a thread
  tied at both ends through two or more cards is the fold's — if the first
  card's fold is free, tying it folds that card, names the fold from the
  thread and draws the setup arrow to the last card, and the reply says so;
  if the first card is folded for something else, the thread stays a thread,
  tied and listed, and no arrow is drawn, because a card has one fold. A
  thread is the writer's word before both scenes exist, and the home for a
  strand a fold cannot hold. Only on the writer's word.
- `set_when` — **when** a scene happens, as the writer says it: "night",
  "day four, dawn", "the next morning". Free text on the card beside its
  place, printed after the place on every scene heading — THE PIER AT FENIT
  - NIGHT. This is where a scene's day and time live, not the headline, so
  two scenes on one day never read as one scene; `create_note` and
  `update_note` take `when` too, and `list_board` shows it. On the wall it is
  the place line after a dot — at the pier at Fenit · night — and the writer
  types it there. A card with no when says nothing about time; if the writer
  says the day is unknown, that is a when too: `when: "day unknown"`; if
  they say it is not decided, `open` with their words leaves the when open
  — listed by the reading, no time on the heading, and the card still
  asked about everything else, unlike `set_open` on the whole card.
- `delete_note` — remove a card. Its arrows go with it and it leaves its
  group; a card wired into a chain — one `follows` in, one out — leaves the
  chain joined behind it. The reply names each arrow by its cards, the join,
  what the group kept, and whether the card's folded corner and its "pays off
  later" went with it; `undo` brings all of it back and says what came back
  with the card.

### Cast

The cast is the **project's**: one roster every board of it casts from, so a
person is one record across the pilot and the episodes after it, with one
page. A new board has the whole cast to cast from and nobody on a card yet.
`list_board` shows the cast with the cards on this board; the Cast panel says
where a person on no card here is instead ("on Pilot · 13"). Someone on a
card of another board is not asked about as uncast here.

- `add_character` — add a person to the project's cast by `name`. The reply
  names the person's id. The same name twice, on any board, is refused and
  the existing record returned; use its id. A name given to `create_note`
  or `cast` that the roster lacks is added by itself, so a treatment's
  people come in with their cards; `add_character` is for a person before
  their card, and the wall asks where they come in until one names them.
- `rename_character` / `remove_character` — by id. Renaming carries to every
  card on every board; removing takes them off every card here and leaves the
  cards, and is refused while another board has them on a card — cast them
  off there first, or leave them.
- `read_character` — a person's page back, by id or name, across every
  board of the project (one cast, one page): the five lines as
  they stand and the cards they are on. `list_board` says which lines are
  written; this says what they say.
- `update_character` — write a person's page by `id` or `name`: `looks`, `voice`, `wants`,
  `needs`, `notes`, any subset, all text. `list_board` says which lines each
  person has ("page: looks, wants" or "page: empty"). Looks and voice are what
  a video agent will be handed later, so ask the writer before inventing them.
- `cast` — set who is in one or more cards: `noteIds` plus `characters` (names
  or ids). The list **replaces** the card's cast, so pass everyone in the scene;
  an empty list clears it. A name not in the roster is added to it, as
  `create_note` does, and the reply says so. Do not invent people; ask the
  writer who is in a scene — a name the writer gave is not an invention.
  An **unnamed** person in a treatment — "their mother", "the dispatcher" —
  is named by their role: `Dana's mother`, `The dispatcher`. A role is a name
  until the writer gives one; leaving them off the card is the error.
  **Someone who may or may not be in a scene** — "whether Tomás is there, I
  don't know yet" — is their name with a question mark, `Tomás?`, in `cast`'s
  or `create_note`'s `characters`. The card holds it as not decided: the
  reading lists "whether Tomás is in it" under open and never asks; the cast's
  counts say "3 scenes, and maybe 1 more"; and the check for someone gone a
  third of the story counts only scenes he is certainly in, naming the maybe
  when it sits inside the gap. Someone whose only card is a maybe is **not**
  asked about as "in the cast but on no card" — the writer has said where they
  may be — and a card whose only person is a maybe is not asked who is in it. The name without the mark decides it; leaving
  the name off decides it the other way. Only on the writer's word — and not
  `set_open`, which says the whole card is undecided when one person is.
  **When nobody can be named** — "who is in it: I don't know yet" — or the
  writer knows some and not whether there is anyone else, that is the cast
  line's own open: `castOpen` on `cast` or `create_note`, with their words.
  The words stand beside any names ("Ada, Callum · anyone else: I don't
  know"), the reading lists "who is in it" or "who else is in it" under open,
  and the card is not asked who is in it. `castOpen: ""` clears them; naming
  someone does not.
- **Acts** are not a thing the app knows. The wall reads left to right and a
  structure's beats are the act breaks. When a treatment comes in acts, put each
  act's cards in a **group** titled for it (`create_group`, title "Act one"), so
  the break is on the wall without an opinion about beats. When the treatment
  has no act breaks, ask the writer where they fall; never infer them. **Paper
  colour** means nothing to the app; a card from `create_note` is yellow unless
  you pass `color`, so a colour on the wall is always someone's choice.
- **A setup arrow lands on the scene's card.** If the payoff is a moment inside
  a scene, the card is still the scene; never split a scene to give the payoff
  a card of its own.
- **Who is not on the wall.** A person in the treatment who is in no scene
  (a daughter spoken of, a name on a wall) belongs in the **notes** of the
  person they matter to, not the roster — the roster asks about anyone on no
  card. When the writer does not know yet whom they matter to (a dead man
  whose funeral is a scene), the person goes on the film's open lines
  (`add_open_line`, in the writer's words) until they do. Age, job, a bad knee: `notes` too, unless they are how the person looks
  or sounds.
- **Under target** is reported as plainly as over — a number and "an
  estimate" — never as a verdict either way.
- **Something not decided about a person** — "what he goes to the town
  for: a hospital visit, a music lesson, or the courthouse" — is
  `update_character` with `open` and the writer's words. The reading lists
  it under "open, by the writer's word" as "about <name>", never asks,
  and the person's page shows it under "Not decided yet". It is a fact
  about a person, so it is not a card's open words and not an open place.
  When the writer decides, `open: ""` and the answer goes where it
  belongs — their notes, or the scene that shows it. What the writer has
  decided and not yet told you is not the wall's: ask them.
- **What a treatment should answer.** Eleven blind runs ended every build
  with the same questions to the writer. Before you build, check the
  treatment for them and ask for the ones it leaves open — invent none. The
  questions live in one place: `list_workflows`, under break-a-treatment,
  each with the tool its answer lands in (the length, the central question
  and the premise, the order, the turns, the acts, where and when each
  scene happens, who is in it, what is planted and where it pays off, what
  runs long or short, what the project and the board are called, what must
  not be invented). `list_reminders` is not that list — it is the house
  principles. The writer sees the same questions in the app under
  Reminders, on its "Before a treatment" tab.
- **A treatment is cards, one call each.** `import_fountain` is the door for
  pages, not a treatment: a new card takes its headline from the `= synopsis`
  line (else the heading), its place from a forced heading (`.the piano shop`)
  with a synopsis, its text from the body and its change line from the body's
  first sentence — and a card with text is measured from it, so a one-line
  body makes a card of a few lines, not a page. Rank, the fold, the cast,
  arrows and acts do not travel. Thirteen `create_note` calls with
  `characters`, `location`, `rank` and `plants` is the right size for a
  treatment.

### Pages

- `export_fountain` — the open board as a Fountain screenplay in story order
  (beats as sections, one scene per card, the scene's text or — marked
  `[Unwritten]` — its change line as the body (the mark alone when the
  change line still waits, or an open card's words after "Open, by the
  writer's word:"; never the app's own "What changes?"), the cast and the fold as
  notes, a changed scene noted under a revision). Pass `path` to write a
  `.fountain` file.
- `read_pages` — the same script with each card's id beside its heading and
  whether it is measured (written) or estimated. Read it before writing.
  A card with no place prints `NO PLACE YET:` and then its headline where
  the place would go, on every page and in every export, so a headline in
  capitals is never read as a place; a place left open prints `PLACE NOT
  DECIDED:` and then the headline the same way, with the writer's words for
  why in the note beneath (`place open: …`), so words written for a card's
  edge never stand where a slugline goes. Neither is a place, and both come
  back in as what they were.
- `write_scene` — a card's scene text in Fountain, by id; the card is then
  measured from its lines. Write only scenes the writer asked for. Under a
  revision the reply says the card is marked. The cues in the text (JOE,
  CIARA) are not tied to the card's cast: the cast is the card's claim about
  who is in the scene, the cues are the page's, and the app relates the two
  only by name. Keep them agreeing yourself — `cast` when a cue names someone
  the card does not. A person named by their role cues as that role, article
  and all: THE INSPECTOR. Writing a scene from a treatment: the treatment's
  reported speech becomes lines in the mouths it names — "she asks whose hand
  it is" is the inspector's line — and that is not inventing; a fact, a look
  or a line the treatment does not have is. Once written, the card is
  measured from its lines and the wall reads that; the writer's estimate is
  kept underneath for when the text goes.
- `edit_scene` — one line of a scene, by `find` and `replace`: the text must
  occur once. For "change her last line", not a rewrite. To **add** a line,
  `insert` with `after` (or `before`) and the text of the paragraph it goes
  beside: a new paragraph, the rest untouched. A `[[note]]` in a scene's
  text neither prints nor counts toward its length.
- `import_fountain` — a `.fountain` file or text onto the open board: scenes
  land on the cards with the same heading in order; unknown scenes become new
  cards; nothing is deleted. A card with no place answers to its marked
  heading and to its bare headline (`.TOM LIES ABOUT THE JOB`), which is how
  a script written elsewhere names it.
- `page_count` — the board paginated as a script (Letter, Courier 12, 55
  lines, the industry's break rules) with the page each scene starts on, by
  the locked numbers when there is a lock. Unwritten scenes set their change
  line as action, a few lines each, so it is the script so far, not the
  runtime; the caveat comes first.
- `export_fdx` / `import_fdx` — Final Draft's file, out (scene numbers as
  locked, or by story order when there is no lock; the lock's date and the
  revision on the title page; changed paragraphs marked) and in (the same
  merge as Fountain in). A relative path resolves from the server's folder.
- `create_note` with `after` or `before` (a card's id or headline) wires the
  new scene into the story in the same call, so under a lock it gets its
  letter for where it sits at once — 3A between 3 and 4. The letter is
  worked out again if the scene moves; the locked numbers never move.
- `export_markdown` / `export_text` — the wall as Markdown (headings, a
  heading per scene, the text or the change line) for a collaborator in
  Google Docs or the like, and the script as plain text set as it prints.
  Pass `path` to write a file; otherwise the text comes back. The writer has
  the same five formats under Save as… in the Pages panel. **Every script
  out is titled the same way:** a named project is the title — a one-board
  film goes out under its own name — and when the project has several
  boards each file carries an episode line under it, "Episode 2 of 6 ·
  Certified", numbered in the project's order, even when a board shares the
  project's name. One board per file: a series is one file per episode, and
  a Final Draft file returned as text names itself in a comment on its
  second line. **An unwritten scene** prints its change
  line after the mark `[Unwritten]` in every format (the mark in bold in
  Markdown), so a reader can tell a placeholder from a page; the mark comes
  back in as unwritten. **What each form carries:** Markdown has the beats
  and every headline, no cast and no fold; plain text is the script alone —
  the heading is the place and the when, no headlines, no beats; Fountain
  has the cast and the fold as notes; Final Draft has the numbers. A revision
  reaches all of them: a star in plain text's right margin on changed lines,
  a marked heading in Markdown, a note in Fountain, a revision set in Final
  Draft. In Google Docs the headings hold through Paste from Markdown.
  Coming back in, a scene whose text is already on its card is matched and
  left alone; matching is by heading and then by order, so a reordered file
  lands text on the next card with that heading and never reorders the wall.

### The project

- `set_title_page` — the byline and the contact for every script the
  project sends out: "Written by …" under the title and the lines under it
  (an address, an agent, an email), in Fountain, Final Draft, Markdown and
  plain text, with the day's date as the draft date. `""` clears one.
  Nothing is claimed until the writer says who it is by.
- `set_premise` / `rename_project` — the line above every board's logline, and
  the project's name. `list_boards` shows both. The premise is the project's
  whatever its board count: a series' line, or what is true before a film
  starts — "the winter the shop closes" — so a
  one-board film's standing facts have a home that is not a person's notes.
  What is true of the whole film and of no one scene — when it runs from
  and to, what never happens in it — goes in the premise, a sentence each;
  `read_wall` prints it above the logline and `read_pages` at the head of
  the script, so whoever writes a scene sees it. A fact about one scene
  ("the cut is announced here") belongs on that scene's card.
  Not decided — "a sale, or a lease" — `set_premise` with `open` and
  the writer's words leaves it open; a line decides it. A title not decided
  — "The Allotments, or Plot 14" — `rename_project` with `open` leaves the
  project's name open while it stands, and `new_project` with `open`
  instead of a name starts the project that way.
- `list_reminders` / `add_reminder` / `remove_reminder` — the writer's
  principles. Read them before building or reading a wall; add only what the
  writer asked to keep in front of them.

### Structure

- `apply_template` — lay a structure's named beats on the wall as beat cards
  (`turns` is the house method and the default; also `three-acts`,
  `eight-sequences`, `fifteen-beats`, `story-circle`, or one of the writer's
  own by name). One undo step. Ask the writer which; afterwards there are only
  cards, nothing remembers the template.
- `compare_structure` — a structure beside the wall, without laying anything:
  each of its beats with the page it falls near on this board's target, and
  the nearest of the wall's own beats within six pages, one to one and in
  order, with how far off it is. A reading, like `read_wall`; the app shows
  the same rows in the Structure sheet and the structure's marks on the story
  map's strip. Use it when the writer asks how the wall sits against a
  structure; lay the beats only when they ask for cards.
- `list_structures` / `save_structure` / `remove_structure` — the writer's own
  structures live on the project: save the open wall's beats as one (reading
  order, headline as the beat, change line as the prompt), list them beside
  the built-in five, remove one by name. Save only when the writer asks.
- `set_logline` — set the board's central question. Empty string clears it.
  Not decided: `open` with the writer's words — "two candidates, not chosen"
  — leaves the logline **open**; the reading lists it under "open, by the
  writer's word" and asks nothing; a sentence decides it, `open: ""` leaves
  it blank. The premise, a card's when and a board's name take `open` the
  same way (`set_premise`, `set_when`, `rename_board`, and `new_project`'s
  `boardOpen` and `new_board`'s `open` for a board born from a maybe). Only
  on the writer's word, never to fill a field you could not decide.
- `set_target` — target script length in `pages`: 120 feature, 60 hour, 30 half.
  Not decided — "half-hour or feature" — `set_target` with `open` and the
  writer's words leaves the target open: the reading lists it, reads the
  runtime against a half-hour and a feature meanwhile, and a number decides
  it; `new_project` takes `targetOpen` the same way.
- `create_group` — frame two or more cards: `noteIds`, with an optional
  `title`. The reply names the group's id. A cold open is not an act: leave
  its card outside any group, and a one-card cold open could not be a frame
  anyway.
- `add_to_group` — cards into a frame that already exists, by the group's id:
  the twin of dragging a card into a frame. The frame reaches the cards where
  they are and nothing moves; `organize` keeps a group together as a block. A
  card is in one frame at a time, so it leaves any other on the way. Rebuild
  an act around a new card with this, not by ungrouping and regrouping.
- `rename_group` / `ungroup` — by group id. Ungrouping leaves the cards alone.
- `create_arrow` — a directed arrow, `from` → `to`, with an optional `kind`
  (`follows` or `setup`).
- `set_arrow_kind` — change an arrow's kind by id. One arrow per kind per
  direction: a follows arrow and a setup arrow may share a pair (a plant whose
  payoff is the very next scene has both), and a second of the same kind is
  not drawn, so change the kind rather than drawing it again.
- `delete_arrow` — by arrow id. Removes that direction only.
- `set_order` — **"the order is: A, B, C…"**: the story order from a list
  of cards, by id or headline, in one step one undo takes back. The follows
  arrows touching the cards named become one chain through them — no card
  moves — and setup arrows are untouched; a card in the film
  that is not named may be left on no arrow, and the reply names it. This
  is the tool for the writer giving the order; do not draw it arrow by
  arrow.
- `move_scene` — move a card to another place in the story: `after` one
  card's id, or `before` one; or to **another board** of the project with
  `board` (by name, id or number), landing `after` or `before` a card there,
  or at the head of that board's story when neither is given. Across boards
  the card leaves with its cast, place, when, rank, length, text and fold, its
  arrows stay behind (a setup into it leaves its fold unpaid; draw new arrows
  on the new board), and the new board is then the open one. Undo is per
  board: one step there, and one on the board it left. Within a board, it rewires the follows arrows (what pointed at
  the card points at what it pointed at; the card lands between the target
  and what followed it), as one step `undo` takes back whole; the card lands
  beside the one it now follows and nothing else moves. A scene that lands
  beside a card of an act joins that act, so the reading and the numbers
  agree with the arrows. **No tool tidies the wall on its own**: the order
  is the arrows, and where cards sit is the writer's. Wiring a scene in
  with `after`, moving one, and `set_order` all leave every other card where
  it was; after building a wall, call `organize` once, and otherwise only
  when the writer asks for a tidy. A person does this by dragging in the outline.
- `organize` — tidy the wall along the arrows: story order from the `follows`
  arrows, a row per beat with the scenes that follow it, groups kept together.
  Pass `noteIds` to tidy only those. Prefer it to moving cards one by one, and
  draw the arrows first — it is the arrows that make the layout right.
- `list_boards` — the project: its name, premise, and every board in order with
  id, name and shape, marking the open one. Ids come from here.
- `open_board` — open another board by id, name, or number (a number is fine
  as a number). Every card tool
  then works on that board; the writer's wall switches too.
- `new_board` — add an empty board to the project and open it, keeping the
  target. The other boards are untouched. Give it a name, or `open` with the
  writer's words when the name is not decided.
- `rename_board` — by id, name, or number; or `open` with the writer's
  words to leave the name open while it stands.
- `delete_board` — remove a board and everything on it. **Cannot be undone**,
  not even from the wall: ask the writer first, say how many cards it holds,
  suggest Save project. The last board of a project cannot be deleted.
- `undo` — take back **your own** last change, newest first, as many steps as
  you made. It refuses if the board has changed since (the writer moved on),
  so it never tramples their work; they can undo anything from the wall with ⌘Z. Use it when a
  rearrangement did not help: try, `read_wall`, and undo if the reading got
  worse.
- `redo` — put back what you undid, newest first, under the same rule; any
  new change of yours clears what could be redone.

## Workflow

1. **Start as the on-ramp says** — `list_words`, `list_workflows` and
   `list_projects` first, which read no wall and say which one is in hand;
   then `read_wall`, `list_reminders` and `list_board` of the wall you are to
   work — after `new_project` or `open_project` when the wall in hand is not
   that one, so your first reading is never of a wall you are about to
   leave. Use the real `id`s `list_board` returns before any move, edit,
   group, or arrow. Never guess ids.
2. Give every card a real `headline` and `change` — not placeholders. A card
   whose change line is empty is a card that has not earned its place.
3. To lay cards out, draw the arrows and call `organize`. A straight
   sequence needs its `follows` arrows too: they are what `organize` lays
   the wall out along, and the wall asks about a card no arrow touches. Once
  the film has follows arrows, a card on none is **unlinked**: in the film and
  its length, in no run between two turns, last in the order and printed last,
  not laid by `organize` — it stays where it is, or goes beneath the rows when
  they would run under it — and the reading lists it and asks where it goes.
  "Seen early, not decided where" is such a card, and the wall does not seat it
  for the writer (round twenty-four). Use `move_note` only
   for a card that belongs somewhere the arrows do not say. Cards are 192px;
   leave ~30px gaps for a readable row.
4. Mark the major turns with `set_rank`. Marking a beat never moves it.
5. Give lengths when the writer asks for your estimate or the card plainly
   states one; otherwise leave them (a montage, a one-line sting, a long set
   piece). A duration in the treatment — "it takes a day" — is not a length.
   The estimate is the writer's.

## What the tools will refuse

These are not errors to retry — they mean the board disagrees with you. Read the
reply, call `list_board`, and fix the ids.

- A group needs **two or more cards that exist**. A card can only be in one
  group, so grouping it removes it from its previous frame.
- An arrow cannot point at itself, cannot use an id that is not on the board,
  and the same kind cannot be drawn twice the same way.
- Arrows are **one-way**. `A→B` does not create `B→A`. Draw both if you mean
  both — that is two arrows, and deleting one leaves the other.

## The words, when the writer asks

PlotCoder's words — beat, logline, change line, the folded corner, eighths —
are the room's, and many writers are not from the room. `list_words` gives
every one in a sentence, the app's own meaning; use those sentences rather
than a dictionary's, so the app and you never explain a word two ways.

## The reply's tail, presence, a sketch, and the camera

- **A write's tail** says when the wall's questions changed. Until the
  session's first `read_wall` it counts and points — "the wall's questions
  have changed since your last read_wall: 4 now, 2 of them new" — because a
  build is a run of writes whose quoted questions the next write answers;
  after the first reading it quotes them. "First" is of **the wall in hand**:
  starting or opening a project, or opening or making a board, begins the
  count again, since what you had read was another wall. The hosted door
  (`mcp.plotcoder.com`) remembers the same things from one call to the next —
  what you have read, which advice it has said — by the session your client
  opened; a client that sends no session gets the quoting tail from the first
  write and no once-a-session advice. **Undo works through that door too:**
  your session's last ten changes are kept on the writer's own account for a
  day, and `undo` takes them back newest first, refusing when the wall has
  changed since so nobody's work is trampled. `undo` with `preview: true`
  says what it would take back, and whether it still can, and takes nothing —
  use it before an undo you are not sure of. Redo is not kept there. A client
  that sends no session has no trail, and `undo` says so. The writer's ⌘Z on
  the wall takes any change back at every door. And "undo that scene" from a
  writer, when other changes they want have landed since, is `delete_note`
  or `set_aside`, never a walk back through the stack.
- **What the change did to the story's shape** rides the same tail, when it
  did anything: after `set_order`, `move_scene`, `set_aside`, `delete_note`,
  `choose_version` or a scene wired in with `after`, the reply says which
  runs between the turns changed and by how much, that the last card of the
  story is now another, and how many cards now sit out of the story's order
  on the wall — so you need no second reading to tell the writer what a cut
  did. It says nothing when none of that changed.
- **The account tail** says presence only when it has changed since the
  last reply — otherwise just "saved to the account" — so a change is
  noticed. It says what the wall shows: "open on Robert's screen
  now", or "no wall open right now — it shows the moment one opens", read
  from the presence the server already follows; `list_projects` says the
  same of the working project. Never "seen by": presence lags a second or
  two. **"Who has this open?" is `who_is_here`:** it waits a moment for
  presence, names the people as the app's People sheet does, says this
  session beside them ("an agent, as …"), and says "could not see in time"
  rather than "nobody" when presence does not arrive. The hosted door
  (`mcp.plotcoder.com`) answers each write before presence arrives, so its
  write tails say only where the write landed.
- **The camera's marks are on the writer's page too.** The app's Pages
  show the same `◂ knows` in the margin that `read_pages` shows you, with a
  hover saying it is a mark and not a question. So say "the line is marked
  on your page", not "the app flagged a problem"; nothing is owed for it.
- **A sketch:** a written scene measured under the page it was read as is
  named one — on `write_scene`'s reply, on the card's line in `list_board`,
  and on the runtime line, which carries the second number: "about 11 pages
  if it ran to that". The measure is still the count; the reading says
  which count it is.
- **The camera:** `write_scene`'s reply and `read_pages` mark the action
  lines that say what someone knows, feels, thinks or wants — "2 lines the
  camera cannot see (knows, feels)", and ◂ beside each on the page. Never a
  question on the wall: the house principle is the reminder's, and a
  sentence on a page is the writer's. Dialogue is never read.

## Do not have opinions about beat count, and do not treat page counts as facts

The app deliberately counts beats and says nothing about the number. Do not tell
the user they have too many or too few. Report the count if asked. Marking the
turns a treatment plainly makes is reading the treatment, not an opinion
about the number: mark them, say which you marked and why, and let the
writer strike or add.

The runtime is an **estimate built from guesses**, most of them the default page.
Say "about" when you report it. Never tell a writer their script is too long on
the strength of it.

## The account, the app, or the file

**Wiring, for whoever connects the server.** The server is an npm package, `plotcoder-board`: wire it once, from any
folder, with `claude mcp add plotcoder-board -s user -- npx -y
plotcoder-board@latest` (or the same as a config block), then start the
session again — a server wired from inside a session connects only on the
next one. Inside the repo, `.mcp.json` and `.cursor/mcp.json` wire the
checkout's own server instead (run `npm ci` in it first). Drive the board
through its tools. **Do not** open a browser and fake pointer drags — the
tools and the human UI share one command kernel, so a tool call lands on the
exact same board a person sees. No MCP where you are, or already inside a
session? `npx -y plotcoder-board@latest call <tool> '{json}'` makes one call
from a shell — one server per call, so `undo` and the project `new_project`
or `open_project` chose do not carry to the next call; set `PLOTCODER_PROJECT`
for the calls that need it, or run them as a batch (`call --batch <
calls.jsonl`, one `{"tool", "arguments"}` per line) on one server. The
sign-in is kept between calls in the folder's `.plotcoder`. Hosted, with
nothing installed: `npx -y plotcoder-board@latest serve` puts the same server
on a port, and an MCP client connects with `--transport http` and the
writer's sign-in in a Basic header. `PLOTCODER_ROOT` points the server at the
folder whose wall you mean.

Every read of the wall or the project says which it read, on its first line.

- **The account** (`PLOTCODER_EMAIL` and `PLOTCODER_PASSWORD` set): "the
  account, as you@…, working "Low Season"". Every change lands on every open
  wall of that project. The account wins over an open app.
- **The open app** (`npm run dev`, no sign-in): "the open app at
  http://localhost:5173". Edits appear on the wall within a second.
- **The file** (neither): "the file at …/.plotcoder/board.json; no app
  running". Tools still work; the wall catches up the next time the app loads
  from that folder.

If a tool result says the change was "written to file" but you expected it live,
the app is not open. Tell the user to run `npm run dev` if they want to watch
edits appear in real time; the change is already saved either way.

## Not available to agents

- **Scatter** (shuffling the cards' positions on the wall) is a mouse action with no tool; undo covers it.
- **Sharing a project, signing in, changing the email or password** are the
  writer's decisions at the door; no tool does them.
- **Pan and zoom** are per-viewer state and are deliberately not board data.

## Workflows

A workflow is what the writer asks for in a sentence; you compose the tools.
`list_workflows` has the six with the tools each composes and the rule to keep:
break a treatment into a wall; read the wall and raise questions (change
nothing); lay a structure over what is here; draft a sequence in Fountain from
its cards; restick the remaining cards after the pages moved; brief a segment
for video. Read `list_reminders` first — they are the house style.

`segment_brief` briefs one card or a run of cards for a
video tool from what the wall holds. It is text for the writer to approve;
nothing is generated or sent, and no video tool is chosen yet.

## The account door

With `PLOTCODER_EMAIL` and `PLOTCODER_PASSWORD` in your environment — the
writer's own — and no dev server running, every tool works the writer's
project on the account directly, and each change lands on every open wall.
`list_projects` shows what you can work; `open_project` (`project`: a name
or id from the list) switches; `new_project` (`name`, and `pages` or
`minutes` for its target, and `board` for the first board's name) starts an
empty one and works it. With the sign-in
set, the account is the wall even when a dev app is open on the machine;
without `PLOTCODER_PROJECT` the server works the project touched most
recently, and every reply's first line names it. **No account yet?**
`claim_account` makes one with the writer's email and a password — ask the
writer for both and never invent a password; say what was made (the email,
that the wall here is its first project, that they sign in at the wordmark);
one account per writer, so a taken address is refused, not varied. The
on-ramp in the app and at plotcoder.com/llms.txt says the same. Files on the project go
through this door too: `add_picture` puts an image on a person's page,
`add_take` files a take on a card or a run, `list_files` shows everything,
`remove_file` takes one away (ask first; it cannot be undone). **The
account is the writer's from your side too:** `delete_project` (by name or
id; the owner's own only), `empty_account` (every project they own; shared
ones stay) and `delete_account` (the sign-in itself; the door shuts) — each
says what would go until it is called with `confirm: true`, and none can be
undone, so ask the writer first and `export_project` first. **A project as a
file:** `export_project` writes the file Save project writes (a path, or the
reply's JSON), through any door; `import_project` opens one — onto the
account as a new project, or replacing the folder's project after asking. The
sign-in set is you saying which wall you mean, so it wins over an open app.

## The production half

- `lock_numbers` / `unlock_numbers` — once a draft has gone out, every scene
  keeps its number and moving it never renumbers it; a scene added after the
  lock has a letter, 14A then 14B, which is its place between locked scenes
  and follows the scene if it moves. `create_note` says the letter a new
  scene got; Final Draft out carries the numbers. Ask the writer first: it is
  a decision about the document.
- `start_revision` / `end_revision` — a revision in one of the industry's
  colours, named or named for the colour; changed lines are starred on the
  page and in every export, changed cards wear the colour on the wall, and
  `write_scene` and `edit_scene` say when they mark a card. `list_board` says
  the lock and the revision.
