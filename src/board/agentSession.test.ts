import { describe, expect, it } from "vitest";
import { SESSION_LIFE_MS, SESSION_TABLE, UNDO_KEPT, accountSessionStore, emptyMemory, isSessionId, normalizeMemory } from "./agentSession";

/** A client that answers from a map of rows and keeps what it was asked. */
function fakeClient(rows: Record<string, unknown>, fail = false) {
  const asked: Array<Record<string, unknown>> = [];
  const client = {
    from(table: string) {
      const call: Record<string, unknown> = { table };
      asked.push(call);
      const chain = {
        select() { call.op = "select"; return chain; },
        upsert(row: { id: string; memory: unknown }) {
          call.op = "upsert";
          call.row = row;
          if (!fail) rows[row.id] = row.memory;
          return Promise.resolve({ error: fail ? { message: "no such table" } : null });
        },
        delete() { call.op = "delete"; return chain; },
        eq(column: string, value: unknown) { call[column] = value; return chain; },
        lt(column: string, value: unknown) { call[`${column} <`] = value; return Promise.resolve({ error: null }); },
        maybeSingle() {
          if (fail) return Promise.resolve({ data: null, error: { message: "no such table" } });
          const id = call.id as string;
          return Promise.resolve({ data: id in rows ? { memory: rows[id] } : null, error: null });
        },
      };
      return chain;
    },
  };
  return { client, asked };
}

const ID = "3f0a9c1e-7b2d-4e5f-8a6b-0c1d2e3f4a5b";

describe("what a door remembers of one agent's session (the to-do's B1)", () => {
  it("looks up only an id the door could have issued", () => {
    expect(isSessionId(ID)).toBe(true);
    expect(isSessionId("1")).toBe(false);
    expect(isSessionId(`${ID}; drop table`)).toBe(false);
    expect(isSessionId(undefined)).toBe(false);
  });

  it("repairs a broken row to the memory that claims nothing", () => {
    expect(normalizeMemory(null)).toEqual(emptyMemory());
    expect(normalizeMemory({ readOnce: "yes", said: ["paper", 4, "paper"], sinceRead: "x", lastReading: { findings: [{ kind: "empty", text: "Nothing runs.", ids: ["a", 2], more: 1 }, { kind: 3 }] } })).toEqual({
      readOnce: false,
      said: ["paper"],
      sinceRead: [],
      lastReading: { findings: [{ kind: "empty", text: "Nothing runs.", ids: ["a"] }] },
    });
    expect(normalizeMemory({ sinceRead: Array.from({ length: 500 }, (_, index) => `change ${index}`) }).sinceRead).toHaveLength(200);
  });

  it("treats an id with no row as a new session, and a store it cannot read as no session", async () => {
    const { client } = fakeClient({});
    expect(await accountSessionStore(client, "writer").load(ID)).toEqual({ memory: emptyMemory(), fresh: true });
    const broken = fakeClient({}, true);
    expect(await accountSessionStore(broken.client, "writer").load(ID)).toBeNull();
    expect(await accountSessionStore(broken.client, "writer").save(ID, emptyMemory(), true)).toBe(false);
  });

  it("keeps the row as the writer's own, and a new session sweeps the writer's old ones", async () => {
    const rows: Record<string, unknown> = {};
    const { client, asked } = fakeClient(rows);
    const store = accountSessionStore(client, "writer", () => Date.parse("2026-09-20T12:00:00Z"));
    expect(await store.save(ID, { ...emptyMemory(), readOnce: true, said: ["paper"] }, true)).toBe(true);
    expect(asked[0]).toMatchObject({ table: SESSION_TABLE, op: "upsert", row: { id: ID, user_id: "writer", updated_at: "2026-09-20T12:00:00.000Z" } });
    expect(asked[1]).toMatchObject({ op: "delete", user_id: "writer", "updated_at <": new Date(Date.parse("2026-09-20T12:00:00Z") - SESSION_LIFE_MS).toISOString() });
    expect(await store.load(ID)).toEqual({ memory: { ...emptyMemory(), readOnce: true, said: ["paper"] }, fresh: false });
    // The old sessions' undo trails are swept with them (the working list's X2).
    expect(asked[2]).toMatchObject({ table: "agent_undo", op: "delete", user_id: "writer" });
    // A session already begun saves without sweeping.
    await store.save(ID, emptyMemory(), false);
    expect(asked.filter((call) => call.op === "delete")).toHaveLength(2);
  });
});

/** A small table in memory that answers the handful of calls the trail makes, as supabase-js shapes them. */
function fakeTable() {
  const rows: Array<Record<string, unknown>> = [];
  let seq = 0;
  const client = {
    from() {
      let op: "select" | "delete" | null = null;
      const filters: Array<(row: Record<string, unknown>) => boolean> = [];
      let descending = false;
      let window: [number, number] | null = null;
      const run = () => {
        let found = rows.filter((row) => filters.every((test) => test(row)));
        if (descending) found = [...found].sort((a, b) => (b.seq as number) - (a.seq as number));
        const total = found.length;
        if (op === "delete") {
          for (const row of found) rows.splice(rows.indexOf(row), 1);
          return { data: null, error: null };
        }
        if (window) found = found.slice(window[0], window[1] + 1);
        return { data: found, error: null, count: total };
      };
      const chain: Record<string, unknown> = {
        insert(row: Record<string, unknown>) {
          rows.push({ ...row, seq: (seq += 1) });
          return Promise.resolve({ error: null });
        },
        select() { op = "select"; return chain; },
        delete() { op = "delete"; return chain; },
        eq(column: string, value: unknown) { filters.push((row) => row[column] === value); return chain; },
        in(column: string, values: unknown[]) { filters.push((row) => values.includes(row[column])); return chain; },
        lt() { return chain; },
        order(_column: string, options: { ascending: boolean }) { descending = !options.ascending; return chain; },
        range(from: number, to: number) { window = [from, to]; return chain; },
        limit(count: number) { window = [0, count - 1]; return chain; },
        then(resolve: (value: unknown) => void) { resolve(run()); },
      };
      return chain;
    },
  };
  return { client, rows };
}

describe("a session's undo trail through the hosted door (the working list's X2)", () => {
  it("keeps the newest steps, gives the newest back first, and keeps sessions apart", async () => {
    const { client, rows } = fakeTable();
    const store = accountSessionStore(client, "writer");
    for (let index = 1; index <= UNDO_KEPT + 3; index += 1) await store.pushUndo!(ID, { what: `change ${index}`, before: { notes: [] }, afterHash: `hash ${index}`, boardId: "b" });
    expect(rows).toHaveLength(UNDO_KEPT);
    const newest = await store.peekUndo!(ID);
    expect(newest).toMatchObject({ what: `change ${UNDO_KEPT + 3}`, afterHash: `hash ${UNDO_KEPT + 3}`, boardId: "b", steps: UNDO_KEPT });
    await store.popUndo!(ID, newest!.seq);
    expect((await store.peekUndo!(ID))!.what).toBe(`change ${UNDO_KEPT + 2}`);
    expect(await store.peekUndo!("9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e")).toBeNull();
    expect(rows.every((row) => row.user_id === "writer")).toBe(true);
  });
});
