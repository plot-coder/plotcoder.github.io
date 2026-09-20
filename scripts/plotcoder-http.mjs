#!/usr/bin/env node
// The hosted door (R48): PlotCoder's MCP server over HTTP, for a writer's
// agent with nothing installed. One server per request, made from the
// writer's own sign-in on the request — Authorization: Basic base64(email:
// password), or X-PlotCoder-Email and X-PlotCoder-Password — so two writers
// never share a door, and the account wins as it does everywhere else. No
// disk: the file door is off, and export_project answers with the file as
// JSON. Stateless streamable HTTP: any MCP client that speaks it connects
// with `--transport http` and the two headers.
//
//   PORT=8787 node scripts/plotcoder-http.mjs      (or: npx plotcoder-board serve)
//
// Deploy it anywhere Node runs (a Dockerfile is in the repo); put it behind
// HTTPS, since the sign-in travels in the header.

import http from "node:http";
import os from "node:os";
import path from "node:path";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createPlotcoderServer } from "./plotcoder-mcp-server.mjs";

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "0.0.0.0";
const SCRATCH = path.join(os.tmpdir(), "plotcoder-hosted");

const ABOUT = `PlotCoder's hosted MCP door.

POST /mcp with the writer's sign-in on the request:
  Authorization: Basic base64(email:password)
  (or X-PlotCoder-Email and X-PlotCoder-Password)
  X-PlotCoder-Project: a project name or id   (optional)

For Claude Code, once:
  claude mcp add plotcoder --transport http https://<this host>/mcp --header "Authorization: Basic <base64 of email:password>"

The on-ramp: https://plotcoder.com/llms.txt
`;

/** The writer's sign-in from the request, or null. */
export function credentialsFrom(headers) {
  const auth = String(headers.authorization ?? "");
  if (/^basic\s+/i.test(auth)) {
    const decoded = Buffer.from(auth.replace(/^basic\s+/i, ""), "base64").toString("utf8");
    const cut = decoded.indexOf(":");
    if (cut > 0) return { email: decoded.slice(0, cut), password: decoded.slice(cut + 1) };
  }
  const email = headers["x-plotcoder-email"];
  const password = headers["x-plotcoder-password"];
  if (typeof email === "string" && typeof password === "string" && email && password) return { email, password };
  return null;
}

/** The environment one request's server runs with: the writer's sign-in, no bridge, no disk. */
export function envFor(headers, base = process.env) {
  const creds = credentialsFrom(headers);
  if (!creds) return null;
  return {
    PLOTCODER_HOSTED: "1",
    PLOTCODER_NO_BRIDGE: "1",
    PLOTCODER_ROOT: SCRATCH,
    // Off, as on every door (the on-ramp says so; round twenty-two, entry 4): a program sets PLOTCODER_JSON=1 on the host.
    PLOTCODER_JSON: base.PLOTCODER_JSON ?? "0",
    PLOTCODER_EMAIL: creds.email,
    PLOTCODER_PASSWORD: creds.password,
    PLOTCODER_PROJECT: typeof headers["x-plotcoder-project"] === "string" ? headers["x-plotcoder-project"] : "",
    ...(base.VITE_SUPABASE_URL ? { VITE_SUPABASE_URL: base.VITE_SUPABASE_URL } : {}),
    ...(base.VITE_SUPABASE_KEY ? { VITE_SUPABASE_KEY: base.VITE_SUPABASE_KEY } : {}),
    ...(base.PLOTCODER_VIDEO_PROVIDER ? { PLOTCODER_VIDEO_PROVIDER: base.PLOTCODER_VIDEO_PROVIDER } : {}),
  };
}

export function createHostedDoor(base = process.env) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname === "/" || url.pathname === "/health") {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      res.end(ABOUT);
      return;
    }
    if (url.pathname !== "/mcp") {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not here. The door is POST /mcp.\n");
      return;
    }
    const env = envFor(req.headers, base);
    if (!env) {
      res.writeHead(401, { "content-type": "text/plain; charset=utf-8", "www-authenticate": 'Basic realm="PlotCoder"' });
      res.end("The hosted door needs the writer's sign-in on the request: Authorization: Basic base64(email:password), or X-PlotCoder-Email and X-PlotCoder-Password.\n");
      return;
    }
    // One server per request, stateless: the sign-in is the session.
    const { server } = createPlotcoderServer(env);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
        res.end(`The door failed: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain || process.env.PLOTCODER_SERVE === "1") {
  createHostedDoor().listen(PORT, HOST, () => {
    process.stderr.write(`[plotcoder-http] the hosted door is open on http://${HOST}:${PORT}/mcp\n`);
  });
}
