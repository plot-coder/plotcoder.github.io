// Pages beside the wall (R23, slice b; mock C, revised).
//
// A panel down the right: the whole script in wall order, one scene per
// card — the heading from the place (or the headline), the headline as a
// synopsis, and the scene's text, editable, with the change line greyed as
// the placeholder until a word is written. Click a card and the panel scrolls
// to its scene; put the caret in a scene and its card lights on the wall.
// Widen to the whole window and back; the width is remembered per viewer.
// Nothing here is a printed page: elements are set as a script and measured,
// pagination is slice c.

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { PanelHead } from "./PanelHead";
import { headlineHeadsScene, sceneHeading } from "./board/fountain";
import { paginateBoard } from "./pagesLayout";
import { type Line } from "./board/paginate";
import { SceneEditor } from "./SceneEditor";
import { isRevised, revisedLines } from "./board/numbering";
import { type WallReading } from "./board/readWall";
import {
  formatPages,
  isMeasured,
  noteEighths,
  type BoardNote,
  type BoardState,
} from "./board/reducer";

type PagesPanelProps = {
  open: boolean;
  wide: boolean;
  /** As text (the editor), as pages (the print, R23 c), or as outline (the list, Roadmap 2 item 4). */
  view: "text" | "pages" | "outline";
  onView: (view: "text" | "pages" | "outline") => void;
  /** The outline's drag: put a card after another, on the wall. */
  onMoveAfter: (id: string, afterId: string | null) => void;
  /** Where each card is for the outline's lines: places and cast by name. */
  castNames: (note: BoardNote) => string;
  board: BoardState;
  reading: WallReading | null;
  /** The card whose scene should be in view: the selected one, or the one just clicked. */
  focusId: string | null;
  onClose: () => void;
  onToggleWide: () => void;
  onSetText: (id: string, text: string) => void;
  /** The caret is in this scene: light its card and bring it into view. */
  onFocusScene: (id: string | null) => void;
  /** Take the pages with you (R54): the sheet of formats. */
  onSaveAs: () => void;
};

