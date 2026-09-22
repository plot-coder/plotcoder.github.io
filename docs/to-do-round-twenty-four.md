# To do — everything material from round twenty-four

Written 2026-09-21, night, from `blind-runs/round-twenty-four-report.md`
(fifty-four entries and its sections 3 to 6). Every entry is accounted for
at the foot of this file: here as an item, a matter of procedure, left on
purpose, or decided against, with the reason. Nothing from the round is
fixed yet.

**The pattern for every item, in this order, and no skipping** (as in
`docs/to-do-round-twenty-three.md`): **plan**; **ask whether it is the best
we can do**, in writing — a mockup on the app's own paper for anything a
person sees, the alternatives named for tools and plumbing; **build**,
through the kernel; **test**, and look at it in the app when a person can
see it.

Status marks: `[ ]` open · `[~]` planned and asked, waiting on a word ·
`[x]` built and tested.

**Where it stands (2026-09-21, late):** **built, on Robert's "come up with a
good plan and then execute" — D1, D2, D3 and N1 to N15**, each with a test
(713 unit tests, `npm run build` clean), asking at each step whether it was
the best we could do; where the answer was no, the item says what changed.
D3 was built before its mockup, on that word: the wall's two-arrow pair and
the unlinked card are still to be looked at in the app. **Left: D4** (a
cold-start test, Robert's hand) and **R72**, its own item in
`REQUIREMENTS.md`, waiting on his word. What was written before the build
stands below as it was planned, with a line under each item saying what was
built.

---

## D. Decisions — a rule of the wall, or a hand at a screen

- [x] **D1 · A thread through a version behind** (entry 17; sections 4 and
  6). "The fish knife comes out on the pier — the version with Priya", and
  that card stood behind the other. `create_thread` holds its cards in
  story order, and story order is the film's (`storyOrder` filters by
  `inStory`), so the card was dropped without a word: "no card yet". The
  writer's one known end of the knife had no home until the version was
  chosen.
  *Plan:* a thread may run through a card that is not in the film — a
  version behind, or a card set aside — and the reading says so where it
  lists the thread ("comes out on 'The pier, with Priya' — a version behind
  'The pier, alone'") and asks nothing of that end while the card is out of
  the film; when the card is chosen or brought back, the thread is already
  there. The kernel orders the thread's cards among the film's and puts a
  card out of the film beside its sibling (a version) or last (set aside).
  The reply names any card held that way.
  *Alternatives:* refuse with words ("not in the film; choose_version
  first") — honest, and the writer's word still has no home; tie it to the
  front card — the wrong version, which the agent rightly would not do.
  *Best?* Holding it: R60 says a thread is the writer's string with either
  end open, and "it comes out there, if I choose that" is exactly a thing
  said before the scenes exist. Robert's word: a thread on a card out of
  the film is a first.
  *Test:* kernel — a thread through a version behind keeps it, in the right
  place; through a card set aside, last; `choose_version` leaves the thread
  as it was; the reading's thread line says the card is behind and asks
  nothing of that end; the reply names it.
  *Built 2026-09-21:* `threadOrder` in the kernel (beside its front; set aside last); `tieIntoFold` waits with `fold.waiting`; `set_aside` keeps a card on its threads and reports `onThreads`; the reading carries `outside` per thread and measures `apart` between the ends in the film; the replies name the held card ("the string keeps it"), and `update_thread` no longer refuses. Better than planned: `set_aside` keeps threads too, so a cut scene's string is not dropped in silence either.

- [x] **D2 · A follows arrow and a setup arrow on one pair of cards**
  (entries 26, 27, 30). "The man from the chain, then the pier" with the
  man's card planted for the pier: `set_order` asked `create_arrow` for a
  follows arrow A→B, the kernel refused it because a setup arrow already
  runs A→B ("the same direction cannot be drawn twice, whatever its
  kind"), and `set_order` counted only what changed: "5 drawn" for a chain
  of seven, the story reported whole, the sign card dropped into the hole.
  *Plan, two parts.* **The rule:** one arrow per kind per pair — a follows
  arrow and a setup arrow may share a direction; the wall draws the pair as
  one line with both marks (a plant whose payoff is the very next scene is
  ordinary). `create_arrow` refuses only a second of the same kind.
  `choose_version` already says "a follows arrow wins over a setup between
  the same two"; with the rule changed it keeps both. **The reply:**
  `set_order` and `move_scene` name every arrow drawn and every one
  refused, with why, as the undo already does on the way back (30), and
  say "the story runs whole" only when the chain is whole.
  *Alternatives:* keep the rule and turn the setup into a follows (loses
  the claim; the fold then asks for its payoff); keep the rule and only say
  it (honest, and the writer's order still cannot be drawn).
  *Best?* One per kind. The rule was a guard against two lines on one
  pair, not against two meanings. Needs a look on the wall: the mockup
  shows the pair drawn as one line. Robert's word.
  *Test:* kernel — follows and setup on one pair both stand, a second of
  either kind is refused, `set_arrow_kind` on one leaves the other;
  `set_order` over a pair with a setup arrow draws the chain whole and its
  reply names each arrow; a refused arrow is named with its reason.
  *Built 2026-09-21:* one arrow per kind per pair in `create_arrow`; `set_arrow_kind` refuses a twin; `choose_version` dedupes by kind; closing over a cut or aside card looks past a setup arrow; `tieIntoFold` draws the setup beside a follows arrow; the wall bows the dashed setup beside the solid line (`paired`); `set_order` names every arrow drawn and not drawn and says "does not run whole" when one is missing; the guide, the skill and the tool words say the rule. Not yet looked at on the wall.

- [x] **D3 · A card no arrow touches has no place in the order** (entries
  21, 28, 34; section 4 "seen early, not decided where"). "It wants to be
  seen early and I have not decided where" became a card that the tidy
  seated in the top row, that `list_board` numbered fourth, that every
  arrow change re-seated, and that the runs counted — until it was deleted
  and the run between the beats went from five cards to four.
  *Plan:* when the wall has follows arrows, a card on none is **unplaced**:
  listed under its own head in the reading and the records ("unplaced:
  'The sign' — the wall asks where it goes"), asked about as now, and out
  of the runs, the count between beats and the pages (the page count says
  "+1 unplaced"); `organize` leaves it where it is, or on a row of its own
  beneath the story like a card set aside, and says so. When the wall has
  no follows arrows, the rows are the order, as today.
  *Alternatives:* leave it (the rows fill the gap, and the reading calls it
  unlinked — but numbers it, counts it and moves it); make it an aside
  card (it is in the film; the writer only has not placed it).
  *Best?* Unplaced. A writer's "not decided where" should not read as
  fourth. It changes what a person sees on the wall (where the tidy puts
  it) and in the pages (a scene with no number), so: a mockup first,
  beside what ships.
  *Test:* kernel — `storyOrder` leaves an unplaced card out when the wall
  has follows arrows and keeps rows-as-order when it has none; runs and
  page counts exclude it and say so; `organize` puts it beneath and names
  it; the reading lists it under unplaced once and asks where it goes;
  wiring it in (`move_scene`, `create_arrow`) brings it into the count.
  *Built 2026-09-21 as R73, before its mockup on Robert's word:* `unlinkedCards`, `storyOrder` last, the reading's runs and `unlinked` list, `outOfOrder`, `organizePoses` (not laid; beneath when in the way, marked `unlinked`), `list_board`, `read_wall`, the runtime line, the tidy's reply, the guides. Better than planned: the threshold is the reading's own half-wired rule, so one arrow among seven does not make six unlinked; and the word is the reading's own, unlinked, not a second one.
  *Seen in the app 2026-09-21 (a wall of five through the dev bridge, Organize pressed):* the rows were laid a row per beat and the sign card stayed where it was, out of the rows, the strip reading it last; the pair between the man and the pier drew as a solid line with the dashed setup bowed beside it. **One thing for Robert to draw:** on the wall itself an unlinked card looks like any other card without an arrow; a mark on the card ("on no arrow") would say what the reading says. A person-visible claim, so a mockup first.

- [ ] **D4 · The server's instructions and the desktop connector** (entry
  5; the round's first measure). "The connector carries no instructions of
  its own. Every other connector in the session does." The door sends
  `instructions` on `initialize` (checked live at 0.1.50 the same day).
  In the cueing session the same connector, enabled mid-session, brought
  its ninety-five tools and no instructions block either — and the two
  connectors whose instructions were present were on when that session
  started. So the likely cause is that the desktop app reads a server's
  instructions once, at the session's start, and a connector switched on
  later brings tools only.
  *Plan:* a test by hand, Robert's, since it needs the screen: a fresh
  no-folder session with plot_coder already on before the first message;
  ask the agent what it knew before reading a word. If the instructions
  arrive: the prompt's wiring step says "on before the session's first
  message", and the finding is procedure. If they do not: X1's handshake
  does not reach a desktop connector's agent, and the day's rules need a
  second carrier — the first tool reply of a session (the tail already
  says once-a-session advice) carrying the day's rules once.
  *Test:* the cold start, twice.
  *Not built:* Robert's hand at the screen. The prompt's wiring step should say "on before the session's first message" whatever the answer.

## N. Now — fixes a session can make, each with a test

- [x] **N1 · A delete says nothing about versions it did not move** (entry
  33). `describeShape` finds "the version behind X went with it" by index:
  a card that moved in the order. Deleting a card shifts the index of
  every card after it, so every version behind a later card "went with
  it". *Plan:* moved means the card's neighbours changed, not its number.
  *Test:* delete a card before a card with a version behind: no version
  line; reorder that card: the line.
  *Built:* moved means the neighbours changed, not the number.

- [x] **N2 · `choose_version` names what it carried** (entry 35). The
  version stepping forward takes the front card's arrows — by design,
  "what is true of the scene either way of it is said once, on the front
  card" — and the reply said "with its arrows" and named none, so a
  setup arrow into the alone version's card ("the man's card is thrown")
  became the knife version's payoff without a word, and no reading asks,
  because the fold is paid. *Plan:* the reply names each setup arrow and
  fold carried ("now pays off 'The man from the chain eats a small chips'
  — that was true of the other version; delete_arrow if it is not true of
  this one"), and the follows arrows as its place. The rule stands.
  *Alternative:* drop setup arrows on a choose and ask — loses a claim the
  writer made once for both versions. *Test:* the reply names the setup
  arrow and the fold; none when there are none.
  *Built:* the reply names each setup arrow and fold carried, with the question and the way off (`delete_arrow`).

- [x] **N3 · An open change line prints in the pages** (entry 50).
  `standInFor` prints an open card's words after `[Unwritten]` (R59) and
  ignores a change line's own open (R67, `changeOpen`), so "I don't know
  what changes yet" printed as `[Unwritten]` and nothing — the same as a
  forgotten scene. *Plan:* the change line's open words stand in the same
  way: `[Unwritten] Open, by the writer's word: I don't know what changes
  yet`. *Test:* Fountain, Markdown, text and FDX bodies for a card with
  `changeOpen`.
  *Built, and better than planned:* the change line's open prints under its own stand-in ("What changes is open, by the writer's word:") so an import reads it back as the change line's open and not the card's.

- [x] **N4 · A tail says "unchanged" only when the questions are the
  same** (entry 32). The tail compares counts; a question that changed its
  words (both ends open → one) counted the same and was called unchanged.
  *Plan:* compare the questions' kinds and ids, and say "the wall's
  questions changed shape (5)" when the count holds and the set does not.
  *Test:* tie one end of a thread with both ends open.
  *Built:* `reshaped` in the tail's change; "the wall's questions changed shape (N): …".

- [x] **N5 · A refused leave names the ids it wanted** (entry 36). The
  agent passed a thread's id alone; the question lists the thread and its
  card. *Plan:* the refusal lists the questions of that kind the wall is
  asking now, each with its ids, so the second call needs no reading; and
  the reply for a batch says which landed and which did not, first.
  *Test:* a leave with a thread's id alone.
  *Built:* the refusal lists the questions of that kind with every id, "pass them all".

- [x] **N6 · The cast check and the cast line agree about a card set
  aside** (entries 16, 22). A person only on a card set aside is not asked
  about (round twenty-three's call), but `list_board`'s cast line says "on
  no card" and the reading's clean line says "nobody in the cast on no
  card of the project" in the same breath. *Plan:* the cast line says "on
  no card in the film; on 'The bank' (set aside)"; the clean words say "of
  the film (a person only on a card set aside comes in where it does)".
  *Test:* both lines for the bank manager.
  *Built:* both lines say "on no card in the film" and why it is not asked.

- [x] **N7 · Undo's reply says what it did to the story's shape** (entry
  40). Every write's tail says what changed in the runs; undo's names
  cards and arrows. *Plan:* the same `describeShape` lines on undo, from
  the wall before and after. *Test:* undo a wired-in card: the run's line.
  *Built:* `shapeNote` on the undo reply.

- [x] **N8 · Words for the undo count and for redo** (entries 38, 39, 41,
  42). "10 steps of this session's can be taken back" is the size of a
  capped trail, counting down and not up; redo's "Nothing of mine to redo"
  reads as an empty stack where the door keeps none. *Plan:* "the last N
  changes of this session are kept, newest first (ten at most; the oldest
  go)"; and on the hosted door, `redo` answers "No redo through this door:
  it keeps no trail forward. Make the change again; a card made again is a
  new card." *Test:* both replies.
  *Built:* "the last N changes of this session are kept to take back … (ten at most; the oldest go)"; on the hosted door `redo` says it keeps no trail forward and a card made again is a new card.

- [x] **N9 · The tidy names what it moved and what it left** (entry 43).
  "Stayed where the writer put them" is not true of a card the app set
  aside; and the reply stated a rule and an exception without which was
  which. *Plan:* name each card set aside with what happened to it:
  "'The bank' would have been under the rows, so it is on a row beneath
  them; 'The pier, alone' stays where it is". *Test:* two aside cards, one
  under the rows.
  *Built:* each card set aside by name with what became of it; the same for unlinked cards.

- [x] **N10 · Words in the replies** — each one line, each with a test:
  "at upstairs at the Harbour Bar" (19): no "at" before a place that
  starts with one, or with in, on, outside, upstairs, inside, under, by;
  "Placed after the last card in story order" then "what comes before and
  after it?" (15): "Placed at the end of the rows, on no arrow"; the strike
  reply (25): "2 card(s) are now scene — the proposals struck" when they
  were proposed; "the 2 beats hold about 1 2/8 pages between them" (48):
  "the beats' own 1 2/8 pages are in no run"; the empty wall's clean line
  "a beat is marked" (8): an empty wall says "nothing to check yet"; the
  export's card count (54): "10 cards: 8 in the film, 2 set aside"; the
  runtime line (46): "about 7 2/8 pages — 1 scene measured, 7 read as a
  page each"; `list_projects`' description (7): "through the account door
  — a hosted connector, or PLOTCODER_EMAIL and PLOTCODER_PASSWORD in the
  environment"; `write_scene` and `edit_scene` (section 5, "the write of
  scene text"): the reply carries the first and last line as they landed
  and the line count, so a write is confirmed from its own reply and not
  from an export.
  *Built:* all eight, and the write's echo of its first and last line.

- [x] **N11 · The wrapped heading's numbers** (entry 51). A scene heading
  that wraps prints its number in both margins of both lines. *Plan:* the
  number on the first line only. *Test:* the paginator on a long heading.
  *Built:* the number on the first line only.

- [x] **N12 · The export and the emptying** (entry 10). The default
  `export_project` on the hosted door keeps the file with the project's
  files, and `empty_account` takes the files. *Plan:* `empty_account` and
  `delete_project` descriptions and replies say the kept exports go with
  the files ("fetch the link, or export_project with inline, first");
  `export_project`'s reply says "deleting the project or emptying the
  account takes it too"; the on-ramp's line says "export_project — and
  fetch the link, or pass inline — before empty_account". *Test:* the
  words; the account tool's reply lists the exports it would take.
  *Built:* both descriptions, the export's reply.

- [x] **N13 · The on-ramp and the day-one guide say the same first calls**
  (entries 6, 9, 45). `day-one.md` is cut from `guide.md` by heading, and
  the guide's "Call these first, in any order" is five calls without
  `list_projects`; `llms.txt` says six, the first three before anything.
  *Plan:* the guide's section says what the on-ramp says, in the same
  order, and the on-ramp's "the guide wins" names both files; the on-ramp
  says the day-one guide's size and its headings, so an agent can read one
  section ("for write_scene: Pages"); `guide.md` carries anchors the
  on-ramp can name. *Test:* the build's check that day-one matches the
  guide; a test that the on-ramp's first calls and the guide's are one
  list.
  *Built:* the guide's first calls are the on-ramp's six in order (day-one is cut from it, so it follows); the on-ramp says the page's size and that the Pages section is the one before `write_scene`. Anchors in the guide are still to do.

- [x] **N14 · Two exports that both call themselves the script** (entry
  52). *Plan:* the first line of each says what it is for: `export_text`
  "the script to read, as it prints"; `export_fountain` "the script for a
  Fountain editor, with the wall's notes"; the guide says which to reach
  for on "give me the script". *Test:* the descriptions.
  *Built:* "The script to read, as it prints" and "The script for a Fountain editor, with the wall's notes".

- [x] **N15 · Words in the guide and the checklist** (entries 11, 13, 14,
  18, 23): the treatment question for the premise says "what is true
  before it starts; for a series, what the series is about" (11); an
  unseen person who belongs to nobody yet goes on the film's open lines
  (13, the agent's own rendering, made the guide's); a thread's end known
  as a place but not as an outcome is the end card's change line (14);
  `endOpen` "the card where it comes out is not decided" (18); "asks once"
  → "asks on every reading until a beat is marked, or the question is
  left with a reason" (23) — and the checklist says that "mark none yet"
  *is* the reason: the agent leaves the beat question with those words,
  and the reading lists it under "left, for now" instead of asking on
  every reading (section 4, "mark none yet"). *Test:* the words;
  `list_workflows`' hint; a leave of the unmarked question with "mark
  none yet" lists it and stops the asking.
  *Built:* all five, and "mark none yet" as the reason to leave the beat question with.

## L. Leave until a second round asks

- **A card's when read against the order** (entry 29). A when is the
  writer's free text (R61); reading "the night after the funeral" against
  the arrows is a parser, and a wrong parse is worse than no check.
- **A place that is a spot of another** (entry 37). "Outside Doyle's" is a
  second place; one location's spots as one place is a design of its own
  (a place with parts), and one round has asked.
- **The open place's heading** (entry 47). "PLACE NOT DECIDED: THE MORNING
  AFTER - THE MORNING AFTER THE LAST NIGHT": the headline stands in for the
  place and the when repeats it. Round twenty-two left an open place's
  words as a slugline for Robert to draw; still his.
- **The row wrap at five** (entry 44). A row per beat wraps at five by
  round twenty-two's call; a run of six reading as five and one is the
  cost. Ask again if a round trips on it.

## Decided against, with the reason

- **A proposal that says "this card cannot be read either way"** (entry
  24). The card's open change line already says why, in the writer's
  words, and the agent's message says which cards it passed over. A second
  mark for "not proposed" is a claim about the agent's reading, not the
  wall's.
- **Tails that count across parallel calls** (entry 20). The server runs
  calls one at a time; each tail is true at its instant. An agent that
  fires three writes in one round reads three instants.
- **"All of it" from the short read** (entry 31). The short read is short
  on purpose; "everything undecided" is `read_wall` with
  `only: "questions"`, which lists the open things once (X3). The guide's
  sentence for "what is still open?" points there (N13 carries the words).
- **A copy on the writer's machine through the door** (entry 53). X4's
  design: the door keeps the file and hands a link with a checksum; a
  fetch is one line. The tool cannot write to a machine it is not on.
- **An open title printing its candidates** (entry 49). As round
  twenty-three decided: "Doyle's, or Last Orders, or The Dead Letter" is
  three candidates, and a title page is read as a claim. Still the owner's
  to overrule.
- **A thing undecided about a person and about the film both** (entry
  12). The writer chose ("it is about Mairead"); two homes for one sentence
  is a rule against itself.
- **The connector's name and the toggling** (entries 1 to 4). Procedure:
  the desktop app names a connector as it was added (plot_coder), and it
  is enabled per session from that session's own composer. The prompt's
  wiring step says both now.

## Every entry, accounted for

**Here as an item:** 17 → D1 · 26, 27, 30 → D2 · 21, 28, 34 → D3 · 5 →
D4 · 33 → N1 · 35 → N2 · 50 → N3 · 32 → N4 · 36 → N5 · 16, 22 → N6 ·
40 → N7 · 38, 39, 41, 42 → N8 · 43 → N9 · 7, 8, 15, 19, 25, 46, 48, 54 →
N10 · 51 → N11 · 10 → N12 · 6, 9, 45 → N13 · 52 → N14 · 11, 13, 14, 18,
23 → N15.

**Left, above:** 29, 37, 44, 47.

**Decided against, above:** 1, 2, 3, 4 (procedure), 12, 20, 24, 31, 49, 53.

**From the sections after the log:** "a plant that immediately precedes
its payoff" → D2; "a thread cannot run through a version behind" → D1;
"choose_version carries setup arrows" → N2; "no redo here" → N8; "an
unwired card gets a story position" → D3; "the short read does not list
open fields" → decided against; "leave_question wants every id" → N5;
"the script is two tools" → N14; "the connector ships no instructions" →
D4; "nobody says the word sell to her face until the very end" (section
6, the last line) → N15: the guide says a rule the whole film keeps is
the premise's, and the checklist's premise question says so.
