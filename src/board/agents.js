// Are you an agent? Start here (R43).
//
// The on-ramp, written once: what PlotCoder is in three sentences, the doors
// in, what to call first, the rules in one breath, and a part for the person
// about trust. The Agents sheet reads it, the file at /llms.txt is generated
// from it, and the README's agent section says the same. DOM-free.

export const AGENTS = {
  lead:
    "A storyline wall. Cards are scenes, beats are the big turns, arrows say what follows or pays off what. An agent driven by a person has every tool a person here has; the person directs, the agent operates. Call the tools; never fake a mouse. Already have PlotCoder's tools in front of you — list_words, read_wall and the rest, under whatever name your session gives the server or the connector (plotcoder-board, plotcoder, PlotCoder — or no name at all, only an id: know the server by its tools, list_words and read_wall)? Then your way in is this page and one more: read the day-one guide, make the calls under Call these first, and you are working. No tools in front of you? The doors are how a server is wired in.",
  doors: [
    {
      id: "mcp",
      name: "MCP, for the next session",
      text: "For Cursor or Claude Code, once, from any folder — nothing to clone: claude mcp add plotcoder-board -s user -- npx -y plotcoder-board@latest — then start the session again. A server wired from inside a session connects on the next one, never the one you are in; an agent already inside a session takes the shell door below. The block is the same wiring for a config file; npx fetches the current server each time. A server that comes up with one tool, plotcoder_not_installed, is a checkout of the repo whose npm ci was never run: that only happens with the repo as the session's folder.",
      code: '{\n  "mcpServers": {\n    "plotcoder-board": {\n      "command": "npx",\n      "args": ["-y", "plotcoder-board@latest"]\n    }\n  }\n}',
    },
    {
      id: "shell",
      name: "The shell, for this session",
      text: "npx -y plotcoder-board@latest call <tool> '{json}' makes one call, with no MCP and no restart. One server per call, so undo and the project you opened do not carry between calls; npx -y plotcoder-board@latest call --batch < calls.jsonl runs a file of calls — one per line, {\"tool\": \"…\", \"arguments\": {…}} — on one server, so they do. With the account door the sign-in is kept in the folder's .plotcoder between calls (PLOTCODER_SESSION=0 to sign in every time). PLOTCODER_PROJECT names the project for each call. The JSON tail is off on every door; PLOTCODER_JSON=1 in the server's environment adds it. PLOTCODER_ROOT points the server at the folder whose wall you mean; without it, the folder you run it from.",
    },
    {
      id: "hosted",
      name: "The hosted door, with nothing installed",
      text: "Where someone runs PlotCoder's server for you — npx -y plotcoder-board@latest serve puts it on a port, and the repo has a Dockerfile — an MCP client connects over HTTP with the writer's sign-in on the request: claude mcp add plotcoder --transport http https://<that host>/mcp --header \"Authorization: Basic <base64 of email:password>\", then start the session again. The same server, the same tools, the account as the wall, no disk. PlotCoder runs one at https://mcp.plotcoder.com — claude mcp add plotcoder --transport http https://mcp.plotcoder.com --header \"Authorization: Basic <base64 of email:password>\", or in the Claude desktop app, Settings › Connectors › add a custom connector with that address and header, choosing No sign-in on its Authentication screen (the screen says OAuth is detected; the door has none, and the header is the sign-in): the app keeps a connector in its own settings, where a stdio block in a file can vanish. The password rides in the header, base64 over https, as the env block carries it; share a machine and know it.",
    },
    {
      id: "account",
      name: "The account",
      text: "With the writer's own sign-in in the server's environment, the same server works their project from anywhere, live on every open wall. The two variables go where the server is started: in the MCP config's env, as -e flags on claude mcp add, or exported in the shell before a call. With the sign-in set, the account is the wall, even when a dev app is open on the machine. Without PLOTCODER_PROJECT it works the project touched most recently. Every read of the wall or the project names the project it read; the app's own lists — list_words, list_workflows — belong to no project. A wrong password is refused by every tool, never worked around. No account yet? claim_account makes one with the writer's email and a password they chose, and starts it empty.",
      code: '{\n  "mcpServers": {\n    "plotcoder-board": {\n      "command": "npx",\n      "args": ["-y", "plotcoder-board@latest"],\n      "env": {\n        "PLOTCODER_EMAIL": "you@example.com",\n        "PLOTCODER_PASSWORD": "…",\n        "PLOTCODER_PROJECT": "The Letter"\n      }\n    }\n  }\n}\n\nclaude mcp add plotcoder-board -s user \\\n  -e PLOTCODER_EMAIL=you@example.com \\\n  -e PLOTCODER_PASSWORD=… \\\n  -- npx -y plotcoder-board@latest',
    },
    {
      id: "page",
      name: "The page",
      text: "window.plotcoder on an open wall, for a browser session.",
    },
    {
      id: "where",
      name: "Where the wall lives, without an account",
      text: "Skip this when the account is the wall. Without an account, a wall is a folder: any folder, empty is fine — choose one that will outlive your session, never a scratch one. The app run from that folder shows the wall, and the server writes it there (PLOTCODER_ROOT, or the folder it is run from). A fresh folder holds the sample; new_board for the writer's wall, then rename_project. No app running? export_fountain is the wall in order, as text.",
    },
  ],
  firstNote: "Make the first three before anything else: list_words and list_workflows are the app's and read no project, and their first line says so; list_projects says which wall is in hand. Then the three reads — read_wall, list_reminders, list_board — of the wall you are to work, and not of a wall you are about to leave: when the writer has told you to start a project of your own, or the project in hand is not theirs to work, new_project or open_project comes first, so you never spend your first reading on someone else's wall. A write's tail counts the wall's questions until your first read_wall of the wall in hand, and quotes them after it; starting or opening a project, or opening a board, begins that again. every other reading opens with the door it came through — the project it read and how many the account holds — and a write's tail says where it landed; list_projects lists the projects. After open_project or open_board make those three again, and after new_project make them at once: an empty board's reading says nothing to check yet, and that is the first reading. When the writer's brief orders the first calls another way, the writer's word wins; the only cost of a reading spent on another wall is a tail that counts until the next. If those calls say the account holds no project, there is nothing more to read: go to new_project next — a name is enough; pages sets the target and board names the first board when the writer has them, and set_target and rename_board set them later. On an account with no project yet, read_wall has nothing to read and says so, and list_reminders gives the house principles every project starts with. No server in front of you, and no shell to take the shell door? Nothing gets you in from inside the session: say so, and ask the person to wire the server and start a new session.",
  first: [
    { tool: "list_words", why: "the room's words, the app's meaning." },
    { tool: "list_workflows", why: "what a writer can ask you for — and, in its first workflow, what a treatment should answer: the questions to put to the writer before you build, each with the tool its answer lands in." },
    { tool: "list_projects", why: "which wall you are about to read: the projects this door can see, who is on each, and which one is in hand. On an account it may be a project from earlier work that is not the one the writer means — then new_project (or open_project) comes before the three reads below, not after them. On a folder it says so, and there is one wall." },
    { tool: "read_wall", why: "the reading: the beats, the runs, the setups, and what the wall asks. The records — every card, the cast, the places, the rows — are list_board's. A fresh folder holds a sample wall (Maya, Tom, the letter) and the reading says so only when it is the sample; it is not the writer's. An account can hold a wall from earlier work that is neither the sample nor what the writer means to work now: every reading names the project it read and list_projects names who is on it; ask the writer before touching it, and new_project starts theirs beside it." },
    { tool: "list_reminders", why: "the house principles the app starts with, and the writer's own; read them before you change anything. Reminders live on the project and go with it." },
    { tool: "list_board", why: "the records — every card, the cast, the places, the rows — with their ids, which the reading does not carry and every write needs." },
  ],
  rules: [
    "Questions, not fixes, until the writer says.",
    "No opinions about how many beats there should be. Marking the turns a treatment plainly makes is reading it, not an opinion: mark them, say which, and let the writer strike or add.",
    "Page counts are estimates.",
    "Ask before delete_board, delete_project, empty_account, delete_account, unlock_numbers, remove_file, an import_project that replaces, or claim_account — the writer gives the email and the password; never invent one. export_project first, when something might be wanted back.",
    "Do not invent people or a logline. What the treatment states — an age, a job, a bad knee — is not invented: it goes in the person's notes. An unnamed person is named by their role — Dana's mother, the dispatcher — which is a name until the writer gives one. A scene is one place and one stretch of time; a new place or time is a new card. A beat is a whole card; a setup arrow lands on the scene's card, so a payoff never needs a card of its own. Acts are groups titled Act one, Act two, when the treatment has them; the wall never asks whether an act is a sequence. Paper colour means nothing to the app. Under target is a fact to report plainly, like over; neither is a verdict. A thing the writer has not decided is an open card in their words (set_open), or an open field — the logline, the premise, a card's place or when, a board's or the project's name take open beside the value — never a guess to fill the field; a thing whose far end the writer knows and not where it is first seen — the letter, the ring — is a thread (create_thread) with an open start, and the wall asks from that end.",
  ],
  person:
    "Give your agent the account door only on a machine you trust; it signs in as you and shows under People as “an agent, as you” while it runs. Wire the server before you start the agent's session, with the two sign-in lines beside it, and the agent has every tool from its first message; wired from inside a session, the server connects only on the next one. Your agent can also make your account: give it your email and a password of your choosing. Your own guide — how a writer uses PlotCoder, from the door to the script out, the agent first — is at https://plotcoder.com/writers.html.",
  guide: "https://plotcoder.com/guide.md",
  /** The part of the guide a day's work needs, cut from the guide itself so the two cannot drift (round twenty-three, entries 1, 2; twenty-two's 6, 8). */
  dayOne: "https://plotcoder.com/day-one.md",
  /** The doors, on a page of their own: someone holding the tools never needs them, and read them all the same when they were here. */
  wiring: "https://plotcoder.com/wiring.md",
  url: "https://plotcoder.com/llms.txt",
};