export function PagesPanel({
  open,
  wide,
  view,
  onView,
  board,
  reading,
  focusId,
  onClose,
  onToggleWide,
  onSetText,
  onFocusScene,
  onSaveAs,
  onMoveAfter,
  castNames,
}: PagesPanelProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const byId = useMemo(() => new Map(board.notes.map((note) => [note.id, note])), [board.notes]);
  const order = useMemo(
    () => (reading ? reading.order.map((id) => byId.get(id)).filter(Boolean) as BoardNote[] : board.notes),
    [reading, byId, board.notes],
  );
  const listRef = useRef<HTMLDivElement>(null);

  // A click on a card scrolls the panel to its scene.
  useEffect(() => {
    if (!open || !focusId || !listRef.current) return;
    const target = listRef.current.querySelector<HTMLElement>(`[data-scene="${focusId}"]`);
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [open, focusId]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const el = document.activeElement as HTMLElement | null;
        if (el && el.tagName === "TEXTAREA") el.blur();
        else onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // The pages (R23 c): computed from the same order, never stored.
  const pages = useMemo(() => (open && view !== "text" ? paginateBoard(board, reading) : null), [open, view, board, reading]);

  if (!open) return null;

  const written = order.filter((note) => isMeasured(note)).length;
  const focusScene = pages?.scenes.find((scene) => scene.id === focusId) ?? null;
  let beat = 0;

  return (
    <aside className={`pages ${wide ? "pages--wide" : ""}`} aria-label="Pages">
      <PanelHead
        title="Pages"
        note={
          pages
            ? `${pages.pageCount} of ${Math.round(board.targetEighths / 8)}${focusScene ? ` · scene ${focusScene.number} on p. ${focusScene.page}` : ""}`
            : `${order.length} ${order.length === 1 ? "scene" : "scenes"} · ${written} written`
        }
        views={[
          { id: "text", name: "Text" },
          { id: "pages", name: "Pages" },
          { id: "outline", name: "Outline" },
        ]}
        view={view}
        onView={onView}
        verbs={
          <>
            {view === "pages" ? (
              <button type="button" className="cast-lens__action" onClick={() => window.print()}>
                Print
              </button>
            ) : null}
            <button type="button" className="cast-lens__action" onClick={onSaveAs} title="Markdown, plain text, Fountain, Final Draft or PDF">
              Save as…
            </button>
            <button type="button" className="cast-lens__action" onClick={onToggleWide}>
              {wide ? "Beside the wall" : "Widen"}
            </button>
          </>
        }
        onClose={onClose}
      />

      {pages && view === "outline" ? (
        <div className="pages__sheet pages__outline" ref={listRef}>
          <ol className="outline" aria-label="Outline">
            <li
              className={`outline__top ${overId === "__top" ? "is-over" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setOverId("__top");
              }}
              onDragLeave={() => setOverId((current) => (current === "__top" ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                if (dragId) onMoveAfter(dragId, null);
                setDragId(null);
                setOverId(null);
              }}
            >
              {dragId ? "Drop here to make it the first scene" : ""}
            </li>
            {pages.order.map((note, index) => {
              const scene = pages.scenes[index];
              const measured = isMeasured(note);
              const beat = note.rank === "beat";
              return (
                <li
                  key={note.id}
                  className={`outline__scene ${beat ? "is-beat" : ""} ${note.id === focusId ? "is-focus" : ""} ${dragId === note.id ? "is-drag" : ""} ${overId === note.id ? "is-over" : ""}`}
                  data-scene={note.id}
                  draggable
                  onDragStart={(event) => {
                    setDragId(note.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", note.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOverId(note.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragId && dragId !== note.id) onMoveAfter(dragId, note.id);
                    setDragId(null);
                    setOverId(null);
                  }}
                  onClick={() => onFocusScene(note.id)}
                >
                  <span className="outline__n">{scene?.number}</span>
                  <span className={`outline__sw outline__sw--${note.color}`} aria-hidden="true" />
                  <span className="outline__headline">
                    {note.headline || "Untitled"}
                    <span className="outline__meta">
                      {note.location ? ` · ${note.location}` : ""}
                      {note.when ? `${note.location ? ", " : " · "}${note.when}` : ""}
                      {castNames(note) ? ` · ${castNames(note)}` : ""}
                    </span>
                  </span>
                  <span className="outline__pages">{measured ? `p. ${scene?.page}` : `≈${formatPages(noteEighths(note))} pp`}</span>
                  <span className="outline__tag">{beat ? "beat" : ""}</span>
                </li>
              );
            })}
          </ol>
          <p className="pages__print-note">
            The wall's reading order as a list. Drag a scene and its card moves on the wall to sit after the
            one above it; Organize tidies the row.
          </p>
        </div>
      ) : pages ? (
        <div className="pages__sheet pages__sheet--print" ref={listRef}>
          {/* On screen: one continuous page, the editor. The page turns are drawn where the paginator puts them. */}
          <div className="script">
            <div className="script__number">1.</div>
            {pages.order.map((note, index) => {
              const scene = pages.scenes[index];
              const turns = pages.turnsOf.get(note.id) ?? [];
              const before = turns.filter((turn) => turn.src < 0);
              const inside = turns.filter((turn) => turn.src >= 0);
              const revision = board.revision;
              const revised = revision ? isRevised(note, revision.snapshot[note.id]) : false;
              return (
                <section
                  key={note.id}
                  className={`script__scene ${note.id === focusId ? "is-focus" : ""} ${revised ? `is-revised rev--${revision?.color}` : ""}`}
                  data-scene={note.id}
                >
                  {before.map((turn) => (
                    <div key={turn.page} className="scene-editor__turn scene-editor__turn--between" aria-hidden="true">
                      <span className="scene-editor__rule"><span className="scene-editor__page">{turn.page}.</span></span>
                    </div>
                  ))}
                  <h3 className="sl sl--heading">
                    <span className="pl__num pl__num--l">{scene?.number}</span>
                    {sceneHeading(note).slice(1)}
                    <span className="pl__num pl__num--r">{scene?.number}</span>
                  </h3>
                  <SceneEditor
                    note={note}
                    turns={inside}
                    revisedLines={revision ? revisedLines(note.text, revision.snapshot[note.id]?.text ?? null) : []}
                    onCommit={(text) => onSetText(note.id, text)}
                    onFocus={() => onFocusScene(note.id)}
                    onBlur={() => onFocusScene(null)}
                  />
                </section>
              );
            })}
            <p className="pages__print-note">
              Letter, Courier 12, fifty-five lines. The page turns where the paginator puts it; scene numbers
              follow the wall's order. Print sets it as separate pages.
            </p>
          </div>
          {/* In print: the same script as separate Letter pages. */}
          <div className="print-pages print-only" aria-hidden="true">
            {pages.pages.map((page) => (
              <div key={page.number} className="print-page" data-page={page.number}>
                <div className="print-page__number">{page.number}.</div>
                <div className="print-page__body">
                  {page.lines.map((line, index) => {
                    const note = line.noteId ? byId.get(line.noteId) : undefined;
                    const snapshot = board.revision && note ? board.revision.snapshot[note.id] : undefined;
                    const starred =
                      Boolean(board.revision) && note !== undefined && (line.src === -1 ? isRevised(note, snapshot) : typeof line.src === "number" && revisedLines(note.text, snapshot?.text ?? null).includes(line.src));
                    return <PrintLine key={index} line={line} first={false} focus={false} starred={starred} onFocus={() => {}} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="pages__sheet" ref={listRef}>
        {order.length === 0 ? (
          <p className="pages__empty">No cards yet. The script is the wall read out; add a card and its scene appears here.</p>
        ) : null}
        {order.map((note) => {
          const heading = sceneHeading(note).slice(1);
          const measured = isMeasured(note);
          // Not under a card with no place: its marked heading carries the headline already.
          const showSynopsis = !headlineHeadsScene(note) && note.headline.trim();
          const section = note.rank === "beat" ? `${(beat += 1)}. ${note.headline || "Untitled beat"}` : null;
          return (
            <section
              key={note.id}
              className={`scene ${note.id === focusId ? "is-focus" : ""} ${measured ? "is-measured" : ""}`}
              data-scene={note.id}
            >
              {section ? <p className="scene__section">{section}</p> : null}
              <h3 className="scene__heading">
                {heading}
                <span className="scene__measure">
                  {measured ? "" : "≈"}
                  {formatPages(noteEighths(note))} {noteEighths(note) === 8 ? "page" : "pages"} · {measured ? "measured" : "estimated"}
                </span>
              </h3>
              {showSynopsis ? <p className="scene__synopsis">= {note.headline}</p> : null}
              {/* A place left open: the writer's words for why, beneath the heading, never in it (round twenty-two, entry 70). */}
              {(note.locationOpen ?? "").trim() ? <p className="scene__synopsis">place open, in your words: {note.locationOpen}</p> : null}
              <SceneText
                note={note}
                onCommit={(text) => onSetText(note.id, text)}
                onFocus={() => onFocusScene(note.id)}
                onBlur={() => onFocusScene(null)}
              />
            </section>
          );
        })}
      </div>
      )}
    </aside>
  );
}

// One line of a printed page, at the element's column. A dual line is two.
function PrintLine({ line, first, focus, starred = false, onFocus }: { line: Line; first: boolean; focus: boolean; starred?: boolean; onFocus: () => void }) {
  if (line.kind === "dual") {
    return (
      <div className={`pl pl--dual ${focus ? "is-focus" : ""}`} data-scene={first ? line.noteId : undefined} onClick={onFocus}>
        <span className={`pl pl--${line.left?.kind ?? "blank"} pl--col`}>{line.left?.text}</span>
        <span className={`pl pl--${line.right?.kind ?? "blank"} pl--col`}>{line.right?.text}</span>
      </div>
    );
  }
  return (
    <div className={`pl pl--${line.kind} ${focus ? "is-focus" : ""} ${starred ? "is-starred" : ""}`} data-scene={first ? line.noteId : undefined} onClick={onFocus}>
      {line.kind === "heading" && line.sceneNumber ? <span className="pl__num pl__num--l">{line.sceneNumber}</span> : null}
      {line.text}
      {line.kind === "heading" && line.sceneNumber ? <span className="pl__num pl__num--r">{line.sceneNumber}</span> : null}
      {starred ? <span className="pl__star" aria-label="revised">*</span> : null}
    </div>
  );
}

type SceneTextProps = {
  note: BoardNote;
  onCommit: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

// A plain text area set as a script: Courier, the wall's width, growing with
// the scene. Commits on a pause and on blur, like the card's lines.
function SceneText({ note, onCommit, onFocus, onBlur }: SceneTextProps) {
  const [draft, setDraft] = useState(note.text);
  const [editing, setEditing] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const ref = useRef<HTMLTextAreaElement>(null);

  // The store's copy wins while the writer is not typing here (an agent may
  // have written the scene).
  useEffect(() => {
    if (!editing) setDraft(note.text);
  }, [note.text, editing]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  function commit(text: string) {
    window.clearTimeout(timer.current);
    if (text.replace(/\s+$/, "") !== note.text) onCommit(text);
  }

  function onChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const text = event.target.value;
    setDraft(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => commit(text), 400);
  }

  return (
    <textarea
      ref={ref}
      className="scene__text"
      value={draft}
      placeholder={note.change || "What happens, in the script's words?"}
      aria-label={`Scene text of ${note.headline}`}
      spellCheck={true}
      rows={2}
      onFocus={() => {
        setEditing(true);
        onFocus();
      }}
      onBlur={() => {
        setEditing(false);
        commit(draft);
        onBlur();
      }}
      onChange={onChange}
    />
  );
}
