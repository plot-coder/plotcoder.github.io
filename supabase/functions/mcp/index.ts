// PlotCoder's hosted MCP door, as a Supabase Edge Function (R48, the
// handover's call 3 on Robert's word, 2026-09-19): the same server the
// package ships, one writer per request, signed in from the request, no
// disk. The edge runtime is Deno, so this file imports the published
// package through npm: and answers with the SDK's fetch-based transport;
// nothing of the server is written twice.
//
//   POST /functions/v1/mcp
//   Authorization: Basic base64(email:password)      the writer's sign-in
//   X-PlotCoder-Project: a project name or id          optional
//
// For Claude Code, once:
//   claude mcp add plotcoder --transport http https://<ref>.supabase.co/functions/v1/mcp \
//     --header "Authorization: Basic <base64 of email:password>"
//
// A session (the to-do's B1): the door issues an Mcp-Session-Id on
// initialize and hands a returning one to the server, which keeps what the
// session remembers — whether it has read the wall, what advice it has said —
// in a row of the writer's own (public.agent_sessions, row-level security by
// user). The function holds no secret for it. The transport stays stateless:
// no process here outlives a request. The server reads the id from
// PLOTCODER_SESSION_ID from 0.1.45 on; pinned to an older release, the id is
// issued and ignored.
//
// The function's own key check is off (verify_jwt = false in config.toml):
// the writer's sign-in is the wall, as on every other door, and the server
// refuses a wrong password from every tool.

import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.30.0/server/webStandardStreamableHttp.js";
import { createPlotcoderServer } from "npm:plotcoder-board@0.1.52/scripts/plotcoder-mcp-server.mjs";

const ABOUT = `PlotCoder's hosted MCP door.

POST here with the writer's sign-in on the request:
  Authorization: Basic base64(email:password)
  X-PlotCoder-Project: a project name or id   (optional)

The on-ramp: https://plotcoder.com/llms.txt
`;

/** The writer's sign-in from the request, or null. */
function credentialsFrom(headers: Headers): { email: string; password: string } | null {
  const auth = headers.get("authorization") ?? "";
  if (/^basic\s+/i.test(auth)) {
    const decoded = atob(auth.replace(/^basic\s+/i, "").trim());
    const cut = decoded.indexOf(":");
    if (cut > 0) return { email: decoded.slice(0, cut), password: decoded.slice(cut + 1) };
  }
  const email = headers.get("x-plotcoder-email");
  const password = headers.get("x-plotcoder-password");
  if (email && password) return { email, password };
  return null;
}

/** Only an id this door could have issued is a session (as isSessionId in src/board/agentSession.js). */
const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Whether a body opens a session: MCP's initialize, alone or in a batch. */
function opensSession(body: unknown): boolean {
  return ([] as unknown[]).concat(body ?? []).some((message) => (message as { method?: string } | null)?.method === "initialize");
}

/** The environment one request's server runs with: hosted, no bridge, no disk, the writer's sign-in. */
function envFor(headers: Headers): Record<string, string> | null {
  const creds = credentialsFrom(headers);
  if (!creds) return null;
  const env: Record<string, string> = {
    PLOTCODER_HOSTED: "1",
    PLOTCODER_NO_BRIDGE: "1",
    PLOTCODER_ROOT: "/tmp/plotcoder-hosted",
    // Off, as on every door (the on-ramp says so; round twenty-two, entry 4).
    PLOTCODER_JSON: Deno.env.get("PLOTCODER_JSON") ?? "0",
    PLOTCODER_EMAIL: creds.email,
    PLOTCODER_PASSWORD: creds.password,
    PLOTCODER_PROJECT: headers.get("x-plotcoder-project") ?? "",
  };
  const session = headers.get("mcp-session-id") ?? "";
  if (SESSION_ID.test(session)) env.PLOTCODER_SESSION_ID = session;
  const url = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("VITE_SUPABASE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (url) env.VITE_SUPABASE_URL = url;
  if (key) env.VITE_SUPABASE_KEY = key;
  return env;
}

Deno.serve(async (request: Request) => {
  const { pathname } = new URL(request.url);
  if (request.method === "GET" && !pathname.endsWith("/mcp")) return new Response(ABOUT, { headers: { "content-type": "text/plain; charset=utf-8" } });
  if (request.method === "GET") return new Response(ABOUT, { headers: { "content-type": "text/plain; charset=utf-8" } });
  const env = envFor(request.headers);
  if (!env) {
    return new Response("Sign in on the request: Authorization: Basic base64(email:password), or X-PlotCoder-Email and X-PlotCoder-Password.", {
      status: 401,
      headers: { "content-type": "text/plain; charset=utf-8", "www-authenticate": 'Basic realm="PlotCoder"' },
    });
  }
  // One server per request: the SDK's fetch-based transport answers the POST
  // with JSON. An unreadable body goes through as one, and the transport
  // refuses it as a parse error.
  let body: unknown = null;
  if (request.method === "POST") {
    try {
      body = await request.json();
    } catch {
      body = null;
    }
  }
  const { server } = createPlotcoderServer(env);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    const response = await transport.handleRequest(request, { parsedBody: body });
    if (!opensSession(body)) return response;
    const headers = new Headers(response.headers);
    headers.set("mcp-session-id", crypto.randomUUID());
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } finally {
    // The request is answered; let the server go with it.
    void transport.close();
  }
});
