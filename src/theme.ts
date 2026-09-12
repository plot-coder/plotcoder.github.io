export type Theme = "light" | "dark";
export type ThemeSource = "auto" | "manual";

export const LIGHT_HOUR = 8;
export const DARK_HOUR = 20;

const STORAGE_KEY = "plotcoder.theme";

type StoredTheme = {
  theme: Theme;
  source: ThemeSource;
  at: string;
};

export function scheduledTheme(date = new Date()): Theme {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= LIGHT_HOUR * 60 && minutes < DARK_HOUR * 60
    ? "light"
    : "dark";
}

export function themePeriod(date = new Date()): Theme {
  return scheduledTheme(date);
}

export function nextClockChange(date = new Date()): Date {
  const next = new Date(date);
  next.setSeconds(0, 0);
  next.setMilliseconds(0);

  const minutes = date.getHours() * 60 + date.getMinutes();
  const lightMinutes = LIGHT_HOUR * 60;
  const darkMinutes = DARK_HOUR * 60;

  if (minutes < lightMinutes) {
    next.setHours(LIGHT_HOUR, 0, 0, 0);
  } else if (minutes < darkMinutes) {
    next.setHours(DARK_HOUR, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(LIGHT_HOUR, 0, 0, 0);
  }

  return next;
}

export function resolveTheme(date = new Date()): Theme {
  const stored = readStoredTheme();
  if (
    stored?.source === "manual" &&
    themePeriod(new Date(stored.at)) === themePeriod(date)
  ) {
    return stored.theme;
  }
  return scheduledTheme(date);
}

export function readStoredTheme(): StoredTheme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredTheme;
    if (parsed.theme !== "light" && parsed.theme !== "dark") return null;
    if (parsed.source !== "auto" && parsed.source !== "manual") return null;
    if (typeof parsed.at !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: Theme, source: ThemeSource, at = new Date()) {
  const value: StoredTheme = { theme, source, at: at.toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function formatClockTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatNextChange(current: Theme, date = new Date()) {
  let next = nextClockChange(date);
  if (scheduledTheme(next) === current) {
    next = nextClockChange(new Date(next.getTime() + 60_000));
  }
  const nextTheme = scheduledTheme(next);
  const label = nextTheme === "light" ? "Light" : "Dark";
  return `${label} at ${formatClockTime(next)}`;
}
