import { describe, expect, it } from "vitest";
import { movePlaceFiles } from "./placeFiles";

type Row = { id: string; project_id: string; subject: string };

/** The account's assets table, as far as a move reads it: no network. */
function fakeClient(rows: Row[], refuse = "") {
  const calls: string[] = [];
  const client = {
    from(table: string) {
      calls.push(table);
      let patch: Partial<Row> = {};
      const wheres: Array<[keyof Row, string]> = [];
      const query = {
        update(next: Partial<Row>) {
          patch = next;
          return query;
        },
        eq(field: keyof Row, value: string) {
          wheres.push([field, value]);
          return query;
        },
        async select() {
          if (refuse) return { data: null, error: { message: refuse } };
          const hit = rows.filter((row) => wheres.every(([field, value]) => row[field] === value));
          for (const row of hit) Object.assign(row, patch);
          return { data: hit.map((row) => ({ id: row.id })), error: null };
        },
      };
      return query;
    },
  };
  return { client, calls };
}

describe("a place's files follow its rename (R79)", () => {
  it("moves this project's files from the old place to the new, and leaves the rest", async () => {
    const rows = [
      { id: "a", project_id: "p1", subject: "place:the piano shop" },
      { id: "b", project_id: "p1", subject: "place:the piano shop" },
      { id: "c", project_id: "p2", subject: "place:the piano shop" },
      { id: "d", project_id: "p1", subject: "maya" },
    ];
    const { client } = fakeClient(rows);
    expect(await movePlaceFiles(client, "p1", " The  Piano Shop ", "The Music Shop")).toEqual({ moved: 2, error: null });
    expect(rows.map((row) => row.subject)).toEqual(["place:the music shop", "place:the music shop", "place:the piano shop", "maya"]);
  });

  it("renamed into a place that has pictures, both sets stand", async () => {
    const rows = [
      { id: "a", project_id: "p1", subject: "place:the slip" },
      { id: "b", project_id: "p1", subject: "place:the yard" },
    ];
    const { client } = fakeClient(rows);
    expect((await movePlaceFiles(client, "p1", "the slip", "the yard")).moved).toBe(1);
    expect(rows.map((row) => `${row.id} ${row.subject}`)).toEqual(["a place:the yard", "b place:the yard"]);
  });

  it("asks the account nothing when the key has not changed, or there is no account", async () => {
    const { client, calls } = fakeClient([{ id: "a", project_id: "p1", subject: "place:the slip" }]);
    expect(await movePlaceFiles(client, "p1", "the slip", "THE  SLIP")).toEqual({ moved: 0, error: null });
    expect(await movePlaceFiles(client, "p1", "the slip", "  ")).toEqual({ moved: 0, error: null });
    expect(await movePlaceFiles(client, null, "the slip", "the yard")).toEqual({ moved: 0, error: null });
    expect(await movePlaceFiles(null, "p1", "the slip", "the yard")).toEqual({ moved: 0, error: null });
    expect(calls).toEqual([]);
  });

  it("says the account's words when it refuses, and throws nothing", async () => {
    const { client } = fakeClient([], "new row violates row-level security policy");
    expect(await movePlaceFiles(client, "p1", "the slip", "the yard")).toEqual({ moved: 0, error: "new row violates row-level security policy" });
    const broken = { from: () => { throw new Error("fetch failed"); } };
    expect(await movePlaceFiles(broken, "p1", "the slip", "the yard")).toEqual({ moved: 0, error: "fetch failed" });
  });
});
