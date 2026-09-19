// Are you an agent? Start here (R43).
//
// The on-ramp, written once: what PlotCoder is in three sentences, the doors
// in, what to call first, the rules in one breath, and a part for the person
// about trust. The Agents sheet reads it, the file at /llms.txt is generated
// from it, and the README's agent section says the same. DOM-free.

export const AGENTS = {
  lead:
    "A storyline wall. Cards are scenes, beats are the big turns, arrows say what follows or pays off what. An agent driven by a person has every tool a person here has; the person directs, the agent operates. Call the tools; never fake a mouse. Already have the plotcoder-board tools in front of you? Then your way in is: read the guide, make the five calls under Call these first, and skip the doors at the end — they are for wiring a server in.",
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
      text: "Where someone runs PlotCoder's server for you — npx -y plotcoder-board@latest serve puts it on a port, and the repo has a Dockerfile — an MCP client connects over HTTP with the writer's sign-in on the request: claude mcp add plotcoder --transport http https://<that host>/mcp --header \"Authorization: Basic <base64 of email:password>\", then start the session again. The same server, the same tools, the account as the wall, no disk. PlotCoder does not run a public one yet; the address is the writer's to give.",
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
  firstNote: "Make these five before anything else; none depends on another, so any order is fine. list_words and list_workflows are the app's and read no project, and their first line says so; every other reading opens with the door it came through — the project it read and how many the account holds — and a write's tail says where it landed; list_projects lists the projects. read_wall, list_reminders and list_board are about the wall you will work, so after open_project or open_board make those three again, and after new_project read the wall once it holds cards. An emptied account has nothing to read: go straight to new_project: a name is enough; pages sets the target and board names the first board when the writer has them, and set_target and rename_board set them later. On an account with no project yet, read_wall has nothing to read and says so, and list_reminders gives the house principles every project starts with. No server in front of you, and no shell to take the shell door? Nothing gets you in from inside the session: say so, and ask the person to wire the server and start a new session.",
  first: [
    { tool: "list_words", why: "the room's words, the app's meaning." },
    { tool: "read_wall", why: "the reading: the beats, the runs, the setups, and what the wall asks. The records — every card, the cast, the places, the rows — are list_board's. A fresh folder holds a sample wall (Maya, Tom, the letter) and the reading says so only when it is the sample; it is not the writer's. An account can hold a wall from earlier work that is neither the sample nor what the writer means to work now: every reading names the project it read and list_projects names who is on it; ask the writer before touching it, and new_project starts theirs beside it." },
    { tool: "list_workflows", why: "what a writer can ask you for." },
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
  url: "https://plotcoder.com/llms.txt",
};

/** The on-ramp as one text: the file at /llms.txt, and what an agent reads. */
export function agentsAsText() {
  // The calls and the rules first, the doors after: an agent with the tools in
  // front of it reads two pages of wiring it was told to skip before it reached
  // the first call (round fifteen, entry 1).
  const lines = ["# PlotCoder — for agents", "", AGENTS.lead, "", `The guide: ${AGENTS.guide}. Read it once, before your first call if you can; it is the whole and this page is its first page, and where the two differ, the guide wins. Then Call these first, below.`, "", "## Call these first"];
  AGENTS.first.forEach((item, index) => lines.push(`${index + 1}. ${item.tool} — ${item.why}`));
  lines.push("", AGENTS.firstNote);
  lines.push("", "## Rules");
  for (const rule of AGENTS.rules) lines.push(`- ${rule}`);
  lines.push("", "## Doors");
  for (const door of AGENTS.doors) {
    lines.push(`- ${door.name}: ${door.text}`);
    if (door.code) lines.push("", "```", door.code, "```", "");
  }
  lines.push("## For the person", AGENTS.person, "", "## The guide", AGENTS.guide, "");
  return lines.join("\n");
}
