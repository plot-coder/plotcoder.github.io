# Round twenty-two — the agent's own issues file

Written by the round's agent after its report, from its friction log, in the
session's scratch folder (`plotcoder-issues.md`, 2026-09-20). Kept verbatim
below the line, as the report is. It describes 0.1.42. What became of each of
its forty-four issues is in `docs/to-do-round-twenty-two.md`, section H: most
were fixed or built before the file was read, and it caught seven things the
to-do had missed.

---

# PlotCoder — issues from the "The Last Bus" agent session

Source: one blind session on 2026-09-20, an agent working the hosted connector (`plotcoder`, the account door, test@test.com) with only `llms.txt` and `guide.md`. The wall was built from a writer's notes in which most things were undecided. Numbers in **Friction** refer to the session's friction log (1–95).

Every quoted reply is verbatim from the session. "Tucked card" means a card set behind another with `set_alternative`.

**Labels:** `bug` (says or does something false), `model` (a thing a writer says that the app cannot hold), `tool` (a missing or mis-shaped tool), `reply` (a reply or reading that misleads), `docs`.
**Priority:** P1 start here · P2 next · P3 when convenient.

## Contents

- A. Bugs — A1 to A14
- B. Model gaps — B1 to B10
- C. Tools — C1 to C8
- D. Replies and the reading — D1 to D7
- E. On-ramp and guide — E1 to E5
- Suggested order

---

# A. Bugs

## A1. Reading prints "NaN NaN/8 pages earlier" for a setup arrow from a tucked card
`bug` · P2 · Friction 60

**Steps**
1. Two cards, B set behind A with `set_alternative`.
2. `set_plant` on B, `create_arrow` B → some later card, kind `setup`. Both calls succeed ("The fold… is paid off now").
3. `read_wall`.

**Actual**
> "…she drives to the city and says too much" sets up "The last run…" — the keys to the bus, about NaN NaN/8 pages earlier

JSON has `"eighths": null` for that setup.

**Expected** A tucked card has no place in the order, so no distance: e.g. "— the keys to the bus (from a version not in the story; no distance)". Never "earlier".

**Done when** no reading or export can print `NaN`; a null distance has its own wording.

## A2. `update_thread` answers "Nothing changed" when it is refusing a tucked card
`bug` · P1 · Friction 58

**Steps** Thread T through cards [A, Z]. B is tucked behind A. `update_thread { thread: T, add: [B] }`.

**Actual**
> Nothing changed: "the keys to the bus" already reads that way.

B was not on the thread and is still not. The reply reads as "already done".

**Expected** Either allow a thread through a version card, or refuse in words: "B is a version behind A and is out of the story; a thread cannot run through it. Put it on A, or choose the version first."

**Done when** adding a card that cannot be added never returns a success-shaped reply.

## A3. `choose_version` with `keep` leaves both cards as beats
`bug` · P1 · Friction 48

**Steps** A is a beat, B is tucked behind A. `choose_version { id: B, keep: true }`.

**Actual** Reply: "it steps forward into [A]'s place, with its arrows, rank and group… [A] stands beside it as a plain card, unwired." After it, both A and B are `rank: beat` (4 beats became 5), and the wall raised a new question about two turns back to back — between the chosen card and the one just discarded.

**Expected** Rank moves to the chosen card; the kept card is a scene (or, better, parked — see B1).

**Done when** choosing a version never changes the number of beats.

## A4. Counts disagree about what is in the film
`bug` · P1 · Friction 20, 33, 38, 53, 68, 80, 84

