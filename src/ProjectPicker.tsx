// The picker (R40): "What are you working on today?"
//
// Appears at sign-in only when there is a choice — more than one project on
// the account. The open one first, each with its boards and when it was last
// touched, and New project. The same list lives behind the wordmark for the
// rest of the day, and the sheet says so.

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { accountStore, openedWhen } from "./board/account";

type ProjectPickerProps = {
  currentProjectId: string;
};

export function ProjectPicker({ currentProjectId }: ProjectPickerProps) {
  const titleId = useId();
  const firstRef = useRef<HTMLButtonElement>(null);
  const account = useSyncExternalStore(accountStore.subscribe, accountStore.getAccount);
  const [draft, setDraft] = useState("");
  const open = account.needsPick && account.user !== null;

  useEffect(() => {
    if (open) firstRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const me = account.user?.name ?? "";
  const projects = [...account.projects].sort((a, b) => (a.id === currentProjectId ? -1 : b.id === currentProjectId ? 1 : 0));

  async function submitNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    await accountStore.newProject(draft);
    setDraft("");
  }

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Keep the open project" onClick={accountStore.dismissPick} />
      <div className="modal modal--narrow" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">Good to see you, {me}</p>
            <h2 id={titleId} className="modal__title">
              What are you working on today?
            </h2>
          </div>
        </div>
        <ul className="account__list">
          {projects.map((item, index) => {
            const isOpen = item.id === currentProjectId;
            return (
              <li key={item.id}>
                <button
                  ref={index === 0 ? firstRef : undefined}
                  type="button"
                  className={`account__row ${isOpen ? "is-on" : ""}`}
                  onClick={() => {
                    if (isOpen) accountStore.dismissPick();
                    else void accountStore.openProject(item.id);
                  }}
                >
                  <span className="account__name">{item.name}</span>
                  <span className="account__meta">
                    {item.boards} {item.boards === 1 ? "board" : "boards"}
                    {item.people.length > 1 ? ` · with ${item.people.filter((name) => name !== me).join(", ")}` : ""}
                  </span>
                  <span className="account__meta">{isOpen ? "open now" : openedWhen(item.updatedAt)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <form className="account__add" onSubmit={submitNew}>
          <input
            className="cast-lens__input"
            value={draft}
            placeholder="New project…"
            aria-label="New project"
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => setDraft(event.target.value)}
          />
        </form>
        <p className="project-copy project-door__hint">Change this any time from the PlotCoder mark, top left.</p>
      </div>
    </div>
  );
}
