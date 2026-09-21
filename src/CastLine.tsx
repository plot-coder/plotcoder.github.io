// The card's third line: who is in the scene (R29, option C).
//
// Reads "with Maya, Tom". Tap it and type, the same gesture as the headline
// (D11). The roster completes as you type; commit hands the typed names back
// and the app resolves them — a name the roster does not know is added to it,
// so casting someone and adding them are one motion. A name with a question
// mark — "Tomás?" — is someone who may or may not be in the scene, by the
// writer's word (round twenty-two, H9): drawn quieter, counted neither way.

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { type BoardCharacter } from "./board/reducer";
import { castLine, readMaybe } from "./board/castMaybe";
import { castText, completions, findCharacter, splitNames } from "./castNames";

type CastLineProps = {
  headline: string;
  characterIds: string[];
  maybeCharacterIds: string[];
  characters: BoardCharacter[];
  /** Called as editing starts, so the card can come to the top and the completion list is not under a neighbour. */
  onBegin: () => void;
  onCommit: (names: string[]) => void;
};

type Option = { kind: "person"; character: BoardCharacter } | { kind: "add"; name: string };

function stop(event: PointerEvent<HTMLElement>) {
  event.stopPropagation();
}

export function CastLine({ headline, characterIds, maybeCharacterIds, characters, onBegin, onCommit }: CastLineProps) {
  // The line as it is typed: "Marta, Tomás?".
  const display = castLine(characterIds, maybeCharacterIds, characters);
  const certain = castText(characterIds, characters);
  const maybe = castText(maybeCharacterIds, characters);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // The fragment is whatever follows the last comma: the name being typed now.
  const settled = text.slice(0, text.lastIndexOf(",") + 1);
  // The roster knows "Tomás", not "Tomás?": the mark is the writer's, the name is the person's.
  const fragment = readMaybe(text.slice(settled.length)).name;
  const typedNames = splitNames(settled).map((name) => readMaybe(name).name);
  const options: Option[] = editing
    ? completions(fragment, characters, typedNames).map(
        (character): Option => ({ kind: "person", character }),
      )
    : [];
  if (editing && fragment && !findCharacter(fragment, characters)) {
    options.push({ kind: "add", name: fragment });
  }
  const current = Math.min(highlight, Math.max(options.length - 1, 0));

  function begin() {
    onBegin();
    setText(display ? `${display}, ` : "");
    setHighlight(0);
    setEditing(true);
  }

  function commit(finalText: string) {
    setEditing(false);
    const names = splitNames(finalText);
    const before = splitNames(display);
    const same =
      names.length === before.length &&
      names.every((name, index) => name.toLowerCase() === before[index].toLowerCase());
    if (!same) onCommit(names);
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
        className={`note__with ${display ? "" : "note__with--empty"}`}
        aria-label={display ? `Cast of ${headline}: ${display}` : `Cast ${headline}`}
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
        {display ? "" : "…"}
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
