# Round twenty — the report

Run 2026-09-19, through the published package at 0.1.32 and the on-ramp as
deployed, on the same page of a writer's notes as seventeen to nineteen —
`round-seventeen-idea.md`, "The Allotments" — with the open field (R61) and
the fold's words (R62) in hand. The writer's answers and the directions
were relayed from the session that cued the round, as cross-session
messages. "Leave it open" was said of the logline and the board's name; for
the key and the bucket, only "I know where it pays off, not where it is
first seen"; everything else the notes leave open, "I don't know yet —
leave it open". Then ten directions: the order and the turns, what is open
from the wall, Declan's scene decided, the asparagus bed added, the tools'
known payoff with no scene, the key's first sighting decided, the bucket
from the wall, the first morning written, the length against ninety, and
what a writer would ask next. Fifty-seven entries.

**What the round was for, answered.** Four things. First, **a stranger
left the fields open through the fields' own `open`**: the board's name
born open from `new_project`, the logline left open, and every card's when
left open through `set_when` — and found the edge of it at once: a place
cannot be open (16), so "where: leave it open" cost the whole card, and a
project's name cannot be open (6), which is the film's title, the thing the
notes leave open first. Second, **it said what the fold plants** — "Plants
· the wrong tools" — in two calls, because `create_note`'s schema lacked
the `plantsWhat` the guide promised (3, 14), a bug in 0.1.32 fixed the same
morning. Third, **the known payoff with no scene went on the wall as the
guide says**, at build and unprompted: a card born open at the payoff end
with the setup arrow landed on it, and the round wrote down what that
costs — the wall places, counts, measures and matches a scene the writer
has not decided exists (38, 39). Fourth, **the key's decision found a bug
in the tie rule** (40): `update_thread` appended the added card to the end
of the thread's list, the rule took the list's first card as the story's
first, folded the key scene, drew the setup arrow backwards, and asked
about its own arrow; the agent stopped, said so, and took both off on the
writer's word (43). Fixed the same morning: a thread's cards are held in
story order in the kernel, the rule folds the first card in the story, and
a payoff that is the very next scene names the fold and draws no arrow over
the follows arrow already there, and says so. Beside those: the bucket's
loose question lands from the payoff end, and the agent read from the
questions head that it stands until answered or left (nineteen 40's fix,
seen working).

**Fixed the same morning, while it ran**, on the branch this report landed
with (twenty-two entries): the guide counts five first calls (2);
`create_note` takes `plantsWhat` (3, 14); the export's folder is said to
be the session's own when it is (4); the runtime line's spacing (5); the
guide's, the tools' and the words sheet's examples are no longer this
film's (7); the treatment list asks the scenes' order (8); `after`'s
description no longer reads as a precondition (13); the duplicate check
ignores the cast's names, so two scenes with the same people are not one
scene (15); whens left open in the same words are one line in the reading
(22); only follows arrows link a card, so one touched only by a setup arrow
is asked what comes before and after it (25, 31); the back-to-back question
has its third answer, the pace (29); "about 1 page" (32); the open card's
tail names the tool that closes each part (33); the tie rule holds a
thread's cards in story order and names the adjacent case (40); a thread
tied at both ends carries its distance (44); `list_board` names
`page_count` (51); a thin wall's match says "here, by arithmetic" (54);
the comparison's first line names `page_count` (55); an empty person's
page is one line (56); the structures list gives pages beside percentages
(57).

**Left, on purpose or not yet:** the doors (1), decided in seventeen; **a
place and a project's name cannot be open** (6, 16) — R61's edge, the same
drawing as the when's, to build next; the span lives in the premise (9);
an either-or ending (10) is two cards, one open; the unmarked question
against "mark none" (11) is R20's; a call with someone never seen (12) is a
scene if it is on screen — the guide could say so; an unwired card has a
position and a distance (17, 18), by design; the agent's own readings (19,
20, 21, 36); the schema and the prose on the change line (23); where a card
landed (24), decided in fourteen; three mechanisms for "I know the far end"
(26), the R60/R62 combine question, noted; open words a decision does not
touch (27, 34), free text by design; the rows after `set_rank` (28); the
write tails (30); a place's phrase (35); a when per card (37); the open
payoff card's costs (38, 39), R59 by design; the reply's order with the bug
gone (41); a moment inside a scene (42, 45) is the pages'; a loose end is
asked whether or not it is "not decided" (46), R60 by design, and its ids
(47); a placeless heading on the pages (48), the third round to say it —
decide; a measured eighth under an unsized page (49, 52) and the arithmetic
to ninety (53), D21; an open when prints no time (50), R61 by design.

