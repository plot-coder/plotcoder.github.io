# Round fourteen — the report

Run 2026-09-16 (local), through the published package at 0.1.17 — the release
carrying round thirteen's six fixes — wired before the session by hand into
`~/.claude.json` (the `claude` command is not on this machine), started in the
app's "No folder" scratch workspace. "Ninety-Nine" again, so the wall is
comparable with round thirteen's. The writer's directions were relayed from
the app-review session, one at a time: the ferry dated, a headline retitled,
the lay-by sized and unsized, the ferry deleted and undone, the dawn bus
station moved into Act three, four questions left, the pier written, the
script out as Markdown, plain text and Final Draft and the Final Draft file
back in, the length as script and wall, the numbers locked and a scene added
between two, a blue revision with one line changed, and a person's page read
and written. Forty-nine entries.

**Worked through on 2026-09-17**, at Robert's word on the recommendations:
every entry is fixed, has a requirement (R55, when a scene happens; R56,
story order is the arrows), or was decided against — a length inside a card
(14), cues tied to the cast (28) — and one was left as it is on purpose:
`list_reminders` prints in full on every read (7). What each entry became is
in `REQUIREMENTS.md` under "The blind run", round fourteen. The card's own
line for a scene's when waits for its mockup.

---

What follows is the agent's report, verbatim.

---

# Ninety-Nine on PlotCoder: the report

## 1. What I built and what you then had me change

I started a project called "Ninety-Nine" with one board, "Feature", a 90-page target and the logline verbatim. On it: seventeen cards, one per scene of the treatment, nine of them marked as beats; five in the cast, Joe, Ciara, Noreen, the mechanic at Mallow and the boy at the fair, each with notes holding the treatment's facts and nothing else, Maeve in Ciara's notes only; eight places; sixteen follows arrows in one chain and three setup arrows, chime, letter, ten-euro note; three groups titled Act one, two and three; the fair at four pages, the ferry at half, the rest unsized; the wall organized into nine rows.

You then had me: date the ferry day four; retitle the second bus station scene, then drop its full stop; size the lay-by at a quarter page, then unsize it; delete the ferry and undo the delete; move the dawn bus station into Act three; leave all four of the wall's questions; write the pier scene; export the script as Markdown, plain text and Final Draft; import the Final Draft file back; report the length as script and as wall; lock the numbers and add the chips scene between the ferry and the pier; start a blue revision and change Ciara's last line; read Ciara's page and write her want.

## 2. The friction log

**The way in**

1. The on-ramp gives two starting orders. One paragraph says an agent with the tools in front of it should skip to "Call these first"; the next says read the guide before the first call. I read the guide first and guessed that was the intent.
2. The four first calls read whatever project the server last touched. read_wall opened onto an existing project with no line saying how many projects the account held. I needed list_projects, which the on-ramp does not name, to know what was there.
3. Every reply carries a JSON tail repeating the prose in full. read_wall's description says a server environment variable drops it. From inside a session there is no way to set it, so every reading arrives twice.
4. new_project's schema has a `board` parameter that the on-ramp and guide never mention. I guessed it names the first board.
5. The list of what a treatment should answer appears three times: in the guide, in list_workflows' prose and in its JSON.
6. The guide says a fresh folder holds a sample wall and read_wall "says so". On the account, the prose never said whether it read the sample; only the JSON tail carried `"sample": false`.
7. list_reminders prints the six house principles in full every time. The on-ramp asks for it twice on the way in, the same twelve paragraphs.

**The build**

8. The on-ramp says to make "the four again" after new_project. Two of the four say in their first line that they belong to no project. I made the other two and guessed.
9. new_project's undocumented `board` parameter did name the board. The schema was the only thing that told me it existed.
10. The app's only home for when a scene happens is the headline, as free text. There is no way to say "day unknown" that differs from "no day given".
11. create_note places every new card on a five-wide grid with a rotation and reports a position that organize throws away a minute later. Seventeen replies each told me where a card sat that it no longer sits.
12. read_wall's sag question is about three unsized cards against runs of one. Every card in it is the one-page default, so the question measures the default, not the story, while the reply says the estimate is the writer's.
13. Both duplicate questions come from the headline style the workflow asks for. Two scenes on day three at Kilmallock, or two at the bus station, share most of their words, and the check reads them as one scene. The app's advice feeds its own check.
14. A length inside a card cannot be recorded. The quarter page of the bank call lived nowhere while the card was unsized.
15. No tool shows the wall. organize returns coordinates. The guide's "nearest thing to a look" is an export I was told not to make yet.

