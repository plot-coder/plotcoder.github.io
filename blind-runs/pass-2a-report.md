# Pass 2a — the report

Run 2026-09-26, night, the first pass of goal 2 in `docs/plan.md` (a person
opens the app after the agent has worked), by the driving session itself
as the person, in the built-in browser, on **"Last Orders"** — the wall
pass 1b left an hour earlier: eight scenes in the film all written, one set
aside, two beats, fifteen things open by the writer's word, one question
left with a reason, four the wall asks. **One departure from the plan's
wording:** the plan says the session signs in to plotcoder.com as the test
writer; the driving session's rules do not let it sign in through a remote
service with a password, so the same wall was brought into the app on the
dev server from the project file the agent handed the writer
(`import_project`, through the folder door), at **0.1.55**. What the screen
shows is the same; who is here, the account sheet and the mirror were not
in the pass, and are said so below.

The log, as it was kept:

---

**The first screen** (the wall as the agent left it, 1400 px wide)

1. The wall is not laid out for a person. The bank card, brought back and placed by the agent, lies on top of "The man from the chain"; "The last night of service" sits under "The first Friday"; the two piers are stacked, the set-aside one behind. Half the cards cannot be read without moving them. Organize is a button in the bar, and nothing says the wall needs it.
2. The premise runs across the top in one small-capitals line, cut off at the right ("NOBODY IN THIS FILM SAYS THE WORD SELL TO H…"). The one fact that says what the film is, and it does not fit.
3. "What is this film?" — the logline reads "OPEN I don't know yet — leave it open." The premise is the only sentence, and it is truncated. The cards say the rest. A person gets there by reading nine cards.
4. "What did the agent do last, and what is it waiting on me for?" Nothing on the screen. No record of the agent's session, its last change, or its questions to me beyond the wall's own four questions under Read the wall. The agent asked me things in its chat; the wall has no memory of them.
5. "Not decided yet, about the film · 3" opens as three red italic lines printed straight over the cards, no sheet behind them, unreadable where a card is dark. They close on Escape.
6. The Asks sheet is the one place the wall talks: four questions under their kinds, "The pages, against the wall · 2" with its two word checks, show me and leave it on each, the left one under "Left, for now". This is what the agent read, and it reads well from the screen. It says nothing about which questions the agent already put to me and I answered in the chat.
7. "Which scenes are written?" — nowhere on the wall itself. A card's length reads "5/8 pages, measured from its scene" only in the button's label under the pointer, and a small "p. 1" at the card's foot is the only mark on the paper. The Pages button answers it in its head, "8 scenes · 8 written", and each scene's heading says "5/8 pages · measured". A person has to open Pages to learn the film is written.
8. The Pages panel is the script, readable and typeable: the first Friday's text under its heading, a textbox a person can type into. The two stale notes the agent took off in its last minutes are still here, because this is the file it handed me a few minutes before that: a copy is a copy, and nothing says it is behind.
9. "Where do I type to change something?" — on the card, the headline and the change line are textboxes; the cast and place lines are buttons that open something; the scene's text is in Pages. "Does the agent see it?" Nothing on the screen says. The bar's Save, open, or sync project sheet is the nearest thing, and it is about files and the account, not about an agent.

**Making the five changes**

