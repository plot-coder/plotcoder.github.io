// The hosted door (R48): the same server over HTTP, one per request, the
// writer's sign-in on the request. Nothing here reaches the network: the
// account service address points at a closed port, so the door refuses in
// words, which is what the test checks — the transport, the auth, and the
// refusal, not Supabase.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHostedDoor, credentialsFrom, envFor, opensSession } from "./plotcoder-http.mjs";
import { createPlotcoderServer, failedCallReply } from "./plotcoder-mcp-server.mjs";
import { emptyMemory } from "../src/board/agentSession.js";

let door;
let base;

beforeAll(async () => {
  door = createHostedDoor({ VITE_SUPABASE_URL: "http://127.0.0.1:1" });
  await new Promise((resolve) => door.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${door.address().port}`;
});

afterAll(() => new Promise((resolve) => door.close(resolve)));

const auth = `Basic ${Buffer.from("test@test.com:wrong").toString("base64")}`;

async function rpc(method, params, id = 1, headers = {}) {
  const response = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: auth, ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  return { status: response.status, body: await response.json(), session: response.headers.get("mcp-session-id") };
}

describe("the hosted door", () => {
  it("reads the sign-in from the request, two ways", () => {
    expect(credentialsFrom({ authorization: auth })).toEqual({ email: "test@test.com", password: "wrong" });
    expect(credentialsFrom({ "x-plotcoder-email": "a@b.c", "x-plotcoder-password": "p:q" })).toEqual({ email: "a@b.c", password: "p:q" });
    expect(credentialsFrom({})).toBeNull();
    const env = envFor({ authorization: auth, "x-plotcoder-project": "Low Season" }, {});
    expect(env).toMatchObject({ PLOTCODER_HOSTED: "1", PLOTCODER_NO_BRIDGE: "1", PLOTCODER_EMAIL: "test@test.com", PLOTCODER_PROJECT: "Low Season" });
    // The JSON tail is off at the hosted door as at every other, unless the host asks for it (round twenty-two, entry 4).
    expect(env.PLOTCODER_JSON).toBe("0");
    expect(envFor({ authorization: auth }, { PLOTCODER_JSON: "1" }).PLOTCODER_JSON).toBe("1");
  });

  it("says what it is at the root, and refuses a request with no sign-in", async () => {
    const about = await fetch(`${base}/`);
    expect(about.status).toBe(200);
    expect(await about.text()).toContain("POST /mcp");
    const bare = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    expect(bare.status).toBe(401);
    expect(await bare.text()).toContain("Authorization: Basic");
  });

  it("serves the same tools, and the account door's refusal, in words", async () => {
    const init = await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "0" } });
    expect(init.status).toBe(200);
    expect(init.body.result.serverInfo.name).toBe("plotcoder-board");
    // The day's rules ride the handshake, so a connector-holder has them with nothing to fetch (round twenty-three, entries 1, 2, 7).
    expect(init.body.result.instructions).toContain("list_words, list_workflows, list_projects");
    expect(init.body.result.instructions).toContain("https://plotcoder.com/day-one.md");
    // The door names the release it runs, not a constant.
    expect(init.body.result.serverInfo.version).toBe(JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
    const listed = await rpc("tools/list", {}, 2);
    const names = listed.body.result.tools.map((tool) => tool.name);
    expect(names).toContain("read_wall");
    expect(names).toContain("empty_account");
    expect(names.length).toBeGreaterThan(70);
    const words = await rpc("tools/call", { name: "list_words", arguments: {} }, 3);
    expect(words.body.result.content[0].text).toContain("PlotCoder's words");
    const board = await rpc("tools/call", { name: "list_board", arguments: {} }, 4);
    expect(board.body.result.content[0].text).toContain("The account door refused test@test.com");
    const saved = await rpc("tools/call", { name: "export_project", arguments: { path: "/tmp/x.json" } }, 5);
    expect(saved.body.result.content[0].text).toMatch(/no disk|refused/);
  });
});

// A session for the hosted door (the to-do's B1). The door's half is the id:
// issued on initialize, handed to the server when it comes back. The server's
// half is the memory, which on the real door rides the writer's own row on the
// account; here a store in memory stands in, and each "request" is a new
// server, as it is through the door.
describe("a session through the hosted door", () => {
  const SESSION = "3f0a9c1e-7b2d-4e5f-8a6b-0c1d2e3f4a5b";

  it("issues a session id on initialize and on nothing else, and hands a returning one to the server", async () => {
    const init = await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "0" } });
    expect(init.session).toMatch(/^[0-9a-f-]{36}$/);
    const again = await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "0" } });
    expect(again.session).not.toBe(init.session);
    const listed = await rpc("tools/list", {}, 2, { "mcp-session-id": init.session });
    expect(listed.status).toBe(200);
    expect(listed.session).toBeNull();
    expect(opensSession([{ method: "notifications/initialized" }])).toBe(false);
    expect(opensSession(undefined)).toBe(false);
    expect(envFor({ authorization: auth, "mcp-session-id": SESSION }, {}).PLOTCODER_SESSION_ID).toBe(SESSION);
    // Only an id this door could have issued is a session.
    expect(envFor({ authorization: auth, "mcp-session-id": "mine" }, {})).not.toHaveProperty("PLOTCODER_SESSION_ID");
    expect(envFor({ authorization: auth }, {})).not.toHaveProperty("PLOTCODER_SESSION_ID");
  });

  it("is refused in the transport's own words when the body is not JSON", async () => {
    const response = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: auth }, body: "{not json" });
    expect(response.status).toBe(400);
    expect(response.headers.get("mcp-session-id")).toBeNull();
  });

  describe("what the server remembers from one request to the next", () => {
    let root;
    const rows = new Map();
    const saves = [];
    const trails = new Map();
    let seq = 0;
    const store = {
      pushUndo: async (id, step) => {
        trails.set(id, [...(trails.get(id) ?? []), { ...JSON.parse(JSON.stringify(step)), seq: (seq += 1) }].slice(-10));
        return true;
      },
      peekUndo: async (id) => {
        const steps = trails.get(id) ?? [];
        return steps.length ? { ...steps[steps.length - 1], steps: steps.length } : null;
      },
      popUndo: async (id, which) => {
        trails.set(id, (trails.get(id) ?? []).filter((step) => step.seq !== which));
        return true;
      },
      load: async (id) => (rows.has(id) ? { memory: rows.get(id), fresh: false } : { memory: emptyMemory(), fresh: true }),
      save: async (id, memory, fresh) => {
        saves.push({ id, fresh });
        rows.set(id, JSON.parse(JSON.stringify(memory)));
        return true;
      },
    };

    /** One request: a server of its own, one tool call, gone. */
    async function request(name, args = {}, { session = SESSION, sessionStore = store } = {}) {
      const env = { PLOTCODER_HOSTED: "1", PLOTCODER_NO_BRIDGE: "1", PLOTCODER_ROOT: root, PLOTCODER_JSON: "0", ...(session ? { PLOTCODER_SESSION_ID: session } : {}) };
      const { server } = createPlotcoderServer(env, { sessionStore });
      const [near, far] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: "test", version: "0" });
      await Promise.all([server.connect(far), client.connect(near)]);
      try {
        const reply = await client.callTool({ name, arguments: args });
        return reply.content[0].text;
      } finally {
        await client.close();
        await server.close();
      }
    }

    beforeAll(() => {
      root = fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-session-"));
    });
    afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

    it("counts the wall's questions until the session's first reading, then quotes them, and says its advice once", async () => {
      const first = await request("create_note", { headline: "The depot", change: "The keys are on the hook.", x: 2000, y: 2000 });
      expect(first).toContain("the wall's questions have changed since your last read_wall");
      expect(first).toContain("pass color to choose");
      expect(saves[0]).toEqual({ id: SESSION, fresh: true });

      const second = await request("create_note", { headline: "The last run", change: "She takes the keys.", x: 2600, y: 2000 });
      expect(second).not.toContain("pass color to choose");

      expect(await request("read_wall")).toContain("questions the wall raises");
      expect(rows.get(SESSION).readOnce).toBe(true);
      expect(saves.at(-1)).toEqual({ id: SESSION, fresh: false });

      const third = await request("create_note", { headline: "The turn", change: "He gets off.", rank: "beat", x: 3200, y: 2000 });
      expect(third).not.toContain("since your last read_wall");
      expect(third).toMatch(/the wall now asks|the wall's questions unchanged/);
    });

    it("answers a leave that misses from the reading the session last had", async () => {
      const reading = rows.get(SESSION).lastReading.findings;
      expect(reading.length).toBeGreaterThan(0);
      expect(rows.get(SESSION).sinceRead.length).toBeGreaterThan(0);
      const gone = { kind: "unwritten", text: "A question the wall asked then.", ids: ["not-a-card"] };
      rows.set(SESSION, { ...rows.get(SESSION), lastReading: { findings: [gone] } });
      const reply = await request("leave_question", { kind: "unwritten", ids: ["not-a-card"] });
      expect(reply).toContain("When you last read the wall it asked [unwritten] A question the wall asked then.");
      expect(reply).toContain("landed since");
    });

    it("keeps two sessions apart, and with no session says only what is true without a memory", async () => {
      const other = await request("create_note", { headline: "Another agent's card", change: "Something is different.", x: 3800, y: 2000 }, { session: "9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e" });
      expect(other).toContain("pass color to choose");
      const bare = await request("create_note", { headline: "No session", change: "Something is different.", x: 4400, y: 2000 }, { session: null });
      expect(bare).not.toContain("pass color to choose");
      expect(bare).not.toContain("since your last read_wall");
      // A store that cannot be read is no session, not a broken door.
      const broken = await request("create_note", { headline: "No table yet", change: "Something is different.", x: 5000, y: 2000 }, { sessionStore: { load: async () => null, save: async () => false } });
      expect(broken).not.toContain("pass color to choose");
      expect(broken).toContain("Created");
    });

    it("counts again when another wall is in hand: the first reading is of this wall, not of the one the session read before (round twenty-three, entry 4)", async () => {
      const session = "5a6b7c8d-1e2f-4a3b-9c4d-5e6f7a8b9c0d";
      // The on-ramp's reads, of whatever wall was standing.
      await request("read_wall", {}, { session });
      expect(rows.get(session).readOnce).toBe(true);
      // Then a wall of the agent's own.
      await request("new_board", { name: "The Tuner" }, { session });
      expect(rows.get(session).readOnce).toBe(false);
      expect(rows.get(session).lastReading).toBeNull();
      const first = await request("create_note", { headline: "The chapel upright", change: "She gets it wrong.", rank: "beat" }, { session });
      expect(first).toContain("the wall's questions have changed since your last read_wall");
      await request("read_wall", {}, { session });
      const next = await request("create_note", { headline: "The school hall", change: "He names a note." }, { session });
      expect(next).not.toContain("since your last read_wall");
    });

    it("never promises its own undo in a write's reply: the writer's ⌘Z is what is true here (round twenty-three, entry 71)", async () => {
      const made = await request("create_note", { headline: "To be deleted", change: "Something.", x: 6000, y: 2000 });
      const id = made.match(/Created card ([0-9a-f-]{36})/)?.[1];
      const gone = await request("delete_note", { id });
      expect(gone).toContain("Deleted");
      expect(gone).not.toMatch(/\bundo brings\b/);
      // The description is where the promise was read: through the door it says the writer's ⌘Z.
      const listed = await rpc("tools/list", {}, 9);
      const described = listed.body.result.tools.find((tool) => tool.name === "delete_note").description;
      expect(described).not.toMatch(/\bundo brings\b/);
      expect(described).toContain("⌘Z on the wall brings all of it back");
      // undo's own description says first and plainly that there is none here, and that it is a stack (entries 70, 71).
      const undo = listed.body.result.tools.find((tool) => tool.name === "undo").description;
      expect(undo.startsWith("NOT THROUGH THIS DOOR")).toBe(true);
      expect(undo).toContain("It is a stack, newest first");
    });

    it("takes back this session's own change from one request to the next, says first what it would take, and never another session's (the working list's X2)", async () => {
      const session = "7c8d9e0f-2a3b-4c4d-8e5f-6a7b8c9d0e1f";
      const made = await request("create_note", { headline: "A scene to take back", change: "Something.", x: 7000, y: 2000 }, { session });
      const id = made.match(/Created card ([0-9a-f-]{36})/)?.[1];
      const preview = await request("undo", { preview: true }, { session });
      expect(preview).toContain('undo would take back: create_note "A scene to take back"');
      expect(preview).toContain("nothing was taken back now");
      // Another session has no such step, and takes nothing of this one's.
      expect(await request("undo", {}, { session: "8d9e0f1a-3b4c-4d5e-9f6a-7b8c9d0e1f2a" })).toContain("Nothing of this session's to undo");
      const undone = await request("undo", {}, { session });
      expect(undone).toContain('Undid create_note "A scene to take back"');
      expect(await request("delete_note", { id }, { session })).toContain("No card");
      // The delete was refused, so the trail is empty again.
      expect(await request("undo", {}, { session })).toContain("Nothing of this session's to undo");
    });

    it("refuses to trample a wall that changed since, and says so in the preview", async () => {
      const session = "9e0f1a2b-4c5d-4e6f-8a7b-8c9d0e1f2a3b";
      await request("create_note", { headline: "Mine", change: "Something.", x: 7600, y: 2000 }, { session });
      // Someone else changes the wall: another session, here.
      await request("create_note", { headline: "Theirs", change: "Something.", x: 8200, y: 2000 }, { session: "0f1a2b3c-5d6e-4f7a-9b8c-9d0e1f2a3b4c" });
      expect(await request("undo", { preview: true }, { session })).toContain("the board has changed since");
      expect(await request("undo", {}, { session })).toContain("Not undone: the board has changed since");
    });

    it("says undo keeps no trail through this door when the client sent no session, rather than that nothing was changed", async () => {
      const reply = await request("undo", {}, { session: null });
      expect(reply).toContain("keeps no trail");
      expect(reply).not.toContain("Nothing of mine to undo");
    });
  });
});

describe("a call that fails before it answers (pass 1a, entry 8)", () => {
  it("says what failed, what a network failure means, and what to do, in words", () => {
    const text = failedCallReply("list_projects", new TypeError("fetch failed"));
    expect(text).toMatch(/^list_projects failed before it answered: fetch failed\./);
    expect(text).toContain("the account not answering for a moment");
    expect(text).toContain("call it again");
    expect(text).toContain("list_board shows what landed");
  });

  it("tells any other failure apart from a network one", () => {
    const text = failedCallReply("write_scene", new Error("boom"));
    expect(text).toContain("boom");
    expect(text).not.toContain("not answering");
    expect(text).toContain("tell the writer what it said");
  });
});
