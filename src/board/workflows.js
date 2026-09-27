import { formatMinutes, formatPages, isMeasured, noteEighths, storyOrder } from "./reducer.js";
import { sceneNumbers } from "./numbering.js";
import { placeLine, placePage } from "./places.js";
// Workflows (R27, closing open question 24) and the first step toward the
// horizon (R28): the brief.
//
// A workflow is a named sequence of tool calls a writer launches as one act.
// The decision recorded here: a workflow is a **prompt in the repo** — the
// agent interprets it with the tools it already has — and where the sequence
// is fixed and needs no judgement it is a tool instead (read_wall, organize,
// apply_template, export_fountain already are). Nothing is stored in the
// project; a writer says the workflow's name to their agent, and the app
// shows the list so they know what they can ask for. DOM-free, shared by the
// app, the skill and the MCP server.

export const WORKFLOWS = [
  {
    id: "break-a-treatment",
    name: "Break a treatment into a wall",
    ask: "Here is a treatment. Break it into a wall: one card per scene with a headline and what changes, the cast on each card, the places, and the major turns marked as beats.",
    tools: ["list_words", "read_wall", "list_reminders", "list_board", "new_project", "new_board", "rename_project", "rename_board", "set_target", "set_logline", "set_premise", "set_title_page", "create_note", "add_character", "cast", "update_character", "set_location", "set_when", "set_rank", "set_length", "set_plant", "create_thread", "set_alternative", "set_aside", "set_order", "create_arrow", "create_group", "organize"],
    then: "Start where the wall will live: on the account, new_project names it; in a folder, new_board for the writer's wall, then rename_project. Read the wall (read_wall) and say what it asks. A treatment is cards, one create_note each, with characters, location, rank and plants on the call; import_fountain is the door for pages, not a treatment — a scene's text measures its card.",
    // What a treatment should say (R49): eleven blind runs asked the writer
    // the same questions at the end of every build. Each is a fact the wall
    // needs and the treatment could carry, and the tool it lands in. A writer
    // who answers them in the treatment gets a wall with no questions back;
    // an agent asks the ones the treatment leaves open, and invents none.
    needs: [
      { question: "How long is it?", hint: "An hour, a half-hour, a feature — or a page count, if you have one.", tool: "set_target" },
      { question: "What is the central question, in one sentence?", hint: "The premise is what is true before the film starts, and any rule the whole film keeps — \"nobody says the word sell to her face until the end\" is a premise line — and when the whole film is set (\"five days in August\"), since a card's when is one scene's; if this is one episode of something, what the series is about. A film with nothing true before it starts leaves the premise blank, and the reading does not ask. Not decided: either takes open with the writer's words, and the reading lists it.", tool: "set_logline, set_premise" },
      { question: "In what order do the scenes come?", hint: "The follows arrows are the order, and the wall reads, numbers and prints by them: create_note with after wires each card as it lands, create_arrow draws one, move_scene moves a scene. Not decided for a card: leave it unwired and say so; the reading asks what comes before and after it.", tool: "create_note, create_arrow, move_scene" },
      { question: "Which scenes are the turns?", hint: "Name them; or say \"propose them and I will strike\" — your agent names its candidates to you first, you strike, and only what is left is marked; or say \"mark none yet\" — every card stays a scene, and those words are the reason to leave the beat question with (leave_question, kind unmarked), so the reading lists it under left, for now, instead of asking on every reading.", tool: "set_rank" },
      { question: "Does it have acts?", hint: "If so, where does each break fall?", tool: "create_group" },
      { question: "Where does each scene happen?", hint: "In your own words. A scene that moves through one location is still one place.", tool: "set_location" },
      { question: "When does a scene happen, where that matters?", hint: "That night; the fourth of October. It goes beside the place, never in the headline. Not decided: set_when with open and the writer's words, and the card is still asked about the rest.", tool: "set_when" },
      // Round twenty-three, entry 9: the notes needed each of these five, every one has a tool, and the checklist asked none of them.
      { question: "What changes in each scene?", hint: "One line: what is different when it ends. Not decided for a scene: say so, and the line waits in your words while the card is asked everything else.", tool: "create_note, update_note (change, or changeOpen with the writer's words)" },
      { question: "Who is in each scene, and what do we call them?", hint: "A full name, or a role for someone unnamed — the man in 42. And who is only spoken of, never in a scene? They go in someone's notes, not the cast.", tool: "add_character, cast, update_character" },
      { question: "Is anyone in a scene only maybe? Is there a scene where you do not know who is in it?", hint: "Someone who may or may not be there is their name with a question mark — Tomás? — counted neither way until you decide.", tool: "cast, create_note (a name with ?)" },
      { question: "Is anything undecided about a person, rather than about a scene?", hint: "Whether she knows; what he goes to town for. It goes on their page, in your words, and the wall lists it and does not ask.", tool: "update_character (open)" },
      { question: "What is planted, and where does it pay off?", hint: "Name the episode when it pays off outside this one, so the fold is deliberate and the wall knows where to look. A thing whose far end you know and not its first sighting — the key, the bucket — is a thread with an open start.", tool: "set_plant with later, create_arrow; create_thread" },
      { question: "Is there a scene you have two ways?", hint: "Keep both until you choose: one card stands behind the other. Which is in front decides nothing.", tool: "set_alternative, choose_version" },
      { question: "Is there a scene you have cut and want kept?", hint: "It stays on the wall where you can find it, and out of the film: the order, the count, the pages and every export.", tool: "set_aside" },
      { question: "Which scenes do you already know run long or short?", hint: "A day in the story is not a page count; leave the rest unsized.", tool: "set_length" },
      { question: "What is it called?", hint: "The title. A film is one board and goes out under the project's name, so its board needs no name of its own. Only a series has a second answer — what this episode is called — and that is the board's name. A title or an episode's name not decided: rename_project, rename_board, new_project and new_board take open with the writer's words.", tool: "rename_project, rename_board" },
      { question: "What must not be invented?", hint: "Looks and voices are yours until you say; so is anything the treatment does not state.", tool: "update_character, later" },
    ],
  },
  {
    id: "read-and-raise",
    name: "Read the wall and raise questions",
    ask: "Read the wall and tell me what it asks: the sagging run, the missing setup, the person who disappears, the two scenes doing one job. Change nothing.",
    tools: ["read_wall", "list_board", "list_reminders"],
    then: "Wait for the writer; propose, do not fix.",
  },
  {
    id: "lay-a-structure",
    name: "Lay a structure over what is here",
    ask: "Lay the turns structure on this wall, then move my scenes under the beats they belong to and organize the rows.",
    tools: ["apply_template", "list_board", "move_note", "organize"],
    then: "Say which scenes you could not place.",
  },
  {
    id: "draft-a-sequence",
    name: "Draft a sequence in Fountain from its cards",
    ask: "Draft the scenes between the second and third beats as Fountain, from their cards, cast pages and places, and write each one onto its card.",
    tools: ["read_pages", "list_board", "write_scene", "export_fountain"],
    then: "Keep to the change line of each card; do not add scenes.",
  },
  {
    id: "restick",
    name: "Restick the remaining cards after the pages moved",
    ask: "The pages changed the story. Read the pages, tell me which cards no longer say what their scenes do, and rewrite those headlines and change lines to match.",
    tools: ["read_pages", "update_note", "read_wall"],
    then: "Never touch a card whose scene is unwritten.",
  },
  {
    id: "brief-a-segment",
    name: "Brief a segment for video",
    ask: "Brief the scene on this card for a video tool: who is in it and what they look and sound like, where it is, what happens, and what must be true after it.",
    tools: ["segment_brief", "build_segment", "add_take", "list_takes", "read_pages", "list_board"],
    then: "Hand the brief to the writer to approve before any tool makes anything; file what is made with add_take.",
  },
];

