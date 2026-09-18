# Round seventeen — the report

Run 2026-09-18, through the published package at 0.1.23, on a page of a
writer's notes instead of a treatment — `round-seventeen-idea.md`, "The
Allotments": eight scenes the writer knew, two versions of the time, an
ending not chosen, a break-in with three suspects. The first round to start
from an idea, which is what the app is for. The wiring held. The agent
asked twenty questions before building; the writer's answers, and then
seven directions, were relayed from the session that wrote the notes: the
order given and the turns proposed, one struck and one added, the gaps
proposed and not added, the break-in made Con's own doing, the folds, the
first morning written, the length against ninety. Thirty-nine entries.

**What the round was for, answered.** The wall has no way to hold a maybe.
Every record on it is an assertion, and a writer with an idea has cards
that are not assertions yet. It showed five ways (6, 7, 10, 13, 15, 30):
the eight cards read as a story order nobody chose; a decision not made
(the buyer) could not be recorded as open; a change line the writer had not
written was filled because the field is required, and the check for a
missing change line passed on it; a fact with no scene had nowhere to live
but a headline; a fact true of the story but not yet of a scene had no
home. Beside it, a second thing: **a thread is not a fold** (8, 9, 12, 31).
The fold lives on the plant, so a payoff waiting for its plant — the key,
the bucket — cannot be folded, drawn or asked about; two of the writer's
three threads ran that way. And a third, smaller: the wall is quietest when
the story is most open (11, 20): with no arrows nothing is unlinked, and
the check was tuned for wiring a finished treatment, not for eight cards
nobody has ordered.

**Fixed the same night, while it ran**, in pull requests #69 to #75: the
on-ramp's lead counts five calls and points at the doors at the end, and
new_project needs only a name (1, 5); the checks line counts the beat
check, and a question keeps its identity whatever order its names come in
(3, 18, 21); a fold can pay off more than once, said in the guide (8);
`cast` adds a name it does not have, as `create_note` does — two tools, one
rule (14); the reading asks about **a payoff with no fold**, a setup arrow
leaving an unfolded card (12), and about **a card with nobody in it** once
the wall has a cast (28); the reading says **"story order: unset"** on a
wall with cards and no follows arrows instead of reading the rows as an
order (10, 11), and the unlinked check says its threshold (20); **the
premise is the project's whatever its board count** — what a series is
about, or what is true before a film starts — in the words, the tool and
the guide (17); each run says whose pages it holds, and the runtime says it
is the number to use (37, 39). Fourteen checks now.

**Proposed, mocked, not built:** the open card, **R59** — a claim on a
card that says "not decided", in the writer's words, drawn as a sketch of a
card with the words on its edge, listed by the reading and not asked about
while it stands, the per-card twin of a left question. Three homes drawn in
`docs/mockups/r59-the-open-card.html`; B recommended; Robert's call. It is
the round's answer to 6, 7, 13, 15 and 30, and the thing the on-ramp's
"invent nothing" needs to be honest for an idea.

**Left, on purpose or not yet:** the guide's length (2); telling a demo
project from a person's (4) is not the app's to know; the "empty" question
between beats only (23, 27) is R20's shape — a gap beside a scene is a gap
the writer has not called a turn; two rank calls to strike and add (24);
the tidy's reply (25) and a dry run of the reading (26); a search of the
wall's words (29), worth a tool if it comes back; a thread as a record of
its own (8, 12, 31) waits behind the open card; a scene marked as sketched
rather than drafted (35) is the open card's idea on the page, and waits with
it; three answers to "how long" (37) are three questions; the harness's
denial (36) is not the app's.

**This is a snapshot of version 0.1.23.** The numbered log below describes
the app as it was on the night, not as it is. Read it for what the app did
with an idea, and for sections 3 to 6, which are about the shape of the
surface and outlast any one fix. Do not read it as current behaviour.

---

What follows is the agent's report, verbatim.

---

**Report**

