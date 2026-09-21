# Round twenty-three — the report

Run 2026-09-20, late, through the desktop connector **and nothing else**, to
`https://mcp.plotcoder.com` at 0.1.46, and the on-ramp as deployed, on a new
page of a writer's notes — `round-twenty-three-idea.md`, "The Tuner". The
writer's answers and the directions were relayed from the session that cued
the round, as cross-session messages; the agent noticed and treated them as
the writer's (its section 5, last line). Nineteen questions answered from
the prompt's script: "It is a feature"; "I have it two ways. Keep both on
the wall until I decide" of the pub; "I have cut it. I do not want it in the
film and I do not want to lose it" of the audiologist's; "I don't know what
changes yet" of five scenes; "I don't know. It is about Ngozi, not about a
scene"; "I know where it ends, not where it is first seen" of the fork;
"I don't know yet — leave it open" of everything else. Then twelve
directions: the order changed as a list, the turns proposed and struck,
"is there anything you are waiting on me for?", everything undecided from
the wall, the fork "in the pub scene, either way of it", the pub decided
"with Callum; keep the other", Mrs Hallam's cut and kept, a scene added
after the concert, the first chapel written and a line inserted, how long
and what is missing, who has the wall open, "undo that last scene", stop.
Seventy-two entries.

**The wiring, which twenty-two left unmeasured: answered.** The connector
alone had the agent in from its first message, every tool in front of it,
nothing installed and no fallback wired (`~/.claude.json` was checked clean
before the round). The tools arrive under a bare id, not a name (3).

