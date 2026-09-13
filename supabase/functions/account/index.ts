// PlotCoder: the name on the door (R39). Deployed to the live project through
// the Supabase connector as `account` (verify_jwt off; it checks the caller's
// token itself where it matters); kept here so the function lives in git.
//
// A writer signs in with a name and a password with no rules. Underneath it is
// Supabase's own email-and-password auth with a synthetic address per name and
// the password hashed on the device. Claiming a name and renaming one need the
// service role (to create a confirmed user, and to move the address), so they
// live here; signing in and changing a password happen in the browser.

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

const NAME = /^[a-z0-9][a-z0-9._-]{0,31}$/;

function cleanName(value: unknown): string | null {
  const name = String(value ?? "").trim().toLowerCase();
  return NAME.test(name) ? name : null;
}

function emailFor(name: string): string {
  return `${name}@names.plotcoder.com`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  let body: { action?: string; name?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }

  const name = cleanName(body.name);
  if (!name) {
    return json({ error: "A name is letters and numbers, with dots, dashes or underscores, up to 32 long." }, 400);
  }

  if (body.action === "claim") {
    const password = String(body.password ?? "");
    if (!password) return json({ error: "A password is needed, any password." }, 400);
    const taken = await admin.rpc("name_taken", { candidate: name });
    if (taken.error) return json({ error: taken.error.message }, 500);
    if (taken.data) return json({ error: "taken" }, 409);
    const created = await admin.auth.admin.createUser({
      email: emailFor(name),
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (created.error || !created.data.user) {
      return json({ error: created.error?.message ?? "could not create" }, 400);
    }
    const inserted = await admin.from("names").insert({ user_id: created.data.user.id, name });
    if (inserted.error) {
      await admin.auth.admin.deleteUser(created.data.user.id);
      return json({ error: "taken" }, 409);
    }
    return json({ ok: true, name, email: emailFor(name) });
  }

  if (body.action === "rename") {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const who = await admin.auth.getUser(token);
    if (who.error || !who.data.user) return json({ error: "sign in first" }, 401);
    const taken = await admin.rpc("name_taken", { candidate: name });
    if (taken.data) return json({ error: "taken" }, 409);
    const moved = await admin.from("names").update({ name }).eq("user_id", who.data.user.id);
    if (moved.error) return json({ error: "taken" }, 409);
    const updated = await admin.auth.admin.updateUserById(who.data.user.id, {
      email: emailFor(name),
      email_confirm: true,
      user_metadata: { name },
    });
    if (updated.error) return json({ error: updated.error.message }, 400);
    return json({ ok: true, name, email: emailFor(name) });
  }

  return json({ error: "unknown action" }, 400);
});
