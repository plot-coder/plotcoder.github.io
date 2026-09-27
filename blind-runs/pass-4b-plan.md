# Pass 4b — one provider, ten segments, continuity only

Written 2026-09-27 after pass 4a, on Robert's "R78 and R79 drawn, then
pass 4b". This is the plan and the rubric; the pass runs when a provider
and its key are in hand (question 26, open since 2026-09-12). Nothing here
picks the provider; the first section says how to.

## What the pass is for

Not whether a video tool makes good pictures. Whether **the same face,
the same place and the same voice survive from one segment to the next**
when every segment is built from the wall's brief and nothing else. If
they do not, no amount of shot grammar matters, and the app's next
requirement is a reference the provider can hold; if they do, the app's
next requirement is the reading of a take against its brief (R74's
pattern, drawn on its own paper afterwards).

## How the provider is chosen

One question, tested before anything is built: **does the provider's API
take a reference image for a face and for a place, and hold it across
calls?** A provider that takes text only cannot pass this pass however
good its frames. The candidates named so far: Grok Imagine (xAI; the first
named, D25), Google Veo, Runway, Kling, Luma, Sora. Whichever Robert has a
key for and answers yes is the one; the choice is recorded in
`REQUIREMENTS.md` (question 26) with the answer to that question and the
date, and nothing in the app names it but `PLOTCODER_VIDEO_PROVIDER`.

## The ten segments

Episode one of "Low Water", as pass 3b left it, chosen so the same faces
and places recur:

| # | Segment | Place | Faces | Why |
| --- | --- | --- | --- | --- |
| 1 | "The wall, first light" | the sea wall | Bram, Con | the opening; two faces the run will hold |
| 2 | "Nell opens the office" | the harbour office | Nell | one face alone; the office as it will look in 4, 7 |
| 3 | "A hand's width" | the sea wall | Bram | the wall again, same face, a day on |
| 4 | "Ada's column" | the harbour office | Ada, Nell | the two-hander 4a read; the office again |
| 5 | "Brandt on the slip" | the slip | Sol, Owen, Nell | three faces; Nell in a third scene |
| 6 | "Kit asks for a berth" | the Maureen | Kit, Tom | the boat; two new faces |
| 7 | "June's table" | June's kitchen | June, Tom, Nell | Nell and Tom again, a fourth place |
| 8 | "The committee" | the council chamber | Owen, Sol, Nell, Rosa | four faces, two held from 5 |
| 9 | "Tom's debt" | the breakwater | Tom, Con | Con from 1, Tom from 6 and 7 |
| 10 | "The spring tide" | the sea wall | Nell, Bram, Con, Kit | the wall a third time, every recurring face |

Ten briefs from `segment_brief`, one per card, as the door prints them at
0.1.64. Nothing is written on a page for the pass; the pages are the
generated series' and 4a said what that means (its entries 27 to 36). The
pass judges continuity, not sense.

## What the provider is handed

The agent's section 4 in `blind-runs/pass-4a-report.md`, as far as the
wall holds it today:

- the brief, whole, with the card's id;
- for each person in WHO, the page's looks and voice lines, and the first
  picture on their page if the provider takes one (add_picture; none exist
  on the test account yet — the pass makes one per face from the first
  take that gets it right, and holds it);
- for each place, its phrase and, once R79 is built, its page; until
  then the script's first action line, said as such;
- the duration from LENGTH, a page a minute;
- the change line as what must be true at the end.

What it is not handed: anything invented for a gap. A brief with an open
field is handed with the open words in it, and the take is judged with
that gap allowed.

## The rubric

For every take, three marks, each yes or no, by a person (Robert) and the
driving agent separately, against the take before it that shares the
thing:

| Mark | Yes when |
| --- | --- |
| **the face** | a person recognisable as the same person as in their last take — not "a woman in her forties" but this one |
| **the place** | the office in 4 is the office in 2; the wall in 3 and 10 is the wall in 1 |
| **the voice** | if the provider speaks: the same voice for the same person; if not, the mark is skipped and said so |

And two facts, not marks: how many tries each segment took to get a take
worth marking, and what the take cost in time and money. The pass's
report is the ten rows, the two facts, and where the app fell short: a
reference it could not hand over, a brief line the provider ignored, a
gap that was invented anyway.

## What the app builds for it

Only the seam, before the pass: `build_segment` hands the brief and the
references to the provider named in `PLOTCODER_VIDEO_PROVIDER`, with the
key in the environment beside it (never in the client, never in a file
in the repo), waits, files the result with the same code `add_take`
runs, and replies with the take's name and what it was handed. One
provider module under `scripts/providers/`, the brief in and a file path
out, so a second provider is a second module and nothing else changes.
The Takes panel and `list_takes` already show what lands.

Nothing else: no shot model, no timeline, no reading of takes yet. That
reading is drawn after the ten rows say what it should look for.
