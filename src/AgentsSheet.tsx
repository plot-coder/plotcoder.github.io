// Agents (R43; refreshed 2026-09-27, drawn in
// docs/mockups/for-agents-refreshed.html). The on-ramp was written to an
// agent and shown to a person as one column of nine hundred words. Now the
// sheet asks who is reading: a person with an agent goes to Your agent and
// its three steps; an agent is handed the page of text it reads best. Below,
// for whoever sets one up by hand, one way in at a time — a short line and
// what to copy — with the agent's own words, from src/board/agents.js, one
// tap behind each. Nothing here says what the on-ramp does not. A door, not
// a tour; it closes on Escape like every sheet.

import { useId, useRef, useState } from "react";
import { useSheet } from "./useSheet";
import { AGENTS, AGENTS_SHEET } from "./board/agents";

type AgentsSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Open Your agent (R81): the three steps for a person. The sheet closes first. */
  onAgent: () => void;
};

/** A reason in a line: the first clause of what the on-ramp says of a call. */
function firstClause(text: string): string {
  const cut = text.search(/[.:—]/);
  const clause = (cut > 0 ? text.slice(0, cut) : text).trim();
  return clause.endsWith(".") ? clause : `${clause}.`;
}

export function AgentsSheet({ open, onClose, onAgent }: AgentsSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState(AGENTS_SHEET.tabs[0].id);
  const [whole, setWhole] = useState(false);
  const [fold, setFold] = useState<string | null>(null);
  const [wholeFold, setWholeFold] = useState(false);

  // Once, as the sheet opens: a fold the writer opens stays open (see useSheet).
  useSheet(open, onClose, () => {
    setCopied(null);
    setWhole(false);
    setFold(null);
    setWholeFold(false);
    closeRef.current?.focus();
  });

  if (!open) return null;

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
    } catch {
      /* the text is on screen to select */
    }
  }

  function toAgent() {
    onClose();
    onAgent();
  }

  const shown = AGENTS_SHEET.tabs.find((item) => item.id === tab) ?? AGENTS_SHEET.tabs[0];
  const doors = shown.doors.map((id) => AGENTS.doors.find((door) => door.id === id)).filter((door) => door !== undefined);

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close the sheet" onClick={onClose} />
      <div className="modal modal--account account agents" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">PlotCoder</p>
            <h2 id={titleId} className="modal__title">
              Agents
            </h2>
          </div>
          <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="project-copy">{AGENTS_SHEET.lead}</p>

        <div className="agents__who">
          <div className="agents__card is-first">
            <h3>I have an agent</h3>
            <p>Sign in, add PlotCoder to Claude, paste one message. Three steps.</p>
            <button type="button" className="shots__btn shots__btn--main" onClick={toAgent}>
              Your agent
            </button>
          </div>
          <div className="agents__card">
            <h3>I am an agent</h3>
            <p>Everything you need is one page of text. Read it before your first call.</p>
            <button type="button" className="shots__btn" onClick={() => void copy("link-card", AGENTS.url)}>
              {copied === "link-card" ? "Copied" : "Copy the link"}
            </button>
          </div>
        </div>

        <section className="account__group" aria-label="Hand your agent this">
          <p className="cast-lens__kicker">Hand your agent this</p>
          <div className="shots__copy">
            <a className="shots__text agents__link" href={AGENTS.url} target="_blank" rel="noreferrer">
              {AGENTS.url}
            </a>
            <button type="button" className="shots__btn shots__btn--main" onClick={() => void copy("link", AGENTS.url)}>
              {copied === "link" ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="shots__lab">{AGENTS_SHEET.hand}</p>
        </section>

        <section className="account__group" aria-label="Setting it up yourself">
          <p className="cast-lens__kicker">Setting it up yourself</p>
          <div className="shots__steps" role="tablist" aria-label="The ways in">
            {AGENTS_SHEET.tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === shown.id}
                className={`shots__step ${item.id === shown.id ? "is-on" : ""}`}
                onClick={() => {
                  setTab(item.id);
                  setWhole(false);
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
          {shown.steps.map((step, index) => (
            <div key={`${shown.id}-${index}`} className="agents__step">
              <p className="agents__say">
                {step.say}{" "}
                {step.agent ? (
                  <button type="button" className="agents__start" onClick={toAgent}>
                    Your agent.
                  </button>
                ) : null}
              </p>
              {step.copy ? (
                <div className="shots__copy">
                  <span className="shots__text agents__pre">{step.copy}</span>
                  <button type="button" className="shots__btn" onClick={() => void copy(`${shown.id}-${index}`, step.copy as string)}>
                    {copied === `${shown.id}-${index}` ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          <button type="button" className="agents__more" aria-expanded={whole} onClick={() => setWhole((now) => !now)}>
            {whole ? "Close the whole of it" : "The whole of it, as the on-ramp says it"}
          </button>
          {whole
            ? doors.map((door) => (
                <div key={door.id} className="agents__door">
                  <p className="agents__text">
                    <b>{door.name}</b> — {door.text}
                  </p>
                  {door.code ? (
                    <pre className="agents__code">
                      <button type="button" className="words__show agents__copy" onClick={() => void copy(door.id, door.code as string)}>
                        {copied === door.id ? "Copied" : "Copy"}
                      </button>
                      {door.code}
                    </pre>
                  ) : null}
                </div>
              ))
            : null}
        </section>

        <div className="agents__folds">
          {AGENTS_SHEET.folds.map((item) => {
            const isOpen = fold === item.id;
            const lines =
              item.whole === "firstNote"
                ? AGENTS.first.map((call) => `${call.tool}: ${firstClause(call.why)}`)
                : item.whole === "person"
                  ? AGENTS.person.split(/(?<=[.?!])\s+(?=[A-Z])/)
                  : (item.lines ?? []);
            const full = item.whole === "firstNote" ? [...AGENTS.first.map((call) => `${call.tool} — ${call.why}`), AGENTS.firstNote] : item.whole === "rules" ? AGENTS.rules : [];
            return (
              <div key={item.id} className={`agents__fold ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="agents__fold-head"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setFold(isOpen ? null : item.id);
                    setWholeFold(false);
                  }}
                >
                  <span>
                    {item.title}
                    <small>{item.hint}</small>
                  </span>
                  <span aria-hidden="true">{isOpen ? "⌄" : "›"}</span>
                </button>
                {isOpen ? (
                  <div className="agents__fold-body">
                    {item.whole === "firstNote" ? (
                      <ol className="agents__first">
                        {lines.map((line) => (
                          <li key={line}>
                            <code>{line.split(":")[0]}</code> — {line.slice(line.indexOf(":") + 1).trim()}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      lines.map((line) => (
                        <p key={line} className="agents__say">
                          {line}
                        </p>
                      ))
                    )}
                    {full.length ? (
                      <>
                        <button type="button" className="agents__more" aria-expanded={wholeFold} onClick={() => setWholeFold((now) => !now)}>
                          {wholeFold ? "Close the agent's words" : "All of it, in the agent's words"}
                        </button>
                        {wholeFold
                          ? full.map((line) => (
                              <p key={line} className="agents__text">
                                {line}
                              </p>
                            ))
                          : null}
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="project-copy project-door__hint">
          The agent's full guide is at plotcoder.com/guide.md, the same file as the skill in the repo. Your own guide is at{" "}
          <a className="agents__link" href="https://plotcoder.com/writers.html" target="_blank" rel="noreferrer">
            plotcoder.com/writers.html
          </a>
          .
        </p>
      </div>
    </div>
  );
}
