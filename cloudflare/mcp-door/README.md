# The hosted door's name

`https://mcp.plotcoder.com` is the hosted MCP door (R48). The door itself is
the Supabase Edge Function in `supabase/functions/mcp`; this Worker is the
name in front of it, on Cloudflare because plotcoder.com's DNS is there. It
forwards each request as it came — the writer's Basic header included — and
streams the reply back. Nothing is read, kept or logged.

- `worker.mjs` — the forward. A browser's plain GET gets a line saying what
  the door is; everything else goes to the function.
- `wrangler.jsonc` — the Worker's name and its custom domain. Cloudflare
  writes the DNS record and the certificate on deploy.

Deploy, from this folder, signed in once with `npx -y wrangler@latest login`
(wrangler wants Node 22; on a machine whose default Node is older, put a
newer one on the path, and if npx's cached wrangler was built for another
architecture, install wrangler fresh in a scratch folder with that Node):

    npx -y wrangler@latest deploy

Check it answers:

    curl -s https://mcp.plotcoder.com
    curl -s -X POST https://mcp.plotcoder.com -H "Authorization: Basic $(printf 'email:password' | base64)" \
      -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
      -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'

The function's address is pinned in `worker.mjs`; it only changes if the
Supabase project does. The package version the door carries is pinned in
the function, not here.