**Actual**, all from one wall (7 cards in the story, 2 tucked):
- `read_wall`: "runtime: about 7 pages (of its 9 cards… 9 unsized and read as a page each (9))" — 7 and 9 in one sentence.
- `list_board`: "beats: 0, scenes: 9" while saying tucked cards are "out of the order, the count and the pages".
- `set_rank`: "The board holds 4 beats and 5 scenes" (4 + 5 = 9; 7 are in the story).
- `read_wall` checks: "not asked until half the cards are wired: 2 of 9 are" — counting the two ends of a *setup* arrow as wired; the next reading says "a setup arrow is a claim, not a place in the story".
- Cast: "Nuala Feeney on 10 cards of this board" includes tucked and cut cards.
- `read_pages` header: "9 cards" while `list_board` says "notes: 10".
- Later: "about 8 2/8 pages (of its 10 cards, 1 measured… (2/8 pages)… 9 unsized and read as a page each (9))" — 2/8 + 9 is not 8 2/8.

**Expected** One definition of "in the story" used by every count: cards, scenes, beats, pages, cast counts, wired counts. Tucked (and parked, B1) cards reported separately: "7 in the story, 2 versions behind".

**Done when** every number in one reading can be re-derived from the others.

## A5. "N of 120 pages" printed while the target is open
`bug` · P2 · Friction 19, 44, 80

**Steps** `new_project { targetOpen: "half an hour or a feature" }`, then any write.

**Actual** Every write tail: "runtime now about 3 of 120 pages". `list_boards`: "9 cards, about 7 of 120 pages". `read_pages` header: "about 9 of 120 pages". JSON shows `targetEighths: 960` stored underneath the open words.

`read_wall` and `list_board` get it right: "target open… (against 30 it would be 23 under; against 120, 113 under)".

**Expected** Wherever a runtime is printed against a target, an open target prints as open. Do not store a silent default under open words, or do not print it.

## A6. `set_plant` reply says the wall will ask where the plant comes back when an arrow already pays it
`bug` · P2 · Friction 55, 56

**Steps** Card is folded, a setup arrow leaves it. `set_plant { ids:[card], what: "the jar of coins — he counts the fare out of it on the step of the bus" }`.

**Actual**
> …and read_wall asks where the jar of coins — he counts the fare out of it on the step of the bus come back until a setup arrow pays it off…

False (it is paid; the wall does not ask) and ungrammatical ("where … come back"). It also does not quote the old label.

**Expected** Reply built from the card's state: "Plants · X (was: Y). Paid off by "The last run"." Only mention asking when unpaid.

## A7. `edit_scene`: wrong explanation, no camera flag, "one line" for a paragraph
`bug` · P2 · Friction 75, 76, 77

**Steps** Scene of 9 printed lines. `edit_scene` replacing one sentence with that sentence + blank line + a new two-sentence paragraph containing "She knows…".

**Actual**
> Changed one line… Now 12 line(s) as they print (was 9: a line wraps differently now), measured at 2/8 of a page.

- The count rose because a paragraph was added, not because of wrapping; 9 → 12 for one line plus one blank is also unexplained.
- No camera note in the reply, though `read_pages` then shows "camera: 1 line it cannot see (knows)" and the guide says write replies carry it.

**Expected** Reply states lines added/removed honestly; carries the same camera summary `write_scene` does.

## A8. The "questions have changed" tail counts instead of quoting, and silence is ambiguous
`bug` · P1 · Friction 25, 37, 52, 62, 66, 92

**Guide** "Until the session's first `read_wall` it counts and points… after the first reading it quotes them."

**Actual** After three `read_wall` calls, `set_rank` still replied "the wall's questions have changed since your last read_wall: 2 now, 1 of them new — read_wall lists them." Every such tail cost a full reading (~300 lines) to find one sentence. Other writes (`create_note … after`, `set_target`, `edit_scene`) carried no tail at all, with no way to tell "unchanged" from "not computed".

**Expected** After the first reading: quote new questions and name the ones that went. When nothing changed: say "the wall's questions are unchanged (N)". Possible cause worth checking: a `read_wall` made on an account with no project may not register as "the first reading", and later ones may not either on the hosted door (one server per request?).

## A9. JSON tail is on at the hosted door; both documents say it is off
`bug` · P1 · Friction 4, 27, 46

**Docs** "The JSON tail is off on every door; PLOTCODER_JSON=1 in the server's environment adds it."

