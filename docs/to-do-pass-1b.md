# Pass 1b — the working list

Pass 1b ran 2026-09-26 (`blind-runs/prompt.md`, "Doyle's" to a complete
script from notes, through the desktop connector at 0.1.53). This list is
kept **as the run goes**, on Robert's word the same evening: "keep taking
notes about where their friction points are and fixing them, especially
in setup". Every entry of the log is accounted for below as it arrives —
fixed, decided against with the reason, or held for a decision — and the
report is filed verbatim as `blind-runs/pass-1b-report.md` when the agent
hands it over.

The way the list is worked is `docs/to-do-round-twenty-two.md`'s: plan,
ask, build, test, for every item; a fix that a person will see gets a
mockup; a fix to the kernel or the server gets a test.

## The way in (entries 1 to 8, from the first message)

Before those, one thing outside the app: the agent's own harness blocked
`empty_account`, so it deleted the one project instead after an export.
Not the app's; the prompt's next head says so.

- [ ] **1 · Two orderings for the first calls.** The on-ramp says
  `new_project` comes before the three reads when the writer told the
  agent to start its own; the prompt said make the first calls before
  changing anything. *The prompt's, not the app's:* the on-ramp says the
  writer's word wins, and the agent did what it said. Decided against
  changing the app; the next prompt says "the on-ramp's first calls, then
  your own project" in one line.
- [ ] **2 · Tool descriptions invisible until a tool is loaded by name.**
  "The on-ramp says the tool descriptions carry the rest, and know the
  server by its tools; in this session a tool's description is invisible
  until I load that tool by name." The desktop app defers a connector's
  tools past a count; the on-ramp assumes names and descriptions arrive
  together. *Plan:* one sentence on the on-ramp — if your session shows
  names only, load a tool to read what it takes; the day-one guide says
  what the first six take. *Held* until the run says whether it cost more
  than the one stop.
- [x] **3 · A sentence cut off in `list_projects`.** "who has a wall open:
  who_is_here waits for presence and says" read as truncated. *Fixed:* the
  hosted door's line now says "who has it open: not known until
  who_is_here asks".
- [ ] **4 · The inline project export, 51 KB in eleven lines, refused by
  the client as too large.** The tool's description warns the link form
  dies with the account, so inline was the right call, "and it is
  unwieldy". *Held:* through the connector a file on the agent's own disk
  is the third way (the agent recovered it from one); whether the reply
  should be the link by default on the hosted door, with the warning, is a
  decision for the list's end.
- [ ] **5 · `list_words` defines a beat as "one of the eight to fifteen big
  turns"** while the on-ramp forbids an opinion on how many beats.
  *Decided against:* the eight to fifteen is the method's own claim (the
  house method, R20); what the app has no opinion on is how many *this*
  wall should have (D21). The definition says what a beat is; the reading
  never counts them against it. The words could say so in a clause.
- [x] **6 · An empty wall's reading lists "a beat is marked" under
  "checked and clean".** No cards, no beat: the clean list reported the
  opposite of the fact. *Fixed:* with no cards the checks line is one
  phrase, "nothing to check yet: no cards", and no list.
- [x] **7 · The day-one guide cites "(R74)", "(pass 1a, entry 95)" and
  "(round twenty-four)"** — the builders' notes left in a page a stranger
  reads. *Fixed:* the three citations are out of the skill, the public
  guide and day-one regenerated from it, and a test keeps every
  requirement, pass and round number out of the skill, `llms.txt` and
  `wiring.md` (the tool descriptions already had one).
- [ ] **8 · The connector's instructions, the on-ramp and the day-one guide
  say the first calls and the open-field rules three times over.** "I read
  all three to find out they agree." *Held:* the repetition is on purpose
  — an agent that reads only the handshake, only `llms.txt`, or only the
  guide still gets the rules — but each could say in a line that the
  other two say the same, so the third read is a choice.

## The asking (entries 9 to 12)

- [ ] **9 · "When a scene happens, where that matters."** The treatment
  question's hint says nothing about which whens matter to a writer, so
  the agent asked about all of them. *Plan:* the hint says to ask it once,
  of the whole film — which whens matter here (a night, a day count, a
  year) — and then only those per scene. *Held* until the list's end.
