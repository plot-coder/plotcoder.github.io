// Sync decisions (R4, roadmap item 2).
//
// The rules that decide what a device does when it meets the account, and
// what a push does when it finds the account ahead. Pure and DOM-free so they
// are tested like the kernel; the network is a thin layer in syncStore.ts.
//
// The one rule that matters: nothing is ever lost, and there is no merge
// dialog. When two copies disagree, the account's copy stays the board, and
// this device's copy becomes a new board of the project, named for where it
// came from and when, so the writer merges by hand with the tools they have.

/** "Episode 2 · from this laptop, 3:14 pm" */
export function conflictName(name, device, when) {
  const time = when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${name} · from ${device}, ${time}`;
}

/**
 * First meeting between a device and the account.
 *
 * - The account has nothing: push everything; this device seeds it.
 * - The account has a project and this device has never synced: the account's
 *   project becomes this device's project. Boards on this device that the
 *   account does not have are carried over as new boards, renamed so it is
 *   plain where they came from — unless this device holds only the untouched
 *   seed wall, which is not work and is dropped.
 *
 * Returns what to adopt locally and what to push.
 */
export function reconcileOnSignIn({ local, remote, isSeed, device, now }) {
  if (!remote.project) {
    return {
      adopt: null,
      pushProject: local.project,
      pushBoards: local.project.boards.map((board) => board.id),
      renamed: [],
    };
  }
  const remoteIds = new Set(remote.project.boards.map((board) => board.id));
  const carried = local.project.boards.filter((board) => !remoteIds.has(board.id));
  if (isSeed || carried.length === 0) {
    return { adopt: remote.project, pushProject: null, pushBoards: [], renamed: [] };
  }
  const merged = mergeProjects(remote.project, local.project, now, (board) => ({
    ...board,
    name: conflictName(board.name, device, now),
  }));
  return {
    adopt: merged,
    pushProject: merged,
    pushBoards: carried.map((board) => board.id),
    renamed: carried.map((board) => board.id),
  };
}

/**
 * The account's record, plus every board this device has that the account
 * does not. The account's name, premise and order win; the device's boards
 * go after them, through `carry` (identity by default) so a caller can rename
 * them. The open board stays this device's if the merged project has it.
 */
export function mergeProjects(remote, local, now, carry = (board) => board) {
  const remoteIds = new Set(remote.boards.map((board) => board.id));
  const carried = local.boards
    .filter((board) => !remoteIds.has(board.id))
    .map((board) => ({ ...carry(board), updatedAt: now.toISOString() }));
  if (carried.length === 0 && remote.boards.some((board) => board.id === local.activeBoardId) === false) {
    return remote;
  }
  const boards = [...remote.boards, ...carried];
  const activeBoardId = boards.some((board) => board.id === local.activeBoardId)
    ? local.activeBoardId
    : remote.activeBoardId;
  if (carried.length === 0 && activeBoardId === remote.activeBoardId) return remote;
  return { ...remote, boards, activeBoardId, updatedAt: now.toISOString() };
}

/**
 * A push found the account ahead of what this device last saw. Keep the
 * account's board; this device's version becomes a new board.
 */
export function resolveBoardConflict({ project, boardId, device, now }) {
  const board = project.boards.find((item) => item.id === boardId);
  if (!board) return null;
  const copy = {
    id: `${boardId}-${Date.now().toString(36)}`,
    name: conflictName(board.name, device, now),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const index = project.boards.findIndex((item) => item.id === boardId);
  const boards = [...project.boards];
  boards.splice(index + 1, 0, copy);
  return { project: { ...project, boards, updatedAt: now.toISOString() }, copy };
}

/** A short name for this device from the browser, without asking. */
export function deviceName(userAgent) {
  const ua = userAgent ?? "";
  if (/iPhone/.test(ua)) return "an iPhone";
  if (/iPad/.test(ua)) return "an iPad";
  if (/Android/.test(ua)) return "an Android phone";
  if (/Mac OS X/.test(ua)) return "a Mac";
  if (/Windows/.test(ua)) return "a Windows PC";
  if (/Linux/.test(ua)) return "a Linux machine";
  return "another device";
}

/**
 * What a push should do, given what the account says about the row.
 *
 * - The row is missing: insert it.
 * - The row is at the revision this device last saw: update it.
 * - The row is ahead: conflict — the caller keeps the account's copy and
 *   turns this device's into a new board.
 */
export function pushOutcome({ remoteRev, seenRev }) {
  if (remoteRev === null || remoteRev === undefined) return "insert";
  if (remoteRev === seenRev) return "update";
  return "conflict";
}

/**
 * What opening the app should do with a board the account holds, given what
 * this device last saw of it and whether this device has changes it has not
 * pushed yet.
 *
 * - Not ahead of what we saw: nothing to pull; push if dirty.
 * - Ahead and this device is clean: adopt the account's copy.
 * - Ahead and this device is dirty: conflict, resolved like a push.
 */
export function openOutcome({ remoteRev, seenRev, dirty }) {
  if (remoteRev === null || remoteRev === undefined) return dirty ? "push" : "nothing";
  if (remoteRev <= seenRev) return dirty ? "push" : "nothing";
  return dirty ? "conflict" : "adopt";
}

/**
 * Meeting an account that can hold many projects (R40).
 *
 * - The account has none: this device's project becomes its first.
 * - This device holds only the untouched seed wall: nothing to carry; open
 *   the account's one project, or ask which when there are several.
 * - This device holds work: it becomes a new project of the account, kept
 *   whole, and the writer picks between it and the rest.
 *
 * Returns whether to push the local project as a new one, which project to
 * open now (null when the writer should pick), and whether to show the picker.
 */
export function planSignIn({ isSeed, localProjectId, remoteProjectIds }) {
  if (remoteProjectIds.length === 0) {
    return { pushLocalAsNew: true, open: localProjectId, pick: false };
  }
  if (isSeed) {
    return remoteProjectIds.length === 1
      ? { pushLocalAsNew: false, open: remoteProjectIds[0], pick: false }
      : { pushLocalAsNew: false, open: null, pick: true };
  }
  if (remoteProjectIds.includes(localProjectId)) {
    return { pushLocalAsNew: false, open: localProjectId, pick: remoteProjectIds.length > 1 };
  }
  return { pushLocalAsNew: true, open: localProjectId, pick: true };
}

/**
 * A change to a board arrived live from another person (R41). Take it when
 * it is ahead of what this device saw and this device has nothing unpushed on
 * that board; otherwise let the next push settle it as a conflict.
 */
export function liveOutcome({ remoteRev, seenRev, dirty }) {
  if (remoteRev <= seenRev) return "nothing";
  return dirty ? "conflict" : "adopt";
}
