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
| D1 | Product category is a **storylining app** (digital corkboard / beat board), not a screenplay formatter. | 2026-09-12 |
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

- **Status:** confirmed (need). Mechanism: proposed.
- **Date:** 2026-09-12
- **Statement:** The user can group cards so a sequence, set piece, or cluster moves and reads as one unit. Cards stay visible; grouping is not a folder you open.
- **Why:** Rooms rubber-band a run of beats. Forty loose notes hide the sequences.
- **Proposed mechanism (P6):** Drag on empty canvas to lasso. With two or more selected, **Group** (general bar or a small selection chip) wraps them in a named frame. Drag the frame to move all. Drag a card out to leave. Edit the frame title (e.g. “Midpoint,” “Heist”). Do not auto-group by proximity.
- **Later, not now:** stacking one card on another (alternates for the same slot). That is a different meaning than a sequence frame.
- **Notes:** Groups are the same objects as cards, plus a parent. Do not invent a second “beat sheet” model.

### R15 — Arrows between cards

- **Status:** confirmed (need). Draw gesture: proposed.
- **Date:** 2026-09-12
- **Statement:** The user can draw an arrow from one card to another to show what comes after what. Arrows are **directed**. Drawing A→B does not create B→A. The user may also draw B→A, so two arrows can run opposite ways between the same pair. That is two objects, not one two-headed line.
- **Why:** Sequence is not only left-to-right position. Loops and mutual cause are real in story (“they keep triggering each other”).
- **Proposed draw (P8):** A small outbound handle on a card (visible when the card is selected or hovered). Drag from that handle onto another card to create A→B. Repeat the other way for B→A. Opposite arrows sit on **offset paths** so both heads stay readable. Click an arrow to select it; delete removes that direction only. Arrows stick to cards when cards move, organize, or group.
- **Notes:** An arrow is not a group. Organize still uses reading order unless we later add “organize along arrows.” Do not auto-create the reverse. No unlabeled spaghetti: if we later need a label on an arrow, that is a new requirement.

### R16 — Change a card’s paper color

- **Status:** confirmed (need). Gesture: proposed.
- **Date:** 2026-09-12
- **Statement:** The user can change a card’s paper color. Color is a property of the card, not a canvas setting. The five pad colors are yellow, pink, blue, green, and orange. They stay paper on both black and white canvases.
- **Why:** Rooms color a storyline, a character, or a tone. A random pad color is not enough once the wall is real work.
- **Proposed gesture (P10):** A small stacked-paper tab on the card (visible on hover or select, like the arrow handle). Click it to open the five swatches on that card. Click a swatch to set the color. If two or more cards are selected and you recolor one of them, the whole selection changes. Do not put color in the general bar. Do not require long-press or double-click.
- **Notes:** Meaning of a color (B-story, character, act) stays with the writer. We are not locking a legend yet.

### R17 — Agent command surface

- **Status:** confirmed (need). Mechanism: proposed.
- **Date:** 2026-09-12
- **Statement:** An agent or robot (including this assistant) can create cards and move things around without driving the mouse. The same operations a human does by hand — new note, move, recolor, edit, delete — are available as callable commands, and they land on the same board a human sees.
- **Why:** Robert wants to build the wall with an agent, not only by dragging paper. If the agent and the human edit through different code paths they will drift.
- **Proposed mechanism (P11):** One command kernel that both the human UI and the agent call. Three doors into it: the human gestures, a `window.plotcoder` API on the page, and an MCP server in the repo. A workspace board file lets commands work with the app closed.
- **Notes:** First agent tools are notes only (`list_board`, `create_note`, `update_note`, `move_note`, `recolor_note`, `delete_note`). Arrows and groups exist in the same state and reducer but are not agent tools yet. The agent must not fake pointer drags; it calls commands.

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
| P11 | **Agent command surface — one kernel, three doors.** A DOM-free command kernel (`src/board/reducer.js`) owns the board records and is the only thing that mutates them. The React app, a `window.plotcoder` API, and an MCP server (`scripts/plotcoder-mcp.mjs`, wired in `.cursor/mcp.json`) all call it. State mirrors to `localStorage` (so Save/Open still works) and, on localhost, to `.plotcoder/board.json` via a Vite dev bridge so an agent can read/write the board with the app open (live via SSE) or closed (file). MCP tools are notes-only for now. | Mechanism for R17; implemented as a first cut. |

---

## Open questions

Answer these in this file when we decide. Do not hide decisions only in chat.

1. What is the first tool besides “the board”? Beat sheet, A/B/C story rows, characters, or something else?
2. Feature board vs TV episode board first — or one board that can do both?
3. What belongs on a card besides headline, change, and paper color (want, conflict, character, a locked color legend)?
4. Is PlotCoder only the board, or will it later include a story bible, fountain/script draft, or export to Final Draft?
5. Single-player first, or plan for two people on one board from the start (Supabase Realtime)?
6. Should `plotcoder.com` be the app, with a small marketing page, or a marketing page plus `app.plotcoder.com`?
7. Any structure method baked in (Save the Cat, eight sequences, three acts), or method-agnostic cards?
8. What else belongs in the general bar besides theme, and in what order?
9. Should a manual theme choice survive the next 8:00 a.m. / 8:00 p.m. boundary? Current decision: no, the clock wins.
10. ~~When should reminders move from localStorage to Supabase?~~ **Decided (D9):** localStorage now, Supabase later. Move reminders when we add accounts, using the same record shape.
11. ~~How do you edit a note?~~ **Decided (D11 / R13):** tap the words; drag the paper.
12. Confirm grouping mechanism: named frame after lasso (P6), stack-on-drop, or both?
13. Confirm arrow draw: outbound handle (P8), or another gesture?
14. Confirm color tab (P10), or another place to change paper color?

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

---

## Technical context (for implementers)

- Repo: `https://github.com/plot-coder/plotcoder.github.io`
- Custom domain: `plotcoder.com` (www CNAME to `plot-coder.github.io`)
- Cloudflare zone for Atlas/Robert account; nameservers `clay.ns.cloudflare.com`, `nelci.ns.cloudflare.com`
- GitHub Pages publishes from `main`
- App shell is a Vite + React + TypeScript client (proposed stack, now in use for the canvas and general bar)
- GitHub Pages still publishes from `main`; a static export / Actions deploy may be required once the Vite app replaces the old landing `index.html`
- Board state flows through one kernel: `src/board/reducer.js` (plain ESM + `reducer.d.ts` so it runs in the browser and in Node). `src/board/store.ts` is the browser store (localStorage + dev bridge + `window.plotcoder`). The Vite dev bridge (`vite.config.ts`) serves `/__plotcoder/board` and `/__plotcoder/events` and mirrors `.plotcoder/board.json` (gitignored) on localhost only — it never ships to Pages. The MCP server is `scripts/plotcoder-mcp.mjs` (run by `node`, wired in `.cursor/mcp.json`); it applies the same kernel and writes the live bridge when the app is open, or the file when it is closed. See the `plotcoder-board` skill in `.cursor/skills/`.

- Tests run on Vitest: `npm test` (single pass) or `npm run test:watch`. They cover the DOM-free half only — the kernel (`src/board/reducer.test.ts`), the pure helpers (`src/arrowGeometry.test.ts`, `src/organizeLayout.test.ts`, `src/projectStore.test.ts`), and the MCP server (`scripts/plotcoder-mcp.test.mjs`, which spawns it against a temp board file and a fake dev bridge). No browser, no jsdom. Config is `vitest.config.ts`; `tsc -b` typechecks the `.ts` tests and Vite leaves them out of the bundle.

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
