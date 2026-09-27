# A scene's shots — the working list (R80)

Worked 2026-09-27 on Robert's need: take the script, and make every shot
that goes into a scene. Plan, ask, build, test; the asking changed the
plan twice, and both are written down here.

## The plan, as first drawn

A `shots` list on the card, through the kernel; each shot anchored to a
quoted line; stills and takes as files under the shot; a look on the
project; three new tools and three grown; facts and never questions; a
workflow; the app's side after a mockup.

## Is this the best we can do?

**No, twice.**

1. **Where a shot lives.** Robert: shots are made after the script is
   refined, so they belong to the script. A list on the card is a second
   record of where the script divides, and its anchors go stale on a
   rewrite. *Changed:* a shot is a line of the script, a note. Nothing new
   in the kernel; R28's note against a shot model stands.
2. **Where the line goes.** The first build put a shot line directly above
   the quoted line, which put one between a cue and its speech and moved
   the scene's measure by an eighth. *Changed:* the line goes above the
   block, a paragraph of its own, and the test holds the measure and the
   reading to what they were before the shots.

**Yes, with the reason:**

- *The stills are made outside the app.* Midjourney has no official API
  and Robert will not pay for one yet. The app's part is the prompt out
  and the picture back.
- *The prompt is only the wall's words.* What the wall does not hold is
  listed and left out. A prompt that fills a gap invents a face.
- *Three tools grown, not added.* The tool list is 25,700 tokens a turn
  (pass 3a). Four new tools is already four.
- *No migration.* The files table takes a picture or a take under any
  subject.

## Built — the agent's half

- [x] `src/board/shots.js`: the line read and written, ids, placing by
  quoted words, rewriting and removing, carrying across a rewrite, the
  facts, the brief and its prompt.
- [x] `look` on the project record; `set_look`; `read_project` says it.
- [x] `list_shots`, `set_shots`, `update_shot`.
- [x] `segment_brief`, `build_segment` and `add_picture` take `shot`.
- [x] The provider module is handed `firstFrame`; the dry run prints it.
- [x] `write_scene`, `import_fountain` and `import_fdx` keep a scene's
  shots; a Fountain file read back keeps shot lines in the scene.
- [x] The record says shots when only shot lines moved.
- [x] The workflow, the guide and the skill.
- [x] Tests: `shots.test.ts`, the server's.

## The rehearsal (2026-09-27)

One scene, "Ada's column", ten shots, on a scratch copy of "Low Water";
Robert made the stills in Grok. What it found, in the order it found it:

- [x] **A still named people who are not in its frame.** Fixed (#239).
- [x] **The slugline rode in the prompt as typed.** Fixed (#239).
- [x] **Without a picture of a person made first, the stills do not hold a
  face** (Robert). With three references made and attached — Ada, Nell,
  the office — they held. *Built:* the references listed above the shots
  with a prompt each, and the brief's ATTACH line.
- [ ] **Getting a picture out of Grok and back in is a screenshot and a
  repost** (Robert). Not the app's to fix inside Grok; the sheet's part is
  to take a pasted image and to hold the references where they can be
  copied out. With the redraw.
- [x] **The sheet redrawn as a walkthrough**, 2026-09-27, on Robert's
  word that the app must walk the writer through the references before
  any shot's prompt: `docs/mockups/r80-the-walkthrough.html` — the look,
  the people, the places, the shots; copy, name, bring back; a gate per
  scene; a tick or a picture for a reference, a picture for a shot; the
  strip. **Waiting on his word.** It replaces section 3 of the first
  mockup; the mark in Pages (2 A or 2 B) is still his to choose.
- [ ] Still to hear from the rehearsal: what Robert changed in each prompt
  to get a still he would keep.

## Waiting on Robert — the person's half

- [ ] **The mockup**, `docs/mockups/r80-a-scenes-shots.html`: the shot
  line drawn as a mark in Pages (2 A) or not (2 B), and the Shots sheet
  with Copy the prompt and the drop by file name. Until it is built a
  person sees the raw note in the scene editor and in Pages.
- [ ] `public/writers.html` says how, in the same pull request as the
  sheet.

## Not tested

- **Nothing that touches the account ran.** Filing a still, choosing a
  frame, and `build_segment` with `shot` past the point where it asks for
  a provider need the account door; the unit suite never touches the
  network. They are the first thing to walk on the test account, with
  `PLOTCODER_VIDEO_PROVIDER=dry-run`.
- **No blind run.** Whether a fresh agent reaches for `set_shots` from the
  guide's section, and whether it invents what the page does not say, is
  a round's to measure.

## Left behind

- **The hosted door has no disk**, so `add_picture` with a path cannot
  file a still through it. The app's sheet is the way in for a person;
  an agent on the hosted door has none until a file can arrive by link.
- **A shot across two scenes.** The same id at the head of the next scene
  is accepted and read as the first in wall order; nothing joins the two
  stretches in the brief.
- **A shot taken out leaves its stills on the project** until
  `remove_file`. Deliberate: a still is work; say if it should go with
  the shot.
- **The size of the pictures.** Held on the project for now, on Robert's
  word; offloading is decided when the size asks.
