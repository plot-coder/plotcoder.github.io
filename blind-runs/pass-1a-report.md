# Pass 1a — the report

Run 2026-09-22, the first pass of goal 1 in `docs/plan.md` (a complete
script), on "Ninety-Nine" (`round-thirteen-treatment.md`) at **0.1.51**,
through the **user-scope stdio server** in this Mac's `~/.claude.json`
(`npx -y plotcoder-board@latest`, signed in as the test account) — not the
desktop connector `plot-coder` beside it, which the prompt named: same
package, same account; the door's session memory and undo trail are what
it did not measure. The writer's answers and the eighteen directions were
relayed from the driving session, from the head of `blind-runs/prompt.md`.
**One hundred and fourteen entries.**

**What the pass was for, answered.** *A complete script came out of the
tools:* eighteen scenes written in story order from their paragraphs, every
card measured, exported three ways, the Final Draft file back in with the
wall unchanged. *The length while half written and when whole:* two
numbers from two tools that said to report the smaller (42, 44); the
sketches' "guess about a guess" printed for a finished draft (45); the
writer's three figures kept underneath and reported as "0 sized" (46); the
write tails' account of what a change did to the length wrong six times
(66, 74, 80, 91, 97). *The sweeping edits, each through tools alone:* a
plant moved with its card (64–69); the ending replaced and, later, put back
by retyping, since undo is a stack and would have taken the lock with it
(70–75, 103–107); a plant and its payoff cut out of the film and the cast
(76–82); a rename that reached the roster and the cards and not a word of
any page (83, 84); ten pages asked of a stretch that measured four, with no
tool to measure it (92–94); the ferry set aside and the fair halved, the
writer's leave re-asked as the chain of turns grew (95–97); a revision that
marked one line where five scenes had changed since the agency's copy,
because nothing said to start it before the first draft went out (98, 99).
*What the app can say of the whole:* nothing. The logline printed and
unchecked (72, 85); a setup arrow still claiming a payoff the page did not
make (71); a turn undone by the next one, invisible to the wall (73); a
plant's page number joined from two tools by hand (86); a second payoff on
the page the wall does not hold (87); a person's empty want never listed
(88, 89); "what changed since" answered from the agent's own record (90).
Section 6 is the pass's finding in one place: every question about the
film as a whole was answered by reading ten pages beside the wall, because
no tool reads the one against the other.

**Beside those.** The desktop app cuts a server's instructions at 2048
characters (1): round twenty-four's D4, answered. Eighteen cards were
eighteen round trips (18). The sag read a wall of default pages (21). A
maybe on a card has no form on the page (34, 35). "Cut" meant two tools
(95). A card set aside took a locked number (103).

**What became of it (2026-09-22, the same day, as it ran):** worked in
`docs/to-do-pass-1a.md`, on Robert's "fix all of the friction": thirty-
eight fixes built with tests as the run went — among them `create_cards`,
a title page with a byline and contact on the project, a rename that
follows onto every page, `measure`, a reading that says what changed since
the last one, the sag waiting for half the cards, a left question keeping
its word when only its figures move, and how long it is once the script is
whole — and three decisions written up for Robert's word: **R74**, the
pages read against the wall (68, 71, 72, 73, 85, 88); a proposed cut (92);
the title page's field in the app (50). The rest decided against, with the
reason. 729 unit tests, `npm run build` clean; released after the run.

The report as it was handed over, verbatim:

---

# Ninety-Nine on PlotCoder: the report

The same report is attached as a file, with all 114 entries in full. This message carries every section; the log here is complete, not abridged.

## 1. What was built, written and changed

From your treatment I built one project, "Ninety-Nine", one board, "Feature", against a 90-page target: eighteen cards in story order, nine of them beats, three act groups, five in the cast with what the treatment states on their pages, eight places, five days, three folds with their setup arrows, your three lengths, and your central question as the logline verbatim. Ten things you left open are held in your words on the cards. I then wrote all eighteen scenes from their paragraphs and exported the script three ways. On your directions I moved the glove box to the mechanic's yard, replaced the ending with the scrap-and-two-thousand version and later put the original back, cut the boy and his ten-euro note out of the film and the cast, renamed Noreen Blaney to Noreen Gallagher on the wall and the pages, set the ferry aside, halved the fair, left seven of the wall's questions with your reasons, started a blue revision, changed Joe's last line under it, locked the scene numbers, and exported the blue script and a copy of the whole project. The film stands at about 8 2/8 pages by its cards, 10 paginated, 17 scenes in the film and one aside.

