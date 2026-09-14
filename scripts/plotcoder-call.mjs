#!/usr/bin/env node
// One tool call to the PlotCoder MCP server, from a shell — for an agent
// without MCP support, or a person checking a tool by hand.
//
//   node scripts/plotcoder-call.mjs list_words
//   node scripts/plotcoder-call.mjs create_note '{"headline":"Maya finds the letter","change":"She decides not to tell Tom."}'
//   node scripts/plotcoder-call.mjs tools            # every tool, with its description
//
// Speaks JSON-RPC over stdio to scripts/plotcoder-mcp.mjs and prints the
// reply's text. The same environment applies: PLOTCODER_ROOT for where the
// files live, PLOTCODER_EMAIL and PLOTCODER_PASSWORD for the account door.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const SERVER = fileURLToPath(new URL("./plotcoder-mcp.mjs", import.meta.url));
const [tool, rawArgs] = process.argv.slice(2);

const USAGE = `usage: node scripts/plotcoder-call.mjs <tool> ['{json arguments}']
       node scripts/plotcoder-call.mjs tools        every tool, with its description
       node scripts/plotcoder-call.mjs --help

One call, one server: each run starts scripts/plotcoder-mcp.mjs, makes the call,
and stops it. So undo, and the project new_project or open_project chose, do not
carry from one call to the next — set PLOTCODER_PROJECT for the calls that need
it. An MCP session keeps one server for the whole conversation and has both.

The environment is the server's:
  PLOTCODER_ROOT       the folder whose wall you mean (default: this one)
  PLOTCODER_EMAIL      the writer's sign-in: the account door, no app needed
  PLOTCODER_PASSWORD   a wrong password is refused by every tool, never worked around
  PLOTCODER_PROJECT    which of the writer's projects, by name or id
  PLOTCODER_JSON=0     drop the JSON tail from replies
  PLOTCODER_VERBOSE=1  show the server's own log lines`;

if (!tool || tool === "--help" || tool === "-h" || tool === "help") {
  console.error(USAGE);
  process.exit(tool ? 0 : 2);
}

let args = {};
if (rawArgs) {
  try {
    args = JSON.parse(rawArgs);
  } catch (error) {
    console.error(`arguments must be JSON: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
}

// The server's own log lines ("ready", "account door") stay off the reply
// unless PLOTCODER_VERBOSE=1 asks for them.
// PLOTCODER_ONE_CALL tells the server it will not live past this call, so its
// replies can say what does not carry to the next one.
const child = spawn("node", [SERVER], { stdio: ["pipe", "pipe", process.env.PLOTCODER_VERBOSE ? "inherit" : "ignore"], env: { ...process.env, PLOTCODER_ONE_CALL: "1" } });
let buffer = "";
const pending = new Map();
let nextId = 1;
child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  let cut;
  while ((cut = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, cut).trim();
    buffer = buffer.slice(cut + 1);
    if (!line) continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      continue;
    }
    const waiting = pending.get(message.id);
    if (waiting) {
      pending.delete(message.id);
      waiting(message);
    }
  }
});

const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`);
const request = (method, params) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${method}`)), 30_000);
    pending.set(id, (message) => {
      clearTimeout(timer);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    });
    send({ jsonrpc: "2.0", id, method, params });
  });

try {
  await request("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "plotcoder-call", version: "1.0.0" } });
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  if (tool === "tools") {
    const { tools } = await request("tools/list", {});
    for (const item of tools) console.log(`${item.name} — ${item.description}\n`);
  } else {
    const result = await request("tools/call", { name: tool, arguments: args });
    for (const part of result.content ?? []) if (part.type === "text") console.log(part.text);
    if (result.isError) process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  child.kill();
}