**1. What I built and what you changed.** One project, "Plot 14", one board, "Feature", targeted at 90 pages, no logline. Eight cards from your notes and answers: the first morning, the council letter, the parish hall, Declan, the break-in, the day she tells him, the last harvest, the bucket. Four people with notes on three pages. Three places. One fold, on the first morning. You then gave me the order and I drew seven follows arrows. I proposed six turns; you struck the first morning and added the parish hall, leaving six beats and two scenes, and I tidied the wall. You made the break-in Con's own doing for the insurance, with Ruth working it out on the day she tells him, and I changed two change lines. You asked me to fold the three payoffs; only the tools had a plant card, and it was already folded. You had me write the first morning as pages, which measured at two eighths. Last, a length reading against the target.

**2. The friction log, complete.**

The way in
1. The on-ramp says "make the four calls" then numbers five and says "Make these five"; "skip the doors between" but the doors are at the end. The guide lists four and adds list_board in a separate clause. The count reads three ways across two pages.
2. The on-ramp says read the guide in full before the first call and that the guide wins. The guide is long and about half is doors, pages, exports and production. Nothing marks what an agent needs before its first call.
3. read_wall's description lists twelve kinds of question. The reply said "checks: 11 run" and its clean list named nine plus two asked. "No beat marked yet" went unmentioned. Ran silently or skipped, I could not tell.
4. The on-ramp says the reading says "sample" only when it is the sample. The account held The Weighbridge, not the sample. No reply distinguished a demo from a person's work. Your message told me; the app did not.

The asking
5. The on-ramp says an emptied account goes "straight to new_project (name, pages, and board)" as if all three were needed. The schema requires only name. You had not decided length, and the on-ramp did not say the project could start without one.
6. No tool or field holds an either/or. A card is one place and one time. The wall holds an open thing only as an absence, as a fold that never pays off, or as free text in "when". Nothing marks a card as provisional.
7. Your "Decide" on the buyer collided with the guide's "invent nothing". There is no way to record a decision as a placeholder the wall would later ask about.
8. The key runs through several scenes. A fold belongs to one card and a setup arrow leaving it is the payoff. Whether one fold can carry two setup arrows, or a thread can be held at all, is stated nowhere.
9. The tools' payoff had no scene among your eight. The guide says a payoff never needs a card of its own, which holds only when a scene exists to land the arrow on.

The build
10. Story order cannot be held as unknown. Rows read as story order, so the cards placed in your list order became the story's order in the records and every export, though nobody decided it.
11. A wall with zero arrows raises no "unlinked" question: "not asked: no arrows yet". One arrow and seven cards become unlinked. The wall is quiet exactly when the order is most open.
12. The key and the bucket are payoffs with no plant card. The wall asks about a fold with no payoff, never about a payoff with no fold. Both live in a change line and a headline, and no arrow can be drawn.
13. "Con says nothing" is a change line because the tool requires one and your notes state no change. The check for a missing change line passes on a non-empty field. A change line that states no change is not caught.
14. create_note says an unknown name is added to the cast. The cast tool says an unknown name is refused. The guide says invent nobody. Two tools, two rules.
15. The letter is posted to the house. That fact has no card, no place, no field. It lives nowhere on the wall except in my headline.
16. The ending card's cast. You named Ruth on the balcony and nobody else, so I cast Ruth alone. A guess the wall cannot check.
17. "The third year" has no home. Premise is for several boards and you left the logline empty. It went into Con's notes.
18. read_wall again said "checks: 11 run" while listing three asked and nine clean or not asked. The count and the list disagree.
19. A card's reply reports the wall's questions only when they changed. The first quiet reply read as if the card had not been checked.

Direction one, arrows and turns
20. Seven arrows drawn at once. The first two replies said nothing about questions though six then five cards had no arrow. "Unlinked" appeared on the third reply naming four. A threshold, or concurrent deltas out of order; I could not tell.
21. The fourth arrow's reply listed "unplaced" as gone and then new, the same two cards in the other order. Name order in a question's text counts as a change. Noise.
22. After marking beats, the rows on screen disagree with the arrows and beats until organize is called. The reply says so; the direction did not ask for a tidy, so the screen was stale until you said.
23. The chained "empty" question offers two answers, strike a beat or add a scene. The third, leave it, lives in a separate tool and must be given by kind and ids.

