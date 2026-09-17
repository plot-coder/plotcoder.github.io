// The card's fourth line: where the scene happens (R37), and when (R55).
//
// Reads "at the piano shop · night". Tap it and type, the same gesture as the
// cast line (D11); the when is the part after the dot, as the heading will
// print it (THE PIANO SHOP - NIGHT), and a line with no dot is a place alone.
// Places already on the wall complete as you type — spelling, not a roster: a
// new place is just typed, and it is offered on the next card. Empty, the line
// is an invitation on hover only, so a wall with no places looks exactly as it
// did.

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type PlaceLineProps = {
  headline: string;
  location: string;
  when: string;
  /** Every place on the wall, in order of first appearance. */
  places: string[];
  onBegin: () => void;
  onCommit: (location: string, when: string) => void;
};

/** The dot between the place and the when on the card. */
export const WHEN_SEPARATOR = "·";

function stop(event: PointerEvent<HTMLElement>) {
  event.stopPropagation();
}

function clean(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * One line back into its two parts. The dot is the card's own mark; a spaced
 * hyphen is accepted too, because that is how the heading prints it and how a
 * hand used to Final Draft will type it. The last mark wins, so a place that
 * carries a hyphen of its own ("the lay-by") is left whole.
 */
export function splitPlaceLine(text: string): { location: string; when: string } {
  const line = clean(text);
  const dot = line.lastIndexOf(WHEN_SEPARATOR);
  if (dot >= 0) return { location: clean(line.slice(0, dot)), when: clean(line.slice(dot + 1)) };
  const dash = /^(.*\S)\s+-\s+(\S.*)$/.exec(line);
  if (dash) return { location: clean(dash[1]), when: clean(dash[2]) };
  return { location: line, when: "" };
}

/** The two parts as one line for typing: "the pier at Fenit · night", or the place alone. */
export function joinPlaceLine(location: string, when: string): string {
  if (!when) return location;
  return `${location} ${WHEN_SEPARATOR} ${when}`;
}

/** Places that start with the fragment, then places that contain it; never the exact one. */
export function placeCompletions(fragment: string, places: string[]): string[] {
  const needle = fragment.trim().toLowerCase();
  if (!needle) return places.slice(0, 6);
  const starts = places.filter((place) => place.toLowerCase().startsWith(needle));
  const contains = places.filter(
    (place) => !place.toLowerCase().startsWith(needle) && place.toLowerCase().includes(needle),
  );
  return [...starts, ...contains].filter((place) => place.toLowerCase() !== needle).slice(0, 6);
}

export function PlaceLine({ headline, location, when, places, onBegin, onCommit }: PlaceLineProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Completion reads the place part only; the when after the dot is the writer's.
  const typed = editing ? splitPlaceLine(text) : null;
  const options = typed ? placeCompletions(typed.location, places) : [];
  const current = Math.min(highlight, Math.max(options.length - 1, 0));

  function begin() {
    onBegin();
    setText(joinPlaceLine(location, when));
    setHighlight(0);
    setEditing(true);
  }

  function commit(finalText: string) {
    setEditing(false);
    const next = splitPlaceLine(finalText);
    if (next.location !== location || next.when !== when) onCommit(next.location, next.when);
  }

  /** A completion taken keeps whatever when the line already carried. */
  function take(place: string) {
    commit(joinPlaceLine(place, typed?.when ?? ""));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setEditing(false);
      return;
    }
    if (event.key === "ArrowDown" && options.length > 0) {
      event.preventDefault();
      setHighlight((current + 1) % options.length);
      return;
    }
    if (event.key === "ArrowUp" && options.length > 0) {
      event.preventDefault();
      setHighlight((current - 1 + options.length) % options.length);
      return;
    }
    if (event.key === "Tab" && options[current]) {
      event.preventDefault();
      take(options[current]);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      // Enter on a lit completion takes it; Enter on your own words keeps them.
      const option = options[current];
      const fragment = typed?.location.trim().toLowerCase() ?? "";
      if (option && fragment && option.toLowerCase().startsWith(fragment) && highlight > 0) take(option);
      else commit(text);
    }
  }

  if (!editing) {
    const empty = !location && !when;
    const said = [location ? `at ${location}` : "", when ? `when: ${when}` : ""].filter(Boolean).join(", ");
    return (
      <button
        type="button"
        className={`note__with note__at ${empty ? "note__with--empty" : ""}`}
        aria-label={empty ? `Place ${headline}` : `Place of ${headline}: ${said}`}
        onPointerDown={stop}
        onClick={begin}
      >
        <span className="note__with-prefix">at</span> {location || (when ? "" : "…")}
        {when ? (
          <>
            <span className="note__when-sep" aria-hidden="true">
              {WHEN_SEPARATOR}
            </span>
            <span className="note__when">{when}</span>
          </>
        ) : null}
      </button>
    );
  }

  return (
    <div className="note__with note__with--editing" onPointerDown={stop}>
      <span className="note__with-prefix">at</span>{" "}
      <input
        ref={inputRef}
        className="note__with-input"
        value={text}
        aria-label={`Place of ${headline}`}
        placeholder="where? · when?"
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => {
          setText(event.target.value);
          setHighlight(0);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => commit(text)}
      />
      {options.length > 0 ? (
        <ul className="note__complete" role="listbox" aria-label="Places on the wall">
          {options.map((place, index) => (
            <li
              key={place}
              role="option"
              aria-selected={index === current}
              className={`note__complete-item ${index === current ? "is-current" : ""}`}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                take(place);
              }}
            >
              {place}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
