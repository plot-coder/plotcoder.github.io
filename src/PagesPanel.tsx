// Pages beside the wall (R23, slice b; mock C, revised).
//
// A panel down the right: the whole script in wall order, one scene per
// card — the heading from the place (or the headline), the headline as a
// synopsis, and the scene's text, editable, with the change line greyed as
// the placeholder until a word is written. Click a card and the panel scrolls
// to its scene; put the caret in a scene and its card lights on the wall.
// Widen to the whole window and back; the width is remembered per viewer.
// Nothing here is a printed page: elements are set as a script and measured,
// pagination is slice c.

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { sceneHeading } from "./board/fountain";
import { type WallReading } from "./board/readWall";
import {
  formatPages,
  isMeasured,
  noteEighths,
  type BoardNote,
  type BoardState,
} from "./board/reducer";

type PagesPanelProps = {
  open: boolean;
  wide: boolean;
  board: BoardState;
  reading: WallReading | null;
  /** The card whose scene should be in view: the selected one, or the one just clicked. */
  focusId: string | null;
  onClose: () => void;
  onToggleWide: () => void;
  onSetText: (id: string, text: string) => void;
  /** The caret is in this scene: light its card and bring it into view. */
  onFocusScene: (id: string | null) => void;
};

export function PagesPanel({
  open,
  wide,
  board,
  reading,
  focusId,
  onClose,
  onToggleWide,
  onSetText,
  onFocusScene,
}: PagesPanelProps) {
  const byId = useMemo(() => new Map(board.notes.map((note) => [note.id, note])), [board.notes]);
  const order = useMemo(
    () => (reading ? reading.order.map((id) => byId.get(id)).filter(Boolean) as BoardNote[] : board.notes),
    [reading, byId, board.notes],
  );
  const listRef = useRef<HTMLDivElement>(null);

  // A click on a card scrolls the panel to its scene.
  useEffect(() => {
    if (!open || !focusId || !listRef.current) return;
    const target = listRef.current.querySelector<HTMLElement>(`[data-scene="${focusId}"]`);
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [open, focusId]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const el = document.activeElement as HTMLElement | null;
        if (el && el.tagName === "TEXTAREA") el.blur();
        else onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const written = order.filter((note) => isMeasured(note)).length;
  let beat = 0;

  return (
    <aside className={`pages ${wide ? "pages--wide" : ""}`} aria-label="Pages">
      <div className="pages__head">
        <p className="cast-lens__kicker">
          Pages · {order.length} {order.length === 1 ? "scene" : "scenes"} · {written} written
        </p>
        <div className="cast-lens__actions">
          <button type="button" className="cast-lens__action" onClick={onToggleWide}>
            {wide ? "Beside the wall" : "Widen"}
          </button>
          <button type="button" className="cast-lens__action" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div className="pages__sheet" ref={listRef}>
        {order.length === 0 ? (
          <p className="pages__empty">No cards yet. The script is the wall read out; add a card and its scene appears here.</p>
        ) : null}
        {order.map((note) => {
          const heading = sceneHeading(note).slice(1);
          const measured = isMeasured(note);
          const showSynopsis = heading !== note.headline.trim().toUpperCase() && note.headline.trim();
          const section = note.rank === "beat" ? `${(beat += 1)}. ${note.headline || "Untitled beat"}` : null;
          return (
            <section
              key={note.id}
              className={`scene ${note.id === focusId ? "is-focus" : ""} ${measured ? "is-measured" : ""}`}
              data-scene={note.id}
            >
              {section ? <p className="scene__section">{section}</p> : null}
              <h3 className="scene__heading">
                {heading}
                <span className="scene__measure">
                  {measured ? "" : "≈"}
                  {formatPages(noteEighths(note))} {noteEighths(note) === 8 ? "page" : "pages"} · {measured ? "measured" : "estimated"}
                </span>
              </h3>
              {showSynopsis ? <p className="scene__synopsis">= {note.headline}</p> : null}
              <SceneText
                note={note}
                onCommit={(text) => onSetText(note.id, text)}
                onFocus={() => onFocusScene(note.id)}
                onBlur={() => onFocusScene(null)}
              />
            </section>
          );
        })}
      </div>
    </aside>
  );
}

type SceneTextProps = {
  note: BoardNote;
  onCommit: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

// A plain text area set as a script: Courier, the wall's width, growing with
// the scene. Commits on a pause and on blur, like the card's lines.
function SceneText({ note, onCommit, onFocus, onBlur }: SceneTextProps) {
  const [draft, setDraft] = useState(note.text);
  const [editing, setEditing] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const ref = useRef<HTMLTextAreaElement>(null);

  // The store's copy wins while the writer is not typing here (an agent may
  // have written the scene).
  useEffect(() => {
    if (!editing) setDraft(note.text);
  }, [note.text, editing]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  function commit(text: string) {
    window.clearTimeout(timer.current);
    if (text.replace(/\s+$/, "") !== note.text) onCommit(text);
  }

  function onChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const text = event.target.value;
    setDraft(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => commit(text), 400);
  }

  return (
    <textarea
      ref={ref}
      className="scene__text"
      value={draft}
      placeholder={note.change || "What happens, in the script's words?"}
      aria-label={`Scene text of ${note.headline}`}
      spellCheck={true}
      rows={2}
      onFocus={() => {
        setEditing(true);
        onFocus();
      }}
      onBlur={() => {
        setEditing(false);
        commit(draft);
        onBlur();
      }}
      onChange={onChange}
    />
  );
}