**This is a snapshot of version 0.1.32.** The numbered log below describes
the app as it was that morning, not as it is. Read it for what the app did
with the open field, the fold's words and the tie, and for sections 3 to
6, which are about the shape of the surface and outlast any one fix. Do not
read it as current behaviour.

---

What follows is the agent's report, verbatim.

---

**The report**

**1. What I built and what you had me change**

One project, "Plot 14", 90-page target, one board with its name open. Logline open. Premise set from your answers: the sale for housing, Con and plot 14, Bridie, the crowns, the third year. Three people on the roster, each with a notes line and nothing else. Nine cards from the notes plus a tenth for the tools payoff, born open; follows arrows chaining eight of them; the first morning folded for the wrong tools with a setup arrow to the open tools card; two threads, the key and the bucket, each with its start open; every when open. Then, at your direction: Declan moved between the parish hall and the break-in and given his kitchen; six turns marked; the teaching scene added; the key's start tied to the first morning, which made the app draw a backwards setup arrow and fold the wrong card, both of which you had me take off; the unlocking of the shed added to the first morning's change line; and the first morning written as four paragraphs of action from the facts alone. The wall ends at eleven cards, six beats, one written scene, four open questions.

**2. The friction log**

1. (the way in) The on-ramp says to skip the doors, then sends me to the guide, which carries the same doors at greater length. I read wiring for Cursor, the shell, the hosted server and the folder twice; none applied.
2. (the way in) The on-ramp says five first calls, any order. The guide's Workflow step 1 lists four, "then list_board before any move". Same step, two counts.
3. (the way in) The guide says create_note takes `plantsWhat`. The schema has `plants` true/false and no `plantsWhat`.
4. (the way in) export_project's description names the server's folder and says "not yours". It was mine. I stopped to check.
5. (the way in) read_wall's runtime line has a double space and no word between the number and the bracket: "79 6/8 under  (of its". Recurs on every reading.
6. (the way in) new_project has `boardOpen` for an undecided board name and nothing for an undecided project name. The notes had two titles, so "go straight to new_project" on an empty account couldn't happen without asking first.
7. (the asking) The guide's examples for an open premise, a fold and a thread are "housing, or a supermarket", "the wrong tools", "the key", "the bucket". Those are your notes. I couldn't tell general advice from advice written to this case, so I checked each against the schemas.
8. (the asking) The app's treatment list has no line for the order of scenes. Order is the follows arrows; nothing asks for it.
9. (the asking) The notes give the film's span, March to October. The app has a when per card and nothing for the story's span. I offered you the premise for it; that was a guess at where it belongs.
10. (the asking) An either-or ending has no home. The order is one line, so two candidate last scenes can't both sit there without both being counted and wired.
11. (the asking) "Mark no turns until I say" collides with read_wall asking for a beat until one is marked. Quieting it is leave_question, "only on the writer's word", so it cost you a question.
12. (the asking) A phone call with someone never seen has no clear place. The guide puts a spoken-of person in notes and says nothing about whether the call is a card.
13. (the build) create_note's `after` says "Needs follows arrows on the wall". There were none; it worked anyway and drew the first. The description reads as a precondition and isn't one.
14. (the build) No `plantsWhat`, so folding a card with its words is two calls: `plants: true` on create_note, then set_plant with `what`, whose reply said "(already folded)".
15. (the build) The duplicate check fired between the key scene and the tools scene though the tools card was born open. An open card is "asked nothing of itself", yet the question stands in the list and the open card's line also says "closed, it would be asked which of two alike headlines it is". Asked both ways, on a match of "Con gives Ruth".
16. (the build) A place cannot be open; logline, premise, when and board name can. Where you said "where: leave it open" I had to open the whole card, silencing its cast, change and arrow questions. On the key card, where you said nothing, I left the place blank and the wall asks. Same gap, two treatments.
17. (the build) A card whose position is undecided still has one. Declan and the tools payoff were "placed after the last card in story order" and organize put them after the ending, so they read as the last two scenes.
18. (the build) The setup distance for the wrong tools, "about 9 pages later", is only where the open payoff card happens to sit.
19. (the build) The council letter is one scene in the notes and two places by the app's rule. I made one card at the allotments with the posting in the change line. If the arrival at the house is a scene, the wall doesn't have it.
20. (the build) "Con does not die in this film" is in Con's notes because nothing else took it. It's a fact about the film, not about Con before it starts.
21. (the build) The council man is nowhere. Not on the roster, since the parish hall card is open on whether he's there and the roster would ask "uncast"; not in anyone's notes, since nobody speaks of him.
22. (the build) "I don't know the whens yet" costs one open when per card. Ten lines in the reading, and an open card gets two lines. No way to say it once.
23. (the build) The schema marks only `headline` required; the description says `change` is required unless the card is born open.
24. (the build) Neither create_note nor organize says where a card landed. I had to list_board for positions.
25. (the reading) The reading said "no card without an arrow (except 1 open card, not asked)". I took the exception to be the tools card. Corrected at 31.
26. (the reading) Three mechanisms for "I know the far end": the key and the bucket are threads with an open start, the tools are a fold with an open payoff card. That was the guide's prescription, and on the wall they look and read differently for no reason in the story.
27. (directions) Deciding Declan's place didn't touch the open words on his card, which still said the order was undecided. I rewrote your sentence by hand.
28. (directions) set_rank leaves the wall laid out as if there were no beats and says so: "The rows are as they were; organize lays a row per beat."
29. (directions) The "empty" question asks whether two turns are one beat or a scene is missing, then says it "stands until scenes go in". A question that knows its answer; the only way to say "neither" is leave_question.
30. (directions) set_rank's reply counted "now asks 6", named one gone and two new, and didn't name the four that stayed. I worked them out from the last reading.
31. (directions) Correction to 25: the exception was Declan, then unwired. Once wired the check read clean, and the tools card was never flagged because a setup arrow counts as touching it. A card whose only arrow is a setup into it passes the "no arrow" check while having no place in the order.
32. (directions) With Declan wired, the tools card became a run after the last beat: "about 1 pages, 1 card". A card open on where it sits is reported as the film's last scene, in a run of its own, with a grammar slip.
33. (directions) An open card's edge says what's undecided, never what tool closes each part. "Closed, it would be asked where it happens" says what the wall would ask, not what to call.
34. (directions) Setting the place on an open card didn't touch the open words, and the reply quoted them back as if nothing had changed. Every decision on an open card is two calls, the second me editing your sentence.
35. (directions) The place phrase decides identity. "Con's house, the kitchen" is one place; "Con's house" later would be another. No way to check a phrase against places you'll name later.
36. (directions) I put the teaching scene at the allotments because the asparagus bed is on plot 14, a step past "that is all I know", since a blank place raises a question.
37. (directions) A new card doesn't inherit the wall's open when. Two calls for every card added while the whens are open.
38. (directions) The wall holds "I know the payoff, not the scene" as a card that is a scene. It places it, counts it, measures the setup distance to it and matches its headline, all on a scene you haven't decided exists. The words on its edge stop none of that.
39. (directions) The wall asks nothing about the tools, because a fold with a setup arrow is "paid off" whatever the arrow lands on. Only your words on the open card keep the question alive; cleared by mistake, the tools would read as finished.
40. (directions) Tying a thread through a card whose fold is taken did the opposite of what the guide says. Instead of "stays a thread, no arrow", it folded the far end and drew the setup arrow backwards, then raised a "backwards" question about its own arrow. Quoted: "Tied at both ends, so it is the fold's now: folded "Con gives Ruth the only key to the shed", named its fold "the key", drew the setup arrow to "The first morning: Ruth turns up with the wrong tools"."
41. (directions) That reply put the wrong part after "Tied its start; the reading stops asking about it", which reads as the end of a successful call. I only caught it by reading past that.
42. (directions) No home for a stated moment inside a scene. "Con unlocks the shed while she stands there" fits none of headline, change, place, when or open words. It went into the change line on your word.
43. (directions) Undoing the app's mistake took two calls, and between them the wall asked about the half-undone state: deleting the arrow left the fold, and the fold asked "where does the key come back?".
44. (directions) A thread tied at both ends is only a line under "threads": no arrow, no distance, where the wrong tools, a fold, gets "about 10 pages later". The key and the tools are the same kind of thing in your notes and different kinds on the wall, chosen by which card already had a fold.
45. (directions) The change line now does two jobs, what's different after and a moment inside. update_note had no view; the reading only checks that a change line exists.
46. (directions) "I still don't know" has no form of its own for a thread's end. An open start is already the thread saying "not decided", and the wall still asks. The only quieting move is leave_question, whose word is "leave it", which is not what you said.
47. (directions) The "loose" question gives two ids, the thread's and the card's, without saying which is which. leave_question wants "its ids as read_wall lists them", so I'd pass both and hope.
48. (directions) read_pages prints a headline as the scene heading, in capitals, for a card with no place: ".CON GIVES RUTH THE ONLY KEY TO THE SHED". The bracket says "the headline stands in for the heading"; a Fountain reader would take it as a slugline. Four cards read that way.
49. (directions) A scene written honestly from the wall's facts makes an eighth of a page and drops the runtime, since a written card is measured and an unwritten one is a page.
50. (directions) With the when open the heading prints no time, so the page says "THE ALLOTMENTS" with nothing after. "The first morning" survives only in the headline and because I put it in the action.
51. (directions) "How long is it" has two answers from two tools, and the five first calls surface one. page_count isn't among them and isn't mentioned by read_wall or list_board.
52. (directions) The runtime rewards ignorance. An unsized, unwritten card is a page; the one scene I wrote is an eighth. Writing the first morning made the film shorter by seven eighths.
53. (directions) "What is missing to reach ninety" is the question the app refuses to have an opinion on, and it says so nowhere in a reply. The refusal lives in the guide and the descriptions. A writer asking the wall directly gets a number and silence.
54. (directions) compare_structure paired your last scene with the inciting incident because the ending currently lands on page 9. It says the pairing is arithmetic, then prints "here" beside it as if it fit.
55. (directions) Three tools, three lengths: compare_structure "p. 11", read_wall "about 10 1/8", page_count "2". compare_structure explains its difference from read_wall in its first line and not from page_count.
56. (directions) A person's page shows "(empty)" four times on every read. No way to say those lines are deliberately blank rather than not yet filled.
57. (directions) list_structures gives percentages, compare_structure gives pages, for the same beats. I multiplied to check they agreed.

