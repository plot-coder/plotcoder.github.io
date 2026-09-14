// What a wipe would do — the rules, with nothing that talks to the network.
//
// `scripts/wipe-test-account.mjs` reads the account, hands what it found to
// `planWipe`, and prints or performs the plan that comes back. Keeping the
// decision here means the rail that protects a real writer's work is a pure
// function with tests, the way `src/board/sync.js` holds the mirror's rules.
//
// Two modes, because a blind run wants both at different moments:
//   empty  — the account's own projects go; the account stays, so the next
//            round signs in with the same address and the prompt is untouched.
//   delete — the account goes too, and Postgres cascades every row with it.

/** Modes a caller may ask for. */
export const MODES = ["empty", "delete"];

/**
 * Decide what may be removed for one account.
 *
 * @param {object} found
 * @param {{ email: string, user_id: string, test: boolean } | null} found.writer
 *   The writer row for the address, or null when the address has no account.
 * @param {Array<{ id: string, name: string, owner: string, boards?: number }>} found.projects
 *   Every project the account can see — owned and shared alike.
 * @param {string[]} found.objects  Storage paths under the `projects` bucket.
 * @param {string} mode  One of MODES.
 * @returns {object} A plan when it is safe, a refusal when it is not.
 */
export function planWipe(found, mode) {
  const writer = found?.writer ?? null;
  const projects = found?.projects ?? [];
  const objects = found?.objects ?? [];

  if (!MODES.includes(mode)) {
    return refuse("unknown-mode", `"${mode}" is not a mode. Ask for empty or delete.`);
  }
  if (!writer) {
    return refuse("unknown-address", "No account here by that address. Nothing to wipe.");
  }
  if (writer.test !== true) {
    return refuse(
      "not-a-test-account",
      `${writer.email} is not marked as a test account, so this script will not touch it. ` +
        "Mark it deliberately first (--mark) if it really is a throwaway.",
    );
  }

  // Only what the account owns. A project shared *with* the test account
  // belongs to whoever made it, and survives — deleting the account takes the
  // membership row and leaves their work alone.
  const owned = projects.filter((project) => project.owner === writer.user_id);
  const shared = projects.filter((project) => project.owner !== writer.user_id);
  const ownedIds = new Set(owned.map((project) => project.id));

  // Objects live at <project id>/<kind>/<file>, so the first segment says whose
  // they are. Nothing cascades in storage; these have to go by hand, and they
  // have to go first, while the rows that prove membership still exist.
  const files = objects.filter((path) => ownedIds.has(String(path).split("/")[0]));

  return {
    ok: true,
    mode,
    email: writer.email,
    userId: writer.user_id,
    projects: owned,
    shared,
    files,
    removesAccount: mode === "delete",
  };
}

/**
 * The plan as a person reads it, one line each, so nothing is destroyed
 * without having been named on screen first.
 */
export function describePlan(plan) {
  if (!plan.ok) return [plan.say];

  const lines = [];
  const cards = plan.projects.length;
  lines.push(
    cards === 0
      ? `${plan.email} owns no projects.`
      : `${plan.email} owns ${count(cards, "project")}:`,
  );
  for (const project of plan.projects) {
    const boards = typeof project.boards === "number" ? ` · ${count(project.boards, "board")}` : "";
    lines.push(`  - ${project.name || "(untitled)"} [${project.id}]${boards}`);
  }
  if (plan.files.length) lines.push(`${count(plan.files.length, "file")} in the projects bucket.`);
  if (plan.shared.length) {
    lines.push(`${count(plan.shared.length, "project")} shared with this account stay; they belong to someone else:`);
    for (const project of plan.shared) lines.push(`  - ${project.name || "(untitled)"} [${project.id}]`);
  }
  lines.push(
    plan.removesAccount
      ? `Then the account itself goes, and every row cascades with it. ${plan.email} will have to be claimed again.`
      : `The account stays. ${plan.email} signs in as before, with nothing in it.`,
  );
  return lines;
}

function refuse(reason, say) {
  return { ok: false, reason, say };
}

function count(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
