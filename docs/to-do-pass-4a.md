# Pass 4a — the working list

Pass 4a ran 2026-09-27 (`blind-runs/pass-4a-prompt.md`, the brief read
blind: a fresh agent handed `segment_brief` for one scene and one run of
"Low Water", asked what it would shoot and what the brief did not tell
it, nothing generated, nothing changed). The report is
`blind-runs/pass-4a-report.md`, forty-eight entries; every one accounted
for below. Plan, ask, build, test for every item; a field a person will
see gets a mockup on the app's paper.

## Fixed as it ran (#223 — the brief's rewrite)

- [x] **9, 20 · No episode or scene number, no rank, no premise.** The SEGMENT line says scene N of M on the board and episode of episodes, and a beat says so; THE FILM carries the premise.
- [x] **10, 25 · No time of day, on a scene or across a run.** Each SCENE line carries the card's when, or that it is open, or that none is set.
- [x] **11, 38, 44 (the label) · PLANTS named nothing and no payoff.** The fold's words, and the payoff named to its scene — on this board by setup arrow, on another by the fold's claim, with every board's order travelling with the call; AFTER says what is still visible.
- [x] **15, 37 · The tail's note under a written script; the tail changing shape.** One tail: the unwritten note only when the scene is unwritten.
- [x] **16, 24 · AFTER repeated WHAT CHANGES; one end state for a run.** AFTER carries the last change, the folds still visible, the people's opens, and — for a run — each scene's WHAT CHANGES as the state by its end.
- [x] **17, 26 · No length.** LENGTH in pages and minutes for the segment, and per scene.
- [x] **23 · No card ids.** `[[id: …]]` on every SCENE line, so a take can be filed against it.
- [x] **39 · Who is in this scene.** A WHO line per scene, maybes with their question mark, the cast's open words.
- [x] **42, 46 · A person's open words and the film's open lines not printed.** Both ride: on PEOPLE, on AFTER, and OPEN ABOUT THE FILM.
- [x] **22 · PLANTS above SCRIPT.** PLANTS follows the script now.
- [x] **19, 43, 45 (said) · What the wall cannot hold was left out silently.** One NOT ON THE WALL line names the day of the film's time, a place's look and a face beyond the page as the writer's to give.

## Held for Robert — the horizon's requirements

- [ ] **8, 43 · A scene's day in the film's time, and its weather and light.** The wall holds a time of day and never a day; the premise runs six weeks. *Plan:* R78, proposed — a `day` beside `when` on the card (the writer's words: "day four", "the Friday after"), and a `light` line (weather, light) each with its own open; the reading asks nothing of them; the brief and the pages print them. *Alternatives:* fold them into `when` as text (erases a decided time to open the weather, entry 43); a thread per day (a thread is a thing, not a time). **Held for Robert**, mockup on the card's sheet if wanted.
- [ ] **45, 18, 7 · A place has no page.** Every open fact about a place goes to a film-level line. *Plan:* R79, proposed — a place's page like a person's (looks, sound, notes, open, a picture), the places already being the cards' distinct phrases; `read_place`, `update_place`; the brief prints it under PLACES. *Alternatives:* a person-like record only when the writer writes on it (no record until then, as a person's page fills); a note on the first card at that place (a drawer). **Held for Robert**, mockup if wanted.
- [ ] **44 · What must be in frame for a plant.** The fold's label is a short phrase. *Plan:* the fold's words may be a sentence when the writer wants; or a second field, `inFrame`. **Held**, with R78/R79.
- [ ] **48 · A decision told from a hint.** The change line is the decision by design; a person's want is a hint. *Plan:* the brief labels each line's standing — done for opens; a want prints as "wants" already. **Decided**: the brief's labels are the standing; noted.
- [ ] **47 · Format, aspect, cutting.** The provider's, not the wall's (4b). **Nothing on the wall.**
- [ ] **40, 12, 33, 27–31, 34–36 · The generated pages.** The pages were filled from one bank of lines; a scene on the slip written as a room; the change line pasted as the last action line. The generator's, not the app's: `scripts/generate-series.mjs` should write each scene's change into the dialogue rather than paste it, keep interior cues indoors, and not have a person speak alone. **Held**, the generator; the size numbers stand either way.
- [ ] **32 · The page check is satisfied by a pasted change line.** The check counts the change line's words on the page; a line that is the change line verbatim counts. *Plan:* skip an action line equal to the change line. *Ask:* on the generated series every page pastes it, so the wall would ask [behind] on two hundred scenes at once — right, and loud; on a writer's wall a paste is rare. **Held for Robert** with the generator change above, so both land together.
- [ ] **13 · Headline and change line appear inside the script as action lines.** The generator's. With 32.
- [ ] **3 · A set-aside card shares a headline with a card in the film, and the since-line names it by headline.** *Plan:* the record's line says "(set aside)" or the id when a headline is not unique on the board. **Held**, small.
- [ ] **4 · Two cards share a change line word for word and the duplicate check reads headlines only.** *Plan:* the duplicate check also compares change lines when they are identical. **Held**, small, with 3a's 8.
- [ ] **5 · "s" counted as a logline word.** *Plan:* drop one-letter tokens from the word checks. **Held**, small — worth doing with the threshold work.
- [ ] **6 · Two lengths for one board.** Long-standing (pass 1a, 3a's 13). **Held.**
- [ ] **14, 21, 35 · The script's own contradictions and unset props.** The generator's. **Noted.**
- [ ] **1, 2 · The agent's fetch; open_project on a project already in hand.** Not the app; the prompt's wording. **Noted.**
- [ ] **41 · Three questions to the writer for what the wall held.** Fixed by the rewrite; recorded as the pass's measure.

## Held for Robert, in one list

R78 (a scene's day and light) and R79 (a place's page) — the horizon's
first two requirements, each with a mockup if wanted; 44 and 32 with the
generator; 3, 4, 5 small. Then 4b: one provider, ten segments, continuity
only, with the agent's section 4 as the list of what the provider is
handed.
