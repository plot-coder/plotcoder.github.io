// What these words mean (R42).
//
// PlotCoder talks like a story room: beat, logline, change line, the folded
// corner, eighths. This is the one place that says what each means — one
// sentence, PlotCoder's meaning, for a person who has not sat in that room.
// Grouped in the method's order (R18), which is the order a new person meets
// them. DOM-free and shared: the Words sheet, the one-second hovers on the
// wall, the skill and the MCP tool descriptions all read from here, so the
// app never explains a word two ways.
//
// `target` names the thing on the wall a definition can light up ("show me");
// words that are not things have none.

export const WORD_GROUPS = [
  {
    id: "first",
    name: "First",
    words: [
      {
        id: "wall",
        name: "The wall",
        sentence: "The corkboard. It is bigger than the window: drag to move around it, pinch or the magnifier to zoom.",
      },
      {
        id: "card",
        name: "A card",
        sentence: "One scene of the movie. A headline on top, and under it the change line: what is different after the scene than before.",
        target: "card",
      },
      {
        id: "logline",
        name: "The logline",
        sentence: "The one question the whole story argues, at the top of the wall. “Can Maya forgive?”",
        target: "logline",
      },
      {
        id: "premise",
        name: "The premise",
        sentence: "Above the logline when a project has several boards: the line the whole series is about.",
      },
      {
        id: "beat",
        name: "A beat",
        sentence:
          "One of the eight to fifteen big turns — the moment it starts, the point of no return, the lowest point, the climax. A card you mark as a beat; marking it never moves it. Everything else is a scene.",
        target: "beat",
      },
      {
        id: "scene",
        name: "A scene",
        sentence: "Every card that is not a beat: what happens between the turns. One card, one scene.",
        target: "card",
      },
    ],
  },
  {
    id: "card",
    name: "On a card",
    words: [
      {
        id: "change",
        name: "The change line",
        sentence: "The second line. If nothing is different after the scene, the scene is usually decoration.",
        target: "change",
      },
      {
        id: "corner",
        name: "The folded corner",
        sentence:
          "This card plants something — a gun on the wall — that must pay off later. The card says unpaid, and the bar’s Asks line keeps asking, until a setup arrow leaves it.",
        target: "corner",
      },
      {
        id: "arrow",
        name: "An arrow",
        sentence: "Follows: this comes after that. Setup: this plants what that pays off. Drag a card’s handle onto another.",
        target: "arrow",
      },
      {
        id: "length",
        name: "Length",
        sentence:
          "How long the scene runs, in eighths of a script page, the industry’s unit. Written scenes measure themselves; the rest is your guess.",
        target: "length",
      },
      {
        id: "cast",
        name: "The cast on a card",
        sentence: "Who is in the scene. Each person has a page: looks, voice, wants, needs.",
        target: "cast",
      },
      {
        id: "place",
        name: "The place",
        sentence: "Where it happens, in your own words. Hold a place and its scenes light up.",
        target: "place",
      },
    ],
  },
  {
    id: "around",
    name: "Around the wall",
    words: [
      { id: "group", name: "Group", sentence: "A frame around cards you select, with a title. It moves as one.", target: "group" },
      { id: "organize", name: "Organize", sentence: "Lays the cards out in rows along their arrows. One undo step." },
      {
        id: "structure",
        name: "A structure",
        sentence:
          "A list of named beats laid on the wall as beat cards to fill in — Turns, Three acts, and others. Afterwards there are only cards; nothing remembers which structure it was.",
      },
      {
        id: "strip",
        name: "Read the story",
        sentence: "The strip along the bottom: every card by length, the beats marked. Move along it to read the story in order.",
        target: "strip",
      },
      {
        id: "runtime",
        name: "Runtime and target",
        sentence: "What the cards add up to, against the length you are aiming at: 120 pages is a feature, 60 an hour, 30 a half.",
      },
      {
        id: "reminders",
        name: "Reminders",
        sentence: "Your own principles, kept where you and an agent read them before touching the wall.",
      },
    ],
  },
  {
    id: "pages",
    name: "Pages",
    words: [
      {
        id: "pages",
        name: "Pages",
        sentence: "The wall as a script: the scenes’ text in order, set as a screenplay, with page numbers. Type there and it lands on the card.",
      },
      {
        id: "formats",
        name: "Fountain and Final Draft",
        sentence: "Two ways out and in. Fountain is plain text any tool reads; Final Draft is the program most productions use.",
      },
      {
        id: "revisions",
        name: "Locked numbers, revisions",
        sentence: "Once a draft goes out, scene numbers stop moving and changes print in a colour; a scene added after the lock keeps its own letter, 2A after 2. For after the writing.",
      },
    ],
  },
  {
    id: "horizon",
    name: "The horizon",
    words: [
      {
        id: "take",
        name: "A brief, a take",
        sentence:
          "A brief is everything the wall knows about a scene, written for a tool that makes video. A take is what came back, filed on the card.",
      },
      {
        id: "agent",
        name: "An agent",
        sentence: "A program you direct, which has every tool a person here has. It calls them; it never fakes a mouse.",
      },
    ],
  },
];

export const WORDS = WORD_GROUPS.flatMap((group) => group.words);

/** One word's sentence, by id; empty when there is no such word. */
export function wordSentence(id) {
  return WORDS.find((word) => word.id === id)?.sentence ?? "";
}

/** The words as one block of text, for the skill and an agent's reading. */
export function wordsAsText() {
  return WORD_GROUPS.map((group) => [group.name, ...group.words.map((word) => `  ${word.name}: ${word.sentence}`)].join("\n")).join("\n\n");
}
