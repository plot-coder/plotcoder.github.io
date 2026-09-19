# Supabase

PlotCoder's own project: `plotcoder`, ref `kmpahjsggbleygsnuwug`, us-east-1 (D27).

- `migrations/` — the schema as applied to the live project through the Supabase connector. Apply a new one the same way, or with `supabase db push` against the project, and keep the file here.
- `functions/account/` — the edge function that claims and renames names (R39). Deployed through the connector; redeploy with `supabase functions deploy account --project-ref kmpahjsggbleygsnuwug`.

The URL and the publishable key ship in `src/supabase.ts`. Nothing secret lives in the repo; the service role is only in the function's environment on Supabase.

## Test accounts (R44)

`writers.test` marks a throwaway account for a blind run. It is the only thing
`scripts/wipe-test-account.mjs` will touch, and nothing in the client reads it.

```bash
node scripts/wipe-test-account.mjs you+round4@example.com --mark
node scripts/wipe-test-account.mjs you+round4@example.com            # the plan, nothing changed
node scripts/wipe-test-account.mjs you+round4@example.com --empty --yes
node scripts/wipe-test-account.mjs you+round4@example.com --delete --yes
```

Needs `SUPABASE_SERVICE_ROLE_KEY` in the shell. Every table cascades off
`auth.users`, so removing the account removes its rows; storage cascades
nothing, which is why the script removes the bucket's files first, while the
membership its policies read still exists.

## The writers' questions (R64)

`questions` holds what a writer asked from the app's Help sheet that the guide
did not answer. A writer inserts and reads their own; nobody else reads. The
maintainer's tools, `list_questions` and `answer_question`, take
`SUPABASE_SERVICE_ROLE_KEY` from the server's environment, as the wipe script
does. `migrations/20260919170000_questions.sql` was applied 2026-09-19 through the Management API's query endpoint with a personal access token, the connector being in no session that day; a later migration can go the same way, or through the connector as before.
- `functions/mcp/` — the hosted MCP door (R48; the handover's call 3, Robert's word 2026-09-19: host it on Supabase). The published package through `npm:`, the SDK's fetch-based transport, one writer per request signed in from the request's Basic header, no disk. Deployed with `supabase functions deploy mcp --no-verify-jwt --use-api --project-ref kmpahjsggbleygsnuwug` (`--use-api` bundles server-side, so Docker is not needed). The address: `https://kmpahjsggbleygsnuwug.supabase.co/functions/v1/mcp`. Verified 2026-09-19: initialize answers, `list_projects` reads the signed-in account, a wrong password is refused by the tool. It carries the package version pinned in `index.ts`; bump it with each release the door should carry.
