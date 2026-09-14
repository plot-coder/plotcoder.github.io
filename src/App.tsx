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
import { castText } from "./castNames";
import { sceneNumbers } from "./board/numbering";
import {
  boardEighths,
  countRanks,
  EIGHTHS_PER_PAGE,
  type ArrowKind,
  type BoardCharacter,
  type CharacterField,
  boardPlaces,
  isMeasured,
  type BoardNote,
  atPlace,
  noteEighths,
} from "./board/reducer";
import { organizePoses } from "./board/organize";
import { ProjectModal } from "./ProjectModal";
import { RemindersModal } from "./RemindersModal";
import { StructureSheet } from "./StructureSheet";
import { PagesPanel } from "./PagesPanel";
import { paginateBoard } from "./pagesLayout";
import { BriefSheet } from "./BriefSheet";
import { TakesPanel } from "./TakesPanel";
import { AccountSheet } from "./AccountSheet";
import { WordsSheet } from "./WordsSheet";
import { AsksSheet } from "./AsksSheet";
import { AgentsSheet } from "./AgentsSheet";
import type { WordTarget } from "./board/words";
import { ProjectPicker } from "./ProjectPicker";
import { StoryMap } from "./StoryMap";
import {
  applyTheme,
  nextClockChange,
  readStoredTheme,
  resolveTheme,
  scheduledTheme,
  writeStoredTheme,
  type Theme,
  type ThemeSource,
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
const PAGES_KEY = "plotcoder.pages.open";
const PAGES_WIDE_KEY = "plotcoder.pages.wide";
const PAGES_VIEW_KEY = "plotcoder.pages.view";

function readPagesView(): "text" | "pages" | "outline" {
  try {
    const stored = localStorage.getItem(PAGES_VIEW_KEY);
    return stored === "pages" || stored === "outline" ? stored : "text";
  } catch {
    return "text";
  }
}

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored === "1";
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* per-viewer convenience only */
  }
}

function readBarLayer(): BarLayer {
  const stored = localStorage.getItem(BAR_KEY);
  if (stored === "dock" || stored === "strip" || stored === "tall") return stored;
  if (localStorage.getItem(BAR_KEY_LEGACY) === "0") return "dock";
  return "strip";
}