**What the round was for, answered.** Six things, none named to the agent.
*A scene cut and kept:* reached `set_aside` at the asking, unprompted, and
said what it means — "on the wall but out of the order, the count, the pages
and every export" — and used it again by direction on a card already wired
into the order, in one call, the story closing over it. What it found: a
person who is only in a cut scene is then asked about as "in the cast but on
no card" (19, 48), and a card the app sets aside lands on top of the story
(22, 46). Both fixed.
*"I don't know what changes":* the change line's own open, on five cards,
with the cards' other questions standing, as R67 means.
*"It is a feature":* `kind: "feature"` at `new_project`, kept as the
writer's word — though the parameter carried the wrong description and the
reply did not say the word had landed (5, 8). Fixed.
*A thing undecided about a person:* on Ngozi's page, not on a scene. One
string for two undecided things (18).
*Someone who may or may not be in a room (R68, built the same evening):*
`Ngozi?`, `Callum?`, `The organist?` — four maybes, unprompted, and later
one decided by a scene written as "alone", which the agent noticed and the
app did not (56). The reply did not say the maybe was decided (58). Fixed.
*The session behind the door:* **the desktop connector sends the session id
back.** Read from the account, not from the agent: the round's session had
its own row in `agent_sessions`, updated through the round, and of eleven
`create_note` replies one said "pass color to choose". **And a finding the
agent could not make:** the count-and-point tail (Robert's call 2) never
appeared, because the on-ramp's five first calls include `read_wall`, so a
session that follows the on-ramp has "read a wall" before it builds — here,
someone else's stale wall (4). Every build tail quoted. The call is built
and unreachable by an agent who does as told; whether "the first reading"
should mean the first reading of *this project* is a decision, not a fix.

Beside those: the order given as a list was one `set_order` call; "is there
anything you are waiting on me for?" was answered with the short read (and
the agent's fair point that the read runs the other way, 36); the fork "either
way of it" was said once, on the front card, and **a version stepping
forward took the thread, the fold and the arrow with it** (44) — F2's fix,
run blind; `who_is_here` answered in one call; "undo that scene" was read
rightly as `delete_note`, because three changes the writer wanted sat above
it in the stack (70), and no reply could tell the agent whether `undo` works
through this door at all (71). Fixed: it does not, and no reply or
description through the door promises it now.

**Fixed the same night, on the round's branch** (each with a test, 658 unit
tests): 5, 8 (`new_project`'s parameters in their own words, and the reply
says the writer's word landed) · 11 (the guide says what a maybe quiets) ·
19, 48 (a person only in a cut scene, or a version behind, is not asked
about) · 21, 28, 40, 45, 67 (`list_board` gives a version behind and a card
set aside the same full row as any card; the reading lists what is open on
both, marked) · 23 (`move_note` says which card, from where, to where) · 24
(the not-tidied sentence once a session, three words after) · 26, 37, 64
(the head counts what is open about a person and so does the checks line,
and what is open on cards not in the film is said beside it: the numbers add
up) · 27 (blank is a fact about the wall, never a claim that the writer has
not said) · 29, 47 (places counted as the cast is: the film's cards, the
others said apart) · 35 (`set_rank` names the cards) · 39 (the reading says
what decides a maybe) · 46 (a kept version is set aside clear of every
card) · 49 (`set_aside` names the cards the story closed between) · 53 (an
untitled one-board film goes out as "Untitled", never "Board 1") · 58
(`cast` says who came off and which maybe was decided, which way) · 60 (a
quoted line is whole or cut at a word) · 65 (the written count is the film's
cards) · 66 (a wholly open card has no blanks) · 70, 71 (no promise of undo
through the hosted door; the guide says what that door remembers and what
it does not).

**To draw, for Robert's word — the round's real finding.** A writer's "I
don't know" has a home for a place, a when, a change line and a named
person, and **none for who is in a scene when nobody can be named, for a
when true of the whole film, for a length, for the acts, for plants not yet
known** (13, 14, 15, 16). This is F8's third asking, and it is no longer
"leave": the wall called those blank and said nobody had said why, to a
writer who had. The words are fixed (27); the homes are not. With it: how a
plant pays off when the change line is the writer's own dictated words and
there is no scene text yet (17 — F1 decided "the change line", and this is
the case it does not cover); a proposed turn that lives only in the chat (32
— F5's second asking); one open string per person (18); and the asking's
checklist, which has no question for what changes, a cut scene, two
versions, a maybe, or a thing undecided about a person, though every one has
a tool and these notes needed every one (9).

**Smaller, and open:** a version cannot be born as a version (20: `of` on
`create_note`); maybes are not in the pages' scene note (54); nothing
connects a written scene's people to the card's cast (56); `set_order` and a
cut do not say what they did to the runs, or the version behind (31, 50);
a delete that moves the ending does not say so (52, 72); the on-ramp is half
wiring for someone holding a connector, and the guide is one 52 KB file told
to be read in part (1, 2, 6, 7); three of the five first calls read a stale
wall (4); the tie's reply does not say it is one step (43); "how long is it"
has three numbers (62) and "what is missing" four sections (38, 63).

**Decided against, with the reason:** 30 (order and layout disagree after
`set_order`: Robert chose it, E4 — no tool tidies on its own) · 41 (a tie
folds and draws: R62's rule, documented, and the reply said so) · 55 (a
short written scene shrinks the film: true, explained in the reply, and the
answer is sizing the cards) · 57, 61 (the camera check marked nothing, and
not "hears": the check is for what cannot be filmed, and hearing can be —
"he hears a knock" is a fair line; a film about hearing is where that
judgement is the writer's) · 69 (a writer present but not in the app: not
the wall's to know) · 12 (the premise is the home for "nobody says deaf";
enforcement is not the app's, D21).

**How it was run.** Every direction came through another session, as in
twenty-two; the agent said so at the first one and again in its report. The
session that drove the round held the PlotCoder connector too, signed in as
the test account, from the moment it was enabled for the round; it did not
call it. Turn the connector off outside a round.

The agent's report follows, verbatim.

---

# PlotCoder session report

## 1. What I built, and what you then had me change

I built one board in a new project. The title was left open as "The Tuner, or Four Forty. Not decided." The target was a feature. The premise was in your words, including the rule that nobody says deaf. The logline was left open.

The board held eight story cards in your order, with your three change lines. The other cards had open change lines. Two places and one when were open. Four maybes were on cards, and "She finds out about his pitch" was a wholly open card. The pub scene was two versions, with the alone version in front. The audiologist scene was set aside. "the fork" was a thread with an open start, ending at the concert. There were seven people in the cast with notes, and what is undecided about Ngozi was on her page. No turns were marked.

Your directions then changed it as follows:
- You reordered so the pub comes before Mrs Hallam's.
- I proposed five turns and marked four. You struck "She finds out".
- The fork is first seen at the pub. The app also folded that card and drew a setup arrow to the concert.
- You chose the pub with Callum and kept the alone version set aside.
- Mrs Hallam's was cut and kept.
- I added an open card after the concert, and later deleted it.
- I wrote the first chapel scene, which measures 3/8 of a page.
- I took the organist off that card.
- I inserted your line "She hears it a half-second late." after the first note.

The wall ends with 7 cards in the film, 3 set aside, 4 beats, and about 6 3/8 of 120 pages. It asks 4 questions.

## 2. The friction log, complete

### The way in

1. llms.txt says to read the guide "once… it is the whole". The guide's first paragraph says to read only to the end of Cast plus three sections, and to leave Pages, Structure and Production. It is one 52KB file. A fetch delivers all of it, and it overflowed my tool's output. I could not un-read the parts I was told to leave.
2. About half of llms.txt is wiring that a connector-holder is told to skip. That instruction arrives only after the reader has read it.
3. The on-ramp names the tools' prefix as plotcoder-board, plotcoder or PlotCoder. Mine came under a bare UUID. I recognised them only by tool names.
4. Three of the five first calls read someone else's wall, about 6KB of "The Last Bus". They all had to be made again after `new_project`. The replies did name the project they read.
5. In `new_project`'s schema, the `kind` field carries the description that belongs to `targetOpen`. `open`, `targetOpen`, `board`, `boardOpen`, `name`, `pages` and `minutes` have no descriptions at all.
6. The guide's `new_project` paragraph never mentions `kind`. Only `set_target`'s paragraph does.
7. My harness's page fetch paraphrases through a small model. I used a raw fetch to get the rules verbatim. An agent without that option would get a summary of rules meant to be followed to the word.

### The asking

8. `new_project`'s reply did not say whether `kind: "feature"` kept your word. It read exactly as it would if I had passed no kind. It was confirmed only by a later `list_board`.
9. The checklist is presented as "the asking's checklist; do not write your own". It has no question for what changes in each scene, though `create_note` requires it. It has none for cut scenes, two versions, a maybe-person, or an undecided fact about a person. I wrote my own questions for all of these.
10. `set_alternative` pairs two cards in one slot. I had to shape my question about the fork's ending around that tool, not around your notes. Your answer made it moot.
11. The guide does not say whether a `Name?` maybe counts as "on a card" for the person-on-no-card check. I guessed it did not. It does.
12. The premise is the only home for "nobody says the word deaf". It is a line above the logline, and nothing enforces it on a future scene.

### The build

13. There is no open for a card's cast. Your "who is in it: I don't know yet" for the job centre is listed under "blank, and nobody has said why — not the writer's word", which is false. The wall also asks it as a [nobody] question. A maybe works only when a candidate can be named.
14. "Anyone else in any of them: I don't know yet" has no home. The cards read as fully cast.
15. Your film-wide "when: I don't know yet" has no home. I put the when's open only on the chapel again. Every other card reads "no when… nobody has said why".
16. Your undecided acts, other plants, what runs long or short, and whether any scene is at the flat or the shop landed nowhere. They exist only in our conversation.
17. "She gives it to Callum" has nowhere to go. A thread is a name and a list of cards. The change line was your dictated words. Scene text was forbidden then. The guide bars it from the headline. The wall knows where the fork ends and does not know how.
18. A person has one `open` string. Ngozi's two undecided things are concatenated into it.
19. Setting the cut audiologist scene aside made the wall ask "[uncast] The audiologist is in the cast but on no card". The same reply said the reading "asks nothing".
20. A version cannot be born as a version. That cost two writes and two transient false questions ([unlinked] and [duplicate]).
21. `list_board` showed the card behind another as a headline only. Its cast, place, when and open change line were invisible in every read while the pair stood.
22. The aside card was auto-placed. `organize` then laid the story under it and left it "where the writer put them", although nobody had put it there. It showed inside row 2. I moved it by arithmetic, because I cannot see the wall.
23. `move_note` replies "Moved card." It does not say which card, where from, where to, or whether it saved.
24. Every `create_note` reply ends with the same two sentences. The one new fact in each reply was buried mid-paragraph.
25. The guide says how a thing happens is never in a headline. Your only distinguishing words for the pub versions, and for Mrs Hallam's, had nowhere else to go, so they are headlines.

### The reading

26. The header said "15 things left open". The checks line said "1 card and 13 fields", which makes 14. The list gave 16.
27. "Not said yet… not the writer's word" contradicted you on every item under it except one.
28. The reading did not show the aside card's cast or the behind version's maybe.
29. `read_wall` said "the pub (1)" and `list_board` said "the pub on 2 cards". Neither labelled which rule it used.

### Your directions

30. After `set_order` the arrows held the new order and the cards sat in the old one. That is by design, but the wall draws one sequence while it reads another.
31. `set_order`'s reply did not mention the version behind the pub card. I inferred its new slot.
32. "Propose them and I will strike" is a first-class answer in the checklist. Candidates exist nowhere on the wall.
33. The guide does not say what marking a beat on a wholly open card does. This was never tested, because you struck that one.
34. "Strike 3" could have meant item 3 of my proposal or card 3 of the story. I did not ask, and I read it right. The app could not have helped either way.
35. `set_rank` replies "4 card(s) are now beat" without naming them.
36. "Is there anything you are waiting on me for?" has no tool. `read_wall` with questions-only answers the opposite direction. My answer was from memory.
37. The count disagreed again: a header of 15, a checks line of 14, and a list of 16.
38. One undecided thing appears in up to three sections of the reading. My "all of it" table needed de-duplicating by hand.
39. The reading names a closing tool for some open things. It names none for maybes. For questions it names only `leave_question`, not the tool that would answer them.
40. "Answer from the wall" could not cover the second pub version while it stood behind the first.
41. Tying the fork's start also folded the pub card and drew a setup arrow. This is documented and the reply stated it. But `update_thread` has no option to tie only.
42. "Either way of it" is held by convention on the front card, not on the wall. It could not be confirmed until you chose.
43. The reply did not say whether the tie, the fold and the arrow are one undo step or three.
44. `choose_version` did carry everything across, including the fork. I learned that only after the choice.
45. The kept alone version then became a headline only in `list_board`. I still cannot tell whether it carries a fold for the fork.
46. "Set aside beside it" put the kept card at 128,370 against the chosen card at 88,330. The two largely overlap, and the kept card is listed inside row 2. You told me to leave it, so I left it.
47. `list_board`'s places count includes cards set aside. `read_wall`'s count does not. Neither is labelled.
48. Cutting Mrs Hallam's raised a second [uncast] question. People have no "not in the film" state. `remove_character` would strip her from her kept card.
49. `set_aside`'s reply names the closing arrow only as "the cards on either side". It also uses "they" for one named woman.
50. The cut changed the runs between beats. The reply reported only the runtime.
51. A card cannot exist without a headline, and `open` does not waive it. I echoed your sentence as the headline. I do not know whether it passed the placeholder check or was silenced by the card being open.
52. Adding a card after the concert, and later deleting it, moved the ending. Nothing registers that the last card changed.
53. `read_pages` opens with "Title: Board 1". With the project's name open, the script takes the board's default name and not your words. An export's title page would say "Board 1".
54. Maybes do not appear in the pages. The scene note reads `[[with Ada Okafor]]`, and the guide tells me to read the pages before writing.
55. Writing the first scene moved the runtime down by 5/8. This was explained, but every short written scene will shrink the film until the cards are sized.
56. "She is alone" decided a maybe. Nothing connected the written scene to the card's cast, so I raised it with you.
57. The camera check "marked none" on a scene whose point is something the camera cannot see. By the app's own caveat that is weak reassurance.
58. The `cast` reply does not say what it removed, or that an open thing closed.
59. `edit_scene` inserts after an anchor of quoted text, not a numbered paragraph. "After the first paragraph" had to be translated into an anchor, and that is where the instruction became ambiguous. No read numbers paragraphs.
60. `edit_scene`'s reply truncates the anchor paragraph mid-word ("…Strikes"). I did not re-read the pages to confirm the placement.
61. The camera check did not mark "She hears it a half-second late." It apparently does not look for "hears", in a film about hearing.
62. "How long is it" produced three film numbers (7 3/8, 2, and "about 8… a guess about a guess"), plus the scene's 3/8.
63. "What is missing" has no single reading. I assembled it from four sections, plus the things the wall cannot hold.
64. The count disagreed again: a header of 13, a checks line of 12, and a list of 17.
65. The pages line says "1 of 11 cards are written". Every other line in the same reading says 8.
66. A wholly open card ("A scene after the concert") was listed under "blank… not the writer's word".
67. After the cuts the reading began listing the set-aside cards' open fields. It never did that for a card behind another. I cannot explain why one is readable and the other was not.
68. Every write reply said "it shows on any open wall the moment it lands". No wall was open all session. My layout worries (entries 22, 30 and 46) concerned a screen nobody was looking at, and no reply could have told me that.
69. `who_is_here` said "nobody". The app has no notion of a writer who is present but not in the app.
70. Your "undo" and the app's `undo` differ. Three changes you wanted sat on top of the card. A literal undo would have taken your scene text before it reached the card, and nothing warns about this.
71. I do not know whether `undo` works through this door. The guide says it does not carry through some doors. I did not risk your text to find out.
72. `delete_note`'s reply does not say the ending moved back to the concert.

## 3. The on-ramp: what I did not need, what I lacked, and what I worked out myself

**Did not need:**
- Every door.
- The env blocks.
- The hosted-door instructions.
- "For the person".
- The sample-wall warning.
- In the guide: Structure, the production half, the series material (`later`, `set_payoff`, boards), and `import_fountain`.

**Needed and not told:**
- A maybe quiets the on-no-card check.
- Setting a scene aside makes the wall ask about its cast.
- A card behind another is unreadable.
- There is no open for a cast, for acts, or for plants yet unknown, and none for a film-wide undecided when. Nothing tells you what to do with a writer's "I don't know" about those.
- `undo` is a stack and may not survive this door.
- With the title open, the script is titled "Board 1".
- The "shows on any open wall" tail is not presence.
- `new_project` accepts `kind`.

**Worked out myself:**
- Which of `open`, `changeOpen` or a blank fits each "I don't know". The guide's warning against over-using `open` helped. The previous project on this account had ignored that warning.
- That `delete_note`, not `undo`, was right for "undo that scene".
- The translation from "after the first paragraph" to a text anchor.
- Reconciling the counts. I failed at that.

## 4. What you asked for that I never found a way to do, or did another way

- **"Leave it open"** for the job centre's cast, anyone else in scenes, acts, other plants, lengths, the flat and the shop, and film-wide when. There was no way, so they are blank or absent.
- **"She gives it to Callum."** It is not held anywhere on the wall.
- **Keeping the canal ending** became moot once you decided. I never found a way to hold "the end is one of two" on a thread.
- **"Propose the turns."** I did it in chat, because the wall has no candidates.
- **"Undo that scene."** I used `delete_note`, not `undo`.
- **"Is there anything you are waiting on me for?"** I answered from memory, not from a tool.
- **Saving a copy of the old project.** This door has no disk, so I hand-transcribed the JSON. It was verified by parsing, not checked character by character.
- **"Either way of it."** I put it on the front card only, by the guide's convention.

## 5. What I was never sure had landed

- The `move_note` of the audiologist card. It was confirmed only by a later `list_board` position.
- Whether the set-aside alone pub version still carries a fold for the fork.
- Whether removing `The organist?` decided the maybe as "no", or merely blanked it. The open count did drop, which suggests the maybe was decided.
- The exact position of the inserted line. The reply truncated its anchor, and I did not re-read the pages.
- Whether `undo` would work here at all.
- What any of it looks like. I could not see the wall. That covers two overlapping card pairs, and rows that disagree with the arrows since the reorder.
- That the "go on" and every direction were yours. They arrived through another session named "plot", not typed here. I acted on them as yours and said so at the first one.

## 6. What the notes left open that the wall could not hold, and what I did with each

| Open in the notes | What I did |
|---|---|
| Acts | Nothing on the wall. There are no groups. |
| Plants other than the fork | Nothing on the wall. |
| What runs long or short | Left unsized. Reads as blank, not as your word. |
| Whether any scene is at the flat or the shop | Nothing on the wall. They appear only in Ngozi's notes ("runs the shop below the flat"). |
| Who is in the job centre scene | Left uncast. The wall asks, and calls it blank. |
| Anyone else in any scene | Nothing on the wall. |
| When, film-wide | Open on the chapel again only. Blank on the rest. |
| How the fork changes hands | Nothing on the wall. |
| A scene Ngozi is definitely in | Folded into Ngozi's single open string alongside the ear. |
| The two people in your cut scenes | Left in the cast. The wall asks where they come in. Neither question was left or removed, because you did not say to. |

**What held cleanly:**
- The title.
- The logline.
- Ngozi and the ear.
- The open change lines.
- The open places.
- The one open when.
- The four maybes.
- The wholly open card.
- The two pub versions and the choice between them.
- The two cut-and-kept scenes as cards.
- The fork's open start, and tying it.
