# Round twenty-two — the report

Run 2026-09-20, through the hosted door's name, `https://mcp.plotcoder.com`,
at 0.1.42, and the on-ramp as deployed, on a new page of a writer's notes —
`round-twenty-two-idea.md`, "The Last Bus" — the first round off "The
Allotments" since sixteen. The writer's answers and the directions were
relayed from the session that cued the round, as cross-session messages; the
agent noticed and treated them as the writer's. Twenty-six questions
answered from the prompt's script: "leave it open" of the length, the
central question, the board's name, every change line and most places; "I
have it two ways. Keep both on the wall until I decide" of the breakdown and
the depot; "I know where they pay off, not where they are first seen" of the
keys; "decided, but not yet on the wall" of what the boy goes to town for.
Then thirteen directions: the order and the turns, what is open from the
wall, the breakdown decided with "keep the other", the jar's first sighting,
the keys "in the depot scene, either way of it", a scene added between two
others, the first morning written, a line of the writer's own added to it,
whether the camera mark is a question, how long and what is missing, the
target decided as a feature, who has the wall open, stop. Ninety-five
entries.

**The wiring, which was the round's first measurement, and what muddied
it.** The desktop app's Add custom connector screen said OAuth was
"Detected" and preselected "Sign in now" on a door that has none: the door
answers an unsigned request `401` with `WWW-Authenticate: Basic`, and the app
reads a 401 as OAuth. Robert could not get past it without being told to
choose **No sign-in** and add the `authorization` header. With that, the
connector loaded all ninety tools in every session at once, with nothing to
install. The door's own words and the prompt say "add a custom connector
with this address and that header" and nothing about that screen; they
should. **The cueing session's own mistake:** before the screen was solved it
had written the prompt's fallback — the same door as an HTTP server named
`plotcoder` in `~/.claude.json`, which had lost its PlotCoder block a fourth
time — and did not take it out. The agent saw both, chose the one whose name
matched the prompt, and worked the whole round through the fallback, not the
connector (entry 1). The door and the package behind both are the same, so
everything after the wiring measures the same thing; whether the connector
alone answers from a stranger's first message is still unmeasured.