/** The on-ramp as one text: the file at /llms.txt, and what an agent reads. The calls and the rules, and nothing about wiring but where it is. */
export function agentsAsText() {
  const lines = [
    "# PlotCoder — for agents",
    "",
    AGENTS.lead,
    "",
    `The day-one guide: ${AGENTS.dayOne} — about 40 KB, the method, the reading, cards and what can be left open, threads, versions, set aside, the cast, what the tools refuse and what a reply's tail means; it is cut from the whole guide, so the two say the same, and the first calls below are the ones it names. Read it before your first call; the first calls change nothing, so making them while it downloads costs nothing either. The tool descriptions carry the rest, and the whole guide's Pages section is the one to read before write_scene. The whole guide is ${AGENTS.guide}: come to it when the writer says write it, how long, export, a series, a structure to compare with, or lock the numbers. The day-one guide is cut from the whole guide word for word, so the two cannot differ; where this page and either differ, they win.`,
    "",
    "## Call these first",
  ];
  AGENTS.first.forEach((item, index) => lines.push(`${index + 1}. ${item.tool} — ${item.why}`));
  lines.push("", AGENTS.firstNote);
  lines.push("", "## Rules");
  for (const rule of AGENTS.rules) lines.push(`- ${rule}`);
  lines.push("", "## No tools in front of you?", `The doors — the MCP server as a package, the shell door, the hosted door at https://mcp.plotcoder.com, the account's sign-in — are on a page of their own: ${AGENTS.wiring}. Someone holding the tools needs none of it.`, "");
  return lines.join("\n");
}

