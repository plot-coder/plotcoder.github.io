# Round twenty-one — the report

Run 2026-09-19, through the published package at 0.1.35 and the on-ramp as
deployed, on the same page of a writer's notes as seventeen to twenty —
`round-seventeen-idea.md`, "The Allotments" — with the open place and title
(R61's edge) and the tie rule holding a thread's cards in story order in
hand. The writer's answers and the directions were relayed from the session
that cued the round, as cross-session messages. "Leave it open" was said of
the title, the logline, the board's name and each place the notes do not
give; for the key and the bucket, only "I know where it pays off, not where
it is first seen". Then ten directions: the order and the turns, what is
open from the wall and "leave it open" of the two placeless cards, Declan's
scene decided, the asparagus bed added, the key's first sighting on a card
whose fold is taken, the bucket's on a card whose fold is free, the title
decided, the first morning written, the length against ninety, and what a
writer would ask next. Forty-two entries.

**What the round was for, answered.** Three things. First, **the fields
were left open through their own `open`**: the project started with its
title open through `new_project`'s `open` in place of a name, the logline
and the board's name were left open, every when was left open, and told
"leave it open" of the two placeless cards the agent reached for
`set_location`'s `open` in one call for both — the unplaced question went,
the open places were listed, and the cards' other questions stood (3,
listed under "what closes each"). Second, **the tie rule did both halves
right**: the key's first sighting on the first morning, whose fold is the
tools', left the key a thread with no arrow, and the reply said "a card has
one fold" (30, 33); the bucket's first sighting on the teaching scene,
whose fold was free, folded that card, named its fold "the bucket", drew
the setup arrow to the balcony, and said so — the reading then listed the
thread tied and the setup at the same distance. Twenty's bug is gone.
Third, **an open-placed card's other questions stand**: the key card, its
place open, was still in the back-to-back chain and still the end of the
loose key thread. Beside those: the fold was named in one call at build
(`create_note` with `plantsWhat`, which twenty lacked), and the open head
carried a title, a board's name, whens and places together. One direction
was the prompt's fault, not the app's: "first seen on the asparagus bed"
named a spot, not a card, and its crowns contradicted the premise; the
agent asked rather than guess (32), and the writer corrected it.

**Fixed the same morning, while it ran**, on the branch this report landed
with (eight entries): `create_note` takes `whenOpen` and `locationOpen`, as
the guide promised, and its reply says a card was born with its place or
when open (3, 28); the on-ramp says an account can hold an earlier wall,
that every reading names the project it read and `list_projects` who is on
it, and to ask before touching it (6); the guide's `create_note` bullet says
the change line may wait on a card born open, and names every field the
tool takes (12); the clean line says "no card without a follows arrow (a
setup arrow is a claim, not a place in the story)" (18); an open place
prints "PLACE NOT DECIDED: THE WORDS" as its heading and reads back as an
open place, and `read_pages` says the words head the scene (25, 35); the
clean line says "with their place open" apart from "open cards" (26, which
the agent later withdrew as its own misreading — the line now names which
kind it counts either way).

**Left, on purpose or not yet:** the doors and the guide's length (1),
decided in seventeen; the treatment questions in the guide and in the
workflow (2) — the guide's copy could go; the export's folder (4) is said
when it is the session's; `list_board`'s per-card open whens (5) are the
records, and the reading groups them; **a target, acts and lengths cannot
be open** (7, 14, 15) — a number, a group and unsized are their forms, and
the reply says which is the default; a board born from no words (8); an
either-or ending (9), decided in eighteen; an unwired open card in every
count (10, 23), by design; the letter as one card (11); "how many Declan
scenes" in the open words (13); the roster's question beside an open card
(16); "pays off" and "comes out" (17), the words sheet; the rows after
`set_rank` (19); the tidy and an unwired card (20); the back-to-back
questions on marking (21); "open" as two lists (22); "leave it open" as two
tools on an asked question (24) — worth a guide sentence; open words a
decision does not touch (27); the agent's own readings (29); one fold per
card (30, 34) and a thread's missing note (31), R62's said limits; a
direction by spot (32); writing from facts (36); a measured eighth under an
unsized page (37), the fourth round to say it; a detail undecided on the
page (38); two answers to "how long" and the arithmetic (39, 40, 42), D21;
the comparison on a thin wall (41), with its caveat first.

