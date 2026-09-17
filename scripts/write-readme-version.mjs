// Keep the README's status line at the package's version. Runs as npm's
// `version` hook, after `npm version patch` bumps package.json and before it
// commits, so the line can no longer fall behind a release (docs/to-do.md,
// 2026-09-17: it was three releases stale).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { version } = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const readmePath = path.join(root, "README.md");
const readme = fs.readFileSync(readmePath, "utf8");
const next = readme.replace(/^Version \d+\.\d+\.\d+\./m, `Version ${version}.`);
if (next === readme && !readme.includes(`Version ${version}.`)) {
  console.error("README.md has no 'Version x.y.z.' status line to update");
  process.exit(1);
}
fs.writeFileSync(readmePath, next);
console.log(`README.md says version ${version}`);