**Actual** Every reply from mcp.plotcoder.com carried the full JSON after the prose. `list_board` for ten cards ≈ 450 lines; answering "what is still open?" cost ≈ 900 lines of replies.

**Expected** Off by default on the hosted door, or the docs say it is on and how to turn it off per call.

## A10. `organize` never moves tucked cards; new cards land on their coordinates
`bug` · P2 · Friction 22, 32, 45

**Actual**
- "Organized 7 card(s)" on a wall of 9; the two tucked cards kept x,y (800,140 and 1020,140) while their front cards moved to 748,110 and 528,110.
- `create_note` placed the next new card at exactly a tucked card's coordinates (800,140; again at 1020,140).
- `list_board` "rows on the wall" lists tucked cards as ordinary neighbours in row 1, three cards away from their front card.

**Expected** A tucked card's position is derived from its front card (or moved with it). Auto-placement ignores tucked cards' slots. Rows list them with their front card: "A (+1 version behind)".

## A11. Born-open cards get "What changes?" written into the change field, and it prints as the scene
`bug` · P1 · Friction 18, 69

**Steps** `create_note { headline, open: "what changes: I don't know yet" }` (no `change`).

**Actual** JSON: `"change": "What changes?"`. The prose reply never says so. `read_pages` then prints for nine of ten scenes:
> [Unwritten] What changes?

**Expected** Empty change stays empty. An unwritten scene with no change line prints "[Unwritten]" plus the card's open words, or nothing — never the app's own question as if it were the writer's.

## A12. Open-place words are printed as a slugline
`bug` · P2 · Friction 70

**Actual** `locationOpen: "I don't know yet"` prints as the scene heading:
> .PLACE NOT DECIDED: I DON'T KNOW YET - SEPTEMBER, MORNING

The guide's own example ("where it happens") would print as "PLACE NOT DECIDED: WHERE IT HAPPENS".

**Expected** Heading: "PLACE NOT DECIDED - SEPTEMBER, MORNING". The writer's words stay in the note under it (they are already there).

## A13. Setup distances carry no caveat when story order is unset
`bug` · P3 · Friction 30

**Actual** Same reading: "story order: unset — no follows arrows, so the rows stand in for it" and, three lines later, "…the jar of coins, about 6 pages later".

**Expected** "about 6 pages later by the rows (order not set)" or omit the distance until there is an order.

## A14. Small text fixes
`bug` `docs` · P3 · Friction 2, 7, 88

- `guide.md`, `set_alternative` entry: "(R65)". `create_note.locationOpen` description: "(R61's edge)". Internal references; remove.
- `export_project` description: "…which is  — this session's own folder…" — a blank where a path is interpolated. On the hosted door also say whose disk `path` writes to.
- `llms.txt` opening: "Already have the plotcoder-board tools in front of you?" — the hosted connector is named `plotcoder`. Say "PlotCoder's tools".
- Fractions print unreduced: "8 2/8", "21 6/8 under". If eighths are deliberate, print "8 and 2 eighths" or reduce to quarters/halves.
- `list_reminders` header: "reminders (The account… holds no project yet…): 6" — a sentence inside a label.

---

# B. Model gaps

## B1. A card that is on the wall but not in the film ("cut, kept")
`model` · P1 · Friction 47, 49, 50, 51, 64, 85

**The writer said** "I have decided, so the wall should not say it is not chosen. The other one stays on the wall where I can see it, but it is not in the film."

**Today** Two states only: in the story, or tucked behind a sibling as "two versions, not chosen". `choose_version keep` makes the loser "a plain card, unwired" — which silently puts it back in the order (by its x,y), the page count (7 → 8), the runs, the setup distances, the cast counts and the script. An unasked tidy later slotted it between the chosen breakdown and the scene that follows it. The agent could only label it by misusing `set_open` ("not in the film — …"), which the reading then lists under "open, by the writer's word" although the writer has decided.

