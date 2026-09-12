import { useEffect, useState, type PointerEvent } from "react";
import { EditableText } from "./EditableText";
import { NOTE_COLORS, type MockNote, type NoteColor } from "./noteMock";

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

  useEffect(() => {
    if (active) setPicking(false);
  }, [active]);

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
      <EditableText
        as="h3"
        className="note__headline"
        value={note.headline}
        onCommit={(text) => onEdit(note.id, { headline: text })}
        ariaLabel="Card headline"
        placeholder="Headline"
      />
      <EditableText
        as="p"
        className="note__change"
        value={note.change}
        onCommit={(text) => onEdit(note.id, { change: text })}
        ariaLabel="What changes"
        placeholder="What changes?"
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
