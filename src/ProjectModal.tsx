import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
import { accountStore, savedAgo, type SyncStatus } from "./board/account";
import { boardStore } from "./board/store";
import { downloadProject, importProject } from "./projectStore";
import { downloadFdx, downloadFountain, openFdxText, openFountainText } from "./fountainFile";

type ProjectModalProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Sign in lives on the wordmark's sheet (R39); this opens it. */
  onSignIn: () => void;
  /** Save as PDF opens the pages view and the browser's print (R23 c). */
  onPrint: () => void;
};

// The transfer sheet (D10, R12, R4): the three ways to carry a project
// somewhere — a file out, a file in, and an account that carries it for you.
// Sign in lives here because that is what it is; the state of the mirror lives
// on the button as a dot, so it is on screen without opening anything.
export function ProjectModal({ open, onOpen, onClose, onSignIn, onPrint }: ProjectModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
      if (/\.fdx$/i.test(file.name) || /<FinalDraft\b/.test(text.slice(0, 400))) {
        // A Final Draft script: its scenes land on the open board's cards.
        const { written, created, setAside } = openFdxText(text);
        setError(null);
        setNotice(`Read ${file.name}: ${written} scene${written === 1 ? "" : "s"} written onto cards, ${created} new card${created === 1 ? "" : "s"}.${setAside ? ` ${setAside}` : ""}`);
        return;
      }
      if (/\.fountain$/i.test(file.name) || !text.trimStart().startsWith("{")) {
        // A screenplay, not a project: its scenes land on the open board's cards.
        const { written, created } = openFountainText(text);
        setError(null);
        setNotice(`Read ${file.name}: ${written} scene${written === 1 ? "" : "s"} written onto cards, ${created} new card${created === 1 ? "" : "s"}.`);
        return;
      }
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
                Signed in as <strong>{account.user?.name}</strong>
                <span className="project-account__state">
                  <span className={`transfer-dot transfer-dot--${account.status} transfer-dot--inline`} aria-hidden="true" />
                  {stateLine(account.status, account.lastSavedAt)}
                </span>
              </p>
            ) : (
              <p className="project-copy">
                Download this project as a file, a script the industry opens, or the pages; or upload a
                project, a .fountain or a .fdx onto this board.
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
              <button
                type="button"
                className="project-action project-action--ghost"
                onClick={() => downloadFdx()}
                title="The open board as a Final Draft .fdx, scene numbers by wall order"
              >
                Save as Final Draft
              </button>
              <button
                type="button"
                className="project-action project-action--ghost"
                onClick={() => {
                  onClose();
                  onPrint();
                }}
                title="The pages, through the browser's print — choose Save as PDF there"
              >
                Save as PDF
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
                accept="application/json,.json,.fountain,.fdx,text/plain,application/xml"
                onChange={openProject}
              />
            </div>

            {!signedIn && account.ready ? (
              <div className="project-door">
                <p className="project-copy">
                  Sign in with your email and a password to keep this project on every device, or share it
                  with another writer.
                </p>
                <div className="project-actions">
                  <button
                    type="button"
                    className="project-action"
                    onClick={() => {
                      onClose();
                      onSignIn();
                    }}
                  >
                    Sign in
                  </button>
                </div>
              </div>
            ) : null}

            {signedIn ? (
              <p className="project-copy project-door__hint">
                A file is still yours to keep; sync is a mirror, not a lock.
              </p>
            ) : null}

            {notice ? <p className="project-notice">{notice}</p> : null}
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