## 2. The friction log, complete

**The way in**
1. The connector's own instructions arrive cut off mid-sentence: "…which is a name until th… [truncated]". Whatever followed was lost until llms.txt repeated it.
2. The on-ramp names two documents, says read day-one once and the whole guide "when the writer says write it", then says "where this page and the guide differ, the guide wins". I could not know whether the guide overrides day-one for the build without reading both. I guessed day-one was enough.
3. The on-ramp says read day-one "before your first call if you can" and separately lists the first calls. I made the first three while the guide was still downloading. Nothing says what goes wrong if you do.
4. new_project: the treatment says "a feature, ninety pages". The tool says kind is "in place of pages or minutes". I passed both. The reply said only "Its target is 90 pages". I cannot tell whether "feature" was kept or silently dropped.
5. new_project says a film's board needs no name, "leave board alone and do not ask the writer to name it". You had named it. I followed you. Nothing says what a named board on a film costs.
6. export_project says pass an absolute path or take the JSON in the reply. Through the hosted connector I could not tell whose disk a path would land on, so I took it inline and saved it myself. A guess.
7. empty_account said it deleted "1 board(s), 10 card(s), 1 file(s)". I never saw that file; nothing told me to call list_files before emptying, so my saved copy does not hold it.
8. list_projects on the fresh project failed with a bare "TypeError: fetch failed". A retry worked. The error says nothing about what to do.
9. The on-ramp says after new_project "read the wall once it holds cards", and also to make the three reads of the wall you are to work. I read the empty board; it reads fine. The "once it holds cards" made me hesitate for nothing.
10. The on-ramp says never spend the first reading on someone else's wall. Your direction was all six first calls before changing anything. I did both. The on-ramp does not say which wins when a writer's order and its own disagree.

**The asking**
11. The workflow joins the central question and the premise in one question with two tools. The treatment answers the series half. The empty wall's reading did not list the premise, so I could not tell whether a blank one gets asked about.
12. "Five days in August" is a fact about the whole film. The app holds a when per card, the premise for what is true before the film, and open lines only for what is undecided. Nothing holds a decided fact about the whole film's time.
13. The central question comes after "The film asks:" with a lowercase "can", and you said verbatim. set_logline got it capitalised. My call; the app says nothing about casing a quoted line.
14. "The phone call from the bank runs a quarter of a page." set_length sizes a card, not a moment inside a scene. Asked you which.
15. The "go on" arrived from another Claude session, not from you in this chat. Every direction after it did too. Nothing on the app's side.

**The build**
16. The on-ramp says add a person before casting them. Each add_character reply then raised an "[uncast] X is in the cast but on no card" question, five in a row, all gone once the cards landed.
17. Casting "Ciara Deasy?" on the kitchen card made the "[uncast] Ciara Deasy" question go. The reply's "gone:" line reads as though a maybe had decided where she comes in.
18. create_note wires by `after`, but parallel calls land in arrival order, so eighteen cards were eighteen round trips. No batch door for a treatment.
19. When the ninth card landed the wall asked "[empty] two turns back to back ... or have you not got that far yet?" Mid-build that is premature, and it stands on every reading after.
20. "[duplicate]" fired for the two bus station cards. Nothing says what the check compares, so I could not tell what headline would avoid it or whether I should try.
21. "[sag]" fired for a 2 2/8-page run against a median of about 1 page, on a wall where fifteen of eighteen cards were unsized and read as a page each. The median was the default, not the story.
22. create_group's reply says only "Grouped 3 cards as 'Act one'". Only read_wall later says the group is read as an act. The write does not confirm the title was recognised.
23. August went on the first card's when only. Nothing carries a fact about the whole film's time.
24. You said Joe's cough is not a plant and to say so if the wall asks. The wall cannot ask about a thing that lives only in a change line. I put your sentence in Joe's notes, the only home for it.
25. The treatment's list says "the phone call from the bank" and the text has Joe ring the bank. Not the app's. The headline had to pick one.
26. The reading does not list the premise at all, so entry 11 resolves: a film with no premise line is never asked about it.

