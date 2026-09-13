// The card's fourth line: where the scene happens (R37).
//
// Reads "at the piano shop". Tap it and type, the same gesture as the cast
// line (D11). Places already on the wall complete as you type — spelling, not
// a roster: a new place is just typed, and it is offered on the next card.
// Empty, the line is an invitation on hover only, so a wall with no places
// looks exactly as it did.

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type PlaceLineProps = {
  headline: string;
  location: string;
  /** Every place on the wall, in order of first appearance. */
  places: string[];
  onBegin: () => void;
  onCommit: (location: string) => void;
};

function stop(event: PointerEvent<HTMLElement>) {
  event.stopPropagation();
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

export function PlaceLine({ headline, location, places, onBegin, onCommit }: PlaceLineProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const options = editing ? placeCompletions(text, places) : [];
  const current = Math.min(highlight, Math.max(options.length - 1, 0));

  function begin() {
    onBegin();
    setText(location);
    setHighlight(0);
    setEditing(true);
  }

  function commit(finalText: string) {
    setEditing(false);
    const next = finalText.trim().replace(/\s+/g, " ");
    if (next !== location) onCommit(next);
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
      commit(options[current]);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      // Enter on a lit completion takes it; Enter on your own words keeps them.
      const option = options[current];
      commit(option && text.trim() && option.toLowerCase().startsWith(text.trim().toLowerCase()) && highlight > 0 ? option : text);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        className={`note__with note__at ${location ? "" : "note__with--empty"}`}
        aria-label={location ? `Place of ${headline}: ${location}` : `Place ${headline}`}
        onPointerDown={stop}
        onClick={begin}
      >
        <span className="note__with-prefix">at</span> {location || "…"}
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
        placeholder="where?"
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
                commit(place);
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