- [x] **10 · A plant true of only one version of a scene has no stated
  home.** The man's card pays off only in the "alone" pier. The guide says
  a plant true either way goes on the front card and the chosen version
  inherits its arrows; a plant true of one version it does not mention. The
  home exists — a setup arrow may land on a card behind another, since a
  setup arrow is a claim and not a place in the story — and the guide does
  not say so. *Plan:* one sentence in the guide's versions paragraph.
- [ ] **11 · Whether a thing seen early is a card or a plant inside one.**
  "Your notes don't say the sign is a scene at all." The guide reads "seen
  early, not decided where" as an unlinked card; the app's vocabulary
  forced the question. *Held:* see what the build does with the answer
  ("I don't know yet — leave it open") — a thread (R60) with its start
  open is the home the guide names for a thing whose first sighting is
  not known, and the agent may reach it.
- [ ] **12 · A dead man whose funeral is a scene.** The guide sends him to
  the film's open lines "until the writer knows whom he matters to"; he
  may be wholly decided and merely never on screen, and the app has
  nowhere for him but a person's notes or an undecided list. *Held:* the
  premise is the home for what is true before the film starts, and a
  person's notes for whom he matters to once known; whether the guide
  should say "a person never seen goes in the notes of the person he
  matters to, or the premise" is the decision.

## The build and the reading (entries 13 to 25)

- [x] **13 · `create_cards` summarises each card in a line and leaves out
  the fold, the open cast, the open change line and the open when.** "The
  man from the chain" came back as its cast and not a word of its fold;
  only the last card's reply is in full; `list_board` had to confirm the
  opens landed. With 21 (a write's tail before the first reading only
  counts questions), no create reply said whether an open field landed.
  *Plan:* each card's line in the reply names its fold and every open on
  it, in the words that landed. Server, with a test.
- [x] **14 · "Made 8 of 8 cards, each wired after the one before it"** when
  the eighth was born set aside and has no follows arrow. *Plan:* the
  sentence counts the wired ones and names the ones born aside or as a
  version. Server, with a test.
- [x] **15 · A cut scene needs a change line.** The bank scene's notes never
  say what changes in it; the writer's cut sentence was parked in the
  change-line slot. "There is no way to say unstated that is not
  undecided." *Plan:* a card born set aside, or set aside later, needs no
  change line and is not asked for one — it is out of the film. Kernel
  and server, with tests; the guide says so.
- [ ] **16 · A thread's open ends are the writer's word, and the reading
  asks about them** while every other "I don't know" is listed and not
  asked. *Decided against, by R60:* the loose end is the one question a
  fold cannot ask, and it is asked from the end the writer left open on
  purpose — the thread is where a thing is known to pay off before it is
  known to be first seen. The reading's line could say why in a clause.
- [ ] **17 · The sign, held as a thread through no card and two open
  lines: one thing in two places.** *Held:* an empty thread with both
  ends open asks what the open line already says; whether the thread
  should wait for a card is the decision.
- [ ] **18 · The fish knife's thread runs only through the version behind;
  the reply said the reading asks nothing of that end, and the reading
  asked about the other end.** *Decided against:* the start is open by the
  writer's word and is asked as every loose start is; the reply's "asks
  nothing of that end" was about the tied end on the card out of the film.
  The reply could say both halves in one sentence.
- [x] **19 · Nothing on the wall can say "true of one version only".** The
  man's card pays off on the front pier only, and choosing the other
  version would carry the payoff onto a scene where no card is thrown.
  *Same as 10:* the setup arrow may land on the version behind; the guide
  says so once 10 is done, and `choose_version` should not carry a setup
  arrow whose payoff the writer drew onto the other version. Check the
  carry rule with a test.
- [x] **20 · "No card is marked as a beat" above five proposed turns.**
  *Plan:* the unmarked question says "5 proposed, none kept yet: set_rank
  beat keeps one" when proposals stand. Kernel, with a test.
- [ ] **22 · The manager, on the aside card only, is "(on no card)" in the
  cast line and clean in the checks.** The cast line has words for this
  case ("on no card in the film: only on a card set aside…") and did not
  use them. *Plan:* find why — a test on a person cast only on a card born
  aside.
- [ ] **23 · Mairead's husband: not a card, not about the film.** Held in
  her open words, "a guess at a home". *Decided:* the right home; the
  guide's line on a person's open says "anything undecided about them,
  including someone who belongs to them".
