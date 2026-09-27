// The dry run (pass 4b's rehearsal): makes no video and costs nothing. It
// writes what a real provider would be handed — the brief, the length and
// the references — to a text file, and build_segment files that as a take,
// so the whole path from the wall to the Takes panel can be walked before a
// provider and its key are chosen.

import fs from "node:fs";
import path from "node:path";

export const name = "dry-run";

export async function makeTake({ brief, subject, seconds, references, outDir }) {
  fs.mkdirSync(outDir, { recursive: true });
  const safe = String(subject).replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 60) || "segment";
  const file = path.join(outDir, `dry-run-${safe}-${Date.now()}.txt`);
  const lines = [
    "DRY RUN — no video was made. This is what a video tool would have been handed.",
    "",
    `SUBJECT: ${subject}`,
    `SECONDS: ${seconds}`,
    `REFERENCES: ${references.length ? references.map((item) => `${item.kind} "${item.name}"`).join("; ") : "(none: no page in this segment has a picture)"}`,
    "",
    brief,
    "",
  ];
  fs.writeFileSync(file, lines.join("\n"));
  return { path: file, note: "dry run" };
}
