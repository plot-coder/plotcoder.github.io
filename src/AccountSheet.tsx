// The wordmark's sheet: your projects (R39, R40, R41; refreshed 2026-09-27,
// drawn in docs/mockups/the-account-sheet-refreshed.html).
//
// Signed out it is the door. Signed in, in the order a writer comes for
// them: Projects — every project this writer is on, each with what it holds
// and who changed it last, so two of one name can be told apart; a row opens
// where it stands to rename, open, download a copy or delete, and the open
// project's row holds its people; Your agent — whether one is on the wall,
// and the way to bring one; You — the email, when the wall was last saved,
// change email, change password, sign out; and last, quiet, Delete account.
// Change email, change password and delete account ask for the current
// password once, because they are what a stranger at an open laptop could do.

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { accountStore, savedAgo } from "./board/account";
import type { AgentSeen } from "./board/agentSeen";
import { factsLine } from "./board/projectFacts";
import { NameDoor } from "./NameDoor";

type AccountSheetProps = {
  /** Who last changed the open wall, and when, from the record (R76); "" when the record is empty. */
  lastChange?: string;
  open: boolean;
  onClose: () => void;
  /** The open project's id, so the list can mark it. */
  currentProjectId: string;
  /** Are you an agent? Start here (R43); the sheet closes first. */
  onAgents: () => void;
  /** Whether an agent is on the wall, and when one last was (R81). */
  agent: AgentSeen;
  /** Open Your agent; the sheet closes first. */
  onAgent: () => void;
};

type Mode = "none" | "name" | "password" | "share" | "delete";

