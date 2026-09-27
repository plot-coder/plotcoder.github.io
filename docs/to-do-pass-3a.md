# Pass 3a — the working list

Pass 3a's first half ran 2026-09-27 with no agent (`docs/plan.md`, goal 3:
measure the size): `scripts/measure-reads.mjs` counted every read on
"Ninety-Nine", "Last Orders" and a generated series, "Low Water"
(`scripts/generate-series.mjs`). The report is `blind-runs/pass-3a-report.md`,
ten findings; every one accounted for below. The second half — a fresh
agent on "Low Water" with three directions that need the whole film — has
its prompt in `blind-runs/pass-3a-prompt.md` and adds its entries here
when it runs. Every item follows plan, ask, build, test; a read an agent
sees gets its alternatives named before it is built.

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

## Held for Robert, in one list

1, 2, 3 (R77), 4, 6, 8, 10 above. The blind half runs first on the prompt in
`blind-runs/pass-3a-prompt.md`; its entries join this list.
