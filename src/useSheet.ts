// A sheet's opening, once (2026-09-27). A sheet reset itself in an effect
// that listed `onClose`, and the app hands every sheet a new `onClose` each
// time it renders: so any render of the app — a minute passing, the account
// store moving — ran the reset again, closed what the writer had just opened
// and took the caret to Close. In the account sheet the reset also asked for
// each project's facts, which moved the store, which rendered the app, which
// ran the reset: a row opened for a moment and shut, and the asking never
// stopped. The callbacks are held in refs, and the effect runs when `open`
// changes and at no other time.

import { useEffect, useRef } from "react";

/**
 * Runs `onOpen` once as the sheet opens, closes it on Escape, and runs
 * `every` on an interval while it is open when one is given. Returns nothing:
 * the sheet keeps its own state, and keeps it until it is closed.
 */
export function useSheet(open: boolean, onClose: () => void, onOpen?: () => void, every?: { run: () => void; ms: number }): void {
  const close = useRef(onClose);
  const opened = useRef(onOpen);
  const tick = useRef(every?.run);
  close.current = onClose;
  opened.current = onOpen;
  tick.current = every?.run;
  const ms = every?.ms ?? 0;

  useEffect(() => {
    if (!open) return;
    opened.current?.();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close.current();
    }
    window.addEventListener("keydown", onKey);
    const timer = ms > 0 ? window.setInterval(() => tick.current?.(), ms) : null;
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer !== null) window.clearInterval(timer);
    };
  }, [open, ms]);
}
