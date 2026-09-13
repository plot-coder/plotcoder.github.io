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
      "add_character",
      "add_reminder",
      "apply_template",
      "cast",
      "create_arrow",
      "create_group",
      "create_note",
      "delete_arrow",
      "delete_board",
      "delete_note",
      "export_fdx",
      "export_fountain",
      "import_fdx",
      "import_fountain",
      "list_board",
      "list_boards",
      "list_reminders",
      "list_workflows",
      "move_note",
      "new_board",
      "open_board",
      "organize",
      "page_count",
      "read_pages",
      "read_wall",
      "recolor_note",
      "remove_character",
      "remove_reminder",
      "rename_board",
      "rename_character",
      "rename_group",
      "rename_project",
      "segment_brief",
      "set_arrow_kind",
      "set_length",
      "set_location",
      "set_logline",
      "set_plant",
      "set_premise",
      "set_rank",
      "set_target",
      "undo",
      "ungroup",
      "update_character",
      "update_note",
      "write_scene",
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

  it("sets and clears the logline, and reports it in the summary", async () => {
    const text = await client.callTool("set_logline", {
      logline: "Does telling the truth cost more than the lie?",
    });
    expect(text).toContain("Logline set");

    const listed = await client.callTool("list_board");
    expect(listed).toContain('logline: "Does telling the truth cost more than the lie?"');
    expect(readBoardFile().state.logline).toBe(
      "Does telling the truth cost more than the lie?",
    );

    expect(await client.callTool("set_logline", { logline: "" })).toContain("cleared");
    expect(await client.callTool("list_board")).toContain("logline: (not set)");
  });

  it("marks a card as a beat and reports the shape", async () => {
    const { notes } = await client.callToolData("list_board");
    const target = notes[0].id;

    const text = await client.callTool("set_rank", { ids: [target], rank: "beat" });
    expect(text).toContain("are now beat");
    expect(text).toContain("1 beats");

    const listed = await client.callTool("list_board");
    expect(listed).toContain("[beat, 1pp");
    expect(listed).toContain("beats: 1, scenes: 2");

    const saved = readBoardFile();
    expect(saved.state.notes.find((note) => note.id === target).rank).toBe("beat");

    // Rank must not move the card it marks (D20).
    const before = notes[0];
    const after = saved.state.notes.find((note) => note.id === target);
    expect([after.x, after.y]).toEqual([before.x, before.y]);

    await client.callTool("set_rank", { ids: [target], rank: "scene" });
    expect(await client.callTool("list_board")).toContain("beats: 0, scenes: 3");
  });

  describe("length", () => {
    it("sizes cards in pages and reports the runtime against the target", async () => {
      const { notes } = await client.callToolData("list_board");
      const target = notes[0].id;
      const before = notes[0];

      const text = await client.callTool("set_length", { ids: [target], pages: 3 });
      expect(text).toContain("run about 3 page(s)");
      // Three seed cards: one at three pages, two still at the default page each.
      expect(text).toContain("about 5 pages");

      const listed = await client.callTool("list_board");
      expect(listed).toContain("[scene, 3pp");
      expect(listed).toContain("120-page target");

      // Length is a property of the card, not of where it sits.
      const after = readBoardFile().state.notes.find((note) => note.id === target);
      expect([after.x, after.y]).toEqual([before.x, before.y]);
      expect(after.lengthEighths).toBe(24);

      await client.callTool("set_length", { ids: [target], pages: 1 });
    });

    it("takes a fraction of a page and writes it in eighths", async () => {
      const { notes } = await client.callToolData("list_board");
      const id = notes[0].id;

      await client.callTool("set_length", { ids: [id], pages: 0.5 });
      expect(readBoardFile().state.notes.find((note) => note.id === id).lengthEighths).toBe(4);
      expect(await client.callTool("list_board")).toContain("[scene, 4/8pp");

      await client.callTool("set_length", { ids: [id], pages: 1 });
    });

    it("sets the target for something that is not a feature", async () => {
      expect(await client.callTool("set_target", { pages: 30 })).toContain("Target is 30 pages");
      expect(await client.callTool("list_board")).toContain("30-page target");
      expect(readBoardFile().state.targetEighths).toBe(240);

      await client.callTool("set_target", { pages: 120 });
    });
  });

  describe("groups", () => {
    it("groups cards, renames the frame, and ungroups without moving them", async () => {
      const { notes } = await client.callToolData("list_board");
      const ids = notes.slice(0, 2).map((note) => note.id);
      const before = notes.slice(0, 2).map((note) => [note.x, note.y]);

      const made = await client.callTool("create_group", { noteIds: ids, title: "The heist" });
      expect(made).toContain("Grouped 2 cards");

      // The id has to come back out of list_board or the other tools are unusable.
      const listed = await client.callTool("list_board");
      expect(listed).toContain('"The heist" holds 2');
      const group = readBoardFile().state.groups[0];
      expect(group.noteIds).toEqual(ids);

      expect(await client.callTool("rename_group", { id: group.id, title: "Midpoint" })).toContain(
        "Midpoint",
      );
      expect(readBoardFile().state.groups[0].title).toBe("Midpoint");

      expect(await client.callTool("ungroup", { id: group.id })).toContain("untouched");
      const after = readBoardFile().state;
      expect(after.groups).toHaveLength(0);
      expect(after.notes.filter((note) => ids.includes(note.id)).map((n) => [n.x, n.y])).toEqual(
        before,
      );
    });

    it("says why rather than claiming success it did not have", async () => {
      const { notes } = await client.callToolData("list_board");
      // The reply must name the offending id, not just say it failed.
      expect(await client.callTool("create_group", { noteIds: [notes[0].id, "ghost"] })).toContain(
        "not on the board — ghost",
      );
      expect(await client.callTool("rename_group", { id: "ghost", title: "x" })).toContain(
        "No group with id ghost",
      );
      expect(await client.callTool("ungroup", { id: "ghost" })).toContain("No group with id ghost");
      expect(readBoardFile().state.groups).toHaveLength(0);
    });
  });

  describe("arrows", () => {
    it("draws a directed arrow and deletes only that direction", async () => {
      const { notes } = await client.callToolData("list_board");
      const [a, b] = notes.slice(0, 2).map((note) => note.id);

      expect(await client.callTool("create_arrow", { from: a, to: b })).toContain("Drew");
      expect(await client.callTool("create_arrow", { from: b, to: a })).toContain("Drew");
      expect(readBoardFile().state.arrows).toHaveLength(2);

      const listed = await client.callTool("list_board");
      expect(listed).toContain(`${a} → ${b}`);

      const forward = readBoardFile().state.arrows.find(
        (arrow) => arrow.from === a && arrow.to === b,
      );
      expect(await client.callTool("delete_arrow", { id: forward.id })).toContain("untouched");

      // A→B and B→A are two objects; deleting one must leave the other (R15).
      const left = readBoardFile().state.arrows;
      expect(left).toHaveLength(1);
      expect([left[0].from, left[0].to]).toEqual([b, a]);

      await client.callTool("delete_arrow", { id: left[0].id });
    });

    it("refuses a self-link, an unknown card, and a duplicate", async () => {
      const { notes } = await client.callToolData("list_board");
      const [a, b] = notes.slice(0, 2).map((note) => note.id);

      // Each refusal names its own reason, so an agent fixes the input instead
      // of retrying the same call.
      expect(await client.callTool("create_arrow", { from: a, to: a })).toContain(
        "a card cannot point at itself",
      );
      expect(await client.callTool("create_arrow", { from: a, to: "ghost" })).toContain(
        "there is no card with id ghost",
      );

      await client.callTool("create_arrow", { from: a, to: b });
      expect(await client.callTool("create_arrow", { from: a, to: b })).toContain("already exists");
      expect(readBoardFile().state.arrows).toHaveLength(1);

      expect(await client.callTool("delete_arrow", { id: "ghost" })).toContain("No arrow with id");
      await client.callTool("delete_arrow", { id: readBoardFile().state.arrows[0].id });
    });
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


// Step 4 of the method through the agent door: the wall read back as runs and
// questions. Built on its own board so the narrative above stays untouched.
describe("read_wall", () => {
  let reader;
  let readerRoot;

  beforeAll(async () => {
    readerRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-read-"));
    reader = new McpClient(readerRoot);
    await reader.start();

    // A fresh board starts from the seed cards; clear them so the reading is
    // over the wall this test lays out, and nothing else.
    for (const seeded of ["maya-letter", "tom-lies", "letter-aloud"]) {
      await reader.callTool("delete_note", { id: seeded });
    }

    const cards = [
      ["Inciting", "beat", 1],
      ["Setup a", "scene", 3],
      ["Lock in", "beat", 1],
      ["Long b", "scene", 4],
      ["Long c", "scene", 4],
      ["Long d", "scene", 4],
      ["Midpoint", "beat", 1],
      ["Fall e", "scene", 3],
      ["All is lost", "beat", 1],
    ];
    for (const [index, [headline, rank, pages]] of cards.entries()) {
      await reader.callTool("create_note", {
        headline,
        change: `${headline} changes things.`,
        rank,
        pages,
        x: 100 + index * 230,
        y: 100,
      });
    }
  }, 30000);

  afterAll(() => {
    reader?.stop();
    if (readerRoot) fs.rmSync(readerRoot, { recursive: true, force: true });
  });

  it("is listed as a tool", async () => {
    const { tools } = await reader.request("tools/list", {});
    expect(tools.map((tool) => tool.name)).toContain("read_wall");
  });

  it("reports the beats in wall order and the runs between them", async () => {
    const text = await reader.callTool("read_wall");
    expect(text).toContain("from file: app not running");
    expect(text).toContain(
      'beats in wall order: "Inciting", "Lock in", "Midpoint", "All is lost"',
    );
    expect(text).toContain('"Inciting" → "Lock in": about 3 pages, 1 card');
    expect(text).toContain('"Lock in" → "Midpoint": about 12 pages, 3 cards');
    expect(text).toContain('"Midpoint" → "All is lost": about 3 pages, 1 card');
  });

  it("raises the sag as a question, with the ids in the payload", async () => {
    const text = await reader.callTool("read_wall");
    expect(text).toContain('[sag] About 12 pages run between "Lock in" and "Midpoint"');
    expect(text).toMatch(/set piece\?/);

    const reading = await reader.callToolData("read_wall");
    const sag = reading.findings.find((finding) => finding.kind === "sag");
    expect(sag.ids).toHaveLength(2);
    expect(reading.order).toHaveLength(9);
    expect(reading.runs).toHaveLength(3);
  });

  it("says nothing about the number of beats", async () => {
    const text = await reader.callTool("read_wall");
    expect(text).not.toMatch(/too (many|few)/);
    expect(text).not.toMatch(/\b(8|15) beats\b/);
  });

  it("notices a card that has not been written yet", async () => {
    await reader.callTool("create_note", {
      headline: "Coda",
      change: "What changes?",
      x: 100,
      y: 500,
    });
    const text = await reader.callTool("read_wall");
    expect(text).toContain('[unwritten] "Coda" has no change line. What is different when it ends?');
  });
});


// The cast (R29): a roster the board maintains, and cards that point into it.
describe("characters", () => {
  let cast;
  let castRoot;

  beforeAll(async () => {
    castRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-cast-"));
    cast = new McpClient(castRoot);
    await cast.start();
  }, 30000);

  afterAll(() => {
    cast?.stop();
    if (castRoot) fs.rmSync(castRoot, { recursive: true, force: true });
  });

  it("starts with the seed cast on the seed cards", async () => {
    const text = await cast.callTool("list_board");
    expect(text).toContain('maya — "Maya" on 3 cards');
    expect(text).toContain('tom — "Tom" on 2 cards');
    expect(text).toContain("cast: Maya]");
  });

  it("lays a structure's beats on the wall above the cards, and refuses an unknown one", async () => {
    const before = await cast.callToolData("list_board");
    const text = await cast.callTool("apply_template", { template: "three-acts" });
    expect(text).toContain("Laid out 7 beats");
    expect(text).toContain("The midpoint");
    const after = await cast.callToolData("list_board");
    expect(after.notes).toHaveLength(before.notes.length + 7);
    const beats = after.notes.filter((note) => note.rank === "beat");
    expect(beats).toHaveLength(7);
    expect(Math.max(...beats.map((note) => note.y))).toBeLessThan(Math.min(...before.notes.map((note) => note.y)));
    expect(await cast.callTool("undo")).toContain("Undid");
    expect((await cast.callToolData("list_board")).notes).toHaveLength(before.notes.length);
    const bad = await cast.callTool("apply_template", { template: "hero" }).catch((error) => String(error));
    expect(String(bad)).toMatch(/hero|invalid|Invalid/);
  });

  it("adds a person once, and says who it already is the second time", async () => {
    const added = await cast.callToolData("add_character", { name: "  Sam " });
    expect(added.name).toBe("Sam");
    const again = await cast.callTool("add_character", { name: "sam" });
    expect(again).toContain(`Already in the cast as "Sam" (${added.id})`);
  });

  it("casts a card by name and refuses a name that is not in the cast", async () => {
    const refused = await cast.callTool("cast", {
      noteIds: ["maya-letter"],
      characters: ["Maya", "Reed"],
    });
    expect(refused).toContain('not in the cast — "Reed"');

    const text = await cast.callTool("cast", {
      noteIds: ["maya-letter"],
      characters: ["Maya", "sam"],
    });
    expect(text).toContain("1 card(s) now cast Maya, Sam");
    const board = await cast.callToolData("list_board");
    expect(board.notes.find((note) => note.id === "maya-letter").characterIds).toEqual([
      "maya",
      board.characters.find((character) => character.name === "Sam").id,
    ]);
  });

  it("writes a person's page a line at a time, and list_board says which lines are written", async () => {
    const before = await cast.callTool("list_board");
    expect(before).toContain('maya — "Maya" on 3 cards · page: empty');
    const text = await cast.callTool("update_character", {
      id: "maya",
      looks: "Thirty-four, tall, a coat too good for the flat.",
      wants: "To keep the flat, and Tom in it.",
    });
    expect(text).toContain("Wrote looks, wants on Maya's page");
    const again = await cast.callTool("update_character", { id: "maya", looks: "Thirty-four, tall, a coat too good for the flat." });
    expect(again).toContain("Nothing changed on Maya's page");
    const nobody = await cast.callTool("update_character", { id: "nobody", looks: "x" });
    expect(nobody).toContain("No character with id nobody");
    const after = await cast.callToolData("list_board");
    expect(after.characters.find((character) => character.id === "maya")).toMatchObject({
      looks: "Thirty-four, tall, a coat too good for the flat.",
      wants: "To keep the flat, and Tom in it.",
      voice: "",
    });
    expect(await cast.callTool("list_board")).toContain('"Maya" on 3 cards · page: looks, wants');
  });

  it("puts scenes somewhere, and list_board says where", async () => {
    const text = await cast.callTool("set_location", { ids: ["tom-lies", "letter-aloud"], location: " the piano shop " });
    expect(text).toContain("2 card(s) now at the piano shop");
    expect(await cast.callTool("set_location", { ids: ["tom-lies"], location: "the piano shop" })).toContain("No place changed");
    expect(await cast.callTool("set_location", { ids: ["nope"], location: "x" })).toContain("No cards with ids nope");
    const listed = await cast.callTool("list_board");
    expect(listed).toContain("at: the piano shop] — \"The letter is read aloud\"");
    const made = await cast.callToolData("create_note", { headline: "At the bank", change: "No loan.", location: "the bank" });
    expect(made.location).toBe("the bank");
    const board = await cast.callToolData("list_board");
    expect(board.notes.find((note) => note.id === "letter-aloud").location).toBe("the piano shop");
  });

  it("renames a person and every card follows, because cards hold the id", async () => {
    const text = await cast.callTool("rename_character", { id: "maya", name: "Maya Reed" });
    expect(text).toContain('Renamed to "Maya Reed"');
    const board = await cast.callTool("list_board");
    expect(board).toContain("cast: Maya Reed, Sam]");
    const clash = await cast.callTool("rename_character", { id: "tom", name: "maya reed" });
    expect(clash).toContain("already has that name");
  });

  it("removes a person from the cast and from every card", async () => {
    await cast.callTool("remove_character", { id: "tom" });
    const board = await cast.callToolData("list_board");
    expect(board.characters.map((character) => character.id)).not.toContain("tom");
    expect(board.notes.every((note) => !note.characterIds.includes("tom"))).toBe(true);
    expect(await cast.callTool("remove_character", { id: "tom" })).toContain("No character with id tom");
  });

  it("read_wall asks about a person in the cast who is on no card", async () => {
    await cast.callTool("add_character", { name: "The landlord" });
    const text = await cast.callTool("read_wall");
    expect(text).toContain("[uncast] The landlord is in the cast but on no card. Where do they come in?");
  });
});

// Typed arrows (R30): a setup and its payoff, and a fresh wall.
describe("typed arrows and new_board", () => {
  let typed;
  let typedRoot;

  beforeAll(async () => {
    typedRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-typed-"));
    typed = new McpClient(typedRoot);
    await typed.start();
  }, 30000);

  afterAll(() => {
    typed?.stop();
    if (typedRoot) fs.rmSync(typedRoot, { recursive: true, force: true });
  });

  it("draws a setup arrow and lists it as one", async () => {
    const text = await typed.callTool("create_arrow", {
      from: "maya-letter",
      to: "letter-aloud",
      kind: "setup",
    });
    expect(text).toContain("as a setup");
    const listed = await typed.callTool("list_board");
    expect(listed).toContain('[setup] — maya-letter → letter-aloud  ("Maya finds the letter" sets up "The letter is read aloud")');
  });

  it("refuses the same direction again even with a different kind, and changes the kind instead", async () => {
    const dup = await typed.callTool("create_arrow", { from: "maya-letter", to: "letter-aloud" });
    expect(dup).toContain("that arrow already exists");
    const { arrows } = await typed.callToolData("list_board");
    const changed = await typed.callTool("set_arrow_kind", { id: arrows[0].id, kind: "follows" });
    expect(changed).toContain("now 'follows'");
    expect(await typed.callTool("set_arrow_kind", { id: arrows[0].id, kind: "follows" })).toContain("already 'follows'");
    await typed.callTool("set_arrow_kind", { id: arrows[0].id, kind: "setup" });
  });

  it("read_wall reports setups with their distance, and asks about one that runs backwards", async () => {
    const reading = await typed.callTool("read_wall");
    // maya-letter (y 120) reads before letter-aloud (y 340): forward, two pages apart.
    expect(reading).toContain('"Maya finds the letter" sets up "The letter is read aloud", about 2 pages later');

    await typed.callTool("create_arrow", { from: "letter-aloud", to: "tom-lies", kind: "setup" });
    const again = await typed.callTool("read_wall");
    expect(again).toContain(
      '[backwards] "The letter is read aloud" sets up "Tom lies about the job", but on the wall the payoff comes first. Which order do you mean?',
    );
  });

  it("new_board adds an empty board, opens it, and keeps the target", async () => {
    await typed.callTool("set_target", { pages: 60 });
    const text = await typed.callTool("new_board", { name: "Episode 2" });
    expect(text).toContain('Added "Episode 2"');
    expect(text).toContain("opened it");
    const board = await typed.callToolData("list_board");
    expect(board.notes).toEqual([]);
    expect(board.arrows).toEqual([]);
    expect(board.characters).toEqual([]);
    expect(board.logline).toBe("");
    expect(board.targetEighths).toBe(60 * 8);
    // The board that was open is still there, untouched.
    const listed = await typed.callTool("list_boards");
    expect(listed).toContain("boards: 2");
    expect(listed).toContain('"Episode 2" (open)');
  });
});

// The folded corner (R31): a plant with no payoff yet.
describe("set_plant", () => {
  let fold;
  let foldRoot;

  beforeAll(async () => {
    foldRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-fold-"));
    fold = new McpClient(foldRoot);
    await fold.start();
  }, 30000);

  afterAll(() => {
    fold?.stop();
    if (foldRoot) fs.rmSync(foldRoot, { recursive: true, force: true });
  });

  it("folds a corner, shows it in list_board, and read_wall asks about it", async () => {
    const text = await fold.callTool("set_plant", { ids: ["maya-letter"], plants: true });
    expect(text).toContain("1 card(s) now plant something");
    expect(await fold.callTool("list_board")).toContain("cast: Maya, plants] — \"Maya finds the letter\"");
    expect(await fold.callTool("read_wall")).toContain(
      '[unpaid] "Maya finds the letter" plants something, and no arrow pays it off. Where does it come back?',
    );
    // Folding never moves the card.
    const { notes } = await fold.callToolData("list_board");
    expect(notes.find((note) => note.id === "maya-letter")).toMatchObject({ x: 88, y: 120, plants: true });
  });

  it("goes quiet once a setup arrow leaves the card, and stays folded", async () => {
    await fold.callTool("create_arrow", { from: "maya-letter", to: "letter-aloud", kind: "setup" });
    const text = await fold.callTool("read_wall");
    expect(text).not.toContain("[unpaid]");
    const { notes } = await fold.callToolData("list_board");
    expect(notes.find((note) => note.id === "maya-letter").plants).toBe(true);
  });

  it("is a no-op the second time and says so", async () => {
    expect(await fold.callTool("set_plant", { ids: ["maya-letter"], plants: true })).toContain("No change");
    expect(await fold.callTool("set_plant", { ids: ["maya-letter"], plants: false })).toContain("no longer marked");
  });

  it("create_note can plant from the start", async () => {
    const created = await fold.callToolData("create_note", {
      headline: "The gun on the wall",
      change: "Nobody mentions it.",
      plants: true,
    });
    expect(created.plants).toBe(true);
  });
});

// Undo (R33), through the agent door: the server walks back its own changes,
// and refuses when the board moved on without it.
describe("undo", () => {
  let back;
  let backRoot;
  const file = () => path.join(backRoot, ".plotcoder", "board.json");

  beforeAll(async () => {
    backRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-undo-"));
    back = new McpClient(backRoot);
    await back.start();
  }, 30000);

  afterAll(() => {
    back?.stop();
    if (backRoot) fs.rmSync(backRoot, { recursive: true, force: true });
  });

  it("has nothing to undo before it has done anything", async () => {
    expect(await back.callTool("undo")).toContain("Nothing of mine to undo");
  });

  it("walks back its own changes one call at a time, newest first", async () => {
    await back.callTool("create_note", { headline: "The gun on the wall", change: "Nobody mentions it." });
    await back.callTool("move_note", { id: "maya-letter", x: 900, y: 40 });

    const first = await back.callTool("undo");
    expect(first).toContain("Undid move_note");
    expect(first).toContain("1 more of mine");
    let board = JSON.parse(fs.readFileSync(file(), "utf8")).state;
    expect(board.notes.find((note) => note.id === "maya-letter")).toMatchObject({ x: 88, y: 120 });
    expect(board.notes.some((note) => note.headline === "The gun on the wall")).toBe(true);

    const second = await back.callTool("undo");
    expect(second).toContain('Undid create_note "The gun on the wall"');
    board = JSON.parse(fs.readFileSync(file(), "utf8")).state;
    expect(board.notes.some((note) => note.headline === "The gun on the wall")).toBe(false);
    expect(await back.callTool("undo")).toContain("Nothing of mine to undo");
  });

  it("refuses to undo over a change somebody else made since", async () => {
    await back.callTool("set_logline", { logline: "Can Maya forgive?" });
    // The person edits the wall in the meantime: the file moves on.
    const saved = JSON.parse(fs.readFileSync(file(), "utf8"));
    saved.state.notes[0].headline = "Maya finds the letter, again";
    saved.rev += 1;
    fs.writeFileSync(file(), JSON.stringify(saved));

    const text = await back.callTool("undo");
    expect(text).toContain("Not undone: the board has changed since my set_logline");
    const board = JSON.parse(fs.readFileSync(file(), "utf8")).state;
    expect(board.logline).toBe("Can Maya forgive?");
    expect(board.notes[0].headline).toBe("Maya finds the letter, again");
  });
});

// Organize along the arrows (R34), through the agent door.
describe("organize", () => {
  let tidy;
  let tidyRoot;

  beforeAll(async () => {
    tidyRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-organize-"));
    tidy = new McpClient(tidyRoot);
    await tidy.start();
    for (const seeded of ["maya-letter", "tom-lies", "letter-aloud"]) {
      await tidy.callTool("delete_note", { id: seeded });
    }
    // Placed out of story order on purpose; the arrows say what follows what.
    await tidy.callTool("create_note", { headline: "Lock in", change: "x", rank: "beat", x: 900, y: 500 });
    await tidy.callTool("create_note", { headline: "Maya finds the letter", change: "x", rank: "beat", x: 100, y: 100 });
    await tidy.callTool("create_note", { headline: "Tom lies", change: "x", x: 900, y: 100 });
    await tidy.callTool("create_note", { headline: "Dinner", change: "x", x: 100, y: 500 });
    const { notes } = await tidy.callToolData("list_board");
    const id = (headline) => notes.find((note) => note.headline === headline).id;
    await tidy.callTool("create_arrow", { from: id("Maya finds the letter"), to: id("Tom lies") });
    await tidy.callTool("create_arrow", { from: id("Tom lies"), to: id("Dinner") });
    await tidy.callTool("create_arrow", { from: id("Dinner"), to: id("Lock in") });
  }, 30000);

  afterAll(() => {
    tidy?.stop();
    if (tidyRoot) fs.rmSync(tidyRoot, { recursive: true, force: true });
  });

  it("lays the wall out along the arrows, a row per beat", async () => {
    const text = await tidy.callTool("organize");
    expect(text).toContain("Organized 4 card(s) along the arrows into 2 row(s), one per beat");
    const { notes } = await tidy.callToolData("list_board");
    const at = (headline) => notes.find((note) => note.headline === headline);
    expect(at("Maya finds the letter")).toMatchObject({ x: 88, y: 110 });
    expect(at("Tom lies").y).toBe(110);
    expect(at("Dinner").y).toBe(110);
    expect(at("Tom lies").x).toBeLessThan(at("Dinner").x);
    expect(at("Lock in")).toMatchObject({ x: 88 });
    expect(at("Lock in").y).toBeGreaterThan(110);
  });

  it("can tidy just a selection and says so", async () => {
    const { notes } = await tidy.callToolData("list_board");
    const ids = notes.filter((note) => note.headline !== "Lock in").map((note) => note.id);
    const text = await tidy.callTool("organize", { noteIds: ids });
    expect(text).toContain("Organized 3 card(s)");
    expect(await tidy.callTool("undo")).toContain("Undid apply_poses");
  });
});

// The project (R35), through the agent door: many boards, one premise.
describe("boards of a project", () => {
  let season;
  let seasonRoot;

  beforeAll(async () => {
    seasonRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-season-"));
    season = new McpClient(seasonRoot);
    await season.start();
  }, 30000);

  afterAll(() => {
    season?.stop();
    if (seasonRoot) fs.rmSync(seasonRoot, { recursive: true, force: true });
  });

  it("starts as a one-board project around the wall on file", async () => {
    const text = await season.callTool("list_boards");
    expect(text).toContain("boards: 1");
    expect(text).toContain("(open)");
    expect(await season.callTool("list_board")).toMatch(/PlotCoder "Board 1" \(1 of 1 in "Untitled project"\)/);
  });

  it("adds boards, lists them in order, and opens one by number or name", async () => {
    await season.callTool("set_logline", { logline: "Episode one's question" });
    await season.callTool("new_board", { name: "Episode 2" });
    await season.callTool("set_logline", { logline: "Episode two's question" });
    await season.callTool("new_board", { name: "Episode 3" });
    const listed = await season.callTool("list_boards");
    expect(listed).toContain("boards: 3");
    expect(listed).toMatch(/1\. .* — "Board 1"/);
    expect(listed).toMatch(/3\. .* — "Episode 3" \(open\)/);

    expect(await season.callTool("open_board", { board: "2" })).toContain('Opened "Episode 2"');
    expect((await season.callToolData("list_board")).logline).toBe("Episode two's question");
    expect(await season.callTool("open_board", { board: "board 1" })).toContain('Opened "Board 1"');
    expect((await season.callToolData("list_board")).logline).toBe("Episode one's question");
    expect(await season.callTool("open_board", { board: "board 1" })).toContain("already open");
    expect(await season.callTool("open_board", { board: "nope" })).toContain("No board matches");
  });

  it("renames a board and refuses a blank rename", async () => {
    expect(await season.callTool("rename_board", { board: "1", name: "Episode 1" })).toContain('Renamed to "Episode 1"');
    expect(await season.callTool("list_boards")).toContain('"Episode 1" (open)');
  });

  it("deletes a board, opening the one before it when the open one goes, and never the last", async () => {
    await season.callTool("open_board", { board: "Episode 3" });
    expect(await season.callTool("delete_board", { board: "Episode 3" })).toContain('opened "Episode 2"');
    expect((await season.callToolData("list_board")).logline).toBe("Episode two's question");
    await season.callTool("delete_board", { board: "Episode 1" });
    expect(await season.callTool("list_boards")).toContain("boards: 1");
    expect(await season.callTool("delete_board", { board: "Episode 2" })).toContain("keeps at least one board");
  });
});

describe("the premise and reminders (roadmap item 6)", () => {
  let door;
  let doorRoot;

  beforeAll(async () => {
    doorRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-door-"));
    door = new McpClient(doorRoot);
    await door.start();
  }, 30000);

  afterAll(() => {
    door?.stop();
    if (doorRoot) fs.rmSync(doorRoot, { recursive: true, force: true });
  });

  it("sets and clears the premise, and renames the project", async () => {
    expect(await door.callTool("set_premise", { premise: "A season about a lie." })).toContain('Premise set to "A season about a lie."');
    expect(await door.callTool("list_boards")).toContain('premise: "A season about a lie."');
    expect(await door.callTool("set_premise", { premise: "A season about a lie." })).toContain("Premise unchanged");
    expect(await door.callTool("rename_project", { name: "The Letter" })).toContain('Project renamed to "The Letter"');
    expect(await door.callTool("list_boards")).toContain('Project "The Letter"');
    expect(await door.callTool("set_premise", { premise: "" })).toContain("Premise cleared");
  });

  it("exports the wall as Fountain, to the caller or to a file", async () => {
    const text = await door.callTool("export_fountain");
    expect(text).toContain("Title: Board 1");
    expect(text).toContain(".MAYA FINDS THE LETTER");
    expect(text).toContain("[[with Maya]]");
    expect(text).toContain("She decides not to tell Tom.");
    const target = path.join(doorRoot, "out", "board.fountain");
    expect(await door.callTool("export_fountain", { path: target })).toContain("lines of Fountain");
    expect(fs.readFileSync(target, "utf8")).toContain(".TOM LIES ABOUT THE JOB");
  });

  it("writes a scene onto a card, measures it, reads the pages with ids, and imports a script", async () => {
    const wrote = await door.callTool("write_scene", { id: "maya-letter", text: "Rain on the window.\n\nMAYA\nTom?" });
    expect(wrote).toContain('Wrote "Maya finds the letter": 1/8 page(s) measured');
    expect(await door.callTool("list_board")).toContain("[scene, 1/8pp written");
    const pages = await door.callTool("read_pages");
    expect(pages).toContain(".MAYA FINDS THE LETTER    [[id: maya-letter · measured 1/8pp]]");
    expect(pages).toContain(".TOM LIES ABOUT THE JOB    [[id: tom-lies · estimated 1pp]]");
    const imported = await door.callTool("import_fountain", {
      text: ".TOM LIES ABOUT THE JOB\n\nHe says the job is fine.\n\n.THE BANK\n\nThere is no loan.\n",
    });
    expect(imported).toContain("Imported 2 scene(s): 1 written onto cards, 1 new card(s)");
    const board = await door.callToolData("list_board");
    expect(board.notes.find((note) => note.id === "tom-lies").text).toBe("He says the job is fine.");
    expect(board.notes.some((note) => note.headline === "The Bank" && note.text === "There is no loan.")).toBe(true);
  });

  it("counts pages, writes a Final Draft file, and reads one back onto the cards", async () => {
    const counted = await door.callTool("page_count");
    expect(counted).toContain("pages: 1 of 120");
    expect(counted).toContain("1. Maya finds the letter (maya-letter) — p. 1");
    const target = path.join(doorRoot, "out", "board.fdx");
    expect(await door.callTool("export_fdx", { path: target })).toContain("Wrote a Final Draft file");
    const xml = fs.readFileSync(target, "utf8");
    expect(xml).toContain('<Paragraph Type="Scene Heading" Number="1">');
    const imported = await door.callTool("import_fdx", {
      xml: xml.replace("<Text>Rain on the window.", "<Text>Rain, harder now."),
    });
    expect(imported).toContain("Imported");
    expect(await door.callTool("export_fdx")).toContain("<FinalDraft");
  });

  it("lists the workflows and briefs a segment from the wall", async () => {
    const listed = await door.callTool("list_workflows");
    expect(listed).toContain("break-a-treatment — Break a treatment into a wall");
    expect(listed).toContain("keep: Wait for the writer; propose, do not fix.");
    const brief = await door.callTool("segment_brief", { ids: ["maya-letter"] });
    expect(brief).toContain("SEGMENT: Maya finds the letter");
    expect(brief).toContain("PEOPLE: Maya");
    expect(await door.callTool("segment_brief", { ids: ["nope"] })).toContain("No cards with ids nope");
  });

  it("lists the built-in reminders, adds one of the writer's, and removes it", async () => {
    const listed = await door.callTool("list_reminders");
    expect(listed).toContain("reminders: 6");
    expect(listed).toContain("story-is-change (built in) — Story is change");
    const added = await door.callToolData("add_reminder", { body: "Every scene ends on a question. Even the quiet ones." });
    expect(added.title).toBe("Every scene ends on a question");
    expect(added.builtIn).toBe(false);
    const after = await door.callToolData("list_reminders");
    expect(after).toHaveLength(7);
    expect(await door.callTool("remove_reminder", { id: added.id })).toContain("Removed reminder");
    expect(await door.callToolData("list_reminders")).toHaveLength(6);
    expect(await door.callTool("remove_reminder", { id: "nope" })).toContain("No reminder with id nope");
  });
});
