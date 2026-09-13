# PlotCoder Requirements

Living product requirements for PlotCoder. This file is the source of truth for what we are building and why. Update it whenever Robert states a new requirement, changes a decision, or we notice two tools should be combined or cut.

Other agents: read this file before reviewing or adding code. Treat **Confirmed** items as constraints. Treat **Proposed** and **Open** items as discussion, not commitments. Prefer challenging the design against these requirements over inventing new scope.

---

## How we use this file

1. Robert states a need while we build.
2. We add it here as a numbered requirement with date, status, and the reason.
3. Periodically we review the list and ask: should two tools be one? Is this requirement still true? Is there a simpler way?
4. Other agents review against this document and write their perspective in [Reviewer notes](#reviewer-notes-other-agents).

Status values: `confirmed` · `proposed` · `open` · `dropped`

---

## Product

**Name:** PlotCoder  
**Domain:** [plotcoder.com](https://plotcoder.com)  
**Kind of app:** Storylining app — a digital corkboard for breaking and rearranging plot before writing the script.

PlotCoder is for screenwriters who work the way rooms work: one card, one change, then rearrange the wall until the spine works. It is not a Final Draft replacement. It is the board you use to string plot together, then (later) a set of tools around that board.

---

## Who it is for

- Primary: screenwriters building features, TV episodes, and shorts.
- First user: Robert, using the real app as we invent it.
- Later: other writers, possibly more than one person on a board.

---

## Confirmed decisions

These came from Robert. Do not quietly reverse them.

| ID | Decision | Date |
| --- | --- | --- |
| D1 | Product category is a **storylining app** (digital corkboard / beat board), not a screenplay formatter. ⚠️ **Second half superseded by D22** (2026-09-12): pages are now in scope, eventually. The first half still holds — the wall comes first and stays the centre. | 2026-09-12 |
| D2 | Ship first as a **web page**, then turn it into a **progressive web app**. | 2026-09-12 |
| D3 | Backend is **Supabase** (Postgres, auth, later realtime if needed). | 2026-09-12 |
| D4 | Public site and app live at **plotcoder.com**, DNS on **Cloudflare**, source on **GitHub Pages** at [plot-coder/plotcoder.github.io](https://github.com/plot-coder/plotcoder.github.io). | 2026-09-12 |
| D5 | We build in the open by **doing the project together**. Requirements go in this file so we can reflect and so other agents can review. | 2026-09-12 |
| D6 | The app chrome is a **white or black canvas** plus a bottom-right **general bar**. | 2026-09-12 |
| D7 | Theme follows a **daily clock**: light at 8:00 a.m., dark at 8:00 p.m., local time. A manual switch can override until the next clock boundary. | 2026-09-12 |
| D8 | **Reminders** open from a top-right button into a modal. Users can add their own. | 2026-09-12 |
| D9 | **Persistence:** use **localStorage now**. Add **Supabase later**. Do not build another backend in between. New user data should use a record shape we can copy into Postgres. | 2026-09-12 |
| D10 | A **transfer control** (up-down arrow) sits to the right of Reminders. It opens a modal to **save** (download) or **open** (upload) the localStorage project. | 2026-09-12 |
| D11 | **Edit vs move:** tap the words to type; drag the paper to move. Double-click and long-press are not the required edit gestures. | 2026-09-12 |
| D12 | Cards can be **grouped**. Mechanism is proposed (lasso → named frame), not locked until Robert picks it. | 2026-09-12 |
| D13 | Cards can have **directed arrows** between them. A→B and B→A are two arrows, not one double-headed line. | 2026-09-12 |
| D14 | A card has a **user-chosen paper color** from the pad (yellow, pink, blue, green, orange). | 2026-09-12 |
| D15 | The board is an **unbounded wall**. The window is a viewport onto it that you can **pan and zoom**. A wall that only holds what fits on screen is not a wall. | 2026-09-12 |
| D16 | The story's argument is held at **two levels**: a **series premise** for the whole project, and a **central question (logline)** per board. A feature uses only the second. Answers open question 18. | 2026-09-12 |
| D17 | The **board** owns the central question (it goes through the kernel, so agents and the project file carry it). The **project** owns the series premise, on its own `plotcoder.*` key beside Reminders — it outlives any one board, so copying it into every episode would leave no owner when they disagree. | 2026-09-12 |
| D18 | The **viewport is per-viewer and is never persisted**. It stays out of `BoardState`, the saved project file, and later Postgres. Reopening a board does not restore where you were looking — press Fit. Answers open question 20. | 2026-09-12 |
| D19 | **Zoom range is 15% to 250%.** 15% holds a 53-card feature with room to spare, which is the job; a whole season is a different object and would need its own view, not more zoom. Answers open question 22. | 2026-09-12 |
| D20 | A beat is **rank carried by the card, not position on the wall**. The arrangement stays free. A spine may later be something **Organize** can arrange *into* — a view — but never the data model, because a model that owns position means you can never put a card somewhere it does not belong, and then it is not a wall. Answers open question 15; chosen after mocking both (P14). | 2026-09-12 |
| D22 | **PlotCoder aims to hold the pages too, eventually.** Supersedes the second half of D1. The long-term aim is to replace Final Draft rather than feed it. This does **not** reorder the work: R23 still says pages come last, and that is now more important, not less — a formatter built before the wall reads right would be a worse Final Draft with none of the reason to switch. Answers open questions 1 and 4. | 2026-09-12 |
| D23 | **Length is measured in eighths of a page**, the unit a production breakdown uses and the unit Final Draft's Outline Editor already works in. Chosen so that today's *estimate* and tomorrow's *measurement* share one unit: when real pages exist (D22), they replace the estimate without a migration or a change of meaning. | 2026-09-12 |
| D21 | The app **counts beats and stays quiet**. It shows the number and passes no judgement — no nudge at 5, no warning at 30. The 8-to-15 range is a guide the writer holds, not a rule the app enforces. Answers open question 16. | 2026-09-12 |

---

## Requirements

Add new items at the bottom of this list. Do not renumber. If a requirement dies, mark it `dropped` and say why.

### R1 — Digital corkboard

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** The core tool is a board of movable cards used to string a plot together, in the spirit of Post-it / index-card storylining.
- **Why:** That is how Robert wants to work, and how professional rooms break story.
- **Notes:** A card should represent a scene or beat, not a slugline. Exact card fields are still open.

### R2 — Tools, not one monolith on day one

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** PlotCoder will grow as a set of tools that help string plot together. We may later combine tools if this file shows they overlap.
- **Why:** Build by using it. Keep the option to merge or split as real use teaches us.
- **Reflection prompt:** Before adding a new tool, check whether an existing one already covers the job.

### R3 — Web first, PWA later

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** The app must run as a normal website first. It must be structured so it can become an installable PWA without a rewrite.
- **Why:** Fast to use while we invent it; later, usable on a phone or offline like a real writers’ tool.

### R4 — Supabase as the system of record

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** Supabase is the intended system of record (Postgres, auth, later realtime). We are **not** wiring it yet. Until then, user data lives in `localStorage`. When we add Supabase, migrate those records; do not invent a second custom backend.
- **Why:** Robert chose Supabase, and confirmed localStorage first so we can keep building without accounts.

### R5 — Requirements file is part of the product process

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** This markdown file is updated as Robert creates requirements. It is the document other agents use to review the work and give a second opinion.
- **Why:** So we can reflect, combine tools when we should, and not lose the “why” in the code.

### R6 — White or black canvas

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** The app background is a canvas: white in light mode, black in dark mode. No gray page chrome around it. The canvas is the working surface; tools sit on it.
- **Why:** Robert wants the product to feel like a board, not a website with panels.

### R7 — General bar

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** Shared app controls live in the **general bar**, bottom-right. It can collapse and expand as we add items to it. The first item is the dark/light switch.
- **Why:** One home for global controls so they do not scatter as tools arrive.
- **Notes:** Future items (new board, settings, account) should be considered for this bar before inventing a second toolbar.

### R8 — Theme switch in the general bar

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** Dark mode and light mode are switched from the general bar. That control is part of the bar, not a separate floating widget.
- **Why:** The bar is the place for things that apply to the whole app.

### R9 — Automatic theme at 8:00 a.m. and 8:00 p.m.

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** Every day, local time, the canvas becomes light at 8:00 a.m. and dark at 8:00 p.m. The general-bar switch can change the theme immediately. A manual choice lasts only until the next 8:00 a.m. or 8:00 p.m. boundary, then the clock takes over again.
- **Why:** The room should set itself for daytime writing and nighttime writing without a setting to babysit.
- **Notes:** Uses the viewer’s local timezone. Does not follow the OS light/dark setting.

### R10 — Reminders modal

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** A **Reminders** button sits at the top right. Clicking it opens a modal of craft reminders. The first six are the story/character/structure/dialogue/camera/readability notes. The user can add more.
- **Why:** Keep the principles on the wall while writing, without putting them on the canvas.
- **Notes:** This is a dedicated control, not a general-bar item. Reminders are writing craft, not app settings.

### R11 — Reminder persistence

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** Added reminders must survive closing the tab. Store them in `localStorage` (`plotcoder.reminders`) now. When Supabase is added, move the same `{ id, title, body, builtIn, createdAt }` records into Postgres.
- **Why:** Robert confirmed localStorage now, Supabase later (D9).
- **Notes:** `localStorage` is per browser and per device. It does not sync phones and laptops.

### R12 — Save and open project

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** To the right of Reminders, an up-down arrow opens a modal. **Save project** downloads all `plotcoder.*` localStorage keys as a JSON file. **Open project** uploads that file and replaces the current localStorage project, then reloads.
- **Why:** localStorage does not sync. A file is how a user carries a project between computers until Supabase exists.
- **Notes:** The file is `{ app: "plotcoder", version: 1, exportedAt, storage }`. Only `plotcoder.*` keys are written. This is the same data we will later put in Supabase.

### R13 — Edit and move a note

- **Status:** confirmed
- **Date:** 2026-09-12
- **Statement:** Tap the **headline** or **change** line to type in place. Drag the **paper** (the empty margin or top strip) to move the card. First tap may select the card (outline). Tap the canvas or press Escape to stop editing.
- **Why:** The wall must both write and rearrange. Double-click fails on phones. Click-and-hold fights drag, which is the main gesture.
- **Notes:** Desktop may also double-click the card to focus the headline as a shortcut. Long-press may later open a menu (delete, more). Neither is required to edit. Color has its own control (R16).

### R14 — Group cards

- **Status:** **confirmed — mechanism locked** 2026-09-12 (P6 as built; answers open question 12)
- **Date:** 2026-09-12
- **Statement:** The user can group cards so a sequence, set piece, or cluster moves and reads as one unit. Cards stay visible; grouping is not a folder you open.
- **Why:** Rooms rubber-band a run of beats. Forty loose notes hide the sequences.
- **Proposed mechanism (P6):** Drag on empty canvas to lasso. With two or more selected, **Group** (general bar or a small selection chip) wraps them in a named frame. Drag the frame to move all. Drag a card out to leave. Edit the frame title (e.g. “Midpoint,” “Heist”). Do not auto-group by proximity.
- **Later, not now:** stacking one card on another (alternates for the same slot). That is a different meaning than a sequence frame.
- **Notes:** Groups are the same objects as cards, plus a parent. Do not invent a second “beat sheet” model.

### R15 — Arrows between cards

- **Status:** **confirmed — draw gesture locked** 2026-09-12 (P8 as built; answers open question 13)
- **Date:** 2026-09-12
- **Statement:** The user can draw an arrow from one card to another to show what comes after what. Arrows are **directed**. Drawing A→B does not create B→A. The user may also draw B→A, so two arrows can run opposite ways between the same pair. That is two objects, not one two-headed line.
- **Why:** Sequence is not only left-to-right position. Loops and mutual cause are real in story (“they keep triggering each other”).
- **Proposed draw (P8):** A small outbound handle on a card (visible when the card is selected or hovered). Drag from that handle onto another card to create A→B. Repeat the other way for B→A. Opposite arrows sit on **offset paths** so both heads stay readable. Click an arrow to select it; delete removes that direction only. Arrows stick to cards when cards move, organize, or group.
- **Notes:** An arrow is not a group. Organize still uses reading order unless we later add “organize along arrows.” Do not auto-create the reverse. No unlabeled spaghetti: if we later need a label on an arrow, that is a new requirement.

### R16 — Change a card’s paper color

- **Status:** **confirmed — gesture locked** 2026-09-12 (P10 as built; answers open question 14)
- **Date:** 2026-09-12
- **Statement:** The user can change a card’s paper color. Color is a property of the card, not a canvas setting. The five pad colors are yellow, pink, blue, green, and orange. They stay paper on both black and white canvases.
- **Why:** Rooms color a storyline, a character, or a tone. A random pad color is not enough once the wall is real work.
- **Proposed gesture (P10):** A small stacked-paper tab on the card (visible on hover or select, like the arrow handle). Click it to open the five swatches on that card. Click a swatch to set the color. If two or more cards are selected and you recolor one of them, the whole selection changes. Do not put color in the general bar. Do not require long-press or double-click.
- **Notes:** Meaning of a color (B-story, character, act) stays with the writer. We are not locking a legend yet.

### R17 — Agent command surface

- **Status:** **built** 2026-09-12 (P11 as built; mechanism locked)
- **Date:** 2026-09-12
- **Statement:** An agent or robot (including this assistant) can create cards and move things around without driving the mouse. The same operations a human does by hand — new note, move, recolor, edit, delete — are available as callable commands, and they land on the same board a human sees.
- **Why:** Robert wants to build the wall with an agent, not only by dragging paper. If the agent and the human edit through different code paths they will drift.
- **Proposed mechanism (P11):** One command kernel that both the human UI and the agent call. Three doors into it: the human gestures, a `window.plotcoder` API on the page, and an MCP server in the repo. A workspace board file lets commands work with the app closed.
- **As built:** thirteen tools, covering every board verb a person has — `list_board`; cards (`create_note`, `update_note`, `move_note`, `recolor_note`, `set_rank`, `delete_note`); structure (`set_logline`, `create_group`, `rename_group`, `ungroup`, `create_arrow`, `delete_arrow`). Verified end to end by building a nine-card wall with beats, a named group and three arrows through the live bridge, with nothing faked.
- **Deliberately not exposed:** Organize and Scatter (UI-layer layout, not kernel commands), the series premise and Reminders (browser storage, not board data), and pan/zoom (per-viewer, D18).
- **Refusals name their cause.** A tool that reports success on a rejected command teaches the agent the board is in a state it is not, so `create_arrow` distinguishes a self-link from an unknown id from a duplicate, and `create_group` names the ids that were not on the board. An agent that is told what is wrong fixes its input; an agent told "it failed" retries the same call.
- **Notes:** The agent must not fake pointer drags; it calls commands.

### R18 — The method the tools serve

- **Status:** proposed
- **Date:** 2026-09-12
- **Statement:** PlotCoder supports a specific order of work. (1) State the **logline / central question** — what the story is arguing. (2) Find the **beats** — 8 to 15 major turns (inciting incident, midpoint, lowest point, climax). (3) Fill the space between them with **scene cards**; one card is one scene. (4) **Read the wall** — look for a sagging Act 2, a missing setup, a character who disappears, two scenes that do the same job. (5) **Only then write pages** — or write one sequence, then restick the remaining cards.
- **Why:** Robert works this way. Recording the method makes it testable as a product: every feature below exists to serve one of the five steps, and a feature that serves none of them has to argue for itself.
- **Notes:** The order is a default, not a cage. Step 5 loops back to step 3 — that is the point of "restick the remaining cards." R19–R23 are the five steps as requirements.

### R19 — Logline / central question

- **Status:** **built** 2026-09-12
- **Date:** 2026-09-12
- **Statement:** A board has one logline: the central question, what the story is arguing. It belongs to the board, not to a card. It stays visible while working rather than living inside a modal you have to remember to open. Above it, the project may hold a **series premise** shared by every board in it (D16, D17).
- **Why:** It is the thing every other decision gets checked against. Off the wall, it stops being checked.
- **As built:**
  - A centred strip at the top of the screen. It is **screen chrome, not board content** — it holds still while the wall pans and zooms under it, so the question stays readable at any zoom.
  - Editing uses the R13/D11 gesture: tap the words and type. Empty shows the question itself in italic — "What is this story arguing?" — so the placeholder is how you discover the feature. A seeded board ships with it blank for the same reason.
  - The series premise is hidden until it holds something or you ask for it, because a feature has no series above it.
  - Hidden below 60rem of width: there is no room between the wordmark and the top-right buttons, and overlapping them would be worse than omitting it.
- **Migration:** `BoardState` gained its first non-list field. `isBoardState` was deliberately **left unchanged** so no board that was valid yesterday is invalid today; shape is repaired by a new `normalizeState`, run at every load boundary (localStorage, the dev bridge, the MCP server, an opened project file). A pre-R19 board opens and gains an empty logline rather than being rejected. Covered by tests.
- **Notes:** An empty premise removes its key entirely, so it leaves no trace in a saved project.

### R20 — Beats

- **Status:** **built** 2026-09-12
- **Date:** 2026-09-12
- **Statement:** Some cards are **beats**: the 8 to 15 major turns. A beat is a card with a different **rank**, not a different kind of object and not a second document.
- **Why:** Forty equal rectangles have no spine. The turns are what the rest hangs on.
- **As built:**
  - `rank` is `"scene"` or `"beat"` and lives on the card. Marking a beat **never moves it** (D20) — there is a test and a browser check pinning that, because the whole point of choosing the free wall is that meaning is not carried by position.
  - Shown in the paper, never the colour (P13): a heavy top bar and a bolder headline. The bar is 14px, which renders at ~6px when a feature board is zoomed to Fit — you read structure while standing back, so a hairline would vanish exactly when it is needed.
  - Marked from a small control at the card's bottom-right, opposite the colour tab. Marking one card of a multi-card selection marks the whole selection, matching how recolour already behaves.
  - The general bar shows **"N beats · M scenes"** and nothing else (D21). The app does not name the canonical turns either — the writer titles them.
- **Migration:** cards written before R20 have no rank. `normalizeState` makes them **scenes**, because a beat is something you mark deliberately, so the default has to claim nothing. Second use of the pattern established by R19.
- **Notes:** R14 and the combine log both forbid a separate beat-sheet model; this honours that. Still open: nothing. Question 16 is answered by D21.

### R21 — Scene cards

- **Status:** **satisfied** 2026-09-12 — by R20, with no code of its own
- **Date:** 2026-09-12
- **Statement:** The rest of the cards are **scenes**. One card is one scene. Scenes fill the space between beats.
- **Why:** It is the unit the writer actually moves, and it keeps a card honest — if it needs two cards it is two scenes.
- **Resolution:** "One card is one scene" was already true — every card on the wall is a scene card, and now every card says so. "Between" resolved as **neither** of the two options originally offered: not spatial (D20 rejected the spine as the model) and **not a parent link either**. A scene is simply a card that is not a beat; the ordering is the wall itself. If a writer wants a beat to own a set of scenes, R14 groups are already that mechanism, and the combine log says not to add a second one.
- **Notes:** Deliberately no `parentBeat` field. Adding one would create an ownership graph that has to be kept true while cards move, for a relationship the wall already shows. Revisit only if "read the wall" (R22) turns out to need it.

### R22 — Read the wall

- **Status:** proposed
- **Date:** 2026-09-12
- **Statement:** The app helps the writer find what is wrong with the board: an act that sags, a setup with no payoff, a character who disappears for a stretch, two scenes doing the same job.
- **Why:** This is the step no other tool takes for the writer. Final Draft's reports count scenes and speeches for a production office; nobody answers "why does Act 2 feel long" at 2 a.m.
- **Notes:** Impossible until cards carry meaning the app can read — rank (R20), characters (P15), typed arrows (P16). Today a card is a headline, a change line, and a colour whose meaning R16 deliberately leaves to the writer, so **the board cannot currently tell you anything you did not already know.** It must raise questions, never auto-fix. Proposed home is the Reminders modal grown up (P17), not a new panel.

### R23 — Pages come last

- **Status:** proposed
- **Date:** 2026-09-12
- **Statement:** Writing pages happens after the wall reads right. **PlotCoder will eventually be where it happens** (D22, 2026-09-12) — but not before the wall earns it.
- **Why:** The whole method is "earn the structure before you spend the pages." That is also the product order: a formatter built before the wall reads right would just be a worse Final Draft with none of the reason to switch.
- **Route:** **Fountain** first — a plain-text screenplay format that gets real, paginated pages for a fraction of the cost of `.fdx`. Then `.fdx` round-trip, which is the actual moat: studios, agencies and production offices expect Final Draft's file, and a tool that cannot hand one over does not get used on a paid job.
- **Known depth:** industry pagination is a standards problem, not a rendering problem — page-break rules, `(MORE)` and `(CONT'D)`, dual dialogue, scene numbering, revision marks. It is unglamorous and it is exactly where Final Draft's thirty-year lead lives. Do not start it early and do not underestimate it.
- **Notes:** Card length (R25) is the first step on this road: an estimate in the same unit real pages will later be measured in (D23).

### R25 — A card has a length

- **Status:** built
- **Date:** 2026-09-12
- **Statement:** A card carries an **estimated length** — how much screen time it will take — and the board carries a **target length**. The wall can then say how long the story runs and where the runtime is going.
- **Why:** Step 4 of the method is "look for a **sagging** Act 2." Sagging is a claim about **proportion**: too much runtime between two turns. Today a card is a card, so forty of them say nothing about pages and the board physically cannot answer the first question the method asks. This is the missing ingredient, and it is cheaper than characters (P15) or typed arrows (P16).
- **Unit:** eighths of a page (D23) — what a production breakdown uses, and what Final Draft's Outline Editor already measures in. Today's estimate and tomorrow's measured page (D22) share one unit.
- **What it unlocks:** the distance between consecutive beats, in pages. That is the sag detector, and it needs **no act model** — beats (R20) are the turns and the wall gives the order. "Twenty-two pages between beat 4 and beat 5, four pages between beat 7 and beat 8" is a real reading of a real wall.
- **Notes:** Proportion is robust to a wrong default in a way that a runtime total is not: if every card is one page, proportion is still card distribution, which is a signal writers already eyeball. The estimate sharpens as the outliers get sized.

### R24 — The wall is bigger than the window

- **Status:** **built** 2026-09-12 (P18 as built)
- **Date:** 2026-09-12
- **Statement:** The board is an unbounded surface. The window shows part of it. The user can **pan** to reach any part of the wall and **zoom out** to see the whole thing at once. No card can ever become unreachable.
- **Why:** Measured on v0.1.0 with a feature-length board — 13 beats plus 40 scene cards, the scale R18's method actually implies — then pressed Organize on a 1440×900 laptop. **16 of the 53 cards were visible and the other 37 were unreachable.** Laid-out content ran 3,162px tall against a 900px viewport, the lowest card sat at y=2970, and `.note-board` is `position: absolute; inset: 0; overflow: hidden` with `document.scrollHeight` equal to the viewport height. No scroll, no pan, no zoom. Organize itself is what pushes cards off the wall, and you cannot drag back a card you cannot see.
- **Blocks:** R20–R22 all assume a wall that holds the cards. R22 ("read the wall") is impossible in the most literal sense at 30% visibility. P14 cannot even be honestly mocked — 13 beats in a row is 2,860px wide, so a spine does not fit on a laptop screen.
- **Notes:** The **viewport is not board data.** Pan and zoom are per-viewer, per-device state and must stay out of the kernel's `BoardState`, or they will end up in the project file and later in Postgres, which D9 says is for user data. Two writers on one board (open question 5) should not share a scroll position.
- **Cost note:** The work is not the transform, it is that every pointer gesture has to convert screen coordinates to board coordinates — card drag, lasso, arrow draw, group drag. That set only grows, so this is cheaper now than after the method features land. **Confirmed in the build:** the transform was an afternoon; the coordinate conversion was the whole job.
- **As built:** the same 53-card board now fits 53 of 53 with nothing stranded. Zoom 15%–250% (D19), viewport never persisted (D18), and drag-on-empty-canvas still lassos rather than pans.

---

## Proposed (not yet confirmed)

These were recommended in conversation. They are defaults until Robert says otherwise.

| ID | Proposal | Why it is only proposed |
| --- | --- | --- |
| P1 | Language: **TypeScript** | Strong fit for web + PWA + Supabase. Robert agreed it was “a pretty good idea,” not a hard lock. |
| P2 | App shell: **Vite + React** | Best ecosystem for boards, drag-and-drop, and PWA. SvelteKit is an alternative. |
| P3 | Do **not** start with Next.js | A logged-in tool + later PWA is simpler as a client app. Revisit if we need SEO marketing pages in the same repo. |
| P4 | Hosting path: GitHub Pages now; revisit if the app outgrows static hosting (auth, SPA routing, env secrets). | Pages was chosen for the public site. A Vite SPA on Pages can work; Supabase holds data. |
| P5 | Post-it **mockup**: paper-colored cards (headline + change), free on the canvas, **New note** in the general bar. Not persisted; not the locked feature yet. | Visual pass before we confirm card requirements. |
| P6 | **Grouping mechanism:** lasso on empty canvas → named frame that moves as one. Cards can be pulled out. No magnetic clustering. Stack-on-drop is a later, separate idea. | Robert asked for grouping; this is the recommended mechanism, not locked. |
| P7 | **Organize mockup:** a general-bar **Organize** button tidies cards into reading order (left to right, top to bottom). Named groups stay together as blocks. **Scatter** restores the previous free positions. If two or more cards are selected, organize only that selection. Cards stay draggable after. | Visual pass of “neaten the wall,” not a locked layout religion. |
| P8 | **Arrow draw:** drag from a card’s outbound handle onto another card. A→B and B→A are separate, offset arrows. | Mechanism for R15; mocked on the board. |
| P9 | **General bar layers:** closed is a left chevron. That opens a row of standalone marks (theme, new note, organize, group/scatter when relevant, then an up chevron) — no circular buttons. The up chevron opens the tall labeled panel. Collapse walks back one step. Everyday default is the button row. | Refines R7; mocked. Icons are still being judged. |
| P10 | **Color tab:** stacked-paper mark on the card opens five swatches. Selection of two or more paints all of them. | Mechanism for R16; mocked. |
| P11 | **[Built 2026-09-12 as R17.]** **Agent command surface — one kernel, three doors.** A DOM-free command kernel (`src/board/reducer.js`) owns the board records and is the only thing that mutates them. The React app, a `window.plotcoder` API, and an MCP server (`scripts/plotcoder-mcp.mjs`, wired in `.cursor/mcp.json`) all call it. State mirrors to `localStorage` (so Save/Open still works) and, on localhost, to `.plotcoder/board.json` via a Vite dev bridge so an agent can read/write the board with the app open (live via SSE) or closed (file). Now covers cards, rank, logline, groups and arrows (R17). | Mechanism for R17; implemented as a first cut. |
| P12 | ~~**Logline strip:** a thin always-visible line along the top of the canvas. Click the words to edit in place, same gesture as a card (R13). Empty state shows the question itself — "What is this story arguing?" — rather than a blank field.~~ | **Built 2026-09-12** as R19. Centred between the wordmark and the top-right buttons, and hidden below 60rem where there is no room for all three. |
| P13 | ~~**Card rank shown in the paper, not the colour:** a beat card differs by size, weight, or a marked edge. Colour stays the writer's own legend.~~ | **Built 2026-09-12** as R20: a 14px top bar and a bolder headline, colour untouched. The mockup confirmed it reads at Fit zoom on a 53-card board and on beats of every colour. |
| P14 | ~~**Two layouts to mock and compare.** (a) **Spine** (b) **Rank on the free wall**.~~ | **Decided 2026-09-12: the free wall** (D20), after mocking both. One part of (b) was *not* adopted: the "parent link". See R21 — a scene is just a card that is not a beat, and groups already provide ownership if it is ever wanted. |
| P15 | **Characters as card data:** a small tag list on a card for who is in the scene. Feeds the "character who disappears" check. | Needs a prior decision: is a character a free-typed string per card, or a board-level roster you maintain? See open question 17. |
| P16 | **Typed arrows:** an arrow can carry a type, the first being **setup → payoff**. Untyped "what comes after what" stays the default. | Extends R15, which already anticipated that a label on an arrow would be a new requirement. Feeds the "missing setup" check in R22. |
| P17 | **Read the wall is Reminders grown up:** the same modal gains a second half. Top is the craft principles as today; below, those principles checked against your actual board. Not a new panel. | Combines R10 and R22 instead of adding a tool. See the combine log. |
| P18 | **Pan and zoom mechanism:** the board content sits on one transformed layer (`translate` + `scale`). Trackpad two-finger scroll pans; pinch or ctrl-wheel zooms toward the pointer; space-drag and middle-drag pan for mouse users. Drag on empty canvas stays the lasso (R14) — panning never steals it. A **Fit** control in the general bar frames every card at once: standing back from the corkboard, which is the literal gesture R22 is named after. | Mechanism for R24 / D15. Zoom range and whether the view persists across reloads are still open. |

---

## Open questions

Answer these in this file when we decide. Do not hide decisions only in chat.

1. ~~What is the first tool besides “the board”?~~ **Answered 2026-09-12:** the logline (R19), beats (R20) and the agent surface (R17) were first; next is card **length** (R25) feeding **read the wall** (R22).
2. Feature board vs TV episode board first — or one board that can do both?
3. What belongs on a card besides headline, change, and paper color (want, conflict, character, a locked color legend)? *(Candidates now proposed: a beat/scene rank (R20), characters (P15).)*
4. ~~Is PlotCoder only the board, or will it later include a story bible, fountain/script draft, or export to Final Draft?~~ **Answered 2026-09-12: it goes all the way** (D22). The wall first, then pages. Export is the stepping stone, not the destination.
5. Single-player first, or plan for two people on one board from the start (Supabase Realtime)?
6. Should `plotcoder.com` be the app, with a small marketing page, or a marketing page plus `app.plotcoder.com`?
7. Any structure method baked in (Save the Cat, eight sequences, three acts), or method-agnostic cards? *(Robert's method sketch (R18) leans to a **light** method — named major turns, beats ranked above scenes — rather than a branded template. Not locked.)*
8. What else belongs in the general bar besides theme, and in what order?
9. Should a manual theme choice survive the next 8:00 a.m. / 8:00 p.m. boundary? Current decision: no, the clock wins.
10. ~~When should reminders move from localStorage to Supabase?~~ **Decided (D9):** localStorage now, Supabase later. Move reminders when we add accounts, using the same record shape.
11. ~~How do you edit a note?~~ **Decided (D11 / R13):** tap the words; drag the paper.
12. ~~Confirm grouping mechanism: named frame after lasso (P6), stack-on-drop, or both?~~ **Answered 2026-09-12: lasso then Group, as built.** Stack-on-drop is not being added.
13. ~~Confirm arrow draw: outbound handle (P8), or another gesture?~~ **Answered 2026-09-12: the outbound handle, as built.**
14. ~~Confirm color tab (P10), or another place to change paper color?~~ **Answered 2026-09-12: the tab on the card, as built.**
15. ~~Beat **spine** or beat **rank on the free wall** (P14)?~~ **Answered 2026-09-12: rank on the free wall** (D20), after mocking both on a 53-card feature. See the combine log for what the mockup showed.
16. ~~Does the app have an opinion about the 8-to-15 beat count?~~ **Answered 2026-09-12: it counts and stays quiet** (D21).
17. Is a character a free-typed tag on a card, or a board-level roster you maintain (P15)?
18. ~~Does the logline belong to the **board** or to a **project**, if a project later holds more than one board (a season of episodes)?~~ **Answered 2026-09-12: both** (D16, D17). The board owns the central question; the project owns the series premise above it.
19. ~~Do beats and scenes share one z-order and one Organize, or does ranking change what Organize does?~~ **Closed 2026-09-12: not a separate question.** It is decided by question 15. If the spine wins, Organize must lay scenes under their beat; if rank-on-the-free-wall wins, Organize does not change. Do not decide it on its own.
20. ~~Should the pan/zoom view survive a reload, and should Save project carry it?~~ **Answered 2026-09-12: no** (D18). Built that way; the lean became the decision.
21. Organize picks its row width from `window.innerWidth` (capped at 920px). With zoom, the same board organizes differently on a laptop and a monitor. Should the row width become a fixed board-space constant instead?
22. ~~How far out should zoom go — far enough to read 53 cards, or far enough for a whole season?~~ **Answered 2026-09-12: 15% to 250%** (D19). Far enough for a feature; a season is a different object, not more zoom.

---

## Combine / simplify log

Use this when two requirements or tools overlap. Other agents should add rows if they see a merge we missed.

| Date | Observation | Decision |
| --- | --- | --- |
| 2026-09-12 | Board, beat sheet, and scene list are often the same objects in different views. | Open. Do not build three separate data models until we have used one board. |
| 2026-09-12 | Theme switch could have been its own widget. | Combined into the general bar as the first item (R7 + R8). |
| 2026-09-12 | Reminders could have lived in the general bar. | Kept as a top-right button. Craft notes are not app settings; the bar stays for chrome like theme. |
| 2026-09-12 | Save/open could have lived in the general bar. | Kept beside Reminders. It is how you carry the whole local project, not a canvas setting. |
| 2026-09-12 | Groups vs act lanes vs stacks vs a separate beat-sheet tool. | Same cards. A group is a named frame around notes, not a new document type. Stacks (alternates) are a later verb. |
| 2026-09-12 | Arrows were deferred as “flowchart.” Robert wants them. | Add directed arrows as their own objects. They do not replace groups or organize. A two-way link is two arrows. |
| 2026-09-12 | Card color could have been a general-bar control or a long-press menu. | Color lives on the card. The bar is canvas chrome. Long-press is not required. |
| 2026-09-12 | The agent could have driven the board by simulating mouse drags in a browser. | Rejected. Human gestures and agent tools both call one command kernel. Faked pointer drags are brittle and drift from the real state. |
| 2026-09-12 | Tests could have covered the React components and drag gestures too. | Rejected for now. The kernel is where the logic lives and two of its three doors have no visual feedback, so that is what is tested. Component tests would be rewritten every time a gesture changes. |
| 2026-09-12 | Reminders (R10) puts craft principles on the wall. Read the wall (R22) checks those same principles against the actual board. One is a poster; the other is the poster looking back. | Proposed combine (P17): one tool at two levels of intelligence. Do not build a second diagnostics panel next to the reminders modal. |
| 2026-09-12 | Beats and scenes could be two card types, two boards, or one card plus a rank. | Proposed: one card plus a rank (R20/R21). Reaffirms R14 and the earlier row above — still no second beat-sheet model, and groups already provide a parent mechanism. |
| 2026-09-12 | **Second Final Draft pass, this time against current sources rather than memory** (current version is 13, not 14). Two findings. (1) The **Story Map** is the one feature worth taking: beats sit against a real page axis with a target script length, measured in eighths, and the page markers go red over target. It is the closest thing on the market to reading a wall, and the page axis is *why* it works — hence R25. (2) Independent 2026 reviews of the category say Final Draft's Beat Board and Scrivener's corkboard are the best digital implementations and "still lose to a wall, because a wall is bigger than a monitor and that is the whole advantage" — which is verbatim the argument behind D15, shipped the same day. | Take the page axis (R25). Skip Structure Lines: they bind colour to structure and R16 leaves colour's meaning to the writer. Skip the production half as before. A **Navigator-style filter** (see the wall by character) stays on the table behind P15. |
| 2026-09-12 | **The "read the wall" niche is no longer unclaimed.** This morning's row said the gap worth owning was that Final Draft can count your scenes but cannot read your wall back to you. Still true of Final Draft — but a product called Storyflow now sells exactly that: canvas beat sheets with AI that reads the whole board and flags weak beats. | Correction to the earlier row, recorded rather than quietly dropped. R22 is still the right thing to build; the differentiators are Robert's method, the agent surface (R17), and the unbounded wall. Do not plan as if nobody else is there. |
| 2026-09-12 | Structure templates (Save the Cat, Hero's Journey, Story Circle) are table stakes across this category — Plottr's framework library, Save the Cat's entire product. | Still open question 7. Note that R18's method **is** a template, so the choice is whether to offer other people's as well, not whether to have one. |
| 2026-09-12 | Measured the board against Final Draft. It has a beat board, a story map with a real page axis, structure templates, an outline editor, index cards two-way bound to the script, a navigator that filters by character and location, and reports. | Skip the production half entirely (revision colours, locked pages, scene numbering, tagging, cast reports, FDX authoring) — D1 says we are not a formatter. The story half is what R18–R23 aim at. The gap worth owning is the last one: Final Draft can count your scenes but it cannot read your wall back to you. |
| 2026-09-12 | Pan/zoom could have been stored on the board so a board reopens where you left it. | Rejected. The viewport is per-viewer, per-device state and stays out of `BoardState` — otherwise it lands in the project file and later in Postgres, and two writers on one board would fight over one scroll position. |
| 2026-09-12 | Panning could have used drag-on-empty-canvas, the most obvious gesture. | Rejected. That gesture is already the lasso (R14). Trackpad scroll, pinch, space-drag and middle-drag all pan without taking anything away. |
| 2026-09-12 | Everything on the board today is spatial and untyped — a card is two lines and a colour, and R16 leaves colour's meaning to the writer. | Named as the root constraint behind R22: the board cannot diagnose what it cannot read. Any "read the wall" feature has to be preceded by giving cards machine-readable meaning (rank, characters, typed arrows), not by cleverer heuristics over the current shape. **Refined same day:** too strong as stated. A first slice of R22 needs no new fields — a card with an empty "what changes" line, a card with no arrows in or out, near-duplicate headlines, a group too large to be a sequence. The *structural* checks (sagging Act 2, a character who disappears) still need rank and characters. |
| 2026-09-12 | The logline strip and the cards both needed tap-the-words-to-type, and the card version was ~50 lines of subtle caret-safe contentEditable handling. | Combined into one `EditableText` component rather than copied. Two copies of caret and debounce logic drift, and D11 says the gesture is the same in both places, so it should be one implementation. |
| 2026-09-12 | Mocked P14 both ways on a 53-card feature before choosing. The spine put the beats in a row across the top; the free wall kept story order and marked beats by weight. | Chose the free wall (D20). Three things the mockup showed that the argument had not: (1) the spine makes the rank marker **redundant** — you know the top row are beats because of where they sit, which means the meaning lives in the arrangement and is lost the moment you rearrange; (2) the spine is wider, so Fit stands you back at 43% against the free wall's 52% — it costs a zoom level to read the same story, and worsens with more beats; (3) locking scenes into columns under their beat turns the wall into a table with a ragged bottom that reads as a bar chart of scene counts, which is an accident, not a signal. Also exposed a wording problem: R21 says scenes go **between** beats, but the spine renders that as **below** — a beat owning a column. Different claims. |
| 2026-09-12 | R20 (beats) and R21 (scene cards) read as two features, but R21's core claim — one card is one scene — is already true: every card on the wall today is a scene card. | They are **one change plus one decision**, not two features. The change is giving a card a rank; the decision is what "scenes fill the space between beats" means, which is P14 and still open. Do not schedule them as separate pieces of work, and do not build a scene-card feature that is really just the rank feature wearing a second name. |
| 2026-09-12 | The series premise could have been another field on `BoardState`, which is where the central question went. | Rejected (D17). A premise outlives any one board; putting it in the board record copies it into every episode of a season and leaves no owner when the copies disagree. It sits beside Reminders on its own `plotcoder.*` key, which Save/Open already sweeps up. |

---

## Technical context (for implementers)

- Repo: `https://github.com/plot-coder/plotcoder.github.io`
- Custom domain: `plotcoder.com` (www CNAME to `plot-coder.github.io`)
- Cloudflare zone for Atlas/Robert account; nameservers `clay.ns.cloudflare.com`, `nelci.ns.cloudflare.com`
- App shell is a Vite + React + TypeScript client (proposed stack, now in use for the canvas and general bar)
- GitHub Pages no longer serves the repo root. `.github/workflows/deploy.yml` runs on every push to `main`, installs with `npm ci`, runs `npm test`, builds, and publishes `dist/` through the Pages Actions deploy (the Pages `build_type` is `workflow`, not `legacy`). The custom domain lives in `public/CNAME`, which Vite copies into `dist/`; there is deliberately no `CNAME` at the repo root any more, so there is one source of truth. A failing test blocks the deploy.
- Board state flows through one kernel: `src/board/reducer.js` (plain ESM + `reducer.d.ts` so it runs in the browser and in Node). `src/board/store.ts` is the browser store (localStorage + dev bridge + `window.plotcoder`). The Vite dev bridge (`vite.config.ts`) serves `/__plotcoder/board` and `/__plotcoder/events` and mirrors `.plotcoder/board.json` (gitignored) on localhost only — it never ships to Pages. The MCP server is `scripts/plotcoder-mcp.mjs` (run by `node`, wired in `.cursor/mcp.json`); it applies the same kernel and writes the live bridge when the app is open, or the file when it is closed. See the `plotcoder-board` skill in `.cursor/skills/`.

- **Adding a field to a card** (first done for rank, R20). Same shape as the board-level case below: `normalizeState` fills it in for cards written before it existed, and the default must be the value that claims nothing. `countRanks` lives in the kernel so the general bar and the MCP summary count the same way rather than each rolling their own.
- **Adding a board-level field** (first done for the logline, R19). `BoardState` is now `{ logline, notes, groups, arrows }`. The pattern to follow: leave `isBoardState` alone so nothing that used to load stops loading, and repair shape in `normalizeState`, which every load boundary calls — `loadLocal` in `src/board/store.ts`, the bridge adopt path, and both read paths in the MCP server. The browser mirrors the field to its own key (`plotcoder.logline`), matching the existing one-key-per-list layout.
- **Project-level data that is not board data** goes in its own `plotcoder.*` key with a small store, the way `src/reminderStore.ts` and `src/premiseStore.ts` do. Save/Open needs no wiring for it: `listProjectKeys` sweeps every `plotcoder.*` key. Such data is invisible to the MCP server and the board file, which only carry `BoardState`.
- `src/EditableText.tsx` is the one caret-safe editable line, used by both the cards and the logline strip. The words are uncontrolled — React never renders them as children — so it cannot rewrite text out from under the caret mid-keystroke; the value is pushed in only while the field is unfocused. Use it for any new tap-the-words-to-type field (D11) rather than writing another `contentEditable`.
- Pan and zoom live in `src/viewport.ts` — pure functions over a `{ x, y, scale }` view, with no React and no DOM. `NoteBoard` renders one `.board-layer` carrying `translate(x, y) scale(s)`, and every gesture runs its screen coordinates through `toBoard` before touching a card. Scroll and drag pan in **opposite** directions for the same delta, so both signs are pinned in `panByScroll` / `panByDrag` rather than left in an event handler where they are trivially easy to swap.
- Tests run on Vitest: `npm test` (single pass) or `npm run test:watch`. They cover the DOM-free half only — the kernel (`src/board/reducer.test.ts`), the pure helpers (`src/arrowGeometry.test.ts`, `src/organizeLayout.test.ts`, `src/projectStore.test.ts`, `src/viewport.test.ts`), and the MCP server (`scripts/plotcoder-mcp.test.mjs`, which spawns it against a temp board file and a fake dev bridge). No browser, no jsdom. Config is `vitest.config.ts`; `tsc -b` typechecks the `.ts` tests and Vite leaves them out of the bundle.

When hosting no longer fits Pages, record the change here.

---

## Reviewer notes (other agents)

Add a dated heading and your verdict. Challenge requirements, don’t just affirm them. Call out where tools should be combined, where scope is too big, and where a requirement is underspecified.

### Template

```md
### YYYY-MM-DD — <agent or reviewer name>

- Verdict:
- What is underspecified:
- What I would combine or cut:
- Risks:
```

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-09-12 | Created this file from the first PlotCoder conversation: storylining app, web→PWA, Supabase, Cloudflare + GitHub Pages, living requirements. |
| 2026-09-12 | Added R6–R9: black/white canvas, collapsible general bar, theme switch, auto light at 8:00 a.m. and dark at 8:00 p.m. |
| 2026-09-12 | Added R10–R11: reminders modal, add-your-own, localStorage now / Supabase later. |
| 2026-09-12 | Locked D9: localStorage now, Supabase later. No other backend in between. |
| 2026-09-12 | Added R12 / D10: up-down arrow next to Reminders to save or open a localStorage project file. |
| 2026-09-12 | Added P5: on-canvas post-it mockup and New note button, before locking the feature. |
| 2026-09-12 | Added R13 / D11: tap words to edit, drag paper to move. |
| 2026-09-12 | Added R14 / D12 / P6: grouping is required; named frame after lasso is the proposed mechanism. |
| 2026-09-12 | Added an on-canvas grouping mockup: lasso, Group chip, named frame, ungroup, drag-out. |
| 2026-09-12 | Added P7 organize mockup: reading-order tidy plus Scatter in the general bar. |
| 2026-09-12 | Added R15 / D13 / P8: directed arrows between cards; A→B and B→A are two arrows. |
| 2026-09-12 | Mocked P8 on the board: handle-drag arrows, offset two-way paths, click to remove. |
| 2026-09-12 | Added P9: two-layer general bar (closed → ink buttons → tall panel) with verb icons. |
| 2026-09-12 | Added R16 / D14 / P10: user-chosen paper color via a tab on the card. |
| 2026-09-12 | Added R17 / P11: agent command surface. One kernel, three doors (human UI, `window.plotcoder`, MCP server), mirrored to localStorage and a localhost board file. Implemented as a first cut; notes-only MCP tools. |
| 2026-09-12 | Full feature pass with screenshots. Fixed two bugs: cards painted over the modals (card z-indexes escaped into the page), and `list_board` always reported the app as closed. |
| 2026-09-12 | Added a test suite (Vitest, `npm test`) over the DOM-free half: kernel reducer, arrow geometry, organize layout, project files, and the MCP server offline and against a fake bridge. UI gestures stay untested on purpose while the mockup moves. |
| 2026-09-12 | Released v0.1.0. plotcoder.com now serves the built app instead of the placeholder landing page: Pages switched from serving the repo root to a build-and-deploy workflow, and the domain moved from the root `CNAME` to `public/CNAME`. Open item: GitHub has not yet issued the HTTPS certificate, so the site is HTTP-only. |
| 2026-09-12 | Loaded a feature-length board (13 beats + 40 scenes) onto v0.1.0 and pressed Organize: 16 of 53 cards visible, 37 unreachable, no pan/zoom/scroll anywhere. Added D15 / R24 / P18 — the wall is bigger than the window. This blocks R20–R22 and even blocks mocking P14, so it goes before the method work. |
| 2026-09-12 | Built R24: pan and zoom on an unbounded wall, plus **Fit** in the general bar. Same 53-card board now fits 53 of 53 with nothing stranded. Card drag, lasso, group drag and arrows all convert through board space. Found and fixed one real bug on the way — trackpad scroll panned the wrong way — and moved both pan signs into tested functions. |
| 2026-09-12 | Closed three open questions without new work: 20 and 22 were already answered by how pan/zoom was built (D18, D19), and 19 turned out not to be its own question — it is decided by question 15. Logged that R20 and R21 are one change plus one decision, not two features. |
| 2026-09-12 | Built R19, step 1 of the method: the logline strip. Answered open question 18 with **both** levels (D16, D17) — the board owns the central question, the project owns the series premise. `BoardState` gained its first non-list field; `isBoardState` was left untouched and a new `normalizeState` repairs old boards at every load boundary, so a pre-R19 board still opens. Agents get `set_logline` and see the logline in `list_board`. The cards and the strip now share one `EditableText` component instead of two copies of caret-safe contentEditable. |
| 2026-09-12 | Finished R17. Agents had cards but no way to express a relationship between them, so groups and arrows got tools: `create_group`, `rename_group`, `ungroup`, `create_arrow`, `delete_arrow`. `list_board` now reports groups and arrows **with their ids** — without that the other tools are unusable. Refusals name their cause instead of just failing. Verified by building a nine-card wall with beats, a group and three arrows entirely through the tools, against the live app. |
| 2026-09-12 | Locked three gestures that had been built and in use but never confirmed: lasso-then-Group (R14/P6), the outbound arrow handle (R15/P8), and the colour tab on the card (R16/P10). Closed questions 12–14. Also corrected R24's status, which still said "mechanism: proposed" after pan/zoom had shipped. |
| 2026-09-12 | Chose between the two P14 layouts by building both on a 53-card feature and looking at them: **rank on the free wall** (D20). Recorded what the mockup showed that the argument had not — see the combine log. Also closed question 16 with D21: the app counts beats and stays quiet. |
| 2026-09-12 | Built R20, step 2 of the method: a card carries a **rank**, beat or scene, marked from a control beside the colour tab and shown as a heavy top bar rather than a colour (P13). Marking a beat never moves it. The general bar counts "N beats · M scenes" and says nothing else (D21). Second board migration, same pattern as R19 — pre-rank cards become scenes. R21 came out **satisfied with no code of its own**, and deliberately without a parent link. Agents get `set_rank`; `list_board` reports rank and the counts. |
| 2026-09-12 | **The product's scope changed.** Robert chose to aim at replacing Final Draft rather than feeding it, so D22 supersedes the second half of D1: pages are in scope, eventually. Open questions 1 and 4 are answered and R23 rewritten with a route (Fountain first, then `.fdx` round-trip, which is the actual moat) and an honest note on how deep industry pagination goes. The order does **not** change: the wall still comes first. |
| 2026-09-12 | Built R25, taken from the one Final Draft feature worth taking — the Story Map's page axis. A card carries an estimated **length** and the board a **target**; both are stored in eighths of a page (D23) so today's estimate and tomorrow's measured page share a unit. On the wall only the exceptions wear their number, so what you read at a glance is the three-pagers and the half-page stings. The general bar shows "≈N of 120 pages" with a typed target and goes warm when over. Third board migration, same pattern as R19 and R20 — an unsized card is an ordinary page. Agents get `set_length` and `set_target`. **What it unlocks is the point:** runtime between consecutive beats is the sag detector R22 needs, and it requires no act model. |
| 2026-09-12 | Compared the board against Final Draft and recorded Robert's working method as R18–R23 (method, logline, beats, scene cards, read the wall, pages last) with mechanisms P12–P17. All **proposed**, none confirmed — nothing here is built yet. Added open questions 15–19. Beat spine vs. rank-on-the-free-wall (P14 / question 15) is to be mocked both ways before anyone picks. |