**The reading**
27. The reading's "blank on the wall" lists "no length: 15 of 18 cards". You said leave the rest unsized; the app has no words of yours to hold that, so it is listed as blank on every reading.
28. The reading says act groups' lengths are not questioned but still counts their pages; it never reads an act against the others. Acts are shown and never read.
29. The runtime says "70 2/8 under" plainly. Nothing in the reading says the number is mostly the default page, except a "made of" line a reader has to work out.

**Direction 1: leave the three questions**
30. leave_question's reply quotes each question twice, so three leaves came back as six full questions and then "The wall still asks nothing". Correct, and three times longer than needed.
31. Each leave wants the ids as read_wall listed them. For the sag those are the two beats either side of the run, not the cards in it.

**Direction 2: write every scene**
32. The guide's Pages section shows cues as JOE and CIARA; every write_scene reply then says "cues match by the whole name ... cue JOE DEASY". Guide and reply disagree. Fourteen of eighteen replies carried the nag. Nothing says what the mismatch costs.
33. The write_scene reply is a fixed paragraph of about 120 words, eighteen times; only the numbers and the cue note vary.
34. Scene 2, the kitchen. The card holds Ciara as a maybe and the paragraph gives her reply. The page has no form for a maybe person's line, so I wrote Joe's side with "(listens)". The page and the card agree only by my choice.
35. Scene 5, Mallow. Same for Ciara: the van dies on the page with nobody at the wheel.
36. Scene 6. Its measure moved the median and the sag question you had left came back on its own: "left, for now: 2 (was 3)". Your reason had not changed; a number had. It then "changed shape" on four later writes, re-quoted in full each time.
37. Scene 7, the fair. Your 4 pages was replaced by the measure, 1 6/8, the moment text landed, and the same for the ferry and the lay-by. Your given lengths are in no count unless the text is deleted.
38. Sixteen of eighteen scenes are called "a sketch: shorter than the page it was read as". The word says unfinished; the label measures against the default page, not the scene.
39. Scene 13, the lay-by. The bank is not a person; Joe's side only. Measured 3/8 against your 2/8, reported plainly.
40. Scene 18. The camera check marked "Nobody knows why." as "(knows)". That is your sentence, used as given. Right by its rule, wrong for the line. "THE END" counted as a line.
41. Scenes 3, 4, 8 to 12, 14 to 17: nothing new beyond 32, 33 and 38.
42. page_count gives "about 9 6/8 pages, by the cards — say this one to the writer" and "pages: 11 of 90" paginated. With every scene written, the two differ by more than a page and the tool says report the smaller.
43. You asked for the friction after each scene. Each write is a tool call, not a message, so the entries came per batch. My doing.

**Direction 3: how long, measured and guessed**
44. "How long" takes two tools with two numbers and neither shows the pagination, so the page and a quarter between them cannot be placed.
45. With every scene written, read_wall still prints "if the 16 sketches ran to the page ... about 19 7/8 pages — a guess about a guess". A second length for a finished draft.
46. "0 sized by the writer" hides that you sized three cards.
47. The answer to "what is measured and what is guessed" is one line in the middle of a sixty-line reading, and the short read does not carry it.

**Direction 4: Final Draft, Markdown, plain text**
48. export_fdx refused by my session's own permission gate, not the app. The other two exports passed in the same call.
49. Without a path, neither Markdown nor text names its file. "What each is called" has no answer from the app.
50. No byline, draft date or contact on any title page, and no tool to set one.
51. The plain text has no page breaks and no page numbers, so a page turn shows only as a missing blank line. Eleven such joins for eleven pages.
52. export_markdown's description says "the headline as a synopsis line" per scene. It prints the headline only on scene cards, not beats.
53. export_fdx's description does not say what an unlocked, unrevised script's title page shows.

