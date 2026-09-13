import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { boardStore } from "./board/store";
import { downloadProject, importProject } from "./projectStore";

type ProjectModalProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function ProjectModal({ open, onOpen, onClose }: ProjectModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
      window.location.reload();
    } catch {
      setError("That file could not be opened as a PlotCoder project.");
    }
  }

  return (
    <>
      <button
        type="button"
        className="project-launch"
        onClick={onOpen}
        aria-label="Save or open project"
        title="Save or open project"
      >
        <span className="transfer-icon" aria-hidden="true">
          <span className="transfer-icon__up" />
          <span className="transfer-icon__down" />
        </span>
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
                  Save or open
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

            <p className="project-copy">
              Download this browser’s local storage as a project file, or upload
              one to restore it. This is how you move work between computers
              until Supabase exists.
            </p>

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
              <input
                ref={fileRef}
                className="project-file"
                type="file"
                accept="application/json,.json"
                onChange={openProject}
              />
            </div>

            {error ? <p className="project-error">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
