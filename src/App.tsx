import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CastLens } from "./CastLens";
import { resolveCast } from "./castNames";
import { GeneralBar, type BarLayer } from "./GeneralBar";
import { Logline } from "./Logline";
import { NoteBoard } from "./NoteBoard";
import { ProjectCrumb } from "./ProjectCrumb";
import { accountStore } from "./board/account";
import { boardStore, installWindowApi } from "./board/store";
import { type NoteColor, type NoteRank } from "./noteMock";
import { readWall } from "./board/readWall";
import {
  boardEighths,
  countRanks,
  EIGHTHS_PER_PAGE,
  type ArrowKind,
  type BoardCharacter,
  type CharacterField,
  boardPlaces,
} from "./board/reducer";
import { organizePoses } from "./board/organize";
import { snapshotPoses, type NotePose } from "./organizeLayout";
import { ProjectModal } from "./ProjectModal";
import { RemindersModal } from "./RemindersModal";
import { StructureSheet } from "./StructureSheet";
import { StoryMap } from "./StoryMap";
import {
  applyTheme,
  nextClockChange,
  resolveTheme,
  scheduledTheme,
  writeStoredTheme,
  type Theme,
} from "./theme";
import { centerOn, fitView, IDENTITY_VIEW, visibleBox, zoomAt, type View } from "./viewport";
import { NOTE_HEIGHT, NOTE_WIDTH } from "./noteMock";

const BAR_KEY = "plotcoder.generalBar.layer";
const MAP_KEY = "plotcoder.storyMap";

