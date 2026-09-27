// The card's fifth line: which day of the film's time the scene falls on, and
// its light (R78, drawn in docs/mockups/r78-a-scenes-day-and-light.html, A).
//
// Reads "day four · rain on the window", a shade dimmer than the place line
// above it. Tap it and type, the same gesture: the day before the dot, the
// light after, and a question mark before either half leaves it open in the
// writer's words. Empty, the line takes no room until the pointer is on the
// place line above it, the card is being typed on, or it is selected — so a
// wall with no days looks exactly as it did. The heading never prints either; the
// pages and the brief carry them as a note under it.

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { OPEN_WHEN_MARK, WHEN_SEPARATOR, readWhenPart, splitPlaceLine } from "./PlaceLine";

type DayLineProps = {
  headline: string;
  day: string;
  light: string;
  dayOpen: string;
  lightOpen: string;
  onBegin: () => void;
  onCommit: (day: string, light: string, dayOpen: string, lightOpen: string) => void;
};

function stop(event: PointerEvent<HTMLElement>) {
  event.stopPropagation();
}

/** The two halves as one line for typing: "day four · rain", the day alone, or "· rain" when only the light is set. */
export function joinDayLine(day: string, light: string): string {
  if (!light) return day;
  return `${day} ${WHEN_SEPARATOR} ${light}`.trim();
}

export function DayLine({ headline, day, light, dayOpen, lightOpen, onBegin, onCommit }: DayLineProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function begin() {
    onBegin();
    setText(joinDayLine(day || (dayOpen ? `${OPEN_WHEN_MARK} ${dayOpen}` : ""), light || (lightOpen ? `${OPEN_WHEN_MARK} ${lightOpen}` : "")));
    setEditing(true);
  }

  function commit(finalText: string) {
    setEditing(false);
    const split = splitPlaceLine(finalText);
    const dayPart = readWhenPart(split.location);
    const lightPart = readWhenPart(split.when);
    const next = { day: dayPart.when, dayOpen: dayPart.whenOpen, light: lightPart.when, lightOpen: lightPart.whenOpen };
    if (next.day !== day || next.light !== light || next.dayOpen !== dayOpen || next.lightOpen !== lightOpen) onCommit(next.day, next.light, next.dayOpen, next.lightOpen);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setEditing(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      commit(text);
    }
  }

  if (!editing) {
    const empty = !day && !light && !dayOpen && !lightOpen;
    const said = [day ? `day: ${day}` : dayOpen ? `day left open: ${dayOpen}` : "", light ? `light: ${light}` : lightOpen ? `light left open: ${lightOpen}` : ""].filter(Boolean).join(", ");
    return (
      <button
        type="button"
        className={`note__with note__day ${empty ? "note__with--empty" : ""}`}
        aria-label={empty ? `Day and light of ${headline}` : `Day and light of ${headline}: ${said}`}
        onPointerDown={stop}
        onClick={begin}
      >
        {day ? (
          day
        ) : dayOpen ? (
          <span className="is-open-field">
            <span className="open-mark" aria-hidden="true">
              Open
            </span>
            {dayOpen}
          </span>
        ) : light || lightOpen ? (
          ""
        ) : (
          "day · light …"
        )}
        {light || lightOpen ? (
          <>
            {day || dayOpen ? (
              <span className="note__when-sep" aria-hidden="true">
                {WHEN_SEPARATOR}
              </span>
            ) : null}
            {light ? (
              <span className="note__when">{light}</span>
            ) : (
              <span className="note__when is-open-field">
                <span className="open-mark" aria-hidden="true">
                  Open
                </span>
                {lightOpen}
              </span>
            )}
          </>
        ) : null}
      </button>
    );
  }

  return (
    <div className="note__with note__with--editing note__day" onPointerDown={stop}>
      <input
        ref={inputRef}
        className="note__with-input"
        value={text}
        aria-label={`Day and light of ${headline}`}
        placeholder="which day? · what light?"
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(text)}
      />
    </div>
  );
}
