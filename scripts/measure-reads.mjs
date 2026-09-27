#!/usr/bin/env node
// How big every read is, in the words an agent gets (pass 3a, docs/plan.md,
// goal 3): starts the stdio server on a throwaway folder with the JSON tail
// off, as every door ships it; brings a project file in; then makes every
// read an agent makes — the on-ramp's first six, the whole project, and each
// board's reading, records, pages and exports — and reports the size of each
// reply in characters, words and an estimate of tokens at three and a half characters
// each (a Claude tokenizer is not public; prose runs near that, ids and
// headings under it). A reply over the budget is marked.
//
//   node scripts/measure-reads.mjs <project.json> [--budget 10000] [--dump <dir>]
//
// --dump writes each reply to a file, for a tokenizer or a person. Nothing
// here touches the network or the account.

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), "plotcoder-mcp.mjs");
// Checked once against a public tokenizer on these very replies: prose ran 3.5 to 3.8 characters a token, list_board's ids 2.2, the plain-text export 5.
const CHARS_PER_TOKEN = 3.5;

class Door {
  constructor(root) {
    this.root = root;
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = "";
  }
  async start() {
    this.child = spawn("node", [SERVER], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PLOTCODER_ROOT: this.root, PLOTCODER_NO_BRIDGE: "1", PLOTCODER_JSON: "0" },
    });
    this.child.stdout.setEncoding("utf8");
    this.child.stdout.on("data", (chunk) => this.consume(chunk));
    this.child.stderr.on("data", () => {});
    await this.request("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "measure-reads", version: "1.0.0" } });
    this.send({ jsonrpc: "2.0", method: "notifications/initialized" });
  }
  consume(chunk) {
    this.buffer += chunk;
    let cut;
    while ((cut = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, cut).trim();
      this.buffer = this.buffer.slice(cut + 1);
      if (!line) continue;
      let message;
      try { message = JSON.parse(line); } catch { continue; }
      const waiting = this.pending.get(message.id);
      if (waiting) { this.pending.delete(message.id); waiting(message); }
    }
  }
  send(message) { this.child.stdin.write(`${JSON.stringify(message)}\n`); }
  request(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`timed out: ${method}`)); }, 120000);
      this.pending.set(id, (message) => { clearTimeout(timer); message.error ? reject(new Error(message.error.message)) : resolve(message.result); });
      this.send({ jsonrpc: "2.0", id, method, params });
    });
  }
  async call(name, args = {}) {
    const result = await this.request("tools/call", { name, arguments: args });
    return result.content.map((part) => part.text ?? "").join("\n");
  }
  stop() { this.child?.kill(); }
}