**This is a snapshot of version 0.1.35.** The numbered log below describes
the app as it was that morning, not as it is. Read it for what the app did
with the open place and title and the tie rule, and for sections 3 to 6,
which are about the shape of the surface and outlast any one fix. Do not
read it as current behaviour.

---

What follows is the agent's report, verbatim.

---

# Report: Plot 14 on PlotCoder, 19 September 2026

## 1. What I built and what you had me change

One project, "Plot 14", one board still called "Board 1" with its name open, target 90 pages. Ten cards from the notes and your answers, all scenes at first, wired in the notes' order with the tools payoff left unwired and open. Four in the cast: Con, Ruth Kane, Declan, the council man. Bridie and the sister in notes. The premise from your answers. Title, logline, board name and every when left open in your words. Two threads with loose starts, the key and the bucket. One fold, the wrong tools, with its setup arrow to the open tools card.

You then had me: reorder to your sequence, mark six turns, leave two places open, give Declan's scene its kitchen, add the teaching scene, tie the key's start at the first morning, tie the bucket's start at the teaching scene (which folded that card and drew its arrow), decide the title, write the first morning silent, and read the wall for length, structure, cast pages and project shape.

## 2. The friction log, complete

1. [the way in] The on-ramp says to read the guide "once, before your first call if you can". The guide is about 600 lines and took three fetches to get in whole. The on-ramp calls itself the guide's first page, but most of its length is the Doors section, which its first paragraph told me to skip. Most of what I read on the way in I did not need.
2. [the way in] The guide's "What a treatment should answer" list and the break-a-treatment workflow carry the same eleven questions in two places. Only the workflow's copy says which tool each answer lands in, so I had to read both.
3. [the way in] The guide says a card "requires headline and change" and that create_note "takes locationOpen". The schema requires only a headline and has no locationOpen and no whenOpen. A card born with an open place or when needs a second call, and I could not tell which document was right until I tried it.
4. [the way in] export_project says a relative path resolves from "the folder the server was started in", which is "this session's own folder when the server was started from it, and somewhere else when it was not". It cannot say which, so I used an absolute path.
5. [the way in] list_board repeats the open-when words in full on every card. With eleven whens open, eleven copies of one phrase buried the fields that differ.
6. [the way in] The on-ramp covers a fresh folder's sample and an empty account, not an account already holding a wall that is neither the sample nor the writer's current work. Only your instruction told me what to do with it.
7. [the asking] new_project silently set a 120-page target and said so. The notes say "Half-hour? Feature?" and the wall cannot hold a target as open. A number stands where a decision is not made.
8. [the asking] new_project takes the writer's words to leave a board's name open, but the notes say nothing about a board, so there were no words. The board was "Board 1" regardless, the thing the tool says it wants to avoid.
9. [the asking] The notes had two versions of the ending. The wall holds a card open in the writer's words but has no way to hold two alternative scenes as alternatives. You then decided it, so nothing was built this way.
10. [the build] An unwired card still gets a place in the story order by position. The tools card, open as "which scene this is" with no follows arrow, is listed tenth, numbered, and the setup distance is measured to it. The number is from where it sits, not from the story.
11. [the build] Your answer on the council letter names two places: posted to the house, pinned to the shed door. One place per card. I built one card at the shed and none for the letter arriving at the house. The wall has no way to say "this may be two scenes"; the choice is mine and unrecorded.
12. [the build] The parish hall card is born open, so create_note says its change line "may wait". The guide says every card needs a real change line. I gave it "Con says nothing", which is not a change, and the wall accepts any text there.
13. [the build] "How many Declan scenes there are" is not a property of any card. Its only home is the open words on one card, and opening that card also silences its own questions about place and cast.
14. [the build] Acts: you said leave it open. The wall has no acts and no open for an act break, only groups, which cannot be open. Nothing records that acts are undecided.
15. [the build] Lengths: "leave it open" has no open. Unsized is the nearest thing, and the runtime then reports a number built from ten guesses you did not make.
16. [the build] The council man is in the cast and on no card, so the wall asks where he comes in. The scene he may be in is open on exactly that question, but an open card silences only its own questions, not the roster's. The same open thing is hidden once and asked once.
17. [the build] You say the key and the bucket "pay off". On the wall "pays off" is the fold's word and a thread "comes out". Both had to be threads, so neither appeared under setups and payoffs, only under threads.
18. [the build] The reading's clean line says "no card without an arrow (except 1 open card, not asked)". The only card touched by a setup arrow alone is also open, so I cannot tell whether a setup arrow counts as an arrow touching a card.
19. [directions: order and turns] Marking turns and laying the wall out are two calls. After "mark them", the wall shows six beats scattered over two rows of five until organize is also called. I did not call it, since you did not ask for a layout.
20. [directions: order and turns] "The tools scene stays where it is" is a position, since it is unwired. Both move replies said "the wall tidied along them" and not what a tidy does to an unwired card. I cannot tell from the replies whether it kept its position.
21. [directions: order and turns] Nine wired cards, six marked, and the wall at once asked two back-to-back questions, one naming a four-card chain. The reply says this stands "until scenes go in", which is fair, but it fires as a side effect of marking before you had struck one turn.
22. [directions: what is open] "Open" reads two ways: "open, by the writer's word" and "questions the wall raises" are separate lists. Your "what is still open" could mean either. I answered with both.
23. [directions: what is open] The unwired tools card is counted as a run after the last beat, so the balcony reads as not the ending, and the setup distance is measured to a scene not yet in the story. An open, unwired card is in every count.
24. [directions: the two places] "Leave it open" fits two tools on an asked question: set_location with open, or leave_question. They land in different lists and behave differently later. I chose open because your phrase had meant that all session, and did not ask.
25. [directions: the two places] set_location's reply said an open place makes "the heading print the headline in its stead". A sentence in capitals where a slugline goes. Nothing had said so before this call.
26. [directions: the two places] The clean line said "except 2 open cards" right after I left two places open, and I logged that "open card" meant two things in one reply. A later reading showed the 2 were the Declan and tools cards, whole-card open with no place. My misreading, but the line invited it: it names no cards and sat beside the two I had just touched.
27. [directions: Declan's place] A card's open words are free text with no link to the field they name. Setting the place left the words saying the place was undecided, and the reply quoted them back that way. Rewriting them was a second call and a judgement of mine about what your words now mean.
28. [directions: the teaching scene] A new card cannot be born with its when open. Keeping it in step with the other ten took a second call. Entry 3 confirmed by doing it.
29. [directions: the teaching scene] "That is all I know about it" still had to become a change line, and the place is my reading of where an asparagus bed on plot 14 is. Neither is marked on the wall as mine rather than yours.
30. [directions: the key's start] The first morning plants two things. The tools are a fold with an arrow, the key a thread with none, because a card has one fold and the tools got there first. Which is the fold is an accident of order, and the setups section lists the tools and not the key.
31. [directions: the key's start] What you know about the key's first sighting has nowhere to go: a thread carries no note, and the card has only headline, change line and scene text. The sentence lives only in this conversation.
32. [directions: the bucket's start] "First seen on the asparagus bed" names a spot, not a card, and the wall has no place by that name, since the bed's scenes are all at "the allotments". A direction given by spot maps to no card. I had to ask.
33. [directions: the bucket's start] The same word from you, "first seen here", did two different things on two cards: the key stayed a thread with no arrow, the bucket became a fold with a setup arrow. The difference was only whether the card already had a fold. The reply said what it did, so nothing landed unsaid.
34. [directions: the bucket's start] "She carries her things in it" is again a sentence about a scene with no field on the wall. The fold's words say "Plants · the bucket" and nothing more.
35. [directions: write the first morning] read_pages prints the two placeless beats with their headline as the scene heading, in capitals, and says so in the bracket. Entry 25 confirmed on the page.
36. [directions: write the first morning] "Write the scene" from this wall means inventing. read_pages gives nothing beyond the change line, the character pages hold notes and no voice, and the standing rule is invent nothing. I stopped to ask.
37. [directions: write the first morning] Three lines of silent action made the card measure an eighth of a page and the runtime fell by most of a page. The measure replaces your guess the moment any text stands. A first sketch on a beat shrinks the wall, and the only way to have the guess read again is to clear the text.
38. [directions: write the first morning] "What the tools are: leave it open" has no home. The card is not open, the fold's words already say "the wrong tools", and a page cannot be open. The only record is that the page stays vague, which reads as style, not as undecided.
39. [directions: how long] "How long is it" has two answers that differ by a factor of five: the runtime from the cards and page_count's script so far. page_count says which one it is, but the question does not know which it is asking, and neither number is what the film is.
40. [directions: how long] "What is missing to reach ninety" is a subtraction and nothing else. The wall cannot say what is missing, and the rules forbid me an opinion.
41. [directions: day one] compare_structure on an eleven-card wall pairs your ending with the inciting incident and calls it arithmetic. The caveat comes first and is honest, but the reading still tells a writer on day one that their last scene is the inciting incident and four of six turns answer no beat.
42. [directions: day one] Three readings give three lengths for one wall: about 10 1/8, 2 of 90, and "runs to p. 11". compare_structure names the other two, which helps, but three tools give three numbers.

## 3. What the on-ramp told me that I did not need, and what it did not tell me that I did

**Did not need:** the whole Doors section, the account and hosted wiring, the shell door, the folder-as-wall paragraph, and the "For the person" section. About two thirds of the on-ramp. From the guide: pages, Final Draft, revisions, locked numbers, video briefs, series payoffs across boards, and the folder-and-file modes. The five first calls were right, and list_workflows carried the questions I built from.

**Did not tell me, and I needed:** that an account can hold a prior wall to be dealt with before starting. That create_note cannot open a place or a when. That an unwired card is still counted and numbered. That "leave it open" on an asked question has two tools. That an open place prints the headline as the slugline. That a thread tied at both ends turns into a fold and an arrow on its own, and stays a thread when the card is already folded, so the form is decided by order. That set_rank does not lay rows. That any text, however short, replaces the length estimate. That "how long" has three answers. That "open card" in the clean lines means whole-card open only.

**Worked out myself:** how to hold a treatment fact that is not a scene (in notes, the premise, or nowhere). How to hold two undecided things on one card (one string). Which of a spot's two scenes a direction meant. When a rule of the guide overrode a tool's schema.

## 4. What you asked for that I never found a way to do, or did another way

- **Leave the target open.** No way. It is 90, a number you gave, but on the way it was 120 by default.
- **Leave acts open.** No way. Nothing on the wall says acts are undecided.
- **Leave lengths open.** Done as unsized, which is not the same: it reads as a page each.
- **Leave the count of Declan scenes open.** Done as words on one card, which silence that card's other questions.
- **Two versions of the ending.** Not needed in the end, but the wall could not have held it.
- **"Put that on the wall"** for the key's sentence and the bucket's sentence. Done as threads; the sentences themselves went nowhere.
- **"Leave it open" on the tools in the written scene.** Done as vagueness on the page.
- **The letter posted to the house.** Done as one card at the shed, by my choice.
- **Mark them.** Done without organize, so the wall shows marks on the old rows.

## 5. What I was never sure had landed

- Whether the tools card kept its wall position through the two tidies and the later create_note tidy. No reply said.
- Whether the parish hall card's change line and the teaching card's place read on the wall as mine or as yours. No field says who wrote them.
- Whether the rewritten Declan open words are what you meant, since I chose the new wording.
- Whether "no card without an arrow" counts a setup arrow. Not testable on this wall.
- Whether the board's open name shows anywhere a script out would reach. The rename reply said boards keep their names, nothing about the open words.
- Entry 26: I got one reading wrong and only caught it two readings later. Any other clean line I read as naming a card I had touched may have the same fault.

## 6. What the notes left open that the wall could not hold, and what I did

- **Feature or half-hour.** You decided 90. Until you did, the wall said 120.
- **Supermarket or housing.** You decided housing. Went in the premise.
- **First season or third year.** You decided third. Went in the premise. The teaching card's "three years" and the harvest card's "first time in three years" are consistent with it; the bucket's first sighting with crowns carried to the bed was not, and you left the premise as it is.
- **The ending, two versions.** You decided. One card.
- **Letter at the shed or the house.** You said both. One card, at the shed, my choice.
- **The break-in, by whom.** You said kids. Night or morning, kids seen or not: open words on the card.
- **Where she was.** You said hospital. In the change line and Ruth's notes.
- **The key scene.** A card after the break-in, the thread tied both ends, and your sentence about the first sighting in this conversation only.
- **Declan, subplot or plot.** You said subplot. In his notes. How many scenes: open words.
- **The tools payoff, which scene.** An open unwired card that the wall still counts and numbers.
- **Ruth's surname.** You said Kane.
- **Time, March to October.** In the premise. Every when open.
- **Title.** You decided Plot 14. Board name still open.
- **What the wrong tools are.** Open in your words in this conversation, and on the wall not at all.
- **Con teaching her, three years.** Was not a scene in the notes. You added it as one.
- **The council man.** In the cast, on no card, asked about on every reading.

The wall ends with three questions it asks: the four turns from the key to the balcony with nothing between them, nobody in the last harvest, and the council man on no card. It lists six fields and four cards open by your word.
