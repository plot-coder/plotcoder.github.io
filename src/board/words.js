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
        sentence: "One scene of the movie: one place, one stretch of time. A headline on top, and under it the change line: what is different after the scene than before. A new place or a new time is a new card.",
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
        sentence: "The line above every board's logline, the project's whatever its board count: what a series is about, or what is true before a film starts.",
      },
      {
        id: "beat",
        name: "A beat",
        sentence:
          "One of the eight to fifteen big turns — the moment it starts, the point of no return, the lowest point, the climax. A whole card, the scene where the turn happens, marked as a beat; marking it never moves it. Everything else is a scene.",
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
        id: "open",
        name: "Open",
        sentence: "A card the writer has not decided, in their words on its edge: the reading lists it and asks nothing else of it until the words are cleared. A field can be open the same way — the logline, the premise, a card's place or when, a board's or the project's name — the words where the value would be, listed and not asked.",
      },
      {
        id: "thread",
        name: "A thread",
        sentence: "A named string through the cards a thing runs through — the letter, the key, a subplot — with either end open until the writer ties it. Drawn on the wall as a dashed string, a ring where an end is loose; the reading asks where a loose thread is first seen, or where it comes out.",
      },
      {
        id: "help",
        name: "Help",
        sentence: "The button top right: type a question and the words and the writer's guide answer as you go; when nothing does, Ask sends it to the people who build PlotCoder, and the answer lands in the guide and under Your questions.",
      },
      {
        id: "corner",
        name: "The folded corner",
        sentence:
          "This card plants something — a gun on the wall — that must pay off later, and can say what, in the writer’s words: Plants · the letter. The card says unpaid, and the bar’s Asks line keeps asking where it comes back, until a setup arrow leaves it. One thing, three words: the corner is folded, the tool’s flag is plants, the wall’s question is unpaid.",
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
          "How long the scene runs, in eighths of a script page, the industry’s unit; the tools take pages, and a fraction is fine. Written scenes measure themselves; the rest is your guess.",
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
      { id: "group", name: "Group", sentence: "A frame around cards you select, with a title. It moves as one. A treatment’s acts can be groups, titled Act one, Act two.", target: "group" },
      {
        id: "paper",
        name: "Paper",
        sentence: "The colour of a card. It means nothing to the app; use it as the writer does — an act, a thread, a mood.",
      },
      { id: "organize", name: "Organize", sentence: "Lays the cards out in rows along their arrows. One undo step." },
      {
        id: "structure",
        name: "A structure",
        sentence:
          "A list of named beats laid on the wall as beat cards to fill in — Turns (the house method), Three acts, and others. Afterwards there are only cards; nothing remembers which structure it was.",
      },
      {
        id: "acts",
        name: "Acts",
        sentence:
          "PlotCoder has no acts of its own. The wall reads left to right, and a structure’s beats are the act breaks. A colour or a group can mark an act if the writer wants one.",
      },
      {
        id: "wordmark",
        name: "The wordmark",
        sentence: "The PlotCoder mark at the top left. It is the door to you and your projects: sign in, share, switch.",
      },
      {
        id: "lens",
        name: "The Cast panel",
        sentence: "Cast, at the top right: the roster, each person’s page, and the places. Hold a name or a place and its scenes light up.",
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
        sentence: "What the cards add up to, against the length you are aiming at: 120 pages is a feature, 60 an hour, 30 a half. A page runs about a minute on screen.",
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
        sentence: "Once a draft goes out, scene numbers stop moving and changes print in a colour with a star, on the page and in every export; a scene added after the lock has a letter, 2A after 2, that is its place between locked scenes and follows it if it moves. For after the writing.",
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
