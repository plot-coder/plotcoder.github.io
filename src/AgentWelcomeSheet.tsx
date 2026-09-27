// Your agent (R81): the way in for a person who has an agent, and the
// place the app says whether one is on the wall and when one last was.
//
// Three steps a newcomer can follow without the repo: sign in here; add
// PlotCoder to Claude, with the address and the header to copy; paste one
// message. Then the line at the head changes on its own when the agent
// arrives. The header holds the writer's email and password; it is made on
// this device from what they type and is never kept. The technical doors
// stay where they were, behind "For agents".

import { useEffect, useId, useRef, useState } from "react";
import { basicHeader, firstMessage, type AgentSeen } from "./board/agentSeen";

const ADDRESS = "https://mcp.plotcoder.com";

type AgentWelcomeSheetProps = {
  open: boolean;
  seen: AgentSeen;
  /** The signed-in writer's email, or null when signed out. */
  email: string | null;
  projectName: string;
  /** How many boards the project has: more than one is read whole first. */
  boards: number;
  onClose: () => void;
  /** Open the door to sign in. */
  onSignIn: () => void;
  /** The technical doors (R43). */
  onAgents: () => void;
  /** Ask again whether an agent has been, while the sheet is open. */
  onLook: () => void;
};

export function AgentWelcomeSheet({ open, seen, email, projectName, boards, onClose, onSignIn, onAgents, onLook }: AgentWelcomeSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!open) return;
    setCopied(null);
    setPassword("");
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    // While the writer waits for their agent, look every ten seconds: the line changes under their eyes.
    onLook();
    const timer = window.setInterval(onLook, 10000);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearInterval(timer);
    };
  }, [open, onClose, onLook]);

  if (!open) return null;

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
    } catch {
      /* the words are on screen to select */
    }
  }

  const message = firstMessage(projectName, boards);

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close the sheet" onClick={onClose} />
      <div className="modal modal--shots agent-welcome" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">You direct, your agent works the wall</p>
            <h2 id={titleId} className="modal__title">
              Your agent
            </h2>
          </div>
          <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>

        <p className={`agent-welcome__seen is-${seen.state}`} role="status">
          <span className="agent-welcome__dot" aria-hidden="true" />
          {seen.words}
          {seen.changed ? <span className="shots__lab"> Last change it made here: {seen.changed.line}.</span> : null}
        </p>
        <p className="project-copy">
          An agent such as Claude can build and change this wall while you watch: what it does shows here as it lands. It acts when you speak to it in its own window; this page cannot tell you that one is
          waiting, only when one was last here.
        </p>

        <ol className="agent-welcome__steps">
          <li>
            <p className="shots__name">Sign in here</p>
            {email ? (
              <p className="shots__lab">
                Done: you are signed in as <b>{email}</b>. Your wall is on your account, where an agent can reach it.
              </p>
            ) : (
              <p className="shots__line">
                <span className="shots__lab">Signed out, your wall lives in this browser and no agent can reach it.</span>
                <button type="button" className="shots__btn shots__btn--main" onClick={onSignIn}>
                  Sign in, or make an account
                </button>
              </p>
            )}
          </li>
          <li>
            <p className="shots__name">Add PlotCoder to Claude, once</p>
            <p className="shots__lab">In the Claude app: Settings, Connectors, Add custom connector. Give it this address, and choose No sign-in on its Authentication screen.</p>
            <div className="shots__copy">
              <span className="shots__text shots__text--short">{ADDRESS}</span>
              <button type="button" className="shots__btn shots__btn--main" onClick={() => void copy("address", ADDRESS)}>
                {copied === "address" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="shots__lab">Then add one header, named Authorization. Its value holds your email and password: type your password here and it is made on this device. Nothing you type is sent or kept.</p>
            {email ? (
              <div className="shots__copy">
                <input
                  className="shots__looks"
                  type="password"
                  autoComplete="off"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setCopied(null);
                  }}
                  aria-label="Your PlotCoder password, to make the header"
                  placeholder="Your PlotCoder password"
                />
                <button type="button" className="shots__btn shots__btn--main" disabled={!password} onClick={() => void copy("header", basicHeader(email, password))}>
                  {copied === "header" ? "Copied" : "Copy the header's value"}
                </button>
              </div>
            ) : (
              <p className="shots__lab">Sign in first: the header is made from your email.</p>
            )}
            <p className="shots__lab">Anyone who has the header can work your walls as you. Keep it as you keep the password.</p>
          </li>
          <li>
            <p className="shots__name">Paste this as your first message</p>
            <p className="shots__lab">In a new chat, with the PlotCoder connector turned on.</p>
            <div className="shots__copy">
              <span className="shots__text">{message}</span>
              <button type="button" className="shots__btn shots__btn--main" onClick={() => void copy("message", message)}>
                {copied === "message" ? "Copied" : "Copy"}
              </button>
            </div>
          </li>
          <li>
            <p className="shots__name">Watch the line at the top of this sheet</p>
            <p className="shots__lab">When your agent reads the wall, it says so here within a few seconds, and the button in the corner says the same from then on.</p>
          </li>
        </ol>

        <p className="project-copy project-door__hint">
          Setting up Claude Code, Cursor or a server of your own?{" "}
          <button
            type="button"
            className="words__show"
            onClick={() => {
              onClose();
              onAgents();
            }}
          >
            The doors, for agents
          </button>
        </p>
      </div>
    </div>
  );
}
