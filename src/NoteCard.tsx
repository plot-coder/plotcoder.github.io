import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { NOTE_COLORS, type MockNote, type NoteColor } from "./noteMock";

type Field = "headline" | "change";

function syncText(element: HTMLElement | null, value: string) {
  if (!element) return;
  if (document.activeElement === element) return;
  if (element.textContent === value) return;
  element.textContent = value;
}

type NoteCardProps = {
  note: MockNote;
  active: boolean;
  selected: boolean;
  linking: boolean;
  dropTarget: boolean;
  onPointerDown: (event: PointerEvent<HTMLElement>, note: MockNote) => void;
  onArrowPointerDown: (event: PointerEvent<HTMLElement>, note: MockNote) => void;
  onRecolor: (id: string, color: NoteColor) => void;
  onEdit: (id: string, patch: { headline?: string; change?: string }) => void;
};

export function NoteCard({
  note,
  active,
  selected,
  linking,
  dropTarget,
  onPointerDown,
  onArrowPointerDown,
  onRecolor,
  onEdit,
}: NoteCardProps) {
  const [picking, setPicking] = useState(false);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const changeRef = useRef<HTMLParagraphElement>(null);
  const timers = useRef<Record<Field, number | undefined>>({
    headline: undefined,
    change: undefined,
  });

  useEffect(() => {
    if (active) setPicking(false);
  }, [active]);

  // The words are uncontrolled: React never renders them as children, so it can
  // never rewrite the text out from under the caret. We push the value in only
  // when the field is not being typed in.
  useEffect(() => {
    syncText(headlineRef.current, note.headline);
  }, [note.headline]);

  useEffect(() => {
    syncText(changeRef.current, note.change);
  }, [note.change]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      window.clearTimeout(pending.headline);
      window.clearTimeout(pending.change);
    };
  }, []);

  function commit(field: Field, element: HTMLElement | null) {
    if (!element) return;
    const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text === note[field]) return;
    onEdit(note.id, field === "headline" ? { headline: text } : { change: text });
  }

  function scheduleCommit(field: Field, element: HTMLElement | null) {
    window.clearTimeout(timers.current[field]);
    timers.current[field] = window.setTimeout(() => commit(field, element), 250);
  }

  function flushCommit(field: Field, element: HTMLElement | null) {
    window.clearTimeout(timers.current[field]);
    commit(field, element);
  }

  function onTextKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== "Escape") return;
    event.preventDefault();
    event.currentTarget.blur();
  }

  function onTextPaste(event: ClipboardEvent<HTMLElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain").replace(/\s+/g, " ");
    document.execCommand("insertText", false, text);
  }

  return (
    <article
      className={`note note--${note.color} ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${linking ? "is-linking" : ""} ${dropTarget ? "is-drop-target" : ""} ${picking ? "is-picking" : ""}`}
      style={{
        left: note.x,
        top: note.y,
        zIndex: note.z + 10,
        transform: `rotate(${note.rotate}deg)`,
      }}
      onPointerDown={(event) => onPointerDown(event, note)}
    >
      <h3
        ref={headlineRef}
        className="note__headline"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        aria-label="Card headline"
        data-placeholder="Headline"
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={onTextKeyDown}
        onPaste={onTextPaste}
        onInput={() => scheduleCommit("headline", headlineRef.current)}
        onBlur={() => flushCommit("headline", headlineRef.current)}
      />
      <p
        ref={changeRef}
        className="note__change"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        aria-label="What changes"
        data-placeholder="What changes?"
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={onTextKeyDown}
        onPaste={onTextPaste}
        onInput={() => scheduleCommit("change", changeRef.current)}
        onBlur={() => flushCommit("change", changeRef.current)}
      />
      <button
        type="button"
        className="note__handle"
        aria-label={`Draw arrow from ${note.headline}`}
        onPointerDown={(event) => {
          event.stopPropagation();
          onArrowPointerDown(event, note);
        }}
      />
      <button
        type="button"
        className="note__color"
        aria-label={`Change color of ${note.headline}`}
        aria-expanded={picking}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => setPicking((open) => !open)}
      >
        <span className="note__color-stack" aria-hidden="true">
          <span className="note__color-chip note__color-chip--yellow" />
          <span className="note__color-chip note__color-chip--pink" />
          <span className="note__color-chip note__color-chip--blue" />
        </span>
      </button>
      {picking ? (
        <div className="note__swatches" onPointerDown={(event) => event.stopPropagation()}>
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`note__swatch note__swatch--${color} ${note.color === color ? "is-current" : ""}`}
              aria-label={`${color} paper`}
              aria-pressed={note.color === color}
              onClick={() => {
                onRecolor(note.id, color);
                setPicking(false);
              }}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
