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
  /** The writer's words for why the when is not decided (R61), or empty. */
  whenOpen: string;
  /** Every place on the wall, in order of first appearance. */
  places: string[];
  onBegin: () => void;
  /** The place, the when, and the writer's words when the when is left open (R61). */
  onCommit: (location: string, when: string, whenOpen: string) => void;
};

/**
 * While the line is being typed, an open when is written after the dot with a
 * leading question mark — "the allotments · ? which day" — so the writer can see
 * it is their words and not a time. The mark never reaches the record: on
 * commit the words go to whenOpen and the when is blank.
 */
export const OPEN_WHEN_MARK = "?";

/** The when part of a typed line into a when, or the open words. */
export function readWhenPart(when: string): { when: string; whenOpen: string } {
  const typed = clean(when);
  if (typed.startsWith(OPEN_WHEN_MARK)) return { when: "", whenOpen: clean(typed.slice(OPEN_WHEN_MARK.length)) };
  return { when: typed, whenOpen: "" };
}

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

export function PlaceLine({ headline, location, when, whenOpen, places, onBegin, onCommit }: PlaceLineProps) {
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
    setText(joinPlaceLine(location, when || (whenOpen ? `${OPEN_WHEN_MARK} ${whenOpen}` : "")));
    setHighlight(0);
    setEditing(true);
  }

  function commit(finalText: string) {
    setEditing(false);
    const split = splitPlaceLine(finalText);
    const next = { location: split.location, ...readWhenPart(split.when) };
    if (next.location !== location || next.when !== when || next.whenOpen !== whenOpen) onCommit(next.location, next.when, next.whenOpen);
  }

  /** "Not decided yet…" after the dot (R61): the words typed there become the open words; none yet, and the caret waits for them. */
  function leaveWhenOpen() {
    const part = typed ?? splitPlaceLine(text);
    if (part.when.trim() && !part.when.trim().startsWith(OPEN_WHEN_MARK)) {
      commit(joinPlaceLine(part.location, `${OPEN_WHEN_MARK} ${part.when}`));
      return;
    }
    setText(joinPlaceLine(part.location, `${OPEN_WHEN_MARK} `));
    inputRef.current?.focus();
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
    const empty = !location && !when && !whenOpen;
    const said = [location ? `at ${location}` : "", when ? `when: ${when}` : whenOpen ? `when left open: ${whenOpen}` : ""].filter(Boolean).join(", ");
    return (
      <button
        type="button"
        className={`note__with note__at ${empty ? "note__with--empty" : ""}`}
        aria-label={empty ? `Place ${headline}` : `Place of ${headline}: ${said}`}
        onPointerDown={stop}
        onClick={begin}
      >
        <span className="note__with-prefix">at</span> {location || (when || whenOpen ? "" : "…")}
        {when || whenOpen ? (
          <>
            <span className="note__when-sep" aria-hidden="true">
              {WHEN_SEPARATOR}
            </span>
            {when ? (
              <span className="note__when">{when}</span>
            ) : (
              <span className="note__when is-open-field">
                <span className="open-mark" aria-hidden="true">
                  Open
                </span>
                {whenOpen}
              </span>
            )}
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
      {text.includes(WHEN_SEPARATOR) && !(typed?.when ?? "").trim().startsWith(OPEN_WHEN_MARK) ? (
        <button
          type="button"
          className="field-offer note__offer"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            leaveWhenOpen();
          }}
        >
          Not decided yet…
        </button>
      ) : null}
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