export function workflowById(id) {
  return WORKFLOWS.find((workflow) => workflow.id === id) ?? null;
}

// --- The brief (R28, first step; closing open question 25 for now) ----------
//
// A segment is a card — one scene — by default, and the run between two
// beats when the writer asks for a sequence. The brief is text: everything
// the wall knows about the segment, in the order a video tool would need it.
// No provider is named (question 26): the brief is what any of them is
// handed.

function personLine(character) {
  const lines = [];
  if (character.looks) lines.push(`looks: ${character.looks}`);
  if (character.voice) lines.push(`voice: ${character.voice}`);
  if (character.wants) lines.push(`wants: ${character.wants}`);
  if (character.needs) lines.push(`needs: ${character.needs}`);
  if (character.notes) lines.push(`notes: ${character.notes}`);
  if ((character.open ?? "").trim()) lines.push(`not decided, by the writer's word: ${character.open.trim()}`);
  return `${character.name}${lines.length ? ` — ${lines.join("; ")}` : " — (no page yet)"}`;
}

/**
 * The brief for one card, or for several in order (a run between beats).
 * Returns plain text with headed lines: everything the wall holds, in the
 * order a video tool would need it, and — said in words, never left out —
 * what the wall does not hold (pass 4a: a reader who has to shoot from the
 * brief needs to know a gap is the wall's, not the brief's). `options`:
 * `title` (the board's name), `episode`/`episodes` (its place in the
 * project), `premise` (the film's), `boards` (every board of the project
 * with `id`, `name` and its `order` of { id, headline }, so a fold's payoff
 * on another board is named to the scene).
 */