- [ ] **24 · Organize with five proposed turns: "no beats yet, so nothing
  sets the rows".** *Decided against:* a proposed turn is a scene until
  kept (R71). The reply should say "5 proposed turns are scenes until
  kept" rather than "no beats yet".
- [ ] **25 · A card appears twice under open**: in the grouped line ("the
  change line, on 3 cards") and again with its other opens. *Held:* the
  grouping is on purpose (round twenty, entry 22) and the card's own line
  carries only what is particular to it; the head could say "each card
  once, after the shared lines".

## The directions (entries 26 on)

- [ ] **26 · Keep and strike are two calls, and neither reply says what
  the two beats now bound.** "The tail names the shape change after a
  move or a cut, not after a rank." *Plan:* a rank's reply says the runs
  the kept beat now bounds, as a move's does. Server, with a test. Held
  until the run's end, with the other tails.
- [x] **27 · `set_order` on an order that is already the order tears out
  and redraws every follows arrow with new ids, and says a reordering
  happened.** *Fixed:* an order that is already the order changes nothing;
  the reply says so and that the arrows and their ids stand. Test.

- [x] **28 · One sentence decided two things held in two places** — the
  thread's open start and the open line about whether the sign is a scene
  at all — "and nothing links them, so I had to remember the line
  existed". *Fixed:* tying a thread's end names the open lines about the
  film that carry the thread's words, and says strike_open_line if the
  decision closed one. Words, not sense; the striking stays the writer's.
  Test.
- [ ] **29 · The first Friday's corner is not folded for the sign** though
  the thread starts there: "a card that plainly plants the sign shows no
  plant until the end is chosen". *Decided against, by the combine log:*
  a fold asks where it pays off and the thread already asks where it
  comes out; folding the start would ask the one question twice. The
  card could show the thread's start on the wall (R60's yarn) — a drawing
  for Robert, not a rule.

## The writing (entries 30 to 38)

- [x] **30 · The camera check reads the [[notes]], which never print.** All
  eight marks across four scenes landed on notes holding the word
  "decided", the agent's word for what the writer had not decided. *Fixed:*
  a note is not the page; the camera never reads it. Test.
- [ ] **31, 32 · Two of four written scenes questioned for not doing what
  their cards say** — "she knows the number now" against "Nine. Ten.
  Eleven."; "leaves" against "lays". Words, not sense, as the head says;
  still half the written scenes asked. *Held for Robert:* the threshold
  (fewer than half, on change lines of seven or eight words) is the
  question; "none of its words" would have asked neither. The mockup named
  both; the run is the measure.
- [x] **33 · "PLACE NOT DECIDED: THE MORNING AFTER - THE MORNING AFTER".**
  A placeless card whose when is its own headline's words printed them
  twice. *Fixed:* once. Test.
- [ ] **34 · A maybe on the cast cannot be written**: the page has no
  question mark the way the card does; the only home was a note. Pass 1a's
  34 and 35 again. *Held for Robert:* the page's form for a person who may
  or may not be in the scene.
- [ ] **35 · The two-places warning** (a note and the card's open words for
  one undecided thing) "is true of every scene I wrote. It was said once."
  *Decided:* once a session is the rule for advice (round twenty-two); the
  agent read it once and applied it. Nothing to change.
- [x] **36 · "2 lines the camera cannot see (decided)"** read as a status,
  not the offending word. *Fixed:* the reply says "by the word "decided"".
- [ ] **37 · A when left open prints a heading with no time, the same as a
  when nobody said.** In Fountain the difference is only in the note.
  *Held for Robert:* whether an open when prints a mark on the heading as
  an open place does ("TIME NOT DECIDED"), or stays a note.
- [ ] **38 · One "how long" gives three numbers.** *Decided against, as in
  pass 1a:* the reply says which one to tell the writer; the other two are
  what it is made of and what it is read against.

## The exports and the reading of the whole (entries 39 to 48)

- [ ] **39 · No disk on this door: three whole files in replies, saved by
  the agent; "name it for the project" gives three files called Untitled.**
  *Held for Robert:* whether the hosted door's exports answer with a link,
  as `export_project` does, with its warning that the link dies with the
  account.
