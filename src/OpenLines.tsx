// Open questions about the story (R70; round twenty-three, entries 15, 16;
// the words made plain 2026-09-27, drawn in
// docs/mockups/the-title-area-in-plain-words.html).
//
// A writer's "I don't know" about the film itself — when it happens, whether
// it has acts, what runs long — is true of no one card, so no card's open can
// hold it. These are the writer's own sentences, under the logline: closed to
// a count until opened, a line struck when it is decided. The app never adds
// one, and the reading lists them and asks nothing. The title area opens this
// panel and closes it, so only one of its fields is open at a time.

import { useRef, useState, type KeyboardEvent } from "react";

type OpenLinesProps = {
  lines: string[];
  onAdd: (text: string) => void;
  onStrike: (index: number) => void;
};

export function OpenLines({ lines, onAdd, onStrike }: OpenLinesProps) {
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
      inputRef.current?.blur();
    }
  }

  return (
    <div className="open-lines title-panel">
      <h3 className="title-panel__head">Open questions about the story</h3>
      <p className="title-panel__say">What you have not decided that belongs to no one scene. The wall lists them and never asks you about them.</p>
      <ul className="open-lines__list" aria-label="Open questions about the story">
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
        aria-label="An open question about the story"
        placeholder={lines.length ? "Another, in your words" : "In your words: whether it has acts; when it happens"}
        spellCheck={true}
        autoComplete="off"
        autoFocus
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
      />
    </div>
  );
}
