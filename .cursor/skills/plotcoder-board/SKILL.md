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
- **groups** — a named frame around two or more cards: a sequence, a set piece.
- **arrows** — directed links between cards: what follows what, what sets up what.
- **cast** — the roster: every person in the story, one record each with an id.
  A card says who is in the scene by pointing at people in the roster.

Above them all sits the **logline**: the central question, what the story is
arguing.

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
  than a third of the story. Put the questions to the writer. Do not act on them
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
- `delete_note` — remove a card (also drops its arrows and group membership).

### Cast

- `add_character` — add a person to the roster by `name`. The same name twice is
  refused and the existing record returned; use its id.
- `rename_character` / `remove_character` — by id. Renaming carries to every
  card; removing takes them off every card and leaves the cards.
- `cast` — set who is in one or more cards: `noteIds` plus `characters` (names
  or ids). The list **replaces** the card's cast, so pass everyone in the scene;
  an empty list clears it. A name not in the roster is refused by name — call
  `add_character` first. Do not invent people; ask the writer who is in a scene.

### Structure

- `set_logline` — set the board's central question. Empty string clears it.
- `set_target` — target script length in `pages`: 120 feature, 60 hour, 30 half.
- `create_group` — frame two or more cards, with an optional `title`.
- `rename_group` / `ungroup` — by group id. Ungrouping leaves the cards alone.
- `create_arrow` — a directed arrow, `from` → `to`.
- `delete_arrow` — by arrow id. Removes that direction only.

## Workflow

1. **Call `list_board` first.** Use the real `id`s it returns for every move,
   edit, group, or arrow. Never guess ids.
2. Give every card a real `headline` and `change` — not placeholders. A card
   whose change line is empty is a card that has not earned its place.
3. To lay cards out, `move_note` each one. Cards are 192px; leave ~30px gaps for
   a readable row.
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

- **Organize** and **Scatter** are UI-layer layout actions, not kernel commands.
  Lay cards out with `move_note` instead.
- The **series premise** and **Reminders** live in browser storage, not in the
  board record, so no tool can reach them.
- **Pan and zoom** are per-viewer state and are deliberately not board data.
