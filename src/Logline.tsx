// Step 1 of the method (R18/R19): what is this story arguing?
//
// Two levels, answering open question 18. The board's central question is the
// one you check every card against; the series premise sits above it and is
// shared by every board in the project. A feature has no premise, so it stays
// out of the way until asked for.

import { useState } from "react";
import { EditableText } from "./EditableText";

type LoglineProps = {
  logline: string;
  premise: string;
  onSetLogline: (text: string) => void;
  onSetPremise: (text: string) => void;
};

export function Logline({ logline, premise, onSetLogline, onSetPremise }: LoglineProps) {
  // A feature is one board and has no series above it, so the premise line only
  // appears once it holds something or you ask for it.
  const [premiseOpen, setPremiseOpen] = useState(false);
  const showPremise = premiseOpen || premise.length > 0;

  return (
    <div className="logline">
      {showPremise ? (
        <EditableText
          as="p"
          className="logline__premise"
          value={premise}
          onCommit={onSetPremise}
          ariaLabel="Series premise"
          placeholder="What is the series about?"
        />
      ) : null}

      <EditableText
        as="p"
        className="logline__question"
        value={logline}
        onCommit={onSetLogline}
        ariaLabel="Logline"
        placeholder="What is this story arguing?"
      />

      {showPremise ? null : (
        <button
          type="button"
          className="logline__add-premise"
          onClick={() => setPremiseOpen(true)}
        >
          Add a series premise
        </button>
      )}
    </div>
  );
}