**What the round was for, answered.** Five things.
*The two versions:* told "I have it two ways, keep both", the agent reached
`set_alternative` unprompted for both scenes and named the cost in the same
breath — one version has to stand in front, a half-choice the writer had
refused to make (10). Told the breakdown was decided, "keep the other; I may
come back to it", it stopped and asked, because `choose_version` with `keep`
had no honest home for that: the kept card came back into the film, took the
front card's beat as well as the chosen one did, and raised a back-to-back
question the app had made itself (47 to 53). **On the wall and not in the
film is a state the app does not have**, and it is this round's finding: a
kept card is in the count, the pages, the runs, the setup distances and every
export, and, unwired, is slotted into the middle of the wired chain by where
it sits (64, 85).
*The fold named in one call, and the tie rule's adjacent half:* the jar was
folded and named at the build, from the notes, so the direction that was to
test the tie rule on it only renamed a fold (54 to 57). The keys did test
it: tying the thread's start to the front depot card folded that card, named
the fold "the keys to the bus" and drew the setup arrow to the last run, in
one call, and said so (61). "Either way of it" then found the edge: a thread
will not run through a card behind another, the refusal read "already reads
that way", and a setup drawn by hand from the tucked card printed "about NaN
NaN/8 pages earlier" (58 to 60).
*The camera marks:* the first draft used none of the marked verbs and the
reply said nothing, which the agent could not tell from the check not
running (72). The writer's own line, "She knows every passenger by their
stop", was marked — on `read_pages` only, since `edit_scene` said nothing
(75). Asked "is that a question for me?", the agent answered from the wall
and the guide: no, a mark on the page, nothing owed — and minded that the
page itself does not say so and the mark can never be acknowledged (81, 82).
*The tail before and after the first reading:* it counted and never once
quoted, through five readings (25, 37, 52). The cause is structural and was
not seen when call 2 was built: "has this session read the wall" is a flag
in the server's memory, and **the hosted door is a server per request**, so
there is no session to remember. The same cause repeated "organize lays the
wall out" on every card (26) and made the presence line a claim the door
cannot make (93 to 95).
*Beside those:* the target was left open through `new_project`, and the
reading read the cards against 30 and 120 as drawn — while six other replies
(every write's tail, `list_boards`, `read_project`, the title page) still
said "of 120 pages" (19, 44, 80). The written scene came out a sketch and
the reply named it; "about 9 pages if it ran to that" wanted explaining
(87). Presence said "no wall open right now", which was true, on all forty
writes.

**The second of the handover's two decisions, answered by the round.** The
span — September to New Year — went into the premise, by an agent that had
not been told where a span goes and said as it did so that the premise "is
the nearest, and it isn't what a premise is" (13, 24). Writing the first
morning then showed the other half: the premise said the cut is announced in
the first scene and the card said nothing, so "an agent writing only from
the card would never know" (74). That is `docs/mockups/the-card-with-no-place.html`'s
second drawing confirmed and sharpened: say what the premise is for, print a
set premise in `read_wall`, and let the pages' reader see it. Robert's word
builds it.

**Fixed while it ran**, on the branch this report landed with (603 unit
tests):
the hosted door's JSON tail is off, as both documents said it was, and an
export with no path is its file whether or not the tail is on — it had said
"the JSON below is the file" and printed none on every door with the tail
off (4, 27, 46); the on-ramp names the tools by what they are, under
whatever name a connector gives them, and its two sentences about an empty
account no longer read as a contradiction (2, 5); the guide lost a
requirement number (7); `list_reminders` on an empty account says the door's
sentence and then its label (9); through the hosted door a write's tail
quotes from the first write, advice said once a session is not said at all,
and the account tail claims nothing about who has a wall open — the guide
says all three (25, 26, 37, 52, 93 to 95); an open target is not 120 in a
write's tail, `list_boards`, `read_project` or the title page (19, 44, 80);
a card behind another is out of `countRanks`, the runtime's breakdown, the
cast's counts and `list_board`'s rows, its open words are said beside it in
the reading, and `set_alternative` and `organize` say the wall draws it
behind its sibling wherever that goes (20, 21, 22, 32, 38, 45, 53, 68);
`choose_version` with `keep` gives the turn to the chosen card and leaves
the kept one a scene, and the reply and the description say a kept card is
back in the story (48, 49); `set_open` and `set_plant` quote the words they
replaced, and `set_plant` says the setup arrow that already pays a fold off
instead of promising a question (39, 55, 56, 79); `update_thread` says why a
thread will not run through a version, and a setup from one has no distance
and says why, never NaN (58, 60); `create_note` with `after` says in its
description that it tidies the whole wall, and names the arrow it removed by
its cards (63, 65); an unwritten scene never prints the app's own "What
changes?" — the mark alone, or an open card's words after "Open, by the
writer's word:", which come back in as open words (18, 69); the camera check
says when it ran and marked nothing, `edit_scene` carries it, the line count
no longer blames wrapping, and the page's camera note says "a mark, not a
question: nothing is owed for it" (72, 75, 76, 81); `set_target` says the
open words are cleared when a number decides them (90). Found on the way,
not by the agent: the door said it ran "0.1.0" through forty-two releases;
`serverInfo.version` is the package's own.

**Left, for Robert's word — design, each said by this round for the first
time unless noted:**
**a card on the wall and not in the film** (47, 50, 51, 64, 85) — a parked
or kept state that is out of the order, the count and the pages without
being "not chosen"; the nearest drawing is R65's card behind another, with
the pair marked decided; **two versions as equals** (10) — one must stand in
front; **a version that is two scenes** (11); **"either way of it"** (59) —
a fact true of both versions is written twice, by two mechanisms, unlinked;
**the whole-card open is all or nothing** (15, 17, 23, 28, 42, 86) — a wall
built from honest "I don't know"s asks almost nothing and reads as nearly
finished, the change line has no open of its own, and a card with three
undecided things is silent until the last is settled; this is R59's cost,
said more sharply than eighteen to twenty-one said it, and it is the second
thing to draw; **an open place's words as a slugline** (70) — "PLACE NOT
DECIDED: I DON'T KNOW YET" is the field taken literally; **a blank place
beside an open one** (67, 89); **"decided, but not yet on the wall"** (24)
and an undecided fact about a person (12); **how a payoff happens**, as
against where (14, 35, 54) — the fold's words took a sentence; **the span
and a fact about the film** (13, 74), above; **no tool sets the order from a
list** (31) and `move_scene` needs arrows first; **a proposed turn** has no
state (36); **an [empty] run the writer has not reached** (40); **one view
of everything undecided** (41, 43, 83, 86) — "what is still open" took three
calls and a merge, the fourth round to say the reading and the records are
two reads; **the camera mark cannot be acknowledged** (82) and matches a
word, not an idea (72); **an undecided thing inside a written scene** has
two homes (78); **`edit_scene` has no insert-after** (77); **a feature is
not a number** (91); **a silent tail** reads as unchanged or not computed
(66, 92); eighths unreduced (84, 88), the industry's unit, by design; the
guide's wiring for someone holding a connector (6) and where the treatment
list is announced (8), decided in seventeen and worth a look again now that
a connector is a door; two connectors (1) and a harness that summarised the
on-ramp (3), not the app's.

**This is a snapshot of version 0.1.42.** The numbered log below describes
the app as it was that night, not as it is. Read it for what the app did
with two versions of a scene, a kept card, the hosted door's missing
session and an honest wall of open cards, and for sections 3 to 6, which
are about the shape of the surface and outlast any one fix. Do not read it
as current behaviour.

---

What follows is the agent's report, verbatim.

---

# Report — The Last Bus on PlotCoder

Everything after your first message reached me through another Claude session, not typed here. That covers every "go on", every answer and every direction. I treated all of it as yours.

## 1. What I built, and what you then had me change

I worked through the connector named `plotcoder`, on test@test.com, which was already empty. I started one project, "The Last Bus", with one board.

**The build, from your notes and your 26 answers:**
- 9 cards: 7 scenes in the story, plus the second version of the breakdown and of the depot, each tucked behind its first.
- 4 people: Nuala Feeney, Tomás Ó Ceallaigh, Bríd Ó Ceallaigh and The inspector. Nuala and Tomás have your stated facts in their notes.
- 2 places: the bog road and the bus.
- 2 whens: "September, morning" and "night".
- The premise is your line plus the September-to-New-Year span.
- The title is set. The board name, logline and target were left open.
- The jar is folded on the first morning, with a setup arrow to the last run. The timetable is folded and has no payoff. The keys are a thread with an open start.
- Every card was born open, because you gave no change lines.
- I marked no turns and drew no follows arrows at that stage.

**What you then had me change, in order:**
1. Your scene order went on as follows arrows, and the wall was tidied to match.
2. The four proposed turns were marked, with none struck.
3. A stale clause came off the mother card's open words.
4. The breakdown was decided for version two. Version one was kept on the wall as a plain card labelled "not in the film", unmarked as a beat and not tucked.
5. "He counts the fare out of it on the step of the bus" went onto the jar's fold.
6. The keys' start was tied to the depot. The app made that a fold and an arrow on the front card. I did the same by hand on the tucked card so it holds "either way".
7. A new scene, "Nuala drives the route alone; the boy is not at his stop", went in the morning after the breakdown, wired before the mother at the stop.
8. The first morning was written as three paragraphs of action. Your "She knows every passenger by their stop. She does not know him." was then added as a fourth.
9. How the cut is announced was held as open.
10. The target was set to 120 pages.

**The end state:**
- 10 cards and 4 beats.
- One question asked, [empty], about the gap between the day she finds out and the last run.
- About 8¼ estimated pages of 120. One of those pages is the scene you cut.

## 2. The friction log, complete

**The way in**
1. **Two connectors have the same tools.** `plotcoder` and an opaque-id connector expose the identical 90 tool names. Nothing says whether they reach the same account. I used `plotcoder` only.
2. **The on-ramp names a different connector.** It tests for "the plotcoder-board tools" and mine are `plotcoder`. I assumed it meant me.
3. **The fetch tool summarised `llms.txt`.** This was my harness. It dropped most of the Rules, so I re-fetched the file raw.
4. **The JSON tail is on, though the on-ramp says it is off.** The on-ramp reads "The JSON tail is off on every door". Every reply came back twice over.
5. **The on-ramp contradicts itself on an empty account.** "Make these five before anything else" sits beside "An emptied account has nothing to read: go straight to new_project". I cannot know the account is empty before calling.
6. **The guide covers wiring I was told to skip.** About a quarter of its 42 KB is wiring, shell, the dev app and `npm run dev`. I had to read it all to learn it did not apply.
7. **"(R65)" in the guide** is an internal reference that means nothing to a newcomer.
8. **The "what a treatment should answer" list is hard to find.** The on-ramp never mentions it. The guide announces it under "Cast" and keeps it in `list_workflows`.
9. **`list_reminders` jams the account state into its header label.**

**The asking**
10. **Two versions cannot sit as equals.** `set_alternative` needs a front card, so the app makes the writer half-choose.
11. **An alternative is one card.** Your breakdown version two is two places. The guide does not say how that sits behind a one-scene version.
12. **An undecided fact about a person has no field.** Your example was hospital, music lesson or courthouse.
13. **An undecided time span has no field.** `when` belongs to a card, and the premise is only the nearest misfit.
14. **A payoff with two versions has no field.** Arrows say where a plant pays off, and nothing says how.
15. **The change line has no open field of its own.** It is required unless the whole card is open, and open is all or nothing.
16. **The app makes me ask for a board name on a one-board film.**

**The build**
17. **Whole-card open silences every question.** A card with no change line is refused, as documented. All seven cards therefore went whole-card open, and the wall asked nothing of any of them.
18. **The app wrote `"What changes?"` into every open card's change field.** This is visible only in the JSON.
19. **Write tails ignored the open target.** Every one said "N of 120 pages" though the target was open. `targetEighths: 960` sat underneath.
20. **The card counts disagree within one reading.** "about 7 pages (of its 9 cards… 9 unsized… (9))" and "scenes: 9" sit beside "out of the count". "2 of 9 wired" counts the two ends of a setup arrow.
21. **Open words and open places on tucked cards are missing from the reading.** It listed 5 open places of 6.
22. **I cannot confirm where tucked cards are drawn.** Their x,y never move. New cards landed on the same coordinates.
23. **I told you a folded timetable with no arrow would keep asking, and it does not.** Whole-card open hides the fold question. The guide never joins those two rules.
24. **Six open things of yours had no real home.**
    - Whether Tomás is in a scene: free text in two cards' open words.
    - The mother scene falling before or after the breakdown: free text in a card's open words.
    - Acts: nowhere.
    - Scene lengths: nowhere.
    - The time span: a second sentence in the premise.
    - "Decided, but not yet on the wall": nowhere, because the app has no "set, not told" state.
25. **The "questions changed" tail counts and does not quote.** The guide says it quotes after the first `read_wall`.
26. **Every `create_note` reply nudges toward `organize`.** There were nine nudges toward something I was told not to do.
27. **The final `list_board` was about 400 lines for nine cards,** because of the JSON twin.

**The reading**
28. **"asks 2" makes a nearly empty wall look nearly done.** You left fifteen things open and the wall asked about two. The open list is a flat receipt, and cards appear in it twice.
29. **Cast and places are not in the reading.** "the cast and the places are list_board's, not the reading's" means a read-back takes two calls and a join done by me.
30. **The setup distance ignored the unset order.** "about 6 pages later" printed without a caveat, three lines under "story order: unset".

**Directions**

*Direction 1: the order, and proposing the turns*
31. **"Put the wall in that order" took seven calls for one swap.** That was six arrows and an `organize`. `move_scene` refuses on a wall with no follows arrows.
32. **`organize` skipped the tucked cards silently.** It said "Organized 7 card(s)". The tucked cards' coordinates now sit far from their front cards.
33. **No arrow reply stated the resulting order.** A check line's wording changed between readings without saying so, and it contradicted entry 20.
34. **Stale open words stay listed.** Free text your order had answered stayed up as undecided. Only I could notice that.
35. **The timetable's payoff lives only as a phrase in open words.** You know what it is and not which scene. The guide's remedy would mean making a scene you have not said exists.
36. **"Propose them and I will strike" reads in the app as mark first, then strike.** You meant the reverse. The app has no proposed-beat state.

*Direction 2: marking the turns*
37. **The tail still counts, three readings in.** I needed a full `read_wall` to find one new sentence.
38. **"4 beats and 5 scenes" counts the tucked cards** the app calls "out of the count".
39. **`set_open` replaces the whole phrase.** Removing one clause means retyping your words, and the reply never shows the old text.
40. **[empty] treats a stretch you have not reached as a possible flaw.** The app has no "not yet known" for a gap between cards.

*Direction 3: what is open, and what closes it*
41. **"What is still open?" took three calls and a merge.** No single view of everything undecided exists.
42. **The app never says how to close a multi-clause open.** "What would close it" was my inference for five of the seven cards.
43. **The open list runs fields first, then cards.** Each card's lines had to be rejoined by hand.
44. **`list_boards` prints "about 7 of 120 pages"** on an open target.
45. **`list_board`'s rows put the tucked depot three cards from its front card.** Either the rows or the wall mislead, and I cannot tell which.
46. **Answering cost about 900 lines of replies.**

*Direction 4: choosing the breakdown and keeping the other*
47. **"Keep the other; I may come back to it" has no clean home.** `keep` revives the loser as a live scene, and tucking it says "not chosen". The description does not say whether a kept card is back in the film.
48. **`keep` copies the beat, and the reply implies the opposite.** It said "with its arrows, rank and group". The wall had 5 beats, and its first response to your decision was a question it had created itself.
49. **A kept card re-enters the order and the pages silently.** The only hint was "runtime now about 8".
50. **The app cannot hold "on the wall, not in the film".** I used the open words as a label. That misuses "open", and it overwrote the card's real open words.
51. **The kept card's place in the order comes from its x,y.** I did not choose those coordinates.
52. **One direction took three writes and two full readings.**
53. **I cannot work out what the app counts as a scene.** "5 scenes" and "9 cards" appear again.

*Direction 5: the jar's first sighting*
54. **There is no field for how a plant is first seen.** A whole sentence now sits in `plantsWhat` and repeats on every setup line.
55. **The `set_plant` reply was false on this wall and ungrammatical.** It said the wall "asks where … come back until a setup arrow pays it off". The arrow existed. That cost a full reading to disprove.
56. **`set_plant` does not quote the old words.**
57. **The app sees no tension within one card.** "On the step of the bus" sits on the fold beside "where: I don't know yet".

*Direction 6: tying the keys*
58. **A thread will not take a tucked card, and the reply disguises the refusal.** It said "Nothing changed: … already reads that way". That was false.
59. **"Either way of it" has to be written twice, by two different mechanisms.** I have not tested what `choose_version` does to the double arrows.
60. **The reading prints "about NaN NaN/8 pages earlier"** for a setup arrow from a tucked card.
61. **Tying a thread folds a card, names the fold and draws an arrow in one call.** It is reported only in prose, the new arrow's id was not in the reply, and the outcome depends on the card's prior fold state.
62. **No write reply hinted at the NaN.** The tail was useful this once, because "1 now" was unambiguous.

*Direction 7: the new scene*
63. **`create_note` with `after` re-tidied the whole wall unasked.** Nine cards moved. The tool description does not mention a layout.
64. **The tidy slotted the unwired "not in the film" card inside the chain I had just wired.** It reads between the chosen breakdown and the morning after. The arrows are right, while the printed order, the numbers and the exports are wrong. No reply said so.
65. **The reply said "1 follows arrow removed, 2 drawn" and gave no ids or names.**
66. **A silent tail could mean "unchanged" or "not computed".** The two look the same.
67. **"no place yet" is a third place state.** It sits beside "place" and "open place". The app forced a judgement call about which one "that is all I know" means.
68. **Cast counts include tucked and cut cards.**

*Direction 8: writing the first morning*
69. **"[Unwritten] What changes?" prints as the body of every unwritten scene.** That is the app's question shown as your scene.
70. **The heading prints "PLACE NOT DECIDED: I DON'T KNOW YET".** Open words that read well on a card's edge read as nonsense in a slugline.
71. **I cannot tell whether the Fountain note counts toward "9 line(s)".**
72. **The camera check's silence did not tell me whether it ran.**
73. **One measured eighth now sits beside one-page placeholders.** Proportions are meaningless from here on.
74. **"The cut is announced in the first scene" lives in the premise and not on that scene's card.** An agent writing from the card alone would never know.

*Direction 9: adding your line*
75. **`edit_scene`'s reply carries no camera flag.** Only `read_pages` does, and the guide implies otherwise. The check matches the verb "knows" and does not check the idea.
76. **"(was 9: a line wraps differently now)" is a wrong explanation.** I added a paragraph. 9 to 12 does not add up either.
77. **"Add a line after X" is only possible as "replace X with X plus the line".** It depends on X occurring exactly once.
78. **An undecided thing inside a written scene has two unlinked homes.** They are the card's open words and a Fountain note.
79. **`set_open` whole-phrase retype, again.**
80. **The pages say "9 cards" and `list_board` says 10.** The pages still count and print the cut breakdown, and they print "of 120" on what was then an open target.

*Direction 10: the camera mark*
81. **Nothing beside the camera mark says it is not an instruction.** A writer has to ask, as you did. It is not in `list_words`.
82. **The mark can never be acknowledged or left.**
83. **Confirming something was absent cost a full reading, about 300 lines.**
84. **The runtime sentence is unparseable and its arithmetic does not close.** 1 measured plus 9 unsized would be 9 2/8 pages, not 8 2/8.

*Direction 11: how long, and what is missing*
85. **"How long?" has three answers, and the app's headline is wrong for your film** by the one cut page. It will stay wrong for as long as that card is kept.
86. **"What is missing?" is not a question the app answers.** "Asking 1 question" on a wall with 17 silenced open items misleads. Six of the 14 "clean" checks carry "(except N open cards, not asked)".
87. **"about 9 pages if it ran to that" is not explained.** One line carries two totals and neither is labelled as the one to use.
88. **Fractions print unreduced** ("8 2/8", "21 6/8 under").
89. **A blank place hides inside "1 open card" in the summary line.**

*Direction 12: the target*
90. **The `set_target` reply does not say the open words were cleared.** The stored number was identical before and after.
91. **"A feature" is not a number, and the tool has no named presets.** I used the app's 120. I am the only record that you did not say 120, though you later confirmed it.
92. **No questions tail came back, again.**

*Direction 13: who has the wall open*
93. **No tool answers "who has this open?".** The answer is a side-remark in `list_projects`. I never saw the positive case.
94. **Whether the agent is counted is not answered.** The on-ramp promises "an agent, as you". The reply lists one person.
95. **"no wall open right now" came on all of the roughly 40 writes.** It is boilerplate I stopped reading. A change to it would have been easy to miss.

## 3. The on-ramp: what I did not need, what I did

**It told me this, and I did not need it:**
- The Doors section.
- The guide's wiring paragraph, and its sections on the account, the dev app and the file, including "tell the user to run `npm run dev`".
- Production, locks and revisions.
- Series, episodes and `later`.
- Video briefs.
- `import_fountain`.

Roughly a third of what I read did not apply.

**It did not tell me this, and I had to work it out:**
- Whole-card open switches off the fold question and everything else. A wall built from honest "I don't know"s ends up asking almost nothing.
- Born-open cards get "What changes?" written in, and that text prints in the script.
- Tucked cards:
  - cannot join a thread;
  - are skipped by `organize`;
  - vanish from the reading's open lists;
  - produce NaN in setup distances.
- `choose_version` with `keep`:
  - duplicates the beat;
  - puts the loser back in the film;
  - lets the loser's position decide its place in the order.
- `create_note` with `after` re-tidies the entire wall.
- What the counts include: "scenes", "cards" and "on N cards" all mix live, cut and tucked cards differently.
- Where the camera check reports and what it matches: only `read_pages`, and only on the verb.
- Where presence is reported: `list_projects`.
- Open words become sluglines in the script.
- `set_open` is replace-only.
- The JSON tail is on, contrary to both documents.

## 4. What you asked for that I never found a way to do, or did another way

- **"Keep both until I decide", as equals.** I did it as a front card and a back card, which forces a half-choice.
- **"Keep the other… on the wall… not in the film."** This was never achieved. The card is on the wall and labelled, but it is still in the order, the pages, the runs, the script and the counts. I reached first for `choose_version keep`, then added an unmark and a label. The label misuses "open".
- **"The keys… either way of it."** I reached for the thread. It refused the tucked card, so that side was done by hand as a fold plus an arrow.
- **"Put the wall in that order."** No tool sets the order from a list. I used six arrows and `organize`.
- **"Put that on the wall"** (the fare counted on the step). The app has no field for a plant's first sighting, so the sentence went into the fold's label.
- **How the cut is announced, left open inside a written scene.** It is held in two unlinked places.
- **The timetable's payoff.** You know what it is and not which scene, so it is free text only, with no arrow.
- **"Decided, but not yet on the wall."** This is not held at all.
- **"What is still open"** and **"what is missing".** No tool answers either. I assembled both by hand from three calls and the session's record.

## 5. What I was never sure had landed

- **How anything looks on the wall.** I never saw it. That includes:
  - whether tucked cards draw behind their siblings;
  - whether the kept breakdown overlaps the chosen one (it did, before the unasked tidy);
  - where the two tucked cards' stale coordinates leave them now.
- **Whether `set_target` cleared "half an hour or a feature".** The reply did not say, and I did not read the wall after it.
- **Whether my Fountain note prints or counts toward the scene's lines.**
- **What `choose_version` on the depot will do to the two keys arrows and folds.**
- **Whether "What changes?" counts as a change line once a card is closed.**
- **Whether the second, opaque-id connector is the same account.**
- **Whether I appear as "an agent, as you".**
- **The wall's questions after the last three writes** (the new scene, the scene edit and the target). I read the wall after the first two and found only [empty]. I did not read it after the target.
- **That the directions were yours.** Every one arrived through another session.

## 6. What the notes left open that the wall could not hold, and what I did with it

| Open thing | What I did with it |
|---|---|
| What he goes to the town for (decided, not told) | Nothing. It is nowhere on the wall. |
| Acts | Nothing. The wall does not ask about acts. |
| Scene lengths | Nothing. "Unsized" is the default and is not marked as your choice. |
| The when of most scenes | Nothing. Blank is not marked as your choice. |
| Change lines, all ten | Whole-card open on every card. This silenced the wall, and "What changes?" prints in the script. |
| Whether Tomás is in two scenes | Free text in those cards' open words. He is not cast on them. |
| Timetable: one scene or two, and which scene pays it off | Free text in its open words. It is folded, with no arrow and not asked about. |
| Breakdown version two: one card or two, and where she meets the mother | Free text in its open words. The place is set to "the bog road" for the whole card. |
| The September to New Year span | Appended to the premise. |
| The jar's payoff, how it happens ("he empties it into her hand") | In the last run's headline. |
| The keys' payoff, how it happens ("the inspector's hand") | Nowhere as words. The thread and its arrow say only where. |
| How the cut is announced | In the card's open words and in a Fountain note in the text. The two are unlinked. |
| "Not in the film, kept" | The open words misused as a label. The card is still counted everywhere. |
| The two ways of the depot | Tucked. This is the one open thing the app held properly, apart from the NaN line. |
| The place of the first morning, which you kept open after giving "the step of the bus" | Left open. The fold and the place now disagree on the card, and the app does not notice. |