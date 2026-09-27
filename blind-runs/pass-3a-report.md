# Pass 3a — the report

Run 2026-09-27 in two halves, the first pass of goal 3 in `docs/plan.md`
(projects past an agent's context window, worked hands-off). The first
half measured the size with no agent; the second handed the generated
series to a fresh agent through the desktop connector with three
directions that need the whole film. **Forty entries** from the blind
half, below the first half's ten.

## The second half — a fresh agent on "Low Water"

**What the pass was for, answered.** *From the wall alone:* the series,
its six loglines, the target and the length of every board, the cast and
every want, and that nothing was open — told in full from `read_project`,
`list_boards`, one `read_wall` and twelve `read_character` calls. Not
told: how episodes two to six are built (beats, runs, groups, whether
written), which `read_project` did not say (11; fixed, #207), and where
five cross-episode folds pay off, which printed raw board ids and "Ep 0"
because the account import had re-minted the boards' ids and left the
folds pointing at the old ones (7; fixed, #202). *The three directions:*
**the dropped want** — Kit Fenn, found right, from 240 change lines lined
up by hand after six `read_pages` of 72 to 75 KB each, none of which the
agent could hold in a reply; the wall's own want check never pointed at
Kit, because Kit keeps saying the words while the plot stops moving them
(20, 21). **The second act** — the agent asked which of seven, was told
episode three, proposed six scenes to set aside with reasons and what to
keep, and did it on the word: 68 to 57 2/8 pages; "what shortens" it
declined without the writer's lines (26). **The unpaid plant** — the brass
key, which the wall had asked about on every reading; proposed "The chart
drawer" three episodes on with a line of its own, claimed the payoff
across boards and inserted the line, and the question went. *Where it ran
out of room:* the pages, six times of six; the agent saved each reply to
its own disk and worked from scripted extracts of five of the six
boards, and said so as the one risk in its answer. *What it re-read:*
nothing from the app twice; its own extracts many times. *What it got
wrong:* the stale board ids read as boards outside the project (7); "the
second act" offered as two readings when there were seven (25); one call
miscounted; five boards' pages never read as a reader. *What it left:*
the report's section 7 — and not on the wall, because **the session's
connector still had the tool list cached from before 0.1.57: no
`hand_over`, no `read_record`** (39, 40), the same finding as pass 2b's
4, and the prompt's head had said to turn the connector off and on.

**The third hand.** The driving session read the record through its own
door after "stop": episode four's record held the line edit ("changed a
line in 'The chart drawer' (2 1/8 pages)"); episode three's held the six
set-asides as one change — but printed forty ids under every line, the
whole change's ids on each; and **episode one's record was empty**, though
the payoff claim had been written to its fold a second before the line —
the describer had no words for a payoff on another board (37). Both
fixed (#206). The six set-aside cards are out of episode three's "Act Two"
group and listed under "set aside" on its `list_board`, which the agent
had not been sure of (6, in its section 6).

**Fixed as it ran**, in six pull requests: the folds move with the boards
under fresh ids, a fold on a board the project lacks says so in words,
and the gap line no longer promises a record that is empty (5, 7, 31;
#202); `list_board` carries the change line its description promised (16,
23; #203); `set_aside` counts arrows dropped and drawn against the wall as
it was, and a question reshaped by a cut is one question (27, 28; #204);
a payoff says how many boards back its fold is, and a clean camera check
is said once (34, 38; #205); the record says a payoff was claimed on
another board and each line keeps its own ids (37; #206); a series is read
whole first, and `read_project` says which boards are written and which
carry acts (3, 11, 25; #207). The rest is in `docs/to-do-pass-3a.md`.

### The friction log, as the agent handed it (W = the way in, R = the reading, D = the directions)

1. (W) The agent's fetch tool paraphrased llms.txt; re-fetched by curl.
2. (W) The day-one guide is 42 KB, over what it holds in one reply; three passes. No shorter path for a reading-only session.
3. (W) The on-ramp's "call these first" ends at one board and never names `read_project` or `list_boards`; for a six-board series it found them in the guide, after spending the first reading on one episode.
4. (W) `list_projects` already had "Low Water" working; `open_project`'s one-line reply did not say whether it restarted the "first reading" state.
5. (R) `read_wall`'s first line promised "the record below says what changed since" 00:59; no record followed.
6. (R) Project and board 1 share the name "Low Water"; every header says both; needed `list_boards` to be sure which the counts were about.
7. (R) Cross-episode folds print as raw ids, "Ep 0", doubled quotes in `read_project` — and none of the board ids is in `list_boards`. Five folds on three boards.
8. (R) Duplicate questions on identical headlines cannot say whether one scene is twice on the wall or two scenes share a name.
9. (R) The cue line "no cue on 'A hand's width', 'A hand's width'" cannot be tied to a card.
10. (R) Twelve `read_character` calls to learn twelve wants; `list_board` says only which page lines exist; each reply also lists every card the person is on across six boards.
11. (R) `read_project` gives per-board questions and length but not beats, runs, groups or whether all scenes are written; six more `open_board` + `read_wall` pairs for "how is it built".
12. (R) For a fully written board, two long `read_wall` blocks say "everything is written" eight ways.
13. (R) Three numbers for one board's length (as it prints, by cards, `page_count`'s), with the reading telling it which not to use.
14. (R) [absent] questions list a person id and two card ids in one "(ids: …)" with nothing saying which is which.
15. (D1) `read_pages`: 72–75 KB per board, six of six over its ceiling; no range, no "change lines only".
16. (D1) `list_board`'s description promises each card's "change"; the reply has none. The only way to change lines was 440 KB of pages.
17. (D1) `read_pages` reads only the open board: `open_board`, `read_pages`, ×6, then `open_board` back. Thirteen calls for one question.
18. (D1) `open_board` says "saved to the account" for what was meant as a read; never learned whether switching boards moved anything on the writer's screen. Its first reply carried a presence note the later ones dropped.
19. (D1) Nothing in `read_pages` marks which line is the card's change line; inferred "last action line" and it held.
20. (D1) The "unvoiced" want check counts words; it flagged four followed-through wants and missed the dropped one, whose owner keeps saying the words.
21. (D1) The [absent] questions on Kit were the wall's only trace of the drop; 240 change lines lined up by hand.
22. (D1, harness) Its tools told it to read each saved reply in eleven chunks; scripted round it.
23. (D2) The change lines for judging cuts came from its own extract, not the app.
24. (D2) Act group membership is a bare list of twenty ids in `list_board`; the group's pages are only in `read_wall`. About 28 KB to answer "what is Act Two and how long".
25. (D2) "The second act" has seven readings on a six-board wall; nothing at project level says which boards carry act groups.
26. (D2) "Shorten" has no tool for a written card; the route is the page. `edit_scene`'s existence known only from a one-line tool name until loaded.
27. (D2) `set_aside`'s reply says "6 arrows drawn" and lists five. Five is right.
28. (D2) The reply's tail reported Con's [unvoiced] question as "gone" and "new" because its wording changed; "13 now" overstates the change.
29. (D2) The sag question survived because the median dropped with the cuts; nothing warned that cutting elsewhere sharpens this run.
30. (D2) The write's tail was nearly enough; two reads made anyway because it said nothing about duplicates or the act group.
31. (D3) The wall knew the unpaid fold from the first reading — good — but printed five paid folds as unlocatable; matched one by scene id against `list_board` by hand. A reader who trusted the reading would count six unpaid.
32. (D3) No read of one scene's text; grepped the saved 74 KB instead.
33. (D3) The payoff check reads words, so the page line must repeat the fold's label or the wall keeps asking; it shaped the line.
34. (D3) Episode 4's reading calls the payoff "one board earlier". It is three.
35. (D3) The setups head promises to quote the payoff page's sentence; for the cross-board payoff it quoted nothing. Only "checks: clean" implied the line counted.
36. (D3) `set_payoff`'s tail gave board 1's questions as a count because opening other boards reset board 1's state; two more calls to see the unpaid question gone.
37. (D3) Episode 4's "since" record shows the `edit_scene` and not the payoff claim made from the same board a second earlier.
38. (D3) `edit_scene` appends the same camera-check paragraph to every reply, marked or not.
39. (stop) The guide names `hand_over` and `read_record`; the connector offers neither. The on-ramp's remedy (turn the connector off and on) is not the agent's to do mid-session.
40. (R, stop) Entries 5 and 39 are one gap from two ends: the reading promised a record; the tool that would hold it is missing.

**What it read:** `list_words` 1 · `list_workflows` 1 · `list_projects` 1 · `open_project` 1 · `list_boards` 1 · `read_project` 1 · `list_reminders` 1 · `read_character` 12 · `list_board` 2 · `read_wall` 7 · `read_pages` 6 · `open_board` 9 · writes 3 (`set_aside`, `set_payoff`, `edit_scene`). Off the app: llms.txt twice, day-one.md once in three passes, the six saved pages files many times by script.

## The first half — the size

**No agent in this half:**
the driving session counted every read an agent makes, on the door as it
ships (the stdio server, the JSON tail off, as the hosted door and the
desktop connector hand it over), first on **"Ninety-Nine"** — pass 1a's
complete feature, eighteen written scenes, recovered from the export pass
1b's agent made before it emptied the account — then on **"Last Orders"**
(pass 1b's wall, eight written), then on **"Low Water"**, a series built
through the kernel by `scripts/generate-series.mjs`: six hour-long
episodes, forty cards each, every scene written, one cast of twelve,
seven folds of which four pay off on another board, one promises a board
and names no scene, and one — the brass key — nothing ever pays off. The
counter is `scripts/measure-reads.mjs`; both are kept, so the size can be
rebuilt and counted again after any change. The second half — a fresh
agent handed "Low Water" and three directions that need the whole film —
has its prompt in `blind-runs/pass-3a-prompt.md` and waits on a session.

**Tokens are an estimate** at three and a half characters each, checked
once against a public tokenizer on these very replies: prose ran 3.5 to
3.8 characters a token, `list_board` 2.2 (its ids: a 36-character id is
about sixteen tokens, more than the headline beside it), the plain-text
export 5.2 (its indents). **The budget** the tables mark is 10,000 tokens
a reply — what an agent can take several of in one session — and the
hard line above it is the desktop app's own: pass 1b's transcript shows a
reply of 51,116 characters refused as "exceeds maximum allowed tokens"
and written to a file the session then has to read back, so anything
past about 25,000 tokens does not reach the agent as a reply at all.

## What the numbers say

1. **The tool list is the largest read, and it is on every turn.** One
   hundred tools' names, descriptions and schemas are 90,105 characters —
   about 25,700 tokens — sent with every turn by every client. On
   "Ninety-Nine" that is more than every read of the wall put together
   (about 11,500 for the on-ramp's six). It is the fixed cost of the door,
   and nothing on the wall changes it.
2. **The on-ramp's six calls cost 9,400 to 13,800 tokens before a word
   to the writer**, on a feature or a series alike: `list_words` and
   `list_workflows` are 1,800 and 2,000 on their own, and `list_board`
   4,100 (Ninety-Nine) to 6,000 (a forty-card board), most of it ids.
3. **A feature fits.** On "Ninety-Nine" no read of the wall or the pages
   passes 4,200 tokens; the whole board read three ways — `read_wall`,
   `list_board`, `read_pages` — is about 10,600. Only `export_project`
   inline (51,178 characters) is over the budget, and it is the reply the
   desktop app refused in pass 1b.
4. **A series does not.** On "Low Water", `read_pages` is 73,000 to
   76,000 characters a board — 18,000 to 21,000 tokens, under the desktop
   cap by a margin that a longer episode would close — and the three
   script exports are the same size or larger (`export_text` 113,000
   characters, 22,000 tokens by the tokenizer: the indents). **Every
   board's pages in one session is about 126,000 tokens**, and every
   board read whole is about 180,000: more than a window. `read_wall` is
   10,000 to 14,000 characters a board (2,800 to 4,000 tokens), because
   the runs list every card between two beats by headline; six boards'
   `read_wall` is 17,600. `read_project`, the one call that reads every
   board, is 4,200 for the six — it says each board's questions and
   opens and the folds that cross, and nothing of the cards.
5. **`list_board` is ids.** 21,000 characters for forty cards, 2.2
   characters a token: 9,800 real tokens, of which the ids are more than
   half. An agent that needs an id to act pays for every card's id to get
   one.
6. **What an agent cannot avoid** on a direction that needs the whole
   film: the on-ramp's six; `open_board` and `read_wall` on each board
   (about 20,000 for six); and the pages of whichever scenes the
   direction turns on. There is no read that gives one person's scenes
   with their text, one run's pages, an act's pages, or a card by a phrase:
   the pages come by the board or not at all, so "where is this person's
   want dropped" is six `read_pages` — 126,000 tokens — or guesswork from
   headlines. That is the read the plan calls for (reads that select) and
   the proposed R77 in `REQUIREMENTS.md`.
7. **`export_project` inline is not a reply.** 703,000 characters for the
   series, about 200,000 tokens; through a door with a disk it writes a
   file, and through the hosted door it has to be a link, which it is
   (`inline` is the writer's choice there).

## What the generator found on the way

8. **The duplicate check reads a shared place or verb as the same scene.**
   With filler headlines drawn from eighteen templates, a board asked
   fourteen duplicate questions — "Rosa says Friday" and "June says
   Friday" share "says friday"; "Bram at June's table" and "June's table"
   share "s table" — and two identical headlines on one board ("A hand's
   width", twice) asked once each pairing. With thirty templates and no
   repeat on a board it still asks four to seven a board, all pairs
   sharing a verb phrase with different people and different subjects.
   Names are not counted, by design; the subject words are, and the
   check does not weigh how much of the headline is shared. Worth a look
   before the blind half, since it is a third of what the wall asks.
9. **The wall asks the right things of a generated series.** Beyond the
   duplicates: one [unpaid] fold on the first board (the brass key, as
   built), [absent] on people gone thirty pages (the template rotation),
   [sag] on the long second acts (as built), and [unvoiced] where a
   person's page says a want no page voices — eight to thirteen questions
   a board, no [unsaid] or [behind], since the fillers' change lines are
   quoted whole in their last action line.
10. **"Ninety-Nine" was not on the account.** Pass 1b's agent exported it
    inline before emptying the account, as its prompt said; the reply was
    over the desktop app's cap and went to a file under the session's own
    folder, and the export the on-ramp had it make was the only copy. It
    was found there. A wipe that keeps nothing, and an export that lands
    only in a session's transcript, are one finding: the working list has
    it.

## The tables

### "Ninety-Nine" — one board, 18 cards, all written, about 10 pages

| Read | Board | Characters | Words | ≈ Tokens | Over 10,000? |
| --- | --- | ---: | ---: | ---: | --- |
| tools/list (every tool's name, description and schema — sent with every turn) |  | 90,105 | 11,195 | 25,745 | **over** |
| list_words (on-ramp) |  | 6,404 | 1,238 | 1,830 |  |
| list_workflows (on-ramp) |  | 7,043 | 1,227 | 2,013 |  |
| list_projects (on-ramp) |  | 135 | 18 | 39 |  |
| read_wall (on-ramp, the open board) | Feature | 10,473 | 1,952 | 2,993 |  |
| list_reminders (on-ramp) |  | 1,897 | 304 | 542 |  |
| list_board (on-ramp, the open board) | Feature | 14,427 | 2,008 | 4,122 |  |
| read_project |  | 1,161 | 205 | 332 |  |
| list_boards |  | 272 | 27 | 78 |  |
| list_questions |  | 281 | 44 | 81 |  |
| read_record |  | 203 | 21 | 58 |  |
| list_structures |  | 1,840 | 368 | 526 |  |
| list_files |  | 100 | 15 | 29 |  |
| read_character ("Joe Deasy") |  | 2,150 | 387 | 615 |  |
| read_wall | Feature | 10,562 | 1,971 | 3,018 |  |
| read_wall only questions | Feature | 1,553 | 266 | 444 |  |
| read_wall only length | Feature | 1,048 | 184 | 300 |  |
| list_board | Feature | 14,427 | 2,008 | 4,122 |  |
| read_pages | Feature | 12,084 | 2,192 | 3,453 |  |
| page_count | Feature | 1,925 | 290 | 550 |  |
| read_record | Feature | 203 | 21 | 58 |  |
| export_fountain | Feature | 11,508 | 2,216 | 3,288 |  |
| export_markdown | Feature | 10,236 | 1,929 | 2,925 |  |
| export_text | Feature | 14,425 | 1,758 | 4,122 |  |
| export_project (inline) |  | 51,178 | 4,403 | 14,623 | **over** |

- The on-ramp's six calls, before a word to the writer: ≈ 11,539 tokens, plus the tool list's ≈ 25,745 on every turn.
- One board read whole (read_wall + list_board + read_pages, "Feature"): ≈ 10,593 tokens.
- Every board's read_wall: ≈ 3,018; every board's read_pages: ≈ 3,453; read_project alone: ≈ 332.
- Over the budget of 10,000: 2 of 25 reads.

### "Last Orders" — one board, 9 cards (8 in the film), 8 written

| Read | Board | Characters | Words | ≈ Tokens | Over 10,000? |
| --- | --- | ---: | ---: | ---: | --- |
| tools/list (every tool's name, description and schema — sent with every turn) |  | 90,105 | 11,195 | 25,745 | **over** |
| list_words (on-ramp) |  | 6,404 | 1,238 | 1,830 |  |
| list_workflows (on-ramp) |  | 7,043 | 1,227 | 2,013 |  |
| list_projects (on-ramp) |  | 135 | 19 | 39 |  |
| read_wall (on-ramp, the open board) | Board 1 | 8,949 | 1,701 | 2,557 |  |
| list_reminders (on-ramp) |  | 1,897 | 305 | 542 |  |
| list_board (on-ramp, the open board) | Board 1 | 8,619 | 1,344 | 2,463 |  |
| read_project |  | 836 | 143 | 239 |  |
| list_boards |  | 549 | 84 | 157 |  |
| list_questions |  | 281 | 44 | 81 |  |
| read_record |  | 937 | 95 | 268 |  |
| list_structures |  | 1,849 | 368 | 529 |  |
| list_files |  | 100 | 15 | 29 |  |
| read_character ("Mairead Doyle") |  | 1,216 | 204 | 348 |  |
| read_wall | Board 1 | 9,038 | 1,720 | 2,583 |  |
| read_wall only questions | Board 1 | 706 | 119 | 202 |  |
| read_wall only length | Board 1 | 972 | 170 | 278 |  |
| list_board | Board 1 | 8,619 | 1,344 | 2,463 |  |
| read_pages | Board 1 | 12,993 | 2,402 | 3,713 |  |
| page_count | Board 1 | 1,010 | 156 | 289 |  |
| read_record | Board 1 | 937 | 95 | 268 |  |
| export_fountain | Board 1 | 13,778 | 2,653 | 3,937 |  |
| export_markdown | Board 1 | 10,252 | 1,957 | 2,930 |  |
| export_text | Board 1 | 12,336 | 1,850 | 3,525 |  |
| export_project (inline) |  | 28,126 | 2,568 | 8,036 |  |

- The on-ramp's six calls, before a word to the writer: ≈ 9,444 tokens, plus the tool list's ≈ 25,745 on every turn.
- One board read whole (read_wall + list_board + read_pages, "Board 1"): ≈ 8,759 tokens.
- Every board's read_wall: ≈ 2,583; every board's read_pages: ≈ 3,713; read_project alone: ≈ 239.
- Over the budget of 10,000: 1 of 25 reads.

### "Low Water" — six boards, 240 cards, all written, about 67 pages a board

| Read | Board | Characters | Words | ≈ Tokens | Over 10,000? |
| --- | --- | ---: | ---: | ---: | --- |
| tools/list (every tool's name, description and schema — sent with every turn) |  | 90,105 | 11,195 | 25,745 | **over** |
| list_words (on-ramp) |  | 6,404 | 1,238 | 1,830 |  |
| list_workflows (on-ramp) |  | 7,043 | 1,227 | 2,013 |  |
| list_projects (on-ramp) |  | 133 | 19 | 38 |  |
| read_wall (on-ramp, the open board) | Low Water | 9,826 | 1,658 | 2,808 |  |
| list_reminders (on-ramp) |  | 1,895 | 305 | 542 |  |
| list_board (on-ramp, the open board) | Low Water | 21,158 | 2,679 | 6,046 |  |
| read_project |  | 14,627 | 2,667 | 4,180 |  |
| list_boards |  | 1,111 | 163 | 318 |  |
| list_questions |  | 281 | 44 | 81 |  |
| read_record |  | 203 | 21 | 58 |  |
| list_structures |  | 1,835 | 368 | 525 |  |
| list_files |  | 100 | 15 | 29 |  |
| read_character ("Nell Carrick") |  | 4,147 | 741 | 1,185 |  |
| read_wall | Low Water | 9,917 | 1,677 | 2,834 |  |
| read_wall only questions | Low Water | 3,588 | 471 | 1,026 |  |
| read_wall only length | Low Water | 757 | 131 | 217 |  |
| list_board | Low Water | 21,158 | 2,679 | 6,046 |  |
| read_pages | Low Water | 72,714 | 13,481 | 20,776 | **over** |
| page_count | Low Water | 3,485 | 470 | 996 |  |
| read_record | Low Water | 203 | 21 | 58 |  |
| export_fountain | Low Water | 68,308 | 12,886 | 19,517 | **over** |
| export_markdown | Low Water | 71,286 | 12,712 | 20,368 | **over** |
| export_text | Low Water | 112,151 | 12,498 | 32,044 | **over** |
| read_wall | The Survey | 10,806 | 1,802 | 3,088 |  |
| read_wall only questions | The Survey | 4,184 | 546 | 1,196 |  |
| read_wall only length | The Survey | 757 | 131 | 217 |  |
| list_board | The Survey | 21,269 | 2,701 | 6,077 |  |
| read_pages | The Survey | 74,831 | 13,897 | 21,381 | **over** |
| page_count | The Survey | 3,484 | 468 | 996 |  |
| read_record | The Survey | 203 | 21 | 58 |  |
| export_fountain | The Survey | 69,723 | 13,157 | 19,921 | **over** |
| export_markdown | The Survey | 72,515 | 12,979 | 20,719 | **over** |
| export_text | The Survey | 112,464 | 12,766 | 32,133 | **over** |
| read_wall | Spring Tides | 10,818 | 1,817 | 3,091 |  |
| read_wall only questions | Spring Tides | 4,146 | 548 | 1,185 |  |
| read_wall only length | Spring Tides | 745 | 128 | 213 |  |
| list_board | Spring Tides | 21,387 | 2,704 | 6,111 |  |
| read_pages | Spring Tides | 74,002 | 13,700 | 21,144 | **over** |
| page_count | Spring Tides | 3,513 | 470 | 1,004 |  |
| read_record | Spring Tides | 203 | 21 | 58 |  |
| export_fountain | Spring Tides | 68,894 | 12,960 | 19,684 | **over** |
| export_markdown | Spring Tides | 72,024 | 12,789 | 20,579 | **over** |
| export_text | Spring Tides | 114,361 | 12,566 | 32,675 | **over** |
| read_wall | The Vote | 9,895 | 1,672 | 2,828 |  |
| read_wall only questions | The Vote | 3,634 | 480 | 1,039 |  |
| read_wall only length | The Vote | 757 | 131 | 217 |  |
| list_board | The Vote | 21,005 | 2,639 | 6,002 |  |
| read_pages | The Vote | 72,918 | 13,499 | 20,834 | **over** |
| page_count | The Vote | 3,442 | 460 | 984 |  |
| read_record | The Vote | 203 | 21 | 58 |  |
| export_fountain | The Vote | 68,101 | 12,819 | 19,458 | **over** |
| export_markdown | The Vote | 71,111 | 12,655 | 20,318 | **over** |
| export_text | The Vote | 111,942 | 12,446 | 31,984 | **over** |
| read_wall | The Maureen | 10,752 | 1,771 | 3,072 |  |
| read_wall only questions | The Maureen | 4,011 | 492 | 1,146 |  |
| read_wall only length | The Maureen | 757 | 131 | 217 |  |
| list_board | The Maureen | 21,243 | 2,665 | 6,070 |  |
| read_pages | The Maureen | 73,292 | 13,562 | 20,941 | **over** |
| page_count | The Maureen | 3,493 | 465 | 998 |  |
| read_record | The Maureen | 203 | 21 | 58 |  |
| export_fountain | The Maureen | 68,689 | 12,927 | 19,626 | **over** |
| export_markdown | The Maureen | 71,668 | 12,762 | 20,477 | **over** |
| export_text | The Maureen | 112,407 | 12,544 | 32,117 | **over** |
| read_wall | Equinox | 9,474 | 1,623 | 2,707 |  |
| read_wall only questions | Equinox | 2,912 | 380 | 832 |  |
| read_wall only length | Equinox | 757 | 131 | 217 |  |
| list_board | Equinox | 21,169 | 2,668 | 6,049 |  |
| read_pages | Equinox | 72,244 | 13,322 | 20,642 | **over** |
| page_count | Equinox | 3,480 | 466 | 995 |  |
| read_record | Equinox | 203 | 21 | 58 |  |
| export_fountain | Equinox | 67,855 | 12,730 | 19,388 | **over** |
| export_markdown | Equinox | 71,079 | 12,542 | 20,309 | **over** |
| export_text | Equinox | 114,502 | 12,325 | 32,715 | **over** |
| export_project (inline) |  | 703,655 | 68,074 | 201,045 | **over** |

- The on-ramp's six calls, before a word to the writer: ≈ 13,277 tokens, plus the tool list's ≈ 25,745 on every turn.
- One board read whole (read_wall + list_board + read_pages, "Low Water"): ≈ 29,656 tokens.
- Every board's read_wall: ≈ 17,620; every board's read_pages: ≈ 125,718; read_project alone: ≈ 4,180.
- Over the budget of 10,000: 26 of 75 reads.
