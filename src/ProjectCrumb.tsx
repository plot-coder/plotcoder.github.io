// The project's name and the open board, where the wordmark was (R35).
//
// Every writing tool names the file at the top; this names the project and the
// board. Tap the board name to rename it (D11). The caret opens a panel: the
// project name and premise, tap-to-type; the boards in order with their length
// against target; Add a board, which opens the new board; and for the open
// board, move up, move down, and Delete…, which asks and names the card count,
// because it is the one thing on the wall undo cannot take back.

import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { EditableText } from "./EditableText";
import { formatPages, type BoardState } from "./board/reducer";
import { REVISION_COLORS } from "./board/numbering";
import type { BoardShape } from "./board/store";
import type { ProjectRecord } from "./board/project";

type ProjectCrumbProps = {
  project: ProjectRecord;
  shapeOf: (id: string) => BoardShape;
  onOpenBoard: (id: string) => void;
  onAddBoard: (name: string) => void;
  onRenameBoard: (id: string, name: string) => void;
  onMoveBoard: (id: string, delta: number) => void;
  onRemoveBoard: (id: string) => void;
  onRenameProject: (name: string) => void;
  onSetPremise: (premise: string) => void;
  /** The wordmark opens you and your projects (R39, R40). */
  onOpenAccount: () => void;
  /** The production half (Roadmap 2, item 8): the open board's lock and revision. */
  lock: BoardState["lock"];
  revision: BoardState["revision"];
  onLock: () => void;
  onUnlock: () => void;
  onStartRevision: (name: string, color: string) => void;
  onEndRevision: () => void;
};

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(
    el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable),
  );
}

export function ProjectCrumb({
  project,
  shapeOf,
  onOpenBoard,
  onAddBoard,
  onRenameBoard,
  onMoveBoard,
  onRemoveBoard,
  onRenameProject,
  onSetPremise,
  onOpenAccount,
  lock,
  revision,
  onLock,
  onUnlock,
  onStartRevision,
  onEndRevision,
}: ProjectCrumbProps) {
  const [revisionName, setRevisionName] = useState("");
  const [revisionColor, setRevisionColor] = useState("blue");
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const active = project.boards.find((board) => board.id === project.activeBoardId) ?? project.boards[0];
  const index = project.boards.findIndex((board) => board.id === active.id);
  const many = project.boards.length > 1;

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !isTyping(event.target)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAddBoard(draft.trim());
    setDraft("");
  }

  function onDraftKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft("");
      event.currentTarget.blur();
    }
  }

  function remove() {
    const shape = shapeOf(active.id);
    const cards = shape.cards === 1 ? "1 card" : `${shape.cards} cards`;
    const sure = window.confirm(
      `Delete "${active.name}" and its ${cards}? This cannot be undone. Save project first if you might want it back.`,
    );
    if (sure) onRemoveBoard(active.id);
  }

  return (
    <div className={`crumb ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="crumb__mark crumb__mark--door"
        aria-label="PlotCoder: you and your projects"
        title="You and your projects"
        onClick={onOpenAccount}
      >
        PlotCoder
      </button>
      {many ? (
        <>
          <span className="crumb__sep" aria-hidden="true">
            ·
          </span>
          <EditableText
            as="span"
            className="crumb__board"
            value={active.name}
            onCommit={(name) => {
              if (name) onRenameBoard(active.id, name);
            }}
            ariaLabel="Board name"
            placeholder="Board"
            stopPointerDown={false}
          />
        </>
      ) : null}
      <button
        type="button"
        className="crumb__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close the project" : "Open the project: its boards and premise"}
        onClick={() => setOpen((current) => !current)}
      >
        ▾
      </button>

      {open ? (
        <section id={panelId} className="project-panel" aria-label="Project">
          <div className="project-panel__head">
            <span className="project-panel__kicker">Project</span>
            <button type="button" className="project-panel__action" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <EditableText
            as="p"
            className="project-panel__name"
            value={project.name}
            onCommit={(name) => {
              if (name) onRenameProject(name);
            }}
            ariaLabel="Project name"
            placeholder="Untitled project"
            stopPointerDown={false}
          />
          <EditableText
            as="p"
            className="project-panel__premise"
            value={project.premise}
            onCommit={onSetPremise}
            ariaLabel="Series premise"
            placeholder="What is the series about?"
            stopPointerDown={false}
          />

          <ol className="project-panel__boards">
            {project.boards.map((board, i) => {
              const shape = shapeOf(board.id);
              const over = shape.totalEighths > shape.targetEighths;
              const isOpen = board.id === active.id;
              return (
                <li key={board.id}>
                  <button
                    type="button"
                    className={`project-panel__board ${isOpen ? "is-open" : ""}`}
                    aria-current={isOpen ? "true" : undefined}
                    onClick={() => {
                      if (!isOpen) onOpenBoard(board.id);
                    }}
                  >
                    <span className="project-panel__n">{i + 1}</span>
                    <span className="project-panel__title">{board.name}</span>
                    <span className={`project-panel__shape ${over ? "is-over" : ""}`}>
                      {shape.cards === 0
                        ? "empty"
                        : `${formatPages(shape.totalEighths)} of ${formatPages(shape.targetEighths)}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <form className="project-panel__add" onSubmit={add}>
            <input
              className="project-panel__input"
              value={draft}
              placeholder="Add a board…"
              aria-label="Add a board"
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onDraftKey}
            />
          </form>

          {/* The production half (item 8): the numbers and the revision are a state
              of the board going out, not a mode of the wall. */}
          <div className="project-panel__production">
            <p className="project-panel__kicker">Numbers</p>
            <p className="project-panel__meta">
              {lock ? `Locked ${new Date(lock.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · new scenes take A-numbers` : "Follow the wall's order"}
              <button type="button" className="project-panel__action" onClick={lock ? onUnlock : onLock}>
                {lock ? "Unlock" : "Lock"}
              </button>
            </p>
            <p className="project-panel__kicker">Revision</p>
            {revision ? (
              <p className="project-panel__meta">
                <span className={`project-panel__swatch rev--${revision.color}`} aria-hidden="true" />
                {revision.name} · changed lines print in {revision.color}
                <button type="button" className="project-panel__action" onClick={onEndRevision}>
                  End
                </button>
              </p>
            ) : (
              <form
                className="project-panel__revision"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!revisionName.trim()) return;
                  onStartRevision(revisionName.trim(), revisionColor);
                  setRevisionName("");
                }}
              >
                <input
                  className="project-panel__input"
                  value={revisionName}
                  placeholder="Start a revision… (blue draft)"
                  aria-label="Start a revision"
                  spellCheck={false}
                  onChange={(event) => setRevisionName(event.target.value)}
                />
                <select className="project-panel__select" aria-label="Revision colour" value={revisionColor} onChange={(event) => setRevisionColor(event.target.value)}>
                  {REVISION_COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </form>
            )}
          </div>

          <div className="project-panel__foot">
            <button
              type="button"
              className="project-panel__action"
              disabled={index <= 0}
              onClick={() => onMoveBoard(active.id, -1)}
            >
              Move up
            </button>
            <button
              type="button"
              className="project-panel__action"
              disabled={index >= project.boards.length - 1}
              onClick={() => onMoveBoard(active.id, 1)}
            >
              Move down
            </button>
            <button
              type="button"
              className="project-panel__action project-panel__action--danger"
              disabled={!many}
              onClick={remove}
            >
              Delete…
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
