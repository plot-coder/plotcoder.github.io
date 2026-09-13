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
    tools: ["list_words", "read_wall", "list_reminders", "create_note", "add_character", "cast", "set_location", "set_rank", "set_length", "set_plant", "create_arrow", "create_group", "organize"],
    then: "Read the wall (read_wall) and say what it asks.",
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
    if (note.plants) lines.push("PLANTS: something here pays off later; keep it visible.");
    if (note.text && note.text.trim()) {
      lines.push("SCRIPT:");
      lines.push(note.text.trim());
    } else {
      lines.push("SCRIPT: (unwritten — build from the change line)");
    }
  }
  lines.push("");
  lines.push(`AFTER: ${notes.at(-1).change}`);
  return lines.join("\n");
}
