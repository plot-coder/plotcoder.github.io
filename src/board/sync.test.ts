import { describe, expect, it } from "vitest";
import { addBoard, emptyProject, renameBoard, renameProject } from "./project";
import { conflictName, deviceName, linkOutcome, liveOutcome, mergeProjects, openOutcome, planSignIn, pushOutcome, reconcileOnSignIn, resolveBoardConflict } from "./sync";

const NOW = new Date("2026-09-13T15:14:00");
const AT = "2026-01-01T00:00:00.000Z";

function laptop() {
  let project = renameProject(emptyProject(AT), "The Letter", AT);
  project = renameBoard(project, project.boards[0].id, "Episode 1", AT);
  project = addBoard(project, "Episode 2", AT).project;
  return project;
}

describe("conflictName", () => {
  it("names a copy for where it came from and when", () => {
    expect(conflictName("Episode 2", "a Mac", NOW)).toMatch(/^Episode 2 · from a Mac, 3:14/);
  });
});

describe("reconcileOnSignIn", () => {
  it("seeds an empty account from this device", () => {
    const local = laptop();
    const plan = reconcileOnSignIn({ local: { project: local }, remote: { project: null }, isSeed: false, device: "a Mac", now: NOW });
    expect(plan.adopt).toBeNull();
    expect(plan.pushProject).toBe(local);
    expect(plan.pushBoards).toEqual(local.boards.map((board) => board.id));
    expect(plan.renamed).toEqual([]);
  });

  it("adopts the account's project when this device holds only the seed wall", () => {
    const remote = laptop();
    const plan = reconcileOnSignIn({ local: { project: emptyProject(AT) }, remote: { project: remote }, isSeed: true, device: "a Mac", now: NOW });
    expect(plan.adopt).toBe(remote);
    expect(plan.pushProject).toBeNull();
    expect(plan.pushBoards).toEqual([]);
  });

  it("carries this device's own boards into the account, renamed, and loses nothing", () => {
    const remote = laptop();
    const local = addBoard(emptyProject(AT), "Draft on the train", AT).project;
    const plan = reconcileOnSignIn({ local: { project: local }, remote: { project: remote }, isSeed: false, device: "a Mac", now: NOW });
    expect(plan.adopt).not.toBeNull();
    expect(plan.adopt!.boards).toHaveLength(4);
    expect(plan.adopt!.boards.slice(0, 2)).toEqual(remote.boards);
    const carried = plan.adopt!.boards.slice(2).map((board) => board.name);
    expect(carried[0]).toMatch(/^Board 1 · from a Mac/);
    expect(carried[1]).toMatch(/^Draft on the train · from a Mac/);
    expect(plan.pushBoards).toEqual(local.boards.map((board) => board.id));
    expect(plan.renamed).toEqual(local.boards.map((board) => board.id));
    expect(plan.pushProject).toBe(plan.adopt);
    // The account's name and premise win; the device's project is folded in.
    expect(plan.adopt!.name).toBe("The Letter");
  });

  it("adopts the account's project outright when every local board is already in it", () => {
    const remote = laptop();
    const plan = reconcileOnSignIn({ local: { project: remote }, remote: { project: remote }, isSeed: false, device: "a Mac", now: NOW });
    expect(plan.adopt).toBe(remote);
    expect(plan.pushBoards).toEqual([]);
  });
});

describe("resolveBoardConflict", () => {
  it("keeps the account's board and adds this device's copy right after it", () => {
    const project = laptop();
    const second = project.boards[1];
    const resolved = resolveBoardConflict({ project, boardId: second.id, device: "an iPad", now: NOW });
    expect(resolved).not.toBeNull();
    expect(resolved!.copy.name).toMatch(/^Episode 2 · from an iPad, 3:14/);
    expect(resolved!.project.boards.map((board) => board.id)).toEqual([
      project.boards[0].id,
      second.id,
      resolved!.copy.id,
    ]);
    expect(resolved!.copy.id).not.toBe(second.id);
  });

  it("returns null for a board that is not in the project", () => {
    expect(resolveBoardConflict({ project: laptop(), boardId: "nope", device: "a Mac", now: NOW })).toBeNull();
  });
});

