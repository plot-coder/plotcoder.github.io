import { useEffect, useRef, useState, type PointerEvent } from "react";
import { arrowLayout, noteAtPoint, previewPath } from "./arrowGeometry";
import { NoteCard } from "./NoteCard";
import {
  NOTE_HEIGHT,
  NOTE_WIDTH,
  type MockArrow,
  type MockGroup,
  type MockNote,
  type NoteColor,
} from "./noteMock";

type DragState =
  | { kind: "note"; id: string; offsetX: number; offsetY: number }
  | { kind: "group"; id: string; lastX: number; lastY: number }
  | { kind: "lasso"; x: number; y: number; w: number; h: number }
  | { kind: "arrow"; fromId: string; x: number; y: number; hoverId: string | null };

type NoteBoardProps = {
  notes: MockNote[];
  groups: MockGroup[];
  arrows: MockArrow[];
  selectedIds: string[];
  selectedArrowId: string | null;
  onMove: (id: string, x: number, y: number) => void;
  onMoveMany: (ids: string[], dx: number, dy: number) => void;
  onRaise: (id: string) => void;
  onSelect: (ids: string[]) => void;
  onSelectArrow: (id: string | null) => void;
  onAddArrow: (from: string, to: string) => void;
  onDeleteArrow: (id: string) => void;
  onGroup: () => void;
  onUngroup: (id: string) => void;
  onRenameGroup: (id: string, title: string) => void;
  onNoteDropped: (id: string) => void;
  onRecolor: (id: string, color: NoteColor) => void;
  onEdit: (id: string, patch: { headline?: string; change?: string }) => void;
  onCommit: () => void;
};

const GROUP_PAD = 20;
const GROUP_TITLE = 34;

function capturePointer(event: PointerEvent<HTMLElement>) {
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    /* synthetic pointers in the mockup */
  }
}

