// The door (R39, revised to email).
//
// One field. As the writer finishes an address the sheet says which it is:
// free, and the password field is where one is set — any password, no rules;
// or taken, and it asks for the password. One button, named for what it
// does. Forgotten? sends a reset link, because the address is the identity.

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { accountStore, cleanName, isValidName, type NameStatus } from "./board/account";

type NameDoorProps = {
  busy: boolean;
  error: string | null;
  resetSentTo?: string | null;
  /** Called once the writer is signed in. */
  onDone?: () => void;
};

export function NameDoor({ busy, error, resetSentTo = null, onDone }: NameDoorProps) {
  const nameId = useId();
  const passwordId = useId();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<NameStatus | "empty" | "asking">("empty");
  const timer = useRef<number | undefined>(undefined);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Ask about the name a beat after typing stops.
  useEffect(() => {
    window.clearTimeout(timer.current);
    const clean = cleanName(name);
    if (!clean) {
      setStatus("empty");
      return;
    }
    if (!isValidName(clean)) {
      setStatus("invalid");
      return;
    }
    setStatus("asking");
    timer.current = window.setTimeout(() => {
      void accountStore.nameStatus(clean).then((answer) => {
        setStatus((current) => (current === "asking" || current === "free" || current === "taken" || current === "unknown" ? answer : current));
      });
    }, 350);
    return () => window.clearTimeout(timer.current);
  }, [name]);

  const clean = cleanName(name);
  const canGo = (status === "free" || status === "taken") && password.length > 0 && !busy;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canGo) return;
    const ok = status === "free" ? await accountStore.claim(clean, password) : await accountStore.signIn(clean, password);
    if (ok) {
      setPassword("");
      onDone?.();
    }
  }

  const answer =
    status === "free"
      ? `${clean} is new here. Set a password and you are in — any password, no rules.`
      : status === "taken"
        ? `The password for ${clean}.`
        : status === "invalid"
          ? "That does not look like an email address."
          : status === "unknown"
            ? "Could not ask about that address. Is the network on?"
            : status === "asking"
              ? "…"
              : "Your email. New here, and it is yours the moment you set a password.";

  return (
    <form className="door" onSubmit={submit}>
      <label className="door__label" htmlFor={nameId}>
        Email
      </label>
      <input
        id={nameId}
        className="door__input"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="you@example.com"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (status === "free" || status === "taken")) {
            event.preventDefault();
            passwordRef.current?.focus();
          }
        }}
      />
      <p className={`door__answer ${status === "free" ? "is-free" : ""}`} aria-live="polite">
        {answer}
      </p>

      <label className="door__label" htmlFor={passwordId}>
        Password
      </label>
      <div className="door__row">
        <input
          ref={passwordRef}
          id={passwordId}
          className="door__input"
          type={show ? "text" : "password"}
          autoComplete={status === "free" ? "new-password" : "current-password"}
          placeholder={status === "free" ? "anything you like" : "your password"}
          value={password}
          disabled={status !== "free" && status !== "taken"}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="button" className="door__show" onClick={() => setShow((current) => !current)}>
          {show ? "Hide" : "Show"}
        </button>
      </div>

      <div className="project-actions">
        <button type="submit" className="project-action" disabled={!canGo}>
          {busy ? "…" : status === "free" ? "Set the password and sign in" : "Sign in"}
        </button>
        {status === "taken" ? (
          <button
            type="button"
            className="project-action project-action--ghost"
            disabled={busy}
            onClick={() => void accountStore.recover(clean)}
          >
            Forgotten?
          </button>
        ) : null}
      </div>
      {resetSentTo ? (
        <p className="project-notice">
          A reset link is on its way to {resetSentTo}. Open it on this device and set a new password — any
          password.
        </p>
      ) : null}
      {error ? <p className="project-error">{error}</p> : null}
      <p className="project-copy project-door__hint">Your wall stays on this device either way.</p>
    </form>
  );
}