**3. What the on-ramp told me that I didn't need, and what it didn't tell me that I did**

Didn't need: every door. The MCP config block, the shell door, the hosted door, the account variables, the folder and the sample wall, claim_account, the note about `npm run dev`. The server was in front of me and signed in; that was one sentence of the on-ramp and half the guide was about the other cases. The page about Maya, Tom and the letter never applied.

Didn't tell me and I needed: that the guide's `plantsWhat` doesn't exist; that a place can't be open while four other fields can; that a card born open still has a position, a count, a distance and a headline match; that create_note's `after` works on an empty wall; that page_count exists and answers "how long" differently from read_wall; that tying a thread can fold a card and draw an arrow by itself, and can get it backwards; that deciding a thing on an open card never touches the words on the card; that read_pages prints a headline as a slugline when there's no place. I worked out each by trying it and reading the reply, which is the method the guide implicitly assumes and never says.

**4. What you asked for that I never found a way to do, or did another way**

- Leave the whens open once, for the wall. Done per card, twelve times, and once more for the added scene.
- Leave a place open. No such field; I opened whole cards where you used the word "open" and left one blank where you didn't.
- Leave a card's position undecided. Not possible; both such cards have a position and read as the film's last scenes.
- Tie the key's start and nothing else. The app also folded a card and drew an arrow; you had me take both off.
- Put a stated moment on a card. Went into the change line, which isn't what a change line is for.
- Hold the council man anywhere. I didn't; he's in this conversation only.
- Hold the film's span, March to October. Not on the wall; I didn't put it in the premise because you chose "the third year" and I couldn't tell whether the span was part of the alternative you rejected.
- Hold that the sister's call might be a scene. Not on the wall; her existence is in Ruth's notes.