/** The doors, for whoever wires a server in: the file at /wiring.md. */
export function wiringAsText() {
  const lines = ["# PlotCoder — wiring a server in", "", "For whoever connects PlotCoder's tools to an agent's session. An agent with the tools already in front of it needs none of this: its page is https://plotcoder.com/llms.txt.", "", "## Doors"];
  for (const door of AGENTS.doors) {
    lines.push(`- ${door.name}: ${door.text}`);
    if (door.code) lines.push("", "```", door.code, "```", "");
  }
  lines.push("## For the person", AGENTS.person, "");
  return lines.join("\n");
}

/**
 * What the MCP server hands a client at initialize, so an agent holding a
 * connector has the day's rules without fetching anything: a fetch can be
 * paraphrased by the agent's own tools (round twenty-three, entry 7), and
 * this cannot. Short on purpose; the day-one guide is the long form.
 * The Claude desktop app cuts a server's instructions at 2048 characters
 * (pass 1a, entry 1: "…which is a name until th… [truncated]" at exactly
 * that offset), so the whole text stays under 2000 and the rules are the
 * on-ramp's in fewer words.
 */
export function agentsInstructions() {
  return [
    "PlotCoder is a storyline wall: cards are scenes, beats are the big turns, arrows say what follows or pays off what. The writer directs; you operate the wall with these tools, and never fake a mouse.",
    `First: ${AGENTS.first.map((item) => item.tool).join(", ")} — the first three read no wall and say which wall is in hand; make the three reads of the wall you are to work, after new_project or open_project when the wall in hand is not that one.`,
    "Before you ask the writer anything, list_workflows: its first workflow is what a treatment should answer, each question with the tool its answer lands in. Ask those, then what the notes raise that those do not. Invent no fact.",
    "\"I don't know\" is held in the writer's words, never guessed or dropped: a card's place, when, change line and cast each take open; a maybe is a name with a question mark; a thing undecided about a person goes on their page; about the whole film, add_open_line; a whole card, set_open. Two ways of a scene: set_alternative; cut and kept: set_aside. Turns you propose are set_rank proposed: nothing is a beat on your word.",
    "Rules: questions, not fixes, until the writer says. No opinions on how many beats; marking the turns a treatment plainly makes is reading it. Page counts are estimates. Ask before delete_board, delete_project, empty_account, delete_account, unlock_numbers, remove_file, a replacing import_project, or claim_account; export_project first. Invent no person or logline; what the treatment states goes in the person's notes; an unnamed person is named by their role. A scene is one place and one stretch of time. A payoff never needs a card of its own. Acts are groups. Colour means nothing. Under or over target is a fact, not a verdict.",
    `The day-one guide is ${AGENTS.dayOne}; the whole guide, for pages, exports, a series, structures and production, is ${AGENTS.guide}.`,
  ].join("\n\n");
}
