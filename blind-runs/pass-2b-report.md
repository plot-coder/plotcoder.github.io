# Pass 2b — the report

Run 2026-09-27, the second pass of goal 2 in `docs/plan.md` (a person opens
the app after the agent has worked) — the reverse of 2a: **a fresh agent
picks up "Last Orders" from the wall alone**, through the desktop
connector, the door at **0.1.57** with the record of a session (R76), and
the pass measures what it had to be told again. The writer's answers and
six directions were relayed from the driving session, from the head of
`blind-runs/prompt.md`. **Thirty-six entries.**

**What the pass was for, answered.** *From the wall alone, before asking:*
the film, what is decided and open, and which scenes are written — told in
full, from the premise, the cards, the reading's open and blank sections
and the pages. *What the agent before it did and was waiting on:* not
told. The record began with 0.1.57, after every change of pass 1b's, so it
was empty (18, 31); no last word had been left (the tool did not exist
then); and **the desktop app had kept the connector's tool list from the
handshake it made when the connector was added, at 0.1.55, so `read_record`
and `hand_over` were not in this session's tools** though the door had
them and the guide named them (4, 36). The agent rebuilt the night from
the export file's timestamps by hand (19). *The hosted door's session is
the connector's, not the agent's:* a fresh agent opened with "since your
last reading: 2 changes" that were the last agent's, and undo's preview
named the last agent's `set_text` — had the board not changed since, an
undo would have taken back another session's work (6, 16). *Its own
changes on the record:* after five writes, `read_wall` opened with "since
anyone last changed this wall: 5 changes by an agent, today 00:57 to
00:59 — …" in the writer's terms, and the agent read its changes back from
that line rather than from memory (31); the driving session, as a third
hand through its own door, read the same record (`read_record`, below the
report). *`hand_over` at the end:* reached for, and not there (36).

**Beside those.** A one-line insert and a note struck both read as
"rewrote" on the record, and "5 changes" listed six lines (32, 33). A tied
thread's start page is not read against the thread's name as a fold's
payoff page is (27). The pages' bracketed notes are the last agent's, in
the first person, unattributed, and go stale when the wall moves on (9,
29). The day-one guide does not name `edit_scene` (24).

**What became of it (2026-09-27, as it ran):** worked in
`docs/to-do-pass-2b.md`, every entry accounted for; the fixes that a
session can make went into 0.1.58 after the run (the record's words for a
line changed and a note taken off, the count's wording, the set-aside
card's written state, the how-long line carrying the paginated number
once the script is whole, the export replies, the descriptions, the
on-ramp's sentence on a connector's cached tool list, `edit_scene` named
on the day-one path). Held for Robert: the door's session behind one
connector (6, 16), a hand and a time on a page's notes (9, 11, 29), a
thread's pages read like a fold's (27).

**The third hand, through the driving session's own door, after the run:**

```
The record (the account, as test@test.com, working "Last Orders", the only project on the account), newest first — the last 5 changes:
- an agent, today 00:57 to 00:59 — 5 changes:
    "The last night of service" now pays off "The man from the chain"
    rewrote "The last night of service" (7/8 pages)
    tied where "her husband's fish knife" is first seen
    changed the cards on "her husband's fish knife"
    rewrote "The first Friday of the winter" (5/8 pages)
    rewrote "The pier: with Priya, her husband's fish knife" (5/8 pages)
```

The report as it was handed over, verbatim:

---

Stopping. This is the report, and the only thing I hand back. I could not leave a hand-over on the wall: the guide names hand_over for that and this connector has no such tool, so I left nothing there rather than misuse another field.

1. WHAT I FOUND, AND WHAT YOU HAD ME CHANGE
One project, one board, a feature target. Eight written sketch scenes in the film and one card set aside; two beats; six in the cast; the logline and fifteen other things open by your word; two questions asked (the man's card unpaid, the fish knife's loose start) and one left (the sign, unsaid). No hand-over and an empty change record from the night before. You had me pay off the man's card on the last night (setup arrow, one line on the page), start the fish knife thread on the first Friday (thread tied, one line on the page), strike the stale note on the pier page, and read it all back from the wall. Five writes. The wall now asks nothing.

