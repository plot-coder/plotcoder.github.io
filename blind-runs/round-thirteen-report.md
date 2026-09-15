# Round thirteen — the report

Run 2026-09-14. The first feature, "Ninety-Nine" (`round-thirteen-treatment.md`),
through the published package at 0.1.15, wired before the session, started in
an empty folder. The writer's directions were relayed from the app-review
session, which the agent noticed, as in rounds eleven and twelve. Thirty-two
entries; the reading, the wall, and every direction are itemised in
`REQUIREMENTS.md` under "The blind run". Nothing below is fixed yet.

## The six to fix first, and where they live

Robert's choice after the round. Each is a finding an agent had to work around,
not a wording.

1. **No way to unsize a card** (entries 9, 16). `set_length` refuses zero and
   nothing clears a length; the agent deleted the card, remade it, redrew its
   arrows and rebuilt its group. The kernel's `set_length` in
   `src/board/reducer.js` should take null (the value that claims nothing, as
   `create_note` already leaves it), and the tool in
   `scripts/plotcoder-mcp-server.mjs` should accept "unsized". The card's
   length picker on the wall may want the same.
2. **`delete_note` says nothing of what it takes** (entry 17). The kernel drops
   the card's arrows and its group membership; the tool's reply should name
   them by headline, as `delete_arrow` names its cards.
3. **No tool adds a card to an existing group** (entry 18). `create_group`
   makes a new frame; there is no `add_to_group` (or `create_group` taking a
   group id). The kernel's group commands are in `src/board/reducer.js`; the
   wall's own gesture is drag-into-frame.
4. **The Markdown export titles a one-board film with the board's name**
   (entry 26). `toMarkdown` and `toPlainText` in `src/board/markdown.js` take
   the project's name only when the project has several boards, so
   "Ninety-Nine" with one board "Feature" goes out as "Feature". Fountain and
   Final Draft follow the same rule in `src/board/fountain.js` and
   `src/board/fdx.js` and should be looked at together. The callers are the
   `export_*` tools in the server, `src/fountainFile.ts`, and the console door
   in `src/board/store.ts`.
5. **An unwritten scene's change line prints unmarked** (entry 27). Every
   export sets the change line where action would be, in the same type. The
   Markdown could set it in italics with a word; the plain text and Fountain
   have their own marks to choose. Decide the mark once and use it in all
   three.
6. **A "leave it" is tied to the reading it answered** (entry 19). By the
   time edits were applied, one question had gone and two had come; the
   `leave_question` tool's description and the guide should say that edits
   come before leaves, and the reply to a leave that no longer matches should
   say which reading it was answering.

Each of the six needs a unit test (kernel or module) and, for the tools, a
case in `scripts/plotcoder-mcp.test.mjs`. None needs a mockup except the
length picker if it changes; fix 3 may want a word with Robert about the
gesture's twin.

---

What follows is the agent's report, verbatim.

---

## 1. What I built and what you had me change

I started the project "Ninety-Nine" with one board, "Feature", at a 90-page target, and built the treatment as eighteen cards with the nine turns marked as beats, three folded corners with their setup arrows, seventeen follows arrows, three act groups, the logline verbatim, and a cast of five with notes only. You then corrected the days to six and put them on the headlines, added Ciara to Mallow and Joe to the glove box, took Ciara off the kitchen card, folded the dawn drive into the bus station card, unsized the lay-by, and left five of the wall's questions. You had me write the pier at Fenit as a scene, which measured at 7/8 of a page, export the wall as Markdown for a Google Docs reader, and report the length: three pages as a script, about 19 3/8 as a wall, both under ninety.

## 2. The friction log