- [x] **40 · The title page is "Untitled" and a date; nothing says the title
  is open or names the candidates.** *Fixed:* a title not decided prints
  the writer's words under the stand-in in every export — "Title not
  decided: Doyle's, or Last Orders, or The Dead Letter" — on the Fountain
  and Final Draft title pages, under the Markdown title, and centred in
  plain text. Tests.
- [ ] **41, 42 · Of everything held open on the wall, only an open change
  line and an open place reach the page; the rest vanish silently, and the
  version behind and the cut scene are in no file and unmentioned.** *Held
  for Robert:* what a script should carry of the wall's opens — a page at
  the end, "what is not decided", in the producer's Markdown at least; and
  whether the Markdown should say a scene is held two ways.
- [ ] **43 · The export replies do not relay the lock advice; the
  descriptions say to.** *Decided against, as pass 1a decided:* the
  descriptions carry it once and the agent relayed it, which is what
  happened.
- [ ] **44 · Markdown numbers beats "## 1." and scenes "### 1 ·", and prints
  a synopsis line for scenes and none for beats.** *Held for Robert:* one
  numbering (the scene's) on both, and the beat's headline as its heading
  is the reason there is no synopsis; the description says so.
- [ ] **45 · "What the app says of the script against the wall" is two
  word-count questions; nothing says who is on the pages, what recurs, or
  which half of the film is written.** With **46** (the absence check
  counts cards, so a person on no written page is clean) and **47** (the
  duplicate check reads headlines, not pages). *Plan for Robert:* two fact
  lines in the reading's pages head — who is on the written pages, by cue,
  against their cards ("Declan: on 0 of 4 written pages; his cards
  unwritten"), and which stretch of the film is written and which is
  guess. Words, not sense, like R74's lines. A duplicate check over pages
  is a design of its own.
- [x] **48 · The setups line promises "where the plant's words land" and
  lists a setup with nothing when the payoff is unwritten; the reason was
  in the checks line at the foot.** *Fixed:* the setup's own line says
  "not read — the payoff is unwritten", or that the fold has no words.

## What the writer must decide (entries 49 to 52)

- [ ] **49 · The reading lists opens in storage order, not in any order of
  dependence.** "Nothing says that now-or-1987 gates the man from the
  chain." *Held for Robert:* an order of dependence is a reading of sense;
  the app's list is by where things live. The agent's ordering was the
  work the pass measured.
- [ ] **50 · "What is still open" is answered in three places of one
  reading**: under open, under "two versions, not chosen", and the thread
  ends under the questions. *Plan for Robert:* the at-a-glance head counts
  the versions not chosen and the loose ends beside the open things, so
  one line says how many decisions stand, and where each kind is listed.
- [x] **51 · The bank scene's change line listed among things not decided,
  though the writer decided it by cutting it.** *Fixed with 15:* a card
  born set aside needs no change line, so nothing is parked there.
- [ ] **52 · No tool says which opens stop the pen and which do not.** "A
  scene can be written with its opens standing." *Held for Robert:* a
  card's open change line, open cast and open place are what stop a
  page; a when, a maybe, a length do not. Whether the reading should say
  "N of the unwritten scenes wait on a decision" is a design of its own.

## Deciding the film (entries 53 on)

- [x] **53 · Deciding a whole-film open is two calls, and the strike's reply
  says the decision "belongs in that field's own tool" without saying
  which.** *Fixed:* the reply names the homes — the premise for a fact
  true of the whole film, set_when, groups for the acts, set_plant, a
  person's page — so the second call is not a guess.
- [ ] **54 · The premise is five sentences and one line: a fact about the
  whole film has one home, and it is a paragraph.** *Decided:* the
  premise is where what is true before the film starts lives (round
  twenty); a paragraph is what it is. The wall shows it above the logline
  and every script prints it.

- [x] **55 · No state for "written, change undecided": a page with no
  change line counts like any other and leaves the unwritten count, while
  the open words stand on its edge.** *Fixed:* the reading's pages line
  names every written scene whose change line is still open — "a page and
  no turn" — and the reading carries their ids. Tests.

- [x] **56 · The camera check explains itself only when it marks
  nothing.** *Fixed:* what the check is rides the first reply either way,
  once a session, and says it never reads a cue, a speech or a note.
- [ ] **57 · The verb list catches "decided" and not "know".** *Decided
  with 30:* a note is no longer read at all; "know" (first person) is not
  an action line's verb, and "knows" is on the list.
- [ ] **58 · Writing a scene shortened the film by an eighth, said as a
  fact.** *Decided against:* it is a fact, and the reply says whose number
  moved (an unsized card read as a page; the page measured 7/8).
- [x] **59 · The reply counts the scene written and the wall lists its
  change line as open, and nothing joins the two.** *Fixed with 55:* the
  write reply says "a page and no turn" with the open words, and the
  reading's pages line names the scene.

- [x] **60 · A written scene with an open change line is invisible to the
  pages-against-the-wall reading**; "written" and "change line open"
  never meet in one sentence. *Fixed with 55 and 59.*

- [x] **61 · Entry 19 came due: choosing the version carried the man's-card
  payoff over, the reply asked "true of the scene either way, or of that
  version only?", and answering cost an arrow and raised an unpaid fold.**
  The reply did its job. *Fixed, with 10:* the guide's versions paragraph
  now says a payoff true of one version only is a setup arrow onto that
  version's own card, which the other never inherits.
- [ ] **62 · Every camera mark this session was on a note.** *Fixed with
  30*, which the run did not see: the door carries 0.1.53 and the fix
  lands with the release after the run.

- [x] **63 · "Put it back" is three undos, and the preview names the change
  by its internal name, "set_text", not by the card.** The stack is the
  rule (one change per call, R33); the naming is fixed: a written page is
  "the page of "X"" in the preview, the undo and the since line.
- [x] **64 · The undo of a version choice said "Undid choose_version" and
  nothing else.** *Fixed:* the undo's reply says which card is the scene
  again, which is behind which, and what is set aside or back in the film.
  Test.

- [x] **65 · No redo through this door; "forward again" is the changes
  made again by hand.** The tool's description says so; the guide's undo
  paragraph said only "Redo is not kept there". *Fixed in the guide:* it
  says plainly what forward again costs through the hosted door.
- [ ] **66 · Order matters and nothing says so: writing the page before
  deleting the arrow raised an "unsaid" question that lived one call.**
  *Decided against:* a question that stands for one call is the wall
  reading the wall as it is; the tail that says a question came and went
  is what a reader sees, and it is true.

- [x] **67 · A card brought back from aside is unwired, so it is "the last
  card of the story" and raises an unlinked question until the move
  lands; two tools with no way to say both at once.** *Fixed:* set_aside
  with aside false takes after or before, and brings the card back placed,
  in one call. Test.
- [ ] **68 · Under the cut words, the change line had been the placeholder
  "What changes?" all along.** *Decided, with 15:* a card born set aside
  now needs no change line and holds nothing there; a placeholder on a
  card out of the film is never printed and never asked. The reply that
  reported "What changes?" → the new line was telling the truth.

## Every entry, accounted for

1 → decided against (the prompt's) · 2 → held · 3 → fixed · 4 → held · 5 →
decided against · 6 → fixed · 7 → fixed · 8 → held · 9 → held · 10 → guide, fixed · 11 → held · 12 → held · 13 → fixed · 14 → fixed · 15 → fixed · 16 → decided against · 17 → held · 18 → decided against · 19 → guide, with 10 · 20 → fixed · 21 → fixed with 13 · 22 → planned · 23 → decided · 24 → decided against · 25 → held · 26 → held · 27 → fixed · 28 → fixed · 29 → decided against · 30 → fixed · 31, 32 → held · 33 → fixed · 34 → held · 35 → decided · 36 → fixed · 37 → held · 38 → decided against · 39 → held · 40 → fixed · 41, 42 → held · 43 → decided against · 44 → held · 45, 46, 47 → planned for Robert · 48 → fixed · 49 → held · 50 → planned for Robert · 51 → fixed with 15 · 52 → held · 53 → fixed · 54 → decided · 55 → fixed · 56 → fixed · 57 → decided · 58 → decided against · 59 → fixed with 55 · 60 → fixed with 55 · 61 → guide, with 10 · 62 → fixed with 30 · 63 → fixed · 64 → fixed · 65 → guide · 66 → decided against · 67 → fixed · 68 → decided with 15.
