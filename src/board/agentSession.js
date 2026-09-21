// What a door remembers of one agent's session (round twenty-two, entries 25,
// 26, 37, 52, 95; the to-do's B1).
//
// The stdio door is one process per session and remembers in its own
// variables. The hosted door is one server per request, so what it remembers
// rides a row on the account, keyed by the MCP session id the door issues on
// initialize. The row is the writer's own — row-level security by user, the
// same wall as every other table — so the function holds no secret.
//
// Pure but for the client it is handed: DOM-free, tested with a faked one.

export const SESSION_TABLE = "agent_sessions";
/** The session's undo trail through the hosted door (round twenty-three, entries 70, 71): the last few walls as they were, the writer's own rows. */
export const UNDO_TABLE = "agent_undo";
/** How many steps a session can take back through the hosted door. A wall is tens of kilobytes; ten is a working afternoon's mistakes. */
export const UNDO_KEPT = 10;
/** A session not touched for a day is gone: the next one through the door sweeps it. */
export const SESSION_LIFE_MS = 24 * 60 * 60 * 1000;
/** Enough to say "n changes landed since"; a build of hundreds of writes keeps the newest. */
const SINCE_READ_KEPT = 200;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Only an id this door could have issued is looked up: anything else is no session. */
export function isSessionId(text) {
  return typeof text === "string" && UUID.test(text);
}

/** A session that has read nothing and been told nothing. */
export function emptyMemory() {
  return { readOnce: false, said: [], lastReading: null, sinceRead: [] };
}

const strings = (list) => (Array.isArray(list) ? list.filter((item) => typeof item === "string") : []);

/** Whatever the row held, in the shape the server reads: a missing or broken part is the part that claims nothing. */
export function normalizeMemory(raw) {
  const memory = emptyMemory();
  if (!raw || typeof raw !== "object") return memory;
  memory.readOnce = raw.readOnce === true;
  memory.said = [...new Set(strings(raw.said))];
  memory.sinceRead = strings(raw.sinceRead).slice(-SINCE_READ_KEPT);
  if (raw.lastReading && Array.isArray(raw.lastReading.findings)) {
    memory.lastReading = {
      findings: raw.lastReading.findings
        .filter((finding) => finding && typeof finding.kind === "string" && typeof finding.text === "string")
        .map((finding) => ({ kind: finding.kind, text: finding.text, ids: strings(finding.ids) })),
    };
  }
  return memory;
}

/**
 * The account's store, as the signed-in writer. load answers null when the
 * row cannot be read at all — no table yet, no network — and the door then
 * behaves as one with no session; an id with no row is a new session, so a
 * session that has expired never breaks a writer mid-conversation.
 */
export function accountSessionStore(client, userId, now = () => Date.now()) {
  return {
    async load(id) {
      const { data, error } = await client.from(SESSION_TABLE).select("memory").eq("id", id).maybeSingle();
      if (error) return null;
      return data ? { memory: normalizeMemory(data.memory), fresh: false } : { memory: emptyMemory(), fresh: true };
    },
    async save(id, memory, fresh) {
      const stamp = new Date(now()).toISOString();
      const { error } = await client.from(SESSION_TABLE).upsert({ id, user_id: userId, memory: normalizeMemory(memory), updated_at: stamp });
      if (error) return false;
      // A new session sweeps the writer's old ones: nothing else ever would. Their undo trails go with them.
      if (fresh) {
        const before = new Date(now() - SESSION_LIFE_MS).toISOString();
        await client.from(SESSION_TABLE).delete().eq("user_id", userId).lt("updated_at", before);
        await client.from(UNDO_TABLE).delete().eq("user_id", userId).lt("created_at", before);
      }
      return true;
    },
    /** Keep one step: the wall as it was before a change, what the change was, and a hash of the wall as the change left it. Oldest beyond UNDO_KEPT go. */
    async pushUndo(id, step) {
      const { error } = await client.from(UNDO_TABLE).insert({ session_id: id, user_id: userId, project_id: step.projectId ?? "", board_id: step.boardId ?? "", what: step.what, before: step.before, after_hash: step.afterHash });
      if (error) return false;
      const kept = await client.from(UNDO_TABLE).select("seq").eq("session_id", id).order("seq", { ascending: false }).range(UNDO_KEPT, UNDO_KEPT + 50);
      const old = (kept.data ?? []).map((row) => row.seq);
      if (old.length) await client.from(UNDO_TABLE).delete().eq("session_id", id).in("seq", old);
      return true;
    },
    /** The newest step and how many there are, or null when there is none (or the trail cannot be read). */
    async peekUndo(id) {
      const { data, error, count } = await client.from(UNDO_TABLE).select("seq, project_id, board_id, what, before, after_hash", { count: "exact" }).eq("session_id", id).order("seq", { ascending: false }).limit(1);
      if (error || !data?.length) return null;
      const row = data[0];
      return { seq: row.seq, projectId: row.project_id, boardId: row.board_id, what: row.what, before: row.before, afterHash: row.after_hash, steps: count ?? 1 };
    },
    /** Take a step off the trail once it has been undone. */
    async popUndo(id, seq) {
      const { error } = await client.from(UNDO_TABLE).delete().eq("session_id", id).eq("seq", seq);
      return !error;
    },
  };
}
