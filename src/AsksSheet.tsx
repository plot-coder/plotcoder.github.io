// What the wall asks ("What the Fold Does", 2026-09-13): step four of the
// method for a person, not only an agent. The same reading the read_wall
// tool gives — the sag, the setup with no payoff, the person who disappears,
// two scenes doing one job — as a sheet of questions under their kinds, each
// with show me to light the cards it is about. Questions, never fixes, and
// never dismissed: a question goes away when the wall answers it — or when
// the writer does, with "leave it" (R53), which the wall writes down and
// takes back on its own the moment the question would read differently.

import { useEffect, useId, useRef } from "react";
import type { Finding, FindingKind } from "./board/readWall";

type AsksSheetProps = {
  open: boolean;
  findings: Finding[];
  /** Questions the writer has left, for now (R53), with the reason when they gave one. */
  left: Array<Finding & { since: string; why?: string }>;
  onClose: () => void;
  /** Light these cards on the wall; the sheet closes first. */
  onShow: (ids: string[]) => void;
  /** The writer's word on a question: leave it. */
  onLeave: (finding: Finding) => void;
  /** Take the word back: ask it again now. */
  onAskAgain: (finding: Finding) => void;
};

export const KIND_NAMES: Record<FindingKind, string> = {
  unmarked: "No beats yet",
  sag: "A sagging run",
  empty: "Beats back to back",
  unwritten: "Unwritten",
  unlinked: "No arrows",
  duplicate: "Two scenes, one job",
  sequence: "A long sequence",
  uncast: "In the cast, on no card",
  absent: "Someone disappears",
  backwards: "Payoff before setup",
  unpaid: "A setup with no payoff",
  unplanted: "A payoff with no fold",
  nobody: "Nobody in the scene",
  unplaced: "No place",
  loose: "A thread with a loose end",
};

/** The kinds a debt is: shown warm. */
const WARM: ReadonlySet<FindingKind> = new Set(["unpaid", "backwards"]);

export function AsksSheet({ open, findings, left, onClose, onShow, onLeave, onAskAgain }: AsksSheetProps) {
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
          <p className="project-copy asks__none">
            {left.length ? "Nothing to ask that you have not left." : "Nothing to ask. The wall answers every question it knows how to put."}
          </p>
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
                  ) : null}{" "}
                  <button type="button" className="words__show asks__leave" onClick={() => onLeave(finding)}>
                    leave it
                  </button>
                </p>
              </li>
            ))}
          </ol>
        )}
        {left.length > 0 ? (
          <div className="asks__left">
            <p className="cast-lens__kicker cast-lens__section">Left, for now · {left.length}</p>
            <ol className="asks__list">
              {left.map((finding, index) => (
                <li key={`left-${finding.kind}-${index}`} className="asks__q asks__q--left">
                  <p className="cast-lens__kicker">
                    {KIND_NAMES[finding.kind]} · left {finding.since.slice(0, 10)}
                  </p>
                  <p className="asks__text">
                    {finding.text}{" "}
                    <button type="button" className="words__show" onClick={() => onAskAgain(finding)}>
                      ask again
                    </button>
                  </p>
                  {finding.why ? <p className="asks__text asks__why">“{finding.why}”</p> : null}
                </li>
              ))}
            </ol>
            <p className="project-copy project-door__hint">
              A left question is written on the wall, and comes back on its own the moment it would read differently.
            </p>
          </div>
        ) : null}
        <p className="project-copy project-door__hint">The same reading an agent gets from read_wall. Nothing here moves a card.</p>
      </div>
    </div>
  );
}
