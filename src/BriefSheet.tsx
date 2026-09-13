// The brief (R28, first step): everything the wall knows about a segment —
// one card, or several in wall order — in the order a video tool would need
// it. Text to read and approve, with Copy; a wrong brief is fixed on the
// cards. Nothing is generated or sent, and no video tool is chosen.

import { useEffect, useId, useRef, useState } from "react";
import { readingOrder } from "./board/readWall";
import { type BoardState } from "./board/reducer";
import { segmentBrief } from "./board/workflows";

type BriefSheetProps = {
  open: boolean;
  board: BoardState;
  ids: string[];
  title: string;
  onClose: () => void;
};

export function BriefSheet({ open, board, ids, title, onClose }: BriefSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const wanted = new Set(ids);
  const ordered = readingOrder(board.notes).filter((note) => wanted.has(note.id)).map((note) => note.id);
  const brief = segmentBrief(board, ordered, { title }) ?? "";
  const first = board.notes.find((note) => note.id === ordered[0]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
    } catch {
      /* the text is on screen to select */
    }
  }

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close brief" onClick={onClose} />
      <div className="modal modal--structure" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">Segment · {ordered.length === 1 ? "one scene" : `${ordered.length} scenes`}</p>
            <h2 id={titleId} className="modal__title">
              Brief: {ordered.length === 1 ? first?.headline : "a run of scenes"}
            </h2>
          </div>
          <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="project-copy">
          Everything the wall knows about this segment, in the order a video tool would need it. Fix it on
          the cards, then hand it on. Nothing is made here.
        </p>
        <pre className="brief">{brief}</pre>
        <div className="project-actions">
          <button type="button" className="project-action" onClick={() => void copy()}>
            {copied ? "Copied" : "Copy the brief"}
          </button>
        </div>
      </div>
    </div>
  );
}
