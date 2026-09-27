# Pass 3a — the report, first half: the size

Run 2026-09-27, the first pass of goal 3 in `docs/plan.md` (projects past
an agent's context window, worked hands-off). **No agent in this half:**
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
