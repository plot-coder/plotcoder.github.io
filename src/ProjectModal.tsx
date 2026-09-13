import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { accountStore, savedAgo, type SyncStatus } from "./board/account";
import { boardStore } from "./board/store";
import { downloadProject, importProject } from "./projectStore";
import { downloadFountain } from "./fountainFile";

type ProjectModalProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

// The transfer sheet (D10, R12, R4): the three ways to carry a project
// somewhere — a file out, a file in, and an account that carries it for you.
// Sign in lives here because that is what it is; the state of the mirror lives
// on the button as a dot, so it is on screen without opening anything.
export function ProjectModal({ open, onOpen, onClose }: ProjectModalProps) {
  const titleId = useId();
  const emailId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const account = useSyncExternalStore(accountStore.subscribe, accountStore.getAccount);
  // The sheet's "saved a moment ago" keeps time while it is open.
  const [, tick] = useState(0);

  useEffect(() => {
    if (!open) return;
    setError(null);
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

  function saveProject() {
    setError(null);
    downloadProject();
  }

  async function openProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      importProject(JSON.parse(text));
      // The board file must hold the opened wall before the reload, or the
      // reload takes the dev bridge's old copy back (see boardStore.adoptLocal).
      await boardStore.adoptLocal();
      // Every board of the file is new to the account.
      accountStore.markAllDirty();
      window.location.reload();
    } catch {
      setError("That file could not be opened as a PlotCoder project.");
    }
  }

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      await accountStore.signIn(email);
    } finally {
      setSending(false);
    }
  }

  const signedIn = account.user !== null;
  const dot = signedIn ? dotFor(account.status) : null;

  return (
    <>
      <button
        type="button"
        className="project-launch"
        onClick={onOpen}
        aria-label={dot ? `Save, open, or sync project — ${dot.label}` : "Save, open, or sync project"}
        title={dot ? `Save, open, or sync · ${dot.label}` : "Save, open, or sync"}
      >
        <span className="transfer-icon" aria-hidden="true">
          <span className="transfer-icon__up" />
          <span className="transfer-icon__down" />
        </span>
        {dot ? <span className={`transfer-dot transfer-dot--${account.status}`} aria-hidden="true" /> : null}
      </button>

      {open ? (
        <div className="modal-root">
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Close project"
            onClick={onClose}
          />
          <div
            className="modal modal--narrow"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="modal__header">
              <div>
                <p className="modal__kicker">Project</p>
                <h2 id={titleId} className="modal__title">
                  Save, open, or sync
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

            {signedIn ? (
              <p className="project-copy project-account">
                Signed in as <strong>{account.user?.email}</strong>
                <span className="project-account__state">
                  <span className={`transfer-dot transfer-dot--${account.status} transfer-dot--inline`} aria-hidden="true" />
                  {stateLine(account.status, account.lastSavedAt)}
                </span>
              </p>
            ) : (
              <p className="project-copy">
                Download this project as a file, upload one, or sign in to keep it on every device.
              </p>
            )}

            {account.notice ? <p className="project-notice">{account.notice}</p> : null}

            <div className="project-actions">
              <button type="button" className="project-action" onClick={saveProject}>
                Save project
              </button>
              <button
                type="button"
                className="project-action project-action--ghost"
                onClick={() => fileRef.current?.click()}
              >
                Open project
              </button>
              <button
                type="button"
                className="project-action project-action--ghost"
                onClick={() => downloadFountain()}
                title="The open board as a Fountain screenplay, in wall order"
              >
                Save as Fountain
              </button>
              {signedIn ? (
                <button
                  type="button"
                  className="project-action project-action--ghost"
                  onClick={() => void accountStore.signOut()}
                >
                  Sign out
                </button>
              ) : null}
              <input
                ref={fileRef}
                className="project-file"
                type="file"
                accept="application/json,.json"
                onChange={openProject}
              />
            </div>

            {!signedIn && account.ready ? (
              account.linkSentTo ? (
                <p className="project-copy project-door">
                  A link is on its way to <strong>{account.linkSentTo}</strong>. Open it on this device and
                  you are in.
                </p>
              ) : (
                <form className="project-door" onSubmit={sendLink}>
                  <label className="project-door__label" htmlFor={emailId}>
                    Sign in
                  </label>
                  <div className="project-door__row">
                    <input
                      id={emailId}
                      className="project-door__input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                    <button type="submit" className="project-action" disabled={sending || !email.trim()}>
                      {sending ? "Sending…" : "Send me a link"}
                    </button>
                  </div>
                  <p className="project-copy project-door__hint">
                    No password. A link arrives by email; open it on this device and you are in. Your wall
                    stays on this device either way.
                  </p>
                </form>
              )
            ) : null}

            {signedIn ? (
              <p className="project-copy project-door__hint">
                A file is still yours to keep; sync is a mirror, not a lock.
              </p>
            ) : null}

            {error ? <p className="project-error">{error}</p> : null}
            {account.error ? <p className="project-error">{account.error}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function dotFor(status: SyncStatus): { label: string } {
  switch (status) {
    case "saved":
      return { label: "saved to your account" };
    case "saving":
      return { label: "saving" };
    case "offline":
      return { label: "offline, changes waiting" };
    default:
      return { label: "signed in" };
  }
}

function stateLine(status: SyncStatus, lastSavedAt: string | null): string {
  switch (status) {
    case "saving":
      return "saving…";
    case "offline":
      return "offline, changes waiting";
    case "saved":
      return `saved ${savedAgo(lastSavedAt)}`;
    default:
      return lastSavedAt ? `last saved ${savedAgo(lastSavedAt)}` : "nothing saved yet";
  }
}
