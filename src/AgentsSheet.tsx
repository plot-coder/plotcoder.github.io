// Are you an agent? Start here (R43): the on-ramp as a sheet, for the person
// setting an agent up and for an agent driving a browser. Five short parts
// from src/board/agents.js — what this is, the doors with the blocks to copy,
// what to call first, the rules, a part for the person — and the link to the
// same text as a file. A door, not a tour; it closes on Escape like every sheet.

import { useEffect, useId, useRef, useState } from "react";
import { AGENTS } from "./board/agents";

type AgentsSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function AgentsSheet({ open, onClose }: AgentsSheetProps) {
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

  if (!open) return null;

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
    } catch {
      /* the text is on screen to select */
    }
  }

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close the sheet" onClick={onClose} />
      <div className="modal modal--narrow account agents" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">PlotCoder</p>
            <h2 id={titleId} className="modal__title">
              For agents
            </h2>
          </div>
          <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="project-copy">{AGENTS.lead}</p>

        <section className="account__group" aria-label="The doors">
          <p className="cast-lens__kicker">The doors</p>
          {AGENTS.doors.map((door) => (
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
          ))}
        </section>

        <section className="account__group" aria-label="Call these first">
          <p className="cast-lens__kicker">Call these first</p>
          <p className="agents__text">{AGENTS.firstNote}</p>
          <ol className="agents__first">
            {AGENTS.first.map((item) => (
              <li key={item.tool}>
                <code>{item.tool}</code> — {item.why}
              </li>
            ))}
          </ol>
        </section>

        <section className="account__group" aria-label="The rules">
          <p className="cast-lens__kicker">The rules</p>
          <p className="agents__text">{AGENTS.rules.join(" ")}</p>
        </section>

        <section className="account__group" aria-label="For the person">
          <p className="cast-lens__kicker">For the person</p>
          <p className="agents__text">
            {AGENTS.person} The same text lives at{" "}
            <a className="agents__link" href={AGENTS.url} target="_blank" rel="noreferrer">
              {AGENTS.url.replace("https://", "")}
            </a>{" "}
            — send that link to any agent.{" "}
            <button type="button" className="words__show" onClick={() => void copy("url", AGENTS.url)}>
              {copied === "url" ? "Copied" : "copy the link"}
            </button>
          </p>
        </section>
        <p className="project-copy project-door__hint">The full guide is at plotcoder.com/guide.md, the same file as the skill in the repo; this is the first page of it.</p>
      </div>
    </div>
  );
}
