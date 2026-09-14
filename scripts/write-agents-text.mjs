// Write the agent on-ramp (R43) as files the site serves: public/llms.txt, the
// convention agents' tools look for, and public/agents.md beside it. Run
// before every build so the files never drift from src/board/agents.js.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { agentsAsText } from "../src/board/agents.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const text = agentsAsText();
for (const name of ["llms.txt", "agents.md"]) {
  fs.writeFileSync(path.join(root, "public", name), text);
}
// The guide too, so an agent can read it before it has cloned anything
// (round four, finding 3): public/guide.md is the skill, verbatim.
const guide = fs.readFileSync(path.join(root, ".cursor", "skills", "plotcoder-board", "SKILL.md"), "utf8");
fs.writeFileSync(path.join(root, "public", "guide.md"), guide);
console.log(`wrote public/llms.txt, public/agents.md (${text.length} chars) and public/guide.md (${guide.length} chars)`);
