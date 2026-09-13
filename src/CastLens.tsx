// The cast lens (R29, option 2): the roster as a way of seeing the wall.
//
// A panel that stays open while you work. Hover a name and their cards stay
// bright while the rest fade; click to hold it. Rename in place, remove, add.
// The line at the foot is read-the-wall's question about that person, if it
// has one. Later a name opens a page — what they look like, the details you
// pull up — without this changing shape.

import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { type WallReading } from "./board/readWall";
import { type BoardCharacter, type BoardNote } from "./board/reducer";
import { EditableText } from "./EditableText";

type CastLensProps = {
  open: boolean;
  characters: BoardCharacter[];
  notes: BoardNote[];
  reading: WallReading | null;
  hoverId: string | null;
  heldId: string | null;
  onOpen: () => void;
  onClose: () => void;
  onHover: (id: string | null) => void;
  onHold: (id: string | null) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
};

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(
    el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable),
  );
}

export function CastLens({
  open,
  characters,
  notes,
  reading,
  hoverId,
  heldId,
  onOpen,
  onClose,
  onHover,
  onHold,
  onAdd,
  onRename,
  onRemove,
}: CastLensProps) {
  const titleId = useId();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !isTyping(event.target)) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const focusId = heldId ?? hoverId;
  const focus = characters.find((character) => character.id === focusId) ?? null;
  const question = focus
    ? reading?.findings.find(
        (finding) =>
          (finding.kind === "uncast" || finding.kind === "absent") && finding.ids[0] === focus.id,
      ) ?? null
    : null;

  function countFor(id: string): number {
    return notes.filter((note) => note.characterIds.includes(id)).length;
  }

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    onAdd(name);
    setDraft("");
  }

  function onDraftKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft("");
      event.currentTarget.blur();
    }
  }

  return (
    <>
      <button
        type="button"
        className={`cast-launch ${open ? "is-open" : ""}`}
        aria-pressed={open}
        aria-controls={titleId}
        onClick={open ? onClose : onOpen}
      >
        Cast
      </button>

      {open ? (
        <section
          id={titleId}
          className="cast-lens"
          aria-label="Cast"
          onMouseLeave={() => onHover(null)}
        >
          <div className="cast-lens__head">
            <p className="cast-lens__kicker">
              Cast · {characters.length}
            </p>
            <div className="cast-lens__actions">
              {heldId ? (
                <button type="button" className="cast-lens__action" onClick={() => onHold(null)}>
                  Clear
                </button>
              ) : null}
              <button type="button" className="cast-lens__action" onClick={onClose}>
                Close
              </button>
            </div>
          </div>

          {characters.length > 0 ? (
            <ul className="cast-lens__list">
              {characters.map((character) => {
                const count = countFor(character.id);
                const held = heldId === character.id;
                const lit = focusId === character.id;
                return (
                  <li
                    key={character.id}
                    className={`cast-lens__row ${lit ? "is-focus" : ""} ${held ? "is-held" : ""}`}
                    onMouseEnter={() => onHover(character.id)}
                    onClick={(event) => {
                      if (isTyping(event.target)) return;
                      onHold(held ? null : character.id);
                    }}
                  >
                    <EditableText
                      as="span"
                      className="cast-lens__name"
                      value={character.name}
                      onCommit={(name) => {
                        if (name) onRename(character.id, name);
                      }}
                      ariaLabel={`Name of ${character.name}`}
                      placeholder="Name"
                    />
                    <span className={`cast-lens__count ${count === 0 ? "is-none" : ""}`}>
                      {count === 0 ? "no card" : count === 1 ? "1 card" : `${count} cards`}
                    </span>
                    <button
                      type="button"
                      className="cast-lens__remove"
                      aria-label={`Remove ${character.name} from the cast`}
                      title="Remove from the cast"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove(character.id);
                      }}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="cast-lens__empty">No one yet. Add someone below, or type a name on a card.</p>
          )}

          <form className="cast-lens__add" onSubmit={add}>
            <input
              className="cast-lens__input"
              value={draft}
              placeholder="Add someone…"
              aria-label="Add someone to the cast"
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onDraftKey}
            />
          </form>

          {focus ? (
            <p className="cast-lens__foot">
              {question ? question.text : `${focus.name}: nothing to ask.`}
            </p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
