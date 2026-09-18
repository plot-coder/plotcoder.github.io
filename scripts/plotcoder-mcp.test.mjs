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
import { createRequire } from "node:module";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

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
        // The tail is off by default since round fourteen; the harness reads it.
        PLOTCODER_JSON: "1",
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
    expect(tools.map((tool) => tool.name).sort()).toEqual(SORTED_TOOLS);
  });

  const SORTED_TOOLS = [
      "add_character",
      "add_reminder",
      "add_to_group",
      "add_picture",
      "add_take",
      "apply_template",
      "ask_again",
      "build_segment",
      "cast",
      "claim_account",
      "compare_structure",
      "create_arrow",
      "create_group",
      "create_note",
      "delete_arrow",
      "delete_board",
      "delete_account",
      "delete_note",
      "delete_project",
      "edit_scene",
      "empty_account",
      "end_revision",
      "export_fdx",
      "export_fountain",
      "export_markdown",
      "export_text",
      "export_project",
      "import_fdx",
      "import_fountain",
      "import_project",
      "leave_question",
      "list_board",
      "list_boards",
      "list_files",
      "list_projects",
      "lock_numbers",
      "list_reminders",
      "list_structures",
      "list_takes",
      "list_words",
      "list_workflows",
      "move_note",
      "move_scene",
      "new_board",
      "new_project",
      "open_board",
      "open_project",
      "organize",
      "page_count",
      "read_character",
      "read_pages",
      "read_wall",
      "recolor_note",
      "redo",
      "remove_character",
      "remove_file",
      "remove_reminder",
      "remove_structure",
      "rename_board",
      "rename_character",
      "rename_group",
      "rename_project",
      "save_structure",
      "segment_brief",
      "set_arrow_kind",
      "set_length",
      "set_location",
      "set_logline",
      "set_plant",
      "set_premise",
      "set_rank",
      "set_target",
      "set_when",
      "start_revision",
      "undo",
      "ungroup",
      "unlock_numbers",
      "update_character",
      "update_note",
      "write_scene",
    ].sort();

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
    expect(listed).toContain("[beat, about a page, unsized");
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
      expect(text).toContain("run 3 page(s), the writer's estimate");
      // Three seed cards: one at three pages, two still at the default page each — said on the write's tail.
      expect(text).toContain("runtime now about 5 of 120 pages");

      const listed = await client.callTool("list_board");
      expect(listed).toContain("[scene, 3 pages");
      expect(listed).toContain("no target set — set_target");

      // Length is a property of the card, not of where it sits.
      const after = readBoardFile().state.notes.find((note) => note.id === target);
      expect([after.x, after.y]).toEqual([before.x, before.y]);
      expect(after.lengthEighths).toBe(24);

      await client.callTool("set_length", { ids: [target], pages: 1 });
    });

    it("takes a length away with \"unsized\" or 0, so the card claims nothing again (round thirteen, entry 16)", async () => {
      const { notes } = await client.callToolData("list_board");
      const id = notes[0].id;
      await client.callTool("set_length", { ids: [id], pages: 3 });
      const reply = await client.callTool("set_length", { ids: [id], pages: "unsized" });
      expect(reply).toContain("1 card(s) unsized");
      expect(reply).toContain('list_board says "unsized"');
      expect(readBoardFile().state.notes.find((note) => note.id === id).lengthEighths).toBeNull();
      expect(await client.callTool("list_board")).toContain("about a page, unsized");
      expect(await client.callTool("set_length", { ids: [id], pages: 0 })).toContain("Nothing to unsize");
      await client.callTool("set_length", { ids: [id], pages: 2 });
      expect(await client.callTool("set_length", { ids: [id], pages: 0 })).toContain("1 card(s) unsized");
      // Still refuses a negative length, as before.
      expect(await client.callTool("set_length", { ids: [id], pages: -1 })).toMatch(/validation error/i);
    });

    it("says what a write did to the wall's questions and runtime, and update_note says which field changed (round fourteen, entries 16, 18, 19)", async () => {
      const { notes } = await client.callToolData("list_board");
      const id = notes[0].id;
      const sized = await client.callTool("set_length", { ids: [id], pages: 3 });
      expect(sized).toContain("runtime now about 5 of 120 pages");
      const same = await client.callTool("update_note", { id, headline: notes[0].headline });
      expect(same).toContain("Nothing changed");
      const retitled = await client.callTool("update_note", { id, headline: "A new headline", when: "night" });
      expect(retitled).toContain(`headline: "${notes[0].headline}" → "A new headline"`);
      expect(retitled).toContain('when: "" → "night"');
      expect(await client.callTool("update_note", { id, headline: notes[0].headline, when: "" })).toContain('when: "night" → ""');
      await client.callTool("set_length", { ids: [id], pages: "unsized" });
    });

    it("takes a fraction of a page and writes it in eighths", async () => {
      const { notes } = await client.callToolData("list_board");
      const id = notes[0].id;

      await client.callTool("set_length", { ids: [id], pages: 0.5 });
      expect(readBoardFile().state.notes.find((note) => note.id === id).lengthEighths).toBe(4);
      expect(await client.callTool("list_board")).toContain("[scene, 4/8 pages");

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

    it("adds a card to a group that exists, where it is (round thirteen, entry 18)", async () => {
      const { notes } = await client.callToolData("list_board");
      const [first, second, third] = notes;
      const made = await client.callToolData("create_group", { noteIds: [first.id, second.id], title: "Act three" });
      const reply = await client.callTool("add_to_group", { id: made.id, noteIds: [third.id] });
      expect(reply).toContain(`Added "${third.headline}" to "Act three", which now holds 3 cards`);
      expect(reply).toContain("The frame reaches them where they are");
      const state = readBoardFile().state;
      expect(state.groups[0].noteIds).toEqual([first.id, second.id, third.id]);
      expect(state.notes.find((note) => note.id === third.id)).toMatchObject({ x: third.x, y: third.y });
      expect(await client.callTool("add_to_group", { id: made.id, noteIds: [third.id] })).toContain("in that group already");
      expect(await client.callTool("add_to_group", { id: "ghost", noteIds: [third.id] })).toContain("No group with id ghost");
      expect(await client.callTool("add_to_group", { id: made.id, noteIds: ["ghost"] })).toContain("not on the board — ghost");
      // A card pulled from another frame leaves it; a frame left with one card dissolves.
      const p = await client.callToolData("create_note", { headline: "P", change: "Turns.", x: 3000, y: 3000 });
      const q = await client.callToolData("create_note", { headline: "Q", change: "Turns.", x: 3240, y: 3000 });
      await client.callTool("create_group", { noteIds: [p.id, q.id], title: "Sequence" });
      const pulled = await client.callTool("add_to_group", { id: made.id, noteIds: [p.id] });
      expect(pulled).toContain('Added "P" to "Act three", which now holds 4 cards');
      expect(pulled).toContain('"Sequence" dissolved on the way: a frame needs two cards.');
      expect(readBoardFile().state.groups).toHaveLength(1);
      await client.callTool("ungroup", { id: made.id });
      await client.callTool("delete_note", { id: p.id });
      await client.callTool("delete_note", { id: q.id });
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
    expect(text).toContain("the file at");
    expect(text).not.toContain("the open app");
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
      'Updated "',
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

    const gone = before.notes.at(-1).headline;
    expect(await client.callTool("delete_note", { id })).toContain(`Deleted "${gone}"`);

    const after = readBoardFile().state;
    expect(after.notes).toHaveLength(before.notes.length - 1);
    expect(after.notes.some((note) => note.id === id)).toBe(false);
  });

  it("says what a deletion took with it: each arrow by its cards, and what the group kept (round thirteen, entry 17)", async () => {
    const a = await client.callToolData("create_note", { headline: "The yard", change: "The letter comes.", x: 2000, y: 2000 });
    const b = await client.callToolData("create_note", { headline: "The lay-by", change: "He coughs.", x: 2240, y: 2000 });
    const c = await client.callToolData("create_note", { headline: "The pier", change: "She reads it.", x: 2480, y: 2000 });
    await client.callTool("create_arrow", { from: a.id, to: b.id });
    await client.callTool("create_arrow", { from: b.id, to: c.id, kind: "setup" });
    await client.callTool("create_group", { noteIds: [a.id, b.id, c.id], title: "Act three" });
    const reply = await client.callTool("delete_note", { id: b.id });
    expect(reply).toContain('Deleted "The lay-by"');
    expect(reply).toContain('Took its 2 arrows with it: "The yard" → "The lay-by" (follows), "The lay-by" → "The pier" (setup).');
    // One follows in and a setup out: no join. (A follows both ways joins; the kernel test covers it.)
    expect(reply).not.toContain("The chain is joined");
    expect(reply).toContain('Left its group "Act three", which keeps 2 cards.');
    const second = await client.callTool("delete_note", { id: c.id });
    expect(second).toContain("No arrow touched it.");
    expect(await client.callTool("undo")).toContain("1 card(s) back");
    const undone = await client.callTool("undo");
    expect(undone).toContain("1 card(s) back, with 2 arrow(s) back; groups as they were: \"Act three\" (3 cards)");
    await client.callTool("redo");
    await client.callTool("redo");
    expect(second).toContain('Its group "Act three" dissolved: a frame needs two cards.');
    await client.callTool("delete_note", { id: a.id });
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
      // Like the account's JSON store, keys come back in an order of the
      // store's choosing, not the one the server wrote.
      const sorted = (value) =>
        Array.isArray(value) ? value.map(sorted) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().reverse().map((key) => [key, sorted(value[key])])) : value;
      json({ state: sorted(state), rev });
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
    expect(text).toContain("the open app");
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
    expect(text).toContain("the file at");
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

  it("lands a card with a stranger in its cast as one change, so one undo takes back the card and the person", async () => {
    const before = await cast.callToolData("list_board");
    const revBefore = JSON.parse(fs.readFileSync(path.join(castRoot, ".plotcoder", "board.json"), "utf8")).rev;
    const made = await cast.callToolData("create_note", { headline: "Nessa comes home", change: "She decides to sell.", characters: ["Nessa"] });
    expect(made.characterIds).toHaveLength(1);
    const between = await cast.callToolData("list_board");
    expect(between.characters.map((person) => person.name)).toContain("Nessa");
    expect(JSON.parse(fs.readFileSync(path.join(castRoot, ".plotcoder", "board.json"), "utf8")).rev).toBe(revBefore + 1);
    expect(await cast.callTool("undo")).toContain('Undid create_note "Nessa comes home"');
    const after = await cast.callToolData("list_board");
    expect(after.notes).toHaveLength(before.notes.length);
    expect(after.notes.map((note) => note.id)).not.toContain(made.id);
    expect(after.characters.map((person) => person.name)).not.toContain("Nessa");
  });

  it("writes a person's page a line at a time, and list_board says which lines are written", async () => {
    const before = await cast.callTool("list_board");
    expect(before).toContain('maya — "Maya" on 3 cards · page: empty');
    const text = await cast.callTool("update_character", {
      id: "maya",
      looks: "Thirty-four, tall, a coat too good for the flat.",
      wants: "To keep the flat, and Tom in it.",
    });
    expect(text).toContain('Set looks: "Thirty-four, tall, a coat too good for the flat."; wants: "To keep the flat, and Tom in it." on Maya\'s page');
    expect(text).toContain("A line set here replaces the old one");
    const again = await cast.callTool("update_character", { id: "maya", looks: "Thirty-four, tall, a coat too good for the flat." });
    expect(again).toContain("Nothing changed on Maya's page");
    const nobody = await cast.callTool("update_character", { id: "nobody", looks: "x" });
    expect(nobody).toContain('Nobody called "nobody" in the cast');
    // The page reads back, by name or id, with every line and the cards.
    const page = await cast.callTool("read_character", { name: "maya" });
    expect(page).toContain("Maya (maya) — on 3 cards across 1 board of the project");
    expect(page).toContain('"Board 1", 3 cards in story order: 1. "Maya finds the letter"');
    expect(page).toContain("  looks: Thirty-four, tall, a coat too good for the flat.");
    expect(page).toContain("  voice: (empty)");
    expect(await cast.callTool("read_character", { id: "nobody" })).toContain('Nobody called "nobody" in the cast');
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
    // The cast is the project's (R51): the new board has the same people to cast from.
    expect(board.characters.map((person) => person.id)).toEqual(["maya", "tom"]);
    expect(board.logline).toBe("");
    expect(board.targetEighths).toBe(60 * 8);
    // The board that was open is still there, untouched.
    const listed = await typed.callTool("list_boards");
    expect(listed).toContain("boards: 2");
    expect(listed).toContain('"Episode 2" (open)');
  });
});

// A scene moves to another board (round fifteen, entry 16), and the replies
// that round found wanting: ids on add_character and create_group, the fold
// in delete_note's reply.
describe("move_scene across boards", () => {
  let series;
  let seriesRoot;

  beforeAll(async () => {
    seriesRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-series-"));
    series = new McpClient(seriesRoot);
    await series.start();
  }, 30000);

  afterAll(() => {
    series?.stop();
    if (seriesRoot) fs.rmSync(seriesRoot, { recursive: true, force: true });
  });

  it("add_character and create_group name the id of what they made", async () => {
    expect(await series.callTool("add_character", { name: "Dana" })).toMatch(/Added "Dana" \(id [a-z0-9-]+\)/);
    const grouped = await series.callTool("create_group", { noteIds: ["maya-letter", "tom-lies"], title: "Act one" });
    expect(grouped).toMatch(/group id [a-z0-9-]+/);
  });

  it("moves a card to another board with its record, wires it at the head there, and says what stayed behind", async () => {
    await series.callTool("create_arrow", { from: "maya-letter", to: "tom-lies" });
    await series.callTool("create_arrow", { from: "tom-lies", to: "letter-aloud" });
    await series.callTool("set_when", { ids: ["letter-aloud"], when: "night" });
    await series.callTool("set_plant", { ids: ["letter-aloud"], plants: true });
    await series.callTool("new_board", { name: "Episode 2" });
    await series.callTool("create_note", { headline: "The inspector arrives", change: "She needs the plate clear." });
    await series.callTool("create_note", { headline: "The plate fails", change: "A tonne light." });
    const episode = await series.callToolData("list_board");
    await series.callTool("create_arrow", { from: episode.notes[0].id, to: episode.notes[1].id });
    await series.callTool("open_board", { board: "1" });

    const reply = await series.callTool("move_scene", { id: "letter-aloud", board: "Episode 2" });
    expect(reply).toContain('Moved "The letter is read aloud" from "Board 1" to "Episode 2"');
    expect(reply).toContain('"Tom lies about the job" → "The letter is read aloud" (follows)');
    expect(reply).toContain('at the head of the story, before "The inspector arrives"');
    expect(reply).toContain("Its folded corner came with it");
    expect(reply).toContain('"Episode 2" is the open board now');
    expect(reply).toContain("Undo is per board");

    // It is on Episode 2 now, first in story order, with its when, its fold and its cast.
    const landed = await series.callToolData("list_board");
    const moved = landed.notes.find((note) => note.headline === "The letter is read aloud");
    expect(moved).toBeTruthy();
    expect(moved.when).toBe("night");
    expect(moved.plants).toBe(true);
    expect(moved.characterIds).toEqual(["maya", "tom"]);
    expect(landed.arrows.some((arrow) => arrow.from === moved.id && arrow.to === episode.notes[0].id)).toBe(true);
    // And gone from Board 1, with its arrow.
    await series.callTool("open_board", { board: "1" });
    const left = await series.callToolData("list_board");
    expect(left.notes.map((note) => note.id)).toEqual(["maya-letter", "tom-lies"]);
    expect(left.arrows).toHaveLength(1);
  });

  it("lands after a card on the other board and joins its group; a missing anchor moves nothing", async () => {
    expect(await series.callTool("move_scene", { id: "maya-letter", board: "Episode 2", after: "ghost" })).toContain('No card with id ghost on "Episode 2"');
    expect((await series.callToolData("list_board")).notes.map((note) => note.id)).toEqual(["maya-letter", "tom-lies"]);
    await series.callTool("open_board", { board: "2" });
    const episode = await series.callToolData("list_board");
    const fails = episode.notes.find((note) => note.headline === "The plate fails");
    const arrives = episode.notes.find((note) => note.headline === "The inspector arrives");
    await series.callTool("create_group", { noteIds: [arrives.id, fails.id], title: "Act one" });
    await series.callTool("open_board", { board: "1" });
    const reply = await series.callTool("move_scene", { id: "maya-letter", board: "Episode 2", after: arrives.id });
    expect(reply).toContain('after "The inspector arrives", in "Act one"');
    // It sits between the anchor and what followed the anchor, in the anchor's group.
    expect(reply).toContain("Story order on \"Episode 2\" now: 1. The letter is read aloud, 2. The inspector arrives, 3. Maya finds the letter, 4. The plate fails");
    const groups = (await series.callToolData("list_board")).groups;
    expect(groups.find((group) => group.title === "Act one").noteIds).toHaveLength(3);
  });

  it("read_character reads a person's part across every board, with place, when and rank (round fifteen, entries 22, 23)", async () => {
    // Maya is on "Maya finds the letter", now on Episode 2, and on "Tom lies about the job" on Board 1.
    const reply = await series.callTool("read_character", { name: "Maya" });
    expect(reply).toContain("across 2 boards of the project");
    expect(reply).toContain('"Board 1", 1 card in story order: 1. "Tom lies about the job"');
    expect(reply).toContain('"Episode 2", 2 cards in story order: 1. "The letter is read aloud"; 2. "Maya finds the letter"');
    await series.callTool("set_when", { ids: ["maya-letter"], when: "night" });
    await series.callTool("set_rank", { ids: ["maya-letter"], rank: "beat" });
    expect(await series.callTool("read_character", { name: "Maya" })).toContain('"Maya finds the letter" (night · beat)');
  });

  it("list_structures names every built-in structure's beats in prose (round fifteen, entry 24)", async () => {
    const text = await series.callTool("list_structures");
    expect(text).toContain('three-acts — "Three acts" (7 beats: Setup at 1%');
    expect(text).not.toContain("in the JSON");
  });

  it("delete_note says the fold went with the card", async () => {
    const reply = await series.callTool("delete_note", { id: "letter-aloud" });
    expect(reply).toContain("Its folded corner went with it");
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

  it("redoes what it undid, newest first, and a new change clears the way back", async () => {
    // The undos above are redoable until the server changes something new.
    expect(await back.callTool("redo")).toContain("Redid");
    await back.callTool("set_logline", { logline: "A clean slate" });
    expect(await back.callTool("redo")).toContain("Nothing of mine to redo");
    await back.callTool("create_note", { headline: "The second gun", change: "Somebody mentions it." });
    await back.callTool("set_logline", { logline: "Will the gun go off?" });
    await back.callTool("undo");
    await back.callTool("undo");
    let board = JSON.parse(fs.readFileSync(file(), "utf8")).state;
    expect(board.notes.some((note) => note.headline === "The second gun")).toBe(false);

    const first = await back.callTool("redo");
    expect(first).toContain('Redid create_note "The second gun"');
    expect(first).toContain("1 more can be redone");
    board = JSON.parse(fs.readFileSync(file(), "utf8")).state;
    expect(board.notes.some((note) => note.headline === "The second gun")).toBe(true);
    expect(board.logline).not.toBe("Will the gun go off?");

    // A new change of the server's own forgets what was undone.
    await back.callTool("set_target", { pages: 90 });
    expect(await back.callTool("redo")).toContain("Nothing of mine to redo");
    // And the redone change is undoable again.
    expect(await back.callTool("undo")).toContain("Undid set_target");
    expect(await back.callTool("undo")).toContain('Undid create_note "The second gun"');
  });

  it("refuses to redo over a change somebody else made since", async () => {
    await back.callTool("set_logline", { logline: "A question to take back" });
    await back.callTool("undo");
    const saved = JSON.parse(fs.readFileSync(file(), "utf8"));
    saved.state.notes[0].change = "Something else happened.";
    saved.rev += 1;
    fs.writeFileSync(file(), JSON.stringify(saved));
    expect(await back.callTool("redo")).toContain("Not redone: the board has changed since I undid my set_logline");
    expect(JSON.parse(fs.readFileSync(file(), "utf8")).state.logline).not.toBe("A question to take back");
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
    // A selection already in place is nothing to organize; knock one card out first.
    await tidy.callTool("move_note", { id: ids[0], x: 3000, y: 3000 });
    const text = await tidy.callTool("organize", { noteIds: ids });
    expect(text).toContain("Organized 3 card(s)");
    expect(await tidy.callTool("undo")).toContain("Undid organize");
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
    expect(await season.callTool("rename_board", { board: "1", name: "Episode 1" })).toContain('to "Episode 1"');
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

// The writer's own structures (R38), through the agent door.
describe("structures of the writer's own", () => {
  let own;
  let ownRoot;

  beforeAll(async () => {
    ownRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-structures-"));
    own = new McpClient(ownRoot);
    await own.start();
  }, 30000);

  afterAll(() => {
    own?.stop();
    if (ownRoot) fs.rmSync(ownRoot, { recursive: true, force: true });
  });

  it("says what the words mean, the way the app does", async () => {
    const text = await own.callTool("list_words");
    expect(text).toContain("A beat: One of the eight to fifteen big turns");
    expect(text).toContain("The folded corner:");
    expect(text).not.toMatch(/inciting/i);
  });

  it("lists the built-in structures and, at first, none of the writer's", async () => {
    const text = await own.callTool("list_structures");
    expect(text).toContain("built in: 5");
    expect(text).toContain('turns — "Turns"');
    expect(text).toContain("the writer's own: 0");
  });

  it("refuses to save a wall with no beats, then saves the beats in reading order", async () => {
    expect(await own.callTool("save_structure", { name: "Maya's shape" })).toContain("Nothing to save");
    const board = await own.callToolData("list_board");
    const [first, , third] = board.notes.map((note) => note.id);
    await own.callTool("set_rank", { ids: [third, first], rank: "beat" });
    const saved = await own.callToolData("save_structure", { name: "  Maya's shape " });
    expect(saved.name).toBe("Maya's shape");
    expect(saved.beats).toHaveLength(2);
    expect(saved.beats[0].name).toBe(board.notes[0].headline);
    expect(saved.beats[0].at).toBe(0);
    expect(saved.beats[1].at).toBeGreaterThan(0);
    expect(await own.callTool("list_structures")).toContain("the writer's own: 1");
    // It is on the project record, where the app reads it.
    const project = JSON.parse(fs.readFileSync(path.join(ownRoot, ".plotcoder", "project.json"), "utf8")).project;
    expect(project.structures.map((structure) => structure.name)).toEqual(["Maya's shape"]);
  });

  it("lays one of the writer's own on the wall by name, and removes it by name", async () => {
    const before = (await own.callToolData("list_board")).notes.length;
    const laid = await own.callTool("apply_template", { template: "maya's shape" });
    expect(laid).toContain('Laid out 2 beats of "Maya\'s shape"');
    expect((await own.callToolData("list_board")).notes).toHaveLength(before + 2);
    expect(await own.callTool("remove_structure", { structure: "nope" })).toContain("No structure of the writer's");
    expect(await own.callTool("remove_structure", { structure: "Maya's shape" })).toContain('Removed "Maya\'s shape"');
    expect(await own.callTool("list_structures")).toContain("the writer's own: 0");
    expect(await own.callTool("apply_template", { template: "maya's shape" })).toContain("No structure called");
  });

  it("refuses to make an account for something that is not an address, without touching the network", async () => {
    expect(await own.callTool("claim_account", { email: "robert", password: "x" })).toContain("does not look like an email address");
  });

  it("answers plainly when the account door is shut", async () => {
    expect(await own.callTool("new_project", { name: "Another" })).toContain("No account door");
    expect(await own.callTool("delete_project", { project: "Another" })).toContain("No account door");
    expect(await own.callTool("empty_account")).toContain("No account door");
    expect(await own.callTool("delete_account")).toContain("No account door");
    expect(await own.callTool("add_picture", { character: "maya", path: "nowhere.png" })).toContain("No account door");
    expect(await own.callTool("list_files")).toContain("No account door");
    expect(await own.callTool("remove_file", { id: "x" })).toContain("No account door");
  });
});

// What a blind run found (2026-09-13): ids that moved, a sample nobody named,
// replies that said less than they knew.
describe("after the blind run", () => {
  let blind;
  let blindRoot;

  beforeAll(async () => {
    blindRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-blind-"));
    blind = new McpClient(blindRoot);
    await blind.start();
  }, 30000);

  afterAll(() => {
    blind?.stop();
    if (blindRoot) fs.rmSync(blindRoot, { recursive: true, force: true });
  });

  it("keeps the first board's id from one call to the next, and says the wall is the sample", async () => {
    const first = await blind.callTool("list_boards");
    const read = await blind.callTool("read_wall");
    const second = await blind.callTool("list_boards");
    const idOf = (text) => text.match(/1\. ([0-9a-f-]{36}) —/)?.[1];
    expect(idOf(first)).toBeTruthy();
    expect(idOf(second)).toBe(idOf(first));
    expect(read).toContain("sample: this is the wall PlotCoder starts with");
    expect(await blind.callTool("list_board")).toContain("sample: this is the wall");
    expect(read).toContain("checked and clean:");
    // The clean line says what was checked, in words, not the checks' names;
    // and every page is an estimate until a scene is written.
    expect(read).toContain("no card without a headline or change line");
    expect(read).not.toMatch(/checked and clean:.*unwritten/);
    expect(read).toContain("pages: all estimates — no scene is written yet");
    expect(read).toContain("(distances in estimated pages)");
    expect(read).toMatch(/checks: 11 run — asking (nothing|\d+ questions? of \d+ kinds?: [a-z ×0-9, ]+); checked and clean:/);
  });

  it("names the card's id and casts it in one call, adding a role-named person to the roster", async () => {
    const text = await blind.callTool("create_note", { headline: "Dana calls their mother", change: "She lies about where they are.", characters: ["Maya", "Dana's mother"] });
    expect(text).toMatch(/^Created card [A-Za-z0-9_-]+: a scene, /);
    expect(text).toContain("no place yet (location here, or set_location)");
    expect(text).toMatch(/added to the roster: .*Dana's mother \([^)]+\)/);
    expect(text).toMatch(/Cast: Maya, Dana's mother \(added to the roster: Dana's mother \([^)]+\)\)/);
    const board = await blind.callToolData("list_board");
    const mother = board.characters.find((person) => person.name === "Dana's mother");
    expect(mother).toBeTruthy();
    const card = board.notes.find((note) => note.headline === "Dana calls their mother");
    expect(card.characterIds).toContain(mother.id);
    expect(await blind.callTool("list_board")).not.toContain("sample: this is the wall");
  });

  it("says over or under in words, and what page_count counts", async () => {
    expect(await blind.callTool("set_target", { pages: 2 })).toMatch(/— [0-9 /]+ (over|under)\./);
    expect(await blind.callTool("list_board")).toMatch(/runtime: about .* — .* (over|under) \(an estimate/);
    const written = await blind.callToolData("list_board");
    await blind.callTool("write_scene", { id: written.notes[0].id, text: "INT. KITCHEN - NIGHT\n\nMaya reads it twice." });
    const pages = await blind.callTool("page_count");
    expect(pages).toContain("unwritten and set their change line as action");
    expect(await blind.callTool("new_board", { name: "Ep 2" })).toContain("leave it empty rather than invent it");
  });

  it("names both cards when it draws an arrow, and does not call a read a write", async () => {
    await blind.callTool("open_board", { board: "1" });
    const board = await blind.callToolData("list_board");
    const [a, b] = board.notes;
    const drawn = await blind.callTool("create_arrow", { from: a.id, to: b.id, kind: "setup" });
    expect(drawn).toContain(`Drew "${a.headline}" → "${b.headline}" as a setup`);
    expect(await blind.callTool("list_reminders")).not.toContain("written to file");
  });

  it("takes the target in minutes, and asks about two beats back to back", async () => {
    expect(await blind.callTool("set_target", { minutes: 90 })).toContain("Target is 90 pages");
    expect(await blind.callTool("set_target", {})).toContain("in pages or in minutes");
    await blind.callTool("new_board", { name: "Back to back" });
    await blind.callTool("create_note", { headline: "The gate", change: "Miguel checks the glovebox.", rank: "beat", x: 0, y: 0 });
    await blind.callTool("create_note", { headline: "The gun", change: "Dana moves it to her jacket.", rank: "beat", x: 600, y: 0 });
    const read = await blind.callTool("read_wall");
    expect(read).toMatch(/\[empty\] Nothing runs between "The gate" and "The gun"/);
  });

  it("drops the JSON tail when PLOTCODER_JSON=0", async () => {
    const terseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-terse-"));
    const terse = new McpClient(terseRoot, { PLOTCODER_JSON: "0" });
    await terse.start();
    try {
      const text = await terse.callTool("list_board");
      expect(text).toContain("cards (in story order");
      expect(text).not.toContain('"notes": [');
    } finally {
      terse.stop();
      fs.rmSync(terseRoot, { recursive: true, force: true });
    }
  });

  it("after round three: echoes what a card landed with, writes a page by name, counts no pages when nothing is written", async () => {
    const third = new McpClient(fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-three-")));
    await third.start();
    try {
      const made = await third.callTool("new_board", { name: "The Long Way Round" });
      expect(made).toContain('The project is still "Untitled project": rename_project names it.');
      expect(made).toContain("The sample stays as Board 1; delete_board drops it.");
      const card = await third.callTool("create_note", { headline: "The gate", change: "Miguel checks the glovebox.", rank: "beat", pages: 4, plants: true, location: "the prison gate", characters: ["Dana"] });
      expect(card).toMatch(/^Created card \S+: a beat, 4 pages, yellow paper \(pass color to choose\), corner folded, at the prison gate/);
      expect(card).toContain("Placed after the last card in story order");
      expect(await third.callTool("update_character", { name: "dana", notes: "38, a bad knee and a good ear." })).toContain('Set notes: "38, a bad knee and a good ear." on Dana\'s page');
      expect(await third.callTool("update_character", { name: "nobody", notes: "x" })).toContain('Nobody called "nobody" in the cast');
      const pages = await third.callTool("page_count");
      expect(pages).toContain("No pages to count yet: none of the 1 scenes is written.");
      expect(pages).toContain("about 4 of 120 pages");
      await third.callTool("create_note", { headline: "The diner", change: "Miguel pockets the tips.", pages: 6, x: 400, y: 0 });
      const board = await third.callToolData("list_board");
      await third.callTool("create_group", { noteIds: board.notes.map((note) => note.id), title: "Act one" });
      await third.callTool("set_length", { ids: board.notes.map((note) => note.id), pages: 15 });
      expect(await third.callTool("read_wall")).not.toMatch(/\[sequence\]/);
      expect(await third.callTool("read_wall")).toContain("a beat's own pages are in no run");
    } finally {
      third.stop();
    }
  });

  it("keeps ticket numbers out of every tool description", async () => {
    const { tools } = await blind.request("tools/list", {});
    for (const tool of tools) expect(tool.description).not.toMatch(/\b[RD]\d\d\b|question \d+/);
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

  it("exports the wall as Markdown and the script as plain text, to the caller or to a file", async () => {
    // The project was named "The Letter" above and holds one board, so the film goes out under its own name (round thirteen, entry 26).
    const markdown = await door.callTool("export_markdown");
    expect(markdown).toContain("# The Letter");
    expect(markdown).not.toContain("Board 1");
    expect(markdown).toContain("### 1 · MAYA FINDS THE LETTER");
    expect(markdown).toContain("She decides not to tell Tom.");
    const text = await door.callTool("export_text");
    expect(text.split("\n")[0].trim()).toBe("THE LETTER");
    expect(text).toContain(`1    ${"MAYA FINDS THE LETTER".padEnd(60)} 1`);
    expect(text).toContain("     [Unwritten] She decides not to tell Tom.");
    const target = path.join(doorRoot, "out", "board.md");
    expect(await door.callTool("export_markdown", { path: target })).toContain('lines of Markdown, titled "The Letter"');
    expect(fs.readFileSync(target, "utf8")).toContain("# The Letter");
    const plain = path.join(doorRoot, "out", "board.txt");
    expect(await door.callTool("export_text", { path: plain })).toContain("lines of plain text");
    expect(fs.readFileSync(plain, "utf8")).toContain("MAYA FINDS THE LETTER");
  });

  it("exports the wall as Fountain, to the caller or to a file", async () => {
    const text = await door.callTool("export_fountain");
    expect(text).toContain("Title: The Letter");
    expect(text).not.toContain("An episode of");
    expect(text).toContain(".MAYA FINDS THE LETTER");
    expect(text).toContain("[[with Maya]]");
    expect(text).toContain("[Unwritten] She decides not to tell Tom.");
    const target = path.join(doorRoot, "out", "board.fountain");
    expect(await door.callTool("export_fountain", { path: target })).toContain("lines of Fountain");
    expect(fs.readFileSync(target, "utf8")).toContain(".TOM LIES ABOUT THE JOB");
  });

  it("sets when a scene happens, prints it on the heading, and changes one line of a scene (R55; round fourteen, entry 48)", async () => {
    const when = await door.callTool("set_when", { ids: ["maya-letter"], when: "night" });
    expect(when).toContain('1 card(s) now happen at "night"');
    expect(when).toContain("The heading prints as MAYA FINDS THE LETTER - NIGHT");
    expect(await door.callTool("set_when", { ids: ["maya-letter"], when: "night" })).toContain("Nothing changed");
    expect(await door.callTool("list_board")).toContain("when: night");
    expect(await door.callTool("read_pages")).toContain(".MAYA FINDS THE LETTER - NIGHT");
    expect(await door.callTool("set_when", { ids: ["maya-letter"], when: "" })).toContain("no longer say when");
    // edit_scene: one line, once, measured again.
    expect(await door.callTool("edit_scene", { id: "maya-letter", find: "Tom?", replace: "Tom? On the bus." })).toContain("is unwritten; write_scene it first");
    await door.callTool("write_scene", { id: "maya-letter", text: "Rain on the window.\n\nMAYA\nTom?\n\nTOM\nTom?" });
    expect(await door.callTool("edit_scene", { id: "maya-letter", find: "Tom?", replace: "Tom? On the bus." })).toContain("occurs 2 times");
    expect(await door.callTool("edit_scene", { id: "maya-letter", find: "Nobody", replace: "x" })).toContain("is not in");
    const edited = await door.callTool("edit_scene", { id: "maya-letter", find: "MAYA\nTom?", replace: "MAYA\nTom? On the bus." });
    expect(edited).toContain('Changed one line of "Maya finds the letter"');
    expect(await door.callTool("read_pages")).toContain("Tom? On the bus.");
    await door.callTool("write_scene", { id: "maya-letter", text: "" });
  });

  it("writes a scene onto a card, measures it, reads the pages with ids, and imports a script", async () => {
    const wrote = await door.callTool("write_scene", { id: "maya-letter", text: "Rain on the window.\n\nMAYA\nTom?" });
    expect(wrote).toMatch(/Wrote "Maya finds the letter": \d+ line\(s\) as they print .*measured at 1\/8 of a 55-line page/);
    expect(await door.callTool("list_board")).toContain("[scene, 1/8 pages, written");
    const pages = await door.callTool("read_pages");
    expect(pages).toContain(".MAYA FINDS THE LETTER    [[id: maya-letter · measured 1/8pp · no place: the headline stands in for the heading]]");
    expect(pages).toContain(".TOM LIES ABOUT THE JOB    [[id: tom-lies · estimated 1pp · no place: the headline stands in for the heading]]");
    const imported = await door.callTool("import_fountain", {
      text: ".TOM LIES ABOUT THE JOB\n\nHe says the job is fine.\n\n.THE BANK\n\nThere is no loan.\n",
    });
    expect(imported).toContain("Imported 2 scene(s): 1 written onto cards, 0 matched with the same text (unchanged), 1 new card(s)");
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

  it("locks the numbers, gives a new scene an A-number in the export, and runs a revision", async () => {
    expect(await door.callTool("lock_numbers")).toMatch(/Locked \d+ scene number\(s\)/);
    expect(await door.callTool("list_board")).toContain("numbers: locked");
    await door.callTool("create_note", { headline: "Between", change: "x", x: 200, y: 120 });
    const fdx = await door.callTool("export_fdx");
    expect(fdx).toMatch(/Number="\d+A"/);
    expect(await door.callTool("start_revision", { name: "blue draft", color: "blue" })).toContain('Started the blue revision "blue draft"');
    expect(await door.callTool("list_board")).toContain('revision: "blue draft" in blue');
    expect(await door.callTool("end_revision")).toMatch(/Revision "blue draft" \(blue\) ended/);
    expect(await door.callTool("unlock_numbers")).toMatch(/Unlocked \d+ scene number\(s\)/);
    expect(await door.callTool("unlock_numbers")).toContain("were not locked");
  });

  it("hands a brief to a video tool that is not there yet, and says so", async () => {
    const text = await door.callTool("build_segment", { ids: ["maya-letter"] });
    expect(text).toContain("No video tool is configured");
    expect(text).toContain("SEGMENT: Maya finds the letter");
    expect(await door.callTool("list_takes")).toContain("No account door");
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
    expect(listed).toMatch(/^reminders on "The Letter" .*: 6 — 6 the house principles/);
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

// The account door, shut: the writer's sign-in is in the environment but the
// account service refuses it (here: nothing listens on the address). Every
// tool says so in words, and none reads the folder's wall instead — an agent
// that trusted the replies would otherwise build the whole wall in the wrong
// place and report success (round four, findings 5–7).
describe("the account door, when the sign-in fails", () => {
  let shut;
  let shutRoot;

  beforeAll(async () => {
    shutRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-shut-"));
    shut = new McpClient(shutRoot, {
      PLOTCODER_EMAIL: "test@test.com",
      PLOTCODER_PASSWORD: "wrong",
      VITE_SUPABASE_URL: "http://127.0.0.1:1",
    });
    await shut.start();
  }, 30000);

  afterAll(() => {
    shut?.stop();
    if (shutRoot) fs.rmSync(shutRoot, { recursive: true, force: true });
  });

  it("refuses every tool in words, names the address, and never falls back to the file", async () => {
    const read = await shut.callTool("list_board");
    expect(read).toContain("The account door refused test@test.com");
    expect(read).toContain("claim_account");
    expect(read).not.toContain("the file at");
    expect(await shut.callTool("read_wall")).toContain("The account door refused");
    expect(await shut.callTool("create_note", { headline: "Nessa comes back", change: "She decides to sell." })).toContain("The account door refused");
    expect(await shut.callTool("list_projects")).toContain("The account door refused");
    expect(await shut.callTool("new_project", { name: "Low Season" })).toContain("The account door refused");
    expect(await shut.callTool("list_files")).toContain("The account door refused");
    expect(await shut.callTool("empty_account", { confirm: true })).toContain("The account door refused");
    expect(await shut.callTool("delete_account", { confirm: true })).toContain("The account door refused");
    const file = JSON.stringify({ app: "plotcoder", version: 2, exportedAt: "2026-09-13T00:00:00.000Z", storage: { "plotcoder.notes": "[]", "plotcoder.groups": "[]", "plotcoder.arrows": "[]" } });
    expect(await shut.callTool("import_project", { text: file })).toContain("The account door refused");
    expect(fs.existsSync(path.join(shutRoot, ".plotcoder", "board.json"))).toBe(false);
  });
});

// The shell caller starts a fresh server for every call, and says so where it
// matters: undo, and the project a call chose (round four, findings 8 and 13).
describe("the shell caller, one server per call", () => {
  it("prints its help, with the environment it passes on, and exits clean", () => {
    const { spawnSync } = require("node:child_process");
    const help = spawnSync("node", [fileURLToPath(new URL("./plotcoder-call.mjs", import.meta.url)), "--help"], { encoding: "utf8" });
    expect(help.status).toBe(0);
    expect(help.stderr).toContain("One call, one server");
    expect(help.stderr).toContain("PLOTCODER_PASSWORD");
  });

  it("runs a batch of calls on one server, with the JSON tail off, so undo carries within it", () => {
    const { spawnSync } = require("node:child_process");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-call-batch-"));
    const calls = [
      { tool: "create_note", arguments: { headline: "Nessa comes back", change: "She decides to sell." } },
      { tool: "undo", arguments: {} },
      { tool: "list_board", arguments: {} },
    ].map((call) => JSON.stringify(call)).join("\n");
    const run = spawnSync("node", [fileURLToPath(new URL("./plotcoder-call.mjs", import.meta.url)), "--batch"], {
      encoding: "utf8",
      input: calls,
      env: { ...process.env, PLOTCODER_ROOT: root, PLOTCODER_NO_BRIDGE: "1" },
    });
    fs.rmSync(root, { recursive: true, force: true });
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("--- create_note");
    expect(run.stdout).toContain("--- undo");
    expect(run.stdout).toMatch(/Undid create_note/);
    // After the undo, the board listed on the same server no longer has the card.
    expect(run.stdout.split("--- list_board")[1]).not.toContain("Nessa comes back");
    expect(run.stdout).not.toMatch(/\n\n\{/);
  });

  it("is the package's own command too: plotcoder-board call <tool>", () => {
    const { spawnSync } = require("node:child_process");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-board-call-"));
    const run = spawnSync("node", [fileURLToPath(new URL("./plotcoder-mcp.mjs", import.meta.url)), "call", "list_words"], {
      encoding: "utf8",
      env: { ...process.env, PLOTCODER_ROOT: root, PLOTCODER_NO_BRIDGE: "1" },
    });
    fs.rmSync(root, { recursive: true, force: true });
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("PlotCoder's words");
  });

  it("tells a one-call server that undo cannot carry between calls", async () => {
    const oneRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-one-"));
    const one = new McpClient(oneRoot, { PLOTCODER_ONE_CALL: "1" });
    await one.start();
    try {
      expect(await one.callTool("undo")).toContain("every call is a fresh server");
    } finally {
      one.stop();
      fs.rmSync(oneRoot, { recursive: true, force: true });
    }
  }, 30000);
});

// The account wins over an open app when the sign-in is set: the sign-in is
// the agent saying which wall it means (run five, finding 9 — five calls on
// another worktree's wall). Here the account refuses, so the reply is the
// refusal, and the bridge that is answering is never read.
describe("the account door beside an open app", () => {
  it("goes to the account, not the app, when the sign-in is set", async () => {
    const bridge = startFakeBridge();
    const url = await bridge.listen();
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-both-"));
    const both = new McpClient(root, {
      PLOTCODER_NO_BRIDGE: "0",
      PLOTCODER_BRIDGE_URL: url,
      PLOTCODER_EMAIL: "test@test.com",
      PLOTCODER_PASSWORD: "wrong",
      VITE_SUPABASE_URL: "http://127.0.0.1:1",
    });
    await both.start();
    try {
      const read = await both.callTool("list_board");
      expect(read).toContain("The account door refused test@test.com");
      expect(read).not.toContain("the open app");
      expect(bridge.puts).toHaveLength(0);
    } finally {
      both.stop();
      bridge.close();
      fs.rmSync(root, { recursive: true, force: true });
    }
  }, 30000);
});

// The front door answers in words when the server cannot start (rounds four
// and five: "Connection closed" was all an agent saw of a folder without
// npm ci). One tool, whose description is the reason and the fix.
describe("the launcher, when dependencies are missing", () => {
  it("serves one tool that says to run npm ci in the folder", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-bare-"));
    const bare = new McpClient(root, { PLOTCODER_PRETEND_NOT_INSTALLED: "1" });
    await bare.start();
    try {
      const { tools } = await bare.request("tools/list", {});
      expect(tools.map((tool) => tool.name)).toEqual(["plotcoder_not_installed"]);
      expect(tools[0].description).toContain("npm ci");
      expect(await bare.callTool("list_board")).toContain("Run `npm ci`");
    } finally {
      bare.stop();
      fs.rmSync(root, { recursive: true, force: true });
    }
  }, 30000);
});

// The project as a file (R46): export_project writes what Save project
// writes, import_project opens what Open project opens, and through the
// file door an import replaces only when told to.
describe("the project as a file", () => {
  let fileRoot;
  let files;

  beforeAll(async () => {
    fileRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-file-"));
    files = new McpClient(fileRoot);
    await files.start();
  }, 30000);

  afterAll(() => {
    files?.stop();
    if (fileRoot) fs.rmSync(fileRoot, { recursive: true, force: true });
  });

  it("saves the project as the file Open project takes, and says what is in it", async () => {
    await files.callTool("rename_project", { name: "Low Season" });
    await files.callTool("create_note", { headline: "Nessa comes back", change: "She decides to sell.", rank: "beat" });
    const out = path.join(fileRoot, "out", "low-season.json");
    const text = await files.callTool("export_project", { path: out });
    expect(text).toContain('Saved "Low Season": 1 board(s) — "Board 1" (4 cards)');
    expect(text).toContain("Pictures and takes on the account are not in the file");
    const file = JSON.parse(fs.readFileSync(out, "utf8"));
    expect(file.app).toBe("plotcoder");
    expect(file.version).toBe(2);
    expect(Object.keys(file.storage)).toContain("plotcoder.project");
    const inline = await files.callToolData("export_project");
    expect(inline.storage["plotcoder.project"]).toContain("Low Season");
  });

  it("refuses what is not a project file, asks before replacing, and replaces when told", async () => {
    expect(await files.callTool("import_project", { text: "not json" })).toContain("not JSON");
    expect(await files.callTool("import_project", { text: JSON.stringify({ hello: "world" }) })).toContain("not a PlotCoder project file");
    const saved = await files.callToolData("export_project");
    await files.callTool("rename_project", { name: "Something else" });
    await files.callTool("create_note", { headline: "One more", change: "A fifth card." });
    const asked = await files.callTool("import_project", { text: JSON.stringify(saved) });
    expect(asked).toContain('would replace "Something else" (1 board(s), 5 card(s))');
    expect(await files.callTool("list_boards")).toContain('"Something else"');
    const done = await files.callTool("import_project", { text: JSON.stringify(saved), confirm: true });
    expect(done).toContain('Imported "Low Season" (1 board(s), 4 card(s)), replacing "Something else"');
    expect(await files.callTool("list_boards")).toContain('"Low Season"');
    const board = await files.callToolData("list_board");
    expect(board.notes).toHaveLength(4);
    expect(await files.callTool("undo")).toContain("Nothing of mine to undo");
  });
});

// Round seven's replies: a board by number, an unsized card that says so,
// the logline echoed, a fold paid off by its arrow, a run's cards named.
describe("round seven's replies", () => {
  let sevenRoot;
  let seven;

  beforeAll(async () => {
    sevenRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-seven-"));
    seven = new McpClient(sevenRoot);
    await seven.start();
  }, 30000);

  afterAll(() => {
    seven?.stop();
    if (sevenRoot) fs.rmSync(sevenRoot, { recursive: true, force: true });
  });

  it("takes a board by its number as a number, and names the logline it set", async () => {
    expect(await seven.callTool("rename_board", { board: 1, name: "Pilot" })).toContain('"Pilot"');
    expect(await seven.callTool("set_logline", { logline: "What was her father being paid for?" })).toContain('Logline set: "What was her father being paid for?"');
  });

  it("says a new card is unsized, once that cards stack, and where a fold is paid off", async () => {
    const first = await seven.callTool("create_note", { headline: "The ledger", change: "A question nobody answers.", plants: true, rank: "beat" });
    expect(first).toContain("about a page (unsized: the writer's guess until set_length)");
    expect(first).toContain("Placed after the last card in story order");
    const second = await seven.callTool("create_note", { headline: "The cash arrives", change: "An envelope, no name.", rank: "beat" });
    // Said once per session (round thirteen, entry 10).
    expect(second).not.toContain("Placed after the last card");
    const placed = await seven.callToolData("list_board");
    const [one, two] = placed.notes.slice(-2);
    expect(two.y).toBe(one.y);
    expect(two.x).toBeGreaterThan(one.x);
    const board = await seven.callToolData("list_board");
    const ledger = board.notes.find((note) => note.headline === "The ledger");
    const cash = board.notes.find((note) => note.headline === "The cash arrives");
    expect(await seven.callTool("list_board")).toContain("unsized");
    expect(await seven.callTool("list_board")).toContain("no target set");
    const arrow = await seven.callTool("create_arrow", { from: ledger.id, to: cash.id, kind: "setup" });
    expect(arrow).toContain('The fold on "The ledger" is paid off now');
  });

  it("reads the wall with its logline and each run's cards", async () => {
    await seven.callTool("create_note", { headline: "Fiona at the launderette", change: "Sell it and go." });
    const read = await seven.callTool("read_wall");
    expect(read).toContain('logline: "What was her father being paid for?"');
    expect(read).toMatch(/\[empty\] .*\(ids: [A-Za-z0-9_-]+, [A-Za-z0-9_-]+\)/);
    expect(await seven.callTool("list_reminders")).toMatch(/^reminders on "Untitled project" \(the file at .*\): 6 — 6 the house principles the app starts with \(built in\), 0 the writer's own; add_reminder adds one/);
    expect(await seven.callTool("list_words")).toMatch(/^PlotCoder's words — the app's own/);
    const workflows = await seven.callTool("list_workflows");
    expect(workflows).toMatch(/^The workflows — the app's own/);
    expect(workflows).toContain("the treatment should answer (ask the writer for what it leaves open; invent none of it):");
    expect(workflows).toContain("How long is it? An hour, a half-hour, a feature — or a page count, if you have one. → set_target");
    // A new card lands after the last in reading order, so Fiona follows the cash.
    expect(read).toContain('"The ledger" → "The cash arrives": about 0 pages, 0 cards');
    expect(read).toMatch(/After "The cash arrives": about \d+ pages, \d+ cards? — .*"Fiona at the launderette"/);
  });
});

// Round ten's build replies: the card comes back cast, boards are named
// when renamed, organize says why it wrapped, places sit side by side, a
// near match is named, and the runtime stops judging against a target
// nobody set.
describe("round ten's replies", () => {
  let tenRoot;
  let ten;

  beforeAll(async () => {
    tenRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-ten-"));
    ten = new McpClient(tenRoot);
    await ten.start();
  }, 30000);

  afterAll(() => {
    ten?.stop();
    if (tenRoot) fs.rmSync(tenRoot, { recursive: true, force: true });
  });

  it("returns the card with its cast landed, and names the board it renamed", async () => {
    const card = await ten.callToolData("create_note", { headline: "Nessa comes back", change: "She decides to sell.", characters: ["Nessa Boyd", "Dessie Kane"] });
    expect(card.characterIds).toHaveLength(2);
    const renamed = await ten.callTool("rename_board", { board: 1, name: "Pilot" });
    expect(renamed).toMatch(/^Renamed board "Board 1" \([0-9a-f-]+\) to "Pilot"/);
  });

  it("says why organize wrapped five wide, and that no target is set", async () => {
    const tidy = await ten.callTool("organize");
    expect(tidy).toContain("five cards wide — no beats yet");
    const board = await ten.callTool("list_board");
    expect(board).toMatch(/runtime: about \d+ pages \(an estimate[^)]*\); no target set — set_target/);
    expect(board).not.toContain("-page target");
    await ten.callTool("set_target", { pages: 60 });
    expect(await ten.callTool("list_board")).toContain("of a 60-page target");
  });

  it("reads the wall with its runtime and its groups, and counts the opening row", async () => {
    const board = await ten.callToolData("list_board");
    const ids = board.notes.map((note) => note.id);
    await ten.callTool("set_rank", { ids: [ids[1]], rank: "beat" });
    await ten.callTool("create_group", { noteIds: [ids[0], ids[1]], title: "Act one" });
    const read = await ten.callTool("read_wall");
    expect(read).toContain("runtime: about");
    expect(read).toContain('groups: "Act one" — 2 card(s), about 2 pages, read as an act');
    const tidy = await ten.callTool("organize");
    expect(tidy).toMatch(/an opening row of \d+ card\(s\) before the first beat, then 1 row\(s\), one per beat/);
    expect(await ten.callTool("rename_character", { id: board.characters[0].id, name: "Nessa" })).toMatch(/the name changed on \d+ cards?/);
    const wrote = await ten.callTool("write_scene", { id: ids[0], text: "INT. OFFICE - NIGHT\n\nNessa opens the ledger.\n\nNESSA\nEvery month." });
    expect(wrote).toMatch(/\d+ line\(s\) as they print .*measured at [0-9/ ]+ of a 55-line page/);
    expect(await ten.callTool("page_count")).toContain("this is the script so far, not the runtime");
  });

  it("lists the places side by side, and names a near match when a place is set", async () => {
    const board = await ten.callToolData("list_board");
    const [a, b, c] = board.notes.map((note) => note.id);
    await ten.callTool("set_location", { ids: [a], location: "the caravan park" });
    const near = await ten.callTool("set_location", { ids: [b], location: "the caravan park, the rows" });
    expect(near).toContain('The wall also has "the caravan park"');
    const clean = await ten.callTool("set_location", { ids: [c], location: "the chip shop" });
    expect(clean).not.toContain("The wall also has");
    const listed = await ten.callTool("list_board");
    expect(listed).toContain("places (each phrase is its own place");
    expect(listed).toContain('  - "the caravan park" on 1 card');
    expect(listed).toContain('  - "the caravan park, the rows" on 1 card');
  });
});

// Undo walks the whole trail back even when the store hands the board back
// with its keys in another order (round ten, finding 29), and move_scene is
// one step of it.
describe("undo through a store that reorders keys, and move_scene", () => {
  let bridge;
  let root;
  let client2;

  beforeAll(async () => {
    bridge = startFakeBridge({ notes: [], groups: [], arrows: [] });
    const url = await bridge.listen();
    root = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-undo-"));
    client2 = new McpClient(root, { PLOTCODER_NO_BRIDGE: "0", PLOTCODER_BRIDGE_URL: url });
    await client2.start();
  }, 30000);

  afterAll(async () => {
    client2?.stop();
    await bridge?.close();
    if (root) fs.rmSync(root, { recursive: true, force: true });
  });

  it("undoes three of its own steps in a row, and names organize by its name", async () => {
    const a = await client2.callToolData("create_note", { headline: "A", change: "a.", rank: "beat" });
    const b = await client2.callToolData("create_note", { headline: "B", change: "b." });
    const c = await client2.callToolData("create_note", { headline: "C", change: "c." });
    const d = await client2.callToolData("create_note", { headline: "D", change: "d." });
    await client2.callTool("create_arrow", { from: a.id, to: b.id });
    await client2.callTool("create_arrow", { from: b.id, to: c.id });
    await client2.callTool("create_arrow", { from: c.id, to: d.id });
    expect(await client2.callTool("organize")).toContain("Organized");
    expect(await client2.callTool("undo")).toContain("Undid organize");
    expect(await client2.callTool("undo")).toContain("Undid create_arrow");
    expect(await client2.callTool("undo")).toContain("Undid create_arrow");
    expect(await client2.callTool("redo")).toContain("Redid create_arrow");
    expect(await client2.callTool("redo")).toContain("Redid create_arrow");
  });

  it("writes one frame to the open wall for a create_note with a cast, so ⌘Z there takes back the whole call", async () => {
    const before = bridge.puts.length;
    const made = await client2.callToolData("create_note", { headline: "E", change: "e.", characters: ["Nessa", "Dessie"] });
    expect(made.characterIds).toHaveLength(2);
    expect(bridge.puts.length).toBe(before + 1);
    expect(bridge.getState().characters.map((person) => person.name).sort()).toEqual(["Dessie", "Nessa"]);
    expect(await client2.callTool("undo")).toContain('Undid create_note "E"');
    expect(bridge.getState().notes.map((note) => note.headline)).not.toContain("E");
    expect(bridge.getState().characters).toHaveLength(0);
  });

  it("moves a scene along the arrows as one undoable step", async () => {
    const board = await client2.callToolData("list_board");
    const id = (headline) => board.notes.find((note) => note.headline === headline).id;
    const putsBefore = bridge.puts.length;
    const moved = await client2.callTool("move_scene", { id: id("D"), after: id("A") });
    // One frame on the wall for the whole move, not one per arrow.
    expect(bridge.puts.length).toBe(putsBefore + 1);
    expect(moved).toContain('Moved "D" to after "A"');
    expect(moved).toContain("Story order now: 1. A, 2. D, 3. B, 4. C");
    expect(moved).toContain("One undo takes the whole move back");
    const after = await client2.callToolData("list_board");
    const pairs = after.arrows.map((arrow) => `${after.notes.find((n) => n.id === arrow.from).headline}>${after.notes.find((n) => n.id === arrow.to).headline}`).sort();
    expect(pairs).toEqual(["A>D", "B>C", "D>B"]);
    expect(await client2.callTool("undo")).toContain('Undid move_scene "D"');
    const back = await client2.callToolData("list_board");
    const pairsBack = back.arrows.map((arrow) => `${back.notes.find((n) => n.id === arrow.from).headline}>${back.notes.find((n) => n.id === arrow.to).headline}`).sort();
    expect(pairsBack).toEqual(["A>B", "B>C", "C>D"]);
    expect(await client2.callTool("delete_arrow", { id: back.arrows[0].id })).toMatch(/^Deleted the follows arrow "[A-D]" → "[A-D]"/);
  });
});

// Tool calls run one at a time: thirteen parallel create_note calls naming
// the same person make one person (round eleven, finding 22).
describe("one lane for tool calls", () => {
  it("makes one Nessa from many parallel calls", async () => {
    const laneRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-lane-"));
    const one = new McpClient(laneRoot);
    await one.start();
    try {
      await Promise.all(
        Array.from({ length: 8 }, (_, i) => one.callTool("create_note", { headline: `Scene ${i}`, change: "Something turns.", characters: ["Nessa Boyd"] })),
      );
      const board = await one.callToolData("list_board");
      expect(board.characters.filter((person) => person.name === "Nessa Boyd")).toHaveLength(1);
      expect(board.notes.filter((note) => note.headline.startsWith("Scene "))).toHaveLength(8);
      const ys = new Set(board.notes.map((note) => `${note.x},${note.y}`));
      expect(ys.size).toBe(board.notes.length);
    } finally {
      one.stop();
      fs.rmSync(laneRoot, { recursive: true, force: true });
    }
  }, 30000);
});

// Round eleven's directions: a fold that pays off on a later board (R50), and
// the replies that say more — the rank, the length, the rename, the move's
// group, the undo's order, the export's empty sections, the arrows in story
// order, the measure in the record.
describe("round eleven's directions", () => {
  let elevenRoot;
  let eleven;

  beforeAll(async () => {
    elevenRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-eleven-"));
    eleven = new McpClient(elevenRoot);
    await eleven.start();
  }, 30000);

  afterAll(() => {
    eleven?.stop();
    if (elevenRoot) fs.rmSync(elevenRoot, { recursive: true, force: true });
  });

  it("lets a fold pay off on a later board, and the wall stops asking", async () => {
    const key = await eleven.callToolData("create_note", { headline: "The key that fits nothing", change: "She keeps it.", plants: true });
    expect(await eleven.callTool("read_wall")).toContain("[unpaid]");
    expect(await eleven.callTool("set_plant", { ids: [key.id], plants: true, later: "1" })).toContain("is this board. A payoff on the same board is a setup arrow");
    await eleven.callTool("new_board", { name: "Episode two" });
    await eleven.callTool("open_board", { board: "1" });
    const later = await eleven.callTool("set_plant", { ids: [key.id], plants: true, later: "Episode two" });
    expect(later).toContain('pay off later, on "Episode two"');
    const read = await eleven.callTool("read_wall");
    expect(read).not.toContain("[unpaid]");
    expect(read).toContain('"The key that fits nothing" is folded and pays off later, on "Episode two"');
    expect(await eleven.callTool("list_board")).toContain("plants → pays off later");
    expect(await eleven.callTool("set_plant", { ids: [key.id], plants: true, later: "" })).toContain("forgotten");
    expect(await eleven.callTool("read_wall")).toContain("[unpaid]");
    expect(await eleven.callTool("set_plant", { ids: [key.id], plants: true, later: "Episode nine" })).toContain('No board called "Episode nine" yet');
  });

  it("says the rows are as they were, that a length is the writer's, and where a rename left the page", async () => {
    const board = await eleven.callToolData("list_board");
    const ids = board.notes.map((note) => note.id);
    expect(await eleven.callTool("set_rank", { ids: [ids[0]], rank: "beat" })).toContain("The rows are as they were; organize lays a row per beat");
    expect(await eleven.callTool("set_length", { ids: [ids[0]], pages: 3 })).toContain("3 page(s), the writer's estimate");
    await eleven.callTool("update_character", { name: "Maya", notes: "Maya has no surname in the treatment." });
    const renamed = await eleven.callTool("rename_character", { id: "maya", name: "Maya Boyd" });
    expect(renamed).toContain('The page\'s notes still mentions "Maya"');
    const saved = await eleven.callTool("export_project");
    expect(saved).toContain("no reminders of the writer's own (none to write)");
    const listed = await eleven.callToolData("list_board");
    expect(listed.notes[0]).toHaveProperty("eighths");
    expect(listed.notes[0]).toHaveProperty("measured", false);
  });

  it("names the group a moved card is still in, and gives the order back on undo", async () => {
    const board = await eleven.callToolData("list_board");
    const [a, b, c] = board.notes.map((note) => note.id);
    await eleven.callTool("create_arrow", { from: a, to: b });
    await eleven.callTool("create_arrow", { from: b, to: c });
    await eleven.callTool("create_group", { noteIds: [a, b], title: "Act one" });
    const moved = await eleven.callTool("move_scene", { id: b, after: c });
    expect(moved).toContain('It is still in "Act one"; a frame does not follow a move');
    const undone = await eleven.callTool("undo");
    expect(undone).toMatch(/Undid move_scene .*Story order now: 1\. /);
    const listed = await eleven.callTool("list_board");
    const arrowLines = listed.split("\n").filter((line) => /^  - [0-9a-z-]+ \[(follows|setup)\]/.test(line));
    expect(arrowLines.length).toBeGreaterThanOrEqual(2);
    expect(arrowLines[0]).toContain(`${a} → ${b}`);
  });
});

describe("round twelve's decisions: leaving a question, a structure beside the wall", () => {
  let twelveRoot;
  let twelve;

  beforeAll(async () => {
    twelveRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-twelve-"));
    twelve = new McpClient(twelveRoot);
    await twelve.start();
    // A bare wall: the sample's cards would sit among these.
    const sample = await twelve.callToolData("list_board");
    for (const note of sample.notes) await twelve.callTool("delete_note", { id: note.id });
    for (const person of sample.characters ?? []) await twelve.callTool("remove_character", { id: person.id });
  }, 30000);

  afterAll(() => {
    twelve?.stop();
    if (twelveRoot) fs.rmSync(twelveRoot, { recursive: true, force: true });
  });

  it("leaves a question on the writer's word, lists it, asks it again when it would read differently, and takes the word back", async () => {
    await twelve.callTool("set_target", { pages: 60 });
    const a = await twelve.callToolData("create_note", { headline: "A", change: "Turns.", rank: "beat", x: 100, y: 100 });
    await twelve.callToolData("create_note", { headline: "S1", change: "Turns.", x: 330, y: 100, pages: 1 });
    const b = await twelve.callToolData("create_note", { headline: "B", change: "Turns.", rank: "beat", x: 560, y: 100 });
    await twelve.callToolData("create_note", { headline: "S2", change: "Turns.", x: 790, y: 100, pages: 4 });
    const s3 = await twelve.callToolData("create_note", { headline: "S3", change: "Turns.", x: 1020, y: 100, pages: 4 });
    const c = await twelve.callToolData("create_note", { headline: "C", change: "Turns.", rank: "beat", x: 1250, y: 100 });
    await twelve.callToolData("create_note", { headline: "S4", change: "Turns.", x: 1480, y: 100, pages: 1 });
    await twelve.callToolData("create_note", { headline: "D", change: "Turns.", rank: "beat", x: 1710, y: 100 });
    expect(await twelve.callTool("read_wall")).toContain("[sag]");
    expect(await twelve.callTool("leave_question", { kind: "unpaid" })).toContain('not asking a question of kind "unpaid"');
    const left = await twelve.callTool("leave_question", { kind: "sag" });
    expect(left).toContain("Left, for now: [sag] About 8 pages run between");
    expect(left).toContain("asks a left question again on its own when it would read differently");
    expect(left).toContain("The wall still asks");
    const read = await twelve.callTool("read_wall");
    expect(read.split("left, for now")[0]).not.toContain("[sag]");
    expect(read).toContain("left, for now (the writer's word");
    expect(read).toContain(`[sag] About 8 pages run between "B" and "C"`);
    expect(read).toContain("1 left by the writer");
    expect(await twelve.callTool("leave_question", { kind: "sag" })).toContain("Already left");
    // A page moves in the run, and the wall asks again on its own.
    await twelve.callTool("set_length", { ids: [s3.id], pages: 6 });
    const again = await twelve.callTool("read_wall");
    expect(again).toContain("  - [sag] About 10 pages run");
    expect(again).not.toContain("left, for now");
    // Back as it was, the word holds; ask_again takes it back now.
    await twelve.callTool("set_length", { ids: [s3.id], pages: 4 });
    expect(await twelve.callTool("read_wall")).toContain("left, for now");
    expect(await twelve.callTool("ask_again", { kind: "empty" })).toContain('Nothing of kind "empty"');
    const back = await twelve.callTool("ask_again", { kind: "sag", ids: [b.id, c.id] });
    expect(back).toContain("Asked again");
    expect(back).toContain("the wall asks it now");
    expect(await twelve.callTool("read_wall")).toContain("  - [sag]");
  });

  it("leaves several at once with a reason, says what the wall still asks, and the reason reads back (round fourteen, entries 23, 25)", async () => {
    const before = await twelve.callTool("read_wall");
    expect(before).toContain("  - [sag]");
    const left = await twelve.callTool("leave_question", { questions: [{ kind: "sag", why: "the third act is the third act" }, { kind: "unpaid", why: "never" }] });
    expect(left).toContain('Left, for now: [sag] About 8 pages run between "B" and "C"');
    expect(left).toContain('— "the third act is the third act"');
    expect(left).toContain('The wall is not asking a question of kind "unpaid"');
    expect(left).toContain("The wall still asks nothing");
    const read = await twelve.callTool("read_wall");
    expect(read).toContain('(left 2026-');
    expect(read).toContain('"the third act is the third act"');
    expect(read).toContain("left by the writer, not clean: sag");
    expect(read).not.toMatch(/checked and clean: [^\n]*no run out of proportion/);
    expect(await twelve.callTool("ask_again", { kind: "sag" })).toContain("Asked again");
  });

  it("refuses a leave the edits have overtaken, naming the reading it was answering (round thirteen, entry 19)", async () => {
    const { notes } = await twelve.callToolData("list_board");
    const s2 = notes.find((note) => note.headline === "S2");
    const s3 = notes.find((note) => note.headline === "S3");
    expect(await twelve.callTool("read_wall")).toContain("[sag] About 8 pages");
    // The writer's edits land after the reading: the run no longer sags.
    await twelve.callTool("set_length", { ids: [s2.id, s3.id], pages: 1 });
    const refused = await twelve.callTool("leave_question", { kind: "sag" });
    expect(refused).toContain("Not left. When you last read the wall it asked [sag] About 8 pages run");
    expect(refused).toContain("1 change landed since (set_length)");
    expect(refused).toContain("the wall no longer asks it");
    expect(refused).toContain("make the writer's edits first, read_wall, then leave");
    expect(await twelve.callTool("read_wall")).not.toContain("[sag]");
    await twelve.callTool("set_length", { ids: [s2.id, s3.id], pages: 4 });
  });

  it("puts a moved scene into the act it lands in, numbers it under the lock, and page_count carries the lock (round fourteen, entries 38, 39, 40, 44)", async () => {
    const { notes } = await twelve.callToolData("list_board");
    const byName = (name) => notes.find((note) => note.headline === name);
    // A chain a → s1 → b → s2, and s1..s2 in an act.
    for (const [from, to] of [["A", "S1"], ["S1", "B"], ["B", "S2"], ["S2", "S3"], ["S3", "C"], ["C", "S4"], ["S4", "D"]]) {
      await twelve.callTool("create_arrow", { from: byName(from).id, to: byName(to).id });
    }
    const act = await twelve.callToolData("create_group", { noteIds: [byName("B").id, byName("S2").id, byName("S3").id], title: "Act two" });
    expect(await twelve.callTool("lock_numbers")).toContain("Locked 8 scene number(s)");
    const made = await twelve.callToolData("create_note", { headline: "Chips", change: "They eat chips." });
    const madeText = await twelve.callTool("list_board");
    expect(madeText).toContain("Chips");
    const moved = await twelve.callTool("move_scene", { id: made.id, after: byName("S2").id });
    expect(moved).toContain('It joined "Act two", the group it landed in');
    expect(moved).toContain("4. S2, 5. Chips, 6. S3");
    const state = await twelve.callToolData("list_board");
    expect(state.groups.find((group) => group.id === act.id).noteIds).toContain(made.id);
    expect(await twelve.callTool("read_pages")).toContain("locked no. 4A");
    await twelve.callTool("write_scene", { id: made.id, text: "They eat chips from the bag." });
    const pages = await twelve.callTool("page_count");
    expect(pages).toContain("scene numbers here are the locked numbers");
    expect(pages).toMatch(/- 4A\. Chips/);
    expect(pages).toMatch(/- 8\. D/);
    expect(pages).toContain("set their change line as action");
    expect(pages.indexOf("set their change line")).toBeLessThan(pages.indexOf("pages: "));
    const another = await twelve.callTool("create_note", { headline: "Later", change: "Later still." });
    expect(another).toMatch(/Numbered 8A \(the numbers are locked/);
    // Clean up for the structure test: the group and the chips and the extra card and the lock.
    await twelve.callTool("ungroup", { id: act.id });
    for (const id of [made.id, (await twelve.callToolData("list_board")).notes.find((note) => note.headline === "Later").id]) await twelve.callTool("delete_note", { id });
    await twelve.callTool("unlock_numbers");
    for (const arrow of (await twelve.callToolData("list_board")).arrows) await twelve.callTool("delete_arrow", { id: arrow.id });
  });

  it("sets a structure beside the wall's beats and lays nothing", async () => {
    const before = await twelve.callToolData("list_board");
    const compared = await twelve.callTool("compare_structure", {});
    expect(compared).toContain(`"Turns" beside this wall's 4 beats, of 60 pages`);
    expect(compared).toContain('Opening image (p. 1) — yours: "A" p. 1 · here');
    expect(compared).toContain('The inciting incident (p. 6) — yours: "B" p. 3 · 3 pp early');
    expect(compared).toContain("The midpoint (p. 30) — nothing yet: past p.");
    expect(compared).toContain("Nothing moved and nothing was made");
    const after = await twelve.callToolData("list_board");
    expect(after.notes.length).toBe(before.notes.length);
    expect(await twelve.callTool("compare_structure", { structure: "hero" })).toContain('No structure called "hero"');
    expect(await twelve.callTool("list_structures")).toContain("compare_structure sets one of these beside this wall's beats");
  });
});

describe("one cast for the project (R51)", () => {
  let castRoot;
  let one;

  beforeAll(async () => {
    castRoot = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-mcp-cast-"));
    one = new McpClient(castRoot);
    await one.start();
  }, 30000);

  afterAll(() => {
    one?.stop();
    if (castRoot) fs.rmSync(castRoot, { recursive: true, force: true });
  });

  it("is one roster across the boards: a second board has the pilot's people, the same name is one record, and a removal waits for every board", async () => {
    // The sample's Maya and Tom are lifted onto the project the first time it is read.
    const first = await one.callTool("list_board");
    expect(first).toContain("cast (the project's; every board of it casts from here):");
    const added = await one.callTool("add_character", { name: "Nessa Boyd" });
    expect(added).toContain("to the project's cast");
    expect(added).toContain("every board of the project casts from it");
    const pilot = await one.callToolData("list_board");
    const nessa = pilot.characters.find((person) => person.name === "Nessa Boyd");
    const maya = pilot.characters.find((person) => person.id === "maya");
    expect(nessa).toBeDefined();
    const opened = await one.callTool("new_board", { name: "Episode two" });
    expect(opened).toContain("the project's cast is already there to cast from");
    const two = await one.callToolData("list_board");
    expect(two.notes).toHaveLength(0);
    expect(two.characters.map((person) => person.name)).toEqual(pilot.characters.map((person) => person.name));
    // The same name on the second board is the one record, not a second Nessa.
    expect(await one.callTool("add_character", { name: "nessa boyd" })).toContain(`Already in the cast as "Nessa Boyd" (${nessa.id})`);
    // Maya is on the pilot's cards: not asked about here, and not removable from here.
    const read = await one.callTool("read_wall");
    expect(read).not.toContain("Maya is in the cast but on no card");
    expect(read).toContain("Nessa Boyd is in the cast but on no card");
    const refused = await one.callTool("remove_character", { id: maya.id });
    expect(refused).toContain('"Maya" stays: the cast is the project\'s');
    expect(refused).toContain('of "Board 1"');
    // A page written here is the page everywhere.
    await one.callTool("update_character", { name: "Nessa Boyd", notes: "Back after fourteen years." });
    await one.callTool("open_board", { board: "1" });
    const back = await one.callToolData("list_board");
    expect(back.characters.find((person) => person.id === nessa.id)?.notes).toBe("Back after fourteen years.");
    // Nobody has Nessa on a card: she can go, from either board.
    expect(await one.callTool("remove_character", { id: nessa.id })).toContain('Removed "Nessa Boyd" from the project\'s cast');
    await one.callTool("open_board", { board: "2" });
    expect((await one.callToolData("list_board")).characters.some((person) => person.id === nessa.id)).toBe(false);
  });
});
