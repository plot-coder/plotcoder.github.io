import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

// PlotCoder dev bridge.
//
// Only runs under `vite` on localhost. It keeps the board mirrored to
// .plotcoder/board.json and lets an agent (or the MCP server) read and write
// the board while the app is open:
//   GET    /__plotcoder/board   -> { state, rev }
//   PUT    /__plotcoder/board   -> replace state, bump rev, write file, notify
//   GET    /__plotcoder/events  -> Server-Sent Events stream of { state, rev }
//
// The browser store PUTs the whole board after every change so the file matches
// the wall; the MCP server PUTs after applying a command so the wall matches an
// agent edit. Revisions let each side ignore the echo of its own writes.
// This plugin never ships to production (GitHub Pages) because it only attaches
// to the dev server.
function plotcoderBridge(): Plugin {
  const boardPath = path.resolve(process.cwd(), ".plotcoder/board.json");
  let state: unknown = null;
  let rev = 0;
  const clients = new Set<ServerResponse>();

  function loadFromDisk(): void {
    try {
      const parsed = JSON.parse(fs.readFileSync(boardPath, "utf8"));
      if (parsed && typeof parsed === "object") {
        state = "state" in parsed ? parsed.state : null;
        rev = typeof parsed.rev === "number" ? parsed.rev : 0;
      }
    } catch {
      /* no board file yet; the first client will seed it */
    }
  }

  function persist(): void {
    try {
      fs.mkdirSync(path.dirname(boardPath), { recursive: true });
      fs.writeFileSync(
        boardPath,
        `${JSON.stringify({ app: "plotcoder", version: 1, rev, state }, null, 2)}\n`,
      );
    } catch (error) {
      console.warn("[plotcoder] could not write board file:", error);
    }
  }

  function frame(): string {
    return `event: state\ndata: ${JSON.stringify({ state, rev })}\n\n`;
  }

  function broadcast(): void {
    const payload = frame();
    for (const client of clients) {
      try {
        client.write(payload);
      } catch {
        clients.delete(client);
      }
    }
  }

  function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 8_000_000) reject(new Error("board too large"));
      });
      req.on("end", () => resolve(body));
      req.on("error", reject);
    });
  }

  function sendJson(res: ServerResponse, value: unknown): void {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(value));
  }

  loadFromDisk();

  return {
    name: "plotcoder-bridge",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      // If a command runs against the file directly (e.g. the MCP server while
      // it cannot see the bridge), pick the change up and push it to the wall.
      server.watcher.add(boardPath);
      server.watcher.on("change", (file) => {
        if (path.resolve(file) !== boardPath) return;
        try {
          const parsed = JSON.parse(fs.readFileSync(boardPath, "utf8"));
          const fileRev = typeof parsed.rev === "number" ? parsed.rev : rev + 1;
          if (fileRev > rev) {
            state = "state" in parsed ? parsed.state : null;
            rev = fileRev;
            broadcast();
          }
        } catch {
          /* ignore partial writes */
        }
      });

      server.middlewares.use(
        "/__plotcoder/events",
        (req: IncomingMessage, res: ServerResponse) => {
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          });
          res.write(frame());
          clients.add(res);
          req.on("close", () => clients.delete(res));
        },
      );

      server.middlewares.use(
        "/__plotcoder/board",
        (req: IncomingMessage, res: ServerResponse) => {
          if (req.method === "GET") {
            sendJson(res, { state, rev });
            return;
          }
          if (req.method === "PUT") {
            readBody(req)
              .then((body) => {
                const parsed = JSON.parse(body);
                state = parsed && "state" in parsed ? parsed.state : null;
                rev += 1;
                persist();
                broadcast();
                sendJson(res, { state, rev });
              })
              .catch(() => {
                res.statusCode = 400;
                res.end("bad request");
              });
            return;
          }
          res.statusCode = 405;
          res.end();
        },
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), plotcoderBridge()],
});