export function segmentBrief(state, ids, options = {}) {
  const byId = new Map(state.notes.map((note) => [note.id, note]));
  const notes = ids.map((id) => byId.get(id)).filter(Boolean);
  if (notes.length === 0) return null;
  const order = storyOrder(state);
  const numbers = sceneNumbers(order, state.lock);
  const position = (note) => numbers.get(note.id) ?? (order.indexOf(note) >= 0 ? String(order.indexOf(note) + 1) : null);
  const people = new Map();
  for (const note of notes) {
    for (const id of note.characterIds ?? []) {
      const character = state.characters.find((item) => item.id === id);
      if (character) people.set(id, character);
    }
  }
  const places = [...new Set(notes.map((note) => note.location).filter(Boolean))];
  const eighths = notes.reduce((sum, note) => sum + noteEighths(note), 0);
  const where = options.title ? ` on "${options.title}"${options.episode && options.episodes ? ` (episode ${options.episode} of ${options.episodes})` : ""}` : "";
  const first = position(notes[0]);
  const last = position(notes.at(-1));
  const lines = [];
  lines.push(
    notes.length === 1
      ? `SEGMENT: "${notes[0].headline}"${notes[0].rank === "beat" ? " — a beat" : ""}${first ? ` — scene ${first} of ${order.length}` : ""}${where}`
      : `SEGMENT: ${notes.length} scenes, from "${notes[0].headline}" to "${notes.at(-1).headline}"${first && last ? ` — scenes ${first} to ${last} of ${order.length}` : ""}${where}`,
  );
  lines.push(`LENGTH: about ${formatPages(eighths)} page${formatPages(eighths) === "1" ? "" : "s"}, about ${formatMinutes(eighths)} — ${notes.every((note) => isMeasured(note)) ? "measured from the script" : notes.some((note) => isMeasured(note)) ? "part measured, part the writer's estimate" : "the writer's estimate"}`);
  if (options.premise) lines.push(`THE FILM: ${options.premise}`);
  if (state.logline) lines.push(`STORY: ${state.logline}`);
  // What the writer has left open about the whole film rides with every segment (pass 4a, entry 46): a tool that reads "not decided" does not invent.
  if ((state.openLines ?? []).length) lines.push(`OPEN ABOUT THE FILM, BY THE WRITER'S WORD: ${state.openLines.map((line) => `"${line}"`).join("; ")}`);
  lines.push(`PEOPLE: ${people.size ? [...people.values()].map(personLine).join(" | ") : "(nobody cast)"}`);
  // Each place with its page when the writer has written one (R79), or said to have none, so a gap is the wall's and never invented.
  const pageOf = (name) => placePage({ places: options.places ?? [] }, name);
  lines.push(`PLACES: ${places.length ? places.map((name) => `${name}${pageOf(name) ? ` — ${placeLine(pageOf(name))}` : " — (no page yet)"}`).join(" | ") : "(none set)"}`);
  // What no wall holds, said once so a reader knows the gap is the wall's and not this brief's.
  const dayMissing = notes.some((note) => !(note.day ?? "").trim() && !(note.dayOpen ?? "").trim());
  const placeMissing = places.some((name) => !pageOf(name));
  lines.push(`NOT ON THE WALL: ${dayMissing ? "which day of the film's time a scene falls on (set_day holds it, or the writer's words for why not); " : ""}${placeMissing ? "what a place looks like where it has no page (update_place writes one); " : ""}a face, a build or a voice beyond the page's line. Ask the writer, or leave it open.`);
  for (const note of notes) {
    const number = position(note);
    lines.push("");
    // The card's id rides on the scene line so a take can be filed against it (pass 4a, the run's entries).
    lines.push(`SCENE${number ? ` ${number}` : ""}: "${note.headline}" [[id: ${note.id}]]${note.rank === "beat" ? " — a beat" : ""}${note.location ? ` — at ${note.location}` : note.locationOpen ? ` — the place open, by the writer's word: "${note.locationOpen}"` : " — no place set"} — ${note.when ? note.when : note.whenOpen ? `when open, by the writer's word: "${note.whenOpen}"` : "no time of day set"}${(note.day ?? "").trim() ? ` — ${note.day.trim()}` : (note.dayOpen ?? "").trim() ? ` — day: open, by the writer's word: "${note.dayOpen.trim()}"` : ""}${(note.light ?? "").trim() ? ` — ${note.light.trim()}` : (note.lightOpen ?? "").trim() ? ` — light: open, by the writer's word: "${note.lightOpen.trim()}"` : ""} — about ${formatPages(noteEighths(note))} page${formatPages(noteEighths(note)) === "1" ? "" : "s"}, ${isMeasured(note) ? "measured" : note.lengthEighths !== null ? "the writer's estimate" : "unsized, read as a page"}`);
    // Who is in this scene, by name, so a run's reader does not scroll to the header to learn who "Mira" is (pass 4a, entry 39).
    const cast = (note.characterIds ?? []).map((id) => state.characters.find((item) => item.id === id)?.name).filter(Boolean);
    const maybes = (note.maybeCharacterIds ?? []).map((id) => state.characters.find((item) => item.id === id)?.name).filter(Boolean).map((name) => `${name}?`);
    lines.push(`WHO: ${[...cast, ...maybes].join(", ") || "(nobody cast)"}${(note.castOpen ?? "").trim() ? `; open, by the writer's word: "${note.castOpen.trim()}"` : ""}`);
    lines.push(`WHAT CHANGES: ${note.change}${note.changeOpen ? ` (open, by the writer's word: "${note.changeOpen}")` : ""}`);
    if (note.text && note.text.trim()) {
      lines.push("SCRIPT:");
      lines.push(note.text.trim());
    } else {
      lines.push("SCRIPT: (unwritten — build from the change line)");
    }
    if (note.plants) {
      const heads = state.arrows.filter((arrow) => arrow.kind === "setup" && arrow.from === note.id).map((arrow) => byId.get(arrow.to)).filter(Boolean);
      const board = note.payoffBoardId ? (options.boards ?? []).find((item) => item.id === note.payoffBoardId) : null;
      const there = board && note.payoffNoteId ? (board.order ?? []).findIndex((item) => item.id === note.payoffNoteId) : -1;
      const scene = there >= 0 ? board.order[there] : null;
      const what = (note.plantsWhat ?? "").trim() || "something";
      const payoff = heads.length
        ? `pays off at ${heads.map((card) => `"${card.headline}"${position(card) ? ` (scene ${position(card)})` : ""}`).join(" and ")}`
        : scene
          ? `pays off at "${scene.headline}" (scene ${there + 1} on "${board.name}")`
          : board
            ? `pays off later, on "${board.name}", no scene named yet`
            : note.payoffBoardId
              ? "pays off later, on a board this project does not have"
              : "pays off later, nowhere yet";
      lines.push(`PLANTS: ${what} — ${payoff}; keep it visible.`);
    }
    const open = [(note.open ?? "").trim() ? `the scene: "${note.open.trim()}"` : ""].filter(Boolean);
    if (open.length) lines.push(`OPEN, BY THE WRITER'S WORD: ${open.join("; ")}`);
  }
  lines.push("");
  const lastNote = notes.at(-1);
  const after = [`AFTER: ${lastNote.change}`];
  if (!(lastNote.text ?? "").trim()) after.push("(the change line; the scene is unwritten)");
  // A run has an end state per scene, not one (pass 4a, entry 24): each WHAT CHANGES above stood by the end of its scene.
  if (notes.length > 1) after.push(`— on the way, each scene's WHAT CHANGES stood by its end: ${notes.slice(0, -1).map((note, index) => `${index + 1}. ${note.change}`).join("; ")}`);
  const carried = notes.filter((note) => note.plants).map((note) => (note.plantsWhat ?? "").trim() || "what the fold plants");
  if (carried.length) after.push(`— still visible: ${carried.join("; ")}`);
  const opens = [...people.values()].filter((person) => (person.open ?? "").trim()).map((person) => `${person.name}: "${person.open.trim()}"`);
  if (opens.length) after.push(`— open about the people, by the writer's word: ${opens.join("; ")}`);
  lines.push(after.join(" "));
  return lines.join("\n");
}
