// Start from a structure (R38).
//
// The five structures on the left, the chosen one's beats on the right with
// the page each tends to fall near on this board's target, and one button
// that says what it will do to this wall before it does it. Opened from the
// bar's Structure button and from the empty wall's hint. Applying is one
// kernel command, so ⌘Z takes the whole structure back.

import { useEffect, useId, useRef, useState } from "react";
import { countRanks, formatPages, type BoardState } from "./board/reducer";
import { beatPage, TEMPLATES } from "./board/templates";

type StructureSheetProps = {
  open: boolean;
  board: BoardState;
  onClose: () => void;
  onApply: (templateId: string) => void;
};

export function StructureSheet({ open, board, onClose, onApply }: StructureSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [chosenId, setChosenId] = useState(TEMPLATES[0].id);
  const chosen = TEMPLATES.find((template) => template.id === chosenId) ?? TEMPLATES[0];

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const { beats, scenes } = countRanks(board);
  const count = chosen.beats.length;
  const verb =
    beats > 0
      ? `Lay out ${count} beats beside the ${beats} you have`
      : scenes > 0
        ? `Lay out ${count} beats above the wall`
        : `Lay out ${count} beats`;
  const note =
    beats > 0
      ? `This wall already has ${beats} ${beats === 1 ? "beat" : "beats"}. These ${count} go in above them; delete the ones you do not need.`
      : scenes > 0
        ? `This wall has ${scenes} ${scenes === 1 ? "scene" : "scenes"} and no beats. The beats go in a row above them; Organize then gives each beat its row.`
        : null;

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close structure" onClick={onClose} />
      <div className="modal modal--structure" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">Structure</p>
            <h2 id={titleId} className="modal__title">
              Start from a structure
            </h2>
          </div>
          <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="project-copy">
          Named beats laid on the wall to fill in between. Cards like any other: rename, move, delete.
          Undo takes them all back.
        </p>

        <div className="structure">
          <ul className="structure__list" aria-label="Structures">
            {TEMPLATES.map((template) => (
              <li key={template.id}>
                <button
                  type="button"
                  className={`structure__choice ${template.id === chosen.id ? "is-on" : ""}`}
                  aria-pressed={template.id === chosen.id}
                  onClick={() => setChosenId(template.id)}
                >
                  <span className="structure__name">{template.name}</span>
                  <span className="structure__count">{template.beats.length}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="structure__preview">
            <p className="cast-lens__kicker">
              {chosen.name} · {chosen.blurb} · near these pages of {formatPages(board.targetEighths)}
            </p>
            <ol className="structure__beats">
              {chosen.beats.map((item, index) => (
                <li key={item.name} className="structure__beat">
                  <span className="structure__n">{index + 1}</span>
                  <span className="structure__headline">{item.name}</span>
                  <span className="structure__pg">p. {beatPage(item.at, board.targetEighths)}</span>
                </li>
              ))}
            </ol>
            <button type="button" className="project-action structure__apply" onClick={() => onApply(chosen.id)}>
              {verb}
            </button>
            {note ? <p className="structure__note">{note}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
