#!/usr/bin/env node
// Wipe a test account (R44).
//
// A blind run (blind-runs/) works a throwaway account. When the round is over
// this takes it away — the projects, the boards, the files in the bucket, and
// optionally the account itself. Postgres cascades every table off auth.users,
// so the account's removal is one statement; storage cascades nothing, so the
// files go first and by hand.
//
//   node scripts/wipe-test-account.mjs robert+round4@example.com            # dry run
//   node scripts/wipe-test-account.mjs robert+round4@example.com --empty --yes
//   node scripts/wipe-test-account.mjs robert+round4@example.com --delete --yes
//   node scripts/wipe-test-account.mjs robert+round4@example.com --mark     # make it wipeable
//   node scripts/wipe-test-account.mjs robert+round4@example.com --unmark
//
// It refuses any address whose writer row is not marked `test`, so a real
// writer's work cannot be taken by a mistyped address. Nothing happens without
// --yes: the default is to print the plan and stop.
//
// Needs the service role key, which is not in this repo and must never be:
//
//   SUPABASE_SERVICE_ROLE_KEY=...  (or PLOTCODER_SERVICE_ROLE_KEY)
//   SUPABASE_URL=...               (optional; defaults to PlotCoder's project)

import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";
import { describePlan, planWipe } from "./wipe-plan.mjs";

const DEFAULT_URL = "https://kmpahjsggbleygsnuwug.supabase.co";
const BUCKET = "projects";

const argv = process.argv.slice(2);
const email = argv.find((arg) => !arg.startsWith("--"));
const has = (flag) => argv.includes(`--${flag}`);

if (!email || has("help")) {
  console.error(
    [
      "usage: node scripts/wipe-test-account.mjs <email> [--empty|--delete] [--yes]",
      "       node scripts/wipe-test-account.mjs <email> --mark | --unmark",
      "",
      "  --empty    remove the account's projects; keep the account itself (default)",
      "  --delete   remove the projects and the account",
      "  --yes      actually do it; without this the plan is printed and nothing changes",
      "  --mark     mark the address as a test account, the only kind this will wipe",
      "  --unmark   take that mark off again",
      "",
      "Needs SUPABASE_SERVICE_ROLE_KEY in the environment.",
    ].join("\n"),
  );
  process.exit(2);
}

const url = process.env.SUPABASE_URL || DEFAULT_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PLOTCODER_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error(
    "No service role key. Set SUPABASE_SERVICE_ROLE_KEY in this shell — it is not in the repo and must not be.",
  );
  process.exit(2);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

/** The writer row for an address, or null. */
async function writerFor(address) {
  const { data, error } = await db
    .from("writers")
    .select("email, user_id, test")
    .eq("email", address)
    .maybeSingle();
  if (error) {
    // The flag arrives with a migration; without it every address would look
    // like a writer's and the rail would be a message nobody could satisfy.
    if (/column .*test.* does not exist/i.test(error.message)) {
      throw new Error(
        "The writers table has no `test` column yet. Apply supabase/migrations/*_test_accounts.sql " +
          "to the project first — until then nothing here can be marked, and nothing will be wiped.",
      );
    }
    throw new Error(`reading writers: ${error.message}`);
  }
  return data ?? null;
}

async function mark(address, value) {
  const writer = await writerFor(address);
  if (!writer) {
    console.error(`No account here by ${address}.`);
    process.exit(1);
  }
  const { error } = await db.from("writers").update({ test: value }).eq("user_id", writer.user_id);
  if (error) throw new Error(`marking: ${error.message}`);
  console.log(
    value
      ? `${address} is a test account. It can now be wiped by this script, and only by this script.`
      : `${address} is a writer's account again. This script will refuse it.`,
  );
}

/** Every project the account can see, and every stored file under its own. */
async function lookFor(writer) {
  const { data: projects, error } = await db
    .from("projects")
    .select("id, name:record->>name, owner, members!inner(user_id)")
    .eq("members.user_id", writer.user_id);
  if (error) throw new Error(`reading projects: ${error.message}`);

  const rows = [];
  for (const project of projects ?? []) {
    const { count, error: boardError } = await db
      .from("boards")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id);
    if (boardError) throw new Error(`counting boards: ${boardError.message}`);
    rows.push({ id: project.id, name: project.name ?? "", owner: project.owner, boards: count ?? 0 });
  }

  const objects = [];
  for (const project of rows.filter((row) => row.owner === writer.user_id)) {
    objects.push(...(await listFolder(project.id)));
  }
  return { projects: rows, objects };
}

/** Storage has no recursive list, so walk the folders we know the shape of. */
async function listFolder(prefix) {
  const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw new Error(`listing ${prefix}: ${error.message}`);
  const found = [];
  for (const entry of data ?? []) {
    const path = `${prefix}/${entry.name}`;
    // A row with no id is a folder, not a file.
    if (entry.id === null) found.push(...(await listFolder(path)));
    else found.push(path);
  }
  return found;
}

async function confirm(plan) {
  if (has("yes")) return true;
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`Type the address to confirm (${plan.email}): `);
  rl.close();
  return answer.trim() === plan.email;
}

async function main() {
  if (has("mark")) return mark(email, true);
  if (has("unmark")) return mark(email, false);

  const mode = has("delete") ? "delete" : "empty";
  const writer = await writerFor(email);
  const found = writer ? await lookFor(writer) : { projects: [], objects: [] };
  const plan = planWipe({ writer, ...found }, mode);

  for (const line of describePlan(plan)) console.log(line);
  if (!plan.ok) process.exit(1);

  if (!has("yes")) {
    console.log("");
    console.log("Nothing was changed. Add --yes to do it.");
    return;
  }
  if (!(await confirm(plan))) {
    console.log("Left alone.");
    return;
  }

  // Files first: the storage policies read membership, and membership is about
  // to stop existing.
  if (plan.files.length) {
    const { error } = await db.storage.from(BUCKET).remove(plan.files);
    if (error) throw new Error(`removing files: ${error.message}`);
    console.log(`Removed ${plan.files.length} file${plan.files.length === 1 ? "" : "s"}.`);
  }

  if (plan.projects.length) {
    const { error } = await db
      .from("projects")
      .delete()
      .in("id", plan.projects.map((project) => project.id));
    if (error) throw new Error(`removing projects: ${error.message}`);
    console.log(`Removed ${plan.projects.length} project${plan.projects.length === 1 ? "" : "s"}; boards and assets cascaded.`);
  }

  if (plan.removesAccount) {
    const { error } = await db.auth.admin.deleteUser(plan.userId);
    if (error) throw new Error(`removing the account: ${error.message}`);
    console.log(`Removed the account. ${plan.email} is free to claim again.`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
