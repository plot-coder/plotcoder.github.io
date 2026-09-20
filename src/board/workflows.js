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
    tools: ["list_words", "read_wall", "list_reminders", "list_board", "new_project", "new_board", "rename_project", "rename_board", "set_target", "set_logline", "set_premise", "create_note", "add_character", "cast", "update_character", "set_location", "set_when", "set_rank", "set_length", "set_plant", "create_thread", "set_alternative", "set_aside", "set_order", "create_arrow", "create_group", "organize"],
    then: "Start where the wall will live: on the account, new_project names it; in a folder, new_board for the writer's wall, then rename_project. Read the wall (read_wall) and say what it asks. A treatment is cards, one create_note each, with characters, location, rank and plants on the call; import_fountain is the door for pages, not a treatment — a scene's text measures its card.",
    // What a treatment should say (R49): eleven blind runs asked the writer
    // the same questions at the end of every build. Each is a fact the wall
    // needs and the treatment could carry, and the tool it lands in. A writer
    // who answers them in the treatment gets a wall with no questions back;
    // an agent asks the ones the treatment leaves open, and invents none.
    needs: [
      { question: "How long is it?", hint: "An hour, a half-hour, a feature — or a page count, if you have one.", tool: "set_target" },
      { question: "What is the central question, in one sentence?", hint: "And if this is one episode of something, what is the series about? Not decided: either takes open with the writer's words, and the reading lists it.", tool: "set_logline, set_premise" },
      { question: "In what order do the scenes come?", hint: "The follows arrows are the order, and the wall reads, numbers and prints by them: create_note with after wires each card as it lands, create_arrow draws one, move_scene moves a scene. Not decided for a card: leave it unwired and say so; the reading asks what comes before and after it.", tool: "create_note, create_arrow, move_scene" },
      { question: "Which scenes are the turns?", hint: "Name them; or say \"propose them and I will strike\" — your agent names its candidates to you first, you strike, and only what is left is marked; or say \"mark none yet\" — every card stays a scene and the reading asks once for a beat until you do.", tool: "set_rank" },
      { question: "Does it have acts?", hint: "If so, where does each break fall?", tool: "create_group" },
      { question: "Where does each scene happen?", hint: "In your own words. A scene that moves through one location is still one place.", tool: "set_location" },
      { question: "When does a scene happen, where that matters?", hint: "That night; the fourth of October. It goes beside the place, never in the headline. Not decided: set_when with open and the writer's words, and the card is still asked about the rest.", tool: "set_when" },
      { question: "Who is in each scene, and what do we call them?", hint: "A full name, or a role for someone unnamed — the man in 42. And who is only spoken of, never in a scene? They go in someone's notes, not the cast.", tool: "add_character, cast, update_character" },
      { question: "What is planted, and where does it pay off?", hint: "Name the episode when it pays off outside this one, so the fold is deliberate and the wall knows where to look. A thing whose far end you know and not its first sighting — the key, the bucket — is a thread with an open start.", tool: "set_plant with later, create_arrow; create_thread" },
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
  return `${character.name}${lines.length ? ` — ${lines.join("; ")}` : " — (no page yet)"}`;
}

/**
 * The brief for one card, or for several in order (a run between beats).
 * Returns plain text with headed lines, and nothing the wall does not hold.
 */
export function segmentBrief(state, ids, options = {}) {
  const byId = new Map(state.notes.map((note) => [note.id, note]));
  const notes = ids.map((id) => byId.get(id)).filter(Boolean);
  if (notes.length === 0) return null;
  const people = new Map();
  for (const note of notes) {
    for (const id of note.characterIds ?? []) {
      const character = state.characters.find((item) => item.id === id);
      if (character) people.set(id, character);
    }
  }
  const places = [...new Set(notes.map((note) => note.location).filter(Boolean))];
  const lines = [];
  lines.push(`SEGMENT: ${notes.length === 1 ? notes[0].headline : `${notes.length} scenes, from "${notes[0].headline}" to "${notes.at(-1).headline}"`}`);
  if (options.title) lines.push(`FROM: ${options.title}`);
  if (state.logline) lines.push(`STORY: ${state.logline}`);
  lines.push(`PEOPLE: ${people.size ? [...people.values()].map(personLine).join(" | ") : "(nobody cast)"}`);
  lines.push(`PLACES: ${places.length ? places.join("; ") : "(none set)"}`);
  for (const note of notes) {
    lines.push("");
    lines.push(`SCENE: ${note.headline}${note.location ? ` — at ${note.location}` : ""}`);
    lines.push(`WHAT CHANGES: ${note.change}`);
    if (note.plants) {
      const heads = state.arrows.filter((arrow) => arrow.kind === "setup" && arrow.from === note.id).map((arrow) => byId.get(arrow.to)?.headline).filter(Boolean);
      const later = note.payoffBoardId ? (options.boards ?? []).find((board) => board.id === note.payoffBoardId)?.name ?? "a later board" : null;
      const where = heads.length ? `pays off at ${heads.map((headline) => `"${headline}"`).join(" and ")}` : later ? `pays off later, on "${later}"` : "pays off later, nowhere yet";
      lines.push(`PLANTS: something here ${where}; keep it visible.`);
    }
    if (note.text && note.text.trim()) {
      lines.push("SCRIPT:");
      lines.push(note.text.trim());
    } else {
      lines.push("SCRIPT: (unwritten — build from the change line)");
    }
  }
  lines.push("");
  lines.push(`AFTER: ${notes.at(-1).change}${notes.length === 1 ? " (the change line, until the scene is written)" : ""}`);
  return lines.join("\n");
}
