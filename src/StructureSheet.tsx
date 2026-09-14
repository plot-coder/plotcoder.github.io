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
import { compareStructure, driftWord, MATCH_PAGES, NEAR_PAGES } from "./board/compareStructure";
import type { OwnStructure } from "./board/project";

type StructureSheetProps = {
  open: boolean;
  board: BoardState;
  /** The writer's own structures, saved from a wall's beats (Roadmap 2, item 7). */
  own: OwnStructure[];
  onClose: () => void;
  onApply: (templateId: string) => void;
  onSave: (name: string) => void;
  onForget: (id: string) => void;
  /** The structure shown on the story map's strip, if any (R52). */
  stripId: string | null;
  onStrip: (id: string | null) => void;
};

export function StructureSheet({ open, board, own, onClose, onApply, onSave, onForget, stripId, onStrip }: StructureSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [chosenId, setChosenId] = useState(TEMPLATES[0].id);
  const [saveName, setSaveName] = useState("");
  const all = [...TEMPLATES, ...own.map((structure) => ({ ...structure, blurb: "your own, saved from a wall" }))];
  const chosen = all.find((template) => template.id === chosenId) ?? TEMPLATES[0];
  const isOwn = own.some((structure) => structure.id === chosen.id);

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
  // The structure beside the wall (R52): a reading, so it costs nothing to show.
  const comparison = beats > 0 ? compareStructure(board, chosen.beats) : null;
  const shownOnStrip = stripId === chosen.id;
  const verb =
    beats > 0
      ? `Lay out ${count} beats beside the ${beats} you have`
      : scenes > 0
        ? `Lay out ${count} beats above the wall`
        : `Lay out ${count} beats`;
  const note =
    beats > 0
      ? `Under each of the ${count}: the nearest of your ${beats} ${beats === 1 ? "beat" : "beats"} by page, within ${MATCH_PAGES} pages, and how far off it is. Nothing here moves a card; laying them out still makes ${count} cards above yours.`
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
            {all.map((template) => (
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
              {chosen.name} · {chosen.blurb} ·{" "}
              {comparison ? `beside this wall's ${beats} ${beats === 1 ? "beat" : "beats"}, of ${formatPages(board.targetEighths)} pages` : `near these pages of ${formatPages(board.targetEighths)}`}
            </p>
            <ol className="structure__beats">
              {chosen.beats.map((item, index) => {
                const row = comparison?.rows[index] ?? null;
                const word = row ? driftWord(row.drift) : null;
                const off = row?.drift !== null && row?.drift !== undefined && Math.abs(row.drift) > NEAR_PAGES;
                return (
                  <li key={item.name} className={`structure__beat ${row ? "structure__beat--compared" : ""}`}>
                    <span className="structure__n">{index + 1}</span>
                    <span className="structure__headline">{item.name}</span>
                    <span className="structure__pg">p. {beatPage(item.at, board.targetEighths)}</span>
                    {row ? (
                      <span className={`structure__yours ${off ? "is-off" : ""}`}>
                        {row.match ? (
                          <>
                            yours: <i>“{row.match.headline}”</i> p. {row.match.page} · {word}
                          </>
                        ) : row.beyond ? (
                          <>nothing yet — past p. {comparison?.soFar}, the story so far</>
                        ) : (
                          <>none of yours within {MATCH_PAGES} pages</>
                        )}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <button type="button" className="project-action structure__apply" onClick={() => onApply(chosen.id)}>
              {verb}
            </button>
            <button
              type="button"
              className="project-action project-action--ghost structure__apply"
              aria-pressed={shownOnStrip}
              onClick={() => onStrip(shownOnStrip ? null : chosen.id)}
            >
              {shownOnStrip ? `Take ${chosen.name} off the strip` : `Show ${chosen.name} on the strip`}
            </button>
            {isOwn ? (
              <button type="button" className="project-action project-action--ghost structure__apply" onClick={() => onForget(chosen.id)}>
                Forget this one
              </button>
            ) : null}
            {note ? <p className="structure__note">{note}</p> : null}
            {beats > 0 ? (
              <form
                className="structure__save"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!saveName.trim()) return;
                  onSave(saveName.trim());
                  setSaveName("");
                }}
              >
                <input
                  className="cast-lens__input"
                  value={saveName}
                  placeholder={`Save this wall's ${beats} ${beats === 1 ? "beat" : "beats"} as a structure…`}
                  aria-label="Save this wall's beats as a structure"
                  onChange={(event) => setSaveName(event.target.value)}
                />
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
