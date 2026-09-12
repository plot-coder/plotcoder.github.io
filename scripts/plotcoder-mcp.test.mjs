// End-to-end smoke test for the MCP server: spawns it exactly the way an agent
// client would, speaks JSON-RPC over stdio, and checks what lands on disk.
//
// PLOTCODER_ROOT points it at a throwaway directory and PLOTCODER_NO_BRIDGE
// keeps it off the network, so this never touches the real board or a running
// dev server. The tests share one server and read as a narrative, in order.

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SERVER = fileURLToPath(new URL("./plotcoder-mcp.mjs", import.meta.url));

class McpClient {
  constructor(root, env = {}) {
    this.root = root;
    this.env = env;
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = "";
  }

  async start() {
    this.child = spawn("node", [SERVER], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PLOTCODER_ROOT: this.root,
        PLOTCODER_NO_BRIDGE: "1",
        ...this.env,
      },
    });

    this.child.stdout.setEncoding("utf8");
    this.child.stdout.on("data", (chunk) => this.#consume(chunk));

    await this.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "plotcoder-tests", version: "1.0.0" },
    });
    this.#send({ jsonrpc: "2.0", method: "notifications/initialized" });
  }

  #consume(chunk) {
    this.buffer += chunk;
    let cut;
    while ((cut = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, cut).trim();
      this.buffer = this.buffer.slice(cut + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      const waiting = this.pending.get(message.id);
      if (waiting) {
        this.pending.delete(message.id);
        waiting(message);
      }
    }
  }

  #send(message) {
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  request(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request timed out: ${method}`));
      }, 10000);

      this.pending.set(id, (message) => {
        clearTimeout(timer);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      });

      this.#send({ jsonrpc: "2.0", id, method, params });
    });
  }

  /** Call a tool and return its text output. */
  async callTool(name, args = {}) {
    const result = await this.request("tools/call", { name, arguments: args });
    return result.content.map((part) => part.text).join("\n");
  }

  /** Call a tool and parse the JSON payload it appends after a blank line. */
  async callToolData(name, args = {}) {
    const text = await this.callTool(name, args);
    const split = text.indexOf("\n\n");
    return split === -1 ? undefined : JSON.parse(text.slice(split + 2));
  }

  stop() {
    this.child?.kill();
  }
}

let client;
let root;

function boardFile() {
  return path.join(root, ".plotcoder", "board.json");
}

function readBoardFile() {
  return JSON.parse(fs.readFileSync(boardFile(), "utf8"));
}

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-"));
  client = new McpClient(root);
  await client.start();
}, 30000);

afterAll(() => {
  client?.stop();
  if (root) fs.rmSync(root, { recursive: true, force: true });
});

describe("plotcoder MCP server", () => {
  it("exposes the board tools an agent needs", async () => {
    const { tools } = await client.request("tools/list", {});
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "create_note",
      "delete_note",
      "list_board",
      "move_note",
      "recolor_note",
      "update_note",
    ]);
  });

  it("describes every tool so an agent can pick the right one", async () => {
    const { tools } = await client.request("tools/list", {});
    for (const tool of tools) {
      expect(tool.description, `${tool.name} needs a description`).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
    }
  });

  it("starts a brand new board from the seed beats", async () => {
    const state = await client.callToolData("list_board");
    expect(state.notes.map((note) => note.id)).toEqual([
      "maya-letter",
      "tom-lies",
      "letter-aloud",
    ]);
  });

  // Regression guard: this line used to claim the app was closed even when it
  // was open, because the live flag never made it out of readBoard().
  it("says where the board came from", async () => {
    const text = await client.callTool("list_board");
    expect(text).toContain("from file: app not running");
    expect(text).not.toContain("live: app is open");
  });

  it("creates a card and writes it straight to the board file", async () => {
    const text = await client.callTool("create_note", {
      headline: "Maya burns the letter",
      change: "There is no proof left.",
      color: "green",
      x: 640,
      y: 320,
    });

    expect(text).toContain("written to file");

    const saved = readBoardFile();
    expect(saved.app).toBe("plotcoder");
    const created = saved.state.notes.at(-1);
    expect(created).toMatchObject({
      headline: "Maya burns the letter",
      change: "There is no proof left.",
      color: "green",
      x: 640,
      y: 320,
    });
  });

  it("moves, recolors and rewrites a card by id", async () => {
    const state = await client.callToolData("list_board");
    const id = state.notes.at(-1).id;

    expect(await client.callTool("move_note", { id, x: 100, y: 200 })).toContain("Moved card.");
    expect(await client.callTool("recolor_note", { id, color: "pink" })).toContain("Recolored");
    expect(await client.callTool("update_note", { id, change: "Tom will never know." })).toContain(
      "Updated card.",
    );

    const note = readBoardFile().state.notes.find((item) => item.id === id);
    expect(note).toMatchObject({
      x: 100,
      y: 200,
      color: "pink",
      change: "Tom will never know.",
      headline: "Maya burns the letter",
    });
  });

  it("tells the agent when an id does not exist instead of failing quietly", async () => {
    for (const [tool, args] of [
      ["update_note", { id: "ghost", headline: "x" }],
      ["move_note", { id: "ghost", x: 1, y: 2 }],
      ["recolor_note", { id: "ghost", color: "blue" }],
      ["delete_note", { id: "ghost" }],
    ]) {
      expect(await client.callTool(tool, args)).toContain("No card with id ghost");
    }
  });

  it("rejects a color that is not one of the papers, and leaves the card alone", async () => {
    const state = await client.callToolData("list_board");
    const card = state.notes[0];

    const text = await client.callTool("recolor_note", { id: card.id, color: "chartreuse" });
    expect(text).toMatch(/validation error/i);
    expect(text).toContain("yellow");

    const after = readBoardFile().state.notes.find((note) => note.id === card.id);
    expect(after.color).toBe(card.color);
  });

  it("deletes a card and leaves the rest of the board intact", async () => {
    const before = await client.callToolData("list_board");
    const id = before.notes.at(-1).id;

    expect(await client.callTool("delete_note", { id })).toContain("Deleted card.");

    const after = readBoardFile().state;
    expect(after.notes).toHaveLength(before.notes.length - 1);
    expect(after.notes.some((note) => note.id === id)).toBe(false);
  });

  it("bumps the file revision as commands land", async () => {
    const before = readBoardFile().rev;
    await client.callTool("create_note", { headline: "A new beat", change: "Something shifts." });
    expect(readBoardFile().rev).toBeGreaterThan(before);
  });

  it("keeps the board readable by the app on the next load", async () => {
    const { state } = readBoardFile();
    expect(Array.isArray(state.notes)).toBe(true);
    expect(Array.isArray(state.groups)).toBe(true);
    expect(Array.isArray(state.arrows)).toBe(true);
    for (const note of state.notes) {
      expect(note).toMatchObject({
        id: expect.any(String),
        headline: expect.any(String),
        change: expect.any(String),
        color: expect.any(String),
        x: expect.any(Number),
        y: expect.any(Number),
        z: expect.any(Number),
      });
    }
  });
});

/**
 * Stand-in for the Vite dev bridge: holds a board in memory and records every
 * PUT, so we can watch what the MCP server sends to a running app.
 */
function startFakeBridge(seed = { notes: [], groups: [], arrows: [] }) {
  let state = seed;
  let rev = 7;
  const puts = [];

  const server = http.createServer((req, res) => {
    if (!req.url.startsWith("/__plotcoder/board")) {
      res.writeHead(404).end();
      return;
    }

    const json = (body) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (req.method === "GET") {
      json({ state, rev });
      return;
    }

    if (req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const sent = JSON.parse(body);
        puts.push(sent);
        state = sent.state;
        rev += 1;
        json({ state, rev });
      });
      return;
    }

    res.writeHead(405).end();
  });

  return {
    listen: () =>
      new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`));
      }),
    close: () => new Promise((resolve) => server.close(resolve)),
    puts,
    getState: () => state,
    getRev: () => rev,
  };
}