**The reading:** nothing beyond 12 and 13.

**Your directions**

16. update_note's reply says "Updated" and echoes the whole card. It does not say which field changed or what it was before.
17. Your headline ended with a full stop and the others did not. The app took it as given and nothing said so.
18. The duplicate check went quiet after the retitle, but update_note's reply said nothing about it. Any edit meant to answer the wall costs a second call to see whether it did.
19. set_length's reply gives the board's new runtime; update_note's and create_note's do not. Only some edits tell me what the wall adds up to afterwards.
20. delete_note removes the card's arrows and does not join the cards on either side. move_scene rewires; delete_note leaves a hole and does not say the chain is broken.
21. undo's reply says how many cards came back and the totals, then "list_board has the board". It does not say what came back with the card. Confirming "arrows and all" cost a full board read.
22. add_to_group's JSON lists the card last in the group, after the final scene, not in story order. Nothing says whether a group's order means anything.
23. Your reasons for leaving questions have nowhere to go. A leave records kind, ids and a timestamp. The next reader will see four questions left and not why.
24. After the leaves, the checks line says "checked and clean: no run out of proportion; no beats back to back; no two headlines alike" beside "4 left by the writer". Those three kinds are exactly the ones left, not clean.
25. Four leaves cost six calls: a read before, because a leave the edits have overtaken is refused, four leaves, a read after. Each leave reply repeats the question's full text and three sentences of boilerplate.
26. read_pages titles the script "Feature", the board's name. The guide says a one-board film goes out under its project's name.
27. The scene heading comes from the card's place and nothing else, so the pier prints as THE PIER AT FENIT with no night on it. There is no way to put a time of day on the heading.
28. Nothing says whether a cue like JOE is matched to the cast record "Joe Deasy", or whether the app cares if a cue names someone not on the card.
29. read_pages titles the script "Feature" and export_markdown titles it "Ninety-Nine". The guide says every script out is titled the same way. read_pages is not.
30. In the Markdown, the headline and the [Unwritten] change line are two italic paragraphs in a row. The mark is the only difference between synopsis and placeholder.
31. The Markdown drops the cast and the fold that the Fountain export carries as notes. The tool's description does not say so.
32. The plain text drops every headline. The day and time of every scene, which the workflow told me to put on the headline, are nowhere in this form, and the description does not say so.
33. The plain text has a blank line in the middle of scene 11's paragraph, between "In her coat" and "pocket she finds", where a page ends. "No page numbers", but the break shows as a gap inside a sentence.
34. The plain text has no beats; the Markdown has a heading per beat. Nothing says which forms carry the beats.
35. import_fdx said "0 written onto cards" though the file carried the pier's text. It did not say whether it skipped the pier because the text was identical. I checked the card's timestamp to know.
36. import matches "the card with the same heading in order". Six cards share THE VAN. It held for a file straight out and back in; a reordered file from the agency is untested and the description says nothing.
37. page_count says the unwritten scenes "count as one line each here". They print as their change lines wrapped over three to six lines, and the description says so. The reply's one-line claim contradicts both.
38. move_scene drew the right arrows and tidied the card into the wrong place, on the pier's row after the pier it should precede. Its own "story order", read_wall's runs, list_board's order and the locked number all followed the position. organize put it right. move_scene's tidy is not organize.
39. The locked number moved: 10A after move_scene, 9A after organize. lock_numbers' description says "moving cards never renumbers".
40. page_count says "scene numbers here are the locked numbers" and then numbers the scenes 1 to 18 in sequence, the chime as 18 when it is locked at 17. The JSON carries the same wrong numbers.
41. The order the wall reads is the cards' positions, not the arrows. A card can be wired between two cards and read as somewhere else until the wall is tidied, and every reading and number goes with the wrong place.
42. While the card sat in the wrong place, one of your four left questions vanished from "left, for now" and came back after organize. No reply said it had been dropped.
43. move_scene's tidy stamped every card's last-changed time, all eighteen, though seventeen did not move.
44. create_note under a lock gives the card no number in its reply. The first answer I got from the board was wrong.
45. The guide says a changed line prints "in the colour with a star" and Final Draft out carries revisions. The plain text has no star, the pages have no mark, the Final Draft file has no revision data at all.
46. write_scene's reply says nothing about the revision it was written under. The only place the card is called "changed in blue" is a bracket in list_board's prose.
47. start_revision with no name invents one from the colour. Nothing in the description says a name is optional or what it defaults to.
48. Changing one line means resending the whole scene. There is no tool for a line, and the app cannot know I meant to change only one.
49. read_character lists a person's cards in creation order, not wall order, and does not say so. The chips scene, ninth in the story, comes last.

