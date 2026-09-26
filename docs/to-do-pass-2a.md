# Pass 2a — the working list

Pass 2a ran 2026-09-26, night (`blind-runs/pass-2a-report.md`): the driving
session as the person, on "Last Orders" as pass 1b left it, in the app on
the dev server at 0.1.55. Twenty-two entries. Everything a person sees
needs a mockup and Robert's word before it is built (CLAUDE.md), so this
list is mostly plans; the two that are not are fixed.

## Fixed (2026-09-26, night)

- [x] **5, 15 · The "Not decided yet, about the film" list prints over the
  cards and takes their taps.** *Fixed:* the list stands on a sheet of its
  own paper, above the wall, so no tap meant for a card reaches the
  lines. (A person sees it; the change is the smallest that removes the
  fault, looked at in the app; the mockup for the rest is below.)
- [x] **22 · Two counts of what is open, and neither says which.** *Fixed:*
  the readout's asks line adds "· 14 open, by your word" beside the
  questions, with a label saying where the opens live; the head's button
  keeps its count of the film's lines.

## Planned, for Robert's word — one mockup page, `docs/mockups/pass-2a-the-morning-after.html`

- [ ] **4, 19, 21 · What the agent did last, what it is waiting on, and
  which turns were whose.** The largest finding, and goal 2's: the wall
  has no memory of a session. *Plan:* a short record on the project — the
  last session's changes by card, in the person's terms, and its open
  questions — shown as "Since you looked" at the head of Read the wall and
  in `read_wall`'s since line for a fresh agent. The record is written by
  the kernel's commands (D18 keeps viewport out; this is board data), with
  who (the account or "an agent") and when. Goal 3 needs the same record.
- [ ] **1, 12, 13 · The wall the agent leaves is not laid out, Organize
  leaves a wide run overlapping, and a full card has no paper to drag
  by.** *Plan:* Organize wraps a run wider than the view onto a second
  row; a card's top band is always paper (a drag handle); an agent's
  `organize` runs after `create_cards` unless told not to.
- [ ] **7 · Which scenes are written is not on the wall.** *Plan:* a mark
  on the card's foot — "written · 5/8" — beside the page number.
- [ ] **17 · A card set aside goes somewhere unseen.** *Plan:* it slides to
  the row beneath the story where Organize keeps such cards, and the wall
  says so for a moment.
- [ ] **16 · The corner shows nothing until tapped.** *Plan:* a faint
  corner mark on every card, as the fold's flap is, so the picker has a
  handle.
- [ ] **18 · The end of a scene's text is not where the end key goes.**
  *Plan:* Pages keeps the caret's paragraph in view and the end key goes
  to the end of the scene, not the box.
- [ ] **2, 3 · The premise is cut off at the top; the film is nine cards to
  read.** *Plan:* the premise wraps to two lines or opens on tap.
- [ ] **9, 20 · Does the agent see what I change?** *Plan:* with the record
  above, the account sheet says when an agent last read the wall.

## Every entry, accounted for

1 → planned · 2, 3 → planned · 4 → planned · 5 → fixed · 6 → nothing to do (the sheet reads well) · 7 → planned · 8 → the file was a copy, nothing to do · 9 → planned · 10 → with 15 · 11 → with 1 · 12 → planned · 13 → planned · 14 → nothing to do · 15 → fixed · 16 → planned · 17 → planned · 18 → planned · 19 → planned with 4 · 20 → planned · 21 → planned with 4 · 22 → fixed.
