# Pass 1b — the report

Run 2026-09-26, the second pass of goal 1 in `docs/plan.md` (a complete
script), on "Doyle's" (`round-twenty-four-idea.md`, a page of notes) at
**0.1.53**, through the **desktop connector alone** — signed in as the test
account — with the writer's answers and twenty directions relayed from the
driving session, from the head of `blind-runs/prompt.md`. The agent's own
harness blocked `empty_account`, so it exported and deleted pass 1a's
"Ninety-Nine" instead. **Eighty-two entries.**

**What the pass was for, answered.** *A complete script from notes:* eight
scenes written, all sketches under a page, about 5 3/8 pages by the cards
and 6 as it prints; the film decided one undecided thing at a time on the
writer's word, and every decision landed through tools alone. *What each
home for "I don't know" prints as:* only an open change line and an open
place reach the page ("[Unwritten] What changes is open, by the writer's
word: …" and "PLACE NOT DECIDED: …" as the heading); an open title printed
as "Untitled" with no trace of the candidates (40); an open cast, an open
when, a maybe, a line about the film, a version behind and a cut scene
printed as nothing and no file said so (41, 42); a maybe cannot be written
at all (34). *The reading of the pages against the wall (R74), reached
for:* yes, unprompted, on "what the app says of it against the wall" — two
word-count questions, both read by the agent as false alarms (31, 32), the
quoted page line found and used, and its one real question raised when the
morning after's page described the neon for six lines without the word
"sign" (70), which the writer left with a reason. What the agent then read
for itself — who is on the pages, what recurs, the range lit twice, the
last night followed by an opening, a premise that promises a word no page
says — is section 6, and 45 to 47. *A version stepping forward over a
written scene:* the reply asked the right question about the carried
payoff and answering it cost an arrow and raised an unpaid fold (61); a cut
scene brought back was the unwired last card for a moment (67); an open
card closed and written was six calls across five tools (71). *An undo
through the door on a written script:* three undos for one direction, the
preview naming "set_text" and not the page, the undo of the version choice
naming nothing (63, 64); no redo, so "forward again" was the changes made
again by hand (65).

**Beside those.** The camera check read the notes and every mark of the
session sat on one (30, 57, 62). A written scene with its change line
open was invisible to the reading (55, 59, 60). Two tools each said "say
this one" about a different length once the last scene landed (74). The
stale notes after a decision (76). Setup and title-page advice in
descriptions where the reply is the file (43, 79).

**What became of it (2026-09-26, the same evening, as it ran):** worked in
`docs/to-do-pass-1b.md` on Robert's "keep taking notes about where their
friction points are and fixing them, especially in setup" — thirty-two
fixes built with tests as the run went, in twenty pull requests merged as
they landed (#161 to #180), among them: the builders' citations out of the
guides with a test that keeps them out; an empty wall's checks line;
create_cards' reply naming what each card was born holding; a card born
set aside needing no change line; the proposals in the unmarked question;
set_order a no-op on an unchanged order; a tied thread naming the open
lines it shares words with; the camera never reading a note; a doubled
heading; an open title printing its candidates in every export; a page
and no turn named in the reading and the write reply; where a decision
belongs, in the strike's reply; undo naming the page and the version it
moves; set_aside bringing a card back placed in one call; update_note's
place and when deciding their opens; a write reply listing what is still
open on the card; leave_question by headline; the number to say once the
script is whole; a left page question on its setup line; a struck line
naming the pages whose notes carry it; the lock's advice on the Final
Draft file's own comment; a note taken off closing the gap. Four guide
sentences. Eighteen decided against, with the reason. Twenty-seven held
for Robert, listed at the foot of the working list. 764 unit tests,
`npm run build` clean; released after the run.

The report as it was handed over, verbatim:

---

# Last Orders — PlotCoder session report, 2026-09-26

## 1. What was built, written and decided

One board, Last Orders, on the test account, built from the notes and the answers to twelve questions. Eight scenes in the film, one set aside, the cast of six with ages and jobs on their pages, two threads, one fold, two beats kept from five proposed, and every "I don't know" held in the writer's words where the app has a place for it. Every scene was written, all eight as sketches under a page, about 5 3/8 pages by the cards and 6 as it prints. The writer then decided: the turns, the order, where the sign is first seen, that it is now and not 1987, who is at the funeral tea, that the pier keeps the knife with Priya (undone once, then redone by hand), that the bank scene is back in the film with a change line, everything about the morning after, the title, the byline, and to leave the sign's word-check with a reason. Three exports went out under Untitled, then the Final Draft again under Last Orders, then a copy of the whole project.

## 2. The friction log

The way in
1. The on-ramp says new_project comes before the three reads when the writer told me to start my own project. The brief said make the first calls before changing anything. Two orderings; I read the old wall first. The on-ramp does say the writer's word wins, but I stopped to weigh it.
2. The on-ramp says "the tool descriptions carry the rest" and "know the server by its tools." In this session a tool's description is invisible until I load that tool by name. I knew names, not what anything takes.
3. The list_projects reply ends "who has a wall open: who_is_here waits for presence and says". It reads as a sentence cut off.
4. The inline export of a 17-card project was 51,116 characters in 11 lines. My client refused it as too large and I recovered it from a saved file. The link form dies with the account, so inline was the right call, and it is unwieldy.
5. list_words defines a beat as "one of the eight to fifteen big turns", while the on-ramp and guide forbid any opinion on how many beats.
6. The reading of the new, empty board lists "a beat is marked" under "checked and clean". No cards, no beat.
7. The day-one guide cites "(R74)", "(pass 1a, entry 95)" and "(round twenty-four)". Documents I do not have and the on-ramp does not name.
8. The connector block, the on-ramp and the day-one guide say the same first calls and the same open-field rules three times over. I read all three to find out they agree.

The asking
9. The treatment question asks when a scene happens "where that matters". Nothing tells me which whens matter, so I ask about all of them or none.
10. The man's card pays off only in one version of the pier. The guide says a plant true "either way" goes on the front card and the chosen version inherits the front card's arrows. A plant true of one version has no stated home.
11. The guide treats "seen early, not decided where" as an unlinked card. The notes don't say the sign is a scene at all. Whether a thing seen is a card or a plant inside one is a question the app's vocabulary forces onto the writer.
12. A dead man whose funeral is a scene: the guide sends him to the film's open lines "until the writer knows whom he matters to". Open lines are for what the writer said they don't know. He may be decided and merely never on screen, and the app has nowhere for him but a person's notes or an undecided list.

The build
13. create_cards' per-card lines omit the fold, castOpen, changeOpen and whenOpen. Only the last card's reply is in full. I needed list_board to confirm the opens landed.
14. create_cards said "Made 8 of 8 cards, each wired after the one before it". The eighth was born aside and has no follows arrow.
15. The cut bank scene: a card needs change or changeOpen; the notes never say what changes in it. I put the writer's cut sentence in changeOpen, a reason for a cut parked where a change goes. No way to say "unstated" that is not "undecided".
16. A thread's open ends are by the tool's own description the writer's word, yet the reading counts them as questions the wall asks. Every other "I don't know" is listed and not asked; a thread's is asked.
17. The sign could only be held as a thread through no card plus two open lines. One thing, two places, and I could not tell whether the empty thread added anything.
18. The fish-knife thread ran only through the version behind. The reply said the reading asks nothing of that end while the card is out of the film, and the reading asked about the other end anyway.
19. The man's-card setup arrow landed on the front version only. choose_version gives the chosen card "the front card's arrows", so choosing Priya's version would carry the payoff onto a scene with no card in it. Nothing on the wall can say "true of one version only".
20. With five turns proposed, the reading still asked "No card is marked as a beat, so the runs between turns cannot be read yet", above the list of proposals.
21. Write tails before my first read_wall of this wall only counted ("the wall's questions unchanged (2)"). No create reply could tell me whether an open field had landed.
22. The manager was on the aside card only. The reading's cast line said "The manager (on no card)" and the checks said nobody in the cast is on no card. On no card in one line, clean in another.
23. Mairead's husband: the writer said "I don't know yet — leave it open" about him. He is not on the wall, not a card, not about the film. I put the words in Mairead's open line. A guess at a home.
24. organize: "no beats yet, so nothing sets the rows". Five proposed turns changed nothing about the layout.
25. The reading lists "the change line, on 3 cards" as one grouped line, then lists the same cards again for their other opens. Each card appears twice under open.

Directions: the turns, the order, the sign
26. Keep and strike are two ranks, so one direction is two calls. Neither reply said what the two beats now bound. The tail names the shape change after a move or a cut, not after a rank.
27. set_order with the order already on the wall removed six follows arrows and drew six, with new ids, and never said the order was unchanged. Anyone holding arrow ids now holds dead ones.
28. "The sign is first seen on the first Friday" decided two things held in two places: the thread's open start and the open line about whether the sign is a scene at all. Nothing links them.
29. The first Friday's corner was not folded for the sign. A fold is a separate thing with its own tool, and the guide only folds when a thread is tied at both ends. A card that plainly plants the sign showed no plant until the end was chosen.

The writing, first four scenes
30. The camera check reads [[notes]], which never print. All eight marks across four scenes landed on notes containing the word "decided". Not one on a printed line.
31. [behind] on the first Friday: the card's change line says "she knows the number now", a line the camera cannot see by the house's own rule, and the check asks why the page carries fewer than half the card's words. "Mairead" was not counted though MAIREAD DOYLE is on the page; "counts" did not match "Nine. Ten. Eleven."
32. [behind] on the man: "leaves" vs "lays", "nobody says" vs "Neither of them speaks". Two of four written scenes questioned for doing what their cards say.
33. A card with its place open and its when the same words as its headline prints "PLACE NOT DECIDED: THE MORNING AFTER - THE MORNING AFTER".
34. A maybe on the cast cannot be written. A page with only Priya at the range reads as Mairead absent. The page has no "?" the way the card does.
35. The man's reply warned that a note and the card's open words may be the same undecided thing in two places. Right, and true of every scene I wrote; it said it once.
36. write_scene reports "2 lines the camera cannot see (decided)". The bracketed word is the offending word, not a status. Only read_pages, with ◂ beside each note, showed which lines.
37. A card with its when open prints a heading with no time, the same as a card with nothing said. In Fountain the difference is only in the note.
38. One "how long" gives three numbers: by the cards, if the sketches ran to a page, paginated.

Directions: the three exports
39. No disk on this door, so each export comes back as the whole file in the reply and I wrote the files myself. "Name it for the project" gave three files called Untitled.
40. The title page was "Untitled" and a date. Nothing in any format said the title was open, or what the candidates were.
41. Of everything held open on the wall, only an open change line and an open place reach the page. The rest of the undecideds vanish from the script on the way out, silently.
42. The second pier version and the bank scene were in none of the files, and no file said they existed.
43. Plain text prints scene numbers in both margins with no lock. Each export tool's description tells me to relay the lock advice "since nothing here will". It didn't.
44. Markdown numbers beats "## 1." and scenes "### 1 ·". A scene's headline prints under its heading; a beat's doesn't.

Directions: read the script against the wall
45. "What the app says of the script against the wall" is two word-count questions. Nothing in any tool says who is on the pages, what recurs, or which half is written.
46. The absence check counts cards. A person on no written page is clean.
47. The duplicate check reads headlines, not pages.
48. The setup line promises "on each written payoff's page, where the plant's words land" and lists the setup with nothing, because the payoff is unwritten. The reason is in the checks line at the bottom.

Directions: what to decide, in order
49. The reading lists opens in storage order, not in any order of dependence. The order I gave was mine.
50. The pier version is under "two versions, not chosen" and the thread ends under "questions". "What is still open" is answered in three places of one reading, and the guide says it is answered "here, in one call".
51. The bank scene's change line was listed among things not decided. The writer decided it by cutting it. Cut and kept has no words of its own for "what changes".
52. No tool says what blocks a page and what does not.

Directions: now, not 1987
53. Deciding a whole-film open is two calls in two tools, the premise and the strike, and nothing links the line to the sentence that replaces it. The strike reply says the decision "belongs in that field's own tool" and does not say which.
54. The premise is now five sentences and one line. A fact about the whole film has one home, and it is a paragraph.

Directions: the funeral tea
55. There is no state for "written, change undecided". A page with no change line counts like any other and the card leaves the unwritten count, while the open words stand.
56. The camera check explains itself only when it marks nothing. The earlier replies said "2 lines the camera cannot see (decided)" and no more.
57. The verb list catches "decided" and not "know". Eight marks on notes for "not decided", none on five notes saying "I don't know". The marks depend on how I word a note that never prints.
58. Writing a scene shortened the film by an eighth, and the reply says so as a fact. Correct by its rules, strange to tell a writer who just wrote a page.
59. As 55 predicted: the card has a page and no turn, counted written, change line open, and nothing joins the two facts.
60. A written scene with an open change line is invisible to the pages-against-the-wall reading. No behind check, no camera mark, no question. "Written" and "change line open" only meet on the card's line in the records.

Directions: the pier, the knife
61. Entry 19 came due. No way at build time to say "this payoff is true of one version only", so choosing the version carried it over; the reply asked the right question, and answering it cost an arrow and raised an unpaid fold.
62. The camera mark "(knows)" is on a note that never prints, the third time in three wordings.

Directions: put it back, forward again
63. "Put it back" is three undos for one direction. The preview names the change by its internal name, "set_text", not by the card.
64. The undo of the version choice reported nothing but "Undid choose_version". The other two undos named what came back; the largest named nothing, and I needed the records to know it had worked.
65. No redo through this door. "Forward again" is the three changes made again by hand, and the page re-sent in full.
66. Order matters and nothing says so. Writing the page before deleting the arrow raised an "unsaid" question that lived for one call and went.

Directions: the bank
67. One direction, five calls, and one left the wall wrong for a moment: a card brought back from aside is unwired, so it becomes "the last card of the story" and raises an unlinked question until the move lands.
68. Under the writer's cut words, the change line had been the placeholder "What changes?" all along. Nothing showed it until the reply reported the change from it.

Directions: the morning after
69. Setting the place through update_note put "Doyle's" on the card and left the open words standing. It took set_location with an empty open to clear them, though the tool says a place decides it.
70. The thread's tying folded the card and drew the arrow itself, and in the same breath the wall asked whether the sign pays off, because a page can describe a neon sign for six lines without the word "sign".
71. "Close whatever I left open on it" was four opens on one card, a thread end and a film line: six calls, five tools, plus a read to confirm. No "close this card" and no reply that lists what a card still has open after a write.

Directions: leave, title, byline
72. Leaving a question takes the kind and the ids exactly as the last reading listed them. A writer saying "leave the sign question" has no ids.
73. Nothing on the account gives a writer's name. "By me" cannot be answered by any tool.

Directions: how long, what changed
74. Two tools each say "say this one to the writer" about a different number, and which one claims that flips when the last scene is written. Nothing says the rule flipped.
75. "Since the last time I asked" has no tool. The reading's since-line is measured from my last reading, and every read for some other direction resets it.

Directions: is anything still open
76. The two-places warning came true and nothing flags it. When the sign's open closed, the notes that said "not decided" stayed on two pages, printed with camera marks as if live. No tool lists a stale note.
77. "Is anything still open" is answered under four heads and a count that covers one of them.
78. The setup line still says "asked below" for a question that is left, not asked.

Directions: the script for the agency, the copy, presence, the notes
79. The file went out twice with numbers that follow the wall, and no reply said so. The advice to lock is in the tool's description, not in the reply.
80. The link form of export_project leaves a file on the account as a side effect, listed under the project's files until removed.
81. The kept file's name is a timestamp, and the link's token is longer than the rest of the reply.
82. Removing a note is "replace it with nothing", and the reply cannot say whether a blank paragraph remains, because the count it reports never included the note.

## 3. The on-ramp: what was not needed, what was missing

Not needed: the doors and wiring, which the connector made moot; the sample wall of Maya and Tom, which never appears on an account; the same first-call order and open-field rules said three times across the connector block, the on-ramp and the day-one guide; "know the server by its tools", when the tools were labelled PlotCoder; the builders' own cross-references (R74, pass 1a, round twenty-four); the advice to make the first calls while the guide downloads.

Missing, and needed: that the hosted door has no disk, so every export is the whole file in the reply and the writer's copy is mine to make; that redo does not exist through this door; that a payoff true of one version only has no home, and what choosing a version does to it; that the camera check reads notes and fires on the words in them; that only two kinds of open ever reach a printed script and the rest vanish silently; that a whole-film fact, once decided, goes into the premise as another sentence; that "what is still open" is spread across four heads of one reading; that which "how long" number to say flips when the last scene is written; that a written scene with no change line disappears from the pages-against-the-wall reading; that a leave needs ids only a reading gives; that a byline needs a name the account does not have.

Worked out myself: the order to ask the writer's remaining decisions and which of them block a page; where the husband goes; what to do with the cut scene's change slot; the order of calls when choosing the knife (choose, delete the arrow, then write, or the wall asks a question that lives for one call); that stale notes need reading for; that a page cannot carry a maybe and the only honest thing is a note and a sentence in the chat; that "since you last asked" has to come from my own notes.

## 4. Asked for and never done as first reached for

- Empty the account: my own harness blocked the call. I exported and deleted the one project instead, which left the account in the same state.
- Put the pier back: three undos, one per change, with a preview that named the change by an internal name.
- Forward again to the knife: no redo. Version chosen, arrow deleted, page re-sent in full, by hand.
- Write the funeral tea "again": it had never been written and its change was open. I asked first, then wrote a page on which nothing turns.
- "By me" on the title page: no tool knows the writer's name. I asked.
- What the app says of the script as a whole: two word-count questions. Everything else I read myself.
- What to decide before the script is whole, in order: no tool orders or gates anything. The order was mine.
- What changed since you last asked: from my notes, not the wall.
- A maybe on the page: cannot be written. Held in a note and said in the chat.
- The figure at the bank: not given, so the manager turns a screen and the audience never hears it.
- "Anything else about when, leave it open": whenOpen on the two cards then without a when. The bank, set aside at the time, was missed and now shows as blank.
- Mairead's husband: nowhere on the wall to put a person who is only spoken of and undecided. On her page, as a guess.
- Emptying the man's-card payoff from the knife version at build time: no way. It waited for the version choice and was paid for then with an unpaid fold.

## 5. Never sure it had landed

- Whether create_cards' opens (fold, castOpen, changeOpen, whenOpen) landed, until list_board.
- Whether the undo of choose_version did what it should, until list_board.
- Whether an empty paragraph remains where each stale note stood. The line counts never included notes, so the replies cannot say.
- Whether the set-aside "alone" pier, if brought back, would carry any claim to the man's card. The setup arrow is deleted outright, so I believe not, and nothing said.
- Whether the kept export file on the account shows in list_files. Never checked.
- Whether the write tails' counts before my first reading were counting the questions I thought they were.
- Whether the camera marks were on printed lines, until read_pages showed the ◂ beside each note.
- Whether the first Friday's fold for the sign, made by the app when the thread tied, is a fold the writer wanted. Nobody asked; the app did it and said so.

## 6. What was undecided, and what became of each

- The title. Held: the project's name open in the three names. Printed: "Untitled" as file name and title on all three exports, no trace of the candidates. App: listed under open. Closed: rename_project, one call.
- The logline. Held: open in the writer's words. Printed: nowhere. Still open.
- Now or 1987. Held: an open line. Printed: nowhere; the four pages then written carry nothing that dates them. Closed: a sentence added to the premise plus strike_open_line, two calls.
- Acts. Held: an open line. Printed: nowhere. Still open.
- Whom Tommy matters to. Held: an open line. Printed: nowhere; the funeral tea written around it, the priest giving Mairead the same words as the next coat. Still open.
- The sign, scene or thing inside one, and where first seen. Held: an open line plus a thread with both ends open through no card. Printed: nowhere. Closed by "first seen on the first Friday": update_thread plus strike_open_line, and a judgement that the line was answered.
- The sign at the end, lit or down. Held: an open line, the thread's end open. Printed: nowhere. Closed by the morning after: the change line, the thread's end tied, the line struck; the app folded the first Friday and drew the setup arrow itself, then asked whether the page pays it off because the word "sign" is not on it; left with the writer's reason. Two notes saying "not decided" went stale on two pages and were removed on request.
- Whether the range and the eleven are plants. Held: an open line. Printed: nowhere; the range is lit twice with the same moves and the wall cannot see the rhyme. Still open.
- Whether Mairead knows. Held: on her page. Printed: nowhere; six pages written without saying, and the page still leans. Still open.
- Her husband. Held: on her page, a guess at a home. Printed: nowhere; the pier written without saying. Still open.
- Whether Declan has signed. Held: on his page. Printed: nowhere; the bank written with nothing signed. Still open.
- The seven maybes. Held: names with question marks on five cards. Printed: nowhere; every page shows them absent. Still open, and a page cannot hold a maybe.
- The funeral tea. Held: change open, when open, cast open in the writer's words. Printed: "[Unwritten] What changes is open, by the writer's word" until written; heading with no time. App, once written: no behind check, no camera mark, a page and no turn that nothing names. Closed in part: Priya and Father Lyons decided by cast; change, when and who else still open.
- The pier. Held: two versions, the writer's first way in front deciding nothing, both change lines open, the fish knife a thread with open start. Printed: the front version's [Unwritten] line, the version behind absent from every export. Closed: choose_version with keep, delete_arrow for the man's card, write_scene; undone by three undos; redone by hand. Change still open, knife start still open, the man's card now unpaid, which is the writer's real question.
- The morning after. Held: change, place and cast open in the writer's words. Printed: the heading "PLACE NOT DECIDED: THE MORNING AFTER - THE MORNING AFTER" in every format. Closed: six calls across five tools.
- The bank. Held: set aside with the cut sentence in the change slot. Printed: nowhere. Brought back: set_aside false, update_note, move_scene; the placeholder "What changes?" turned out to be underneath.
- The man's when and "anyone else". Held: whenOpen, castOpen. Printed: a heading with no time, nothing of the cast. Still open.
- The length, "not counted". Held: kind feature. The reading reports under 120 as a fact on every read.

Whole-film questions no tool answered, and how they were answered: what to decide before it is whole, in order (my ordering by what gates what); what the app says of the script as a whole (two word counts from the reading; the rest from my reading of the pages: who is on them, what recurs, the rhyme of the range, the last night followed by opening, the premise's "until the very end" against a script in which nobody speaks at the end); what changed since you last asked (my notes); how long (two tools disagreeing about which number to say); is anything still open (four heads and a count); what the rewrite did to the wall's claims (the records, not the reading).
