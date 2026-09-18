# Round fifteen — the report

Run 2026-09-17 (local, into the evening), through the published package at
0.1.19, on a project of two boards for the first time: "The Weighbridge",
two half-hour episodes, the treatment in `round-fifteen-treatment.md`. The
first attempt stopped at the door — the hand-wired `plotcoder-board` entry
had vanished from `~/.claude.json` and its backup, rewritten that afternoon —
so the wiring was put back and a second session started; the two entries the
first session logged (the on-ramp cannot tell "not wired" from "wired but
failed", and the guide is a long read for a session with no server) are not
in this log and are kept here in the head. The writer's answers and
directions were relayed from the session that wrote the treatment, one at a
time: the shim moved to open episode two, Rooney's driver into the last
scene, Dana's page across both episodes, Three acts beside episode one, the
re-test written, Final Draft out for both, the length, the rename, the
plants from both sides. Forty-five entries.

**Worked through the same evening, while the round ran**, in five pull
requests (#47 to #52): a scene moves to another board (**R57**, entry 16);
the sag's median is over runs that hold a card (10); `add_character` and
`create_group` name ids (7); `delete_note` names the fold that went (17);
`leave_question`, `ask_again` and every write's tail read the wall as
`read_wall` does, with the cast on other boards known (18, 21), and the clean
line says "of the project" (15); the on-ramp puts the calls and rules before
the doors, drops the re-read after `empty_account`, and says ids are
`list_board`'s (1, 3, 6); `read_character` reads a person's part across every
board with place, when and rank (22, 23); `list_structures` gives the beats in
prose (24); `compare_structure` names its estimates and what a short wall does
to the six-page window (26, 27); `write_scene` says "one eighth" and what the
estimate now means (29, 31); a series goes out as its project with an episode
line in every format, no app note on the title page, the Final Draft text
naming its file (32, 34, 36, 37, 42); `rename_project` moves the reply's head
line and says where the name shows (40, 41); `list_boards` totals the project
and the runtime line names its kinds (38, 39); `list_board` names the fold's
board (44). The guide gained: `create_note` takes `when` (2), which tools take
`ids` and which `noteIds` (8), a cold open is not a group (4), a role cues as
its role and reported speech becomes lines without inventing (28, 30), a leave
is the open board's (19), and that a series plant marks the planting end only
(5, 11). On the way, a bug of the file door's: a board file from before the
project file carried no board id, so writes never reached the project's copy
and `open_board` restored a stale board.

**Not fixed, on purpose or not yet:** the write tails carrying the wall's
questions mid-build (9) were built on round fourteen's word and stay;
`organize`'s "Nothing moved" after a rank change (20) and the frame around a
cold open (13) are things the agent cannot see, not things the app said
wrong; "half-hour" is a target, not a structure (25); the `[Unwritten]` mark
in exports (35) was decided in round thirteen; `path` refused by the
session's own permissions (33) is not the app's. **Left open for Robert,
with a mockup owed:** the receiving end of a series plant (43, 45, and 5 and
11 before them) — nothing on the card, in the reading or on the page of the
board a fold lands on says which scene pays it off, and the fold's check
passes on a board's name alone; and a reading of the project as a whole (14).

**This is a snapshot of version 0.1.19.** The numbered log below describes
the app as it was on the day, not as it is: most of what it names has since
been changed. Read it for what the app did to a stranger on two boards, and
for sections 3 to 5, which are about the shape of the surface and outlast
any one fix. Do not read it as current behaviour.

---

What follows is the agent's report, verbatim.

---

# Report

## 1. What I built and what you had me change

On a throwaway account with one project saved off and emptied, I built "The Weighbridge": two boards, "Gross Weight" and "Certified", thirty pages each, the series premise and each episode's logline verbatim from the treatment. Twenty-one cards in all, one per treatment paragraph, each with a headline and change line in the treatment's words, a place from the treatment's four, a day and time, and its cast. Six people in the roster, two of them by role; Tom Kerr in Dana's notes. Five turns marked on each episode, follows arrows in story order, one setup arrow for the second column, three folds marked as paying off on "Certified", two act groups per board with cold opens outside them, the four stated lengths set and the rest unsized.

You then had me move the shim from the end of episode one to the head of episode two and make it a scene there, leave the three empties, put Rooney's driver into the last scene and note that he has left Rooney, read Dana's page across both episodes, set Three acts beside episode one without laying it, write the four o'clock re-test as pages, write two Final Draft files to a folder, report the length, rename the project to "Gross Weight", and report the plants. The files are in the out folder as The Weighbridge - Gross Weight.fdx and The Weighbridge - Certified.fdx, written before the rename.

## 2. The friction log, complete

**The way in**

1. The on-ramp's "Call these first" sits below a "Doors" section it tells me to skip, and the guide repeats the wiring before its own four-call line. Two pages of installation stood between me and the first call.
2. The guide's `create_note` entry lists its optional fields without `when`; the `set_when` entry says `create_note` takes `when` too. One tool's inputs stated in two places that disagree.
3. The on-ramp wants `read_wall` and `list_reminders` again after `new_project`, `open_project`, `open_board` and `empty_account`. On an empty account those re-reads return nothing new. I made the two reads three times before placing a card.
4. The guide says acts become groups and a group needs two or more cards, and says nothing about a cold open. Episode one's cold open is one card and cannot be grouped. I had to ask.
5. The guide says a series plant is marked with `later` and "the card then says pays off in Episode two", and nothing about whether the paying-off card on the other board is marked. Confirmed later: it is not (11, 43).
6. The four first calls do not include `list_board`, the only read that gives ids. The prescribed reading gives nothing to act with.

**The build**

7. `add_character` and `create_group` replies carry no id, though the guide says ids come from the reply of the tool that made the thing. I cast by name and got person and group ids from `list_board` later.
8. `set_plant` takes `ids`; `create_group`, `cast` and `add_to_group` take `noteIds`. The guide names neither. Three calls failed on "expected array, received undefined at ids" before the error told me the name.
9. Every write's reply carries the wall's questions as they change mid-build: [uncast] for each person added before a card existed, [unmarked] until the first beat, [unlinked] counting down with each arrow, a [sag] with a median from a half-built wall. Over forty-odd calls none of it could be acted on until the wall was whole.
10. The reading calls a one-page run "sagging" against a median run of one eighth of a page. On an eleven-card wall where most runs are empty the median is an eighth, so one ordinary scene between two turns is a sag. The question is about the wall's size, not the story.
11. `set_plant` with `later` marks the planting end only. "Certified" held the payoffs of three episode-one plants and its reading said "no arrow is marked as a setup". No way to tell the second board which card pays off which fold.
12. Episode two's cold open and "The ledger is gone" are both at the weighbridge, day fourteen, morning. I gave the cold open "nine in the morning", stated in the treatment, to keep two headings from reading identical. The app said nothing either way, so I do not know whether it would have.
13. `organize` put the cold open card and the first three Act one cards in one row before the first beat. Whether the Act one frame is drawn around the cold open card too, I cannot see and no reply says.

**The reading**

14. `read_wall` excludes the cast and the places. Reading one board fully is two calls; reading a two-board project is five, with an `open_board` between. There is no reading of the project as a whole.
15. The checks line says "nobody in the cast on no card" on "Certified" while Rooney's driver was on none of its cards. Right by the guide's other-boards rule, but it reads as false until you know the rule.

**Your directions**

16. No tool moves a card between boards, and nothing says so. `move_scene` answered "No card with id … Call list_board." The move was a delete and a recreate: new id, arrows redrawn by hand, and undo on either board cannot bring the old card back to the other.
17. `delete_note`'s reply named the arrow it took and the group it left, but not the card's folded corner or its "pays off later, on Certified" mark, which went silently.
18. `leave_question`'s reply said the wall "still asks" an [uncast] question, Rooney's driver on "Certified" and the inspector on "Gross Weight", while `read_wall` on the same board seconds before and after said "nobody in the cast on no card". Two replies about one wall disagree about what it asks.
19. A leave is per board and the reply does not say so. The guide's "leave several at once with `questions`" could not cover two empties on two boards.
20. `set_rank`'s reply nudged me to `organize`, and `organize` answered "Nothing moved." Either the shim's row is right for a scene, or a beat row still stands for a card that is no longer a beat. Neither reply says which.
21. `cast`'s reply reported an [uncast] question going away that `read_wall` never showed. Continuing 18: the write replies count a question the reading treats as clean.
22. `read_character` reads only the open board. Its reply says "on 10 cards, in story order" with no word that this is one board's count, so half her part reads as her whole part. Reading her across two episodes took an `open_board` and a second read, joined by hand.
23. `read_character` gives headlines only. Places, times, cast and ranks in her reading came from `list_board`, not from her page.
24. `list_structures` says "each beat's name, prompt and place in the story are in the JSON". The JSON tail is off on this door, so a structure's beats cannot be read before laying or comparing it.
25. Nothing in the app names a structure by length. "The half-hour structure" mapped onto no tool or name, so I had to ask which of five you meant.
26. `compare_structure` pairs by distance, within six pages, in order. On a wall estimated at a third of its target, every turn lands within six pages of an early structure beat, so "every beat of the wall answers one of the structure's" is true by arithmetic. Your question, which turns it does not account for, cannot come back with anything but "none" while the wall is this short.
27. The comparison's page numbers come from unsized cards read as a page each and the reply never says "estimate", where `read_wall` says it on every line.
28. The treatment is reported speech and a page needs direct speech, so "nothing invented" could not be met to the letter. The words are the treatment's, the mouths are mine. Nothing in the guide says how to write pages from a card without inventing.
29. After `write_scene` the card holds two lengths, a measure of three eighths and an estimate of three pages, and the reply says the estimate "underneath is untouched". Writing the treatment's longest scene shrank the wall by more than two pages, and the reply does not say what your stated three pages now means to the app.
30. The cast record is "The inspector" and cues match the cast by name, so the cue had to print as THE INSPECTOR. A role used as a name becomes a cue with an article in it. The guide says to name unnamed people by role and nothing about how that prints.
31. The `write_scene` reply says the measure is "rounded to the nearest eighth and never below one". One eighth or one page? It reads two ways.
32. The guide says a named project is the title and the board's name follows when there are several boards. The title pages have it the other way: "Certified", then "An episode of The Weighbridge". The board is the title and the project is the credit.
33. `export_fdx` with a `path` was refused by this session's own permission layer, not the app. I called it without a path and wrote the files myself. The on-ramp's "pass path to write a file" was not available to me here.
34. With no path the app returns the file's contents and no file name, and the guide does not say what a file should be called. The names on the two files are mine.
35. No way to leave unwritten scenes out of an export or print them as anything but an Action paragraph beginning "[Unwritten]". For an agency that is a synopsis set as action in nineteen of twenty scenes.
36. The title page carries an app note, "Scene numbers follow the wall's order and are not locked", on a file for an agency. Nothing lets me leave it off.
37. Two files for one series and no project-level export: the premise and the episode order live in neither file. A reader of one file sees "An episode of The Weighbridge" and nothing about which.
38. `list_boards` gives a runtime per board and no total. A series' length is the agent's arithmetic, and nothing reports the project against its combined target.
39. The runtime lines fold three kinds of number into one "about": the default page for an unsized card, a length you set, and a measure from written lines. Telling them apart took the per-card flags from `list_board` and the `write_scene` reply.
40. After `rename_project`, every reply's first line still says working "The Weighbridge" while the body of the same reply says "Gross Weight". The line the on-ramp told me to trust for which project I am on is stale.
41. `rename_project` answers "Project renamed" and nothing else. Finding where the name shows took `list_boards`, `read_pages` on each board and a `read_wall`, and the missing credit line only appeared by comparing two pages readings.
42. With a board named the same as its project, the pages print one name and no episode line, so the guide's rule and what the app does differ, and episode one's title page now says less than episode two's.
43. The cross-board plant is one-way. `later` names a board and the reading repeats it; the receiving board carries nothing, on the card, in the reading or on the page. "Which scene pays it off" could not be answered from the wall for two of four folds.
44. `list_board` prints a series fold as "plants → pays off later" with no board named; `read_wall` on the same board says "on 'Certified'". One fold, two answers by which read you make.
45. Both checks lines say "no fold without a payoff" for a fold whose payoff is a board name. A fold pointed at a board with no such scene would pass the same check.

## 3. What the on-ramp told me that I did not need, and what it did not tell me that I did

Not needed: all of "Doors", the config blocks, the shell door, the hosted door, `PLOTCODER_ROOT`, the sample wall with Maya and Tom, the folder-not-scratch rule, and the guide's repeat of all of it. About half of both documents is wiring for a server that was already in front of me, and the on-ramp says so in its first paragraph and then prints it anyway. The three-times re-read of `read_wall` and `list_reminders` was also more than the work needed.

Not told, and worked out myself: that `list_board` is where ids come from and must be a fifth first call; the parameter names `ids` versus `noteIds`; that `add_character` and `create_group` return no id; that a cold open is not a group and a one-card cold open cannot be; that no tool moves a card between boards; that `read_character`, `read_pages`, `export_fdx` and every reading are per board and the reply does not say so; that a cross-board fold is marked at one end only; that the first line of every reply goes stale after a rename; that cues match the cast by exact name, article included; that a written scene keeps its estimate underneath and the runtime drops to the measure; that the title page prints the board over the project and drops the episode line when the names coincide; that "half-hour" is a target and not a structure; and that `compare_structure` matches by proximity so "unaccounted for" cannot be answered on a short wall.

## 4. What you asked for that I never found a way to do, or did some other way

- **Moving the shim to episode two.** No tool does it. Done as delete and recreate, with a new id and the arrows and fold redone by hand (16).
- **Dana's page across both episodes.** No single read. Two reads with a board switch, joined by me, with the scene details taken from two `list_board` outputs rather than her page (22, 23).
- **The half-hour structure.** No such structure. Stopped and asked; used Three acts at the thirty-page scale on your word (25).
- **Which turns the structure does not account for.** The comparison cannot say so on a wall this short; I reported its "none" and why it is arithmetic (26).
- **Pages with nothing invented.** Not possible to the letter; three lines of reported speech became direct speech and I said which (28).
- **Files in a folder of my own, via the app.** The app's `path` was refused by my session's permissions; I took the text back and wrote the files myself, under names I chose (33, 34).
- **The series' length.** No project total from the app; added by hand (38).
- **Which scene pays off each fold, from Certified's side.** The wall does not hold it; answered from the treatment for two of four (43).

## 5. What I was never sure had landed

- **Cast on Certified.** `read_wall` said clean and `leave_question` said an [uncast] question was still being asked, on the same board, seconds apart. I do not know which was right at that moment (18, 21).
- **The layout after the shim became a scene.** `organize` said "Nothing moved"; whether a beat row still stands for it, no reply says (20).
- **The Act one frame on Gross Weight.** Whether the cold open card sits inside it on the wall; I cannot see the wall (13).
- **The shim's old fold and "later" mark.** They went with the deleted card without being named in the reply; I assume they are gone and not lingering somewhere (17).
- **The two identical morning headings on Certified.** Whether the app would have raised a duplicate without "nine in the morning"; it raised nothing, and I do not know if that is because of my when or because it never would (12).
- **The title pages after the rename.** Read from `read_pages`, not from a fresh export. The files on disk are under the old name and I did not re-export (41).
- **Which project the server thinks it is working.** Every first line still says "The Weighbridge" after the rename. Every body says "Gross Weight". I trusted the bodies (40).
- **The stated three pages on the re-test.** The reply says the estimate is untouched underneath the measure; what that means for the wall, the comparison or an export later, no reply said (29).
