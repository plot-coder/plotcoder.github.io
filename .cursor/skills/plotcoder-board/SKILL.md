---
name: plotcoder-board
description: >-
  Build and rearrange the PlotCoder storyboard from an agent: cards, groups,
  arrows, beat rank, scene length, and the logline. Use when asked to build or
  rearrange the PlotCoder wall, add beats, size scenes, or change the board —
  instead of simulating mouse drags in a browser.
---

# PlotCoder board

PlotCoder is a storylining wall of cards (post-its). Each card is one **scene**:
a `headline` plus the `change` it causes. Cards also have a `color`, a position
(`x`,`y`), a rotation, a `rank`, and a `length`.

The board holds five kinds of thing:

- **cards** — one scene each.
- **rank** — a card is a `scene` or a `beat`. A beat is one of the 8–15 major
  turns the story hangs on. Rank is carried by the card, never by where it sits.
- **length** — how many pages a card runs. An unsized card is taken to be about
  one page. Like rank, it belongs to the card and never moves it.
- **plants** — the corner is folded: this scene sets something up that must
  pay off later. A setup arrow leaving the card is the payoff.
- **groups** — a named frame around two or more cards: a sequence, a set piece.
- **arrows** — directed links between cards, each with a `kind`: `follows` (what
  comes after what, the default) or `setup` (the tail plants what the head pays
  off).
- **cast** — the roster: every person in the story, one record each with an id.
  A card says who is in the scene by pointing at people in the roster.

Above them all sits the **logline**: the central question, what the story is
arguing. And above the board sits the **project**: an ordered set of boards (a
season's episodes, or a writer's stories) under one name and one premise.

## Use the MCP tools, not the mouse

The repo ships an MCP server (`plotcoder-board`, wired in `.cursor/mcp.json`).
Drive the board through its tools. **Do not** open a browser and fake pointer
drags — the tools and the human UI share one command kernel, so a tool call
lands on the exact same board a person sees.

### Reading

- `list_board` — the logline, the beat/scene counts, the runtime estimate against
  the target, then every **card**, **group**, and **arrow** with its **id**. This
  is the only place ids come from.
- `read_wall` — step 4 of the method. The beats in wall order, the pages of
  scenes between consecutive beats, and the **questions the wall raises**: a run
  out of proportion with the others, a card with no change line, a card no arrow
  touches, two headlines that read like the same scene, a group too long to be
  one sequence, a person in the cast who is on no card, a person gone for more
  than a third of the story, a payoff that comes before its setup on the wall,
  a folded card no setup arrow pays off. It also lists every setup with the
  distance to its payoff. Put the questions to the writer. Do not act on them
  unasked, and do not add an opinion about the number of beats.

### Cards

- `create_note` — add a card. Requires `headline` **and** `change`. Optional
  `color` (yellow, pink, blue, green, orange), `rank`, `pages`, and `x`/`y`.
- `update_note` — change a card's `headline` and/or `change` by `id`.
- `move_note` — set a card's absolute `x`,`y` (top-left, pixels).
- `recolor_note` — change a card's paper `color` by `id`.
- `set_rank` — mark cards `beat` or `scene`. Takes a list of ids.
- `set_length` — how long cards run, in `pages`. Takes a list of ids. Fractions
  are fine (`0.5`); they are stored in eighths of a page.
- `set_plant` — fold or unfold the corner of cards (`plants` true/false). Fold a
  card when the writer says it sets something up; `read_wall` will ask where it
  pays off until a `setup` arrow leaves it.
- `set_location` — where one or more cards happen, as the writer would say it
  ("the piano shop", not "INT. PIANO SHOP"). `create_note` and `update_note`
  take `location` too; `list_board` shows it as `at: …`. No roster of places:
  the same phrase on several cards is one place in the lens.
- `delete_note` — remove a card (also drops its arrows and group membership).

### Cast

- `add_character` — add a person to the roster by `name`. The same name twice is
  refused and the existing record returned; use its id.
