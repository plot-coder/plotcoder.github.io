// Step 1 of the method (R18/R19): what is this story arguing?
//
// Two levels, answering open question 18. The board's central question is the
// one you check every card against; the series premise sits above it and is
// shared by every board in the project. A feature has no premise, so it stays
// out of the way until asked for.
//
// Either line can be left open (R61): the writer's words for why there is no
// logline or premise yet, drawn where the value would be in the debt colour
// under a dashed line, the way an open card wears its words. A value decides
// the field and the words go; clearing the words leaves the field blank.
//
// In plain words (2026-09-27, docs/mockups/the-title-area-in-plain-words.html):
// the area held four things, two under one label and none saying what it
// was. At rest it is the logline alone. Reached for, an empty logline says
// what a logline is, with an example, and three plain links lead on — no
// logline yet, open questions, a premise — each to a field of its own that
// says what it is, one open at a time.

import { useEffect, useState } from "react";
import { EditableText } from "./EditableText";
import { OpenLines } from "./OpenLines";
import { wordSentence } from "./board/words";

type LoglineProps = {
  logline: string;
  /** The writer's words for why there is no logline yet (R61), or empty. */
  loglineOpen: string;
  premise: string;
  /** The writer's words for why there is no premise yet (R61), or empty. */
  premiseOpen: string;
  onSetLogline: (text: string) => void;
  onSetLoglineOpen: (words: string) => void;
  onSetPremise: (text: string) => void;
  onSetPremiseOpen: (words: string) => void;
  /** What is not decided about the film itself, in the writer's sentences. */
  openLines: string[];
  onAddOpenLine: (text: string) => void;
  onStrikeOpenLine: (index: number) => void;
};

type OpenFieldProps = {
  className: string;
  words: string;
  ariaLabel: string;
  onCommit: (words: string) => void;
  autoFocus: boolean;
};

/** A field left open: the mark, then the writer's words, typed in place. */
function OpenField({ className, words, ariaLabel, onCommit, autoFocus }: OpenFieldProps) {
  return (
    <span className="open-field">
      <span className="open-mark" aria-hidden="true">
        Open
      </span>
      <EditableText
        as="p"
        className={`${className} is-open-field`}
        value={words}
        onCommit={onCommit}
        ariaLabel={ariaLabel}
        placeholder="not decided: say why, in your words"
        autoFocus={autoFocus}
      />
    </span>
  );
}

export function Logline({
  logline,
  loglineOpen,
  premise,
  premiseOpen,
  onSetLogline,
  onSetLoglineOpen,
  onSetPremise,
  onSetPremiseOpen,
  openLines,
  onAddOpenLine,
  onStrikeOpenLine,
}: LoglineProps) {
  // A feature is one board and has no series above it, so the premise line only
  // appears once it holds something or you ask for it.
  // Which of the title area's panels is open: the open questions, or a premise being added. One at a time.
  const [panel, setPanel] = useState<"open" | "premise" | null>(null);
  // Which empty field the writer has just chosen to leave open (R61): the
  // caret lands in it for their words; a blank commit puts the field back.
  const [leaving, setLeaving] = useState<"logline" | "premise" | null>(null);

  function leaveLogline(words: string) {
    setLeaving(null);
    onSetLoglineOpen(words);
  }

  function leavePremise(words: string) {
    setLeaving(null);
    onSetPremiseOpen(words);
  }

  // Escape closes whichever panel is open, wherever the caret is.
  useEffect(() => {
    if (!panel) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setPanel(null);
      setLeaving(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  const premiseHeld = premise.length > 0 || premiseOpen.length > 0;
  const loglineEmpty = !logline && !loglineOpen && leaving !== "logline";

  return (
    <div className="logline">
      {/* The head carries the title band; a panel opened below stands on its own paper, over the wall. */}
      <div className="logline__head">
      {/* A premise that is held stands above the logline, where it always has; one being added is a panel below. */}
      {premiseHeld ? (
        premiseOpen ? (
          <OpenField className="logline__premise" words={premiseOpen} ariaLabel="Premise, left open" onCommit={leavePremise} autoFocus={false} />
        ) : (
          <EditableText as="p" className="logline__premise" value={premise} onCommit={onSetPremise} ariaLabel="Premise" placeholder="What is true before the story starts?" />
        )
      ) : null}

      {loglineOpen || leaving === "logline" ? (
        <span className="title-field">
          <span className="title-field__k">Why there is no logline yet</span>
          <OpenField className="logline__question" words={loglineOpen} ariaLabel="Logline, left open" onCommit={leaveLogline} autoFocus={leaving === "logline"} />
        </span>
      ) : (
        // No tooltip here: a tip opens above its field, and above the logline is off the top of the window, where
        // nobody could read it (Robert, 2026-09-27). What a logline is stands under it, in the hint below.
        <EditableText as="p" className="logline__question" value={logline} onCommit={onSetLogline} ariaLabel="Logline" placeholder="What is this story arguing?" />
      )}
      {/* What the field is, and an example, while it is empty and the writer is reaching for it. */}
      {loglineEmpty ? (
        <p className="logline__hint">
          <b>The logline:</b> the story's central question, in a sentence. For example, "Can a man who lies for a living tell the truth once, when it costs him the job?"
        </p>
      ) : logline ? (
        <p className="logline__hint">
          <b>The logline:</b> {wordSentence("logline")}
        </p>
      ) : null}

      {/* Three plain ways on, in one row; each opens its own field, one at a time. */}
      <div className="logline__offers">
        {loglineEmpty ? (
          <button type="button" className="title-link" onClick={() => setLeaving("logline")}>
            No logline yet? Say why
          </button>
        ) : null}
        <button type="button" className={`title-link ${openLines.length ? "has-lines" : ""} ${panel === "open" ? "is-on" : ""}`} aria-expanded={panel === "open"} onClick={() => setPanel(panel === "open" ? null : "open")}>
          Open questions{openLines.length ? ` · ${openLines.length}` : ""}
        </button>
        {premiseHeld ? null : (
          <button type="button" className={`title-link ${panel === "premise" ? "is-on" : ""}`} aria-expanded={panel === "premise"} onClick={() => setPanel(panel === "premise" ? null : "premise")}>
            Add a premise
          </button>
        )}
      </div>

      </div>

      {panel === "open" ? <OpenLines lines={openLines} onAdd={onAddOpenLine} onStrike={onStrikeOpenLine} onClose={() => setPanel(null)} /> : null}
      {panel === "premise" && !premiseHeld ? (
        <div className="title-panel">
          <button type="button" className="title-panel__close" aria-label="Close the premise" onClick={() => setPanel(null)}>
            ×
          </button>
          <h3 className="title-panel__head">The premise</h3>
          <p className="title-panel__say">What is true before the story starts, or a rule the whole of it keeps. For a series, what the series is about.</p>
          <EditableText
            as="p"
            className="title-panel__field"
            value=""
            onCommit={(text) => {
              if (text.trim()) {
                onSetPremise(text);
                setPanel(null);
              }
            }}
            ariaLabel="Premise"
            placeholder="Five days in August. Nobody says “sell” to her face until the end."
            autoFocus
            // Kept when the writer leaves the field or presses Enter, not as they type: once kept, the premise
            // moves to its place above the logline, and that must not happen under the caret.
            debounceMs={600000}
          />
          <button type="button" className="title-link" onClick={() => setLeaving("premise")}>
            Not decided? Say why
          </button>
          {leaving === "premise" ? <OpenField className="title-panel__field" words="" ariaLabel="Premise, left open" onCommit={leavePremise} autoFocus /> : null}
        </div>
      ) : null}
    </div>
  );
}
