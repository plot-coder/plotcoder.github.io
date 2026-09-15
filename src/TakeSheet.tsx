// Take the pages with you (R54): one sheet from the Pages head for every way
// the script leaves the app. Markdown and plain text for a collaborator who
// lives in Google Docs — Copy first, because a paste is the shorter road there
// than a download and an upload — then Fountain, Final Draft, and PDF through
// the browser's print. The transfer sheet keeps Save and Open project, which
// are the project and not the pages (combine log, 2026-09-14).

import { useEffect, useId, useRef, useState } from "react";
import { downloadFdx, downloadFountain, downloadMarkdown, downloadPlainText, fountainText, markdownText, plainText } from "./fountainFile";

type TakeSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Save as PDF: the pages view and the browser's print (R23 c). */
  onPrint: () => void;
};

type Row = {
  id: string;
  name: string;
  what: string;
  copy?: () => string;
  download?: () => void;
};

const ROWS: Row[] = [
  {
    id: "markdown",
    name: "Markdown",
    what: "The wall read out: headings, scenes and the text; an unwritten scene shows its change line, marked. Paste into Google Docs and the headings hold.",
    copy: markdownText,
    download: downloadMarkdown,
  },
  {
    id: "text",
    name: "Plain text",
    what: "The script as it prints, Courier's columns kept with spaces. Pastes into anything.",
    copy: plainText,
    download: downloadPlainText,
  },
  {
    id: "fountain",
    name: "Fountain",
    what: "The screenplay format any Fountain editor opens; beats as sections, the cast and the fold as notes.",
    copy: fountainText,
    download: downloadFountain,
  },
  {
    id: "fdx",
    name: "Final Draft",
    what: "The industry's file, scene numbers by the wall's order or as locked.",
    download: downloadFdx,
  },
];

export function TakeSheet({ open, onClose, onPrint }: TakeSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCopied(null);
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!open) return null;

  async function copy(row: Row) {
    if (!row.copy) return;
    try {
      await navigator.clipboard.writeText(row.copy());
      setCopied(row.id);
    } catch {
      /* the download is beside it */
    }
  }

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close the sheet" onClick={onClose} />
      <div className="modal modal--narrow take-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">Pages</p>
            <h2 id={titleId} className="modal__title">
              Take the pages with you
            </h2>
          </div>
          <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="project-copy">The open board's script, in wall order, in the form the next place needs.</p>
        <ul className="take" aria-label="Formats">
          {ROWS.map((row) => (
            <li key={row.id} className="take__row">
              <span className="take__what">
                {row.name}
                <small>{row.what}</small>
              </span>
              <span className="take__verbs">
                {row.copy ? (
                  <button type="button" className="cast-lens__action" onClick={() => void copy(row)} aria-label={`Copy as ${row.name}`}>
                    {copied === row.id ? "Copied" : "Copy"}
                  </button>
                ) : null}
                {row.download ? (
                  <button type="button" className="cast-lens__action" onClick={row.download} aria-label={`Download as ${row.name}`}>
                    Download
                  </button>
                ) : null}
              </span>
            </li>
          ))}
          <li className="take__row">
            <span className="take__what">
              PDF
              <small>The pages through the browser's print; choose Save as PDF there.</small>
            </span>
            <span className="take__verbs">
              <button
                type="button"
                className="cast-lens__action"
                onClick={() => {
                  onClose();
                  onPrint();
                }}
              >
                Print
              </button>
            </span>
          </li>
        </ul>
        <p className="take__foot">The project itself, every board and its cast, is Save project under the arrow.</p>
      </div>
    </div>
  );
}
