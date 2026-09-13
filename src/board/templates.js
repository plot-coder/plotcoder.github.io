// Structure templates (R38, closing open question 7).
//
// A template is a list of named beats, each with a prompt for its change line
// and the fraction of the story it tends to fall near. Applying one creates
// beat cards and nothing else: no mode, no lock, no field on the card that
// remembers which template it came from. The house method (R18) is the
// first and the default. Names are plain words where a book's are its own.
//
// Pure data and DOM-free, like the kernel, so the wall, window.plotcoder and
// the MCP server all read the same five.

/** A beat of a template. `at` is a fraction of the story, 0 to 1. */
function beat(name, prompt, at) {
  return { name, prompt, at };
}

export const TEMPLATES = [
  {
    id: "turns",
    name: "Turns",
    blurb: "The house method: named major turns, eight to fifteen.",
    beats: [
      beat("Opening image", "What does the world look like before anything happens?", 0.01),
      beat("The inciting incident", "What breaks the routine and cannot be ignored?", 0.1),
      beat("The decision", "What do they choose to do about it, and what does it cost to choose?", 0.2),
      beat("Into the middle", "What door closes behind them?", 0.25),
      beat("The midpoint", "What turns here so there is no going back?", 0.5),
      beat("The complication", "What makes the plan worse than no plan?", 0.62),
      beat("The lowest point", "What is lost, and who is to blame?", 0.75),
      beat("The climax", "What answers the central question, and how much does it cost?", 0.9),
      beat("Closing image", "What does the world look like after?", 0.98),
    ],
  },
  {
    id: "three-acts",
    name: "Three acts",
    blurb: "The oldest map: beats as act breaks.",
    beats: [
      beat("Setup", "Who is this, and what do they want before the story starts?", 0.01),
      beat("The inciting incident", "What breaks the routine and cannot be ignored?", 0.1),
      beat("Into act two", "What choice ends the world of act one?", 0.25),
      beat("The midpoint", "What turns here so there is no going back?", 0.5),
      beat("Into act three", "What is the last decision that makes the ending necessary?", 0.75),
      beat("The climax", "What answers the central question, and how much does it cost?", 0.9),
      beat("Resolution", "What is different now, and who knows it?", 0.97),
    ],
  },
  {
    id: "eight-sequences",
    name: "Eight sequences",
    blurb: "One beat opening each sequence, an eighth of the story apart.",
    beats: [
      beat("Sequence one: the world", "What is the status quo, and what disturbs it?", 0.0),
      beat("Sequence two: the problem", "What is the predicament, and what is chosen?", 0.125),
      beat("Sequence three: the first try", "What is the first attempt, and why does it fail?", 0.25),
      beat("Sequence four: the raised stakes", "What is tried next, and what does it cost?", 0.375),
      beat("Sequence five: the reversal", "What turns at the midpoint?", 0.5),
      beat("Sequence six: the collapse", "What falls apart?", 0.625),
      beat("Sequence seven: the last push", "What is the final plan?", 0.75),
      beat("Sequence eight: the resolution", "What is answered, and what is left?", 0.875),
    ],
  },
  {
    id: "fifteen-beats",
    name: "Fifteen beats",
    blurb: "The popular beat sheet, in plain words.",
    beats: [
      beat("Opening image", "What does the world look like before?", 0.01),
      beat("The theme is said aloud", "Who says, in passing, what the story is about?", 0.05),
      beat("The world before", "What is the routine, and what is wrong with it?", 0.06),
      beat("The catalyst", "What arrives and changes everything?", 0.1),
      beat("The debate", "Why not go? What is the fear?", 0.15),
      beat("Into the new world", "What is the choice that starts act two?", 0.25),
      beat("The second story", "Who arrives to carry the theme?", 0.28),
      beat("The promise of the premise", "What is the fun the poster promised?", 0.35),
      beat("The midpoint", "A false victory or a false defeat: which, and what is raised?", 0.5),
      beat("The opposition closes in", "What goes wrong from outside, and what from inside?", 0.6),
      beat("All is lost", "What dies, in fact or in feeling?", 0.75),
      beat("The dark night", "What is understood in the dark?", 0.8),
      beat("Into the finale", "What is the new idea that makes act three possible?", 0.85),
      beat("The finale", "How is the lesson applied and the opposition beaten?", 0.9),
      beat("Final image", "What does the world look like after?", 0.99),
    ],
  },
  {
    id: "story-circle",
    name: "Story circle",
    blurb: "The journey as a circle, in eight steps.",
    beats: [
      beat("Comfort", "Where are they at ease, and what is missing?", 0.0),
      beat("Need", "What do they want badly enough to move?", 0.125),
      beat("Crossing", "What unfamiliar place do they enter?", 0.25),
      beat("Adapting", "What do they learn the hard way?", 0.375),
      beat("Finding", "What do they get that they wanted?", 0.5),
      beat("Paying", "What does it cost them?", 0.625),
      beat("Returning", "How do they come back to where they started?", 0.75),
      beat("Changed", "What is different about them now?", 0.875),
    ],
  },
];

export function templateById(id) {
  return TEMPLATES.find((template) => template.id === id) ?? null;
}

/** The page a beat tends to fall near, on a story of this many eighths. */
export function beatPage(at, targetEighths) {
  const pages = Math.max(1, Math.round(targetEighths / 8));
  return Math.min(pages, Math.max(1, Math.round(at * pages) + (at === 0 ? 1 : 0)));
}
