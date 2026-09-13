import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { describeRuns, describeSetups, readWall } from "./board/readWall";
import { type BoardState } from "./board/reducer";
import {
  createReminder,
  readReminders,
  writeReminders,
  type Reminder,
} from "./reminderStore";

type RemindersModalProps = {
  open: boolean;
  board: BoardState;
  onOpen: () => void;
  onClose: () => void;
};

export function RemindersModal({ open, board, onOpen, onClose }: RemindersModalProps) {
  const titleId = useId();
  const wallId = useId();
  // Read the wall (R22) is Reminders grown up (P17): the principles above, and
  // below them the same principles checked against the actual board. Read only
  // while the modal is open — it is a pass over every card and every pair.
  const reading = useMemo(() => (open ? readWall(board) : null), [open, board]);
  const runs = reading ? describeRuns(reading, board) : [];
  const setups = reading ? describeSetups(reading, board) : [];
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

            {reading ? (
              <section className="wall-read" aria-labelledby={wallId}>
                <p className="modal__kicker">Your board</p>
                <h3 id={wallId} className="wall-read__title">
                  Read the wall
                </h3>
                {runs.length > 0 ? (
                  <ul className="wall-read__runs" aria-label="Runs between beats">
                    {runs.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                {setups.length > 0 ? (
                  <ul className="wall-read__runs" aria-label="Setups and payoffs">
                    {setups.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                {reading.findings.length > 0 ? (
                  <ol className="wall-read__findings">
                    {reading.findings.map((finding) => (
                      <li key={`${finding.kind}:${finding.ids.join(",")}`} className="wall-read__finding">
                        {finding.text}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="wall-read__quiet">
                    Nothing this reading can see. It looks at the runs between beats, change
                    lines, arrows, repeated headlines, and long groups — and it only asks.
                  </p>
                )}
              </section>
            ) : null}

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
