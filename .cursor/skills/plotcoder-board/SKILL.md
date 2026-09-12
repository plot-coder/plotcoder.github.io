---
name: plotcoder-board
description: >-
  Create, move, recolor, edit, and delete cards on the PlotCoder storyboard from
  an agent. Use when asked to build or rearrange the PlotCoder wall, add beats,
  or change the board — instead of simulating mouse drags in a browser.
---

# PlotCoder board

PlotCoder is a storylining wall of cards (post-its). Each card is a **beat**: a
`headline` plus the `change` it causes. Cards also have a `color`, position
(`x`,`y`), and rotation.

## Use the MCP tools, not the mouse

The repo ships an MCP server (`plotcoder-board`, wired in `.cursor/mcp.json`).
Drive the board through its tools. **Do not** open a browser and fake pointer
drags — the tools and the human UI share one command kernel, so a tool call
lands on the exact same board a person sees.

Tools:

- `list_board` — every card with its **id**, headline, change, color, position.
- `create_note` — add a card. Requires `headline` **and** `change`. Optional
  `color` (yellow, pink, blue, green, orange) and `x`/`y`.
- `update_note` — change a card's `headline` and/or `change` by `id`.
- `move_note` — set a card's absolute `x`,`y` (top-left, pixels).
- `recolor_note` — change a card's paper `color` by `id`.
- `delete_note` — remove a card (also drops its arrows and group membership).

## Workflow

1. **Call `list_board` first.** Use the real `id`s it returns for any move,
   recolor, edit, or delete. Never guess ids.
2. Create beats with a real `headline` and `change` — not placeholders.
3. To lay cards out, `move_note` each one. The board is roughly 192px cards;
   leave ~30px gaps for a readable row.

## Live vs. file

- If the PlotCoder dev app is **running** (`npm run dev`), edits appear on the
  open wall within a second. `list_board` reports "live: app is open".
- If the app is **not running**, tools still work: they read and write
  `.plotcoder/board.json`, and `list_board` reports "from file: app not
  running". The wall catches up the next time the app loads.

If a tool result says the change was "written to file" but you expected it live,
the app is not open. Tell the user to run `npm run dev` if they want to watch
edits appear in real time; the change is already saved either way.

## Only notes for now

Arrows and groups live in the same board state but have no agent tools yet.
Do not try to create them through these tools.
