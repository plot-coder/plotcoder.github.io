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
console.log(`wrote public/llms.txt and public/agents.md (${text.length} chars)`);
