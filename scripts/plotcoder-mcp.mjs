#!/usr/bin/env node
// The PlotCoder MCP server's front door, and the package's `plotcoder-board`
// command: no argument is the server on stdio; `call <tool> '{json}'` is one
// call from a shell; `serve` is the hosted door on a port. The server itself
// is plotcoder-mcp-server.mjs; this file only checks that it can start.
//
// When the repo's dependencies are not installed — a fresh clone, or a git
// worktree that never had `npm ci` — the server dies on its first import,
// and an MCP client says only "Connection closed" (rounds four and five).
// So this file, which needs nothing but Node, answers the client itself in
// that case: one tool, `plotcoder_not_installed`, whose description says the
// folder and the command. The agent reads the reason instead of a closed
// connection, and the fix is one line.

import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let installed = true;
try {
  createRequire(import.meta.url).resolve("@modelcontextprotocol/sdk/package.json");
} catch {
  installed = false;
}

if (installed && process.env.PLOTCODER_PRETEND_NOT_INSTALLED !== "1") {
  if (process.argv[2] === "call") {
    // `plotcoder-board call <tool> '{json}'` — one call from a shell, the
    // package's own shell door (npx plotcoder-board call list_words).
    process.argv.splice(2, 1);
    await import("./plotcoder-call.mjs");
  } else if (process.argv[2] === "serve") {
    // `plotcoder-board serve` — the hosted door on a port (R48).
    process.env.PLOTCODER_SERVE = "1";
    await import("./plotcoder-http.mjs");
  } else {
    const { serveStdio } = await import("./plotcoder-mcp-server.mjs");
    serveStdio(process.env).catch((error) => {
      process.stderr.write(`[plotcoder-mcp] fatal: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
      process.exit(1);
    });
  }
} else {
  const reason = `PlotCoder's MCP server cannot start: its dependencies are not installed in ${root}. Run \`npm ci\` in that folder once, then start the session again (or reconnect the server). Nothing else is wrong.`;
  const tool = {
    name: "plotcoder_not_installed",
    description: reason,
    inputSchema: { type: "object", properties: {} },
  };
  process.stderr.write(`[plotcoder-mcp] ${reason}\n`);
  let buffer = "";
  const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
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
      if (message.id === undefined) continue; // a notification
      const reply = (result) => send({ jsonrpc: "2.0", id: message.id, result });
      switch (message.method) {
        case "initialize":
          reply({
            protocolVersion: message.params?.protocolVersion ?? "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "plotcoder-board", version: "0.1.0" },
          });
          break;
        case "tools/list":
          reply({ tools: [tool] });
          break;
        case "tools/call":
          reply({ content: [{ type: "text", text: reason }], isError: false });
          break;
        case "ping":
          reply({});
          break;
        default:
          send({ jsonrpc: "2.0", id: message.id, error: { code: -32601, message: `${message.method}: ${reason}` } });
      }
    }
  });
  process.stdin.on("end", () => process.exit(0));
}