**Direction 5: the Final Draft export again**
54. The second call passed the same gate that refused the first, unchanged. Not the app.
55. The FDX title page carries a bare date that is today's. Nothing says it is the export date; a reader would take it for a draft date.
56. Only the Final Draft export names its file.
57. Headlines travel into Final Draft as scene titles. The description does not say so.
58. "INSERT", "BACK TO SCENE" and "THE END" all go out as action. write_scene's description names only action, cues and dialogue.
59. My first attempt to save the file was refused by my own gate because I rebuilt it from the Markdown instead of copying the reply. My doing.

**Direction 6: take the Final Draft file back in**
60. import_fdx said "2 written onto cards, 16 matched with the same text" and not which two or what differed. I read all eighteen pages back to find them.
61. The round trip rewrote three all-caps lines with a "!" prefix. The page prints the same; the stored text is not what I wrote. Nothing says a round trip rewrites text.
62. list_board says "left, for now: 3" while read_wall lists two left and one asked. The two reads disagree.
63. read_pages refused once by my own gate, allowed on retry. Not the app.

**Direction 7: move the glove box**
64. Your direction said move the card; the app's rule is one place and one stretch of time is one card, and a card was already there. The tools allow either and say nothing. I asked.
65. The move dropped your leave without saying which one went, and raised the same question again one card along. Your reason had to be given again.
66. write_scene on an already-written card claimed "the runtime moved 5/8 down". It did not move.
67. The duplicate check fired for two cards that share place, time and a headline prefix. You chose two on purpose. The only way to say so is leave_question.
68. The page's notes carry the plant on the folded card and nothing on the paying-off card. A reader of the pages cannot see a payoff.
69. move_scene said "setup arrows untouched" and nothing about the plant. That it still pays off, and from how far, I had to read the wall to learn.

**Direction 8: leave two; new ending**
70. The new headline raised a duplicate against the refusal card because the two share the place and the sum. The check reads words, not what the scenes do.
71. The chime's setup arrow still stood and the reading still called it paid off, though the page said the chime does not play. The app cannot tell a payoff from its absence and will not ask.
72. The logline is unchanged and unchecked. set_logline says every card should be checkable against it. Nothing checks.
73. That the eighth turn was undone by the ninth was invisible to the wall. Nothing reads a beat against the one before it.
74. write_scene's tail said "the runtime moved 3/8 down"; it moved 1/8 up.
75. "Noreen scraps it" could be a line or a thing seen. Seeing it would need machinery the treatment does not have, so it was a line. My reading.

**Direction 9: cut the boy and the note**
76. remove_character said "left, for now: 3 (was 4)" without saying which leave went. The mechanic's-yard duplicate you left became neither asked nor listed, for a reason I cannot see.
77. list_board's count of left questions was six; read_wall's three.
78. Deleting the setup arrow raised "[unpaid] ... where does the boy's ten-euro note come back?" and the unfold in the same batch cleared it. A question that lived for one call.
79. The fair's estimate of four pages still stands underneath a scene that no longer has what it was sized for.
80. write_scene's tails said 2 7/8 down and 6/8 down; it moved 5/8 and 2/8.
81. A removed person's page goes with them and nothing says so.
82. "Cut the boy" did not name the roster. I took him off it so the wall would not ask where he comes in. My inference; you confirmed.

**Direction 10: Noreen Blaney is Noreen Gallagher**
83. rename_character renames the roster and the cards and not a word of any page. "Everywhere" took a rename and two full rewrites, because edit_scene needs its text to occur once and a cue never does.
84. Nothing tells the writer after a rename that the pages still carry the old name.

**Direction 11: read the whole script**
85. No tool reads the pages or the cards against the logline. The reading prints the sentence and moves on.
86. A plant's page number is nowhere in the app. page_count has page starts, read_wall has cards and a distance, and the join is by hand.
87. The letter pays off twice on the page and once on the wall, because one arrow was drawn. Nothing asked for a second.
88. "wants: (empty)" is never asked about. The house reminder says give a clear want; no check reads a person's page.
89. "Does her want show" is wholly a reading. The app's answer is a blank line.

**Direction 12: how long now, and what changed since**
90. "What changed since" has no tool: no history, diff or changelog. Answered from my own record of every reply.
91. The write tails are the app's own account of what a change did to the length, and they were wrong five times by then. The only trustworthy figures are two readings subtracted by hand.

