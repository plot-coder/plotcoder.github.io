export type Reminder = {
  id: string;
  title: string;
  body: string;
  builtIn: boolean;
  createdAt: string;
};

export const REMINDERS_KEY = "plotcoder.reminders";

import { DEFAULT_REMINDERS, titleFromBody } from "./board/reminders";

export { DEFAULT_REMINDERS, titleFromBody };

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

// Fired on every write so the account mirror (R4) knows reminders moved.
export const REMINDERS_EVENT = "plotcoder:reminders";

export function isReminderList(value: unknown): value is Reminder[] {
  return Array.isArray(value) && value.every(isReminder);
}

export function writeReminders(reminders: Reminder[]) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  try {
    window.dispatchEvent(new Event(REMINDERS_EVENT));
  } catch {
    /* no window: nothing listening */
  }
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
