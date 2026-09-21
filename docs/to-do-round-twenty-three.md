# To do — everything material from round twenty-three

Written 2026-09-20, night, from `blind-runs/round-twenty-three-report.md`
(seventy-two entries and its sections 3 to 6) and from the round's agent's
own synthesis afterwards (its eight groups and "if you fix only three").
Every entry is accounted for at the foot of this file: fixed, built, here as
an item, or decided against, with the reason.

**The pattern for every item, in this order, and no skipping** (as in
`docs/to-do-round-twenty-two.md`): **plan**; **ask whether it is the best we
can do**, in writing — a mockup on the app's own paper for anything a person
sees, the alternatives named for tools and plumbing; **build**, through the
kernel; **test**, and look at it in the app when a person can see it.

Status marks: `[ ]` open · `[~]` planned and asked, waiting on a word ·
`[x]` built and tested.

**Where it stands:** thirty entries were fixed the night of the round and
released as 0.1.47. The round's real finding — a writer's "I don't know" with
no home — is built as R69, R70 and R71 with the checklist's five questions
(pull request #142), **waiting on the owner's look at R70 and R71 in the app
before it is merged and released.** What follows is what is left: **ten to
build — six now, four next — three to leave until asked again, and the rest
decided against.**

---

## N. Now — one small release, after #142 lands

Each is tools or words; none needs a drawing. Together about a session's work.

- [~] **N1 · What "the session's first reading" means, and the first calls**
  (entry 4; the report's head). *Waiting on a yes: it changes the handover's
  call 2.* The count-and-point tail is unreachable by an agent who follows
  the on-ramp, whose five first calls include `read_wall` — in this round, of
  someone else's stale wall, which it then deleted.
  *Plan:* the flag is **the first reading of this project**: `new_project`,
  `open_project`, `open_board` to another project's board and `empty_account`
  reset `readOnce`, the last reading and the changes since, in the session's
  memory (so it holds through the hosted door too). And the on-ramp's first
  calls become `list_words`, `list_workflows`, `list_projects` — then
  `read_wall`, `list_reminders`, `list_board` **only when the working project
  is the one the agent is to work**; on an account door with someone else's
  project standing, `new_project` first.
  *Best we can do?* Alternatives: (a) always quote, and delete call 2 — costs
  nothing, and throws away the reason call 2 exists: a twelve-card build is
  twelve replies quoting questions the next write answers; (b) reset on
  `new_project` only — misses `open_project`; (c) count until the first
  reading *after the first write* — cleverer, and harder to explain in the
  guide than "this project". Take the plan.
  *Test:* `plotcoder-http.test.mjs`: a session that reads, then `new_project`
  (file door: `new_board`), then writes — the tail counts; a `read_wall`; the
  next write quotes. `llms.txt` and the guide say the first calls the same way.
- [ ] **N2 · A card born as a version, or born set aside** (entry 20; the
  synthesis, section 3). A version took two writes and raised two false
  questions ([unlinked], [duplicate]) between them; a cut scene the same.
  *Plan:* `create_note` takes `of` (a card's id or headline: the new card is
  born behind it, as `set_alternative` would leave it) and `aside: true`
  (born set aside, placed clear of the rows — below the lowest laid card —
  not "after the last card", which is inside the story). One commit each, so
  one undo, and no question in between.
  *Best?* Alternative: leave it; the false questions clear themselves. But a
  build's tail is read, and the agent stopped to check they were gone. Yes.
  *Test:* server test: no [unlinked] or [duplicate] in either reply's tail;
  the aside-born card overlaps nothing.
- [ ] **N3 · The pages' scene note says who may be there, and an open cast**
  (entry 54). `read_pages` is what the guide says to read before writing a
  scene, and its note reads `[[with Ada Okafor]]` — no `The organist?`, no
  "who else: I don't know". Someone writing from the pages writes a scene
  with the question already answered.
  *Plan:* the note is the cast line as the wall types it back
  (`castLineWithOpen`): `[[with Ada Okafor, The organist? · not decided:
  anyone else]]`. Through every export that carries the note.
  *Best?* Yes; one helper already exists. *Test:* `fountain`/pages unit test
  with a maybe and an open cast.
- [ ] **N4 · A reply says what the change did to the story's shape** (entries
  30, 31, 50, 52, 72; the synthesis, section 7). A reorder, a cut, a delete or
  a choice of version changes the runs between turns, can move the ending,
  and leaves the rows disagreeing with the arrows; the replies report the
  arrows and the runtime only.
  *Plan:* one helper, `shapeNote(before, after)`, appended by `set_order`,
  `move_scene`, `set_aside`, `delete_note`, `choose_version` and
  `create_note` with `after`: which runs changed and by how much ("the run
  from "The school hall" to "The chapel again" is now 2 cards, about 2
  pages"); "the last card is now …" when it moved; "a version behind "X" went
  with it" when one did; and, when the wall's rows no longer read in story
  order, "N cards now sit out of the story's order on the wall — organize
  lays them along the arrows when the writer wants it". Silent when nothing
  of the kind changed.
  *Best?* The risk is a longer tail, which entry 24 complained of. It is
  said only when true, and it replaces a full `read_wall` the agent would
  otherwise run to find out. Yes. *Test:* server tests, one per case, and
  one where the helper says nothing.
- [ ] **N5 · One number for "how long is it"** (entry 62). Three film numbers
  came back — by the cards, the script paginated, and "if the sketch ran to
  the page it was read as" — and the agent gave the writer all three.
  *Plan:* `page_count` and `read_wall`'s runtime block open with one
  sentence — "The film runs about N pages by the cards: say this one" — and
  the others follow, each labelled with what it is for.
  *Best?* D4 did this for the block; it did not reach `page_count`, and the
  lead sentence did not say "say this one". Yes. *Test:* both replies'
  first line.
- [ ] **N6 · An aside card the app placed is never under the story** (entry
  22). A card with no position lands "after the last card"; set aside, it
  stays there; `organize` then lays the rows under it and reports it "left
  where the writer put it", which nobody did.
  *Plan:* `organize`, after laying the rows, moves any card set aside that
  now overlaps a laid card to a clear spot below the rows, and says which;
  cards set aside that overlap nothing stay where they are. (N2 keeps a card
  born aside out of the way to begin with.)
  *Best?* Alternative: `set_aside` moves the card, as a kept version is now
  moved. No: R66 says a card set aside keeps its place on the wall, and a
  writer who set one aside by hand put it where they want it. Only the tidy
  moves it, and only when it would be on top of something. *Test:* organize
  unit test; the reply names the moved card.
- [ ] **N7 · Three sentences the guide lacks** (entries 3, 25, 33). The tools
  may arrive under a connector's id, not a name: know the server by
  `list_words`. A version's headline may carry what tells the two apart
  ("…alone", "…with Callum"): that is not "how" in a headline. A beat marked
  on a wholly open card is an ordinary beat: the card is asked nothing of
  itself and the story around it still is.
  *Test:* the third is checked true by a `readWall` unit test first.

## X. Next — each its own item, with its own asking

- [ ] **X1 · A day-one page for someone holding a connector** (entries 1, 2,
  6, 7; round twenty-two's 6, 8 and D5 — **the third asking**). `llms.txt` is
  half wiring a connector-holder is told to skip after reading it; the guide
  is one 52 KB file with a reading map that says "read a third", delivered
  whole, overflowing the agent's fetch. D5 added the map and cut nothing, and
  the round after measured the same complaint.
  *What it needs:* a decision on shape, then the writing. Options to weigh:
  (a) `llms.txt` becomes the day-one page — first calls, the rules, the
  checklist's pointer, the open things, versions, set aside, threads, the
  reading — and links `guide.md` for Pages, Structure, production, series and
  wiring, with `llms-full.txt` keeping today's whole; (b) the guide is split
  into files by the reading map's own heads; (c) the MCP server's
  `instructions` field carries the day-one rules, so a connector-holder
  needs no fetch at all — the strongest, since round twenty-three's agent's
  fetch tool paraphrased the rules (entry 7), and the one to try first.
  *Size:* a day, mostly writing, and a blind round to measure it: the
  report's section 3 is the test.
- [ ] **X2 · An undo through the hosted door** (entries 43, 70, 71; the
  synthesis, section 5 — its third "if you fix only three"). Tonight the door
  says plainly it has none and `undo` says it is a stack. What is not built:
  an undo that works there, that can name what it would take back before it
  does, and replies that say how many steps a compound write made.
  *What it needs:* a design. The trail holds whole walls, so it cannot ride
  the session row as it is. Options: (a) the account's boards carry a `rev`;
  keep the last N board states per session in a table of the writer's own
  (as `agent_sessions` is), capped in size, swept with the session — the
  same wall, no secret; (b) keep inverse commands instead of states — small,
  but every command needs an inverse, and the kernel has none; (c) a
  `preview: true` on `undo` that says what it would take back, at every
  door, which is cheap and worth having whatever else is decided. Start with
  (c); ask about (a).
- [ ] **X3 · Each undecided thing once in the reading** (entries 38, 63). One
  thing appears in up to three sections — a cast nobody has named under
  blank and again as a [nobody] question; a thread's loose start under
  threads and as [loose]; an open card's place inside the card and under "no
  place" — so "what is undecided, all of it" was 26 rows for about 20 things,
  de-duplicated by hand. R69 and entry 66's fix removed two of the three
  cases; the rest wants a rule: **a thing the wall asks about is listed
  where it is asked, and nowhere else**, and the undecided view says "asked
  above" rather than repeating it. Wants a before-and-after of one real
  reading in the asking, since it changes the text every agent reads.
- [ ] **X4 · The project's file through a connector, without retyping** (the
  report's section 4; the synthesis, section 8). `export_project` on a door
  with no disk returns the file as JSON inside the reply, about 20 KB and
  escaped twice over; the agent retyped it by hand to keep a copy.
  *What it needs:* the hosted door to put the file in the project's storage
  bucket as the writer and answer with a short-lived signed link, the file's
  size and a checksum — the bucket and its rules exist (R36). Only matters
  when an agent is asked to save a copy, which a round's housekeeping always
  does and a writer seldom will; hence next, not now.

## L. Leave until a second round asks

- **L1 · More than one open line on a person** (entry 18). Ngozi had two
  undecided things in one string. First asking; one line holds two
  sentences; and "a scene she is definitely in" is said by the cast's counts.
  If R70's list proves itself on the film, the same shape could come to a
  person's page.
- **L2 · Nothing connects a written scene's people to the card's cast**
  (entry 56). "She is alone" decided a maybe and only the agent noticed. The
  app could compare the text's speakers with the cast, and cannot know
  "alone" from prose. The guide already says keep them agreeing yourself.
- **L3 · Paragraphs have no numbers** (entry 59). "After the first
  paragraph" had to become a quoted anchor, and the agent asked the writer
  which paragraph — rightly. `read_pages` could number paragraphs; nobody
  else has wanted it.

## Decided against, with the reason

- **An open title printing the writer's words on the title page** (the
  synthesis, section 6). "The Tuner, or Four Forty" is two candidates; a
  title page is read as a claim. It goes out as "Untitled". *The owner may
  overrule: it is a person's page.*
- **"hears", "sees", "notices" in the camera check** (entries 57, 61). The
  check marks what cannot be filmed; those can. "He hears a knock" is a fair
  line, and marking fair lines is how a mark stops being read.
- **Tying a thread without the fold and the arrow** (41). R62's rule: a
  thread tied at both ends between two scenes that exist *is* a plant and a
  payoff, and the reply says all three writes.
- **A record of the agent's questions to the writer** (36). Not the wall's:
  the wall holds what the writer has said. R71 covers the one case that is —
  a proposal waiting on them — and the short read now says so.
- **The premise enforced on scene text** (12). D21: the app counts and stays
  quiet.
- **Order and layout agreeing after `set_order`** (30). E4, on Robert's word:
  no tool tidies on its own. N4 says how many cards now sit out of order.
- **A card with no headline** (51). The headline is what every reply, arrow
  and reading names a card by; echoing the writer's sentence was right.
- **A short written scene shrinking the runtime** (55). True, explained in
  the reply, and the answer is sizing the cards.
- **A writer present but not in the app** (69). Not the wall's to know.
- **"Either way of it" held on the front card only** (42). It is a
  convention with a tested mechanism behind it (F2), and the reading now
  lists what is open on the version behind (0.1.47).
- **The fork's two endings as versions** (10). Moot: the writer decided.

---

## Every entry, accounted for

**Fixed the night of the round, released as 0.1.47:** 5, 8, 11, 19, 21, 23,
24, 26, 27, 28, 29, 35, 37, 39, 40, 45, 46, 47, 48, 49, 53, 58, 60, 64, 65,
66, 67, 70 and 71 (no promise of undo through the hosted door).

**Built in #142, waiting on the owner's look:** 9 (the checklist) · 13, 14
(R69) · 15, 16 (R70) · 17 (a note on an unwritten scene) · 32, 34 (R71) · 68
(the hosted tail claims nothing about who is watching) · 70, 71 again
(`undo`'s own description).

**Here as an item:** 4 → N1 · 20 → N2 · 54 → N3 · 30, 31, 50, 52, 72 → N4 ·
62 → N5 · 22 → N6 · 3, 25, 33 → N7 · 1, 2, 6, 7 → X1 · 43 → X2 · 38, 63 →
X3 · 18 → L1 · 56 → L2 · 59 → L3.

**Decided against, above:** 10, 12, 30 (the layout; N4 has the count), 36,
41, 42, 51, 55, 57, 61, 69.

**Resolved within the round, nothing to do:** 44 (the version carried
everything across).

**From sections 3 to 6 and the synthesis, beyond the log:** the file through
a connector → X4; an open title's words → decided against; "undo to accept a
target" and "how many undo steps" → X2; "a quick `list_projects` first" → N1;
"one counting rule" → done in 0.1.47; "a `candidate` rank" → R71.

**Carried from before the round, still open:** C1's OAuth proposal for the
hosted door (R48's next step); R64's weekly agent (wants a yes and a day).