const size = (text) => ({ chars: text.length, words: text.split(/\s+/).filter(Boolean).length, tokens: Math.ceil(text.length / CHARS_PER_TOKEN) });

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((arg) => !arg.startsWith("--"));
  if (!file) { console.error("usage: node scripts/measure-reads.mjs <project.json> [--budget 10000] [--dump <dir>]"); process.exit(1); }
  const budget = Number(args[args.indexOf("--budget") + 1]) || 10000;
  const dump = args.includes("--dump") ? path.resolve(args[args.indexOf("--dump") + 1]) : null;
  if (dump) fs.mkdirSync(dump, { recursive: true });
  const text = fs.readFileSync(file, "utf8");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-measure-"));
  const door = new Door(root);
  await door.start();
  const rows = [];
  const project = JSON.parse(JSON.parse(text).storage["plotcoder.project"]);
  let dumped = 0;
  const measure = async (label, name, callArgs = {}, board = "") => {
    let reply;
    try { reply = await door.call(name, callArgs); } catch (error) { reply = `(failed: ${error.message})`; }
    const row = { label, board, ...size(reply) };
    rows.push(row);
    if (dump) fs.writeFileSync(path.join(dump, `${String(++dumped).padStart(3, "0")}-${label.replace(/[^\w-]+/g, "_")}${board ? `-${board.replace(/[^\w-]+/g, "_")}` : ""}.txt`), reply);
    return reply;
  };
  try {
    const listed = await door.request("tools/list", {});
    const tools = JSON.stringify(listed.tools);
    rows.push({ label: "tools/list (every tool's name, description and schema — sent with every turn)", board: "", ...size(tools) });
    const imported = await door.call("import_project", { text, confirm: true });
    console.log(`# Reads measured on "${project.name}"\n`);
    console.log(`${imported.split("\n")[0]}\n`);
    // The on-ramp's first six, as the on-ramp orders them.
    for (const name of ["list_words", "list_workflows", "list_projects"]) await measure(`${name} (on-ramp)`, name);
    await measure("read_wall (on-ramp, the open board)", "read_wall", {}, project.boards.find((meta) => meta.id === project.activeBoardId)?.name ?? "");
    await measure("list_reminders (on-ramp)", "list_reminders");
    await measure("list_board (on-ramp, the open board)", "list_board", {}, project.boards.find((meta) => meta.id === project.activeBoardId)?.name ?? "");
    // The whole project.
    for (const name of ["read_project", "list_boards", "list_questions", "read_record", "list_structures", "list_files"]) await measure(name, name);
    const person = project.characters?.[0]?.name;
    if (person) await measure(`read_character ("${person}")`, "read_character", { name: person });
    // The selecting reads across the project (R77 b and c): one person's pages on the open board, and a card found by a phrase.
    if (person) await measure(`read_character ("${person}", pages)`, "read_character", { name: person, pages: true });
    await measure('find_card ("key")', "find_card", { phrase: "key" });
    // Each board.
    for (const meta of project.boards) {
      await door.call("open_board", { board: meta.id });
      await measure("read_wall", "read_wall", {}, meta.name);
      await measure("read_wall only questions", "read_wall", { only: "questions" }, meta.name);
      await measure("read_wall only length", "read_wall", { only: "length" }, meta.name);
      await measure("list_board", "list_board", {}, meta.name);
      await measure("read_pages", "read_pages", {}, meta.name);
      // The selecting reads (R77 a): one scene, a stretch of ten, an act — beside the whole board's pages.
      const ids = [...(await door.call("list_board")).matchAll(/^  - ([0-9a-f-]{36}) \[/gm)].map((match) => match[1]);
      if (ids.length) {
        await measure("read_pages one scene", "read_pages", { scene: ids[0] }, meta.name);
        await measure("read_pages a stretch of ten", "read_pages", { from: ids[0], to: ids[Math.min(9, ids.length - 1)] }, meta.name);
        await measure('read_pages the group "Act Two"', "read_pages", { group: "Act Two" }, meta.name);
      }
      await measure("page_count", "page_count", {}, meta.name);
      await measure("read_record", "read_record", {}, meta.name);
      await measure("export_fountain", "export_fountain", {}, meta.name);
      await measure("export_markdown", "export_markdown", {}, meta.name);
      await measure("export_text", "export_text", {}, meta.name);
    }
    await measure("export_project (inline)", "export_project", { inline: true });
  } finally {
    door.stop();
    fs.rmSync(root, { recursive: true, force: true });
  }
  const fmt = (n) => n.toLocaleString("en-GB");
  console.log(`| Read | Board | Characters | Words | ≈ Tokens | Over ${fmt(budget)}? |`);
  console.log("| --- | --- | ---: | ---: | ---: | --- |");
  for (const row of rows) console.log(`| ${row.label} | ${row.board} | ${fmt(row.chars)} | ${fmt(row.words)} | ${fmt(row.tokens)} | ${row.tokens > budget ? "**over**" : ""} |`);
  const onRamp = rows.filter((row) => row.label.includes("on-ramp")).reduce((sum, row) => sum + row.tokens, 0);
  const oneBoard = (label) => rows.filter((row) => row.board === project.boards[0].name && row.label === label)[0]?.tokens ?? 0;
  const perBoard = (label) => rows.filter((row) => row.label === label && row.board).reduce((sum, row) => sum + row.tokens, 0);
  console.log(`\n- The on-ramp's six calls, before a word to the writer: ≈ ${fmt(onRamp)} tokens, plus the tool list's ≈ ${fmt(rows[0].tokens)} on every turn.`);
  console.log(`- One board read whole (read_wall + list_board + read_pages, "${project.boards[0].name}"): ≈ ${fmt(oneBoard("read_wall") + oneBoard("list_board") + oneBoard("read_pages"))} tokens.`);
  console.log(`- Every board's read_wall: ≈ ${fmt(perBoard("read_wall"))}; every board's read_pages: ≈ ${fmt(perBoard("read_pages"))}; read_project alone: ≈ ${fmt(rows.find((row) => row.label === "read_project")?.tokens ?? 0)}.`);
  console.log(`- Over the budget of ${fmt(budget)}: ${rows.filter((row) => row.tokens > budget).length} of ${rows.length} reads.`);
  if (dump) console.log(`- Replies written under ${dump}.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
