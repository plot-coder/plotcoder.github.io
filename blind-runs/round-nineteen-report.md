# Round nineteen — the report

Run 2026-09-18, through the published package at 0.1.29 and the on-ramp as
deployed that evening, on the same page of a writer's notes as seventeen and
eighteen — `round-seventeen-idea.md`, "The Allotments" — with the thread,
R60, in hand. The wiring had vanished from `~/.claude.json` again and was
put back before the session. The writer's answers and the directions were
relayed from the session that cued the round, as cross-session messages,
which the agent noticed (12). For the key and the bucket the writer said
only "I know where it pays off, not where it is first seen"; everything
else the notes leave open, "I don't know yet — leave it open". Then nine
directions (the agent counted ten, taking the question it asked mid-way as
one): the order and the turns, the open cards from the wall, Declan's scene
decided, the asparagus bed added, what the wall says about the key and the
bucket, the key's first sighting decided, the first morning written, the
length against ninety, and what a writer would ask next. Fifty-two entries.

**What the round was for, answered.** Three things. First, **a stranger
reached for `create_thread` at build, for both** — but on the on-ramp's new
sentence, not the guide alone: question 18 of its twenty quoted that
sentence back ("if you know the far end and not the first sighting, the app
holds that as a thread with an open start") before the writer had said a
word about the key, and the sentence's own example was "the key". So the
round measured the on-ramp's sentence, and the example was changed the same
night to the sample wall's things. Second, **the loose-end question lands
where the writer wanted it**: asked from the payoff end on every reading,
in the writer's word for the thing, and the agent could say from the wall
that it stands until the start is tied or the writer leaves it (40). Third,
**the thread and the fold did not contradict each other, because the agent
stopped and asked** (42): told the key is first seen on the first morning,
it tied the thread's start and put Con on the card, then saw that the
card's one fold is the wrong tools' and that a setup arrow to the key scene
would count that fold paid, and asked rather than draw it. The finding
under it: **a fold is one flag per card and cannot say which of two things
a scene plants**, and **a payoff the writer knows without a scene for it
has no home** (21) — the fold asks "where does it come back?" as if the
answer were unknown. Both go to the thread's edges in the handover.

**Fixed the same night, while it ran**, on the branch this report landed
with: the on-ramp says skip the doors once fewer, and its example is no
longer this film's (1); the guide says "and only then change anything" (2);
`list_board` no longer says "R60" (4), quotes the open words as the
writer's (5), says the target is the writer's and how to change it (6), and
its roster head names `read_character` (52); `export_project` names the
folder a relative path resolves from (7); the workflow's turns hint takes
"mark none yet" (11); `create_note` with `after` or `before` draws the
wall's first follows arrow instead of refusing, so a wall can be built in
order from the second card (14, 39); an open card at a thread's loose end
is no longer told the loose question would be asked if it were closed,
since it is asked either way (23, 41); a question about the run a card sits
in — beats back to back, a sag — is asked even when every card in it is
open, as the guide promised (28, 33); "would be asked, closed: no card
without a place" reads "closed, it would be asked where it happens" (31);
`update_note` names a near-matching place as `set_location` does (36); the
questions head says a question stands until answered or left (40); the
comparison says its page is the one the last card ends on and gives the
reading's count beside it (51). Eighteen entries.

**Left, on purpose or not yet:** a wall found on arrival that is someone's
earlier run (3) — every read names the project and who is on it, and a
date is worth a thought; the open fields (8, 9, 10, 13, 25, 32) are the
next mockup; the harness's (12); the agent's own readings of the notes
(15–18, 20, 26, 37, 38), one of them a place chosen unasked; the open card
silencing the card's own questions (19) is R59 by design; the fold and the
known payoff (21, 42, 43) are the thread's edges; organize and set_rank
leaving the rows (22, 29) is R20's shape, decided in eighteen; an unwired
card landing last (24), open words a move can leave stale (27), a spot
within a place and a no-op direction (34, 35), a placeless card's heading
on the pages (44), the runtime dropping on a write (47), two answers to
"how long" (48), the arithmetic to ninety (49) and the comparison on a thin
wall (50) all stand as eighteen left them; a beat as proposed rather than
the writer's (30) is a second model, decided against in round two; the
when never set (45) and a card holding no detail beyond its lines (46) are
the writer's.

**This is a snapshot of version 0.1.29.** The numbered log below describes
the app as it was on the night, not as it is. Read it for what the app did
with the thread from the payoff end, and for sections 3 to 6, which are
about the shape of the surface and outlast any one fix. Do not read it as
current behaviour.

---

What follows is the agent's report, verbatim.

---

# Report: Plot 14 on PlotCoder

## 1. What I built and what you changed

I emptied the test account after saving its one project to a file, then started "Plot 14" with a 90-page target and one board the app named "Board 1". The premise carries the third year, Bridie, and the crowns. Four people in the cast: Con Brady, Ruth Kane, Declan Brady, The council man, with notes on three of them and nothing else on their pages. Ten cards from your notes and answers, wired in one follows chain, with seven of them left open in your words, one fold on the first morning for the wrong tools, and two threads, the key and the bucket, each with an open start. No logline, no groups, no beats.

You then moved Declan's scene to after the parish hall, had me propose seven turns and kept them, set Declan's scene at "Con's house, the kitchen" with Ruth absent, added the teaching scene between the first morning and the letter, tied the key thread's start to the first morning and put Con on that card, left the wrong-tools fold asking, and had me write the first morning as a scene. Eleven cards now, one written.

## 2. The friction log

1. (the way in) The on-ramp says three times, in three places, to skip the doors when the tools are already in front of you. Read it three times before believing it applied to me.
2. (the way in) Guide, "Call these first" paragraph: "...list_board (the records and their ids) — then change anything." Reads two ways: "and only then change anything" or "then go ahead and change whatever". Took it as the first.
3. (the way in) read_wall on arrival gave a full built wall ("Plot 14", 9 cards) with no way from the reply to tell who built it or when. list_projects names the people on it but no date. The on-ramp only warns about the sample wall (Maya, Tom); it says nothing about a wall that is somebody's earlier run. I only knew it was disposable because you told me.
4. (the way in) list_board's threads line reads "threads (R60; a named string through cards...)". "R60" is unexplained. It looks like an internal requirement number that leaked into the reply. Guessed it means nothing to me.
5. (the way in) Open cards show their open words inline as "open: when" and "open: where it happens, and when". When the writer's words are short they read like field names, not words. I could not tell from list_board whether "when" was a field the card lacked or the phrase someone typed.
6. (the way in) read_wall and list_board both report the runtime against "a 90-page target" without saying who set 90 or that it is settable; the guide names 120 as a feature. A fresh reader would take 90 as the app's idea of a feature.
7. (the way in) export_project's description says pass an absolute path because "a relative one resolves from the folder the server was started in, not yours". There is no tool that says where the server's folder is.
8. (the asking) The premise line has no open state. "Supermarket or housing" could not be held as undecided above the wall; it would have been an open card on one scene.
9. (the asking) No way to hold two versions of one scene as alternatives. Two cards both read as scenes. One open card must carry both versions in the writer's words.
10. (the asking) The notes' global time frame (one season / third year) has no home: when lives per card; the premise cannot be open.
11. (the asking) Workflow list on turns: "Name them, or say propose them and I will strike". No phrasing for "mark none yet"; the reading asks [unmarked] every time.
12. (the asking) The answers arrived as a cross-session message from another Claude session named "plot", not typed in this chat, and nothing in it said it was the writer. Took it as the writer's and said so. Session friction, not the app's.
13. (the build) new_project named the board "Board 1". The writer left the board name open; the app cannot hold a board name as open, so a placeholder stands.
14. (the build) create_note with `after` on the second card did nothing: "The wall has no follows arrows, so 'after' has no story to land in: it sits after the last card; create_arrow the sequence, then move_scene." The guide says wire each card with `after` when building in order; it does not say `after` needs an arrow already on the wall, so the second card can never use it. Drew all arrows by hand after.
15. (the build) The council letter answer (posted to the house, Con pins it to the shed door) is two places; one place per card, so it is two cards. The wall cannot say the two are one item in the notes.
16. (the build) "They lose the plots" has no card; it lives in the last scene's change line and nowhere else.
17. (the build) First-morning card carried only Ruth, as the notes state. The wall did not ask whether Con is there because the card had somebody on it.
18. (the build) Story order after the break-in (key, she tells him, last harvest) is my reading of the notes' list order, not stated, except the key after the break-in. The wall shows arrows as fact; nothing marks an arrow as a guess.
19. (the build) set_open mutes every question on the card at once: opening "where it happens" also muted "nobody in it". The reading says what it would ask if closed, but one open field costs the card all its questions.
20. (the build) The council man: in the cast, on no card; the wall asks where he comes in. The guide says someone in no scene belongs in notes, not the cast; the notes list him under Names and his presence at the parish hall is open. Put him in the cast so the wall keeps asking. A guess about which way to hold him.
21. (the build) The wrong-tools fold: the writer knows the payoff (he gives her his) but not the scene. A fold cannot hold a known payoff without a card, and a thread needs cards too. The fold stands unpaid and the wall asks "where does it come back?", losing that the writer knows what comes back.
22. (the build) organize's reply nudges: "set_rank the turns and organize again for a row per beat", against the writer's "mark none".
23. (the build) The bucket card's open line says "(would be asked, closed: no thread with a loose end)", yet the bucket thread's loose end is asked anyway under [loose]. Unclear which side the question is on.
24. (the build) The unwired Declan card sat last in story order and last on the wall. There is no "unplaced" pile: an unplaced card reads as the final scene.
25. (the build) No check asks about a missing "when". Cards with no when are silent; only the ones I opened with "when" in the words list it. The premise holds the third year; no card holds any time.
26. (the build) "On a balcony" became the place "Ruth's balcony". A small reading of mine; the notes say "a balcony".
27. (direction 1) The Declan card's open words said "where it sits in the story"; the direction settled that, so I rewrote the words without it. Nothing in the move_scene reply noticed the open words now contradicted the wall.
28. (direction 1) The guide and set_open's description both say a question about the run a card sits in, beats back to back, is still asked of an open card. It was not: four beats run back to back at the end and the reading asks only about the two closed ones. The description promises one thing and the reading does the other.
29. (direction 1) set_rank's reply said "The rows are as they were; organize lays a row per beat." Marking beats leaves the wall laid out as if there were none. Left it, since the direction did not ask for a tidy.
30. (direction 1) No way to mark a beat as "proposed" against "the writer's". Once marked they read as the writer's on every reply.
31. (direction 2) The reading's "(would be asked, closed: no card without a place; no thread with a loose end)" names each check by its clean form. First read it as "these would come back clean"; it means the opposite. The negative phrasing of a check name is the wrong shape for a list of what would be asked.
32. (direction 2) Nothing on the wall says what closes "when". A card open only on "when" shows two things it would be asked and neither is about when. Closing it is the writer's words and nothing else.
33. (direction 2) The parish hall card is open and its "would be asked, closed" line lists beats back to back; yet that question is already asked of it under [empty], because the other card in the pair is closed. So an open card mutes beats-back-to-back only when both cards are open, which neither the guide nor the reply says.
34. (direction 3) "At Con's house, in the kitchen" has two homes on this wall. "Con's house, the kitchen" makes a second place the app will not relate to "Con's house"; "Con's house" drops the writer's word. The guide says spots in one location are one place, but gives the spot no field. Asked the writer rather than choose.
35. (direction 3) "Ruth is not there" changed nothing on the card. No reply confirms a no-op; nothing to quote.
36. (direction 4) update_note's reply says the place went from "" to "Con's house, the kitchen" and nothing else. It does not say a new place was made, or that "Con's house" already exists one word away.
37. (direction 5) "Between the first morning and the letter": the letter is two cards on this wall. Took "the letter card" as the arrival card, on our shared usage from direction 3; did not ask.
38. (direction 5) "That is all I know about it" gave no place. Put the teaching scene at the allotments because the bed is on the plot; a reading, not a statement. The card is not open, so the wall will not ask.
39. (direction 5) create_note with `after` worked this time, with arrows on the wall. So `after` is only usable from the third card on. The reply did not say the run it landed in now holds two cards.
40. (direction 6) "Will it keep asking?" is not answered by the reading. read_wall lists the [loose] questions and says nothing about whether they persist or how to quiet them. The answer is in create_thread's reply and leave_question's description. A writer reading the wall alone would not know "leave it" applies to a thread.
41. (direction 6) The key and bucket cards are open and say "(would be asked, closed: no thread with a loose end)", yet both thread questions are asked while the cards are open. That tail is wrong for threads.
42. (direction 7) A fold is one flag per card and does not say what it plants. A setup arrow from the first morning to the key card would count as paying the wrong-tools fold off, and the [unpaid] question would vanish while that payoff is undecided. Asked before drawing the arrow.
43. (direction 7) Nothing on the first-morning card can hold that the key is seen in it, except the thread's string. Headline and change line are silent on it; I did not rewrite them unasked.
44. (direction 8) read_pages prints an open card with no place under its headline as the scene heading, ".CON GIVES RUTH THE ONLY KEY TO THE SHED", with a bracket saying the headline stands in. A headline set as a slugline reads like a place; three of them on this script.
45. (direction 8) The first-morning card has no when, so its heading is "THE ALLOTMENTS" with no time. "The first morning" lives only in the headline, which the script does not print. Wrote "Morning." into the action to carry it, which the guide says is the when field's job.
46. (direction 8) The wall gave the scene four facts and no lines. The scene is action only, because no dialogue was given; what the wrong tools are is not on the wall and stays unsaid on the page. There is nowhere on a card for the detail a scene needs that a headline does not.
47. (direction 8) Writing the scene cut the runtime from about 11 to about 10 2/8 pages. The reply explains it, but a number that drops when you write reads as loss.
48. (direction 9) "How long is it?" has two answers on the wall: read_wall's runtime (about 10 2/8) and page_count's script so far (2 pages). Both say which they are, but the plain question gets a number five times the other depending on the tool.
49. (direction 9) "What is missing to reach ninety?" has no tool. The wall names where nothing is and asks about one such place; it cannot say what scenes are absent, and the rules forbid me an opinion.
50. (direction 10) compare_structure paired "The last harvest" with the Turns structure's inciting incident because both fall near page 9 on an eleven-page wall. The reply warns the pairing is arithmetic, but the row still prints the climax as the inciting incident.
51. (direction 10) compare_structure says "the story so far runs to p. 11"; read_wall says about 10 2/8 pages. Same wall, two roundings, a page apart.
52. (direction 10) "What does the wall know about Con?" is answered by read_character, which is not among the five first calls and which list_board only hints at ("page: notes"). Found it in the guide, not in any reply.

## 3. The on-ramp: what I didn't need, what it didn't say

**Not needed.** The doors, all five of them, and the whole account-door section of the guide: the server was wired and signed in. The shell door, the hosted door, PLOTCODER_ROOT, the file-versus-app distinction, the sample wall warning. The production half: locks, revisions, Final Draft. The video half: briefs and takes. About a third of the guide is for a session that isn't this one, and the on-ramp says so, three times.

**Not told, and needed.**
- That `after` on create_note needs a follows arrow already on the wall, so it cannot wire the second card.
- That set_open mutes every question on the card, not just the one about the open thing, and that the "would be asked, closed" tail lists checks by their clean names.
- That an open card only mutes beats-back-to-back when both cards in the pair are open.
- That a thread's loose end is asked regardless of the card being open.
- That a fold does not say what it plants, so a setup arrow for one thing pays off the fold for all things.
- That read_character exists and is where a person's page lives. The five first calls don't include it and list_board only says "page: notes".
- That page_count and read_wall answer "how long" differently, and which one to reach for.
- Where the server's folder is, for a relative path.
- That a wall found on arrival might be a previous run, not the sample and not the writer's.

**Worked out myself.** Every reading above. Also: that "leave it" is the way out of a standing question, which the guide says but no reading reminds you of; that a person named by role goes in the cast even when their scene is open; that "when" has no check and closing it is purely the writer's word.

## 4. What I never found a way to do, or did another way

- **Hold "supermarket or housing" as undecided above the wall.** The premise can't be open. You decided instead.
- **Hold two endings as alternatives.** No such thing. You decided instead.
- **Hold "the wrong tools pay off when he gives her his" without a scene.** The fold asks "where does it come back?" as if the answer were unknown. The known payoff lives in nobody's memory but yours and this report.
- **Leave the board's name open.** "Board 1" stands.
- **Wire the second card with `after`.** Drew all the arrows by hand.
- **Put "the kitchen" on a card at "Con's house" without making a second place.** You chose the second place.
- **Mark the seven beats as proposed.** They read as yours.
- **Say what is missing to reach ninety.** No tool; gave you the empty runs.
- **Put a time on the first morning without setting when.** Wrote "Morning." into the action.

## 5. What I was never sure had landed

- **"Ruth is not there"** on Declan's scene: a no-op, so no reply. Confirmed only by list_board from before.
- **The first-morning card's headline and change line after Con and the key joined it.** I left them as they were. Nothing told me whether the wall reads the key as seen in that scene beyond the thread's string.
- **The layout.** After set_rank the wall's rows were "as they were". I never organized after marking beats, so what a person sees on the wall is two rows of five, not a row per beat. Every reply says "live on every open wall" and I had no open wall to look at.
- **The exported copy of the old project.** export_project said it wrote the file. I did not open it to check.
- **Whether your answers were yours.** All ten directions came through another session's messages. Nothing in them said so, and I never had it from this chat.

## 6. What the notes left open that the wall could not hold, and what I did

- **The buyer, supermarket or housing.** No open state for a premise. You chose housing; it sits in the letter card's change line.
- **The ending, two versions.** No alternatives on a wall. You chose the bucket; Con does not die. Losing the plots has no card and sits in the last card's change line.
- **The time frame, one season or the third year.** No per-project time. You chose the third year; it lives in the premise. No card carries a time, and the wall never asks.
- **The wrong-tools payoff, known but unplaced.** Held as an unpaid fold that asks the wrong question. Left asking, at your word.
- **The key's first sighting.** Held as a thread with an open start, then tied to the first morning when you decided. The fold was not drawn to it, at your word, so the wrong-tools question survives.
- **The bucket's first sighting.** Held as a thread with an open start. Still asks.
- **Declan: subplot or plot, how many scenes.** One card, open in your words. The count of scenes has no home but those words.
- **The council man's presence.** In the cast on no card; the wall asks where he comes in. The parish hall is open on it.
- **The sister.** Never seen, so in Ruth's notes. The wall does not know she rings.
- **Who is in the break-in and the last harvest.** Nobody cast; both open. The kids have no cast record because whether they are on screen is open.
- **The board's name.** "Board 1".
- **When each scene happens.** Open on six cards in your words; silent on the other five, and the wall has no check to ask.
