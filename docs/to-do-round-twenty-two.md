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

- [ ] **B1 · A session for the hosted door.**
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

- [ ] **C1 · The desktop app says OAuth is "Detected" on a door with none.**
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

- [ ] **D1 · One view of everything undecided** (41, 43, 67, 86, 89, 24).
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
- [ ] **D2 · The cast and the places in the reading** (29).
  *Plan:* `read_wall` ends with two compact lines — who is in the film and on
  how many scenes, where it happens and how often — and drops "the cast and
  the places are list_board's". *Best?* It lengthens a long reply. But
  "read the wall back to me" is the most common thing a writer asks, and it
  should be one call. Yes, compact. *Test:* the two lines, on the seed wall.
- [ ] **D3 · A short read: only what the wall asks** (83).
  *Plan:* `read_wall { only: "questions" }` — the three counts, the
  questions, what is left, nothing else. *Best?* Alternative: make the tail
  do it (B3 does, for one write). This is for "is there anything I owe?",
  which cost three hundred lines to answer "no". Yes. *Test:* the reply is
  under fifteen lines on the seed wall and carries every question.
- [ ] **D4 · The runtime sentence** (84, 87, 73).
  *Plan:* one line per number, each labelled: the estimate; what it is made
  of; against the target; and the sketch's second number as "if the sketch
  ran to the page it was read as". *Best?* Yes — it is the same facts, set
  so that the one to use comes first. (Eighths stay unreduced, 88: the
  industry's unit, and the words sheet says so.) *Test:* snapshot of the
  block with a sketch and an open target.
- [ ] **D5 · The guide, for someone holding a connector** (6, 8, S3).
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

- [ ] **E1 · Set the order from a list** (31). One swap took seven calls,
  and `move_scene` refuses a wall with no follows arrows.
  *Plan:* `set_order { ids: [...] }` — draws the follows chain through the
  cards named, in one step one undo takes back; cards not named keep their
  arrows among themselves. And `move_scene` on a wall with no arrows draws
  the chain from the rows first, saying so, instead of refusing.
  *Best?* Alternative: only the second half. But "the order is: A, B, C" is
  what a writer says, and there should be a tool shaped like the sentence
  (D24). Both. *Test:* kernel test for the chain and the undo; server test
  for the reply naming the order.
- [ ] **E2 · An arrow's reply says what the story now runs** (33).
  *Plan:* `create_arrow` (follows) ends "the story now runs: A → B → C" when
  the chain is short, or the three cards around the new arrow when long.
  *Best?* Yes; it is what `move_scene` already does. *Test:* server test.
- [ ] **E3 · A setup's distance on a wall with no order** (30).
  *Plan:* the line says "about 6 pages later, by the rows: the story order
  is not set". *Best?* Yes. *Test:* `describeSetups` with no follows arrows.
- [ ] **E4 · Wiring a scene in tidies the whole wall** (63). Described now;
  still nine cards moved for one added.
  *Plan:* **decide, do not build yet.** Options: (a) as it is; (b) tidy only
  the row the card lands in; (c) no tidy — the card lands beside its
  neighbour and `organize` is the writer's. *Best?* (c) respects a wall a
  person arranged by hand, and costs an untidy wall after an agent's build.
  Rounds fourteen and sixteen asked for the tidy. **Mock the three on one
  wall and ask Robert.**
- [ ] **E5 · A tie's reply carries what it made** (61). Tying a thread can
  fold a card, name the fold and draw an arrow; the reply is prose and the
  arrow's id is not in it. *Plan:* the ids in the reply's text. *Best?* Yes.
  *Test:* server test on the tie that makes a fold.
- [ ] **E6 · Insert a line into a scene** (77). "Add a line after X" is only
  "replace X with X plus the line". *Plan:* `edit_scene { after: "…",
  insert: "…" }` (and `before`), the text found once, the new paragraph set
  off by a blank line. *Best?* Yes; the reply says "inserted", not "changed
  one line". *Test:* server test, and the refusal when the anchor occurs
  twice.
- [ ] **E7 · What a written scene's line count counts** (71). *Plan:* the
  reply says notes (`[[…]]`) neither print nor count. *Best?* Yes. *Test:*
  a scene with a note measures the same as without.
- [ ] **E8 · "A feature" is not a number** (91). *Plan:* `set_target { kind:
  "feature" | "hour" | "half-hour" }` sets 120, 60 or 30 and keeps the
  writer's word, so the readout and the reading say "a feature (120)".
  *Best?* Alternative: leave it; the agent asked and the writer said fine.
  But the record then says the writer chose 120, which they did not. A word
  on the board record, claiming nothing when absent. **A person sees the
  readout: mock it.**

## F. Design — Robert's to see, mocked first (10, 11, 12, 14, 24, 35, 36, 40, 54, 59, 81, 82)

One page of mockups for these, as for the last four: what ships beside what
could be, a recommendation, what a yes means.

- [ ] **F1 · How a plant pays off, as against where** (14, 35, 54, S6). The
  jar "he empties into her hand" went into a headline; its first sighting
  went, a whole sentence, into the fold's label and then repeated on every
  setup line. *Plan to draw:* words on the setup arrow — what happens when
  it pays off — beside the fold's words for what is planted.
- [ ] **F2 · A fact true of either version** (59). "The keys are first seen
  in the depot, either way of it" was written twice, by a thread on the
  front card and a fold by hand on the one behind, unlinked. **First, a
  test, not a drawing:** what `choose_version` does to the two folds and two
  arrows when the card behind is chosen. Then draw: a fold or a thread tied
  to the front card is inherited by whichever version is chosen.
- [ ] **F3 · Two versions as equals, and a version that is two scenes** (10,
  11). One must stand in front; a version is one card. *Plan to draw:* the
  pair side by side under one bracket with neither in front, the reading
  counting the longer; and whether a version can be a group.
- [ ] **F4 · Undecided things about a person, and "decided, not yet on the
  wall"** (12, 24). What the boy goes to town for is a fact of a person, not
  of a scene; and the writer had decided it and not said. *Plan to draw:* an
  open line on a person's page, as a field has one; and whether "decided,
  not told" is anything but the agent's note to the writer (likely not).
- [ ] **F5 · A proposed turn** (36). The app has no "proposed" between a
  scene and a beat, and its own phrase "propose them and I will strike" is
  filed under marking. *Plan:* first the words (the guide and `set_rank`'s
  description say propose in the chat, mark on the writer's word). Then ask
  whether a proposed state is wanted at all; probably not.
- [ ] **F6 · A stretch the writer has not reached** ([empty], 40). *Plan:*
  words only — the question's own text offers the fourth answer, "not
  written yet: leave it", and `leave_question` takes it. No new state.
- [ ] **F7 · The camera mark, for the writer** (81, 82). The agent sees the
  marks in `read_pages`; **the app's own Pages do not show them at all**, so
  a writer never sees what their agent is told. And a mark can never be
  acknowledged. *Plan to draw:* the mark in the app's page margin, and a
  click that keeps the line, remembered on the card.
- [ ] **F8 · Acts and lengths left open** (24; twenty-one 14, 15). Twice
  asked, twice answered "a group and unsized are their forms". D1 will list
  "unsized" under "not said yet". *Plan:* leave, unless D1's listing does
  not settle it in the next round.

## G. Small words (16, 57, 78)

- [ ] **G1 · A board's name on a one-board film** (16). `new_project` makes
  a "Board 1" whose name the agent must then ask about. *Plan:* a one-board
  project's board takes the project's name until a second board exists, and
  the reading does not list it as open. *Best?* Yes; the guide already says
  a one-board film goes out under its own name. *Test:* `new_project` with a
  name and no board; the reading has no board-name line.
- [ ] **G2 · One undecided thing in two homes** (78): a card's open words and
  a Fountain note inside its text. *Plan:* `write_scene`'s reply, when the
  text holds a `[[…]]` note and the card has open words, says both exist.
  *Best?* It is a nudge, and we do not like nudges; but it is about the
  writer's own words being in two places. One clause, said once. *Test:*
  server test.

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
