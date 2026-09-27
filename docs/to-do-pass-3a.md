# Pass 3a — the working list

Pass 3a's first half ran 2026-09-27 with no agent (`docs/plan.md`, goal 3:
measure the size): `scripts/measure-reads.mjs` counted every read on
"Ninety-Nine", "Last Orders" and a generated series, "Low Water"
(`scripts/generate-series.mjs`). The report is `blind-runs/pass-3a-report.md`,
ten findings; every one accounted for below. The second half ran the same
day: a fresh agent on "Low Water" through the desktop connector with three
directions that need the whole film (`blind-runs/pass-3a-prompt.md`),
**forty entries**, accounted for in the second list. Every item follows
plan, ask, build, test; a read an agent sees gets its alternatives named
before it is built.

## The size (findings 1 to 7)

- [ ] **1 · The tool list is 90,105 characters on every turn** (about
  25,700 tokens; more than every read of a feature's wall together).
  *Plan:* shorter descriptions are the only lever the door has — the
  schemas are what they are. Two ways: (a) cut every description to its
  first sentence and move the rest into the guide the description names;
  (b) keep the descriptions and accept the cost, since the client sends
  them once per turn and caches the prefix. *Ask:* Robert's word — every
  round since thirteen has made the descriptions longer on purpose, because
  a blind agent reads them and not the guide; shortening them trades the
  size of every turn against what the rounds found. **Held for Robert.**
- [ ] **2 · The on-ramp's six calls are 11,500 to 13,800 tokens before a
  word.** `list_words` (6,404 characters) and `list_workflows` (7,043) are
  a third of it and read no wall. *Plan:* nothing yet; they are the
  vocabulary and the treatment's questions, read once. **Held**, with 1.
- [ ] **3 · A feature fits; a series does not.** `read_pages` is 18,000 to
  21,000 tokens a forty-card board and every board's pages together are
  about 126,000. *Plan:* **R77, proposed** in `REQUIREMENTS.md` — reads
  that select: a person's scenes with their text, a run's or an act's
  pages, a card by a phrase, a board's pages from one scene to another;
  and `read_wall`'s runs without their card lists once a board is past a
  size. *Ask:* the alternatives are in R77; this is the pass's main
  finding and the blind half will say which of them an agent reaches for
  first. **Held for Robert**, after the blind half.
- [ ] **4 · `list_board` is ids: 2.2 characters a token, 9,800 tokens for
  forty cards.** *Plan:* shorter ids in replies — the first eight
  characters, unique on the board, taken back by every tool that takes an
  id — or a `list_board` that takes a range or a person. *Ask:* the short
  id is a kernel change every door and the app's copy-to-clipboard would
  share; the range is a read like R77's. **Held**, with 3.
- [ ] **5 · `export_text` is 113,000 characters a board from its
  indents** — 5.2 characters a token, the largest export by size and the
  same by tokens. *Plan:* nothing: it is a file, and a file is what it is
  for; the reply is the file when there is no disk. **Decided against**
  changing it; noted so nobody counts it as a read.
- [ ] **6 · `export_project` inline is 703,000 characters for the series.**
  Not a reply on any door. *Plan:* the hosted door already answers with a
  link unless asked for `inline`; the description could say the size it
  would be before the writer asks. *Small.* **Build:** the reply to
  `inline: true` says its size in the first line when it is over the
  desktop cap, so the agent can choose the file. **Held** until the blind
  half says whether an agent reaches for it.
- [ ] **7 · `read_project` is the one whole-project read, and it scales.**
  4,200 tokens for six boards, saying each board's questions and opens and
  the folds that cross, nothing of the cards. *Plan:* nothing; it is the
  read to reach for first on a series, and the blind half will say whether
  the guide sends an agent to it. **Nothing to do.**

## The generator (findings 8 to 10)

- [ ] **8 · The duplicate check reads a shared verb phrase as the same
  scene.** "Rosa says Friday" and "June says Friday"; "Bram at June's
  table" and "June's table". Four to seven a board on the series, a third
  of what the wall asks. *Plan:* weigh the share — ask only when the
  shared words are most of both headlines, not any two — or count the
  cast: two headlines with different people in them are different scenes
  unless every other word matches. *Ask:* which the writer would want;
  the rounds that built the check (round eighteen on) wanted it loud on
  "Maya finds the letter" twice. **Held for Robert.**
- [ ] **9 · The wall asks the right things of a generated series.**
  [unpaid] on the brass key, [sag] on the long second acts, [unvoiced] on
  the wants no page voices, [absent] on the template's gaps. **Nothing to
  do**; the blind half reads them.
- [ ] **10 · A wipe keeps nothing, and an inline export lands only in a
  session's transcript.** "Ninety-Nine" survived by luck: the desktop app
  wrote the over-cap reply to a file under the session's folder. *Plan:*
  `scripts/wipe-test-account.mjs` writes every project it is about to
  remove as a project file under `blind-runs/exports/` (ignored by git or
  kept, Robert's call) before it removes anything; and the blind-run
  prompts say `export_project` with a path through a door with a disk, or
  through the hosted door take the link, never `inline`. *Ask:* whether
  the exports are kept in the repo (small, and the walls are the rounds'
  evidence) or only on the disk. **Held for Robert**; the prompt change is
  made in `blind-runs/pass-3a-prompt.md`'s head already (the project is on
  the account, not exported inline).

## The blind half (entries 1 to 40 of the second list, `blind-runs/pass-3a-report.md`)

**Fixed as it ran**, each with a test, in six pull requests:

- [x] **7, 31, 5 · The folds pointed at boards the project did not have; the gap line promised a record that was empty.** The account import re-minted board ids and left every fold's `payoffBoardId` on the old one, so five paid folds read as unlocatable and one as "Ep 0". `reidentifyBoard` moves the folds with the boards on both doors (the store's push and the server's import); a fold on a board the project lacks says so in words; the gap line says the record holds nothing. #202.
- [x] **16, 23 · `list_board` promised the change line and printed none.** The row ends with it now. #203.
- [x] **27, 28 · `set_aside` said "6 arrows drawn" and listed five; a reshaped question read as gone and new.** Counted against the wall as it was; a question of the same kind over overlapping cards is one question, reshaped. #204.
- [x] **34, 38 · "One board earlier" for three; the camera check on every reply.** The distance is counted in the writer's order; a clean check is said once a session. #205.
- [x] **37 · The record had no words for a payoff claimed on another board, and every line carried every id.** Said now, claimed and taken back; each line keeps the ids it names; the order's line names none. #206.
- [x] **3, 11, 25 · The on-ramp ended at one board; `read_project` did not say what was written or grouped.** A project of more than one board is read whole first, on the on-ramp, the skill and the handshake; `read_project`'s board line says "every scene written" or "38 of 40", and its groups. #207.

**Held for Robert**, with the alternatives named:

- [ ] **15, 17, 32, 19 · The pages by the board or not at all** — 72 to 75 KB a board, six of six over the agent's ceiling; no range, no one scene, no "change lines only"; nothing marks the change line on the page. *This is R77 (a):* `read_pages` and the exports with `from`/`to` by id or headline, as `measure` already takes; and a read of one card's text. **Held**, R77's first alternative, recommended.
- [ ] **10 · Twelve `read_character` calls for twelve wants.** *Plan:* `list_board`'s cast line carries each person's want when the page has one — one line each, the words the check reads. *Ask:* it lengthens `list_board` by a line a person; `read_character` stays the page. **Held**, small; R77 (f).
- [ ] **20, 21 · The want check reads words, so a want the story drops while its owner keeps saying it is never asked about.** The pass's own finding: the check is R74's word check and it did its job on words. *Plan:* a second reading of a want — the person's change lines, not their speeches: a want no change line moves after the page it is last moved on. *Ask:* it is the first check that reads the story rather than the words, and it is a question the writer may not want asked on every reading. **Held for Robert**; a mockup on the Asks sheet if wanted.
- [ ] **2 · The day-one guide is 42 KB.** With the first half's 1 and 2. **Held.**
- [ ] **4, 36 · `open_project` and `open_board` reset the first-reading state and the tails go back to counting.** *Plan:* the tail says "opening a board began the reading again; read_wall lists them" once, so the count is not a surprise. **Held**, small.
- [ ] **8, 9 · Two identical headlines on one board.** The duplicate question could say "the same headline twice" and give both ids beside their positions in the order. With the first half's 8. **Held.**
- [ ] **12 · Two blocks say "everything is written" eight ways on a written board.** *Plan:* the cues line and the written-by-stretch line fold to one line when every scene is written. **Held**, small.
- [ ] **13 · Three numbers for one length.** Long-standing (pass 1a); the reading names which to say. **Held.**
- [ ] **14 · The [absent] question's ids: a person and two cards, unlabeled.** *Plan:* "(person: …; cards: …, …)". **Held**, small.
- [ ] **18 · `open_board` says "saved to the account" for a read.** It is a write — the open board is on the project record, and the writer's app follows it. *Plan:* say so once: "the writer's app opens it too". **Held**, small; and worth a thought — an agent reading six boards moves the writer's wall six times.
- [ ] **24 · A group is twenty ids in `list_board` and a page count in `read_wall`.** *Plan:* `list_board`'s group line names the first and last card and the count. **Held**, small.
- [ ] **26 · "Shorten" has no tool for a written card.** By design: the page is the writer's; `edit_scene` changes a line on their word. **Decided against** a tool; the agent did right to propose cuts only.
- [ ] **29 · The sag stood because the median fell with the cuts.** A fact about the reading; the tail could say "the median is now N" when it moves. **Held**, small.
- [ ] **30 · The write's tail said nothing of duplicates or the group.** The tail quotes questions that changed; none did. **Nothing to do.**
- [ ] **33 · The payoff check reads words, so the line is written to it.** R74 by design; the guide says so. **Nothing to do.**
- [ ] **35 · A cross-board payoff's page is not quoted in the setups head.** *Plan:* the receiving board's line quotes the sentence where the fold's word lands, as a same-board setup's does. **Held**, R74's extension, small.
- [ ] **6 · Project and board share a name.** The generator's; a real writer's pilot often does too. **Nothing to do.**
- [ ] **1, 22 · The agent's own fetch and chunking.** Not the app. **Noted.**
- [ ] **39, 40 · The connector's cached tool list, again** (pass 2b's 4): `hand_over` and `read_record` missing from the session, so the last word went into the report and not onto the wall. The prompt's head said to turn the connector off and on; it was not done. *Plan:* nothing in the app can reach a client's cache; the prompt's head now says it in its first line, and the driving session checks the tool count before "go on". **Process**, recorded.

## Held for Robert, in one list

From the first half: 1, 2, 3 (R77), 4, 6, 8, 10. From the blind half: the
pages by range and one scene's text (R77 a, recommended first), the wants on
`list_board`, a want the story drops (a reading of change lines, mockup if
wanted), and the small ones above.
