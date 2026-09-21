// The card's third line: who is in the scene (R29, option C).
//
// Reads "with Maya, Tom". Tap it and type, the same gesture as the headline
// (D11). The roster completes as you type; commit hands the typed names back
// and the app resolves them — a name the roster does not know is added to it,
// so casting someone and adding them are one motion. A name with a question
// mark — "Tomás?" — is someone who may or may not be in the scene, by the
// writer's word (round twenty-two, H9): drawn quieter, counted neither way.
// And who is in it can be left open in the writer's own words, as the place
// can (round twenty-three, entries 13, 14): "Not decided yet…" puts the mark
// on the line, and the words after it stand in the warm colour — alone when
// nobody can be named, or after the names: "Ada, Callum, ? anyone else".

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { type BoardCharacter } from "./board/reducer";
import { CAST_OPEN_MARK, castLine, castLineWithOpen, readMaybe, splitCastLine } from "./board/castMaybe";
import { castText, completions, findCharacter, splitNames } from "./castNames";

type CastLineProps = {
  headline: string;
  characterIds: string[];
  maybeCharacterIds: string[];
  /** The writer's words for why who is in it is not decided, or empty. */
  castOpen: string;
  characters: BoardCharacter[];
  /** Called as editing starts, so the card can come to the top and the completion list is not under a neighbour. */
  onBegin: () => void;
  onCommit: (names: string[], open: string) => void;
};

type Option = { kind: "person"; character: BoardCharacter } | { kind: "add"; name: string };

function stop(event: PointerEvent<HTMLElement>) {
  event.stopPropagation();
}

export function CastLine({ headline, characterIds, maybeCharacterIds, castOpen, characters, onBegin, onCommit }: CastLineProps) {
  // The line as it is typed: "Marta, Tomás?", and the open words behind their mark.
  const display = castLine(characterIds, maybeCharacterIds, characters);
  const typedBack = castLineWithOpen(characterIds, maybeCharacterIds, characters, castOpen);
  const certain = castText(characterIds, characters);
  const maybe = castText(maybeCharacterIds, characters);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Once the mark is on the line the rest is the writer's words, not names: no completions there.
  const openTyped = splitCastLine(text).open !== "" || text.split(",").some((part) => part.trim().startsWith(CAST_OPEN_MARK));
  // The fragment is whatever follows the last comma: the name being typed now.
  const settled = text.slice(0, text.lastIndexOf(",") + 1);
  // The roster knows "Tomás", not "Tomás?": the mark is the writer's, the name is the person's.
  const fragment = readMaybe(text.slice(settled.length)).name;
  const typedNames = splitNames(settled).map((name) => readMaybe(name).name);
  const options: Option[] = editing && !openTyped
    ? completions(fragment, characters, typedNames).map(
        (character): Option => ({ kind: "person", character }),
      )
    : [];
  if (editing && !openTyped && fragment && !findCharacter(fragment, characters)) {
    options.push({ kind: "add", name: fragment });
  }
  const current = Math.min(highlight, Math.max(options.length - 1, 0));

  function begin() {
    onBegin();
    // With open words on the line the caret waits after them; otherwise after a comma, for the next name.
    setText(castOpen ? typedBack : display ? `${display}, ` : "");
    setHighlight(0);
    setEditing(true);
  }

  function commit(finalText: string) {
    setEditing(false);
    const typed = splitCastLine(finalText);
    const names = splitNames(typed.names);
    const before = splitNames(display);
    const same =
      names.length === before.length &&
      names.every((name, index) => name.toLowerCase() === before[index].toLowerCase());
    if (!same || typed.open !== castOpen) onCommit(names, typed.open);
  }

  /** "Not decided yet…": the mark goes on the end of the line and the caret waits for the writer's words. */
  function leaveOpen() {
    const names = text.replace(/[\s,]+$/, "");
    setText(`${names}${names ? ", " : ""}${CAST_OPEN_MARK} `);
    setHighlight(0);
    inputRef.current?.focus();
  }

  function accept(option: Option) {
    if (option.kind === "add") {
      commit(text);
      return;
    }
    // The roster's spelling, and the writer's mark kept: "tom?" completes to "Tom?".
    const mark = readMaybe(text.slice(settled.length)).maybe ? "?" : "";
    const next = `${settled}${settled ? " " : ""}${option.character.name}${mark}, `;
    setText(next);
    setHighlight(0);
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
    if (event.key === "Enter" || event.key === "Tab") {
      // Enter on a person fills them in and keeps you typing; Enter on nothing
      // (or on "add") commits the line as written.
      const option = options[current];
      if (option && (fragment || event.key === "Tab")) {
        event.preventDefault();
        accept(option);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        commit(text);
      }
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        className={`note__with ${display || castOpen ? "" : "note__with--empty"}`}
        aria-label={display || castOpen ? `Cast of ${headline}: ${typedBack}` : `Cast ${headline}`}
        onPointerDown={stop}
        onClick={begin}
      >
        <span className="note__with-prefix">with</span> {certain}
        {maybe ? (
          <span className="note__maybe">
            {certain ? ", " : ""}
            {maybe.split(", ").map((name) => `${name}?`).join(", ")}
          </span>
        ) : null}
        {castOpen ? (
          <span className="is-open-field">
            {display ? " · " : ""}
            <span className="open-mark" aria-hidden="true">
              Open
            </span>
            {castOpen}
          </span>
        ) : null}
        {display || castOpen ? "" : "…"}
      </button>
    );
  }

  return (
    <div className="note__with note__with--editing" onPointerDown={stop}>
      <span className="note__with-prefix">with</span>{" "}
      <input
        ref={inputRef}
        className="note__with-input"
        value={text}
        aria-label={`Cast of ${headline}`}
        placeholder="…"
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => {
          setText(event.target.value);
          setHighlight(0);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => commit(text)}
      />
      {!openTyped ? (
        <button
          type="button"
          className="field-offer note__offer"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            leaveOpen();
          }}
        >
          Not decided yet…
        </button>
      ) : null}
      {options.length > 0 ? (
        <ul className="note__complete" role="listbox" aria-label="People in the cast">
          {options.map((option, index) => {
            const label = option.kind === "person" ? option.character.name : `Add “${option.name}” to the cast`;
            return (
              <li
                key={option.kind === "person" ? option.character.id : "add"}
                role="option"
                aria-selected={index === current}
                className={`note__complete-item ${index === current ? "is-current" : ""} ${option.kind === "add" ? "note__complete-item--add" : ""}`}
                // mousedown, not click: a click would blur the input first and
                // commit the half-typed line before the choice landed.
                onMouseDown={(event) => {
                  event.preventDefault();
                  accept(option);
                }}
                onMouseEnter={() => setHighlight(index)}
              >
                {label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
