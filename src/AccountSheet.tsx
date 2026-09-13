// The wordmark's sheet: you and your projects (R39, R40, R41).
//
// Signed out it is the door. Signed in: You — the name, when the wall was
// last saved, change name, change password, sign out; Projects — every
// project this writer is on, the open one first, and New project; People —
// who is on the open project, here now, share with a name, remove. Change
// name and change password ask for the current password once, because they
// are the two things a stranger at an open laptop could do.

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { accountStore, openedWhen, savedAgo } from "./board/account";
import { NameDoor } from "./NameDoor";

type AccountSheetProps = {
  open: boolean;
  onClose: () => void;
  /** The open project's id, so the list can mark it. */
  currentProjectId: string;
};

type Mode = "none" | "name" | "password" | "share";

export function AccountSheet({ open, onClose, currentProjectId }: AccountSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const account = useSyncExternalStore(accountStore.subscribe, accountStore.getAccount);
  const [mode, setMode] = useState<Mode>("none");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [newProject, setNewProject] = useState("");
  const [, tick] = useState(0);

  useEffect(() => {
    if (!open) return;
    setMode("none");
    setCurrent("");
    setNext("");
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const timer = setInterval(() => tick((n) => n + 1), 30_000);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearInterval(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  const signedIn = account.user !== null;
  const me = account.user?.name ?? "";
  const project = account.projects.find((item) => item.id === currentProjectId) ?? null;
  const isOwner = project?.mine ?? false;

  async function submitChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = mode === "name" ? await accountStore.changeName(current, next) : await accountStore.changePassword(current, next);
    if (ok) {
      setMode("none");
      setCurrent("");
      setNext("");
    }
  }

  async function submitShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!next.trim()) return;
    const ok = await accountStore.share(next);
    if (ok) {
      setNext("");
      setMode("none");
    }
  }

  async function submitNewProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await accountStore.newProject(newProject);
    if (ok) {
      setNewProject("");
      onClose();
    }
  }

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close the sheet" onClick={onClose} />
      <div className="modal modal--narrow account" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">PlotCoder</p>
            <h2 id={titleId} className="modal__title">
              {signedIn ? "You and your projects" : "Who is writing"}
            </h2>
          </div>
          <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>

        {!signedIn ? (
          account.ready ? (
            <>
              {account.linkError ? <p className="account__arrival account__arrival--warm">{account.linkError}</p> : null}
              <p className="project-copy">
                Your email and a password, and this project follows you to every device. Share a project with
                another writer's email and you write it together.
              </p>
              <NameDoor busy={account.busy} error={account.error} resetSentTo={account.resetSentTo} onDone={onClose} />
            </>
          ) : (
            <p className="project-copy">…</p>
          )
        ) : (
          <>
            {account.recovering ? (
              <section className="account__group" aria-label="New password">
                <p className="account__arrival">
                  You came in on the reset link, and you are <strong>signed in as {me}</strong>. Set a new password
                  now — any password, no rules — or close this and keep the old one.
                </p>
                <p className="cast-lens__kicker">A new password</p>
                <form
                  className="account__form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void accountStore.setNewPassword(next).then((ok) => {
                      if (ok) setNext("");
                    });
                  }}
                >
                  <input
                    className="door__input"
                    type="password"
                    autoComplete="new-password"
                    placeholder="your new password — anything"
                    value={next}
                    onChange={(event) => setNext(event.target.value)}
                  />
                  <div className="project-actions">
                    <button type="submit" className="project-action" disabled={account.busy || !next}>
                      Set the password
                    </button>
                  </div>
                </form>
              </section>
            ) : null}

            <section className="account__group" aria-label="You">
              <p className="cast-lens__kicker">You</p>
              <p className="account__line">
                <strong>{me}</strong>
                <span className="account__meta">
                  {account.status === "saving"
                    ? "saving…"
                    : account.status === "offline"
                      ? "offline, changes waiting"
                      : `saved ${savedAgo(account.lastSavedAt)}`}
                </span>
              </p>
              {mode === "name" || mode === "password" ? (
                <form className="account__form" onSubmit={submitChange}>
                  <input
                    className="door__input"
                    type="password"
                    autoComplete="current-password"
                    placeholder="your current password"
                    value={current}
                    onChange={(event) => setCurrent(event.target.value)}
                  />
                  <input
                    className="door__input"
                    type={mode === "name" ? "email" : "password"}
                    autoComplete={mode === "name" ? "username" : "new-password"}
                    autoCapitalize="off"
                    placeholder={mode === "name" ? "your new email" : "your new password — anything"}
                    value={next}
                    onChange={(event) => setNext(event.target.value)}
                  />
                  <div className="project-actions">
                    <button type="submit" className="project-action" disabled={account.busy || !current || !next}>
                      {mode === "name" ? "Change email" : "Change password"}
                    </button>
                    <button type="button" className="project-action project-action--ghost" onClick={() => setMode("none")}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="project-actions">
                  <button type="button" className="project-action project-action--ghost" onClick={() => setMode("name")}>
                    Change email
                  </button>
                  <button type="button" className="project-action project-action--ghost" onClick={() => setMode("password")}>
                    Change password
                  </button>
                  <button type="button" className="project-action project-action--ghost" onClick={() => void accountStore.signOut()}>
                    Sign out
                  </button>
                </div>
              )}
            </section>

            <section className="account__group" aria-label="Projects">
              <p className="cast-lens__kicker">Projects · {account.projects.length}</p>
              <ul className="account__list">
                {account.projects.map((item) => {
                  const isOpen = item.id === currentProjectId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`account__row ${isOpen ? "is-on" : ""}`}
                        aria-current={isOpen ? "true" : undefined}
                        onClick={() => {
                          if (isOpen) return;
                          void accountStore.openProject(item.id).then((ok) => {
                            if (ok) onClose();
                          });
                        }}
                      >
                        <span className="account__name">{item.name}</span>
                        <span className="account__meta">
                          {item.boards} {item.boards === 1 ? "board" : "boards"}
                          {item.people.length > 1 ? ` · with ${item.people.filter((name) => name !== me).join(", ")}` : ""}
                        </span>
                        <span className="account__meta">{isOpen ? "open" : openedWhen(item.updatedAt)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <form className="account__add" onSubmit={submitNewProject}>
                <input
                  className="cast-lens__input"
                  value={newProject}
                  placeholder="New project…"
                  aria-label="New project"
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(event) => setNewProject(event.target.value)}
                />
              </form>
            </section>

            {project ? (
              <section className="account__group" aria-label="People">
                <p className="cast-lens__kicker">People on {project.name}</p>
                <ul className="account__list">
                  {account.people.map((person) => (
                    <li key={person.userId} className="account__row account__row--person">
                      <span className="account__name">{person.name}</span>
                      <span className={`account__meta ${account.present.includes(person.name) ? "is-live" : ""}`}>
                        {person.role === "owner" ? "owner" : account.present.includes(person.name) ? "here now" : "writer"}
                      </span>
                      {isOwner && person.role !== "owner" ? (
                        <button
                          type="button"
                          className="cast-lens__action"
                          onClick={() => void accountStore.unshare(person.userId)}
                        >
                          Remove
                        </button>
                      ) : person.name === me && person.role !== "owner" ? (
                        <button
                          type="button"
                          className="cast-lens__action"
                          onClick={() => void accountStore.unshare(person.userId)}
                        >
                          Leave
                        </button>
                      ) : (
                        <span />
                      )}
                    </li>
                  ))}
                </ul>
                {isOwner ? (
                  <form className="account__add" onSubmit={submitShare}>
                    <input
                      className="cast-lens__input"
                      value={mode === "share" ? next : ""}
                      placeholder="Share with an email…"
                      aria-label="Share with an email"
                      spellCheck={false}
                      autoComplete="off"
                      autoCapitalize="off"
                      onFocus={() => {
                        setMode("share");
                        setNext("");
                      }}
                      onChange={(event) => setNext(event.target.value)}
                    />
                  </form>
                ) : null}
              </section>
            ) : null}

            {account.notice ? <p className="project-notice">{account.notice}</p> : null}
            {account.error ? <p className="project-error">{account.error}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}
