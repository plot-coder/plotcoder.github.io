import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GeneralBar, type BarLayer } from "./GeneralBar";
import { Logline } from "./Logline";
import { NoteBoard } from "./NoteBoard";
import { readPremise, writePremise } from "./premiseStore";
import { boardStore, installWindowApi } from "./board/store";
import { type NoteColor, type NoteRank } from "./noteMock";
import { boardEighths, countRanks, EIGHTHS_PER_PAGE } from "./board/reducer";
import {
  organizeReadingOrder,
  snapshotPoses,
  type NotePose,
} from "./organizeLayout";
import { ProjectModal } from "./ProjectModal";
import { RemindersModal } from "./RemindersModal";
import {
  applyTheme,
  nextClockChange,
  resolveTheme,
  scheduledTheme,
  writeStoredTheme,
  type Theme,
} from "./theme";
import { fitView, IDENTITY_VIEW, zoomAt, type View } from "./viewport";

const BAR_KEY = "plotcoder.generalBar.layer";
const BAR_KEY_LEGACY = "plotcoder.generalBar.expanded";

function readBarLayer(): BarLayer {
  const stored = localStorage.getItem(BAR_KEY);
  if (stored === "dock" || stored === "strip" || stored === "tall") return stored;
  if (localStorage.getItem(BAR_KEY_LEGACY) === "0") return "dock";
  return "strip";
}