2. FRICTION LOG, complete
1. (way in) On-ramp fetch through my page tool came back as a summary; had to pull the raw file.
2. (way in) Day-one guide 42 KB; my tool cut it at 41 KB, two passes.
3. (way in) Connector tools are names only until loaded one by one; cannot know which are needed until directed.
4. (way in) Guide names read_record and hand_over for picking up another session's wall. Neither exists here.
5. (way in) list_projects: "who has it open: not known until who_is_here asks"; a second call.
6. (reading) read_wall's first line on my first reading: "since your last reading: 2 changes". I had never read. Whose, unsaid.
7. (reading) Every scene "a sketch: under the page it was read as"; the threshold is never stated.
8. (reading) list_boards says 9 cards; read_wall 8 + 1 aside, "0 of 8 unwritten". The aside card's written state is nowhere stated.
9. (reading) Bracketed page notes are first person and unattributed; no author or time.
10. (reading) Only timestamps: list_boards' last-changed and the export's filename. Nothing says what the last change was. The leave is dated to the day.
11. (reading) Mairead's page holds "the fish knife is his" in notes and "Her husband: I don't know yet" open. Both stand.
12. (reading) [unsaid] says "not a word of the plant" while the leave reason says DOYLE'S is on the page. By design; reconciled by hand.
13. (reading) read_wall gives one length and says to report page_count's; a second call.
14. (reading) list_questions is maintainer-only Help-sheet questions, not the wall's.
15. (reading) "no want on the page" for all six; the wall cannot say whether you declined or nobody asked.
16. (direction 1) undo preview reported "set_text" as this session's last change when I had made none: the hosted door's undo stack is shared with the previous agent. Nothing said so.
17. (direction 1) undo names the change "set_text", not the card.
18. (direction 1) Export JSON: "record": [] and "handOver": null. The fields exist, empty, visible only by dumping the project.
19. (direction 1) No tool reports timestamps; rebuilt last night from updatedAt fields by hand.
20. (direction 1) Two pages carried doubled blank lines like a deleted line; nothing said so; no prior text kept.
21. (direction 1) "undecidedPage": true in the export; unexplained.
22. (direction 1) export_project inline did not say whether a file was also written; checked list_files (none).
23. (direction 2) No "where in the scene" on the wall; placement was mine.
24. (direction 2) Day-one guide omits edit_scene; only the whole guide has it. Without it I would have resent the page.
25. (direction 2) edit_scene insert says "a new paragraph"; unclear whether several can go; kept one.
26. (direction 2) Arrow first raised a transient [unsaid] that the page write cleared; nothing said which order.
27. (direction 3) The wall checks a fold's payoff page for words but not a thread's start page; the page could have been skipped unasked.
28. (direction 3) Placement again mine.
29. (direction 3) Page notes go stale when the wall moves on; nothing says so.
30. (direction 3) A tied thread gets no distance or "pays off" line, unlike a setup arrow.
31. (direction 4) The record works now: read_wall opens with "since anyone last changed this wall" and my five changes in your terms. Last night's session left it empty; the wall cannot say why.
32. (direction 4) Record says "5 changes", lists six; one thread call told as two.
33. (direction 4) Record calls a one-line insert and a note strike "rewrote".
34. (direction 4) edit_scene silently normalised blank lines elsewhere on both pages it touched.
35. (direction 4) edit_scene's description never says an empty replace removes the paragraph; guessed, confirmed by the reply.
36. (stop) No hand_over tool; left nothing on the wall.

3. WHAT THE WALL TOLD ME AND WHAT IT COULD NOT
- The film: told, by premise, cast, cards and pages.
- Decided and open: told in full by read_wall's open and blank sections and list_board.
- The agent before me: not told. No record tool, record field empty, hand-over null. I rebuilt a timeline from export timestamps and one shared undo entry. What it was waiting on: nothing anywhere.
- Which scenes are written: told for the eight in the film (all, as sketches); not told for the set-aside card (inferred unwritten from "unsized").
- What to ask: the two wall questions and the one left came from read_wall. The rest (the notes' authorship, Mairead's two husband lines, the aside pier card) came from reading the records against each other, not from any question the wall asked.

4. WHAT YOU ASKED FOR THAT I NEVER FOUND A WAY TO DO, OR DID ANOTHER WAY
- What the agent before me did: no read_record; done by export_project inline, undo preview and timestamps. What it was waiting on: not done, nothing to read.
- Leave whatever I would leave: no hand_over; left nothing on the wall. This report is the hand-over.
- Reading the on-ramp: by raw fetch, not my page tool.

5. WHAT I WAS NEVER SURE HAD LANDED
- Whether your session read my messages: every delivery said "not confirmed read".
- Which of the two 22:25 page edits last night was yours, and which the shared undo's "set_text".
- Whether the doubled blank lines edit_scene normalised marked anything.
- The two inserted lines landed where I said (verified by read_pages); whether that is where you want them is yours.

6. WHAT I LEFT FOR THE NEXT HAND, AND WHERE
- The wall asks nothing; the 15 open things stand; the sign's [unsaid] stays left. read_wall lists them.
- Mairead's page: notes still say the fish knife is her husband's while her open line says leave it open. You said leave it open; I changed neither.
- "The pier: alone, the man's card": set aside, unwritten, change line open. The man's card now pays off on the last night; whether that card still means anything is yours.
- The last night's change line does not mention the card; the wall does not ask, since the line is yours.
- Last night's export file (Last-Orders-2026-09-26T22-22-53-785Z.json) is still on the account's files.
- The wall's own record line names my five changes until the next change by another hand.
