// The seam between the wall and a video tool (R28; pass 4b, planned in
// blind-runs/pass-4b-plan.md). One module per provider, named in
// PLOTCODER_VIDEO_PROVIDER; build_segment hands it the brief and the
// references and files what comes back as a take, with the same code
// add_take runs. A second provider is a second module and nothing else.
//
// A provider module exports:
//
//   name: string
//   makeTake({ brief, subject, seconds, references, env, outDir })
//     -> Promise<{ path: string, note?: string }>
//
//   brief       the segment's brief, as segment_brief prints it
//   subject     the card's id, or run:<ids joined by +>, as a take is filed
//   seconds     the segment's length, a page a minute
//   references  [{ kind: "person" | "place", name, url }] — the first picture
//               on each page in the segment that has one; signed, an hour
//   env         the server's environment: PLOTCODER_VIDEO_KEY is the
//               provider's key — on the hosted door a function secret
//               (`supabase secrets set PLOTCODER_VIDEO_KEY=…`), locally the
//               shell's; never in the client, never in a file in the repo
//   outDir      a folder to write the take into
//
// It returns the file it made. It never invents what the brief leaves open:
// a gap in the brief is handed as the brief says it.

import * as dryRun from "./dry-run.mjs";

const PROVIDERS = { [dryRun.name]: dryRun };

/** The provider module by name, or null; names() lists the known ones. */
export function loadProvider(name) {
  return PROVIDERS[String(name ?? "").trim().toLowerCase()] ?? null;
}

export function providerNames() {
  return Object.keys(PROVIDERS);
}