// The other half of the story: when the app is open, commands must go through
// the bridge so the wall updates, instead of quietly editing a file nobody is
// reading. The "live" wording here is a regression guard — it once reported the
// app as closed no matter what, which would tell an agent its edits went
// nowhere.
describe("plotcoder MCP server with the app open", () => {
  let bridge;
  let liveClient;
  let liveRoot;

  beforeAll(async () => {
    bridge = startFakeBridge({
      notes: [
        {
          id: "tom-lies",
          headline: "Tom lies about the job",
          change: "Maya starts to doubt him.",
          color: "pink",
          x: 320,
          y: 168,
          rotate: 1.6,
          z: 1,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      groups: [],
      arrows: [],
    });
    const url = await bridge.listen();

    liveRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-live-"));
    liveClient = new McpClient(liveRoot, {
      PLOTCODER_NO_BRIDGE: "0",
      PLOTCODER_BRIDGE_URL: url,
    });
    await liveClient.start();
  }, 30000);

  afterAll(async () => {
    liveClient?.stop();
    await bridge?.close();
    if (liveRoot) fs.rmSync(liveRoot, { recursive: true, force: true });
  });

  it("reads the open board instead of the file, and says so", async () => {
    const text = await liveClient.callTool("list_board");
    expect(text).toContain("live: app is open");
    expect(text).not.toContain("app not running");
    expect(text).toContain("Tom lies about the job");
  });

  it("pushes a new card to the open board", async () => {
    const text = await liveClient.callTool("create_note", {
      headline: "The letter is read aloud",
      change: "The plan dies in the room.",
      color: "blue",
    });

    expect(text).toContain("visible on the open board");
    expect(bridge.puts).toHaveLength(1);

    const pushed = bridge.getState().notes.map((note) => note.headline);
    expect(pushed).toEqual(["Tom lies about the job", "The letter is read aloud"]);
  });

  it("sends the revision it read back, so the app can spot a stale write", async () => {
    expect(bridge.puts[0].rev).toBe(7);
  });

  it("mirrors the open board down to the file as a backup", async () => {
    const saved = JSON.parse(
      fs.readFileSync(path.join(liveRoot, ".plotcoder", "board.json"), "utf8"),
    );
    expect(saved.rev).toBe(bridge.getRev());
    expect(saved.state.notes.map((note) => note.headline)).toEqual([
      "Tom lies about the job",
      "The letter is read aloud",
    ]);
  });

  it("edits a card that only exists on the open board", async () => {
    await liveClient.callTool("move_note", { id: "tom-lies", x: 900, y: 40 });
    const moved = bridge.getState().notes.find((note) => note.id === "tom-lies");
    expect(moved).toMatchObject({ x: 900, y: 40 });
  });
});
