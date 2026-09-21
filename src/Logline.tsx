// Step 1 of the method (R18/R19): what is this story arguing?
//
// Two levels, answering open question 18. The board's central question is the
// one you check every card against; the series premise sits above it and is
// shared by every board in the project. A feature has no premise, so it stays
// out of the way until asked for.
//
// Either line can be left open (R61): the writer's words for why there is no
// logline or premise yet, drawn where the value would be in the debt colour
// under a dashed line, the way an open card wears its words. An empty line
// offers "Not decided yet…" on hover; a value decides the field and the words
// go; clearing the words leaves the field blank again.

import { useState } from "react";
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
  const [premiseShown, setPremiseShown] = useState(false);
  // Which empty field the writer has just chosen to leave open (R61): the
  // caret lands in it for their words; a blank commit puts the field back.
  const [leaving, setLeaving] = useState<"logline" | "premise" | null>(null);
  const showPremise = premiseShown || premise.length > 0 || premiseOpen.length > 0;

  function leaveLogline(words: string) {
    setLeaving(null);
    onSetLoglineOpen(words);
  }

  function leavePremise(words: string) {
    setLeaving(null);
    onSetPremiseOpen(words);
  }

  return (
    <div className="logline">
      {showPremise ? (
        premiseOpen || leaving === "premise" ? (
          <OpenField
            className="logline__premise"
            words={premiseOpen}
            ariaLabel="Series premise, left open"
            onCommit={leavePremise}
            autoFocus={leaving === "premise"}
          />
        ) : (
          <EditableText
            as="p"
            className="logline__premise"
            value={premise}
            onCommit={onSetPremise}
            ariaLabel="Series premise"
            placeholder="What is the series about?"
          />
        )
      ) : null}
      {showPremise && !premise && !premiseOpen && leaving !== "premise" ? (
        <button type="button" className="field-offer" onClick={() => setLeaving("premise")}>
          Not decided yet…
        </button>
      ) : null}

      {loglineOpen || leaving === "logline" ? (
        <OpenField
          className="logline__question"
          words={loglineOpen}
          ariaLabel="Logline, left open"
          onCommit={leaveLogline}
          autoFocus={leaving === "logline"}
        />
      ) : (
        <span className="logline__tip has-tip" data-tip={wordSentence("logline")}>
          <EditableText
            as="p"
            className="logline__question"
            value={logline}
            onCommit={onSetLogline}
            ariaLabel="Logline"
            placeholder="What is this story arguing?"
          />
        </span>
      )}
      {!logline && !loglineOpen && leaving !== "logline" ? (
        <button type="button" className="field-offer" onClick={() => setLeaving("logline")}>
          Not decided yet…
        </button>
      ) : null}

      <OpenLines lines={openLines} onAdd={onAddOpenLine} onStrike={onStrikeOpenLine} />

      {showPremise ? null : (
        <button
          type="button"
          className="logline__add-premise"
          onClick={() => setPremiseShown(true)}
        >
          Add a series premise
        </button>
      )}
    </div>
  );
}
