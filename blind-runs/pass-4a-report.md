# Pass 4a — the report

Run 2026-09-27, the first pass of goal 4 in `docs/plan.md` (the horizon's
first step): **the brief, read blind.** A fresh agent through the desktop
connector at 0.1.63 was handed `segment_brief` for "Ada's column" on
episode one of "Low Water" and then for the five-card run to "Brandt on
the slip", asked what it would shoot, and asked above all what the brief
did not tell it that it would need before a frame. Nothing was
generated; nothing on the wall was changed; the writer answered from the
wall or left things open, from the head of `blind-runs/pass-4a-prompt.md`.
**Forty-eight entries, fourteen questions, twenty-one gaps.** The agent's
report is below, unedited.

**What the pass was for, answered.** *Could a reader shoot from the brief
alone?* Nearly, for the two-hander in the office: the faces from the
pages, the place from the script's first line, the sound from the
script's cues, the end state from the change line. For the run, no: four
of five scenes could not be shot as written, and that was the generated
pages, not the brief — a scene placed on the slip written as a room, a
change line that needs speech in a scene with nobody to hear it, a
blanket that exists only in the pasted last line (27 to 33). *What the
brief did not hold that the wall did* — the pass's finding proper: the
scene's number and id, its time of day, its length, who is in it, the
fold's words and the scene it pays off at, the premise, and what the
writer had left open about a person (9, 10, 11, 17, 20, 23, 25, 26, 39,
42); three of the fourteen questions it would have asked the writer were
for facts the wall held and the brief dropped (41). **Fixed the same
hour (#223)**: the brief prints each of them, a run's end states scene by
scene, and one line saying what the wall does not hold. *What the wall
does not hold* — the horizon's requirements, proposed: which day of the
film's time a scene falls on, and its weather and light (8, 43; R78); a
place's page (45; R79); what must be in frame for a plant (44); a
decision told from a hint (48); a format the provider will need (47).
*What a video tool would need from the app* is the agent's section 4,
and it is the list for 4b.

**Fixed as it ran** (#223): the brief's rewrite — the segment's place in
the project, LENGTH in pages and minutes, THE FILM, the film's open lines,
WHO and a time of day and length per scene, the fold's words with its
payoff named to the scene on any board, the people's opens on PEOPLE and
AFTER, a run's end states, a consistent tail, the card's id on every scene
line, and NOT ON THE WALL. The rest is in `docs/to-do-pass-4a.md`.

---

## The agent's report, as handed back

Reader of the brief for "Low Water", episode 1. Four directions, five tool reads, no writes; nothing on the wall was changed.

### 1. What I would shoot

**The scene, "Ada's column" (a beat).** Place: interior, the harbour office. One line given: a desk, a tide table on the wall, the ledger open, rain on a window. The sound puts the tide below and a ferry road in earshot, so the window plays toward water; read from the sound, not the brief. Faces: Ada Quill, sixties, cardigan, reading glasses on a chain, precise and quiet, repeats a number until heard. Nell Carrick, 44, salt in the hair, a coat too big for her, short and dry, never raises her voice. Shots: open on the open ledger and the rain. A two-hander across the desk, medium and close, held long. Inserts the page gives: the ledger page, the tide table Ada reads "as if it might have changed", Nell's coat off and on, Nell turning a cup on its saucer. The ledger stays in frame because something must and it is the only candidate. Sound: rain throughout; one lorry, then quiet; the tide low under it; near the end a boat engine coughs, catches, dies. Dialogue at room level. True at the end: Nell has heard the account is forty thousand and six pence short, there in March and not now. Nell has said she signed it. They will go through it in the morning with the ledger open. "Who else knows?" asked, not answered. Whatever pays off on "Spring Tides" still in shot.

**The run, "Ada's column" through "Brandt on the slip" (five cards).** 1. Ada's column: as above. 2. Who sleeps in the hut: interior, the fish hut, tar and salt, a bench along the back wall, one bulb that flickers and holds. Con Reilly, eighties, hands like rope, few words; Kit Fenn, seventeen, fast and sharp. Dim, single source. Sound: the bulb, one lorry, quiet. Ends with nobody moving. Required after: Kit has been sleeping here and Con has found the blanket. Not shootable: no blanket, bedding or sleeping on the page except the pasted last line. 3. Mira's rounds: exterior, the ferry road, single track, sea one side, marsh the other. Con and Mira Sato, forties, the doctor, kind, blunt, in a hurry. Whether Mira is in her car: not given. Sound given: a gull. The page also gives a bulb, a tide table and a sill, none on a road. Required after: Mira prescribed sleep and Con did not take it; the second half is only the pasted line. 4. Con reads the glass: place line says the slip; the page is an interior with window, chair, desk, telephone, drawer, kettle, ledger, photograph, clock, rain. Con alone, no dialogue, eleven actions in three passes. Required after: Con says the weather is turning. Con says nothing to nobody. Not shootable at either place. 5. Brandt on the slip: exterior, the slip, gulls, tide below. Sol Brandt, fifties, easy voice, clean good boots; Owen Petty, sixties, good coat, bad tie; Nell. Three-hander in the open. Sound: gulls, tide, a lorry. Required after: Sol has offered to pay for the wall for the land behind it. Not spoken; the pasted last line. For the run: five places, seven faces, one stated end condition where five are needed.

### 2. The friction log

*Setup.*
1. The on-ramp fetched through my page-reader came back as a summary naming wiring.md as required; llms.txt says it is not for someone holding the tools. Fetched a second way.
2. The brief said "open Low Water"; it was already working and open_project restarts the reading count. Did not call it.
3. Three headlines name two cards each on episode 1 ("A hand's width", "Owen takes a call", "Who sleeps in the hut"), one in the film and one aside; the two hut cards differ in cast and change line. The since-line says an agent set "A hand's width" aside while one is in the film.
4. "Bram brings June the paper" and the set-aside "Tom brings June the paper" share a change line word for word; the duplicate check reads headlines only.
5. read_wall counts "s" as a logline word. Read twice.
6. One board, two lengths (62 as it prints, 59 2/8 by cards); read_project gives only one.
7. Places are sluglines although the guide says a place is the writer's phrase; two ferry-road phrases are unrelated.
8. Every when is a time of day; nothing says which of the six weeks' days a scene is.

*Direction 1.*
9. FROM says "Low Water"; project and board share the name; no episode or scene number.
10. No WHEN in the brief; the card holds DAY; the script pulls against it.
11. PLANTS says "something" and "keep it visible" without naming it; the fold's words and the payoff scene are on the wall.
12. Nine lines repeat verbatim in a reordered second pass; the brief cannot say whether that is the writer's page.
13. Headline and change line appear inside the script as action lines.
14. The script contradicts itself: ledger open, then "with the ledger open" in the morning; "said it three times" after once; Ada, who keeps the book, demands the page of Nell.
15. AFTER reads "(the change line, until the scene is written)" under a written SCRIPT.
16. AFTER repeats WHAT CHANGES and adds no end state.
17. No length; the card holds one.
18. Place is a slugline only; sound cues do the location's work.
19. Looks and voice are sketches: no hair, build, complexion, accent, region.
20. No episode context: rank, position, neighbours, premise.
21. Props arrive unset (cup and saucer) or unmotivated (coat off and on).
22. PLANTS above SCRIPT promises what the script never shows; read the script for it, then PLANTS again.

*Direction 2.*
23. No card ids in the brief, either direction.
24. One AFTER for five scenes; intermediate change lines not carried as end states.
25. The run drops every when; the cards hold five; night-to-morning invisible.
26. No per-scene or total length.
27. "Con reads the glass" placed on the slip, written as an interior in every line.
28. Its change line requires speech in a scene with no dialogue and nobody present.
29. "Who sleeps in the hut" has no blanket on the page except the pasted line.
30. "Mira's rounds", an exterior, carries a bulb, a tide table and a sill.
31. "Brandt on the slip": the ledger proposed on a slip, a sill outdoors, the offer unspoken.
32. Every scene's last action line is its change line verbatim; the wall's half-the-words check is satisfied by the paste, so pages that do not show their change read clean.
33. One bank fills all five pages: the lorry (four), the coat beat (four), the tide table (three, once outdoors), the gull on the sill (two exteriors), the cup (two), "writes and crosses out" (two), "Nobody moves" (two); lines move between mouths with the name swapped.
34. Kit's "I've got a berth" and Sol's "You've seen the drawings" precede, on the wall, the scenes where those happen.
35. Lowercase-opening lines read as unfilled slots.
36. Mira's "she" and "Weeks. I'm sorry." land on nobody named; June would be my invention.
37. The AFTER tail changed wording between the two briefs of the same card.
38. In a run nothing says the plant must survive to the last frame or leaves the run unpaid.
39. Mira's car is on her page, not in her scene; "hands like rope" is Con's only physical fact for three scenes of close-up.

*Direction 3.*
40. Most answers have nowhere to land: no field for era, region, accent, aspect, shot grammar, end state beyond the change line, or "motif, not template".
41. Three questions asked you for what the wall holds (when, the fold's words, lengths); the brief dropped them.

*Direction 4.*
42. Kit's page carries your open ("whether Kit leaves") and the brief's PEOPLE entry for Kit did not print it.
43. Weather and light have no field; opening the when would erase a decided time.
44. "What must be in frame" has no field; the fold's label is a short phrase and the brief printed not even that.
45. A place has no page.
46. add_open_line lists and never asks, and no brief has been seen to print one; untested, none exists here.
47. Nothing holds tool, aspect ratio or cutting.
48. For end states and Mira's "she", the wall holds a hint and the brief prints it as a fact.

### 3. What the brief did not hold (gap; wall holds it?; open?; where it should live)

- Card ids on scene blocks. Wall: list_board. Not open. Every SCENE line.
- Episode, scene number, rank. Wall: yes. Not open. The SEGMENT header.
- Time of day per scene. Wall: each card's when. Not open. Each SCENE line.
- Day of the six weeks. Wall: no. Not decided. The when ("day four, dawn"), set_when.
- Weather and light. Wall: no. Open. A field beside when; none. add_open_line meanwhile.
- Lengths. Wall: each card. Not open. Each SCENE line and the header.
- What is planted. Wall: the fold ("the ledger's missing page — the one Ada cannot find", pays off ep 3 sc 9 "The page in the hut"). Not open. The PLANTS line, which had it.
- What must be in frame. Wall: no. Open. Beside the fold; no field. A bracketed note via edit_scene, if briefs print notes.
- Per-scene end states. Wall: change lines only. Not decided. AFTER per scene plus a field for the rest; none.
- Mira's "she"; "Weeks". Wall: Mira's want names June; no card says. Not decided. The scene's text or Mira's notes.
- Con's listener. Wall: no; the card says slip, the page says room. Not decided. The card's cast or a new change line.
- Whose pages. Wall: read_record. A history, not a decision. A line in the brief.
- Page against order (berth, drawings). Wall: only when both are read. Open. A thread with an open start, create_thread.
- Place descriptions, era, Mira's car. Wall: no. Open. A place page; none. Era in the premise when decided.
- Faces past the sketch; Kit's "they" on screen. Wall: looks lines. Open. Each page: update_character open now, looks later.
- Voices, region, accent. Wall: manner only. Open. Voice lines; region in the premise.
- Motif or template. Wall: no. Open. A thread per motif once decided; add_open_line until then.
- Tool, format, aspect, cutting. Wall: no field. Not chosen. Nowhere today.
- Kit's open. Wall: Kit's page. Open by your word. The PEOPLE entry; dropped.
- Continuity in. Wall: preceding change lines. Not open. A "before" line per segment.
- The premise and the six weeks. Wall: project premise. Not open. The STORY block.

### 4. What a video tool would need from the app that nothing gives today

- The card id on every scene block, and a take filed by id (add_take exists; the brief gives no id).
- A persistent face and voice reference per person, made once and reused across 240 segments.
- A place reference per place; no object to hang one on.
- A time token per segment (story day, time of day, light) and a continuity token in and out.
- The plant as an object list: what is in frame, in which segments, until which payoff.
- Dialogue with speaker ids; action separated from sound cues.
- Duration per segment from the card's length, with the page-a-minute rule stated.
- A person's and a card's open words printed, and a refusal: a segment with open fields returns "not ready" rather than inventing.
- A brief that tells a decision from a hint so a tool does not shoot the hint as fact.

### 5. What I was never sure of

- Whether the pages are yours or an agent's fill. The repetition says fill; the wall says written; I did not read the record.
- Whether a brief prints bracketed notes or film-level open lines; neither exists here to test.
- Whether "the run" meant the beats inclusive. I included both; the tool took it.
- Whether "salt in the hair" is grey or literal, and whether the town is in the British Isles; inferred from "lorry" and "pence".
- Why the AFTER tail changed wording between two briefs of the same card.
- Whether Kit's "they" is yours or the app's default; read_project says "they" of everyone.
- Whether the pasted change line is the composer's or on the page itself.
