---
name: plotcoder-board
description: >-
  Build and rearrange the PlotCoder storyboard from an agent: cards, groups,
  arrows, beat rank, scene length, and the logline. Use when asked to build or
  rearrange the PlotCoder wall, add beats, size scenes, or change the board —
  instead of simulating mouse drags in a browser.
---

# PlotCoder board

This is the whole guide; the on-ramp at plotcoder.com/llms.txt is its first
page, and where the two differ, this wins.

PlotCoder serves one method, and its tools follow it:

1. State the **logline**: the central question, what the story is arguing.
2. Mark the **beats**: the 8 to 15 major turns.
3. Fill the space between them with **scene cards**. One card is one scene.
4. **Read the wall**: the run that sags, the setup with no payoff, the person
   who disappears.
5. Only then **write pages**.

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

The server is an npm package, `plotcoder-board`: wire it once, from any
folder, with `claude mcp add plotcoder-board -s user -- npx -y
plotcoder-board@latest` (or the same as a config block), then start the
session again — a server wired from inside a session connects only on the
next one. Inside the repo, `.mcp.json` and `.cursor/mcp.json` wire the
checkout's own server instead (run `npm ci` in it first). Drive the board
through its tools. **Do not** open a browser and fake pointer drags — the
tools and the human UI share one command kernel, so a tool call lands on the
exact same board a person sees. No MCP where you are, or already inside a
session? `npx -y plotcoder-board@latest call <tool> '{json}'` makes one call
from a shell — one server per call, so `undo` and the project `new_project`
or `open_project` chose do not carry to the next call; set `PLOTCODER_PROJECT`
for the calls that need it, or run them as a batch (`call --batch <
calls.jsonl`, one `{"tool", "arguments"}` per line) on one server. The
sign-in is kept between calls in the folder's `.plotcoder`. Hosted, with
nothing installed: `npx -y plotcoder-board@latest serve` puts the same server
on a port, and an MCP client connects with `--transport http` and the
writer's sign-in in a Basic header. `PLOTCODER_ROOT` points the server at the
folder whose wall you mean.

