import { describe, expect, it } from "vitest";
import { SESSION_LIFE_MS, SESSION_TABLE, accountSessionStore, emptyMemory, isSessionId, normalizeMemory } from "./agentSession";

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
    // A session already begun saves without sweeping.
    await store.save(ID, emptyMemory(), false);
    expect(asked.filter((call) => call.op === "delete")).toHaveLength(1);
  });
});