- `rename_character` / `remove_character` — by id. Renaming carries to every
  card; removing takes them off every card and leaves the cards.
- `update_character` — write a person's page by id: `looks`, `voice`, `wants`,
  `needs`, `notes`, any subset, all text. `list_board` says which lines each
  person has ("page: looks, wants" or "page: empty"). Looks and voice are what
  a video agent will be handed later, so ask the writer before inventing them.
- `cast` — set who is in one or more cards: `noteIds` plus `characters` (names
  or ids). The list **replaces** the card's cast, so pass everyone in the scene;
  an empty list clears it. A name not in the roster is refused by name — call
  `add_character` first. Do not invent people; ask the writer who is in a scene.

### Pages

- `export_fountain` — the open board as a Fountain screenplay in wall order
  (beats as sections, one scene per card, the scene's text or its change line
  as the body). Pass `path` to write a `.fountain` file.
- `read_pages` — the same script with each card's id beside its heading and
  whether it is measured (written) or estimated. Read it before writing.
- `write_scene` — a card's scene text in Fountain, by id; the card is then
  measured from its lines. Write only scenes the writer asked for.
- `import_fountain` — a `.fountain` file or text onto the open board: scenes
  land on the cards with the same heading in order; unknown scenes become new
  cards; nothing is deleted.
- `page_count` — the board paginated as a script (Letter, Courier 12, 55
  lines, the industry's break rules) with the page each scene starts on.
- `export_fdx` / `import_fdx` — Final Draft's file, out (scene numbers by
  wall order, not locked) and in (the same merge as Fountain in).

### The project

- `set_premise` / `rename_project` — the line above every board's logline, and
  the project's name. `list_boards` shows both.
- `list_reminders` / `add_reminder` / `remove_reminder` — the writer's
  principles. Read them before building or reading a wall; add only what the
  writer asked to keep in front of them.

### Structure

- `apply_template` — lay a structure's named beats on the wall as beat cards
  (`turns` is the house method and the default; also `three-acts`,
  `eight-sequences`, `fifteen-beats`, `story-circle`, or one of the writer's
  own by name). One undo step. Ask the writer which; afterwards there are only
  cards, nothing remembers the template.
- `list_structures` / `save_structure` / `remove_structure` — the writer's own
  structures live on the project: save the open wall's beats as one (reading
  order, headline as the beat, change line as the prompt), list them beside
  the built-in five, remove one by name. Save only when the writer asks.
- `set_logline` — set the board's central question. Empty string clears it.
- `set_target` — target script length in `pages`: 120 feature, 60 hour, 30 half.
- `create_group` — frame two or more cards, with an optional `title`.
- `rename_group` / `ungroup` — by group id. Ungrouping leaves the cards alone.
- `create_arrow` — a directed arrow, `from` → `to`, with an optional `kind`
  (`follows` or `setup`).
- `set_arrow_kind` — change an arrow's kind by id. One arrow per direction, so
  change the kind rather than drawing it again.
- `delete_arrow` — by arrow id. Removes that direction only.
- `organize` — tidy the wall along the arrows: story order from the `follows`
  arrows, a row per beat with the scenes that follow it, groups kept together.
  Pass `noteIds` to tidy only those. Prefer it to moving cards one by one, and
  draw the arrows first — it is the arrows that make the layout right.
- `list_boards` — the project: its name, premise, and every board in order with
  id, name and shape, marking the open one. Ids come from here.
- `open_board` — open another board by id, name, or number. Every card tool
  then works on that board; the writer's wall switches too.
- `new_board` — add an empty board to the project and open it, keeping the
  target. The other boards are untouched. Give it a name.
- `rename_board` — by id, name, or number.
- `delete_board` — remove a board and everything on it. **Cannot be undone**,
  not even from the wall: ask the writer first, say how many cards it holds,
  suggest Save project. The last board of a project cannot be deleted.
- `undo` — take back **your own** last change, newest first. It refuses if the
  board has changed since (the writer moved on), so it never tramples their
  work; they can undo anything from the wall with ⌘Z. Use it when a
  rearrangement did not help: try, `read_wall`, and undo if the reading got
  worse.