**Proposal** A third card state, `parked` (wording: "cut, kept"):
- visible on the wall, visibly different;
- out of the order, count, pages, runs, distances, cast counts, script and every export;
- never pulled into a chain by `organize`;
- listed by the reading under its own head: "kept, not in the film";
- `set_parked { ids, parked, why }`; `choose_version { keep: true }` parks the loser and says so.

**Done when** the writer's sentence above can be done in one call and every number stays right.

## B2. `changeOpen` — the change line needs its own open, like place and when
`model` · P1 · Friction 15, 17, 23, 86

**The writer said** (of every change line) "I don't know yet — leave it open."

**Today** `create_note` refuses a card with no change line unless the *whole card* is open. Whole-card open silences everything about the card: place, cast, arrows, and the fold ("no fold without a payoff (except 1 open card, not asked)"). A wall built honestly from notes ended with 9 open cards, "asking 1 question", and 17 silenced items. The agent also told the writer a folded card would "keep asking" — it does not, because the guide never joins the two rules.

**Proposal** `changeOpen` on `create_note` / `update_note`, listed like `locationOpen`. The card's other questions stand. Reserve whole-card open for "I don't know if this scene exists / what it is".

## B3. Open items as a list, not one string
`model` · P2 · Friction 39, 42, 79

**Today** A card carrying three undecided things holds them as one phrase: "what changes; one scene or two…; where it pays off…: I don't know yet". `set_open` replaces the whole phrase, so removing one clause means the agent retypes the writer's words; the reply quotes only the new text. The reading can say what the card "would be asked if closed" but not what closes each clause.

**Proposal** `open` is a list of items `{ words, kind? }`; `add_open` / `close_open` by index or text; optional `kind` (change, place, when, cast, payoff, split, order) lets the app say what closes it and close it automatically when the field is set.

## B4. A person who may or may not be in a scene
`model` · P2 · Friction 24

**The writer said** "Where you asked whether Tomás is there: I don't know yet — leave it open."

**Today** Only free text in the card's open words. He is not on the card, and the cast counts and "gone for a third of the story" check cannot see the maybe.

**Proposal** `cast { noteIds, characters, maybe: [names] }`; shown as "Tomás?" on the card; the reading lists it under open and does not count it either way.

## B5. Versions as equals, versions of more than one card, and facts true of both
`model` · P2 · Friction 10, 11, 58, 59

**The writer said** "I have this two ways and I cannot choose yet. Keep both until I know." / "the keys are first seen in the depot scene, either way of it."

**Today**
- `set_alternative` requires a front card, which is in the story, counted and printed. The agent had to ask the writer which goes in front of a pair they had said they could not choose between.
- A version is one card. Version two of the breakdown is two places (the road, the house) — by the app's own rule, two cards.
- A thread refuses a tucked card (A2). A fold and arrow on the pair must be made twice by two mechanisms, unlinked; what `choose_version` then does to the duplicate arrows is unknown.

**Proposal** A version *slot*: a position in the story holding N alternatives, none privileged ("front" becomes "showing", explicitly placement-only, and the reading says "counted as one page, whichever"). An alternative may be a short run of cards. Arrows, folds and threads may attach to the slot, so "either way" is one statement and survives the choice.

## B6. Words on a setup arrow (how it pays off) and on a fold (how it is first seen)
`model` · P2 · Friction 14, 54

**The writer said** "The jar pays off on the last run: he empties it into her hand." / "he counts the fare out of it on the step of the bus. Put that on the wall." / earlier, two versions of a payoff: "he empties it… or she gives it back full."

**Today** A setup arrow says *where*; nothing says *how*. The agent put the payoff into the last card's headline and the first sighting into `plantsWhat`, a label field, where the whole sentence now repeats on every setup line of every reading.

**Proposal** `note` on an arrow (`create_arrow`, `set_arrow_kind` or a new `set_arrow_note`), which may itself be open ("emptied, or given back full"). `plantsHow` beside `plantsWhat`.

## B7. A notes field on a card, for facts about the scene
`model` · P2 · Friction 74