export function App() {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme());
  const [barLayer, setBarLayer] = useState<BarLayer>(readBarLayer);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const board = useSyncExternalStore(boardStore.subscribe, boardStore.getState);
  const { notes, groups, arrows } = board;
  // The premise belongs to the project, not the board, so it does not come from
  // the kernel. It lives in its own plotcoder.* key like reminders do.
  const [premise, setPremise] = useState<string>(readPremise);
  const shape = countRanks(board);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [scatterPoses, setScatterPoses] = useState<NotePose[] | null>(null);
  // The window is a viewport onto an unbounded wall (D15). This is per-viewer
  // state on purpose: it never enters the board record, the project file, or
  // later Postgres, because where you are looking is not part of the story.
  const boardRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(IDENTITY_VIEW);

  const updateView = useCallback((update: (current: View) => View) => {
    setView(update);
  }, []);

  const viewportSize = useCallback(() => {
    const rect = boardRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
  }, []);

  function fitToWall() {
    setView(fitView(notes, viewportSize()));
  }

  function zoomBy(factor: number) {
    const { width, height } = viewportSize();
    setView((current) => zoomAt(current, factor, { x: width / 2, y: height / 2 }));
  }

  useEffect(() => {
    boardStore.start();
    installWindowApi();
    return () => boardStore.stop();
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    function syncFromClock() {
      const next = resolveTheme();
      setTheme(next);
      writeStoredTheme(next, "auto");
    }

    let timer = 0;
    function arm() {
      const wait = Math.max(nextClockChange().getTime() - Date.now(), 250);
      timer = window.setTimeout(() => {
        syncFromClock();
        arm();
      }, wait);
    }

    arm();
    return () => window.clearTimeout(timer);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    writeStoredTheme(next, "manual");
  }

  function addNote() {
    boardStore.dispatch({ type: "create_note" });
  }

  function setLogline(text: string) {
    boardStore.dispatch({ type: "set_logline", logline: text });
  }

  function savePremise(text: string) {
    writePremise(text);
    setPremise(text.trim());
  }

  function recolorNote(id: string, color: NoteColor) {
    const ids =
      selectedIds.includes(id) && selectedIds.length >= 2 ? selectedIds : [id];
    boardStore.dispatch({ type: "recolor_notes", ids, color });
  }

  // Marking one card of a selection marks the whole selection, the same way
  // recolouring does — the gesture should not change meaning because of how
  // many cards you had picked.
  function setRank(id: string, rank: NoteRank) {
    const ids =
      selectedIds.includes(id) && selectedIds.length >= 2 ? selectedIds : [id];
    boardStore.dispatch({ type: "set_rank", ids, rank });
  }

  function setLength(id: string, lengthEighths: number) {
    const ids =
      selectedIds.includes(id) && selectedIds.length >= 2 ? selectedIds : [id];
    boardStore.dispatch({ type: "set_length", ids, lengthEighths });
  }

  function setTarget(pages: number) {
    boardStore.dispatch({
      type: "set_target",
      targetEighths: pages * EIGHTHS_PER_PAGE,
    });
  }

  function editNote(id: string, patch: { headline?: string; change?: string }) {
    boardStore.dispatch({ type: "update_note", id, ...patch });
  }

  function moveNote(id: string, x: number, y: number) {
    boardStore.dispatch({ type: "move_note", id, x, y }, { sync: false });
  }

  function moveMany(ids: string[], dx: number, dy: number) {
    boardStore.dispatch({ type: "nudge_notes", ids, dx, dy }, { sync: false });
  }

  function commitBoard() {
    boardStore.commit();
  }

  function groupSelected() {
    if (selectedIds.length < 2) return;
    boardStore.dispatch({ type: "create_group", noteIds: [...selectedIds] });
    setSelectedIds([]);
  }

  function ungroup(id: string) {
    boardStore.dispatch({ type: "ungroup", id });
  }

  function renameGroup(id: string, title: string) {
    boardStore.dispatch({ type: "rename_group", id, title });
  }

  function dropNote(id: string) {
    boardStore.dispatch({ type: "settle_note", id });
  }

  function organizeNotes() {
    setScatterPoses((current) => current ?? snapshotPoses(notes));
    const arranged = organizeReadingOrder(
      notes,
      groups,
      selectedIds.length >= 2 ? selectedIds : undefined,
    );
    boardStore.dispatch({
      type: "apply_poses",
      poses: arranged.map((note) => ({
        id: note.id,
        x: note.x,
        y: note.y,
        rotate: note.rotate,
      })),
    });
    selectNotes([]);
  }

  function scatterNotes() {
    if (!scatterPoses) return;
    boardStore.dispatch({ type: "apply_poses", poses: scatterPoses });
    setScatterPoses(null);
  }

  function selectNotes(ids: string[]) {
    setSelectedIds(ids);
    setSelectedArrowId(null);
  }

  function selectArrow(id: string | null) {
    setSelectedArrowId(id);
    if (id) setSelectedIds([]);
  }

  function addArrow(from: string, to: string) {
    boardStore.dispatch({ type: "create_arrow", from, to });
  }

  function deleteArrow(id: string) {
    boardStore.dispatch({ type: "delete_arrow", id });
    setSelectedArrowId((current) => (current === id ? null : current));
  }

  function raiseNote(id: string) {
    boardStore.dispatch({ type: "raise_note", id }, { sync: false });
  }

  function setLayer(layer: BarLayer) {
    setBarLayer(layer);
    localStorage.setItem(BAR_KEY, layer);
  }

  return (
    <div className="canvas">
      <p className="wordmark">PlotCoder</p>
      <Logline
        logline={board.logline}
        premise={premise}
        onSetLogline={setLogline}
        onSetPremise={savePremise}
      />
      <div className="top-actions">
        <RemindersModal
          open={remindersOpen}
          onOpen={() => setRemindersOpen(true)}
          onClose={() => setRemindersOpen(false)}
        />
        <ProjectModal
          open={projectOpen}
          onOpen={() => setProjectOpen(true)}
          onClose={() => setProjectOpen(false)}
        />
      </div>
      <NoteBoard
        boardRef={boardRef}
        view={view}
        onView={updateView}
        notes={notes}
        groups={groups}
        arrows={arrows}
        selectedIds={selectedIds}
        selectedArrowId={selectedArrowId}
        onMove={moveNote}
        onMoveMany={moveMany}
        onRaise={raiseNote}
        onSelect={selectNotes}
        onSelectArrow={selectArrow}
        onAddArrow={addArrow}
        onDeleteArrow={deleteArrow}
        onGroup={groupSelected}
        onUngroup={ungroup}
        onRenameGroup={renameGroup}
        onNoteDropped={dropNote}
        onRecolor={recolorNote}
        onSetRank={setRank}
        onSetLength={setLength}
        onEdit={editNote}
        onCommit={commitBoard}
      />
      <GeneralBar
        layer={barLayer}
        theme={theme}
        scheduled={scheduledTheme()}
        onToggleTheme={toggleTheme}
        onSetLayer={setLayer}
        onNewNote={addNote}
        canGroup={selectedIds.length >= 2}
        onGroup={groupSelected}
        onOrganize={organizeNotes}
        canScatter={scatterPoses !== null}
        onScatter={scatterNotes}
        zoom={view.scale}
        canFit={notes.length > 0}
        beats={shape.beats}
        scenes={shape.scenes}
        runtimeEighths={boardEighths(board)}
        targetEighths={board.targetEighths}
        onSetTarget={setTarget}
        onFit={fitToWall}
        onZoomIn={() => zoomBy(1.25)}
        onZoomOut={() => zoomBy(0.8)}
      />
    </div>
  );
}
