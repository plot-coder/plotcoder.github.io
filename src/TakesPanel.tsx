// Takes (R28, Roadmap 2 item 9): the horizon's first surface.
//
// A panel beside the wall for the selected card, or the run of selected
// cards: the takes a tool built from the brief, side by side, one chosen; a
// mark on the card once a take exists. A take is a file on the project
// (item 5), added here by the writer or by an agent through the account door;
// no video tool is chosen yet (question 26), so Build a take hands the brief
// to whatever will build it and says so. No timeline, no editor: PlotCoder
// shows takes against the story and picks; cutting is another tool's job.

import { useEffect, useId, useRef, useState } from "react";
import { accountStore, type Asset } from "./board/account";
import { PanelHead } from "./PanelHead";
import { readingOrder } from "./board/readWall";
import { type BoardState } from "./board/reducer";
import { segmentBrief } from "./board/workflows";

type TakesPanelProps = {
  open: boolean;
  board: BoardState;
  ids: string[];
  title: string;
  takes: Asset[] | null;
  uploading: number;
  onClose: () => void;
};

/** The subject a take is filed under: one card's id, or the run's ids joined. */
export function takeSubject(ids: string[]): string {
  return ids.length === 1 ? ids[0] : `run:${ids.join("+")}`;
}

export function TakesPanel({ open, board, ids, title, takes, uploading, onClose }: TakesPanelProps) {
  const titleId = useId();
  const inputId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const wanted = new Set(ids);
  const ordered = readingOrder(board.notes).filter((note) => wanted.has(note.id)).map((note) => note.id);
  const subject = takeSubject(ordered);
  const brief = segmentBrief(board, ordered, { title }) ?? "";
  const first = board.notes.find((note) => note.id === ordered[0]);
  const mine = takes === null ? null : takes.filter((asset) => asset.kind === "take" && asset.subject === subject);
  const chosen = mine?.find((asset) => asset.note === "chosen") ?? null;

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
    } catch {
      /* the brief is on screen to select */
    }
  }

  return (
    <aside className="takes" aria-label="Takes" aria-labelledby={titleId}>
      <PanelHead
        title="Takes"
        titleId={titleId}
        note={`${ordered.length === 1 ? first?.headline ?? "" : `${ordered.length} scenes`}${mine ? ` · ${mine.length} ${mine.length === 1 ? "take" : "takes"}` : ""}${uploading ? ` · ${uploading} on the way` : ""}`}
        onClose={onClose}
        closeRef={closeRef}
      />

      <div className="takes__body">
        {mine === null ? (
          <p className="project-copy">Sign in, and takes live on the project as files, on every device.</p>
        ) : mine.length === 0 ? (
          <p className="project-copy">
            No takes yet. Hand the brief to a video tool and add what it makes, or ask an agent to build one.
          </p>
        ) : (
          <ul className="takes__grid">
            {mine.map((asset) => (
              <li key={asset.id} className={`take ${asset === chosen ? "is-chosen" : ""}`}>
                {asset.url && asset.contentType.startsWith("video/") ? (
                  <video className="take__media" src={asset.url} controls preload="metadata" />
                ) : asset.url && asset.contentType.startsWith("image/") ? (
                  <img className="take__media" src={asset.url} alt={asset.name} />
                ) : (
                  <a className="take__media take__media--file" href={asset.url ?? "#"} target="_blank" rel="noreferrer">
                    {asset.name}
                  </a>
                )}
                <div className="take__row">
                  <span className="cast-lens__count">{asset.name}</span>
                  <span className="cast-lens__actions">
                    <button
                      type="button"
                      className="cast-lens__action"
                      onClick={() => void accountStore.chooseTake(asset.id, subject)}
                    >
                      {asset === chosen ? "Chosen" : "Choose"}
                    </button>
                    <button type="button" className="cast-lens__action" onClick={() => void accountStore.removeAsset(asset.id)}>
                      Remove
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="project-actions">
          {mine !== null ? (
            <>
              <label className="project-action" htmlFor={inputId}>
                Add a take…
              </label>
              <input
                id={inputId}
                className="project-file"
                type="file"
                accept="video/*,image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  if (files.length) void accountStore.addFiles(files, "take", subject);
                }}
              />
            </>
          ) : null}
          <button type="button" className="project-action project-action--ghost" onClick={() => void copyBrief()}>
            {copied ? "Copied" : "Copy the brief"}
          </button>
        </div>
        <p className="project-copy project-door__hint">
          No video tool is chosen yet. The brief is what any of them is handed; an agent with the account
          door files what it built here with add_take.
        </p>
        <pre className="brief takes__brief">{brief}</pre>
      </div>
    </aside>
  );
}
