# Pass 1b — the working list

Pass 1b ran 2026-09-26 (`blind-runs/prompt.md`, "Doyle's" to a complete
script from notes, through the desktop connector at 0.1.53). This list is
kept **as the run goes**, on Robert's word the same evening: "keep taking
notes about where their friction points are and fixing them, especially
in setup". Every entry of the log is accounted for below as it arrives —
fixed, decided against with the reason, or held for a decision — and the
report is filed verbatim as `blind-runs/pass-1b-report.md` when the agent
hands it over.

The way the list is worked is `docs/to-do-round-twenty-two.md`'s: plan,
ask, build, test, for every item; a fix that a person will see gets a
mockup; a fix to the kernel or the server gets a test.

## The way in (entries 1 to 8, from the first message)

Before those, one thing outside the app: the agent's own harness blocked
`empty_account`, so it deleted the one project instead after an export.
Not the app's; the prompt's next head says so.

- [ ] **1 · Two orderings for the first calls.** The on-ramp says
  `new_project` comes before the three reads when the writer told the
  agent to start its own; the prompt said make the first calls before
  changing anything. *The prompt's, not the app's:* the on-ramp says the
  writer's word wins, and the agent did what it said. Decided against
  changing the app; the next prompt says "the on-ramp's first calls, then
  your own project" in one line.
- [ ] **2 · Tool descriptions invisible until a tool is loaded by name.**
  "The on-ramp says the tool descriptions carry the rest, and know the
  server by its tools; in this session a tool's description is invisible
  until I load that tool by name." The desktop app defers a connector's
  tools past a count; the on-ramp assumes names and descriptions arrive
  together. *Plan:* one sentence on the on-ramp — if your session shows
  names only, load a tool to read what it takes; the day-one guide says
  what the first six take. *Held* until the run says whether it cost more
  than the one stop.
- [x] **3 · A sentence cut off in `list_projects`.** "who has a wall open:
  who_is_here waits for presence and says" read as truncated. *Fixed:* the
  hosted door's line now says "who has it open: not known until
  who_is_here asks".
- [ ] **4 · The inline project export, 51 KB in eleven lines, refused by
  the client as too large.** The tool's description warns the link form
  dies with the account, so inline was the right call, "and it is
  unwieldy". *Held:* through the connector a file on the agent's own disk
  is the third way (the agent recovered it from one); whether the reply
  should be the link by default on the hosted door, with the warning, is a
  decision for the list's end.
- [ ] **5 · `list_words` defines a beat as "one of the eight to fifteen big
  turns"** while the on-ramp forbids an opinion on how many beats.
  *Decided against:* the eight to fifteen is the method's own claim (the
  house method, R20); what the app has no opinion on is how many *this*
  wall should have (D21). The definition says what a beat is; the reading
  never counts them against it. The words could say so in a clause.
- [x] **6 · An empty wall's reading lists "a beat is marked" under
  "checked and clean".** No cards, no beat: the clean list reported the
  opposite of the fact. *Fixed:* with no cards the checks line is one
  phrase, "nothing to check yet: no cards", and no list.
- [x] **7 · The day-one guide cites "(R74)", "(pass 1a, entry 95)" and
  "(round twenty-four)"** — the builders' notes left in a page a stranger
  reads. *Fixed:* the three citations are out of the skill, the public
  guide and day-one regenerated from it, and a test keeps every
  requirement, pass and round number out of the skill, `llms.txt` and
  `wiring.md` (the tool descriptions already had one).
- [ ] **8 · The connector's instructions, the on-ramp and the day-one guide
  say the first calls and the open-field rules three times over.** "I read
  all three to find out they agree." *Held:* the repetition is on purpose
  — an agent that reads only the handshake, only `llms.txt`, or only the
  guide still gets the rules — but each could say in a line that the
  other two say the same, so the third read is a choice.

## Every entry, accounted for

1 → decided against (the prompt's) · 2 → held · 3 → fixed · 4 → held · 5 →
decided against · 6 → fixed · 7 → fixed · 8 → held.
