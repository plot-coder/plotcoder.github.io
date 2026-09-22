# Round twenty-four — the report

Run 2026-09-21, evening, through the desktop connector **and nothing else**,
to `https://mcp.plotcoder.com` at **0.1.50**, and the on-ramp as deployed,
on a third page of a writer's notes — `round-twenty-four-idea.md`,
"Doyle's". The writer's answers and the directions were relayed from the
session that cued the round, as cross-session messages, from the script in
`blind-runs/prompt.md`. Nineteen questions answered; then eighteen
directions: propose the turns, keep two and strike two, the order as a list,
"put it back as it was", "is there anything you are waiting on me for?",
everything undecided, Priya at the funeral, the sign first seen on the first
Friday (and the sign card taken off), the pier decided with the other kept,
the carried arrow dropped and the knife thread tied, a scene added, undo
previewed, undone and "bring it back", the tidy and where the bank scene is,
the first Friday written and a line inserted, how long and what is missing,
the script, a copy of the project, who has the wall open, stop.
**Fifty-four entries.**

**The way in, which this round was cued to measure.** The connector was not
enabled for the fresh session at first (1 to 3: enabled in the cueing
session instead, then in the fresh session's own composer). Once on, the
agent was in from its next message with every tool — **ninety-five names
and nothing else: the server's `instructions`, which X1 put on the
handshake, did not reach the agent** (5). "Two other connectors in this
session ship their own usage instructions with the connection. This one
ships none." The door does send them (checked by `initialize` the same day);
whether the desktop app drops them for a custom connector, or the
connector's registration lost them, is the first thing to find out. The
connector's name in the session was `plot_coder`, not PlotCoder (4). It
then read `llms.txt` in full (about a thousand words) and `day-one.md` in
full (37 KB), not `guide.md` or `wiring.md` — and later, for "write it",
fetched the whole guide (58 KB) with no anchor to the eighty lines it
needed (45). The two disagree on the first calls (6).

**What the round was for, answered.** *"Half the town is in that room and I
could not tell you who":* the cast's own open (R69), unprompted, and later
one name decided with the room still open, the reply saying so. Held well.
*"It is about the whole film":* open lines under the logline (R70) for now
or 1987 and for the acts; and one improvised there, Tommy Reardon, an unseen
person who belongs to nobody yet (13). *"Propose them and I will strike":*
four proposals (R71), read from the change lines the writer gave and none
on the cards whose change is open; keep and strike went through `set_rank`;
the strike's reply does not say a proposal came off (25), and a proposal
cannot say "this card cannot be read either way" (24). *Born as a version,
born set aside:* both, in one call each, at the build. *The counting tail
after the first reading of the agent's own wall:* the agent made the three
reads of its new project before it built, as the on-ramp now says, so no
tail counted; not quoted. *An undo through this door:* reached for
unprompted on "put it back as it was" — previewed first, then one undo took
the whole reorder back and named every arrow (30); on request the preview
said what it would take back, taking nothing (38); the undo did it (39,
40); and "bring it back" met "Nothing of mine to redo", so the card was
remade by hand as a new id (41, 42).

**Beside those.** The reorder said a version behind went with its card; it
also drew five arrows of six and said nothing of the one it refused because
a setup arrow held that direction (26, 27), and the unplaced card dropped
into the hole (28). "All of it, undecided" listed twenty-seven things and
nothing twice, but from the full reading, since the short read only counts
them (31). The tidy put the bank card on a row beneath the story and left
the other aside card where the app had put it, stating the rule and the
exception in one breath (43). An open title prints UNTITLED (49). The
project came as a link, the agent fetched it and the checksum matched (53,
54). "How long" said one number first (N5), with a wording bug on the runs
line (48).

**Material, for the working list.** A thread through a version behind
drops the card silently (17). `choose_version` carries the front card's
setup arrow onto the version that steps forward, so a plant claims a payoff
in the wrong version and nothing asks (35). `set_order` skips an arrow a
setup arrow holds and does not say so (26). The delete reply prints "the
version behind the pier went with it" for an unrelated card (33). A card
born set aside quiets the cast check, and one reply says both "on no card"
and "nobody on no card" (16, 22). An unwired card is seated by the tidy and
counted in the runs (21, 28, 34). The default `export_project` is kept on
the account that `empty_account` then clears (10). "at" is prefixed to a
place that starts with a preposition (19). The pages print an open change
line as bare `[Unwritten]`, the writer's words for why lost (50). Two
exports both call themselves the script (52). And one thing the notes said
that the wall had no home for, and the agent did not say until the end:
"Nobody in this film says the word sell to her face until the very end."

**What became of it (2026-09-21, the same night):** worked in
`docs/to-do-round-twenty-four.md` and built on Robert's "come up with a good
plan and then execute": a thread may run through a version behind or a card
set aside (17); one arrow per kind per pair, and `set_order` names every
arrow (26, 27, 30); an unlinked card is last in the order, in no run and not
laid by the tidy, R73 (21, 28, 34); the version line on a delete (33); the
carry named on `choose_version` (35); an open change line in the pages (50);
and the replies and guide words of N4 to N15 (5's words, 7, 8, 10, 11, 13,
14, 15, 18, 19, 22, 23, 25, 32, 36, 38 to 43, 45 to 48, 51, 52, 54). Left:
the cold-start test of the connector's instructions (5), Robert's hand;
29, 37, 44, 47 on purpose; 1 to 4, 12, 20, 24, 31, 49, 53 decided against,
with the reasons in the list. 713 unit tests, the e2e suite ten of ten, not
yet released.

The report as it was handed over, verbatim:

---

# Report

## 1. What I built and what you then had me change

I started a fresh project on the emptied test account, title open in your three candidates, target "a feature". I built one board from your notes: seven scenes wired in your order, a sign card unwired, a bank scene born set aside, two versions of the pier with "alone, the card" in front, five people with ages and jobs in notes and your open questions on Mairead's and Declan's pages, the man's card planted and paid off on the pier, threads for the sign and the fish knife, logline and premise open, and three open lines about the whole film. Nothing marked as a turn.

You then had me propose the turns, keep the first Friday and the last night, reorder the story and undo it when the order collided with the plant arrow, put Priya at the funeral tea, tie the sign thread to the first Friday and delete the sign card, choose the pier with Priya and keep the other, drop the man's card arrow and leave its payoff open, tie the fish knife's end to the pier and leave its start, add Declan on the phone between the range and the funeral, undo it and remake it, tidy the wall, write the first Friday and add a line to it, export the script and the project, and ask who was on the wall.

## 2. The friction log

**The way in**

1. The brief said a connector named PlotCoder would be in front of me. It was not in the session at all, and the connector status tool could not distinguish never-added from added-but-off from failed.
2. The account-level listing said plot_coder was installed and connected; the session-level listing could not see it, and the toggle refused it by name and by id without saying why.
3. A teammate session said the connector was on. It was not, and I had no way to check but the same status call.
4. The connector's name is plot_coder, not PlotCoder. The on-ramp anticipates this but it cost a round of searching.
5. The connector carries no instructions of its own. Every other connector in the session does. Without the URL in your brief I would have had ninety-five tool names and nothing else.
6. The on-ramp and the day-one guide disagree on the first calls: six in a fixed order versus five "in any order" without list_projects. The rule that "the guide wins" names guide.md, not day-one.md.
7. The list_projects description talks about environment variables I do not have. Whether the hosted connector counts as "the account door" was not knowable until a reply said "as test@test.com".
8. The empty wall's reading listed "a beat is marked" under checked and clean, four lines after "beats in wall order: (none marked)".
9. The on-ramp says to read the day-one guide before the first call and gives no idea of its size: 37 KB, no table of contents, nothing marked skippable.
10. The default export_project keeps the file on the account. empty_account deletes the account's files. The export the on-ramp tells you to make before emptying is deleted by the emptying unless you pass inline and write it yourself. Neither description says so.

**The asking**

11. Two definitions of "premise": list_words says "what is true before a film starts", the treatment question says "what the series is about". For a single film I could not tell if it was wanted.
12. Mairead's "does not know, or knows and will not say" is about a person and about the whole film. The guide gives one home for each and no rule for both.
13. Tommy Reardon is dead, unseen, and has a scene named for him. The guide puts an unseen person in the notes of "the person they matter to" and the notes do not say who. Nowhere to put him until you answered, and you did not know either.
14. The sign has a known end and an undecided outcome, lit or down. A thread can leave open where a thing comes out but not what happens there.

**The build**

15. Creating the unwired sign card, the reply said "Placed after the last card in story order" and, in the same reply, asked what comes before and after it.
16. A card born set aside still counts for the cast. The bank manager, in no scene of the film, stopped being asked about because of a card not in the film.
17. create_thread through the pier-with-Priya card, a version behind, dropped the card silently: "no card yet", no reason. The fish knife's one known end could not be held.
18. For the sign you knew where it ends and not where it starts. endOpen means "I do not know where it comes out", which is not what you said. I set it anyway, misdescribing one end.
19. "at upstairs at the Harbour Bar": the reply prefixes "at" to any place phrase.
20. Three writes in one round produced tails saying "now asks 8" and then "now asks 6". A tail's count is true only for the instant that call landed.

**The reading**

21. organize placed the unwired sign card in the middle of the top row and list_board then read it as fourth in story order. An undecided position became a decided one.
22. One reply said "The bank manager (on no card)" in its cast line and "nobody in the cast on no card of the project" under checked and clean.
23. The workflow says "mark none yet" and "the reading asks once for a beat until you do". It asks on every reading. Whether "once" meant one question or one time, I could not tell.

**My directions**

24. A proposal can only say "this is a turn". The four cards whose change lines were open could not be read either way, and on the wall they look the same as cards I read and passed over.
25. The strike reply says "2 card(s) are now scene" and nothing about them having been proposed. A strike and a no-op read the same.
26. set_order reported the full seven-card chain and "5 drawn" for a chain that needs six, without naming the missing arrow or why. It was the man's card to the pier, refused because a setup arrow already ran that way. Neither the reply nor the reading asked about the hole.
27. The wall cannot express a plant that immediately precedes its own payoff. Nothing warned that an order you gave would collide with a setup arrow you had asked for.
28. Because of the hole, the unwired sign card moved in story order again. Every arrow change re-seated a card you never placed.
29. A card's when is free text never read against the order. "The night after the funeral" sat before the funeral and nothing noticed.
30. The undo reply named every arrow it restored and removed. The set_order reply that made the change named none and miscounted.
31. The guide says "what is still open?" is the short read in one call. The short read gives the questions and only a count of the things you left open, not the things.
32. The tail said "questions unchanged (5)" after the sign thread's question changed from both ends open to one. The count did not move so the tail called it unchanged.
33. The delete reply for the sign card said "the version behind 'The pier, alone: the card' went with it". The deleted card had nothing to do with the pier. A stock line printed where nothing of the kind happened.
34. Deleting the unwired sign card dropped the run between the beats from five cards to four. The card you never placed had been counted in the run the whole time.
35. choose_version carried the alone version's setup arrow onto the knife version. The reply said "with its arrows" and did not name them. The man's card claimed a payoff in the wrong version and no reading would ever ask, because the fold was paid.
36. Two leaves in one call: one landed, one was refused, in the same reply. The refused one failed because a thread's question lists two ids and I passed one. The refusal did not say which ids it wanted.
37. "outside Doyle's" is a new place beside "Doyle's". The app relates no two phrases, and the guide's "one location's spots are one place" gives no way to say a phrase is a spot of another.
38. undo preview names only the top of the stack. "10 steps" is the size of a fixed stack, not the session's history.
39. After an undo the count reads "9 more", counting down as I undo and not up as I write, worded as if it were history.
40. Undo's reply names cards and arrows but not the story's shape. The create it reversed had reported the run growing; the undo did not report it shrinking.
41. No redo through this door. "Bring it back" is remaking by hand, and the result is a new card with a new id. The redo description says so only in capitals at the top of a tool that otherwise describes what it does elsewhere.
42. Redo's reply, "Nothing of mine to redo", reads as an empty stack, not as unavailable. Description and reply tell different stories.
43. The tidy moved one set-aside card and left the other, and its reply stated both a rule that set-aside cards are not moved and an exception, without saying what decides. Neither card was placed by you.
44. The row wrap is five wide whatever the run, so a six-card run reads as a row of five and a row of one, and the lone pier card looks like a break that is not there.
45. For "write it" the on-ramp and day-one guide send me to the whole guide, 58 KB, with no anchor. The part I needed was eighty lines and the tool's own description carried most of it.
46. Writing one sketch lowered the runtime from about 8 to about 7 1/8 because a ten-line scene measures an eighth while an unwritten card reads as a page. The front-line figure mixes one measure with seven guesses and does not say which is which.
47. In the pages, the morning after prints "PLACE NOT DECIDED: THE MORNING AFTER - THE MORNING AFTER THE LAST NIGHT". Nearly the same words twice on one line.
48. "the 2 beats hold about 1 2/8 pages between them" is the beats' own pages added together, not the pages between them. "Between them" says the opposite of what it means.
49. The script is titled UNTITLED. An open title, with your three candidates beside it, exports as no title.
50. Scenes with open change lines print "[Unwritten]" and nothing else. Your words for why do not print, so on the page an open change line and a forgotten one look the same.
51. The morning after's wrapped heading prints its scene number in both margins of both lines.
52. "The script" maps to two tools whose descriptions each call themselves the script. I picked plain text and had to say so.
53. "A copy on my own machine" is not something the hosted door does. It keeps the file on the account and returns a signed link into its storage provider, good for an hour, and says "fetch it to keep a copy". The fetch is outside the app's tools.
54. The export counts the board as ten cards. The wall counts eight. The export does not say it is counting the set-aside ones.

## 3. What the on-ramp told me that I did not need, and what it did not tell me that I did

**Did not need.** The "No tools in front of you?" section and the wiring page. The sample wall of Maya, Tom and the letter, which is a folder thing and never appeared on an account. The PLOTCODER_JSON environment flag. The shell door. The rules on claim_account and delete_account. The presence tail's variations, since the hosted door answers before presence arrives anyway. Most of the day-one guide's series material, board-to-board payoffs and `later`, for a one-board film.

**Needed and not told.** That the default export is destroyed by the empty_account it is meant to guard against. That a follows arrow and a setup arrow cannot share a direction, so a plant cannot immediately precede its payoff. That a thread cannot run through a version behind. That choose_version carries setup arrows across. That there is no redo here. That an unwired card gets a story position from its wall position and is counted in runs. That the short read does not list open fields. That leave_question wants every id the question lists, including a thread's card. That "the script" is two tools. That the connector ships no instructions and its name is not PlotCoder.

**Worked out myself.** That the hosted connector is "the account door". That verifying a write means list_board after it, because tails miscount, say "unchanged" when a question changed shape, and print stock lines that do not apply. That the way to a file on disk is inline JSON or curl against a signed URL, checked against the checksum. That the sixteen treatment questions had to be re-asked against your notes one by one, since none of them fits notes that hold two versions and a cut scene.

## 4. What you asked for that I never found a way to do, or did another way

- **The fish knife's end on the pier-with-Priya version.** Impossible while that card was behind the other. It became possible only when you chose that version.
- **The man's card immediately before the pier.** Your reorder could not be drawn, because the plant arrow held that direction. You had me undo it.
- **Bring it back.** No redo. I remade the card by hand, with a new id.
- **A copy on your machine.** The app gives a link into its storage; I fetched it with a shell outside the app and checked the checksum.
- **Whether the sign ends lit or down.** No home on the wall. It lives in this transcript and nowhere else.
- **Tommy Reardon.** No page to put him on. I held him as a line about the whole film, which is my rendering, not the guide's.
- **"Outside the shop" as part of Doyle's.** The app cannot relate two place phrases. It is a second place on the wall.
- **"Seen early, not decided where."** An unwired card, which the wall seated for me twice. You then deleted it and the sign lives as a thread from the first Friday.
- **"Mark none yet."** Held, but the wall asked for a beat on every reading until you kept two.

## 5. What I was never sure had landed

- **The reorder.** The reply claimed a full chain. I trusted it until I read the records and found the missing arrow. Had you not asked for undo, the hole would have stayed.
- **The strikes.** The reply did not distinguish a struck proposal from a card that was always a scene.
- **The runs after undo.** The undo reply said nothing about runs. I inferred the run had shrunk back and said so as an inference.
- **The set-aside cards after tidy.** The reply said both moved and not moved. I read the positions to find which.
- **The question counts in parallel tails.** Meaningless when calls overlap; I re-read after.
- **The write of scene text.** The reply's length and camera check were clear. Whether the text on the card was exactly what I sent, I confirmed only by the export.
- **The leave that was refused.** The batch was half-applied; I confirmed by the second reply's "left, for now: 2".

## 6. What the notes left open that the wall could not hold, and what I did with it

- **Now, or 1987.** Held as an open line under the logline, in your words. Held well.
- **Acts.** Same, "I have not decided how it divides".
- **Declan, has he signed.** Held on his page as open. Held well.
- **Mairead, knows or not.** Held on her page. You chose the person, not the film. Held.
- **Tommy Reardon.** The wall has no place for an unseen person who belongs to nobody yet. Held as an open line about the film, my improvisation.
- **The sign's outcome, lit or down.** Not holdable. Told you, twice.
- **The sign's far end, which card.** Held as an open thread end, with the mismatch in entry 18. You never gave me a reason to leave the question, so it stands.
- **The sign seen early, where.** A card the wall kept seating for me. Deleted on your word; now the thread starts on the first Friday.
- **The pier two ways.** Held as versions, alone in front. You chose Priya and the knife, alone kept aside. Held well, except that the plant arrow crossed over and had to be dropped by hand.
- **The man's card, where it comes back.** Unpaid and left, in your words. Held.
- **The fish knife, first seen.** Left, in your words. Held.
- **Half the town.** Held as your words beside the names. Held well.
- **The bank scene, cut and kept.** Set aside. Held well, except that it quiets the cast check for the bank manager.
- **"Nobody in this film says the word sell to her face until the very end."** Not on the wall anywhere. You left the premise open, and this sentence from your first paragraph went nowhere. The premise is where the guide would put a rule the whole film keeps. It is the one thing in your notes I had no card, field, line or page for and did not tell you about until now.
