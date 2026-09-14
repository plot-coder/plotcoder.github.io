// The hosted door (R48): the same server over HTTP, one per request, the
// writer's sign-in on the request. Nothing here reaches the network: the
// account service address points at a closed port, so the door refuses in
// words, which is what the test checks — the transport, the auth, and the
// refusal, not Supabase.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHostedDoor, credentialsFrom, envFor } from "./plotcoder-http.mjs";

let door;
let base;

beforeAll(async () => {
  door = createHostedDoor({ VITE_SUPABASE_URL: "http://127.0.0.1:1" });
  await new Promise((resolve) => door.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${door.address().port}`;
});

afterAll(() => new Promise((resolve) => door.close(resolve)));

const auth = `Basic ${Buffer.from("test@test.com:wrong").toString("base64")}`;

async function rpc(method, params, id = 1) {
  const response = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: auth },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  return { status: response.status, body: await response.json() };
}

describe("the hosted door", () => {
  it("reads the sign-in from the request, two ways", () => {
    expect(credentialsFrom({ authorization: auth })).toEqual({ email: "test@test.com", password: "wrong" });
    expect(credentialsFrom({ "x-plotcoder-email": "a@b.c", "x-plotcoder-password": "p:q" })).toEqual({ email: "a@b.c", password: "p:q" });
    expect(credentialsFrom({})).toBeNull();
    const env = envFor({ authorization: auth, "x-plotcoder-project": "Low Season" }, {});
    expect(env).toMatchObject({ PLOTCODER_HOSTED: "1", PLOTCODER_NO_BRIDGE: "1", PLOTCODER_EMAIL: "test@test.com", PLOTCODER_PROJECT: "Low Season" });
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
