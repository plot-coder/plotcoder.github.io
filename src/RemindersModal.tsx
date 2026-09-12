import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  createReminder,
  readReminders,
  writeReminders,
  type Reminder,
} from "./reminderStore";

type RemindersModalProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function RemindersModal({ open, onOpen, onClose }: RemindersModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [reminders, setReminders] = useState<Reminder[]>(readReminders);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function persist(next: Reminder[]) {
    setReminders(next);
    writeReminders(next);
  }

  function addReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    persist([...reminders, createReminder(draft)]);
    setDraft("");
  }

  function removeReminder(id: string) {
    persist(reminders.filter((reminder) => reminder.id !== id));
  }

  return (
    <>
      <button type="button" className="reminders-launch" onClick={onOpen}>
        Reminders
      </button>

      {open ? (
        <div className="modal-root">
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Close reminders"
            onClick={onClose}
          />
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="modal__header">
              <div>
                <p className="modal__kicker">Craft</p>
                <h2 id={titleId} className="modal__title">
                  Reminders
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                className="modal__close"
                onClick={onClose}
              >
                Close
              </button>
            </div>

            <ol className="reminder-list">
              {reminders.map((reminder) => (
                <li key={reminder.id} className="reminder">
                  <div className="reminder__top">
                    <h3 className="reminder__title">{reminder.title}</h3>
                    {!reminder.builtIn ? (
                      <button
                        type="button"
                        className="reminder__remove"
                        onClick={() => removeReminder(reminder.id)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <p className="reminder__body">{reminder.body}</p>
                </li>
              ))}
            </ol>

            <form className="reminder-form" onSubmit={addReminder}>
              <label className="reminder-form__label" htmlFor="new-reminder">
                Add a reminder
              </label>
              <textarea
                id="new-reminder"
                className="reminder-form__input"
                rows={4}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="A rule you want on the wall."
              />
              <button type="submit" className="reminder-form__submit" disabled={!draft.trim()}>
                Save reminder
              </button>
              <p className="reminder-form__note">
                Saved on this device. It stays after you close the tab.
              </p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
