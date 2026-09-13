// What these words mean (R42): the room's words, one sentence each, in the
// order a new person meets them. Opened from the ? in the bar, a line in the
// readout, or the empty wall's hint. Where a word is a thing on the wall,
// "show me" closes the sheet and lights that thing for a moment — the wall is
// the best definition of a beat. The sentences live in src/board/words.js,
// shared with the hovers on the wall, the skill and the MCP server.

import { useEffect, useId, useRef } from "react";
import { WORD_GROUPS, type WordTarget } from "./board/words";

type WordsSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Light the thing on the wall the word names; the sheet closes first. */
  onShow: (target: WordTarget) => void;
  /** Are you an agent? Start here (R43); the sheet closes first. */
  onAgents: () => void;
};

export function WordsSheet({ open, onClose, onShow, onAgents }: WordsSheetProps) {
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
      <div className="modal modal--narrow account words" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">PlotCoder</p>
            <h2 id={titleId} className="modal__title">
              What these words mean
            </h2>
          </div>
          <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="project-copy">
          The room’s words, in the order you meet them. Each one is a thing on the wall; <em>show me</em> lights it up.
        </p>
        {WORD_GROUPS.map((group) => (
          <section key={group.id} className="account__group" aria-label={group.name}>
            <p className="cast-lens__kicker">{group.name}</p>
            <dl className="words__list">
              {group.words.map((word) => (
                <div key={word.id} className="words__word">
                  <dt className="words__name">{word.name}</dt>
                  <dd className="words__sentence">
                    {word.sentence}
                    {word.target ? (
                      <>
                        {" "}
                        <button
                          type="button"
                          className="words__show"
                          onClick={() => {
                            onClose();
                            onShow(word.target as WordTarget);
                          }}
                        >
                          show me
                        </button>
                      </>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <p className="agents__line">
          Are you an agent?{" "}
          <button
            type="button"
            className="agents__start"
            onClick={() => {
              onClose();
              onAgents();
            }}
          >
            Start here.
          </button>
        </p>
      </div>
    </div>
  );
}
