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

## Direction 2: the man's card comes back (entries 23 to 26)

The arrow, then one paragraph inserted by edit_scene; the [unsaid]
question came and went between the two calls.

- [ ] **23 · The wall holds no "where in the scene" for a payoff.**
  *Decided:* the page is the writer's and the agent's; the wall claims
  the scene, not the line. Nothing to build.
- [ ] **24 · The day-one guide does not mention edit_scene.** *Plan:* one
  line in the day-one guide's Pages paragraph — "to change or add one
  line, edit_scene; the whole guide's Pages section has the rest" — so
  a resend of the page is never the first reach.
- [ ] **25 · Whether one insert can carry several paragraphs.** *Plan:*
  the description says a blank line inside `insert` makes two paragraphs.
- [ ] **26 · A two-part direction shows a question between the calls.**
  *Decided against, as pass 1b's 66:* the wall reads the wall as it is.

## Direction 3: the fish knife's first sighting (entries 27 to 30)

The thread's start tied and a line on the page; the wall asks nothing now.

- [ ] **27 · The wall checks a fold's payoff page for the plant's words, and
  not a thread's start page for the thread's.** *Plan for Robert, with R74:*
  a thread's tied ends read the same way — the start's page and the end's
  page against the thread's name — as facts under the threads list, and a
  question when neither lands.
- [ ] **28 · Placement on the page is the agent's.** *Decided, as 23.*
- [ ] **29 · The pages' notes go stale when the wall moves on.** *With pass
  1b's 76:* striking an open line names the pages whose notes carry it;
  tying a thread's end should do the same. *Plan:* update_thread's reply
  names the pages whose notes carry the thread's words, as strike_open_line
  does.
- [ ] **30 · A tied thread gets no distance and no "pays off" line, where a
  setup arrow does.** *Decided by R60's combine rule:* a thread tied at both
  ends between cards that exist is a plant, and the guide says fold it — but
  the first Friday's one fold is the sign's, so the knife stays a thread (a
  card has one fold: R62). *Held for Robert:* the reading's threads line
  could carry the distance ("both ends tied, about 4 pages apart") — it
  already does when both ends are in the film; the "pays off" words on the
  card are the fold's alone.

## Direction 4: the changes read back from the wall (entries 31 to 35)

**The record works through the hosted door:** read_wall opened with "since
anyone last changed this wall: 5 changes by an agent, today 00:57 to
00:59 — …", the agent's own changes in the writer's terms, and it read
them back from that line rather than from memory.

- [ ] **31 · The wall cannot say whether the last agent's door never wrote
  the record or the record was added since.** *With 18:* the guide's
  sentence about where the record begins.
- [ ] **32 · "5 changes" and six lines: one call told as two lines.** *Plan:*
  say "5 changes" and let the lines be lines — or count lines. The count
  is the record's entries (one per tool call); the head could read "5
  calls". Decide the word: "changes" it is, and a line is a thing that
  changed; say "5 changes, 6 things".
- [ ] **33 · A one-line insert and a note struck both read as "rewrote".**
  *Plan:* the describer says "changed a line in "X"" when most of the
  page's lines stand, "rewrote" when they do not, "took a note off" when
  only a [[note]] went. Kernel, with a test.
- [ ] **34 · edit_scene normalised blank lines elsewhere on the page.**
  *Fixed in 0.1.56 by design* for a take-out (the gap closes); an insert
  should not touch the rest. *Check:* the insert path's spacing.
- [ ] **35 · edit_scene's description never says an empty replace removes
  the paragraph.** *Plan:* one clause in the description.