- `redo` — put back what you undid, newest first, under the same rule; any
  new change of yours clears what could be redone.

## Workflow

1. **Call `list_board` first.** Use the real `id`s it returns for every move,
   edit, group, or arrow. Never guess ids.
2. Give every card a real `headline` and `change` — not placeholders. A card
   whose change line is empty is a card that has not earned its place.
3. To lay cards out, draw the arrows and call `organize`. Use `move_note` only
   for a card that belongs somewhere the arrows do not say. Cards are 192px;
   leave ~30px gaps for a readable row.
4. Mark the major turns with `set_rank`. Marking a beat never moves it.
5. Leave lengths alone unless you are told one or the card plainly states it (a
   montage, a one-line sting, a long set piece). The estimate is the writer's.

## What the tools will refuse

These are not errors to retry — they mean the board disagrees with you. Read the
reply, call `list_board`, and fix the ids.

- A group needs **two or more cards that exist**. A card can only be in one
  group, so grouping it removes it from its previous frame.
- An arrow cannot point at itself, cannot use an id that is not on the board,
  and the same direction cannot be drawn twice.
- Arrows are **one-way**. `A→B` does not create `B→A`. Draw both if you mean
  both — that is two arrows, and deleting one leaves the other.

## Do not have opinions about beat count, and do not treat page counts as facts

The app deliberately counts beats and says nothing about the number. Do not tell
the user they have too many or too few. Report the count if asked.

The runtime is an **estimate built from guesses**, most of them the default page.
Say "about" when you report it. Never tell a writer their script is too long on
the strength of it.

## Live vs. file

- If the PlotCoder dev app is **running** (`npm run dev`), edits appear on the
  open wall within a second. `list_board` reports "live: app is open".
- If the app is **not running**, tools still work: they read and write
  `.plotcoder/board.json`, and `list_board` reports "from file: app not
  running". The wall catches up the next time the app loads.

If a tool result says the change was "written to file" but you expected it live,
the app is not open. Tell the user to run `npm run dev` if they want to watch
edits appear in real time; the change is already saved either way.

## Not available to agents

- **Scatter** is a UI-layer action with no tool; undo covers it.
- **Sharing a project, signing in, changing the email or password** are the
  writer's decisions at the door; no tool does them.
- **Pan and zoom** are per-viewer state and are deliberately not board data.

## Workflows (R27)

A workflow is what the writer asks for in a sentence; you compose the tools.
`list_workflows` has the six with the tools each composes and the rule to keep:
break a treatment into a wall; read the wall and raise questions (change
nothing); lay a structure over what is here; draft a sequence in Fountain from
its cards; restick the remaining cards after the pages moved; brief a segment
for video. Read `list_reminders` first — they are the house style.

`segment_brief` (R28, first step) briefs one card or a run of cards for a
video tool from what the wall holds. It is text for the writer to approve;
nothing is generated or sent, and no video tool is chosen yet.

## The account door

With `PLOTCODER_EMAIL` and `PLOTCODER_PASSWORD` in your environment — the
writer's own — and no dev server running, every tool works the writer's
project on the account directly, and each change lands on every open wall.
`list_projects` shows what you can work; `open_project` switches;
`new_project` starts an empty one and works it. Files on the project go
through this door too: `add_picture` puts an image on a person's page,
`add_take` files a take on a card or a run, `list_files` shows everything,
`remove_file` takes one away (ask first; it cannot be undone). Prefer the
open app's bridge when it is there; the account door is for when it is not.

## The production half

- `lock_numbers` / `unlock_numbers` — once a draft has gone out, every scene
  keeps its number; new scenes take A-numbers (14A, 14B); Final Draft out
  carries them. Ask the writer first: it is a decision about the document.
- `start_revision` / `end_revision` — a named revision in one of the
  industry's colours; changed lines print in the colour with a star, changed
  cards wear it on the wall. `list_board` says the lock and the revision.