function readMapOpen(): boolean {
  try {
    return localStorage.getItem(MAP_KEY) !== "hidden";
  } catch {
    return true;
  }
}
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
  // Start from a structure (R38).
  const [structureOpen, setStructureOpen] = useState(false);
  // The cast lens (R29): who the wall is being looked at through. Hover is a
  // glance, hold is a click; neither is board data.
  const [castOpen, setCastOpen] = useState(false);
  const [castHover, setCastHover] = useState<string | null>(null);
  const [castHeld, setCastHeld] = useState<string | null>(null);
  // A place in the lens (R37): the wall seen by where a scene happens.
  const [placeHover, setPlaceHover] = useState<string | null>(null);
  const [placeHeld, setPlaceHeld] = useState<string | null>(null);
  // The Story Map strip (R32). Whether it is open is per-viewer, like the bar.
  const [mapOpen, setMapOpen] = useState<boolean>(readMapOpen);
  // The card under the pointer on the wall, so the map can light its block.
  const [hoverNoteId, setHoverNoteId] = useState<string | null>(null);
  const board = useSyncExternalStore(boardStore.subscribe, boardStore.getState);
  const history = useSyncExternalStore(boardStore.subscribe, boardStore.getHistory);
  // The project (R35): the boards, the premise, which board is open.
  const project = useSyncExternalStore(boardStore.subscribe, boardStore.getProject);
  const { notes, groups, arrows, characters } = board;
  const castFocusId = castOpen ? (castHeld ?? castHover) : null;
  const placeFocus = castOpen && castFocusId === null ? (placeHeld ?? placeHover) : null;
  // The places on the wall, for the lens and for completion on every card.
  const places = useMemo(() => boardPlaces(board), [board]);
  const placeNames = useMemo(() => places.map((place) => place.name), [places]);
  // One reading of the wall for the lens and the map, so they agree.
  const reading = useMemo(() => readWall(board), [board]);
  // The premise belongs to the project, not the board (D17).
  const premise = project.premise;
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

  // Which cards the window is looking at, so the map can say "you are here".
  // Recomputed from the view; the board's size is read when it changes.
  const visibleIds = useMemo(() => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return new Set<string>();
    const box = visibleBox(view, { width: rect.width, height: rect.height });
    const ids = new Set<string>();
    for (const note of notes) {
      if (
        note.x < box.x + box.w &&
        note.x + NOTE_WIDTH > box.x &&
        note.y < box.y + box.h &&
        note.y + NOTE_HEIGHT > box.y
      ) {
        ids.add(note.id);
      }
    }
    return ids;
  }, [view, notes]);

  function fitToWall() {
    setView(fitView(notes, viewportSize()));
  }

  // A click on the Story Map: bring that card to the middle of the window.
  function jumpTo(id: string) {
    const note = notes.find((item) => item.id === id);
    if (!note) return;
    setView((current) => centerOn(current, note, viewportSize()));
    setSelectedIds([id]);
    setSelectedArrowId(null);
  }

  function toggleMap() {
    setMapOpen((current) => {
      const next = !current;
      try {
        localStorage.setItem(MAP_KEY, next ? "open" : "hidden");
      } catch {
        /* per-viewer convenience only */
      }
      return next;
    });
  }

  function zoomBy(factor: number) {
    const { width, height } = viewportSize();
    setView((current) => zoomAt(current, factor, { x: width / 2, y: height / 2 }));
  }

  useEffect(() => {
    boardStore.start();
    accountStore.start();
    installWindowApi();
    return () => boardStore.stop();
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // ⌘Z / ⇧⌘Z (Ctrl on other platforms) undo and redo on the wall. Inside a
  // field the browser's own undo of the text keeps working instead.
  useEffect(() => {
    function isTyping(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      return Boolean(
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable),
      );
    }
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        boardStore.redo();
      } else if (key === "z") {
        event.preventDefault();
        boardStore.undo();
      } else if (key === "y") {
        event.preventDefault();
        boardStore.redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    boardStore.setPremise(text);
  }

  // Switching boards clears what belongs to the old wall: selection, scatter memory, the view.
  function openBoard(id: string) {
    if (!boardStore.openBoard(id)) return;
    setSelectedIds([]);
    setSelectedArrowId(null);
    setScatterPoses(null);
    setView(IDENTITY_VIEW);
  }

  function addBoard(name: string) {
    boardStore.addBoard(name);
    setSelectedIds([]);
    setSelectedArrowId(null);
    setScatterPoses(null);
    setView(IDENTITY_VIEW);
  }

  function removeBoard(id: string) {
    if (!boardStore.removeBoard(id)) return;
    setSelectedIds([]);
    setSelectedArrowId(null);
    setScatterPoses(null);
    setView(IDENTITY_VIEW);
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

  // Names typed on a card (R29). Known names resolve to the roster's spelling;
  // a stranger is added to the roster on the way, so casting someone and
  // adding them are one motion. Applies to the whole selection like recolour.
  function castNames(id: string, names: string[]) {
    const ids =
      selectedIds.includes(id) && selectedIds.length >= 2 ? selectedIds : [id];
    const characterIds = resolveCast(names, boardStore.getState().characters).map((entry) => {
      if (entry.id) return entry.id;
      const added = boardStore.dispatch({ type: "add_character", name: entry.name }) as
        | BoardCharacter
        | undefined;
      return added?.id ?? null;
    });
    boardStore.dispatch({
      type: "set_cast",
      ids,
      characterIds: characterIds.filter((value): value is string => value !== null),
    });
  }

  // Where a scene happens (R37), typed on the card. Applies to the whole
  // selection, like the cast line.
  function setLocation(id: string, location: string) {
    const ids =
      selectedIds.includes(id) && selectedIds.length >= 2 ? selectedIds : [id];
    boardStore.dispatch({ type: "set_location", ids, location });
  }

  function addCharacter(name: string) {
    boardStore.dispatch({ type: "add_character", name });
  }

  function renameCharacter(id: string, name: string) {
    boardStore.dispatch({ type: "rename_character", id, name });
  }

  // The person's page (R36): any of its five lines.
  function updateCharacter(id: string, patch: Partial<Record<CharacterField, string>>) {
    boardStore.dispatch({ type: "update_character", id, ...patch });
  }

  function removeCharacter(id: string) {
    boardStore.dispatch({ type: "remove_character", id });
    setCastHeld((current) => (current === id ? null : current));
    setCastHover((current) => (current === id ? null : current));
  }

  function closeCast() {
    setCastOpen(false);
    setCastHover(null);
    setCastHeld(null);
    setPlaceHover(null);
    setPlaceHeld(null);
  }

  // Fold the corner (R31). Folding one card of a selection folds the selection,
  // the same way rank and colour behave.
  function setPlant(id: string, plants: boolean) {
    const ids =
      selectedIds.includes(id) && selectedIds.length >= 2 ? selectedIds : [id];
    boardStore.dispatch({ type: "set_plant", ids, plants });
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

  // Organize along the arrows (R34): the same module the agent's tool uses.
  function organizeNotes() {
    setScatterPoses((current) => current ?? snapshotPoses(notes));
    const poses = organizePoses(boardStore.getState(), {
      onlyIds: selectedIds.length >= 2 ? selectedIds : undefined,
    });
    if (poses.length === 0) return;
    boardStore.dispatch({ type: "apply_poses", poses });
    selectNotes([]);
  }

  // Lay a structure's beats on the wall (R38): one command, one undo step,
  // then the window fits the wall so the new row is in view.
  function applyTemplate(templateId: string) {
    const created = boardStore.dispatch({ type: "apply_template", template: templateId }) as
      | { id: string }[]
      | undefined;
    setStructureOpen(false);
    if (!created || created.length === 0) return;
    selectNotes(created.map((note) => note.id));
    setView(fitView(boardStore.getState().notes, viewportSize()));
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

  function addArrow(from: string, to: string, kind: ArrowKind) {
    boardStore.dispatch({ type: "create_arrow", from, to, kind });
  }

  function setArrowKind(id: string, kind: ArrowKind) {
    boardStore.dispatch({ type: "set_arrow_kind", id, kind });
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
    <div className={`canvas ${mapOpen ? "has-map" : "has-ruler"}`}>
      <ProjectCrumb
        project={project}
        shapeOf={boardStore.boardShape}
        onOpenBoard={openBoard}
        onAddBoard={addBoard}
        onRenameBoard={boardStore.renameBoard}
        onMoveBoard={boardStore.moveBoard}
        onRemoveBoard={removeBoard}
        onRenameProject={boardStore.renameProject}
        onSetPremise={savePremise}
      />
      <Logline
        logline={board.logline}
        premise={premise}
        onSetLogline={setLogline}
        onSetPremise={savePremise}
      />
      <div className="top-actions">
        <CastLens
          open={castOpen}
          characters={characters}
          notes={notes}
          reading={reading}
          hoverId={castHover}
          heldId={castHeld}
          onOpen={() => setCastOpen(true)}
          onClose={closeCast}
          onHover={setCastHover}
          onHold={setCastHeld}
          places={places}
          placeHover={placeHover}
          placeHeld={placeHeld}
          onPlaceHover={setPlaceHover}
          onPlaceHold={setPlaceHeld}
          onAdd={addCharacter}
          onRename={renameCharacter}
          onUpdate={updateCharacter}
          onRemove={removeCharacter}
          onJump={jumpTo}
        />
        <RemindersModal
          open={remindersOpen}
          board={board}
          onOpen={() => setRemindersOpen(true)}
          onClose={() => setRemindersOpen(false)}
        />
        <ProjectModal
          open={projectOpen}
          onOpen={() => setProjectOpen(true)}
          onClose={() => setProjectOpen(false)}
        />
        <StructureSheet
          open={structureOpen}
          board={board}
          onClose={() => setStructureOpen(false)}
          onApply={applyTemplate}
        />
      </div>
      <NoteBoard
        boardRef={boardRef}
        view={view}
        onView={updateView}
        notes={notes}
        groups={groups}
        arrows={arrows}
        characters={characters}
        castFocusId={castFocusId}
        placeFocus={placeFocus}
        places={placeNames}
        onCastNames={castNames}
        onLocation={setLocation}
        onStructure={() => setStructureOpen(true)}
        onHoverNote={setHoverNoteId}
        selectedIds={selectedIds}
        selectedArrowId={selectedArrowId}
        onMove={moveNote}
        onMoveMany={moveMany}
        onRaise={raiseNote}
        onSelect={selectNotes}
        onSelectArrow={selectArrow}
        onAddArrow={addArrow}
        onDeleteArrow={deleteArrow}
        onSetArrowKind={setArrowKind}
        onGroup={groupSelected}
        onUngroup={ungroup}
        onRenameGroup={renameGroup}
        onNoteDropped={dropNote}
        onRecolor={recolorNote}
        onSetRank={setRank}
        onSetLength={setLength}
        onSetPlant={setPlant}
        onEdit={editNote}
        onCommit={commitBoard}
      />
      <StoryMap
        board={board}
        reading={reading}
        open={mapOpen}
        castFocusId={castFocusId}
        hoverId={hoverNoteId}
        selectedId={selectedIds.length === 1 ? selectedIds[0] : null}
        visibleIds={visibleIds}
        onToggle={toggleMap}
        onJump={jumpTo}
      />
      <GeneralBar
        layer={barLayer}
        theme={theme}
        scheduled={scheduledTheme()}
        onToggleTheme={toggleTheme}
        onSetLayer={setLayer}
        onNewNote={addNote}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={() => boardStore.undo()}
        onRedo={() => boardStore.redo()}
        canGroup={selectedIds.length >= 2}
        onGroup={groupSelected}
        onOrganize={organizeNotes}
        onStructure={() => setStructureOpen(true)}
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