**Call these first, in any order:** `list_words` (the room's words), `read_wall`
(what is here and what it asks — a fresh folder holds a sample wall, Maya and
Tom and the letter, and says so; it is not the writer's), `list_workflows`
(what a writer can ask for), `list_reminders` (the writer's principles) — then
change anything.

### Reading

Three reads, three things: `list_boards` is the **project** (its boards);
`list_board` is **one board's records**; `read_wall` is the **reading** of that
board — what it asks. With no app running, `export_fountain` is the wall in
order as text, the nearest thing to a look at it.

- `list_board` — the logline, the beat/scene counts, the runtime estimate against
  the target, then every **card**, **group**, and **arrow** with its **id**. Ids
  come from here and from the reply of the tool that made the thing.
- `read_wall` — step 4 of the method. The beats in wall order, the pages of
  scenes between consecutive beats, and the **questions the wall raises**: a run
  out of proportion with the others, a card with no change line, a card no arrow
  touches, two headlines that read like the same scene, a group too long to be
  one sequence, a person in the cast who is on no card, a person gone for more
  than a third of the story (and ten pages at least, so a short wall's gaps are
  not disappearances), a payoff that comes before its setup on the wall,
  a folded card no setup arrow pays off, beats back to back with nothing
  between them (a chain of them is one question naming every turn), and cards
  that say no place once any card has one. It also lists every setup with the
  distance to its payoff. The tool's own description carries the same list,
  and a reply names each question's kind. Put the questions to the writer. Do
  not act on them unasked, and do not add an opinion about the number of beats.

### Cards

- `create_note` — add a card. Requires `headline` **and** `change`. Optional
  `color` (yellow, pink, blue, green, orange), `rank`, `pages`, `plants`,
  `location`, `characters` (names; a name not in the cast is added to it), and
  `x`/`y`. The reply names the card's id and what landed. **A scene is one
  place and one stretch of time**: a new place or a new time is a new card,
  which is how a treatment's paragraph splits. A **beat is a whole card** — the
  scene where the turn happens — not a moment inside one; when a treatment's
  "midpoint" spans two scenes, mark the card where the turn lands.
- `update_note` — change a card's `headline` and/or `change` by `id`.
- `move_note` — set a card's absolute `x`,`y` (top-left, pixels).
- `recolor_note` — change a card's paper `color` by `id`.
- `set_rank` — mark cards `beat` or `scene`. Takes a list of ids.
- `set_length` — how long cards run, in `pages`. Takes a list of ids. Fractions
  are fine (`0.5`); they are stored in eighths of a page. A card nobody has
  sized is **unsized** — `list_board` says so — and reads as about a page; a
  card sized at one page is a claim the writer made.
- `set_plant` — fold or unfold the corner of cards (`plants` true/false). Fold a
  card when the writer says it sets something up; `read_wall` will ask where it
  pays off until a `setup` arrow leaves it — or until `later` names another
  board of the project where it pays off (a series plant: `later: "Episode
  two"`, by name, id or number from `list_boards`; `later: ""` forgets it).
  The card then says "pays off in Episode two", and the reading lists it.
- `set_location` — where one or more cards happen, as the writer would say it
  ("the piano shop", not "INT. PIANO SHOP"). `create_note` and `update_note`
  take `location` too; `list_board` shows it as `at: …`. No roster of places:
  the same phrase on several cards is one place in the Cast panel, and the
  app relates no two phrases. A scene that moves through spots of one
  location — the kitchen, the yard, the barn of one farm — is one place:
  name the location. A treatment that names a spot per paragraph is naming
  where the camera is, which may still be one place.
- `delete_note` — remove a card (also drops its arrows and group membership).

### Cast

- `add_character` — add a person to the roster by `name`. The same name twice is
  refused and the existing record returned; use its id.
- `rename_character` / `remove_character` — by id. Renaming carries to every
  card; removing takes them off every card and leaves the cards.
- `read_character` — a person's page back, by id or name: the five lines as
  they stand and the cards they are on. `list_board` says which lines are
  written; this says what they say.
- `update_character` — write a person's page by `id` or `name`: `looks`, `voice`, `wants`,
  `needs`, `notes`, any subset, all text. `list_board` says which lines each
  person has ("page: looks, wants" or "page: empty"). Looks and voice are what
  a video agent will be handed later, so ask the writer before inventing them.
- `cast` — set who is in one or more cards: `noteIds` plus `characters` (names
  or ids). The list **replaces** the card's cast, so pass everyone in the scene;
  an empty list clears it. A name not in the roster is refused by name — call
  `add_character` first. Do not invent people; ask the writer who is in a scene.
  An **unnamed** person in a treatment — "their mother", "the dispatcher" —
  is named by their role: `Dana's mother`, `The dispatcher`. A role is a name
  until the writer gives one; leaving them off the card is the error.
- **Acts** are not a thing the app knows. The wall reads left to right and a
  structure's beats are the act breaks. When a treatment comes in acts, put each
  act's cards in a **group** titled for it (`create_group`, title "Act one"), so
  the break is on the wall without an opinion about beats. When the treatment
  has no act breaks, ask the writer where they fall; never infer them. **Paper
  colour** means nothing to the app; a card from `create_note` is yellow unless
  you pass `color`, so a colour on the wall is always someone's choice.
- **A setup arrow lands on the scene's card.** If the payoff is a moment inside
  a scene, the card is still the scene; never split a scene to give the payoff
  a card of its own.
- **Who is not on the wall.** A person in the treatment who is in no scene
  (a daughter spoken of, a name on a wall) belongs in the **notes** of the
  person they matter to, not the roster — the roster asks about anyone on no
  card. Age, job, a bad knee: `notes` too, unless they are how the person looks
  or sounds.
- **Under target** is reported as plainly as over — a number and "an
  estimate" — never as a verdict either way.
- **What a treatment should answer.** Eleven blind runs ended every build
  with the same questions to the writer. Before you build, check the
  treatment for these, and ask for the ones it leaves open — invent none.
  How long is it? What is the central question, and the series premise?
  Which scenes are the turns? Does it have acts, and where do they break?
  Where does each scene happen? When, where that matters? Who is in each
  scene and what do we call them, and who is only spoken of? What is
  planted, and where does it pay off — "later in the series" counts? Which
  scenes are known to run long or short? What are the project and the board
  called? What must not be invented? `list_workflows` carries the same
  questions with the tool each answer lands in; the writer sees them under
  Reminders.
- **A treatment is cards, one call each.** `import_fountain` is the door for
  pages, not a treatment: a new card takes its headline from the `= synopsis`
  line (else the heading), its place from a forced heading (`.the piano shop`)
  with a synopsis, its text from the body and its change line from the body's
  first sentence — and a card with text is measured from it, so a one-line
  body makes a card of a few lines, not a page. Rank, the fold, the cast,
  arrows and acts do not travel. Thirteen `create_note` calls with
  `characters`, `location`, `rank` and `plants` is the right size for a
  treatment.

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
- `move_scene` — move a card to another place in the story: `after` one
  card's id, or `before` one. It rewires the follows arrows (what pointed at
  the card points at what it pointed at; the card lands between the target
  and what followed it) and tidies the wall, as one step `undo` takes back
  whole. A person does this by dragging in the outline.
- `organize` — tidy the wall along the arrows: story order from the `follows`
  arrows, a row per beat with the scenes that follow it, groups kept together.
  Pass `noteIds` to tidy only those. Prefer it to moving cards one by one, and
  draw the arrows first — it is the arrows that make the layout right.
- `list_boards` — the project: its name, premise, and every board in order with
  id, name and shape, marking the open one. Ids come from here.
- `open_board` — open another board by id, name, or number (a number is fine
  as a number). Every card tool
  then works on that board; the writer's wall switches too.
- `new_board` — add an empty board to the project and open it, keeping the
  target. The other boards are untouched. Give it a name.
- `rename_board` — by id, name, or number.
- `delete_board` — remove a board and everything on it. **Cannot be undone**,
  not even from the wall: ask the writer first, say how many cards it holds,
  suggest Save project. The last board of a project cannot be deleted.
- `undo` — take back **your own** last change, newest first, as many steps as
  you made. It refuses if the board has changed since (the writer moved on),
  so it never tramples their work; they can undo anything from the wall with ⌘Z. Use it when a
  rearrangement did not help: try, `read_wall`, and undo if the reading got
  worse.
- `redo` — put back what you undid, newest first, under the same rule; any
  new change of yours clears what could be redone.

## Workflow

1. **Start as the on-ramp says** — `list_words`, `read_wall`, `list_workflows`,
   `list_reminders` — then `list_board` before any move, edit, group, or arrow,
   and use the real `id`s it returns. Never guess ids.
2. Give every card a real `headline` and `change` — not placeholders. A card
   whose change line is empty is a card that has not earned its place.
3. To lay cards out, draw the arrows and call `organize`. A straight
   sequence needs its `follows` arrows too: they are what `organize` lays
   the wall out along, and the wall asks about a card no arrow touches. Use `move_note` only
   for a card that belongs somewhere the arrows do not say. Cards are 192px;
   leave ~30px gaps for a readable row.
4. Mark the major turns with `set_rank`. Marking a beat never moves it.
5. Give lengths when the writer asks for your estimate or the card plainly
   states one; otherwise leave them (a montage, a one-line sting, a long set
   piece). A duration in the treatment — "it takes a day" — is not a length.
   The estimate is the writer's.

## What the tools will refuse

These are not errors to retry — they mean the board disagrees with you. Read the
reply, call `list_board`, and fix the ids.

- A group needs **two or more cards that exist**. A card can only be in one
  group, so grouping it removes it from its previous frame.
- An arrow cannot point at itself, cannot use an id that is not on the board,
  and the same direction cannot be drawn twice.
- Arrows are **one-way**. `A→B` does not create `B→A`. Draw both if you mean
  both — that is two arrows, and deleting one leaves the other.

## The words, when the writer asks

PlotCoder's words — beat, logline, change line, the folded corner, eighths —
are the room's, and many writers are not from the room. `list_words` gives
every one in a sentence, the app's own meaning; use those sentences rather
than a dictionary's, so the app and you never explain a word two ways.

## Do not have opinions about beat count, and do not treat page counts as facts

The app deliberately counts beats and says nothing about the number. Do not tell
the user they have too many or too few. Report the count if asked. Marking the
turns a treatment plainly makes is reading the treatment, not an opinion
about the number: mark them, say which you marked and why, and let the
writer strike or add.

The runtime is an **estimate built from guesses**, most of them the default page.
Say "about" when you report it. Never tell a writer their script is too long on
the strength of it.

## The account, the app, or the file

Every read of the wall or the project says which it read, on its first line.

- **The account** (`PLOTCODER_EMAIL` and `PLOTCODER_PASSWORD` set): "the
  account, as you@…, working "Low Season"". Every change lands on every open
  wall of that project. The account wins over an open app.
- **The open app** (`npm run dev`, no sign-in): "the open app at
  http://localhost:5173". Edits appear on the wall within a second.
- **The file** (neither): "the file at …/.plotcoder/board.json; no app
  running". Tools still work; the wall catches up the next time the app loads
  from that folder.

If a tool result says the change was "written to file" but you expected it live,
the app is not open. Tell the user to run `npm run dev` if they want to watch
edits appear in real time; the change is already saved either way.

## Not available to agents

- **Scatter** (shuffling the cards' positions on the wall) is a mouse action with no tool; undo covers it.
- **Sharing a project, signing in, changing the email or password** are the
  writer's decisions at the door; no tool does them.
- **Pan and zoom** are per-viewer state and are deliberately not board data.

## Workflows

A workflow is what the writer asks for in a sentence; you compose the tools.
`list_workflows` has the six with the tools each composes and the rule to keep:
break a treatment into a wall; read the wall and raise questions (change
nothing); lay a structure over what is here; draft a sequence in Fountain from
its cards; restick the remaining cards after the pages moved; brief a segment
for video. Read `list_reminders` first — they are the house style.

`segment_brief` briefs one card or a run of cards for a
video tool from what the wall holds. It is text for the writer to approve;
nothing is generated or sent, and no video tool is chosen yet.

## The account door

With `PLOTCODER_EMAIL` and `PLOTCODER_PASSWORD` in your environment — the
writer's own — and no dev server running, every tool works the writer's
project on the account directly, and each change lands on every open wall.
`list_projects` shows what you can work; `open_project` (`project`: a name
or id from the list) switches; `new_project` (`name`, and `pages` or
`minutes` for its target) starts an empty one and works it. With the sign-in
set, the account is the wall even when a dev app is open on the machine;
without `PLOTCODER_PROJECT` the server works the project touched most
recently, and every reply's first line names it. **No account yet?**
`claim_account` makes one with the writer's email and a password — ask the
writer for both and never invent a password; say what was made (the email,
that the wall here is its first project, that they sign in at the wordmark);
one account per writer, so a taken address is refused, not varied. The
on-ramp in the app and at plotcoder.com/llms.txt says the same. Files on the project go
through this door too: `add_picture` puts an image on a person's page,
`add_take` files a take on a card or a run, `list_files` shows everything,
`remove_file` takes one away (ask first; it cannot be undone). **The
account is the writer's from your side too:** `delete_project` (by name or
id; the owner's own only), `empty_account` (every project they own; shared
ones stay) and `delete_account` (the sign-in itself; the door shuts) — each
says what would go until it is called with `confirm: true`, and none can be
undone, so ask the writer first and `export_project` first. **A project as a
file:** `export_project` writes the file Save project writes (a path, or the
reply's JSON), through any door; `import_project` opens one — onto the
account as a new project, or replacing the folder's project after asking. The
sign-in set is you saying which wall you mean, so it wins over an open app.

## The production half

- `lock_numbers` / `unlock_numbers` — once a draft has gone out, every scene
  keeps its number; new scenes take A-numbers (14A, 14B); Final Draft out
  carries them. Ask the writer first: it is a decision about the document.
- `start_revision` / `end_revision` — a named revision in one of the
  industry's colours; changed lines print in the colour with a star, changed
  cards wear it on the wall. `list_board` says the lock and the revision.
