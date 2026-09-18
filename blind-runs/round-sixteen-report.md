# Round sixteen — the report

Run 2026-09-17, late, into 2026-09-18, through the published package at
0.1.21 — the release carrying round fifteen's fixes, R57 and R58 — on the
same two-episode treatment as round fifteen, `round-fifteen-treatment.md`,
so the walls are comparable. The wiring held this time (the prompt's first
step checks it). The writer said "go on" before the six cast questions were
answered; the answers were relayed from the session that wrote the
treatment a minute later, as were the directions, one at a time: the shim
moved to open episode two, the letter's payoff moved from the fold's own
side, Dana's page, the re-test written and a blue revision on its last line,
episode one's numbers locked and a scene added after the funeral, Final
Draft out for both, the lengths, and an undo on episode one. Forty-eight
entries.

**What the round was for, answered.** The agent found the tools round
fifteen lacked without being told: the cross-board move landed as one call
(entry 22 is about its wording, not its absence), and all three folds were
claimed on the other board during the build — with `set_payoff` from the
receiving side, then `set_plant` with `at` from the fold's side on
direction — so both boards read their payoffs (19, 26, 27 are about the
words). Dana's page came in one call (28, 29 are about its shape). The
series went out as two files named by the app with the project as the
title and an episode line (38 to 42 are about descriptions).

**Fixed the same night, while the round ran**, in pull requests #59 to #64,
forty-one of the forty-eight: five first calls on the on-ramp and the
first-line rule's exception (1, 3); the workflow's tools line (8); a left
kind bracketed on the checks line and a board told apart from a project of
the same name (6, 7); the guide's typo and requirement number (4, 5); every
reply ending once, gone questions named, add_character's tail at its end,
create_note saying where every card landed, new_board's hint reading as one,
cast naming its cards and the open board, set_payoff labelling its change
note with the fold's board, the setups header above payoffs from other
boards, the cast line counting this board and the others apart (10 to 13,
15 to 18, 20, 21); the cross-board move saying what it dropped and drew and
that the fold came (22 to 24); set_plant saying what a claim replaced and
running its sentence the right way (26, 27); read_character opening with
its door and a scene a line (28, 29); the cues reported against the cast by
the whole name, a moved line count explained, the changed lines starred in
read_pages (30 to 32); lock_numbers naming its numbers and the letter rule,
move_scene saying a locked scene's letter after a move, **create_note with
`after` and `before`** so a scene added between two is one call and one
number (34 to 36); page_count paginating an unwritten board (37); export
descriptions telling the truth about locked numbers, the path, the title
page and the file's name (38, 39, 41, 42); pages per kind on the runtime
line and a written card's kept estimate shown (43, 44); undo naming the
arrows it put back and took away, the locked letter after it, and whose
trail it counts (45 to 47).

**Not fixed, on purpose or not yet:** the guide's length (2) is the guide;
the spot within a place (9) is R37's rule, one place per scene; the
[unlinked] churn while a chain is drawn (14) is the write tail round
fourteen asked for; two tools for one claim (19) stay, each named for the
side it is called from, and the guide now says they write one record;
set_rank's tidy hint (25) and page_count against list_board (33) say what
they say; the revision's star in the Final Draft file (40) is where Final
Draft looks; an unlinked card read by its position (48) is R56 — arrows
where they exist, position otherwise.

**This is a snapshot of version 0.1.21.** The numbered log below describes
the app as it was on the night, not as it is: most of what it names has
since been changed. Read it for what the app did to a stranger on two boards
with round fifteen's fixes in hand, and for sections 3 to 5, which are
about the shape of the surface and outlast any one fix. Do not read it as
current behaviour.

---

What follows is the agent's report, verbatim.

---

# The Weighbridge on PlotCoder — the report

## 1. What I built and what you had me change

I started the project "The Weighbridge" on the account, 30-page target, premise set verbatim, two boards in order: "Gross Weight" and "Certified", each with its question verbatim. One cast of six with ages, jobs and Tom Kerr in notes and nothing else on any page. Episode one went up as eleven cards, five turns, a cold open outside the acts and two act groups, one same-board setup arrow for the second column, three folded cards claiming their payoffs on episode two. Episode two went up as nine cards, five turns, a two-card cold open and two act groups, the three payoffs claimed from its side. Lengths as the treatment gave them, the rest unsized. Everything wired with follows arrows and tidied.

You then had me: cast the six open questions as another session answered them; move the shim scene to open episode two as a scene, which left episode one on four turns ending on "Bríd says the plate reads light"; re-point the letter's payoff at "The plate fails"; read Dana's page; write the re-test, start a blue revision and change the inspector's last line; lock episode one's numbers and add a scene after the funeral, which came out 3A; export both episodes as Final Draft to a folder of mine; give the lengths; and finally undo the last change on "Gross Weight".