export function AccountSheet({ open, onClose, currentProjectId, onAgents, lastChange, agent, onAgent }: AccountSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const account = useSyncExternalStore(accountStore.subscribe, accountStore.getAccount);
  const [mode, setMode] = useState<Mode>("none");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [newProject, setNewProject] = useState("");
  /** The project whose row is open, and whether it is asking about its deletion. */
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rename, setRename] = useState("");
  const [, tick] = useState(0);

  useEffect(() => {
    if (!open) return;
    setMode("none");
    setCurrent("");
    setNext("");
    setEditing(null);
    setDeleting(false);
    void accountStore.loadProjectFacts();
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

  function openRow(id: string, name: string) {
    setEditing((now) => (now === id ? null : id));
    setDeleting(false);
    setRename(name);
    setMode("none");
  }

  async function download(id: string) {
    const file = await accountStore.projectFile(id);
    if (!file) return;
    const url = URL.createObjectURL(new Blob([file.text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function submitDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current) return;
    const done = await accountStore.deleteAccount(current);
    if (done) {
      setMode("none");
      setCurrent("");
      onClose();
    }
  }

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
      <div className={`modal ${signedIn ? "modal--account" : "modal--narrow"} account`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">PlotCoder</p>
            <h2 id={titleId} className="modal__title">
              {signedIn ? "Your projects" : "Who is writing"}
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

            <section className="account__group" aria-label="Projects">
              <p className="cast-lens__kicker account__kicker">
                Projects · {account.projects.length}
                <span>newest first</span>
              </p>
              <ul className="account__list">
                {account.projects.map((item) => {
                  const isOpen = item.id === currentProjectId;
                  const facts = account.facts[item.id];
                  const line = facts ? factsLine(facts, { me, savedAt: item.updatedAt }) : null;
                  const others = item.people.filter((name) => name !== me);
                  const isEditing = editing === item.id;
                  return (
                    <li key={item.id} className={`account__project ${isOpen ? "is-on" : ""} ${isEditing ? "is-editing" : ""}`}>
                      <div className="account__project-row">
                        <button
                          type="button"
                          className="account__project-open"
                          aria-current={isOpen ? "true" : undefined}
                          onClick={() => {
                            if (isOpen) return;
                            void accountStore.openProject(item.id).then((ok) => {
                              if (ok) onClose();
                            });
                          }}
                        >
                          <span className="account__name">{item.name}</span>
                          <span className="account__facts">
                            {line ? (
                              <>
                                <b>{line.holds}</b>
                                {line.changed ? " · " : ""}
                                <span className={line.agent ? "is-agent" : ""}>{line.changed}</span>
                              </>
                            ) : (
                              <b>
                                {item.boards} {item.boards === 1 ? "board" : "boards"}
                              </b>
                            )}
                            {others.length ? ` · with ${others.join(", ")}` : ""}
                          </span>
                        </button>
                        {isOpen ? <span className="account__meta is-live">open</span> : null}
                        <button
                          type="button"
                          className="account__dots"
                          aria-expanded={isEditing}
                          aria-label={`${isEditing ? "Close" : "Rename, download or delete"} ${item.name}`}
                          onClick={() => openRow(item.id, item.name)}
                        >
                          ⋯
                        </button>
                      </div>
                      {isEditing ? (
                        <div className="account__edit">
                          {deleting ? (
                            <>
                              <p className="account__warn">
                                <strong>Delete "{item.name}"?</strong> Its {facts ? `${facts.boards} ${facts.boards === 1 ? "board" : "boards"} and ${facts.cards} ${facts.cards === 1 ? "card" : "cards"}` : "boards and cards"} go, and
                                its pictures with them, from every device and for everyone on it. This cannot be undone.
                              </p>
                              <div className="account__acts">
                                <button type="button" className="account__act" onClick={() => void download(item.id)}>
                                  Download a copy first
                                </button>
                                <button
                                  type="button"
                                  className="account__act account__act--danger-solid"
                                  disabled={account.busy}
                                  onClick={() =>
                                    void accountStore.deleteProject(item.id).then((ok) => {
                                      if (ok) {
                                        setEditing(null);
                                        setDeleting(false);
                                      }
                                    })
                                  }
                                >
                                  Delete it
                                </button>
                                <button type="button" className="account__act" onClick={() => setDeleting(false)}>
                                  Keep it
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <form
                                className="account__rename"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  if (!rename.trim() || rename.trim() === item.name) return;
                                  void accountStore.renameProject(item.id, rename);
                                }}
                              >
                                <input className="door__input" value={rename} aria-label={`The name of ${item.name}`} spellCheck={false} autoComplete="off" onChange={(event) => setRename(event.target.value)} />
                                <button type="submit" className="account__act account__act--main" disabled={!rename.trim() || rename.trim() === item.name}>
                                  Rename
                                </button>
                              </form>
                              {isOpen && project ? (
                                <>
                                  <p className="account__sub">People on it</p>
                                  {lastChange ? <p className="project-copy project-door__hint">{lastChange}</p> : null}
                                  <ul className="account__list">
                                    {account.people.map((person) => (
                                      <li key={person.userId} className="account__row account__row--person">
                                        <span className="account__name">{person.name}</span>
                                        <span className={`account__meta ${account.present.includes(person.name) ? "is-live" : ""}`}>
                                          {person.role === "owner" ? "owner" : account.present.includes(person.name) ? "here now" : "writer"}
                                        </span>
                                        {isOwner && person.role !== "owner" ? (
                                          <button type="button" className="cast-lens__action" onClick={() => void accountStore.unshare(person.userId)}>
                                            Remove
                                          </button>
                                        ) : person.name === me && person.role !== "owner" ? (
                                          <button type="button" className="cast-lens__action" onClick={() => void accountStore.unshare(person.userId)}>
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
                                </>
                              ) : null}
                              <div className="account__acts">
                                {isOpen ? null : (
                                  <button
                                    type="button"
                                    className="account__act"
                                    onClick={() =>
                                      void accountStore.openProject(item.id).then((ok) => {
                                        if (ok) onClose();
                                      })
                                    }
                                  >
                                    Open it
                                  </button>
                                )}
                                <button type="button" className="account__act" onClick={() => void download(item.id)}>
                                  Download a copy
                                </button>
                                {item.mine ? (
                                  <button type="button" className="account__act account__act--danger" onClick={() => setDeleting(true)}>
                                    Delete…
                                  </button>
                                ) : (
                                  <span className="account__hint">Shared with you: its owner deletes it. {isOpen ? "Leave is beside your name above." : "Open it to leave it."}</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ) : null}
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

            <section className="account__group" aria-label="Your agent">
              <p className="cast-lens__kicker">Your agent</p>
              <p className={`account__agent is-${agent.state}`}>
                <span className="agent-welcome__dot" aria-hidden="true" />
                {agent.words}{" "}
                <button
                  type="button"
                  className="agents__start"
                  onClick={() => {
                    onClose();
                    onAgent();
                  }}
                >
                  {agent.state === "never" ? "Add your agent." : "Your agent."}
                </button>
              </p>
            </section>

            <section className="account__group" aria-label="You">
              <p className="cast-lens__kicker">You</p>
              <div className="account__you">
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
                {mode === "name" || mode === "password" ? null : (
                  <p className="account__links">
                    <button type="button" onClick={() => setMode("name")}>
                      Change email
                    </button>
                    <button type="button" onClick={() => setMode("password")}>
                      Change password
                    </button>
                    <button type="button" onClick={() => void accountStore.signOut()}>
                      Sign out
                    </button>
                  </p>
                )}
              </div>
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
              ) : null}
            </section>

            {/* Last and quiet: the one thing here that cannot be undone stands apart from everything that can. */}
            <section className="account__foot" aria-label="Delete account">
              {mode === "delete" ? (
                <form className="account__form" onSubmit={submitDelete}>
                  <p className="account__warn">
                    <strong>Delete your account?</strong> {(() => {
                      const owned = account.projects.filter((item) => item.mine).length;
                      return `Your ${owned} ${owned === 1 ? "project goes" : "projects go"} with it, on every device, and your sign-in.`;
                    })()}{" "}
                    Projects someone else owns stay theirs. The wall on this device stays. This cannot be undone: download a copy of any project you might want back.
                  </p>
                  <input
                    className="door__input"
                    type="password"
                    autoComplete="current-password"
                    placeholder="your current password"
                    value={current}
                    onChange={(event) => setCurrent(event.target.value)}
                  />
                  <div className="account__acts">
                    <button type="submit" className="account__act account__act--danger-solid" disabled={account.busy || !current}>
                      Delete my account
                    </button>
                    <button type="button" className="account__act" onClick={() => setMode("none")}>
                      Keep it
                    </button>
                  </div>
                </form>
              ) : (
                <p className="account__foot-line">
                  <span>Deleting the account takes every project you own.</span>
                  <button
                    type="button"
                    className="account__delete"
                    onClick={() => {
                      setMode("delete");
                      setCurrent("");
                      setEditing(null);
                    }}
                  >
                    Delete account…
                  </button>
                </p>
              )}
              <p className="project-copy project-door__hint">
                Setting up a server for an agent?{" "}
                <button
                  type="button"
                  className="agents__start"
                  onClick={() => {
                    onClose();
                    onAgents();
                  }}
                >
                  The doors, for agents.
                </button>
              </p>
            </section>

            {account.notice ? <p className="project-notice">{account.notice}</p> : null}
            {account.error ? <p className="project-error">{account.error}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}
