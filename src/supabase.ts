// The Supabase client (R4, D27).
//
// The URL and the publishable key are meant to ship in the built app: they
// name the project and let a browser talk to it, and row-level security on the
// tables decides what any given sign-in may read or write. Nothing secret lives
// here or in the deploy. A `.env.local` can point at another project.
//
// The client is made on first use, never at import, so the kernel tests and
// the offline end-to-end suite never touch it.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL: string =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://pibdszubmfnooimnuawf.supabase.co";
export const SUPABASE_KEY: string =
  (import.meta.env.VITE_SUPABASE_KEY as string | undefined) ??
  "sb_publishable_SNvN9SD26aUjq2xvDulwlQ_BGBs0Oag";

// Outside the `plotcoder.` prefix on purpose: Save project must not carry a
// session into a file, and Open project must not sign anyone out (R12).
export const AUTH_STORAGE_KEY = "sb-plotcoder-auth";

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { storageKey: AUTH_STORAGE_KEY, persistSession: true, detectSessionInUrl: true },
    });
  }
  return client;
}
