// The name on the door (R39).
//
// One field. As the writer finishes a name the sheet says which it is: free,
// and the password field is where one is set — any password, no rules; or
// taken, and it asks for the password. One button, named for what it does.
// For a taken name the sheet confirms nothing about who holds it.

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { accountStore, cleanName, isValidName, type NameStatus } from "./board/account";

type NameDoorProps = {
  busy: boolean;
  error: string | null;
  /** Called once the writer is signed in. */
  onDone?: () => void;
};

export function NameDoor({ busy, error, onDone }: NameDoorProps) {
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
      ? `${clean} is free. Set a password and it is yours — any password, no rules.`
      : status === "taken"
        ? `The password for ${clean}.`
        : status === "invalid"
          ? "A name is letters and numbers, with dots, dashes or underscores, up to 32 long."
          : status === "unknown"
            ? "Could not ask about that name. Is the network on?"
            : status === "asking"
              ? "…"
              : "Type a name. If nobody has it, it is yours.";

  return (
    <form className="door" onSubmit={submit}>
      <label className="door__label" htmlFor={nameId}>
        Name
      </label>
      <input
        id={nameId}
        className="door__input"
        type="text"
        autoComplete="username"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="your name"
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
          {busy ? "…" : status === "free" ? `Claim ${clean}` : "Sign in"}
        </button>
      </div>
      {error ? <p className="project-error">{error}</p> : null}
      <p className="project-copy project-door__hint">
        Your wall stays on this device either way. A forgotten password has no way back yet, so keep it
        somewhere.
      </p>
    </form>
  );
}