**The last direction, exactly.** The last change on "Gross Weight" was the move of the new scene to after the funeral. undo's reply: "Undid move_scene 'Dana and Oisín walk the plate for the first time…' … 1 arrow(s) gone; groups as they were: 'Act one' (5 cards). 49 more of mine can be undone." What came back: the card is again last in story order, eleventh, with no arrow in or out, outside both acts, sitting on row 5 beside "Bríd says the plate reads light" at its old position; the arrows funeral→ledger is back and the two the move drew are gone, ten arrows in all; Act one holds five again. The board now: four beats, seven scenes, about 11¼ pages of 30, and under the lock the numbers are 1 to 10 on the original scenes in order and **10A** on the new card, not 3A. The wall asks two questions: the truck-to-offer pair back to back, and the new card unlinked.

## 2. The friction log

**The way in**

1. The on-ramp's "Call these first" lists four calls, then its prose adds list_board as "your fifth call before you touch anything". One instruction, two numbers.
2. The on-ramp says to read the guide once before the first call. It is 520 lines and overflowed my shell tool's output twice. Partly my harness; the on-ramp's shape made it a cost.
3. "Every reply's first line names the project it read." list_words and list_workflows say "no project was read". Consistent once you find the later sentence carving them out, but the rule as first stated is not the rule.
4. Guide, Cast section: "(one cast, one page, R51)". A requirement number a reader with only the on-ramp cannot follow.
5. Guide, move_scene: "Within a board, it It rewires". A typo in the paragraph I needed most.
6. read_wall on the account I found: `working "Gross Weight"` then `board: "Gross Weight" — 2 boards in "Gross Weight"`. When a project and a board share a name the reply's words do not tell them apart.
7. read_wall's closing line: `left by the writer, not clean: empty`. "empty" is a kind name and reads as "the list is empty". The same line packs `asking 2 questions of 1 kind: unpaid ×2, 1 left by the writer`.
8. list_workflows, break-a-treatment: the tools line names nineteen tools, but the questions under it land in set_logline, set_premise, set_when and rename_board, none on that line.
9. list_board: "each phrase is its own place, and the app relates none of them". The office, the plate and underneath had to share one phrase with the spot carried in the headline.

**The build**

10. Every add_character reply ends `…Where do they come in?).; every board of the project casts from it.` Mangled punctuation on all six.
11. Every create_note reply ends `pages..` and every create_arrow reply that reports questions ends `?)..`.
12. First create_note reply: `asks 6 questions (gone: [uncast] [uncast]) (new: [unmarked] … [unpaid] …)`. Two kinds gone with no names, the count up though two went.
13. Only the first create_note reply says where the card landed. The other nineteen say nothing.
14. Drawing a chain of follows arrows, the wall raised [unlinked] on the fifth arrow for cards I had not reached, then on every arrow after with one fewer, as `(gone: [unlinked]) (new: [unlinked] …)`. I stopped to check nothing had gone wrong.
15. new_board's reply: `open_board "1" comes back`. I first read it as a statement about board 1, not a hint on how to return.
16. set_payoff's reply: `the wall now asks 4 questions (gone: [unpaid])` then `This board is open again`. The count is the other board's; the sentence does not say which.
17. read_wall on Certified: `setups and payoffs: (no arrow is marked as a setup)` followed by three payoff lines. The header says none, the list says three.
18. list_board says "The inspector on 0 cards" on one board and "Rooney's driver on 0 cards" on the other, while both readings say "nobody in the cast on no card of the project". Per-board count, project-wide check.
19. set_payoff takes `fold` and `from`; set_plant takes `later` and `at`. Two tools for one claim from either side, each with its own words. I could not tell from the descriptions whether the record differs.

**The reading:** nothing new.

**Direction 0, the six cast answers**

20. cast's reply says "1 card(s) now cast …" but never names the card. With two calls in one go I matched replies to cards by counting names.
21. Casting on the other board's cards meant open_board first. cast takes ids unique across the project but works only on the open board. Its description does not say so.

**Direction 1, the shim opens episode two**

22. move_scene's description says across boards "its arrows stay behind", and the reply said `Left behind on "Gross Weight": … (follows)`. On list_board that arrow is gone; "left behind" meant dropped. The app also drew a new follows arrow on the landing board, which neither description nor reply said.
23. The same reply lists what moved, "cast, place, when, rank, length and colour", no fold, then says the fold's mark is forgotten and to draw the setup arrow. The fold did travel.
24. Nothing said whether a card landing before an ungrouped card would join a group. It did not; I read list_board to know.
25. set_rank's reply: "The rows are as they were; organize lays a row per beat." It hints the wall may need tidying without saying whether it does.

**Direction 2, the letter pays off at the plate failing**

26. set_plant's reply did not say the card was already folded, nor that the earlier claim on the inspector's arrival was replaced. I read both boards to confirm.
27. The same reply says the folded card "pay[s] off at" the other scene. The fold's card is the one paid off; the words run the other way.

**Direction 3, Dana's page**

28. read_character's reply has no first line naming the project, the one reply without it.
29. It puts a whole board's scenes on one semicolon-separated line, nine on one and ten on the next.

**Direction 4, write the re-test, blue revision, the last line**

