// Your agent (R81; refreshed 2026-09-27, drawn in
// docs/mockups/your-agent-refreshed.html). The sheet shows the state the
// writer is in. Its head is the state — here now, last here an hour ago,
// not connected yet. When an agent has been, the sheet is what to say: the
// first message of a session, and the app's own asks, each a sentence to
// copy. When none has, it is three steps with one open at a time: sign in
// here; add PlotCoder to Claude, with an address, a header's name and a
// header's value to copy; say hello. The header's value holds the writer's
// email and password; it is made on this device from what they type and is
// never kept. The technical doors stay where they were, behind Agents.

import { useEffect, useId, useRef, useState } from "react";
import { basicHeader, firstMessage, type AgentSeen } from "./board/agentSeen";
import { WORKFLOWS } from "./board/workflows";

const ADDRESS = "https://mcp.plotcoder.com";
const HEADER = "Authorization";

/** The asks a writer reaches for first, by the workflow each is, in the words a writer would use. */
const ASKS: Array<{ id: string; label: string }> = [
  { id: "break-a-treatment", label: "Break my notes into a wall" },
  { id: "read-and-raise", label: "Read the wall and raise questions" },
  { id: "draft-a-sequence", label: "Draft a sequence" },
  { id: "break-into-shots", label: "Break a scene into shots" },
];

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
  /** The step that is open while no agent has been: the first not done. */
  const [step, setStep] = useState<1 | 2 | 3>(1);
  /** An agent has been, and the writer asked to see the steps again. */
  const [again, setAgain] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(null);
    setPassword("");
    setAgain(false);
    setStep(email ? 2 : 1);
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    // While the writer waits for their agent, look every ten seconds: the head changes under their eyes.
    onLook();
    const timer = window.setInterval(onLook, 10000);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearInterval(timer);
    };
    // The open step is chosen as the sheet opens; signing in while it is open moves it on below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, onLook]);

  useEffect(() => {
    if (open && email && step === 1) setStep(2);
  }, [open, email, step]);

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
  const has = seen.state !== "never";
  const head = seen.state === "here" ? "Here now" : seen.state === "seen" ? seen.words.replace(/^An agent was last here /, "Last here ").replace(/\.$/, "") : "Not connected yet";
  const under =
    seen.state === "never"
      ? "Three steps. About two minutes."
      : [projectName ? `on "${projectName}"` : "", seen.changed ? `last change: ${seen.changed.line}` : "it has changed nothing on this board"].filter(Boolean).join(" · ");

  function copyRow(id: string, label: string, text: string) {
    return (
      <div className="agent-sheet__field">
        <span className="agent-sheet__label">{label}</span>
        <span className="shots__text">{text}</span>
        <button type="button" className="shots__btn" onClick={() => void copy(id, text)}>
          {copied === id ? "Copied" : "Copy"}
        </button>
      </div>
    );
  }

  const messageBlock = (
    <>
      <p className="agents__say">Paste this as the first message of a new chat in Claude, with PlotCoder turned on.</p>
      <div className="shots__copy">
        <span className="shots__text">{message}</span>
        <button type="button" className="shots__btn agent-sheet__main" onClick={() => void copy("message", message)}>
          {copied === "message" ? "Copied" : "Copy"}
        </button>
      </div>
    </>
  );

  const steps = (
    <ol className="agent-sheet__steps">
      <li className={`agent-sheet__step ${email ? "is-done" : step === 1 ? "is-now" : ""}`}>
        <button type="button" className="agent-sheet__step-head" aria-expanded={step === 1} onClick={() => setStep(1)}>
          <span className="agent-sheet__n">{email ? "✓" : "1"}</span>
          <span>
            Sign in here
            {email ? <small>{email}</small> : null}
          </span>
        </button>
        {step === 1 ? (
          <div className="agent-sheet__body">
            {email ? (
              <p className="agents__say">You are signed in. Your wall is on your account, where an agent can reach it.</p>
            ) : (
              <>
                <p className="agents__say">Signed out, your wall lives in this browser and no agent can reach it.</p>
                <button type="button" className="shots__btn agent-sheet__main" onClick={onSignIn}>
                  Sign in, or make an account
                </button>
              </>
            )}
          </div>
        ) : null}
      </li>
      <li className={`agent-sheet__step ${step > 2 ? "is-done" : step === 2 ? "is-now" : ""}`}>
        <button type="button" className="agent-sheet__step-head" aria-expanded={step === 2} onClick={() => setStep(2)}>
          <span className="agent-sheet__n">{step > 2 ? "✓" : "2"}</span>
          <span>Add PlotCoder to Claude</span>
        </button>
        {step === 2 ? (
          <div className="agent-sheet__body">
            <p className="agents__say">
              In the Claude app: <b>Settings › Connectors › Add custom connector</b>. Choose <b>No sign-in</b> on its Authentication screen. Then copy these three in.
            </p>
            {copyRow("address", "Address", ADDRESS)}
            {copyRow("header", "Header name", HEADER)}
            <div className="agent-sheet__field">
              <label className="agent-sheet__label" htmlFor={`${titleId}-password`}>
                Header value
              </label>
              <input
                id={`${titleId}-password`}
                className="agent-sheet__input"
                type="password"
                autoComplete="off"
                disabled={!email}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setCopied(null);
                }}
                placeholder={email ? "Type your PlotCoder password" : "Sign in first"}
              />
              <button type="button" className="shots__btn" disabled={!email || !password} onClick={() => void copy("value", basicHeader(email ?? "", password))}>
                {copied === "value" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="shots__lab">The value is made on this device from your email and what you type. Nothing is sent or kept. Anyone who has it can work your walls as you.</p>
            <button type="button" className="shots__btn agent-sheet__main agent-sheet__next" onClick={() => setStep(3)}>
              Done, next
            </button>
          </div>
        ) : null}
      </li>
      <li className={`agent-sheet__step ${step === 3 ? "is-now" : ""}`}>
        <button type="button" className="agent-sheet__step-head" aria-expanded={step === 3} onClick={() => setStep(3)}>
          <span className="agent-sheet__n">3</span>
          <span>
            Say hello
            <small>paste one message</small>
          </span>
        </button>
        {step === 3 ? (
          <div className="agent-sheet__body">
            {messageBlock}
            <p className="shots__lab">When your agent reads the wall, the head of this sheet turns green within a few seconds.</p>
          </div>
        ) : null}
      </li>
    </ol>
  );

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close the sheet" onClick={onClose} />
      <div className="modal modal--account agent-welcome" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <h2 id={titleId} className="modal__title">
            Your agent
          </h2>
          <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>

        <p className={`agent-sheet__status is-${seen.state}`} role="status">
          <span className="agent-sheet__dot" aria-hidden="true" />
          <b>{head}</b>
          <span>{under}</span>
        </p>

        {has && !again ? (
          <>
            <section className="account__group" aria-label="Start a session">
              <p className="cast-lens__kicker">Start a session</p>
              {messageBlock}
            </section>
            <section className="account__group" aria-label="Or ask for something">
              <p className="cast-lens__kicker">Or ask for something</p>
              <div className="agent-sheet__asks">
                {ASKS.map((ask) => {
                  const workflow = WORKFLOWS.find((item) => item.id === ask.id);
                  if (!workflow) return null;
                  return (
                    <button key={ask.id} type="button" className="agent-sheet__ask" title={workflow.ask} onClick={() => void copy(`ask:${ask.id}`, workflow.ask)}>
                      {copied === `ask:${ask.id}` ? "Copied" : ask.label}
                    </button>
                  );
                })}
              </div>
              <p className="shots__lab">Each copies the sentence to say. They are the app's own asks, and Reminders has them all.</p>
            </section>
            <button type="button" className="agent-sheet__fold" onClick={() => setAgain(true)}>
              <span>
                Set it up again
                <small>another computer, or a new connector</small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          </>
        ) : (
          <>
            {steps}
            {has ? (
              <button type="button" className="agents__more" onClick={() => setAgain(false)}>
                Back to what to say
              </button>
            ) : null}
          </>
        )}

        <p className="agent-sheet__foot">
          It acts when you speak to it in Claude. This sheet shows when it was last here, never that it is waiting. Setting up Claude Code, Cursor or your own server?{" "}
          <button
            type="button"
            className="agents__start"
            onClick={() => {
              onClose();
              onAgents();
            }}
          >
            Agents.
          </button>
        </p>
      </div>
    </div>
  );
}
