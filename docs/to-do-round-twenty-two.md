# To do — everything material from round twenty-two

Written 2026-09-20, from the other session's report
(`blind-runs/round-twenty-two-report.md`: ninety-five entries and its
sections 3 to 6). Every entry is accounted for at the foot of this file:
fixed, built, here as an item, or not ours, with the reason.

**The pattern for every item, in this order, and no skipping:**

1. **Plan** — what we would change, and where.
2. **Ask: is this the best we can do?** — in writing, before building. For
   anything a person will see, that means a mockup on the app's own paper
   beside what ships, and Robert's word. For tools and plumbing it means the
   alternatives named and the reason this one wins. If the honest answer is
   "no", the plan changes before anything is built.
3. **Build** — through the kernel, one commit per item.
4. **Test** — a unit test for the kernel or the server; an end-to-end spec
   only for a new door; and the change looked at in the app when a person
   can see it. Then the item is struck here, with the commit.

Status marks: `[ ]` open · `[~]` planned and asked, waiting on Robert ·
`[x]` built and tested.

---

## A. Land what is built (not design; do first)

- [x] **A1 · Release and redeploy.** Released as **0.1.44** 2026-09-20 (#133; 0.1.43 was already taken); the function and the Worker redeployed the same hour. Tested: `initialize` answers `"version":"0.1.44"`, ninety-one tools with `set_aside`, and the root says to choose No sign-in.
  *Plan:* `npm version patch` from a current `main`, push the tag, wait for
  npm, bump the pin in `supabase/functions/mcp/index.ts`, redeploy the
  function, redeploy the Worker in `cloudflare/mcp-door` (its root text
  changed). *Best we can do?* Yes; it is the handover's procedure. The deploys
  are Robert's to run (the permission layer declines them from a session).
  *Test:* one `initialize` against `https://mcp.plotcoder.com` —
  `serverInfo.version` is now the package's own — and `curl` of the root for
  the "No sign-in" sentence.
- [~] **A2 · Take the fallback out of `~/.claude.json`** *(done 2026-09-20; backup `~/.claude/backups/claude.json.before-removing-fallback`)* **, and turn the
  test-account connector off outside a round** (entry 1). The cueing
  session's mistake; the backup is `~/.claude/backups/claude.json.before-round-22`.
  *Test:* a fresh session lists one PlotCoder server, or none.
- [x] **A3 · The clean line's "wired" count is still wrong** *(built 2026-09-20: the reading returns `wired`, the server prints it; tested in `readWall.test.ts`)* (entry 20, the
  last of it). `read_wall`'s "not asked until half the cards are wired: 2 of
  9 are" counts the ends of setup arrows and every card on the wall; the
  reading itself excludes setup arrows and now counts the film's cards.
  *Plan:* the server's line uses the reading's own rule (follows arrows, the
  story's cards). *Best?* Better: have the reading return the two numbers so
  the server cannot disagree with it. Do that. *Test:* a wall with one setup
  arrow and one card set aside; the line's numbers match the reading's.

## B. The hosted door has no session (25, 26, 37, 52, 66, 92, 93, 94, 95)

Patched the night of the round — there the tail quotes from the first
write, once-a-session advice is not said, presence is not claimed. The
patches are honest; they are not the answer.

- [x] **B1 · A session for the hosted door.** *(built and tested 2026-09-20, changed at the asking: **one table and no secret.** The row is the writer's own — the door already signs in as the writer on every request, so row-level security by user is the wall and the function needs no service key. The memory carries the last reading and the changes since as well as `readOnce` and `once()`, so a `leave_question` that misses says what the agent last read. The SDK's stateful mode keeps the session in the transport, which here dies with the request, so the door sets `Mcp-Session-Id` itself. An id with no row is a new session; no id, no account or no table is the patched behaviour. Not carried: the undo trail — `undo` through the door now says so — and presence in the tail. `src/board/agentSession.js`, R48's "A session". **The migration is applied (2026-09-20) and the store round-tripped against the real table as the test account; the migration history was repaired to match the repo. Still to do: release, bump the pin, redeploy the function (the Worker forwards every header both ways and needs nothing); then one check that the desktop connector sends the id back.**)*
  *Plan:* MCP's Streamable HTTP has a session id (`Mcp-Session-Id`). The
  function issues one on `initialize` and keeps a small row per session — has
  it read the wall, which advice it has said — in a table behind the service
  role, expired after a day. `readOnce` and `once()` read that instead of
  process memory when hosted.
  *Best we can do?* Alternatives: (a) leave the patches — costs nothing, but
  call 2 (count until the first reading) is simply off for every hosted
  writer, which is now the main door; (b) have the client carry the state —
  it cannot, the client is not ours; (c) a long-lived host (Fly) instead of a
  function — a session for free, and a machine to keep alive, which Robert
  chose against on 2026-09-19. The table is the smallest thing that gives
  the hosted door the behaviour every other door has. **Ask Robert before
  building: it adds a table and a secret to the function.**
  *Test:* `plotcoder-http.test.mjs`, two requests with one session id — the
  first write counts, a `read_wall`, the next write quotes; advice said once.
- [x] **B2 · "Who has this wall open?" through the hosted door** *(built 2026-09-20 as `who_is_here`, ninety-two tools: waits up to a second and a half for presence; the wording is `src/board/presence.js`, pure and tested; checked live after the next deploy)* (93, 94).
  *Plan:* in `list_projects` only, when hosted, join the channel and wait for
  presence to sync (up to about a second and a half) before answering; say
  the agent's own entry apart ("and you, as an agent, as Robert"). Writes
  stay as they are: no waiting on forty writes.
  *Best?* Alternative: a tool of its own, `who_is_here`. Better than hiding
  the answer in `list_projects`, which the agent found only through the
  guide (93) — and it keeps `list_projects` fast. **Take the tool.** *Test:* a
  unit test with a faked channel: synced with one person, synced with
  nobody, never synced ("could not see in time").
- [x] **B3 · A silent tail reads as "unchanged" or "not computed"** (66, 92).
  *Plan:* when a write leaves the wall's questions as they were, the tail
  says so in four words: "; the wall's questions unchanged (1)". *Best?* The
  risk is noise on every reply, which round thirteen complained of. It is
  one clause, it carries a number an agent uses (62: "1 now" was enough to
  work out the rest), and it ends a recurring doubt. Yes. *Test:* a write
  that changes no finding carries the clause; one that does, does not.
  *(Built 2026-09-20: "; the wall's questions unchanged (N)"; tested. Note for a later pass: `recolor_note` and a few other writes carry no tail at all.)*

## C. The connector screen (the round's first finding)

- [~] **C1 · The desktop app says OAuth is "Detected" on a door with none.** *(the probe needs Robert at the connector screen; the OAuth proposal is still to write)*
  The words are fixed (the on-ramp, the door's root, the prompt say "choose
  No sign-in"). *Plan:* find out what makes the app say "Detected" and stop
  sending it: try the unsigned reply without `WWW-Authenticate`, then as
  `403`, against the screen. *Best?* The real answer would be for the door
  to speak OAuth, so a writer signs in with their PlotCoder email in a
  browser and no password sits base64 in a header. That is R48's next step
  and a piece of work of its own; **write it up as a proposal for Robert,
  do not build it here.** The probe is an hour and removes a wrong prompt
  for everyone meanwhile. *Test:* Robert adds the connector from cold and
  the screen preselects No sign-in, or at least does not say Detected.
- [ ] **C2 · Measure the connector alone** (entry 1). Round twenty-three
  wires the connector and nothing else.

## D. What the agent reads (6, 8, 29, 41, 43, 83, 84, 86, 87, 89, S3)

- [x] **D1 · One view of everything undecided** *(built 2026-09-20: `describeUndecided` in the reading module, pure and tested — project fields, words shared by three cards grouped, then each card once; blanks by field under "not said yet". Changed at the asking: blanks are listed by field, not per card — they have no words, and four lines read shorter than forty.)* (41, 43, 67, 86, 89, 24).
  "What is still open?" took three calls and a merge, and the blank things —
  no when, no length, a blank place beside an open one — are nowhere.
  *Plan:* the reading's open section is regrouped **per card** (its open
  words, its open fields, and its blanks: no place, no when, unsized, no
  cast), fields of the project first; the three counts at the head stay.
  *Best?* Alternative: a new tool, `whats_open`. No — the fourth round has
  said the reading and the records are two reads; a third read is the wrong
  direction. Regroup the one we have. **Whether a blank counts as "open" is
  a claim about the writer** (D21: the app counts and stays quiet): list
  blanks under their own head, "not said yet", never under "open, by the
  writer's word". *Test:* `readWall.test.ts` for the grouping;
  `plotcoder-mcp.test.mjs` for the text, with a card that has one of each.
- [x] **D2 · The cast and the places in the reading** *(built 2026-09-20: two lines, the film's cards only; tested)* (29).
  *Plan:* `read_wall` ends with two compact lines — who is in the film and on
  how many scenes, where it happens and how often — and drops "the cast and
  the places are list_board's". *Best?* It lengthens a long reply. But
  "read the wall back to me" is the most common thing a writer asks, and it
  should be one call. Yes, compact. *Test:* the two lines, on the seed wall.
- [x] **D3 · A short read: only what the wall asks** *(built 2026-09-20: `read_wall { only: "questions" }`; tested under fifteen lines with every question in it)* (83).
  *Plan:* `read_wall { only: "questions" }` — the three counts, the
  questions, what is left, nothing else. *Best?* Alternative: make the tail
  do it (B3 does, for one write). This is for "is there anything I owe?",
  which cost three hundred lines to answer "no". Yes. *Test:* the reply is
  under fifteen lines on the seed wall and carries every question.
- [x] **D4 · The runtime sentence** *(built 2026-09-20: `runtimeBlock`, one labelled line per number, the one to use first, shared by `list_board` and `read_wall`; tested)* (84, 87, 73).
  *Plan:* one line per number, each labelled: the estimate; what it is made
  of; against the target; and the sketch's second number as "if the sketch
  ran to the page it was read as". *Best?* Yes — it is the same facts, set
  so that the one to use comes first. (Eighths stay unreduced, 88: the
  industry's unit, and the words sheet says so.) *Test:* snapshot of the
  block with a sketch and an open target.
- [x] **D5 · The guide, for someone holding a connector** *(built 2026-09-20. Changed at the asking: not a reshuffle of 46 KB — a reading map at the top (read now / before you ask / leave until the writer says the words / not for you), the wiring paragraph moved under "The account, the app, or the file", and the treatment questions named where the first calls are, in the guide and the on-ramp. Nothing cut. Its test is the next blind run's section 3.)* (6, 8, S3).
  A third of what the agent read did not apply: wiring, the dev app, the
  file, locks, revisions, series, video, import.
  *Plan:* the guide opens with **day one** — the cards, the cast, open
  things, threads, versions, set aside, the reading — and everything else
  sits under heads that say who they are for ("production: only when the
  writer locks numbers"). The treatment questions are named in the on-ramp's
  first calls, not under "Cast".
  *Best?* Decided the other way in seventeen, when every agent came in
  through a clone. A connector is now a door, and the guide is 42 KB read
  whole before the first call. Reorder, do not cut: nothing is lost, and
  the round after measures the read. *Test:* the next blind run's section 3.

## E. Orders, arrows and scenes (30, 31, 33, 61, 63, 71, 77, 91)

- [x] **E1 · Set the order from a list** *(built 2026-09-20: `set_order`, ninety-three tools, one undo; `move_scene` on a wall with no arrows draws the chain from the rows and says so; both tested. Built at the server from the arrow commands, as `move_scene` is — no new kernel command.)* (31). One swap took seven calls,
  and `move_scene` refuses a wall with no follows arrows.
  *Plan:* `set_order { ids: [...] }` — draws the follows chain through the
  cards named, in one step one undo takes back; cards not named keep their
  arrows among themselves. And `move_scene` on a wall with no arrows draws
  the chain from the rows first, saying so, instead of refusing.
  *Best?* Alternative: only the second half. But "the order is: A, B, C" is
  what a writer says, and there should be a tool shaped like the sentence
  (D24). Both. *Test:* kernel test for the chain and the undo; server test
  for the reply naming the order.
- [x] **E2 · An arrow's reply says what the story now runs** *(built and tested 2026-09-20)* (33).
  *Plan:* `create_arrow` (follows) ends "the story now runs: A → B → C" when
  the chain is short, or the three cards around the new arrow when long.
  *Best?* Yes; it is what `move_scene` already does. *Test:* server test.
- [x] **E3 · A setup's distance on a wall with no order** *(built and tested 2026-09-20)* (30).
  *Plan:* the line says "about 6 pages later, by the rows: the story order
  is not set". *Best?* Yes. *Test:* `describeSetups` with no follows arrows.
- [x] **E4 · Wiring a scene in tidies the whole wall** *(drawn, Robert chose A, built 2026-09-20: `create_note` with `after`, `move_scene`, the move across boards and `set_order` no longer tidy; the card lands beside the one it follows; tested that no other card moves)* (63). Described now;
  still nine cards moved for one added.
  *Plan:* **decide, do not build yet.** Options: (a) as it is; (b) tidy only
  the row the card lands in; (c) no tidy — the card lands beside its
  neighbour and `organize` is the writer's. *Best?* (c) respects a wall a
  person arranged by hand, and costs an untidy wall after an agent's build.
  Rounds fourteen and sixteen asked for the tidy. **Mock the three on one
  wall and ask Robert.**
- [x] **E5 · A tie's reply carries what it made** *(built and tested 2026-09-20: the folded card's id and the arrow's)* (61). Tying a thread can
  fold a card, name the fold and draw an arrow; the reply is prose and the
  arrow's id is not in it. *Plan:* the ids in the reply's text. *Best?* Yes.
  *Test:* server test on the tie that makes a fold.
- [x] **E6 · Insert a line into a scene** *(built and tested 2026-09-20: `edit_scene { insert, after | before }`)* (77). "Add a line after X" is only
  "replace X with X plus the line". *Plan:* `edit_scene { after: "…",
  insert: "…" }` (and `before`), the text found once, the new paragraph set
  off by a blank line. *Best?* Yes; the reply says "inserted", not "changed
  one line". *Test:* server test, and the refusal when the anchor occurs
  twice.
- [x] **E7 · What a written scene's line count counts** *(checked true first — a note measures the same as none — then said in the reply; tested 2026-09-20)* (71). *Plan:* the
  reply says notes (`[[…]]`) neither print nor count. *Best?* Yes. *Test:*
  a scene with a note measures the same as without.
- [x] **E8 · "A feature" is not a number** *(drawn, Robert chose A, built 2026-09-20: `targetKind` on the board, `set_target` and `new_project` take `kind`, the strip's readout, the reading, `list_boards` and the title page say "a feature"; a feature's writer no longer reads as "no target set"; tested in the kernel and the server, and seen in the app)* (91). *Plan:* `set_target { kind:
  "feature" | "hour" | "half-hour" }` sets 120, 60 or 30 and keeps the
  writer's word, so the readout and the reading say "a feature (120)".
  *Best?* Alternative: leave it; the agent asked and the writer said fine.
  But the record then says the writer chose 120, which they did not. A word
  on the board record, claiming nothing when absent. **A person sees the
  readout: mock it.**

## F. Design — Robert's to see, mocked first (10, 11, 12, 14, 24, 35, 36, 40, 54, 59, 81, 82)

One page of mockups for these, as for the last four: what ships beside what
could be, a recommendation, what a yes means.

- [x] **F1 · How a plant pays off, as against where** *(drawn, Robert chose B — no field; the guide and `set_plant` say how is the two scenes' change lines, and the fold's words a short label; 2026-09-20)* (14, 35, 54, S6). The
  jar "he empties into her hand" went into a headline; its first sighting
  went, a whole sentence, into the fold's label and then repeated on every
  setup line. *Plan to draw:* words on the setup arrow — what happens when
  it pays off — beside the fold's words for what is planted.
- [x] **F2 · A fact true of either version** *(2026-09-20. The test came first and found two bugs: a thread kept the id of a front card that was gone, and two arrows were left between one pair of cards. Fixed in the kernel: a version stepping forward inherits the threads through the scene and the front card's fold when it has none, and arrows on one pair collapse to one, follows over setup. With that, "either way of it" is said once, on the front card — no drawing needed; the guide and the replies say so. Tested in `reducer.test.ts`.)* (59). "The keys are first seen
  in the depot, either way of it" was written twice, by a thread on the
  front card and a fold by hand on the one behind, unlinked. **First, a
  test, not a drawing:** what `choose_version` does to the two folds and two
  arrows when the card behind is chosen. Then draw: a fold or a thread tied
  to the front card is inherited by whichever version is chosen.
- [x] **F3 · Two versions as equals, and a version that is two scenes** *(drawn, Robert chose B — the drawing stays; the guide and `set_alternative` say which card is in front decides nothing, put the first-named in front and do not ask; 2026-09-20)* (10,
  11). One must stand in front; a version is one card. *Plan to draw:* the
  pair side by side under one bracket with neither in front, the reading
  counting the longer; and whether a version can be a group.
- [x] **F4 · Undecided things about a person, and "decided, not yet on the
  wall"** *(drawn, Robert chose A, built 2026-09-20: `open` on a person, carried with their page through `PERSON_TEXT_FIELDS`; `update_character` takes it; the reading lists "about <name>"; the person's page shows it under "Not decided yet" with the offer; tested, and seen in the app. "Decided, not told" stays between writer and agent; the guide says so.)* (12, 24). What the boy goes to town for is a fact of a person, not
  of a scene; and the writer had decided it and not said. *Plan to draw:* an
  open line on a person's page, as a field has one; and whether "decided,
  not told" is anything but the agent's note to the writer (likely not).
- [x] **F5 · A proposed turn** *(words, as drawn and approved: the hint says name first, mark after; tested through `list_workflows`; 2026-09-20)* (36). The app has no "proposed" between a
  scene and a beat, and its own phrase "propose them and I will strike" is
  filed under marking. *Plan:* first the words (the guide and `set_rank`'s
  description say propose in the chat, mark on the writer's word). Then ask
  whether a proposed state is wanted at all; probably not.
- [x] **F6 · A stretch the writer has not reached** *(words, as drawn and approved: the question offers "have you not got that far yet?"; tested; 2026-09-20)* ([empty], 40). *Plan:*
  words only — the question's own text offers the fourth answer, "not
  written yet: leave it", and `leave_question` takes it. No new state.
- [x] **F7 · The camera mark, for the writer** *(drawn, Robert chose A, built 2026-09-20: the mark and its hover in the app's Pages, painted on the line like a revision's star, never in print; seen in the app. B, a click that keeps the line, waits for a round or Robert to ask.)* (81, 82). The agent sees the
  marks in `read_pages`; **the app's own Pages do not show them at all**, so
  a writer never sees what their agent is told. And a mark can never be
  acknowledged. *Plan to draw:* the mark in the app's page margin, and a
  click that keeps the line, remembered on the card.
- [ ] **F8 · Acts and lengths left open** (24; twenty-one 14, 15). Twice
  asked, twice answered "a group and unsized are their forms". D1 will list
  "unsized" under "not said yet". *Plan:* leave, unless D1's listing does
  not settle it in the next round.

## G. Small words (16, 57, 78)

- [x] **G1 · A board's name on a one-board film** *(built 2026-09-20. Changed at the asking: not a board named after the project — two copies of one name drift on a rename. The agent asked because our own treatment question and `new_project`'s description told it to; those words are fixed, in a form that reads for the writer too, since the app shows the hint under Reminders. Tested through `list_workflows`.)* (16). `new_project` makes
  a "Board 1" whose name the agent must then ask about. *Plan:* a one-board
  project's board takes the project's name until a second board exists, and
  the reading does not list it as open. *Best?* Yes; the guide already says
  a one-board film goes out under its own name. *Test:* `new_project` with a
  name and no board; the reading has no board-name line.
- [x] **G2 · One undecided thing in two homes** *(built and tested 2026-09-20: said only when the text has a note and the card has open words)* (78): a card's open words and
  a Fountain note inside its text. *Plan:* `write_scene`'s reply, when the
  text holds a `[[…]]` note and the card has open words, says both exist.
  *Best?* It is a nudge, and we do not like nudges; but it is about the
  writer's own words being in two places. One clause, said once. *Test:*
  server test.

## H. From the agent's own issues file (read 2026-09-20)

After its report the round's agent wrote `plotcoder-issues.md`: forty-four
issues with steps, the reply quoted, what it expected and a "done when". It
is kept verbatim as `blind-runs/round-twenty-two-issues.md`. It was written
against 0.1.42, so most of it was already done when it was read — and it is
the better-written list, so the next round's to-do should start from a file
like it. **Its issue A8 guessed the hosted door's cause correctly** ("one
server per request?") from the outside.

**Already done, by its numbers:** A1, A2, A3, A4, A5, A6, A7, A8 (patched; B1
here is the real answer), A9, A11, A12 (differently: the mark and the
headline, not the mark alone — every heading stays its own), A13 · B1 (as
set aside, R66), B2 (R67) · C2 (`read_wall` with `only: "questions"`), C3,
C4 (no tool tidies on its own), C5 (`kind`), C6, C7's tool, C8 · D2, D3 (the
three counts, and each card once), D4, D6 · E2, E3, E5 · E1 (a reading map,
not a second file) · E4 (the rules it lists were fixed instead of
documented, all but the camera's verbs, which the reply now states).

**Decided against, with the reason** (drawn in the two mockup pages unless
said): B3, open items as a list — it turns the writer's sentence into a
form, and R67 removes most of the reason a card carries three clauses; B5,
a version slot — Robert chose the words, and a version that steps forward
now inherits its threads and fold, so "either way" is said once; B6, words
on an arrow — how a plant pays off is that scene's change line; B8's ledger
and "decided, not told" — a person's open line is built, the span is the
premise's, and what a writer has not told their agent is not the wall's;
B9, an open gap — the question now offers "not that far yet" and
`leave_question` takes it; B10, a link from an open item to a note — the
write's reply says when both exist. A14's fractions: eighths are the
industry's unit.

**What it caught that this to-do had missed** (H1 to H7 built and tested 2026-09-20; H8 to H10 are Robert's to see):

- [x] **H1 · A requirement number in a parameter's description** (its A14):
  `create_note`'s `locationOpen` says "(R61's edge)". The test that keeps
  ticket numbers out reads tool descriptions and not parameters. *Plan:*
  remove it, and widen the test to every parameter's description. *Best?*
  Yes: the test is the fix. *Test:* the widened test.
- [x] **H2 · `export_project`'s description has a blank where a path goes**
  (A14), on the hosted door, which has no folder. *Plan:* when hosted, the
  description says there is no disk and the reply's JSON is the file.
  *Best?* Yes. *Test:* the description under `PLOTCODER_HOSTED=1`.
- [x] **H3 · `set_logline` and `set_premise` do not say what they replaced**
  (D1). `set_open`, `set_plant` and `set_target` now do. *Plan:* the same
  "before:" clause. *Best?* Yes; one rule for every write that replaces the
  writer's words. *Test:* server test.
- [x] **H4 · `set_rank` says "organize lays a row per beat" every time**
  (D7), to an agent told to leave the layout alone. *Plan:* once a session,
  and not at all through the hosted door, as the other advice is. *Test:*
  server test.
- [x] **H5 · A new card can land on a card that is already there** (A10).
  `nextPlace` looks only at the last card of the story, so it can put a
  card on top of one set aside (or any card off the chain). *Plan:* step
  along the row until the spot is free of every card the wall draws at its
  own place. *Best?* Yes; a version behind another is not drawn at its own
  x,y, so it is ignored. *Test:* server test with a card set aside in the
  way.
- [x] **H6 · What is open on a card set aside is in no reading** (C1).
  `describeUndecided` walks the story's order. *Plan:* cards set aside are
  listed after the film's, marked "(set aside)". *Best?* Yes: the view is
  "everything undecided", and a card kept for later is exactly where
  undecided things sit. *Test:* `readWall.test.ts`.
- [x] **H7 · The local door says "no wall open right now" on every write**
  (C7). The hosted door now says nothing. *Plan:* the tail mentions presence
  only when it differs from what the last reply said; `who_is_here` is the
  question's tool. *Best?* Yes. *Test:* two writes, the second silent.
- [~] **H8 · The camera's mark is not in the words** (D5). It is in the app's
  Pages now, so the words sheet should say what it is. *A person sees the
  words sheet: the sentence, for Robert's word* — "**The camera's mark.** A
  small ◂ in the margin of Pages beside a line that says what someone knows,
  feels, thinks or wants, which a camera cannot see. A mark, not a question:
  keep the line or show it. It never prints."
- [~] **H9 · A person who may or may not be in a scene** (B4). "Whether Tomás
  is there: I don't know yet" went into a card's open words; the cast
  counts and the "gone for a third of the story" check cannot see a maybe.
  *To draw:* "Tomás?" on the card's cast line, listed under open, counted
  neither way. R61's shape once more, on the cast line.
- [~] **H10 · A note on a card, for what is also true of the scene** (B7).
  "The cut is announced in this scene" had no home on the card. The premise
  now heads `read_pages`; a fact about one scene still has only the change
  line, the text, or open words. *To draw, with a recommendation against
  unless a second round asks:* a card has two lines by design (D-rule: what
  changes), and a notes field is where a wall turns into a document.

---

## Every entry, accounted for

**Fixed the night of the round** (in #131): 2, 4, 5, 7, 9, 18, 19, 21, 22,
25, 26, 27, 32, 37, 38, 39, 44, 45, 46, 48, 49, 52, 53, 55, 56, 58, 60, 62,
63 (described; E4 asks whether it should happen), 65, 68, 69, 72, 75, 76,
79 (the reply shows the old words; R67 removes most retyping), 80, 90, 95.
20 all but its last line (A3).

**Built on Robert's four calls** (in #131): 13, 74 (the premise); 15, 17,
23, 28, 42, 86 (R67); 47, 50, 51, 64, 85 (R66); 70 (the open place's
heading).

**Here as an item:** 1 → A2, C2 · 6, 8 → D5 · 10, 11 → F3 · 12, 24 → F4,
F8, D1 · 14, 35, 54 → F1 · 16 → G1 · 20 → A3 · 29 → D2 · 30 → E3 · 31 → E1
· 33 → E2 · 36 → F5 · 40 → F6 · 41, 43, 67, 89 → D1 · 59 → F2 · 61 → E5 ·
63 → E4 · 66, 92 → B3 · 71 → E7 · 73, 84, 87 → D4 · 77 → E6 · 78 → G2 · 81,
82 → F7 · 83 → D3 · 91 → E8 · 93, 94 → B2 · 25, 26, 37, 52, 95 → B1 (the
real answer behind the patches).

**Not ours, or by design, with the reason:** 3 (the agent's fetch tool
summarised the on-ramp) · 34 (open words the order had answered: free text
the app cannot read; the write's reply already reminds that a card is still
open) · 57 (a fold's words and an open place disagreeing: the same) · 88
(eighths unreduced: the industry's unit).

**From sections 3 to 6, beyond the log:** the reading a day-one agent did
not need → D5; "how anything looks on the wall", never seen by an agent →
not ours to fix in words, and the replies now say where a card behind and a
card aside are drawn; what `choose_version` does to two keys arrows → F2;
whether the agent shows as "an agent, as you" → B2; that every direction
came through another session → the practice, said in the report's head.
