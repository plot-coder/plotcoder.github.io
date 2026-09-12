// PlotCoder board kernel.
//
// Pure, DOM-free reducer over the board records. This is the single source of
// truth for what a "command" does. The browser store, the Vite dev bridge, and
// the MCP server all apply commands through this module so a human gesture and
// an agent tool end up on the exact same code path.
//
// Authored as plain ESM JavaScript (with a sibling reducer.d.ts) so it runs
// unchanged in the browser (via Vite) and in Node (the MCP server). Keep it free
// of `window`, `localStorage`, and `import.meta`.

export const NOTE_COLORS = ["yellow", "pink", "blue", "green", "orange"];

export const NOTE_WIDTH = 192;
export const NOTE_HEIGHT = 192;

const SETTLE_MARGIN = 80;

export function newId() {
  const maybe = globalThis.crypto;
  if (maybe && typeof maybe.randomUUID === "function") return maybe.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function emptyState() {
  return { logline: "", notes: [], groups: [], arrows: [] };
}

export function seedState(now = nowIso()) {
  const mk = (id, headline, change, color, x, y, rotate, z) => ({
    id,
    headline,
    change,
    color,
    x,
    y,
    rotate,
    z,
    createdAt: now,
    updatedAt: now,
  });

  return {
    // Left empty on purpose: the placeholder asks the question, which is how a
    // new writer finds out the logline is there at all.
    logline: "",
    notes: [
      mk("maya-letter", "Maya finds the letter", "She decides not to tell Tom.", "yellow", 88, 120, -2.2, 1),
      mk("tom-lies", "Tom lies about the job", "Maya starts to doubt him.", "pink", 320, 168, 1.6, 2),
      mk("letter-aloud", "The letter is read aloud", "The plan dies in the room.", "blue", 196, 340, 0.8, 3),
    ],
    groups: [],
    arrows: [],
  };
}

// Deliberately unchanged by the arrival of `logline`. Validation stays as loose
// as it was so that no board which was valid yesterday becomes invalid today —
// a stricter check here would reject saved projects and lose someone's wall.
// Shape is repaired in normalizeState instead.
export function isBoardState(value) {
  if (!value || typeof value !== "object") return false;
  return (
    Array.isArray(value.notes) &&
    Array.isArray(value.groups) &&
    Array.isArray(value.arrows)
  );
}

/**
 * Fill in fields added after a board was written. Every load boundary — the
 * browser store, the dev bridge, the MCP server, an opened project file — runs
 * a board through this so the rest of the code can assume the current shape.
 */
export function normalizeState(value) {
  if (!isBoardState(value)) return emptyState();
  const logline = typeof value.logline === "string" ? value.logline : "";
  if (value.logline === logline) return value;
  return { ...value, logline };
}

function maxZ(notes) {
  return notes.reduce((top, note) => Math.max(top, note.z), 0);
}

function bump(note, patch, now) {
  return { ...note, ...patch, updatedAt: now };
}

function pruneGroups(groups) {
  return groups.filter((group) => group.noteIds.length >= 2);
}

export function applyCommand(state, command, now = nowIso()) {
  switch (command.type) {
    case "set_logline": {
      const logline = typeof command.logline === "string" ? command.logline.trim() : "";
      if (logline === (state.logline ?? "")) return { state, changed: false };
      return { state: { ...state, logline }, changed: true, result: { logline } };
    }

    case "create_note": {
      const n = state.notes.length;
      const note = {
        id: command.id ?? newId(),
        headline: command.headline ?? "New beat",
        change: command.change ?? "What changes?",
        color: command.color ?? NOTE_COLORS[n % NOTE_COLORS.length],
        x: command.x ?? 140 + (n % 5) * 28,
        y: command.y ?? 140 + (n % 4) * 24,
        rotate: command.rotate ?? ((n % 5) - 2) * 1.1,
        z: maxZ(state.notes) + 1,
        createdAt: now,
        updatedAt: now,
      };
      return {
        state: { ...state, notes: [...state.notes, note] },
        changed: true,
        result: note,
      };
    }

    case "update_note": {
      let updated;
      const notes = state.notes.map((note) => {
        if (note.id !== command.id) return note;
        const patch = {};
        if (command.headline !== undefined) patch.headline = command.headline;
        if (command.change !== undefined) patch.change = command.change;
        updated = bump(note, patch, now);
        return updated;
      });
      if (!updated) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: updated };
    }

    case "move_note": {
      let moved;
      const notes = state.notes.map((note) => {
        if (note.id !== command.id) return note;
        moved = bump(note, { x: command.x, y: command.y }, now);
        return moved;
      });
      if (!moved) return { state, changed: false };
      return { state: { ...state, notes }, changed: true, result: moved };
    }

    case "nudge_notes": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      const notes = state.notes.map((note) =>
        ids.has(note.id)
          ? bump(note, { x: note.x + command.dx, y: note.y + command.dy }, now)
          : note,
      );
      return { state: { ...state, notes }, changed: true };
    }

    case "recolor_notes": {
      const ids = new Set(command.ids);
      if (ids.size === 0) return { state, changed: false };
      const changedNotes = [];
      const notes = state.notes.map((note) => {
        if (!ids.has(note.id)) return note;
        const next = bump(note, { color: command.color }, now);
        changedNotes.push(next);
        return next;
      });
      const painted = changedNotes.length > 0;
      return {
        state: painted ? { ...state, notes } : state,
        changed: painted,
        result: changedNotes,
      };
    }

    case "raise_note": {
      const top = maxZ(state.notes) + 1;
      let raised = false;
      const notes = state.notes.map((note) => {
        if (note.id !== command.id) return note;
        raised = true;
        return { ...note, z: top };
      });
      if (!raised) return { state, changed: false };
      return { state: { ...state, notes }, changed: true };
    }

    case "delete_note": {
      if (!state.notes.some((note) => note.id === command.id)) {
        return { state, changed: false };
      }
      const notes = state.notes.filter((note) => note.id !== command.id);
      const arrows = state.arrows.filter(
        (arrow) => arrow.from !== command.id && arrow.to !== command.id,
      );
      const groups = pruneGroups(
        state.groups.map((group) => ({
          ...group,
          noteIds: group.noteIds.filter((id) => id !== command.id),
        })),
      );
      return {
        state: { ...state, notes, arrows, groups },
        changed: true,
        result: { id: command.id },
      };
    }

    case "apply_poses": {
      const byId = new Map(command.poses.map((pose) => [pose.id, pose]));
      if (byId.size === 0) return { state, changed: false };
      const notes = state.notes.map((note) => {
        const pose = byId.get(note.id);
        return pose
          ? bump(note, { x: pose.x, y: pose.y, rotate: pose.rotate }, now)
          : note;
      });
      return { state: { ...state, notes }, changed: true };
    }

    case "settle_note": {
      const note = state.notes.find((item) => item.id === command.id);
      if (!note) return { state, changed: false };
      const groups = pruneGroups(
        state.groups.map((group) => {
          if (!group.noteIds.includes(command.id)) return group;
          const others = state.notes.filter(
            (item) => item.id !== command.id && group.noteIds.includes(item.id),
          );
          if (others.length === 0) return { ...group, noteIds: [] };
          const left = Math.min(...others.map((item) => item.x)) - SETTLE_MARGIN;
          const top = Math.min(...others.map((item) => item.y)) - SETTLE_MARGIN;
          const right = Math.max(...others.map((item) => item.x + NOTE_WIDTH)) + SETTLE_MARGIN;
          const bottom = Math.max(...others.map((item) => item.y + NOTE_HEIGHT)) + SETTLE_MARGIN;
          const cx = note.x + NOTE_WIDTH / 2;
          const cy = note.y + NOTE_HEIGHT / 2;
          const inside = cx > left && cx < right && cy > top && cy < bottom;
          return inside
            ? group
            : { ...group, noteIds: group.noteIds.filter((id) => id !== command.id) };
        }),
      );
      return { state: { ...state, groups }, changed: true };
    }

    case "create_group": {
      const noteIds = command.noteIds.filter((id) =>
        state.notes.some((note) => note.id === id),
      );
      if (noteIds.length < 2) return { state, changed: false };
      const idSet = new Set(noteIds);
      const group = {
        id: newId(),
        title: command.title ?? "Sequence",
        noteIds: [...noteIds],
      };
      const groups = [
        ...pruneGroups(
          state.groups.map((existing) => ({
            ...existing,
            noteIds: existing.noteIds.filter((id) => !idSet.has(id)),
          })),
        ),
        group,
      ];
      return { state: { ...state, groups }, changed: true, result: group };
    }

    case "ungroup": {
      if (!state.groups.some((group) => group.id === command.id)) {
        return { state, changed: false };
      }
      return {
        state: { ...state, groups: state.groups.filter((group) => group.id !== command.id) },
        changed: true,
      };
    }

    case "rename_group": {
      let renamed = false;
      const groups = state.groups.map((group) => {
        if (group.id !== command.id) return group;
        renamed = true;
        return { ...group, title: command.title };
      });
      if (!renamed) return { state, changed: false };
      return { state: { ...state, groups }, changed: true };
    }

    case "create_arrow": {
      if (command.from === command.to) return { state, changed: false };
      const knownFrom = state.notes.some((note) => note.id === command.from);
      const knownTo = state.notes.some((note) => note.id === command.to);
      if (!knownFrom || !knownTo) return { state, changed: false };
      if (state.arrows.some((arrow) => arrow.from === command.from && arrow.to === command.to)) {
        return { state, changed: false };
      }
      const arrow = { id: newId(), from: command.from, to: command.to };
      return {
        state: { ...state, arrows: [...state.arrows, arrow] },
        changed: true,
        result: arrow,
      };
    }

    case "delete_arrow": {
      if (!state.arrows.some((arrow) => arrow.id === command.id)) {
        return { state, changed: false };
      }
      return {
        state: { ...state, arrows: state.arrows.filter((arrow) => arrow.id !== command.id) },
        changed: true,
        result: { id: command.id },
      };
    }

    default:
      return { state, changed: false };
  }
}
