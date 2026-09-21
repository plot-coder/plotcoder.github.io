// Not decided yet, about the film (round twenty-three, entries 15, 16).
//
// A writer's "I don't know" about the film itself — when it happens, whether
// it has acts, what runs long — is true of no one card, so no card's open can
// hold it. These are the writer's own sentences, under the logline: closed to
// a count until opened, a line struck when it is decided. The app never adds
// one, and the reading lists them and asks nothing.

import { useRef, useState, type KeyboardEvent } from "react";

type OpenLinesProps = {
  lines: string[];
  onAdd: (text: string) => void;
  onStrike: (index: number) => void;
};

export function OpenLines({ lines, onAdd, onStrike }: OpenLinesProps) {
  const [shown, setShown] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function add() {
    const line = text.trim();
    if (line) onAdd(line);
    setText("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      add();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setText("");
      setShown(lines.length > 0 && shown);
      inputRef.current?.blur();
    }
  }

  if (!shown) {
    return (
      <button
        type="button"
        className={`open-lines__toggle ${lines.length ? "has-lines" : ""}`}
        aria-expanded={false}
        onClick={() => setShown(true)}
      >
        {lines.length ? `Not decided yet, about the film · ${lines.length}` : "Something about the film not decided yet…"}
      </button>
    );
  }

  return (
    <div className="open-lines">
      <button type="button" className="open-lines__toggle has-lines" aria-expanded={true} onClick={() => setShown(false)}>
        Not decided yet, about the film{lines.length ? ` · ${lines.length}` : ""}
      </button>
      <ul className="open-lines__list" aria-label="Not decided yet, about the film">
        {lines.map((line, index) => (
          <li key={line} className="open-lines__line">
            <span className="is-open-field">{line}</span>
            <button type="button" className="open-lines__strike" aria-label={`Decided: strike "${line}"`} onClick={() => onStrike(index)}>
              decided
            </button>
          </li>
        ))}
      </ul>
      <input
        ref={inputRef}
        className="open-lines__input"
        value={text}
        aria-label="Something about the film that is not decided yet"
        placeholder="in your words: whether it has acts; when it happens…"
        spellCheck={true}
        autoComplete="off"
        autoFocus={lines.length === 0}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
      />
    </div>
  );
}
