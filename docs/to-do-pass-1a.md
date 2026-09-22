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

## Decided against, with the reason

- **A length for a moment inside a scene** (entry 14: the quarter-page
  call inside the lay-by). Decided against twice already (thirteen 9,
  fourteen 14, `blind-runs/README.md`): a card is the unit; the writer's
  answer made the lay-by scene the quarter page.
- **"go on" from another session** (entry 15). Procedure: the driving
  session relays the writer, as every round since fifteen.

## Every entry, accounted for

**Here as an item:** 1 → D1 · 8 → N1 · 7 → N2 · 4 → N3 · 5 → N4 · 6 → N5 ·
2, 3, 9, 10 → N6 · 11, 12 → N7 · 13 → N8.

**Decided against, above:** 14, 15.
