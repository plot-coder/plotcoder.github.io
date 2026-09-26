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
- [ ] **10 · A plant true of only one version of a scene has no stated
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
- [ ] **19 · Nothing on the wall can say "true of one version only".** The
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

## Every entry, accounted for

1 → decided against (the prompt's) · 2 → held · 3 → fixed · 4 → held · 5 →
decided against · 6 → fixed · 7 → fixed · 8 → held · 9 → held · 10 → guide, planned · 11 → held · 12 → held · 13 → fixed · 14 → fixed · 15 → fixed · 16 → decided against · 17 → held · 18 → decided against · 19 → with 10 · 20 → fixed · 21 → fixed with 13 · 22 → planned · 23 → decided · 24 → decided against · 25 → held · 26 → held · 27 → fixed · 28 → fixed · 29 → decided against.