**5. What I was never sure had landed**

- Whether the thread's cards are kept in story order or in the order I added them. The reply and list_board both print first morning → key, so probably story order, but the update_thread description doesn't say.
- Whether the six open whens on open cards are held separately from the card's open words. The set_when reply said "6 of them are still open: the words stay"; the reading lists both, so yes, but I read it from the output rather than the reply.
- Whether organize's layout after the beats were marked is what the wall shows. I never ran organize after set_rank; list_board later showed six rows, a row per beat, which must have come from the tidy inside create_note's `after` or move_scene. No reply said so.
- Whether the premise, the notes and the open words are on the writer's screen as I wrote them. Every reply says "live on every open wall"; I have no wall open and did not check one.
- Whether "Con's house, the kitchen" will match anything you name later.

**6. What the notes left open that the wall could not hold, and what I did**

- The ending's alternative, "or he dies and she plants them". You chose; nothing to hold. Had you not, the wall could hold one open card, not two.
- The council man. Named in the notes, undecided whether he's in a scene. Not on the roster, not in a page, not on a card. Nowhere.
- Ruth's sister and her call. The person is in Ruth's notes. Whether the call is a scene is in this conversation only.
- The span, March to October. Nowhere.
- "Con does not die in this film". In Con's notes, wrongly placed for want of anywhere else.
- Which scene the tools are given in. An open card that the wall nonetheless treats as the last scene.
- Where the bucket is first seen. A thread with an open start; the wall asks and will keep asking until you tie it or leave it.
- Declan: how many scenes, what happens. Open words on one card; the wall can't hold "maybe more scenes".
- Acts, lengths. You left both open. Neither has a form on the wall: no groups, every card unsized, and nothing lists either as open.
- The whens. All open, one line each in every reading, thirteen lines now.
- The board's name and the logline. Open, listed, not asked. The only two open things the wall holds exactly as you said them.