30. The guide says cues relate to the cast "only by name". I cued DANA; the record is "Dana Kerr". write_scene said nothing about whether any cue matched anyone.
31. write_scene said 28 lines; edit_scene after a one-line swap said 27. Neither says why.
32. edit_scene says the changed line is "starred on the page and in every export". read_pages shows no star on the line, only "changed in the blue revision" on the heading tag and the cast note. "The page" and read_pages are not the same thing.
33. page_count says "pages: 2 of 30" while list_board says "about 9 pages". Both the app's; a reader holds two lengths for one board.

**Direction 5, lock the numbers, add a scene after the funeral**

34. lock_numbers' reply does not say which number went on which scene. list_board does, as `number:id` pairs with no headlines.
35. create_note under the lock said the letter "follows the scene if it moves". After the move it was 3A, not 10A. lock_numbers' description says the same sentence, and it reads as the opposite of what happened. The move's reply did not mention the locked number.
36. A new card lands last and gets a letter for that place, so adding a scene between two is two calls and two numbers. create_note takes no `after` or `before`.
37. page_count on "Gross Weight": "No pages to count yet: none of the 11 scenes is written." On "Certified", with one scene written, it paginated all ten. The guide's "script so far" holds only once one scene is written.

**Direction 6, Final Draft out**

38. To learn the app's own file name I had to export once without a path, where the name is a comment on the XML's second line, and once with one. Two calls per board.
39. Under the lock the file's numbers run 1, 2, 3, 3A … 10. export_fdx's description says "by wall order" and the guide says "by wall order, not locked". The file uses the locked numbers.
40. The changed line's `RevisionID` in the Final Draft file is the first place the star was visible to me. No reply said where to look.
41. Episode one's title page prints "Scene numbers locked 2026-09-18." on the page an agency reads. Nothing in lock_numbers said the lock would print there.
42. The guide's warning that a relative path resolves from the server's folder is under export_project only. export_fdx does not repeat it.

**Direction 7, how long is it**

43. list_boards gives the project total but not the split into measured, writer-sized and unsized. list_board gives that split as card counts without saying which cards or how many pages each kind adds up to. I added by hand.
44. The writer's 3-page estimate for the re-test is "kept underneath" the measure, per write_scene, but no read shows it.

**Direction 8, undo**

45. undo's reply: "1 arrow(s) gone". The move had removed one and drawn two; the undo put one back and took two away. The reply gives the net, not what happened.
46. undo's reply says nothing about the locked number. The card went from 3A back to 10A, and the one tool that changed it did not mention it.
47. undo's reply: "49 more of mine can be undone." The guide says undo is per board; the reply does not say whether 49 is this board's or the session's.
48. After the undo the reading lists the unlinked card in a run "After 'Bríd says the plate reads light'", by its old wall position, while asking what links it.

## 3. The on-ramp: what I did not need, and what I had to work out

**Not needed, and most of the page.** The five Doors: MCP wiring, the shell door and its batch file, the hosted door, the account variables, the page, the folder and the sample wall. claim_account. PLOTCODER_JSON, PLOTCODER_ROOT, PLOTCODER_PROJECT, `npm run dev`, "the open app", "the file". The "For the person" section. With the tools already in front of me, the on-ramp's useful content was one list of four calls and eleven rules, and the pointer to the guide.

**Not told, and needed.** That every card tool works only on the open board, so a project-wide id still needs open_board first. That create_note always lands last and placing a scene is create then move_scene. That a cross-board move drops the arrows at one end and draws one at the other, and forgets a cross-board fold claim, so the setup arrow must be drawn by hand. That a lock's letter is recomputed on every move. That the revision star shows only in exports, not in read_pages. That page_count refuses a board with no written scene. That question counts in a reply after a cross-board write are the other board's. That the app's own file name lives in an XML comment. That the lock and the revision print on the title page. That the kept estimate under a measure is invisible. Which of the two payoff tools to use, and whether it matters. The guide answered most of the rest; the on-ramp answered almost none of it.

## 4. What I never found a way to do, or did another way

- **A scene between two scenes** under a lock: no tool inserts. I created, got 10A, moved, got 3A. Two calls, two numbers.
- **The spot within a place** (office, plate, underneath): the app has no roster of places and relates no two phrases, so all seven carry "the weighbridge" and the spot lives in the headline.
- **Seeing the revised line marked**: read_pages does not show it. I saw it only in the Final Draft XML.
- **Learning the app's file name**: exported without a path first.
- **Casting on the other board**: opened it first, then came back.
- **Reading the writer's estimate under a measure**: no way found.
- **Confirming whose count a cross-board reply gives**: worked out from arithmetic.

## 5. What I was never sure had landed

- **The DANA cue.** Whether the app relates it to "Dana Kerr" or reads her as a stranger on the page. No reply says.
- **The kept 3-page estimate** for the re-test. Reported kept; nothing shows it.
- **"49 more can be undone."** Which scope.
- **The written Final Draft files' contents.** I read the no-path export of each board and the with-path reply's scene count and file size on disk. I did not open the written files line by line.
- **The positions on the wall.** I never saw the wall; list_board's rows are all I have for what organize and the tidies did.
- **Undo's arrow count.** Confirmed by list_board, not by the reply.
- **The old letter claim on the inspector's arrival.** Gone, but confirmed only by reading both boards; the tool that replaced it did not say it had.