function boardPoint(event: PointerEvent, board: HTMLElement) {
  const rect = board.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function noteBox(note: MockNote) {
  return { x: note.x, y: note.y, w: NOTE_WIDTH, h: NOTE_HEIGHT };
}

function intersects(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function groupBounds(notes: MockNote[]) {
  const left = Math.min(...notes.map((note) => note.x));
  const top = Math.min(...notes.map((note) => note.y));
  const right = Math.max(...notes.map((note) => note.x + NOTE_WIDTH));
  const bottom = Math.max(...notes.map((note) => note.y + NOTE_HEIGHT));
  return {
    x: left - GROUP_PAD,
    y: top - GROUP_PAD - GROUP_TITLE,
    w: right - left + GROUP_PAD * 2,
    h: bottom - top + GROUP_PAD * 2 + GROUP_TITLE,
  };
}

export function NoteBoard({
  notes,
  groups,
  arrows,
  selectedIds,
  selectedArrowId,
  onMove,
  onMoveMany,
  onRaise,
  onSelect,
  onSelectArrow,
  onAddArrow,
  onDeleteArrow,
  onGroup,
  onUngroup,
  onRenameGroup,
  onNoteDropped,
  onRecolor,
  onEdit,
  onCommit,
}: NoteBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Backspace" && event.key !== "Delete") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!selectedArrowId) return;
      event.preventDefault();
      onDeleteArrow(selectedArrowId);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDeleteArrow, selectedArrowId]);

  function startNoteDrag(event: PointerEvent<HTMLElement>, note: MockNote) {
    if (event.button !== 0) return;
    event.stopPropagation();
    capturePointer(event);
    onRaise(note.id);
    const point = boardPoint(event, boardRef.current!);
    setDrag({
      kind: "note",
      id: note.id,
      offsetX: point.x - note.x,
      offsetY: point.y - note.y,
    });
  }

  function startBoardDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    const point = boardPoint(event, event.currentTarget);
    capturePointer(event);
    setDrag({ kind: "lasso", x: point.x, y: point.y, w: 0, h: 0 });
  }

  function startGroupDrag(event: PointerEvent<HTMLElement>, id: string) {
    if (event.button !== 0) return;
    event.stopPropagation();
    capturePointer(event);
    setDrag({ kind: "group", id, lastX: event.clientX, lastY: event.clientY });
  }

  function startArrowDrag(event: PointerEvent<HTMLElement>, note: MockNote) {
    if (event.button !== 0 || !boardRef.current) return;
    event.stopPropagation();
    try {
      boardRef.current.setPointerCapture(event.pointerId);
    } catch {
      /* synthetic pointers in the mockup */
    }
    const point = boardPoint(event, boardRef.current);
    onSelect([]);
    onSelectArrow(null);
    setDrag({ kind: "arrow", fromId: note.id, x: point.x, y: point.y, hoverId: null });
  }

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    if (!drag || !boardRef.current) return;
    const point = boardPoint(event, boardRef.current);

    if (drag.kind === "note") {
      onMove(drag.id, point.x - drag.offsetX, point.y - drag.offsetY);
      return;
    }

    if (drag.kind === "group") {
      const group = groups.find((item) => item.id === drag.id);
      if (group) onMoveMany(group.noteIds, event.clientX - drag.lastX, event.clientY - drag.lastY);
      setDrag({ ...drag, lastX: event.clientX, lastY: event.clientY });
      return;
    }

    if (drag.kind === "arrow") {
      const hover = noteAtPoint(notes, point);
      setDrag({
        ...drag,
        x: point.x,
        y: point.y,
        hoverId: hover && hover.id !== drag.fromId ? hover.id : null,
      });
      return;
    }

    setDrag({
      ...drag,
      w: point.x - drag.x,
      h: point.y - drag.y,
    });
  }

  function endPointer() {
    const wasEditing =
      drag?.kind === "note" || drag?.kind === "group" || drag?.kind === "arrow";
    if (drag?.kind === "note") onNoteDropped(drag.id);
    if (drag?.kind === "arrow" && drag.hoverId) onAddArrow(drag.fromId, drag.hoverId);
    if (drag?.kind === "lasso") {
      const box = {
        x: Math.min(drag.x, drag.x + drag.w),
        y: Math.min(drag.y, drag.y + drag.h),
        w: Math.abs(drag.w),
        h: Math.abs(drag.h),
      };
      if (box.w < 8 && box.h < 8) {
        onSelect([]);
      } else {
        onSelect(notes.filter((note) => intersects(box, noteBox(note))).map((note) => note.id));
      }
    }
    setDrag(null);
    if (wasEditing) onCommit();
  }

  const lasso =
    drag?.kind === "lasso"
      ? {
          left: Math.min(drag.x, drag.x + drag.w),
          top: Math.min(drag.y, drag.y + drag.h),
          width: Math.abs(drag.w),
          height: Math.abs(drag.h),
        }
      : null;

  const selectedNotes = notes.filter((note) => selectedIds.includes(note.id));
  const chipBounds = selectedNotes.length >= 2 ? groupBounds(selectedNotes) : null;
  const notesById = new Map(notes.map((note) => [note.id, note]));
  const drawingFrom = drag?.kind === "arrow" ? notesById.get(drag.fromId) : undefined;
  const selectedArrow = arrows.find((arrow) => arrow.id === selectedArrowId);
  const selectedLayout =
    selectedArrow && notesById.get(selectedArrow.from) && notesById.get(selectedArrow.to)
      ? arrowLayout(
          notesById.get(selectedArrow.from)!,
          notesById.get(selectedArrow.to)!,
          arrows.some(
            (arrow) => arrow.from === selectedArrow.to && arrow.to === selectedArrow.from,
          ),
        )
      : null;

  return (
    <div
      ref={boardRef}
      className="note-board"
      onPointerDown={startBoardDrag}
      onPointerMove={movePointer}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      {groups.length === 0 && selectedIds.length === 0 && arrows.length === 0 && !lasso ? (
        <p className="group-hint">
          Drag on empty canvas to select notes, then Group. Drag a card’s handle onto another
          card to draw an arrow.
        </p>
      ) : null}

      {groups.map((group) => {
        const members = notes.filter((note) => group.noteIds.includes(note.id));
        if (members.length === 0) return null;
        const box = groupBounds(members);
        return (
          <div
            key={group.id}
            className="note-group"
            style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
            onPointerDown={(event) => startGroupDrag(event, group.id)}
          >
            <input
              className="note-group__title"
              value={group.title}
              aria-label="Group title"
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => onRenameGroup(group.id, event.target.value)}
            />
            <button
              type="button"
              className="note-group__ungroup"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onUngroup(group.id)}
            >
              Ungroup
            </button>
          </div>
        );
      })}

      <svg
        className={`note-arrows ${drag?.kind === "arrow" ? "is-drawing" : ""}`}
        aria-hidden="true"
      >
        <defs>
          <marker
            id="note-arrow-head"
            markerWidth="12"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 12 4, 0 8" fill="currentColor" />
          </marker>
        </defs>
        {arrows.map((arrow) => {
          const from = notesById.get(arrow.from);
          const to = notesById.get(arrow.to);
          if (!from || !to) return null;
          const paired = arrows.some((item) => item.from === arrow.to && item.to === arrow.from);
          const layout = arrowLayout(from, to, paired);
          return (
            <g
              key={arrow.id}
              className={`note-arrow ${arrow.id === selectedArrowId ? "is-selected" : ""}`}
            >
              <path
                className="note-arrow__hit"
                d={layout.d}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onSelect([]);
                  onSelectArrow(arrow.id);
                }}
              />
              <path
                className="note-arrow__line"
                d={layout.d}
                markerEnd="url(#note-arrow-head)"
              />
            </g>
          );
        })}
        {drag?.kind === "arrow" && drawingFrom ? (
          <path
            className="note-arrow__preview"
            d={previewPath(drawingFrom, { x: drag.x, y: drag.y })}
            markerEnd="url(#note-arrow-head)"
          />
        ) : null}
      </svg>

      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          active={drag?.kind === "note" && drag.id === note.id}
          selected={selectedIds.includes(note.id)}
          linking={drag?.kind === "arrow" && drag.fromId === note.id}
          dropTarget={drag?.kind === "arrow" && drag.hoverId === note.id}
          onPointerDown={startNoteDrag}
          onArrowPointerDown={startArrowDrag}
          onRecolor={onRecolor}
          onEdit={onEdit}
        />
      ))}

      {lasso ? <div className="lasso" style={lasso} /> : null}

      {chipBounds ? (
        <button
          type="button"
          className="group-chip"
          style={{ left: chipBounds.x + chipBounds.w, top: chipBounds.y }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onGroup}
        >
          Group
        </button>
      ) : null}

      {selectedLayout ? (
        <button
          type="button"
          className="arrow-remove"
          style={{ left: selectedLayout.mid.x, top: selectedLayout.mid.y }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onDeleteArrow(selectedArrowId!)}
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}