## 3. What the on-ramp told me that I did not need, and what it did not tell me that I did

**Did not need.** About two thirds of the on-ramp and a third of the guide are doors: the MCP config block, the shell door with its batch file and environment variables, the hosted door, the account config, the page's window object, the folder without an account, the sample wall, claim_account, the difference between "the open app" and "the file". The tools were in front of me from the first message and the account was the wall, so none of it applied. The on-ramp says to skip the doors, then spends its length on them. The guide's warning about running the dev server, and its "written to file" case, never arose.

**Did not tell me, and I had to work out.**

- That new_project can name its first board. Found in the schema.
- That the wall's order is the cards' positions, not the arrows, and that move_scene's tidy and organize are not the same. Found when a card landed after the beat it precedes.
- That an A-number follows position under a lock, against the lock's own description. Found when 10A became 9A.
- That the readings of the script are titled differently: read_pages by board, the exports by project.
- Which forms carry what: Markdown has beats and headlines but no cast; plain text has neither headlines nor beats; Fountain has cast and fold notes. Found by reading each one.
- That revision marks do not print in any form, so a revision is a wall-only fact.
- That page_count's numbers ignore the lock and its "one line each" is false.
- That a left question can be dropped and restored without a word, and that a leave carries no reason.
- That the JSON tail cannot be switched off from inside a session.
- That a card's cast is not tied to the cues in its text.
- That the day of a scene lives only in free text, so "no day" and "day unknown" are the same thing.
- That undo's reply does not say what came back with a card, and that delete_note leaves the chain broken.
- That import_fdx skips identical text silently and matches by heading order.
- The treatment's own contradictions, five days against a sixth morning and the bus station's day, were mine to catch and yours to rule on. The on-ramp's checklist did not prompt for consistency between a treatment's summary and its prose.

## 4. What you asked for that I never found a way to do, or did another way

- **A quarter page for the call inside an unsized card.** No way. Length is per card. We went to a quarter page and back, and the number lives nowhere.
- **Your reasons for leaving the four questions.** No way to record them. The leave holds kind, ids and a time.
- **"Add a scene between the ferry and the pier."** move_scene wired it there and placed it elsewhere. I got it there with organize afterwards, which was not the tool I reached for and which I ran without being asked, because the wall's reading was wrong until I did.
- **"Tell me what number it got."** I got three answers, 10A from the board, 11 from page_count, 9A from the pages after organize, and had to pick the one that matched the arrows.
- **"Change Ciara's last line."** No tool changes a line. I resent the whole scene with one line different.
- **"What the agency would see on the page" for the revision.** I could only report absence: no star, no colour, no revision data in the Final Draft file.
- **A night on the pier's heading.** No way; the heading is the place alone.
- **A form for Google Docs with the cast on it.** The Markdown drops the cast. I told you; I did not fake it.
- **Bring the ferry back "arrows and all".** undo did it, but the reply did not say so; I confirmed with a full board read.

## 5. What I was never sure had landed

- **The wall's layout.** I never saw it. organize returned coordinates that look right, and the act frames should sit as blocks, but after add_to_group moved a card between acts I did not organize, and whether the frames look right on your screen I cannot say.
- **The revision on the wall.** list_board's prose says the pier card is "changed in blue". Whether it wears blue on your wall, I cannot see, and no page out shows it.
- **The Markdown in Google Docs.** The guide says the headings hold through Paste from Markdown. Not tested from here.
- **The Final Draft file in Final Draft.** The numbers 9A and 10 are in the XML. Whether Final Draft shows them as locked, and how it treats a file with no revision data, I cannot check.
- **The cues.** Whether JOE and CIARA in the pier's text are tied to the cast records, or whether the app would notice a cue naming someone off the card.
- **The chips card's group order.** You said it does not matter. I do not know whether it ever does.
- **The gap after delete.** Closed by undo, and the arrows came back with their old ids, but only a full board read told me so, and that read is the only evidence.
- **The wrong-place minute.** For the minute the chips card sat after the pier, the wall read it as between the pier and the bus station and dropped a left question. Every reply looked healthy. I caught it only because I compared the reply's story order against the arrows I had asked for. A reader trusting any one reply would not have.