**Direction 12a: propose ten pages to cut (nothing done)**
92. Nothing on the wall can hold a proposed cut. set_rank proposed is for turns only; set_aside cuts for real. A proposal has to live in chat.
93. The app never says an act runs long. Act groups are "not questioned"; the sag check reads runs against a median, never acts against each other or a target.
94. The length of a stretch between two cards is nowhere in the app. The four pages between Mallow and the bus station came from adding eight measures by hand.

**Direction 13: cut the ferry, halve the fair**
95. "Cut the ferry" maps to set_aside or delete_note and nothing says which a writer's "cut" means. I chose the one that keeps the card; you confirmed.
96. The set-aside dropped your leave on the empty run and re-asked it as a chain of three turns. The reason had to be given a third time.
97. write_scene's tail said "the runtime moved 3 3/8 down"; it moved 4/8. Sixth wrong figure.

**Direction 14: blue revision, Joe's last line, the script again**
98. The revision marks only what changes after it starts. Nothing prompted a revision when the first draft went out, so the agency's blue pages star one line while five scenes and a cut had changed since their copy.
99. The numbers shifted with the ferry cut because no lock was set. lock_numbers exists and says "ask the writer"; nothing at export says the numbers are loose after a draft has gone out.
100. edit_scene, for one line, was clean: the text occurred once, the reply named the change and the mark. The one direction with no friction of its own.
101. On export the "!" marks came off again. Stored text and exported text differ; a second import would put them back.
102. The title page has three lines now and still no byline or contact.

**Direction 15: lock the numbers; put the ending back**
103. lock_numbers locked 18 numbers on a wall of 17 scenes in the film. The ferry, set aside, holds locked number 18, last, and would return there rather than to its place.
104. "Put it back as it was" has no tool. Undo would have taken the lock with it. The restore was typed from my record; a writer without one would be typing from memory.
105. Restoring the headline dissolved a left question and its leave, silently as to which.
106. The restored ending is starred as new. The revision cannot tell a restore from a change.
107. The camera mark on "Nobody knows why." is back. Entry 40 again.

**Direction 16: the whole script as it prints**
108. lock_numbers promised every script's title page would say when the numbers were locked. The plain text's does not.
109. The page turns are still invisible: eleven joins. With stars in the margin, a reader will take them for faults in the new pages.
110. The app said it marked seven lines; the page stars ten, one per printed line. The two counts differ and nothing says why.

**Direction 17: a copy of the whole project**
111. The file comes back inside a prose reply, with the board's JSON escaped as a string inside the outer JSON. It had to be cut out by hand. Through the hosted door there is no other way onto your disk.
112. Seven left records in the file, two live on the wall. Dropped leaves persist as records, which is what list_board counts while read_wall counts questions. Neither says which it counts.
113. "Pictures and takes are not in the file", and nothing says how to know whether there are any without list_files. One file went unseen with the first project.

**Direction 18: who has this wall open**
114. who_is_here answered plainly and needed nothing else. Noted that every write's tail all session said "no wall open right now", so nothing I did was seen by a person as it landed.

## 3. What the on-ramp told me that I did not need, and what it did not tell me that I did

**Told and not needed.** The doors and the wiring page, since the tools were in front of me. The sample wall of Maya and Tom, which an account never shows. The folder door, the shell caller, PLOTCODER_JSON. The series machinery: episode lines, boards named for episodes, folds paying off on another board. The presence tail's wording, since no one ever had the wall open. The page-long list of what the reading checks, which every reading prints anyway.

**Not told and needed.** That cues are matched by a person's whole name, while the guide's own example says JOE. That a written scene's measure replaces the writer's given length in every count. That a left question dies on its own when a card in it changes or the median moves, and takes the writer's reason with it, and that two reads count the dead ones differently. That the revision snapshot covers only what comes after it, so it has to start before the first file goes out. That the numbers move on a cut until locked, and nothing at export time says so. That a Final Draft round trip rewrites all-caps action lines. What the duplicate check compares. That new_project cannot keep both "a feature" and "ninety pages". That a maybe person has no form on the page. That removing a person deletes their page. That the hosted export_project returns the file inside prose, escaped. That headlines travel into Final Draft as scene titles. That there is no title page beyond a title, a date and a revision line. Where a fact about the whole film's time lives, which is nowhere.

