// Open questions about the story (R70; round twenty-three, entries 15, 16).
//
// A writer's "I don't know" about the film itself — when it happens, whether
// it has acts, what runs long — is true of no one card, so no card's open can
// hold it. These are the writer's own sentences: a line struck when it is
// decided. The app never adds one, and the reading lists them and asks
// nothing. A section of the story panel (src/Logline.tsx).

import { useRef, useState, type KeyboardEvent } from "react";

type OpenLinesProps = {
  lines: string[];
  onAdd: (text: string) => void;
  onStrike: (index: number) => void;
  /** Escape in the field closes the panel, and keeps nothing half typed. */
  onClose: () => void;
};

export function OpenLines({ lines, onAdd, onStrike, onClose }: OpenLinesProps) {
  const [text, setText] = useState("");
  /** Set as Escape leaves, so the field's leaving does not keep what was half typed. */
  const escaping = useRef(false);

  function add() {
    if (escaping.current) return;
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
      event.stopPropagation();
      escaping.current = true;
      setText("");
      onClose();
    }
  }

  return (
    <>
      {lines.length ? (
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
      ) : null}
      <input
        className="open-lines__input"
        value={text}
        aria-label="An open question about the story"
        placeholder={lines.length ? "Another, in your words" : "In your words: whether it has acts; when it happens"}
        spellCheck={true}
        autoComplete="off"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
      />
    </>
  );
}