1. **The way in.** The on-ramp's first paragraph says to skip to "Call these first"; the next says to read the guide before the first call. Two adjacent sentences name two next steps.
2. **The way in.** Five doors fill most of the on-ramp. I had to read each to be sure none applied.
3. **The way in.** The on-ramp says to make "the four again" after `new_project`; the guide says only `read_wall`. They disagree.
4. **The way in.** Every list reply is doubled, prose then the same JSON. The switch that drops the JSON is a server environment variable I cannot reach from a session.
5. **The way in.** The `board` parameter on `new_project` appears in the schema and nowhere in the on-ramp or guide. I guessed it named the first board.
6. **The build.** The reply confirmed the guess. Entry 5 was a documentation gap.
7. **The build.** The guide puts a scene's day in the headline. There is no field, so the app cannot read or relate days.
8. **The build.** That convention made the duplicate check flag the two "Day one. The yard:" cards and the two "Day three." cards. They share a prefix, not a job.
9. **The build.** The treatment sizes the bank call at a quarter page, but the call shares a card with the pull-in and the cough. No way to size part of a card.
10. **The build.** Every `create_note` reply repeats the same advice about colour and organize. Eighteen times.
11. **The build.** The sag check measures defaults. With most cards unsized at a page, the median is one page and any three-card run "sags".
12. **The build.** Maeve, in no scene, lives only in notes. She is written twice, on Joe's page and Ciara's, and the app relates neither.
13. **The build.** The one-place rule split one paragraph, the dawn drive and the bus station, into two cards. The rule decided, not the writer.
14. **The reading.** The reading lists each setup's distance but not which fold it pays off. Fine with one fold per card, not otherwise.
15. **The reading.** "About 1 pages" in a document otherwise in sentences.
16. **Directions.** No way to unsize a card. The length tool refuses zero. I deleted and recreated the card, then redrew two arrows and rebuilt a group.
17. **Directions.** The delete reply says "Deleted card." and nothing about the arrows and group membership it removed.
18. **Directions.** No tool adds a card to an existing group. I ungrouped and regrouped rather than test what a second frame would do to the first.
19. **Directions.** A "leave it" is tied to the reading it answered. After the edits one of the four questions was gone and two new ones had come. Nothing warned me the order mattered.
20. **Directions.** The duplicate check fired again on the two bus station cards for sharing a place in the headline.
21. **Directions.** A headline-only edit replies "Updated" plus the new text without saying the headline changed. A change-line edit says "change line".
22. **Directions.** The script's heading is the bare place in capitals. No interior or exterior, no time of day, and no way to add one. The card says night; the page does not.
23. **Directions.** The records list cards in creation order. The reading and the pages use wall order. Three reads, two orders.
24. **Directions.** The write reply says the estimate under a measured card is "untouched", so a sized and then written card carries two lengths and only one shows.
25. **Directions.** The records carry the left questions in the JSON tail and say nothing of them in the prose.
26. **Directions.** The Markdown export is titled with the board's name, "Feature". The project's name appears nowhere. A one-board film goes out without its title.
27. **Directions.** An unwritten scene's change line prints exactly where action would, unmarked. A reader cannot tell the one written scene from sixteen placeholders.
28. **Directions.** "A form she can paste in" fit two exports. One phrase in the guide settled it, and whether she sees headings or hashes depends on Paste from Markdown, which nothing mentions.
29. **Directions.** A beat's headline prints twice in a row in the Markdown, as section heading and as synopsis.
30. **Directions.** The export reply gives a line count and nothing about what the file holds.
31. **Directions.** The paginator's note says unwritten scenes count as one line each; its description says they set their change line as action; the pagination shown fits the description. I cannot tell which rule made the three pages.
32. **Directions.** The paginator leads with "pages: 3 of 90" and puts the caveat two lines down.

## 3. What the on-ramp told me that I did not need, and what it did not tell me that I did

**Not needed.** The five doors and their config blocks, the shell door's environment variables, the folder wall and its sample of Maya and Tom, the account-claiming instructions, and the hosted door. In a session with the server already wired, one sentence covered my case and the rest was reading to rule out.

**Needed and absent.** That `new_project` names its first board. That a day has no home but the headline and that headline prefixes trip the duplicate check. That a length, once set, cannot be cleared. That deleting a card silently removes its arrows and that no tool adds a card to a group. That a scene heading carries no time of day. That a one-board project's exports go out under the board's name. That a left question is tied to the reading it answered, so edits must come before leaves. That an unwritten scene prints its change line unmarked in every export. That the records list in creation order while the reading and pages list in wall order. I worked out each of those from a reply or a file, and the last three only by reading what came out.

## 4. What you asked for that I never found a way to do, or did another way

- **Unsize the lay-by.** No tool does it. I deleted the card and made it again.
- **Rebuild Act three around the new card.** No tool adds to a group. I ungrouped and regrouped.
- **Size only the phone call.** No tool sizes part of a card. On your word the card is unsized.
- **Put night on the pier's heading.** No way. It lives in the headline only.
- **Put the film's title on the producer's document.** No way through the export. The file says "Feature".
- **Leave "all four" questions.** Three survived the edits and were left. The two new ones were left on your second word.
- **Keep Maeve in one place.** She is in two people's notes.

## 5. What I was never sure had landed

- **The writer's screen.** Every write replied "live on every open wall". I never saw a wall and cannot say what it shows.
- **What each delete removed.** The replies did not say. The later records showed nineteen arrows and eight cards in Act two, which fits, but I confirmed it after the fact, not from the reply.
- **The old Act three frame.** The ungroup reply said only "Ungrouped". The records later showed three groups, so it went.
- **The three pages.** Whether the paginator counted unwritten scenes by the rule in its note or the rule in its description.
- **The producer's view.** Whether the Markdown renders in Google Docs depends on how she pastes it. I could not check.
- **The left questions.** The tool says they return on their own when a card in them changes. I did not test whether they come back, or whether you would be told when they do.