**Today** "The cut is announced… in the first scene" had no home on the scene; it went in the premise. An agent drafting that scene from its card would never see it. A card has headline, change, place, when, cast, fold — nothing for "also true of this scene".

**Proposal** `notes` on a card (free text, shown in `read_pages` and `segment_brief`, not printed in exports).

## B8. Project-level undecided things, and "decided, not yet told"
`model` · P2 · Friction 12, 13, 24

**The writer said** "What is he going to the town for? A hospital visit, a music lesson, or the courthouse… Decide, or leave it." later: "Yes, it is decided, but not yet on the wall." / "Keep the span wherever the wall holds such a thing." / acts, lengths: "I don't know yet — leave it open."

**Today** Film-level open fields: title, logline, premise, target. Nothing for a time span, for acts not decided, for lengths not known, for a fact about a person, or for "decided but withheld". The span went into the premise as a second sentence; the rest went nowhere.

**Proposal**
- `span` on the project/board (text, may be open).
- A project **ledger** of open things not tied to a field: `add_open_question { words, about?: card|person|project, state: undecided|decided-not-told }`, listed by the reading, closed by the writer's word.
- `actsOpen`, so "no groups" can be told from "acts not decided".

## B9. "Not reached yet" between two cards
`model` · P3 · Friction 40

**Today** After four beats were marked: "[empty] Nothing runs between "The day Nuala finds out…" and "The last run…": two turns back to back. Are they one beat, is a scene missing, or is that the pace?" The notes were a list of "scenes I know". The only answer on offer is `leave_question`.

**Proposal** An open *gap*: `set_gap { after, words: "scenes I don't know yet" }`, drawn as a placeholder, listed under open, silencing [empty] and sag questions across it, counted as zero pages and said so.

## B10. Link an open item to a note in the scene text
`model` · P3 · Friction 78

**Today** "How the cut is announced" lives in the card's open words *and* in a `[[…]]` note inside the written scene. Deciding it means remembering to clear both.

**Proposal** An open item can carry an anchor; `write_scene` text may reference it (`[[open: how the cut is announced]]`); closing the item flags the note in `read_pages`.

---

# C. Tools

## C1. `list_open` — everything undecided, in one call
`tool` · P1 · Friction 21, 41, 43, 89

**The writer asked** "What is still open on this wall, and what would close each one? Answer from the wall, not from memory."

**Today** Three calls (`read_wall`, `list_board`, `list_boards`) and a hand merge. `read_wall` omits open words and open places on tucked cards (listed 5 open places of 6). It lists fields first and cards second, so one card appears twice several lines apart. A *blank* place hides inside "(except 1 open card…)".

**Proposal** `list_open` → per card (including tucked and parked), then per project: each open item, whether it is open-by-word or simply blank, and the tool that closes it. No JSON, no records.

## C2. A short "what does the wall want from the writer right now?"
`tool` · P2 · Friction 83

**Today** Confirming that the camera mark was *not* a question took a full `read_wall` (~300 lines).