Direction two, strike and add, tidy
24. Striking one beat and adding another took two calls, since rank is one value per call. Two replies with two question deltas to read together.
25. The tidy's reply gives row counts and nothing about where the scenes landed. The records were needed to see Declan beside the parish hall.

Direction three, propose the gaps
26. No dry run. The wall cannot say what it would ask about a card not yet there. Every "what the wall would ask" was my prediction from the description's list.
27. The wall's gap is beats-only. Three of your seven gaps are never asked about because a scene sits at one end.
28. A card with nobody on it is not on the wall's list. A scene nobody is in passes every check.

Direction four, the break-in was Con
29. "Wherever it says otherwise" has no search. I read the whole records reply and both cast pages by eye. One place held it; nothing confirms there was not another.
30. A fact true of the story but not yet of a scene has no home. A change line asserts when a thing becomes true; notes assert nothing about time.

Direction five, fold what pays off
31. "Fold what pays off" maps to a tool only when the plant has a card. The app's model runs one way, plant to payoff. Two of your three threads ran the other way.
32. The card-edit reply quotes old and new lines but says nothing about whether the questions moved, unlike creation and rank replies. A second read was needed.

Direction six, write the first morning
33. The pages read prints a card with no place under its headline in capitals as if a slugline. Marked, but easy to take for a place.
34. The heading is the card's place and when; the guide says start with action. Nothing says what happens if the text begins with its own heading. Untested.
35. A scene written honestly from thin notes measures short. The app has no way to mark a scene as sketched rather than drafted.
36. My harness, not the app: the first write_scene was denied by this session's permission classifier. The retry on your word went through, and the app's reply was complete.

Direction seven, the length
37. "How long is it" has three answers in three replies. The pagination reply says which to use; the reading does not.
38. The "under" figure is one subtraction. No reply breaks it by run.
39. The runs list says "pages are estimates" even for the run whose only card is measured.

**3. What the on-ramp told me that I did not need, and what it left out.** Not needed: every door, the config blocks, the shell and hosted routes, the section for the person. The server was in front of me and the on-ramp said so, but a third of the page is wiring. Not told, and worked out myself: that the five calls' replies carry ids the reading does not, so list_board is the one to keep; that a wall with no arrows asks nothing about order; that the fold is the plant's and a payoff cannot be recorded first; that "empty" is asked only between beats; that rows on screen go stale after every rank change until organize; that new_project starts without a target; that the pagination number and the reading number differ and which to trust. The guide covers some of these deep in its middle, not in the on-ramp.

**4. What I never found a way to do, or did another way.** Hold the order as undecided: I placed cards and told you the row order was not a decision. Hold two versions of a fact: I asked you instead. Record the key and the bucket as threads: they went into a change line, a headline and Con's notes. Say what the wall would ask about a proposed scene: predicted by hand. Find every place the wall said "kids": read by eye. Mark a scene as sketched from notes: no way; it measures as two eighths and that is what the wall says.

**5. What I was never sure had landed.** The first two arrows of seven: their replies said nothing about the unlinked question when it should have applied, and I only trust them because the records later showed all seven. Whether "no beat marked yet" was checked on the old account's wall. Whether the tidy put Declan where the arrows said, until I read the records. Whether the first write_scene, denied by my harness, touched the account before the denial; the retry's reply and the runtime figure say the text landed once.

**6. What the notes left open that the wall could not hold, and what I did.** The buyer, Ruth's past, the year, the ending: you decided them when asked, so nothing stayed open there. The order: you gave it. Still open and held only by absence or a question: where Declan's scene and the day she tells him happen, asked by the wall as "unplaced"; when the letter, parish hall, Declan, break-in day, reveal and ending fall, held as blank with no question; where the tools pay off, held as the fold's "unpaid"; where the key and bucket are first seen, held nowhere and asked about by nothing; whether the sister's call and the tools' handover sit inside a scene or need one, held in Ruth's notes and the fold; whether Con is in the last scene, held as Ruth alone; the letter's arrival at the house and the night of the break-in, not cards; the central question, empty at your word; "the third year", in Con's notes because no field on a one-board project takes it.
