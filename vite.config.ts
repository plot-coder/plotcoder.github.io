import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

// PlotCoder dev bridge.
//
// Only runs under `vite` on localhost. It keeps the board mirrored to
// .plotcoder/board.json and lets an agent (or the MCP server) read and write
// the board while the app is open:
//   GET    /__plotcoder/board   -> { state, rev, boardId }   the open board
//   PUT    /__plotcoder/board   -> replace state, bump rev, write file, notify
//   GET    /__plotcoder/project -> { project, boards, rev }   every board (R35)
//   PUT    /__plotcoder/project -> replace, bump rev, write file, notify
//   GET    /__plotcoder/events  -> Server-Sent Events: "state" and "project" frames
//
// The browser store PUTs the whole board after every change so the file matches
// the wall; the MCP server PUTs after applying a command so the wall matches an
// agent edit. Revisions let each side ignore the echo of its own writes.
// This plugin never ships to production (GitHub Pages) because it only attaches
// to the dev server.
function plotcoderBridge(): Plugin {
  // PLOTCODER_BOARD_FILE lets a test run point the bridge at a throwaway file,
  // so end-to-end tests never overwrite the writer's own .plotcoder/board.json.
  const boardPath = process.env.PLOTCODER_BOARD_FILE
    ? path.resolve(process.env.PLOTCODER_BOARD_FILE)
    : path.resolve(process.cwd(), ".plotcoder/board.json");
  const projectPath = path.join(path.dirname(boardPath), "project.json");
  let state: unknown = null;
  let boardId: string | null = null;
  let rev = 0;
  // The project: its record plus every board's state, keyed by id (R35).
  let project: unknown = null;
  let boards: Record<string, unknown> = {};
  // Reminders (R11) are project-level data too; they ride on the same channel
  // so an agent can read and add them (R17 backlog, roadmap item 6).
  let reminders: unknown = null;
  let projectRev = 0;
  const clients = new Set<ServerResponse>();

  function loadFromDisk(): void {
    try {
      const parsed = JSON.parse(fs.readFileSync(boardPath, "utf8"));
      if (parsed && typeof parsed === "object") {
        state = "state" in parsed ? parsed.state : null;
        boardId = typeof parsed.boardId === "string" ? parsed.boardId : null;
        rev = typeof parsed.rev === "number" ? parsed.rev : 0;
      }
    } catch {
      /* no board file yet; the first client will seed it */
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(projectPath, "utf8"));
      if (parsed && typeof parsed === "object") {
        project = "project" in parsed ? parsed.project : null;
        boards = parsed.boards && typeof parsed.boards === "object" ? parsed.boards : {};
        reminders = Array.isArray(parsed.reminders) ? parsed.reminders : null;
        projectRev = typeof parsed.rev === "number" ? parsed.rev : 0;
      }
    } catch {
      /* no project file yet */
    }
  }

  function persist(): void {
    try {
      fs.mkdirSync(path.dirname(boardPath), { recursive: true });
      fs.writeFileSync(
        boardPath,
        `${JSON.stringify({ app: "plotcoder", version: 1, rev, boardId, state }, null, 2)}\n`,
      );
    } catch (error) {
      console.warn("[plotcoder] could not write board file:", error);
    }
  }

  function persistProject(): void {
    try {
      fs.mkdirSync(path.dirname(projectPath), { recursive: true });
      fs.writeFileSync(
        projectPath,
        `${JSON.stringify({ app: "plotcoder", version: 2, rev: projectRev, project, boards, reminders }, null, 2)}\n`,
      );
    } catch (error) {
      console.warn("[plotcoder] could not write project file:", error);
    }
  }

  function frame(): string {
    return `event: state\ndata: ${JSON.stringify({ state, rev, boardId })}\n\n`;
  }

  function projectFrame(): string {
    return `event: project\ndata: ${JSON.stringify({ project, boards, reminders, rev: projectRev })}\n\n`;
  }

  function broadcast(payload: string): void {
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
      server.watcher.add(projectPath);
      server.watcher.on("change", (file) => {
        const changed = path.resolve(file);
        if (changed === boardPath) {
          try {
            const parsed = JSON.parse(fs.readFileSync(boardPath, "utf8"));
            const fileRev = typeof parsed.rev === "number" ? parsed.rev : rev + 1;
            if (fileRev > rev) {
              state = "state" in parsed ? parsed.state : null;
              boardId = typeof parsed.boardId === "string" ? parsed.boardId : boardId;
              rev = fileRev;
              broadcast(frame());
            }
          } catch {
            /* ignore partial writes */
          }
        } else if (changed === projectPath) {
          try {
            const parsed = JSON.parse(fs.readFileSync(projectPath, "utf8"));
            const fileRev = typeof parsed.rev === "number" ? parsed.rev : projectRev + 1;
            if (fileRev > projectRev) {
              project = "project" in parsed ? parsed.project : null;
              boards = parsed.boards && typeof parsed.boards === "object" ? parsed.boards : {};
              projectRev = fileRev;
              broadcast(projectFrame());
            }
          } catch {
            /* ignore partial writes */
          }
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
          // The project first: a fresh page then knows which board the board
          // frame belongs to, instead of taking it for a board of its own.
          res.write(projectFrame());
          res.write(frame());
          clients.add(res);
          req.on("close", () => clients.delete(res));
        },
      );

      server.middlewares.use(
        "/__plotcoder/board",
        (req: IncomingMessage, res: ServerResponse) => {
          if (req.method === "GET") {
            sendJson(res, { state, rev, boardId });
            return;
          }
          if (req.method === "PUT") {
            readBody(req)
              .then((body) => {
                const parsed = JSON.parse(body);
                state = parsed && "state" in parsed ? parsed.state : null;
                if (parsed && typeof parsed.boardId === "string") boardId = parsed.boardId;
                rev += 1;
                persist();
                broadcast(frame());
                sendJson(res, { state, rev, boardId });
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

      server.middlewares.use(
        "/__plotcoder/project",
        (req: IncomingMessage, res: ServerResponse) => {
          if (req.method === "GET") {
            sendJson(res, { project, boards, reminders, rev: projectRev });
            return;
          }
          if (req.method === "PUT") {
            readBody(req)
              .then((body) => {
                const parsed = JSON.parse(body);
                project = parsed && "project" in parsed ? parsed.project : null;
                boards = parsed && parsed.boards && typeof parsed.boards === "object" ? parsed.boards : {};
                // A writer that does not carry reminders leaves them as they were.
                if (parsed && Array.isArray(parsed.reminders)) reminders = parsed.reminders;
                projectRev += 1;
                persistProject();
                broadcast(projectFrame());
                sendJson(res, { project, boards, reminders, rev: projectRev });
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
  plugins: [
    react(),
    plotcoderBridge(),
    // The progressive web app (R3, D2; roadmap item 7): a manifest so the
    // wall installs on a phone or a desktop, and a service worker that
    // precaches the built app so it opens offline. localStorage is already
    // the record when offline; this makes the app itself available too.
    // Off in dev, so the dev bridge and the end-to-end suite see plain Vite.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "PlotCoder",
        short_name: "PlotCoder",
        description: "A storylining app for screenwriters. Break story on a digital corkboard, then write.",
        theme_color: "#111110",
        background_color: "#111110",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // The whole built app, so a wall opens with no network at all.
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        // Never intercept the account (Supabase) or the dev bridge.
        navigateFallbackDenylist: [/^\/__plotcoder\//, /^\/writers/],
      },
      devOptions: { enabled: false },
    }),
  ],
});
