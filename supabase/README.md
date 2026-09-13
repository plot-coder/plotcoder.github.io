# Supabase

PlotCoder's own project: `plotcoder`, ref `kmpahjsggbleygsnuwug`, us-east-1 (D27).

- `migrations/` — the schema as applied to the live project through the Supabase connector. Apply a new one the same way, or with `supabase db push` against the project, and keep the file here.
- `functions/account/` — the edge function that claims and renames names (R39). Deployed through the connector; redeploy with `supabase functions deploy account --project-ref kmpahjsggbleygsnuwug`.

The URL and the publishable key ship in `src/supabase.ts`. Nothing secret lives in the repo; the service role is only in the function's environment on Supabase.
