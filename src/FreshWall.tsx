// The fresh wall (drawn in docs/mockups/the-fresh-wall.html, A; built on
// Robert's word, 2026-09-27). An empty wall said how to begin in small grey
// words in a corner. Now the wall itself says it, in the middle where the
// eye lands: three ways to begin, each a thing to press — a card, a
// structure, an agent. With an agent connected its card comes first, lit,
// with what to say to it; with none it comes last and opens Your agent. Not
// a tour (R43): it is there only while the wall has no card.

import { useState } from "react";
import type { AgentSeen } from "./board/agentSeen";
import { workflowById } from "./board/workflows";

type FreshWallProps = {
  agent: AgentSeen;
  onNewNote: () => void;
  onStructure: () => void;
  onWords: () => void;
  /** Open Your agent (R81). */
  onAgent: () => void;
};

export function FreshWall({ agent, onNewNote, onStructure, onWords, onAgent }: FreshWallProps) {
  const [copied, setCopied] = useState(false);
  const ask = workflowById("break-a-treatment")?.ask ?? "";
  const here = agent.state === "here";

  async function copy() {
    try {
      await navigator.clipboard.writeText(ask);
      setCopied(true);
    } catch {
      /* the words are on screen to select */
    }
  }

  const agentWay = here ? (
    <div key="agent" className="fresh-wall__way is-first">
      <h3>
        <span className="agent-welcome__dot" aria-hidden="true" />
        Tell your agent
      </h3>
      <p>It is here. Say this in its window, then paste your notes or your treatment after it.</p>
      <p className="fresh-wall__say">{ask}</p>
      <button type="button" className="shots__btn shots__btn--main" onClick={() => void copy()}>
        {copied ? "Copied" : "Copy what to say"}
      </button>
    </div>
  ) : (
    <div key="agent" className="fresh-wall__way">
      <h3>Bring in your agent</h3>
      <p>
        {agent.state === "seen"
          ? `${agent.words} It builds the wall from your notes while you watch.`
          : "An agent such as Claude builds the wall from your notes while you watch."}
      </p>
      <button type="button" className="shots__btn" onClick={onAgent}>
        Your agent
      </button>
    </div>
  );

  const card = (
    <div key="card" className={`fresh-wall__way ${here ? "" : "is-first"}`}>
      <h3>Add a card</h3>
      <p>One scene: a headline, and what changes in it.</p>
      <button type="button" className={`shots__btn ${here ? "" : "shots__btn--main"}`} onClick={onNewNote}>
        New card
      </button>
    </div>
  );

  const structure = (
    <div key="structure" className="fresh-wall__way">
      <h3>Start from a structure</h3>
      <p>The turns of a known shape, laid out as cards to write over.</p>
      <button type="button" className="shots__btn" onClick={onStructure}>
        Choose one
      </button>
    </div>
  );

  return (
    // The wall beneath still pans: only the block itself takes the pointer.
    <div className={`fresh-wall is-${agent.state}`} onPointerDown={(event) => event.stopPropagation()}>
      <h2>An empty wall</h2>
      <p className="fresh-wall__sub">A card is a scene. Begin with one, with a shape, or with your agent.</p>
      <div className="fresh-wall__ways">{here ? [agentWay, card, structure] : [card, structure, agentWay]}</div>
      <p className="fresh-wall__foot">
        New to the words here?{" "}
        <button type="button" className="group-hint__link" onClick={onWords}>
          What these words mean
        </button>
      </p>
    </div>
  );
}