export function App() {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme());
  // Whose choice the canvas is: the clock's, or the writer's until the next clock (R9).
  const [themeSource, setThemeSource] = useState<ThemeSource>(() => (resolveTheme() === scheduledTheme() && readStoredTheme()?.source !== "manual" ? "auto" : readStoredTheme()?.source ?? "auto"));
  const [barLayer, setBarLayer] = useState<BarLayer>(readBarLayer);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  // You and your projects (R39, R40): the wordmark's sheet.
  const [accountOpen, setAccountOpen] = useState(false);
  // Start from a structure (R38).
  const [structureOpen, setStructureOpen] = useState(false);
  const [wordsOpen, setWordsOpen] = useState(false);
  const [asksOpen, setAsksOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  // The brief (R28, first step): for the selected card or cards.
  const [briefOpen, setBriefOpen] = useState(false);
  // Takes (R28, item 9): for the selected card or run.
  const [takesOpen, setTakesOpen] = useState(false);
  const [takesIds, setTakesIds] = useState<string[]>([]);
  // Pages beside the wall (R23 b): open, and whether it takes the window.
  const [pagesOpen, setPagesOpen] = useState<boolean>(() => readFlag(PAGES_KEY, false));
  const [pagesWide, setPagesWide] = useState<boolean>(() => readFlag(PAGES_WIDE_KEY, false));
  const [pagesView, setPagesView] = useState<"text" | "pages" | "outline">(() => readPagesView());
  // The scene with the caret: its card lights on the wall.
  const [sceneFocusId, setSceneFocusId] = useState<string | null>(null);
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
  const account = useSyncExternalStore(accountStore.subscribe, accountStore.getAccount);
  const history = useSyncExternalStore(boardStore.subscribe, boardStore.getHistory);
  // The project (R35): the boards, the premise, which board is open.
  const project = useSyncExternalStore(boardStore.subscribe, boardStore.getProject);
  const { notes, groups, arrows, characters } = board;
  const castFocusId = castOpen ? (castHeld ?? castHover) : null;
  const placeFocus = castOpen && castFocusId === null ? (placeHeld ?? placeHover) : null;
  // The places on the wall, for the lens and for completion on every card.
  const places = useMemo(
    () =>
      boardPlaces(board).map((place) => ({
        ...place,
        eighths: board.notes.filter((note) => atPlace(note, place.name)).reduce((sum, note) => sum + noteEighths(note), 0),
        people: [...new Set(board.notes.filter((note) => atPlace(note, place.name)).flatMap((note) => note.characterIds))]
          .map((id) => characters.find((character) => character.id === id)?.name)
          .filter((name): name is string => Boolean(name)),
      })),
    [board, characters],
  );
  const placeNames = useMemo(() => places.map((place) => place.name), [places]);
  // One reading of the wall for the lens and the map, so they agree.
  const reading = useMemo(() => readWall(board), [board]);
  // Cards with a take filed on them, alone or in a run (item 9): a mark on the card.
  const hasTake = useMemo(() => {
    const marked = new Set<string>();
    for (const asset of account.assets) {
      if (asset.kind !== "take") continue;
      if (asset.subject.startsWith("run:")) for (const id of asset.subject.slice(4).split("+")) marked.add(id);
      else marked.add(asset.subject);
    }
    return marked;
  }, [account.assets]);

  // Locked scene numbers on the cards (Roadmap 2, item 8); nothing until locked.
  const numberOf = useMemo(() => {
    if (!board.lock) return new Map<string, string>();
    const order = reading.order.map((id) => notes.find((note) => note.id === id)).filter(Boolean) as BoardNote[];
    return sceneNumbers(order, board.lock);
  }, [board.lock, reading, notes]);

  // The page each written scene starts on (R23 c), for the card's corner.
  const pageOf = useMemo(() => {
    if (!board.notes.some((note) => isMeasured(note))) return new Map<string, number>();
    return paginateBoard(board, reading).pageOf;
  }, [board, reading]);
  // The premise belongs to the project, not the board (D17).
  const premise = project.premise;
  const shape = countRanks(board);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
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

  // The scene that pays each plant off, as printed on the card (R31).
  const payoffOf = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const [from, tos] of Object.entries(reading.payoffs)) {
      // Each payoff's printed number: the lock's when locked, else its place in reading order.
      const labels = tos.map((to) => numberOf.get(to) ?? (reading.order.includes(to) ? String(reading.order.indexOf(to) + 1) : null) ?? notes.find((note) => note.id === to)?.headline ?? to);
      map.set(from, labels.length ? labels.join(", ") : null);
    }
    return map;
  }, [reading, numberOf, notes]);

  // Light elements on the wall for a moment; fit first so they are in the window.
  function light(find: () => HTMLElement[]) {
    if (notes.length > 0) fitToWall();
    window.setTimeout(() => {
      const els = find();
      for (const el of els) el.classList.add("is-shown");
      window.setTimeout(() => {
        for (const el of els) el.classList.remove("is-shown");
      }, 2200);
    }, 60);
  }

  /** The Shape line's counts: light the beats or the scenes; no beats yet opens Structure. */
  function showRank(rank: "beat" | "scene") {
    if (rank === "beat" && shape.beats === 0) {
      setStructureOpen(true);
      return;
    }
    light(() => Array.from(document.querySelectorAll<HTMLElement>(rank === "beat" ? ".note.is-beat" : ".note:not(.is-beat)")));
  }

  /** Show me from the Asks sheet: the cards a question is about. */
  function showCards(ids: string[]) {
    light(() => ids.map((id) => document.querySelector<HTMLElement>(`.note[data-note="${CSS.escape(id)}"]`)).filter((el): el is HTMLElement => Boolean(el)));
  }

  // Show me (R42): light the thing on the wall a word names, for a moment.
  // Fit the wall first so the thing is in the window. UI layer only.
  function showWord(target: WordTarget) {
    const selectors: Record<WordTarget, string[]> = {
      card: [".note"],
      logline: [".logline__question"],
      beat: [".note.is-beat", ".note"],
      change: [".note__change"],
      corner: [".note.is-planted .note__fold", ".note__fold"],
      arrow: [".note-arrow__line", ".note"],
      length: [".note__length"],
      cast: [".note .note__with-prefix", ".note"],
      place: [".note .note__with-prefix + .note__with-prefix", ".note .note__with-prefix", ".note"],
      group: [".note-group", ".note"],
      strip: [".story-map"],
    };
    if (target !== "logline" && target !== "strip" && notes.length > 0) fitToWall();
    window.setTimeout(() => {
      const el = selectors[target].map((sel) => document.querySelector<HTMLElement>(sel)).find(Boolean);
      if (!el) return;
      el.classList.add("is-shown");
      window.setTimeout(() => el.classList.remove("is-shown"), 2200);
    }, 60);
  }

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

  // Back from a reset link (R39): the sheet opens by itself, once — with the
  // new-password field when the link worked, on the door when it had gone
  // stale. Closing it is the writer's choice; nothing reopens it.
  const arrived = account.recovering || account.linkError !== null;
  useEffect(() => {
    if (arrived) setAccountOpen(true);
  }, [arrived]);

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
      setThemeSource("auto");
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
    setThemeMode(theme === "dark" ? "light" : "dark");
  }

  // Light and Dark are the writer's choice, kept until the next clock; Clock
  // hands the canvas back to the day (R9). The readout's three words.
  function setThemeMode(mode: Theme | "clock") {
    if (mode === "clock") {
      const next = scheduledTheme();
      setTheme(next);
      setThemeSource("auto");
      writeStoredTheme(next, "auto");
      return;
    }
    setTheme(mode);
    setThemeSource("manual");
    writeStoredTheme(mode, "manual");
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

  // Switching boards clears what belongs to the old wall: selection and the view.
  function openBoard(id: string) {
    if (!boardStore.openBoard(id)) return;
    setSelectedIds([]);
    setSelectedArrowId(null);
    setView(IDENTITY_VIEW);
  }

  function addBoard(name: string) {
    boardStore.addBoard(name);
    setSelectedIds([]);
    setSelectedArrowId(null);
    setView(IDENTITY_VIEW);
  }

  function removeBoard(id: string) {
    if (!boardStore.removeBoard(id)) return;
    setSelectedIds([]);
    setSelectedArrowId(null);
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

  // Every picture of a person as one package (Roadmap 2, item 5).
  async function downloadPictures(characterId: string, name: string) {
    const pictures = account.assets.filter((asset) => asset.subject === characterId && asset.kind === "picture");
    if (!pictures.length) return;
    const folder = name.replace(/[^A-Za-z0-9._-]+/g, "-") || "pictures";
    const bytes = await accountStore.packageAssets(pictures, folder);
    const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${folder}-pictures.zip`;
    link.click();
    URL.revokeObjectURL(url);
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
    const poses = organizePoses(boardStore.getState(), {
      onlyIds: selectedIds.length >= 2 ? selectedIds : undefined,
    });
    if (poses.length === 0) return;
    boardStore.dispatch({ type: "apply_poses", poses });
    selectNotes([]);
  }

  // A writer's own structure, saved from this wall's beats (Roadmap 2, item 7).
  function saveStructure(name: string) {
    boardStore.saveStructure(name, reading);
  }

  // Lay a structure's beats on the wall (R38): one command, one undo step,
  // then the window fits the wall so the new row is in view.
  function applyTemplate(templateId: string) {
    const own = project.structures?.find((structure) => structure.id === templateId);
    const created = boardStore.dispatch(
      own ? { type: "apply_template", template: own.id, beats: own.beats } : { type: "apply_template", template: templateId },
    ) as { id: string }[] | undefined;
    setStructureOpen(false);
    if (!created || created.length === 0) return;
    selectNotes(created.map((note) => note.id));
    setView(fitView(boardStore.getState().notes, viewportSize()));
  }

  // The outline (Roadmap 2, item 4): a dragged scene's card sits after the
  // one above it on the wall, on that row; null puts it before the first.
  function moveAfter(id: string, afterId: string | null) {
    const order = reading.order.map((noteId) => notes.find((note) => note.id === noteId)).filter(Boolean) as BoardNote[];
    if (afterId === null) {
      const first = order[0];
      if (!first || first.id === id) return;
      boardStore.dispatch({ type: "move_note", id, x: first.x - NOTE_WIDTH - 28, y: first.y });
      return;
    }
    const target = notes.find((note) => note.id === afterId);
    if (!target || target.id === id) return;
    boardStore.dispatch({ type: "move_note", id, x: target.x + NOTE_WIDTH + 28, y: target.y });
  }

  // Pages (R23 b): the scene's text onto its card.
  function setSceneText(id: string, text: string) {
    boardStore.dispatch({ type: "set_text", id, text });
  }

  function togglePages() {
    setPagesOpen((current) => {
      writeFlag(PAGES_KEY, !current);
      return !current;
    });
  }

  function togglePagesWide() {
    setPagesWide((current) => {
      writeFlag(PAGES_WIDE_KEY, !current);
      return !current;
    });
  }

  // A card's scene number is the script's address for it: open Pages there.
  // The panel scrolls to the one selected card when nothing else has focus.
  function openPagesAt(id: string) {
    setPagesOpen(true);
    writeFlag(PAGES_KEY, true);
    setSceneFocusId(null);
    setSelectedIds([id]);
    setSelectedArrowId(null);
  }

  // The caret is in a scene: light its card, and pan to it if it is off screen.
  function focusScene(id: string | null) {
    setSceneFocusId(id);
    if (!id) return;
    const note = notes.find((item) => item.id === id);
    if (!note) return;
    setSelectedIds([id]);
    setSelectedArrowId(null);
    const box = visibleBox(view, viewportSize());
    const inside =
      note.x >= box.x && note.x + NOTE_WIDTH <= box.x + box.w && note.y >= box.y && note.y + NOTE_HEIGHT <= box.y + box.h;
    if (!inside) setView((current) => centerOn(current, note, viewportSize()));
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
        onOpenAccount={() => setAccountOpen(true)}
        lock={board.lock}
        revision={board.revision}
        onLock={() => boardStore.dispatch({ type: "lock_numbers", order: reading.order })}
        onUnlock={() => boardStore.dispatch({ type: "unlock_numbers" })}
        onStartRevision={(name, color) => boardStore.dispatch({ type: "start_revision", name, color })}
        onEndRevision={() => boardStore.dispatch({ type: "end_revision" })}
      />
      <Logline
        logline={board.logline}
        premise={premise}
        onSetLogline={setLogline}
        onSetPremise={savePremise}
      />
      <div className="top-actions">
        <button
          type="button"
          className={`cast-launch ${pagesOpen ? "is-open" : ""}`}
          aria-pressed={pagesOpen}
          onClick={togglePages}
        >
          Pages
        </button>
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
          pictures={account.user ? account.assets : null}
          uploading={account.uploading}
          onAddPictures={(characterId, files) => void accountStore.addFiles(files, "picture", characterId)}
          onRemovePicture={(assetId) => void accountStore.removeAsset(assetId)}
          onDownloadPictures={(characterId, name) => void downloadPictures(characterId, name)}
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
          onSignIn={() => setAccountOpen(true)}
          onPrint={() => {
            setPagesOpen(true);
            writeFlag(PAGES_KEY, true);
            setPagesView("pages");
            try {
              localStorage.setItem(PAGES_VIEW_KEY, "pages");
            } catch {
              /* per-viewer convenience only */
            }
            window.setTimeout(() => window.print(), 400);
          }}
        />
        <AccountSheet open={accountOpen} onClose={() => setAccountOpen(false)} currentProjectId={project.id} onAgents={() => setAgentsOpen(true)} />
        <WordsSheet open={wordsOpen} onClose={() => setWordsOpen(false)} onShow={showWord} onAgents={() => setAgentsOpen(true)} />
        <AgentsSheet open={agentsOpen} onClose={() => setAgentsOpen(false)} />
        <AsksSheet open={asksOpen} findings={reading.findings} onClose={() => setAsksOpen(false)} onShow={showCards} />
        <ProjectPicker currentProjectId={project.id} />
        <StructureSheet
          open={structureOpen}
          board={board}
          own={project.structures ?? []}
          onClose={() => setStructureOpen(false)}
          onApply={applyTemplate}
          onSave={saveStructure}
          onForget={(id) => boardStore.removeStructure(id)}
        />
      </div>
      <BriefSheet
        open={briefOpen}
        board={board}
        ids={selectedIds}
        title={project.boards.find((item) => item.id === project.activeBoardId)?.name ?? ""}
        onClose={() => setBriefOpen(false)}
        onTakes={() => {
          setTakesIds(selectedIds);
          setBriefOpen(false);
          setTakesOpen(true);
        }}
      />
      <TakesPanel
        open={takesOpen && takesIds.length > 0}
        board={board}
        ids={takesIds}
        title={project.boards.find((item) => item.id === project.activeBoardId)?.name ?? ""}
        takes={account.user ? account.assets : null}
        uploading={account.uploading}
        onClose={() => setTakesOpen(false)}
      />
      <PagesPanel
        open={pagesOpen}
        wide={pagesWide}
        view={pagesView}
        onView={(next) => {
          setPagesView(next);
          try {
            localStorage.setItem(PAGES_VIEW_KEY, next);
          } catch {
            /* per-viewer convenience only */
          }
        }}
        onMoveAfter={moveAfter}
        castNames={(note) => castText(note.characterIds, characters)}
        board={board}
        reading={reading}
        focusId={sceneFocusId ?? (selectedIds.length === 1 ? selectedIds[0] : null)}
        onClose={() => {
          setPagesOpen(false);
          writeFlag(PAGES_KEY, false);
          setSceneFocusId(null);
        }}
        onToggleWide={togglePagesWide}
        onSetText={setSceneText}
        onFocusScene={focusScene}
      />
      <NoteBoard
        boardRef={boardRef}
        pagesOpen={pagesOpen && !pagesWide}
        view={view}
        onView={updateView}
        pageOf={pageOf}
        numberOf={numberOf}
        revision={board.revision}
        hasTake={hasTake}
        payoffOf={payoffOf}
        onOpenPages={openPagesAt}
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
        onWords={() => setWordsOpen(true)}
        onAgents={() => setAgentsOpen(true)}
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
        placeFocus={placeFocus}
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
        source={themeSource}
        onToggleTheme={toggleTheme}
        onSetTheme={setThemeMode}
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
        onWords={() => setWordsOpen(true)}
        asks={reading.findings.length}
        onAsks={() => setAsksOpen(true)}
        canBrief={selectedIds.length > 0}
        onBrief={() => setBriefOpen(true)}
        onTakes={() => {
          setTakesIds(selectedIds);
          setTakesOpen(true);
        }}
        zoom={view.scale}
        canFit={notes.length > 0}
        beats={shape.beats}
        onShowRank={showRank}
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