**Worked out myself.** Page numbers for plants, by joining page_count to read_wall. Length changes, by subtracting two readings, because the write tails were wrong six times. Which cards an import rewrote, by reading all the pages back. Which leave the wall dropped, four times, by reading the wall. That a set-aside card gets a locked number. That "left, for now" in list_board counts records and in read_wall counts questions, from the project file.

## 4. What you asked for that I never found a way to do, or did another way

- **Ten pages' worth to cut** from a stretch that measured 4 1/8. Reported the fact, proposed about 1 2/8 at most, cut nothing until you chose.
- **The friction after each scene.** Came per batch, since a write is a call and not a message.
- **The rename "everywhere".** The tool reaches the roster and the cards. The pages took two full rewrites.
- **"Put the ending back as it was."** No tool. Retyped the headline, the change line and the scene from my own record.
- **"What changed since the last time I asked."** No history. Answered from my record of every reply.
- **"Where on the page does each plant land."** Joined two tools by hand.
- **"Cut the ferry."** Two tools fit. Set aside rather than deleted; you confirmed.
- **"Cut the boy."** The roster was not named; I took him off it; you confirmed.
- **The Final Draft file, the first time.** Refused by my own session's gate, not the app. Passed unchanged on the second try.
- **The chime after the new ending.** I left the arrow that claimed a payoff and reported it, since whether "nothing from the roof" was the payoff was yours to say. Never decided; the ending went back first.
- **A second setup arrow for the letter**, which pays off twice on the page. Not asked for, not drawn, reported.

## 5. What I was never sure had landed

- Whether "a feature" survived beside the 90-page target in new_project.
- What the one file was that empty_account deleted from the first project, and so whether my copy of that project is whole.
- Which two cards import_fdx rewrote, until I read every page back; and whether a second round trip would restore the "!" marks, which I inferred and did not test.
- Which leave went, on the four occasions a reply said "left, for now: N (was N+1)" and nothing more.
- Why the mechanic's-yard duplicate stopped being asked after the boy was removed, when neither of its cards changed.
- The runtime after any single write, since the tails were wrong six times; only a fresh reading confirmed it.
- Whether the ferry at locked number 18 would come back as 18. The tool says locked numbers never move; I did not bring it back to see.
- Whether the plain text's title page is meant to carry the lock's date. lock_numbers promised it; the text does not show it.
- Whether the maybe on Ciara in the kitchen and at Mallow, and on Joe at the glove box, is ever read against the pages, where she has no line and he is absent.
- Whether an export_project path through the hosted door writes anywhere at all. Never tried.

## 6. What you asked about the film as a whole that no tool could answer, and how I answered instead

- **How long, and what is measured and what is guessed.** read_wall for the by-the-cards figure and its "made of" line, then page_count for the paginated figure. Could not tell from either where the page and a quarter between them falls, or that your three given lengths were kept underneath and uncounted.
- **What changed since.** No tool. My record of every write reply, card by card, checked against two readings.
- **Is it still the film the question asks.** read_wall prints the logline and nothing else. Read the ten pages with the sentence beside them. Could not tell from anything in the app whether the ending answered it, that the eighth turn was undone by the ninth, or that two turns had lost their hinge on the page.
- **Where each plant lands and pays off on the page.** read_wall for the setups, page_count for page starts, read_pages for the lines, joined by hand. Could not tell from the wall that the letter pays off a second time in Clare.
- **Does Ciara's want show in her scenes.** read_character printed "wants: (empty)". Read her fourteen scenes. Everything I said about her want was a reading of my own lines, since the treatment states none.
- **What the new ending did to the question, the chime and the turns.** read_wall showed the arrow still claiming a payoff and the same nine beats. Read the last three scenes. Could not tell from the wall that a payoff in "nothing" is no payoff, or that a beat can undo the one before it.
- **The second act runs long; propose ten pages.** No tool judges an act. Summed eight measures by hand; the stretch was four pages.
- **Who has this wall open.** A tool answered, plainly: nobody but this session.
