export type Reminder = {
  id: string;
  title: string;
  body: string;
  builtIn: boolean;
  createdAt: string;
};

export const REMINDERS_KEY = "plotcoder.reminders";

export const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: "story-is-change",
    title: "Story is change",
    body: "A scene earns its place when someone wants something, meets resistance, and leaves in a different position than they entered. If nothing shifts — information, power, emotion, or the plan — the scene is usually decoration.",
    builtIn: true,
    createdAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "character-under-pressure",
    title: "Character is revealed under pressure",
    body: "Personality on the page is not description; it’s what a person does when the easy option is gone. Give them a clear want, a stronger need they may not admit, and a flaw that makes the want costly.",
    builtIn: true,
    createdAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "structure-is-a-map",
    title: "Structure is a delivery system, not a religion",
    body: "Three acts, sequences, and beats are useful because audiences need orientation: a world, a disruption, rising stakes, a point of no return, and a confrontation that answers the story’s question. Use the map; don’t let the map write the movie.",
    builtIn: true,
    createdAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "dialogue-does-two-jobs",
    title: "Dialogue should do more than one job",
    body: "The best lines reveal character, advance plot, and hide subtext at the same time. People rarely say exactly what they mean. Cut anything a character would not say in that moment to that person.",
    builtIn: true,
    createdAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "write-for-the-camera",
    title: "Write for the camera and the cut",
    body: "Prefer action, image, and behavior over explanation. White space matters. If a reader has to work to see the movie, the movie is not on the page yet.",
    builtIn: true,
    createdAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "readability-is-craft",
    title: "Readability is a craft skill",
    body: "Industry readers skim. Short paragraphs, precise sluglines, and verbs that carry the shot will get you further than clever formatting.",
    builtIn: true,
    createdAt: "2026-09-12T00:00:00.000Z",
  },
];

function isReminder(value: unknown): value is Reminder {
  if (!value || typeof value !== "object") return false;
  const item = value as Reminder;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.body === "string" &&
    typeof item.builtIn === "boolean" &&
    typeof item.createdAt === "string"
  );
}

export function readReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (!raw) return DEFAULT_REMINDERS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every(isReminder)) {
      return DEFAULT_REMINDERS;
    }
    return parsed;
  } catch {
    return DEFAULT_REMINDERS;
  }
}

export function writeReminders(reminders: Reminder[]) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

export function titleFromBody(body: string) {
  const first = body.trim().split(/(?<=[.!?])\s+/)[0] ?? "";
  return first.replace(/[.!?]$/, "").slice(0, 80);
}

export function createReminder(body: string, title?: string): Reminder {
  const trimmed = body.trim();
  return {
    id: crypto.randomUUID(),
    title: title?.trim() || titleFromBody(trimmed) || "Reminder",
    body: trimmed,
    builtIn: false,
    createdAt: new Date().toISOString(),
  };
}
