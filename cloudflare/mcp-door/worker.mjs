// The hosted door's name (R48): mcp.plotcoder.com in front of the Supabase
// Edge Function in supabase/functions/mcp. A Cloudflare Worker that forwards
// every request as it came — method, headers, body — so the writer's Basic
// header reaches the function untouched and the reply streams back. Nothing
// is read, kept or logged here; the Worker is a name, not a second door.

const ORIGIN = "https://kmpahjsggbleygsnuwug.supabase.co/functions/v1/mcp";

const HELLO = `PlotCoder's hosted MCP door. An MCP client connects here over HTTP with the writer's sign-in on the request:

  claude mcp add plotcoder --transport http https://mcp.plotcoder.com --header "Authorization: Basic <base64 of email:password>"

or, in the Claude desktop app, Settings > Connectors > add a custom connector with this address and that header. The on-ramp is https://plotcoder.com/llms.txt.
`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/" && url.pathname !== "/mcp") {
      return new Response("Not found. The door is at /.\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    // A person's browser, not a client: say what this is instead of forwarding.
    if (request.method === "GET" && !request.headers.has("authorization")) {
      return new Response(HELLO, { headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    const headers = new Headers(request.headers);
    headers.delete("host");
    return fetch(ORIGIN, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });
  },
};
