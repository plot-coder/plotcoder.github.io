# Pass 2b — the working list

Pass 2b ran 2026-09-27 (`blind-runs/prompt.md`, jumping in for the agent:
a fresh agent picks up "Last Orders" from the wall alone, through the
desktop connector, the door at 0.1.57 with the record of a session). Kept
as the run goes; every entry accounted for as it arrives.

## The first reading (entries 1 to 15)

The wall told it the film, what is decided and open, and which scenes are
written; it could not tell it what the agent before did or was waiting
on — the pass's question, and R76's reason — because **the connector's
tool list was the one the desktop app cached when the connector was
added, at 0.1.55: `read_record` and `hand_over` were not in it** (4),
though the door was at 0.1.57 and the guide named both. And the hosted
door's session memory is the connector's, not the agent's: a fresh agent
opened with "since your last reading: 2 changes" that were the last
agent's (6).

- [ ] **4 · The desktop app keeps a connector's tool list from the
  handshake it made when the connector was added or last refreshed;** a
  release that adds a tool is not seen until the connector is turned off
  and on. *Held for Robert, outside the app:* the on-ramp can say so ("if
  the guide names a tool your session does not show, turn the connector
  off and on: the app keeps the list it first saw"). Plan: one sentence
  on the on-ramp and in the guide's doors section.
- [ ] **6 · "since your last reading" on a first reading.** The hosted
  door's session is the connector's `mcp-session-id`, which the desktop
  app keeps across its own sessions, so a fresh agent inherits the last
  agent's session memory: its last reading, its since-line. *Plan:* the
  door's session memory keys on the agent, not the connector — the
  record (R76) already says who and when from the wall itself; the
  since-line should read from the record when the session store's
  reading is older than the record's last entry by another hand, or say
  "a reading before this session's". A design for Robert.
- [ ] **1, 2 · The on-ramp fetched as a summary; the day-one guide cut at
  41 KB by the agent's page tool.** *Held:* the agent's tools, not the
  app's; the on-ramp already says to make the first calls while it
  downloads.
- [ ] **3 · Tools show as names only until loaded one by one.** As pass
  1b's 2; the on-ramp's sentence is there. Nothing more to do.
- [ ] **5 · Presence is a second call.** *Decided:* list_projects says so
  on purpose (round twenty-four); who_is_here is the tool.
- [ ] **7 · "A sketch: under the page it was read as" without the
  threshold in the reply.** *Plan:* the reading's made-of line says the
  page each sketch was read as, once.
- [ ] **8 · The set-aside card's written state is nowhere stated.** *Plan:*
  the set-aside list in read_wall says "unwritten" or "written" per card.
- [ ] **9 · The pages' bracketed notes speak in the first person and are
  unattributed.** *Held:* a [[note]] is the writer's aside by the guide's
  rule; an agent's note reads as the writer's. The record (R76) now says
  who wrote a page; a note inside it is still anyone's. A design for
  Robert: whether a note carries a hand.
- [ ] **10 · The only timestamps are list_boards' last-changed and a file
  name; the leave is dated to the day.** *Fixed by R76* once the connector
  sees it; the leave's date could carry the hour.
- [ ] **11 · Mairead's page holds "the fish knife is his" in notes and
  "her husband: I don't know yet" open.** The last agent's doing; the wall
  keeps both without saying which came later. *Held:* with 9 — a hand
  and a time on a person's page lines.
- [ ] **12 · The [unsaid] question and the leave's reason reconcile by
  hand.** *Decided:* words, not sense, as the head says.
- [ ] **13 · The length to say takes a second call once every scene is
  written.** *Plan:* read_wall's how-long line carries page_count's
  number when the script is whole, so one call says it.
- [ ] **14 · list_questions sits beside the wall tools and is about the
  Help sheet.** *Plan:* rename to `list_help_questions`, or move the
  description's first words to say "the Help sheet's questions".
- [ ] **15 · "No want on the page" cannot say whether the writer declined
  or nobody asked.** *Decided:* blank is nobody's word (D21); the record
  will show whether a page was ever changed.

## Direction 1: what the agent before did (entries 16 to 22)

The agent rebuilt the night from the export file's timestamps by hand,
found the record empty and the hand-over null, and found the hosted
door's undo stack was the last agent's.

- [ ] **16 · The hosted door's undo stack is shared with the agent before:**
  undo's preview named the last agent's `set_text`, and had the board not
  changed since, an undo would have taken back their work. *With 6:* the
  door's session is the connector's, kept by the desktop app across its
  own sessions. *Plan for Robert:* a session that begins with a fresh
  agent — the door cannot tell agents apart behind one connector, so the
  undo trail and the since-line should expire when the wall was last
  changed by another hand (the record says), or the on-ramp says "your
  undo is the connector's: it may hold the last agent's changes".
- [ ] **17 · The undo preview names "set_text", not the page.** *Fixed in
  0.1.54* for new changes; the stored trail was the old door's. Nothing
  more to do.
- [ ] **18 · The export carries `record: []` and `handOver: null`, the
  fields the guide promises, empty.** The record began at 0.1.57, after
  every change on this wall; the pass's head says so. Once the connector
  is refreshed, the tools show. *Held:* the guide could say "the record
  begins with the release that brought it; a wall worked before it has
  none".
- [ ] **19 · No tool reports timestamps.** *Fixed by R76* (the record
  carries when), once the connector sees `read_record`; `list_boards`'s
  last-changed line stands meanwhile.
- [ ] **20 · Two pages carry a doubled blank line where a note was taken
  out.** *Fixed in 0.1.56* (edit_scene closes the gap) for edits after
  it; these two were made before. Nothing more to do.
- [ ] **21 · `undecidedPage: true` on the project, unexplained in the
  export.** *Plan:* the export's reply names the field once ("the last
  page prints; set_title_page turns it off").
- [ ] **22 · export_project inline: the reply did not say no file was
  written.** *Plan:* the inline reply says "no file kept on the account".