**Proposal** `list_questions`-style call for the wall: questions only, with kinds and ids. (If `list_questions` is this, its name collides with the writer's help questions — rename one.)

## C3. `set_order`, and `move_scene` on an unwired wall
`tool` · P2 · Friction 31

**The writer said** "The order is: [seven scenes]. Put the wall in that order."

**Today** Six `create_arrow` calls then `organize`, for what was one swap. `move_scene`: "Needs a wall with follows arrows."

**Proposal** `set_order { ids: [...] }` draws/rewires the follows chain in one undo step and reports the resulting order. `move_scene` on an unwired wall wires the row order first, and says so.

## C4. Tidy must be opt-in on `create_note … after` and `move_scene`; unwired cards stay out of chains
`tool` · P1 · Friction 63, 64

**Steps** Wall with a wired chain and one unwired card. `create_note { …, after: X }`.

**Actual** "Wired after … (1 follows arrow removed, 2 drawn), and the wall tidied." Nine cards moved, from two rows to four (a row per beat). The unwired, cut card was slotted into the middle of the chain just wired, so the printed order is: chosen breakdown → *discarded breakdown* → the morning after. The tool description does not mention a layout.

**Proposal** `tidy: false` default for an agent (or `tidy` param); when tidying, unwired cards go to a holding row, never between two wired cards. Reply always states the resulting order around the new card.

## C5. Named presets on `set_target`
`tool` · P3 · Friction 91

**The writer said** "It is a feature." The tool takes pages or minutes only; the agent supplied 120 from the description and had to flag that the writer never said 120.

**Proposal** `set_target { preset: "feature" | "hour" | "half" }`; reply: "Target: a feature (120 pages)".

## C6. `edit_scene` insert mode
`tool` · P3 · Friction 77

**Today** "Add a line after he gets on" = replace sentence X with X + new paragraph; depends on X occurring once.

**Proposal** `edit_scene { id, after: "<text>", insert: "<text>" }` (and `before`).

## C7. `who_is_here`, and presence printed only when it changes
`tool` · P3 · Friction 93, 94, 95

**The writer asked** "Who has this wall open right now?"

**Today** A side-remark in `list_projects`: ""The Last Bus" (working): 1 board(s) · test@test.com · no wall open right now". People and presence share one line; the agent ("an agent, as you", per the on-ramp) is not shown. "no wall open right now — it shows the moment one opens" rode on all ~40 writes and stopped being read.

**Proposal** `who_is_here` → people on the project, who has it open, and the agent. Write tails mention presence only when it changed since the last reply.

## C8. `read_wall` option to include cast and places
`tool` · P3 · Friction 29

**Today** "the cast and the places are list_board's, not the reading's" — reading a wall back to a writer is two calls and a join.

**Proposal** `read_wall { with: ["cast", "places"] }`, prose only.

---

# D. Replies and the reading

## D1. Every write says before → after
`reply` · P2 · Friction 39, 56, 90

`update_note` promises "from what to what". `set_open`, `set_plant`, `set_target`, `set_logline`, `set_premise` do not. `set_target` after an open target replied only "Target is 120 pages" with `targetEighths: 960` — identical to the value stored before, and no word that "half an hour or a feature" was cleared.

**Done when** every write that replaces text or closes an open field quotes the old value and says what it cleared.

## D2. Every reply names the id of everything it made or removed
`reply` · P2 · Friction 61, 65

- `update_thread` tying both ends folded a card, named the fold and drew a setup arrow — the new arrow's id (`9c228bb6…`) appeared only in the next reading's JSON.
- `create_note … after`: "1 follows arrow removed, 2 drawn" — no ids, the removed arrow not named by its cards.

## D3. An honest headline for the reading
`reply` · P1 · Friction 28, 86

**Actual** "checks: 15 run — asking 1 question of 1 kind: empty; 9 cards and 8 fields open by the writer's word, not asked; checked and clean: …" followed by 14 clauses, 6 of them "(except N open cards, not asked)". A nearly empty wall reads as nearly finished.

**Proposal** Lead with: "Asking 1. Open and not asked: 17 (9 cards, 8 fields). Not checked because open: change lines ×9, a fold's payoff ×1, a place ×1, an unwired card ×1." Group the open list by card. "Checked and clean" lists only checks that actually ran on every card.

## D4. `choose_version` says what happened to the kept card
`reply` · P1 · Friction 48, 49

Must state, for `keep: true`: the kept card's rank, whether it is in the order and where, and the page it adds. (Moot if B1 parks it — then say "parked: out of the order, the count and the pages".)

## D5. The camera mark: say what it is, where it is; let it be acknowledged
`reply` · P2 · Friction 72, 75, 81, 82

**The writer asked** "That camera mark on my line — is that a question for me? Do I have to do something about it?"

**Today** `read_pages`: "camera: 1 line it cannot see (knows)" and "◂ knows" in the same register as every other note. Not in `list_words`. Matches verbs only: "She does not know him." is marked; "She has not had him on the bus before." and "School is in the other direction." are not. A silent reply does not say whether the check ran. It can never be acknowledged; `leave_question` does not apply.

**Proposal**
- Wording: "camera (a note, not a question — nothing to do): 1 line says what someone knows".
- `list_words` entry.
- `write_scene` / `edit_scene` always say "camera: none marked (matches knows/feels/thinks/wants only)".
- An acknowledge: `[[camera: ok]]` on the line, or `keep_line`.

## D6. One runtime number to use
`reply` · P2 · Friction 84, 87

**Actual** "about 8 2/8 pages (…); target open… (against 30 it would be 21 6/8 under; against 120, 111 6/8 under); 1 written scene is a sketch, measured under the page it was read as: about 9 pages if it ran to that".

**Proposal** "Runtime: about 8¼ pages (use this). If the 1 sketched scene ran a full page: about 9." Breakdown on its own line, arithmetic that closes (A4).

## D7. Drop action-hints from replies where the action was not asked for
`reply` · P3 · Friction 26

Every `create_note` reply ended "organize lays the wall out along the arrows" — on a wall with no follows arrows, under a direction to leave the order alone. `set_rank`: "organize lays a row per beat." Say it once per session, or only when the wall is actually out of order with its arrows.

---

# E. On-ramp and guide

## E1. Split the guide: holding a connector vs wiring a server
`docs` · P2 · Friction 6

~A quarter of `guide.md` (42 KB) is wiring, shell, batch, `PLOTCODER_ROOT`, the dev app, the file, "tell the user to run `npm run dev`". The on-ramp says skip the doors; the guide opens its tools section with them. An agent with a connector must read all of it to learn it does not apply. Move to `guide-wiring.md`; link it.

## E2. Put "what a treatment should answer" on the on-ramp
`docs` · P2 · Friction 8

The on-ramp never mentions it. The guide mentions it in a bullet under **Cast** and points to `list_workflows`. Add one line to "Call these first": "list_workflows → break-a-treatment holds the twelve questions to ask the writer before building." Give it its own heading in the guide.

## E3. Resolve "make these five first" vs "an emptied account: go straight to new_project"
`docs` · P3 · Friction 5

The agent cannot know the account is empty before calling. Say: "Make the five. On an empty account `read_wall` and `list_board` say so in one line; go to `new_project`."

## E4. Document the rules an agent currently has to discover
`docs` · P1 · Friction 23, 47, 58, 63, 70, 75

Until the fixes land, the guide should state:
- Whole-card open hides the fold's "unpaid" question (and every other question on the card).
- A tucked card cannot join a thread, is not moved by `organize`, and is absent from the reading's open lists.
- `choose_version keep` returns the other card to the story as a live, counted scene.
- `create_note` with `after`/`before` tidies the whole wall.
- Open-place and open-when words print in scene headings.
- The camera check reports in `write_scene` and `read_pages` only, and matches four verbs.
- Born-open cards carry "What changes?" in the change field.

## E5. "Propose them and I will strike" can run either way
`docs` · P3 · Friction 36

`list_workflows` files the phrase under `set_rank`, implying mark-then-strike. The writer meant strike-then-mark. Say: "propose in chat; mark only what survives — or mark and let the writer strike, if they ask for that."

---

# Suggested order

1. **B1 + A3 + A4 + D4** — the parked state and one definition of "in the film". Fixes the length, the order, the script and the counts together.
2. **B2 + A11** — `changeOpen`, no placeholder text. Restores the wall's questions on a wall built from notes.
3. **A2, A8, A9, C4** — false or empty replies and the unasked tidy; each cost a full reading to catch.
4. **C1 + D3** — `list_open` and an honest reading headline.
5. **E4** — document the discovered rules now; delete each line as its fix ships.
6. Everything P2, then P3.

## Not an app issue (for the record)

- Two connectors with identical tool names were attached to the session (`plotcoder` and an opaque-id one). The session used `plotcoder` only. (Friction 1)
- The agent harness's web-fetch summarised `llms.txt` instead of returning it; fetched raw instead. (Friction 3)
