// PlotCoder: the door (R39, revised to email). Deployed through the connector
// as `account`; kept here so the function lives in git.
//
// A writer signs in with an email and a password with no rules. Underneath it
// is Supabase's own email-and-password auth with the password hashed on the
// device. Claiming an address and changing it need the service role (to
// create a confirmed user, and to move the address), so they live here;
// signing in, changing a password and recovery happen in the browser.

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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmail(value: unknown): string | null {
  const email = String(value ?? "").trim().toLowerCase();
  return EMAIL.test(email) && email.length <= 254 ? email : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  let body: { action?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }

  const email = cleanEmail(body.email);
  if (!email) return json({ error: "That does not look like an email address." }, 400);

  if (body.action === "claim") {
    const password = String(body.password ?? "");
    if (!password) return json({ error: "A password is needed, any password." }, 400);
    const taken = await admin.rpc("email_taken", { candidate: email });
    if (taken.error) return json({ error: taken.error.message }, 500);
    if (taken.data) return json({ error: "taken" }, 409);
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error || !created.data.user) {
      return json({ error: created.error?.message ?? "could not create" }, 400);
    }
    const inserted = await admin.from("writers").insert({ user_id: created.data.user.id, email });
    if (inserted.error) {
      await admin.auth.admin.deleteUser(created.data.user.id);
      return json({ error: "taken" }, 409);
    }
    return json({ ok: true, email });
  }

  if (body.action === "change_email") {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const who = await admin.auth.getUser(token);
    if (who.error || !who.data.user) return json({ error: "sign in first" }, 401);
    const taken = await admin.rpc("email_taken", { candidate: email });
    if (taken.data) return json({ error: "taken" }, 409);
    const moved = await admin.from("writers").update({ email }).eq("user_id", who.data.user.id);
    if (moved.error) return json({ error: "taken" }, 409);
    const updated = await admin.auth.admin.updateUserById(who.data.user.id, { email, email_confirm: true });
    if (updated.error) return json({ error: updated.error.message }, 400);
    return json({ ok: true, email });
  }

  if (body.action === "delete_account") {
    // The writer takes their own account away (R45): only the caller, only
    // the address they name, and the files of the projects they own go first,
    // since storage cascades nothing. The rows cascade off auth.users.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const who = await admin.auth.getUser(token);
    if (who.error || !who.data.user) return json({ error: "sign in first" }, 401);
    if ((who.data.user.email ?? "").toLowerCase() !== email) return json({ error: "that is not your address" }, 403);
    const owned = await admin.from("projects").select("id").eq("owner", who.data.user.id);
    const ids = (owned.data ?? []).map((row) => row.id);
    if (ids.length) {
      const files = await admin.from("assets").select("path").in("project_id", ids);
      const paths = (files.data ?? []).map((row) => row.path);
      if (paths.length) {
        const removed = await admin.storage.from("projects").remove(paths);
        if (removed.error) return json({ error: `could not remove the files: ${removed.error.message}` }, 500);
      }
    }
    const gone = await admin.auth.admin.deleteUser(who.data.user.id);
    if (gone.error) return json({ error: gone.error.message }, 400);
    return json({ ok: true, email });
  }

  return json({ error: "unknown action" }, 400);
});