10. With the Pages panel open, a tap on a card's top-left corner did nothing I could see. The guide says the corner "asks what the card claims"; whatever it asks was not shown while the panel had the right half of the screen.
11. A tap on the man's place line landed on the bank card lying over it and opened the bank card's cast line instead: a list of the roster under "with", with "Not decided yet…" as the first choice. The wall the agent left cannot be worked on until it is tidied, and Organize is a button in the bar with nothing pointing at it. I pressed it.
12. Organize laid a row per beat and the run after it, and still left the bank card over the man's and the knife pier under the bank: the first run is six cards wide and the row did not make room for them at this width. "Tidy" did not tidy enough to work on. The "Not decided yet, about the film" list, opened earlier, stayed open through it, its three lines still printed over the top row; each line has a "Decided: strike" button, which is where a person closes a whole-film open.
13. Moving a card: the bank card moved when I dragged it by the blank paper under its lines, and the arrows followed. The knife pier would not move from anywhere I tried — its face is all lines and buttons, and a drag on the headline selected the words instead. "Drag the paper to move it" is true only where paper shows, and on a full card almost none does.
14. Deciding a whole-film open: the "Decided: strike" button on the line in the "Not decided yet, about the film" list. One tap; the count went from 3 to 2 and a DECIDED mark showed where the line had been. This is the one change so far that was one gesture and said what it did.
15. The three lines of that list print over the top row of cards and take the taps meant for them: a tap on the range's corner did nothing, because the list's second line lay across it. The list needs a sheet behind it, or to stand where cards do not.
16. The corner, on a card clear of the overlay, opens a picker of nine choices under two heads: Corner — fold it, leave it open, set it aside, another version of another card; Thread — start one here, end one here, put it on "the sign", "her husband's fish knife" is first seen here. Every claim a card can make, in one place, in words a person can read. Nothing on the card hints that the corner does this until it is tapped; the guide says so, the paper does not.
17. Cutting a scene: "Set it aside: not in the film" from the corner picker. The bank left the story at once — the readout went from 6 scenes to 5 and 5 3/8 pages to 4 5/8, the Pages head from 8 written to 7, the strip redrew — and the card itself went somewhere I could not see: it was not where it had been and not behind the panel I had open. Nothing said where a set-aside card goes. The reading's four questions did not change, though one of them, the man's unpaid card, would.
18. Writing a line into a scene: the Pages panel's text is a box a person can type in, and the line landed on the card's scene at once — but not where I meant it. I pressed the key that goes to the end of a document and typed; the words went in ahead of the scene's last sentence and its note, because the end of the box is not the end of the text as I read it. The panel gave no sign of where the caret was. The scene's measure stayed 5/8.
19. Striking a proposed turn: there was none to strike. The agent's proposals were all kept or struck in its own session, and the wall keeps no trace that turns were ever proposed. A person arriving after cannot tell a turn the writer chose from one the agent chose.
20. Does the agent see what I did? The wall changed under my hands and nothing on it said whether anyone else was told. The only presence mark is the account's, and I was not signed in.

**The agent reads the wall after**

21. An agent's `read_wall` on the same wall, after the five changes (through the folder door; the server process in that session was the one it started with, before the pages head, so its checks are fifteen and the left sign question did not show — the version is said so the rest is read fairly): the bank is listed under "set aside, not in the film" beside the alone pier; the acts line is gone from the open list; the written line is inside the first Friday's measure. Not one word says a person did any of it, when, or that anything changed since the agent last looked. The reading is of the wall as it is. "What did the person do" has no answer on the wall for an agent, exactly as "what did the agent do" had none for the person (4).
22. The reading and the screen disagree in one place: the reading counts "14 things left open" and the screen's list says "2" beside the logline — because the screen's count is the whole-film lines only, and the cards' opens are on the cards. Both are right and neither says which count it is.

---

## 1. What I did

Opened the wall the agent left, as a person, and tried to answer five questions from the screen alone; then tidied it, moved a card, decided a whole-film open, set a scene aside, wrote a line into a scene, and found no proposed turn to strike; then had an agent read the wall.

## 2. The friction log

Above, twenty-two entries.

## 3. What a person cannot answer from the screen

- What the agent did last, and what it is waiting on me for (4). The wall has no memory of the agent's session; its questions to me lived in a chat.
- Whether the film is written, without opening Pages (7).
- Whether the agent, or anyone, will see what I change (9, 20).
- Whether a turn was the writer's or the agent's (19).
- Where a card goes when it is set aside (17).

## 4. Gestures missing or hidden

- A way to see the whole wall clear: Organize did not un-overlap a six-card run at this width (1, 12), and a full card has no paper to drag by (13).
- The corner does everything a card can claim and shows nothing until tapped (16).
- The "Not decided yet" list prints over the cards and takes their taps (5, 15).
- The end of a scene's text in Pages is not where the end key goes (18).
- "Decided: strike" on a whole-film line is the one gesture that said what it did (14).

## 5. Where the screen and the reading disagree

- The counts of what is open: the screen's "· 2" is the film's lines, the reading's fourteen is everything (22).
- The reading lists set-aside cards; the screen loses one off the edge (17).
- Neither records who did what (4, 21).
