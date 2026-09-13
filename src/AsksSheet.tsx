// What the wall asks ("What the Fold Does", 2026-09-13): step four of the
// method for a person, not only an agent. The same reading the read_wall
// tool gives — the sag, the setup with no payoff, the person who disappears,
// two scenes doing one job — as a sheet of questions under their kinds, each
// with show me to light the cards it is about. Questions, never fixes, and
// never dismissable: a question goes away when the wall answers it.

import { useEffect, useId, useRef } from "react";
import type { Finding, FindingKind } from "./board/readWall";

type AsksSheetProps = {
  open: boolean;
  findings: Finding[];
  onClose: () => void;
  /** Light these cards on the wall; the sheet closes first. */
  onShow: (ids: string[]) => void;
};

export const KIND_NAMES: Record<FindingKind, string> = {
  unmarked: "No beats yet",
  sag: "A sagging run",
  empty: "Two beats back to back",
  unwritten: "Unwritten",
  unlinked: "No arrows",
  duplicate: "Two scenes, one job",
  sequence: "A long sequence",
  uncast: "In the cast, on no card",
  absent: "Someone disappears",
  backwards: "Payoff before setup",
  unpaid: "A setup with no payoff",
};

/** The kinds a debt is: shown warm. */
const WARM: ReadonlySet<FindingKind> = new Set(["unpaid", "backwards"]);

export function AsksSheet({ open, findings, onClose, onShow }: AsksSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close the sheet" onClick={onClose} />
      <div className="modal modal--narrow account asks" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">PlotCoder</p>
            <h2 id={titleId} className="modal__title">
              What the wall asks
            </h2>
          </div>
          <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="project-copy">
          Read the way the method reads it: the sag, the setup with no payoff, the person who disappears, two scenes
          doing one job. Questions, not fixes.
        </p>
        {findings.length === 0 ? (
          <p className="project-copy asks__none">Nothing to ask. The wall answers every question it knows how to put.</p>
        ) : (
          <ol className="asks__list">
            {findings.map((finding, index) => (
              <li key={`${finding.kind}-${index}`} className="asks__q">
                <p className={`cast-lens__kicker ${WARM.has(finding.kind) ? "asks__kind--warm" : ""}`}>{KIND_NAMES[finding.kind]}</p>
                <p className="asks__text">
                  {finding.text}
                  {finding.ids.length > 0 ? (
                    <>
                      {" "}
                      <button
                        type="button"
                        className="words__show"
                        onClick={() => {
                          onClose();
                          onShow(finding.ids);
                        }}
                      >
                        show me
                      </button>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ol>
        )}
        <p className="project-copy project-door__hint">The same reading an agent gets from read_wall. Nothing here moves a card.</p>
      </div>
    </div>
  );
}