describe("deviceName", () => {
  it("names the common devices and falls back gracefully", () => {
    expect(deviceName("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)")).toBe("a Mac");
    expect(deviceName("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("an iPhone");
    expect(deviceName("Mozilla/5.0 (Windows NT 10.0)")).toBe("a Windows PC");
    expect(deviceName(undefined)).toBe("another device");
  });
});

describe("pushOutcome", () => {
  it("inserts a row the account lacks, updates one at the seen revision, and flags one ahead", () => {
    expect(pushOutcome({ remoteRev: null, seenRev: 0 })).toBe("insert");
    expect(pushOutcome({ remoteRev: 3, seenRev: 3 })).toBe("update");
    expect(pushOutcome({ remoteRev: 4, seenRev: 3 })).toBe("conflict");
  });
});

describe("openOutcome", () => {
  it("adopts the account's copy only when this device is clean, and pushes when only it moved", () => {
    expect(openOutcome({ remoteRev: 3, seenRev: 3, dirty: false })).toBe("nothing");
    expect(openOutcome({ remoteRev: 3, seenRev: 3, dirty: true })).toBe("push");
    expect(openOutcome({ remoteRev: 5, seenRev: 3, dirty: false })).toBe("adopt");
    expect(openOutcome({ remoteRev: 5, seenRev: 3, dirty: true })).toBe("conflict");
    expect(openOutcome({ remoteRev: null, seenRev: 0, dirty: true })).toBe("push");
    expect(openOutcome({ remoteRev: null, seenRev: 0, dirty: false })).toBe("nothing");
  });
});

describe("mergeProjects", () => {
  it("keeps the account's record and appends the boards only this device has, unrenamed", () => {
    const remote = laptop();
    const local = addBoard(remote, "Episode 3", AT).project;
    const merged = mergeProjects(remote, local, NOW);
    expect(merged.boards.map((board) => board.name)).toEqual(["Episode 1", "Episode 2", "Episode 3"]);
    expect(merged.activeBoardId).toBe(local.activeBoardId);
    expect(merged.name).toBe("The Letter");
  });

  it("returns the account's record untouched when there is nothing to carry", () => {
    const remote = laptop();
    expect(mergeProjects(remote, remote, NOW)).toBe(remote);
  });

  it("falls back to the account's open board when this device's is gone", () => {
    const remote = laptop();
    const local = { ...emptyProject(AT), boards: [], activeBoardId: "gone" };
    expect(mergeProjects(remote, local, NOW)).toBe(remote);
  });
});

describe("planSignIn (R40)", () => {
  it("seeds an empty account, adopts the account's one project over a seed wall, and asks when there are several", () => {
    expect(planSignIn({ isSeed: false, localProjectId: "L", remoteProjectIds: [] })).toEqual({ pushLocalAsNew: true, open: "L", pick: false });
    expect(planSignIn({ isSeed: true, localProjectId: "L", remoteProjectIds: ["A"] })).toEqual({ pushLocalAsNew: false, open: "A", pick: false });
    expect(planSignIn({ isSeed: true, localProjectId: "L", remoteProjectIds: ["A", "B"] })).toEqual({ pushLocalAsNew: false, open: null, pick: true });
  });

  it("keeps this device's work as a new project and lets the writer pick", () => {
    expect(planSignIn({ isSeed: false, localProjectId: "L", remoteProjectIds: ["A"] })).toEqual({ pushLocalAsNew: true, open: "L", pick: true });
    expect(planSignIn({ isSeed: false, localProjectId: "A", remoteProjectIds: ["A", "B"] })).toEqual({ pushLocalAsNew: false, open: "A", pick: true });
    expect(planSignIn({ isSeed: false, localProjectId: "A", remoteProjectIds: ["A"] })).toEqual({ pushLocalAsNew: false, open: "A", pick: false });
  });
});

describe("liveOutcome (R41)", () => {
  it("adopts a live change that is ahead when this device is clean, and flags it when dirty", () => {
    expect(liveOutcome({ remoteRev: 2, seenRev: 2, dirty: false })).toBe("nothing");
    expect(liveOutcome({ remoteRev: 3, seenRev: 2, dirty: false })).toBe("adopt");
    expect(liveOutcome({ remoteRev: 3, seenRev: 2, dirty: true })).toBe("conflict");
  });
});

describe("linkOutcome: what a landed reset link says", () => {
  it("says nothing for an empty or ordinary address", () => {
    expect(linkOutcome("")).toBeNull();
    expect(linkOutcome(undefined)).toBeNull();
    expect(linkOutcome("#board=abc")).toBeNull();
  });

  it("names a stale link — expired or already used — and points at the way back", () => {
    const stale = linkOutcome("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
    expect(stale?.kind).toBe("stale");
    expect(stale?.message).toContain("expired or was already used");
    expect(stale?.message).toContain("an hour");
  });

  it("passes any other reason through as an error", () => {
    const other = linkOutcome("#error=server_error&error_description=Something+broke");
    expect(other).toEqual({ kind: "error", message: "Something broke" });
    expect(linkOutcome("#error=access_denied")?.message).toContain("did not work");
  });
});
