import { useEffect, useState } from "react";
import {
  ChevronIcon,
  FitIcon,
  GroupIcon,
  NoteIcon,
  OrganizeIcon,
  StructureIcon,
  BriefIcon,
  WallIcon,
  RedoIcon,
  ThemeIcon,
  UndoIcon,
} from "./BarIcons";
import { EditableText } from "./EditableText";
import { EIGHTHS_PER_PAGE, formatMinutes, formatPages } from "./board/reducer";
import { formatNextChange, type Theme, type ThemeSource } from "./theme";
import { wordSentence } from "./board/words";

export type BarLayer = "dock" | "strip" | "tall";

type GeneralBarProps = {
  layer: BarLayer;
  theme: Theme;
  scheduled: Theme;
  /** Whose choice the canvas is: the clock's, or the writer's until the next clock. */
  source: ThemeSource;
  onSetTheme: (mode: Theme | "clock") => void;
  onToggleTheme: () => void;
  onSetLayer: (layer: BarLayer) => void;
  onNewNote: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canGroup: boolean;
  onGroup: () => void;
  onOrganize: () => void;
  onStructure: () => void;
  /** What these words mean (R42). */
  onWords: () => void;
  /** A card or cards are selected: the brief for that segment (R28). */
  canBrief: boolean;
  onBrief: () => void;
  onTakes: () => void;
  zoom: number;
  canFit: boolean;
  /** What the wall asks right now (R22), and the door to it. */
  asks: number;
  onAsks: () => void;
  beats: number;
  /** Light the beat cards or the scene cards on the wall; with no beats, open Structure. */
  onShowRank: (rank: "beat" | "scene") => void;
  scenes: number;
  runtimeEighths: number;
  targetEighths: number;
  onSetTarget: (pages: number) => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export function GeneralBar({
  layer,
  theme,
  scheduled,
  onToggleTheme,
  source,
  onSetTheme,
  onSetLayer,
  onNewNote,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  canGroup,
  onGroup,
  onOrganize,
  onStructure,
  onWords,
  asks,
  onAsks,
  canBrief,
  onBrief,
  onTakes,
  zoom,
  canFit,
  beats,
  onShowRank,
  scenes,
  runtimeEighths,
  targetEighths,
  onSetTarget,
  onFit,
  onZoomIn,
  onZoomOut,
}: GeneralBarProps) {
  const nextChange = formatNextChange(theme);
  const followingClock = theme === scheduled;
  const over = runtimeEighths - targetEighths;
  const [wallOpen, setWallOpen] = useState(false);

  useEffect(() => {
    if (!wallOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setWallOpen(false);
    }
    function onDown(event: PointerEvent) {
      const el = event.target as HTMLElement | null;
      if (!el?.closest(".bar-wall")) setWallOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [wallOpen]);

  return (
    <aside
      className={`general-bar general-bar--${layer}`}
      aria-label="General bar"
    >
      {layer === "tall" ? (
        <>
          <div className="general-bar__header">
            <p className="general-bar__kicker">General</p>
            <button
              type="button"
              className="general-bar__toggle"
              aria-expanded={true}
              aria-label="Fold the general bar"
              onClick={() => onSetLayer("strip")}
            >
              ﹀
            </button>
          </div>

          {/* The readout: the facts the strip cannot say, one line each, and
              the verbs as words for anyone who never found the strip. */}
          <div className="readout">
            {/* Light | Dark | Clock as words (R9, "The Canvas Line"): the current one
                in ink, and a plain note saying what the clock does next. */}
            <div className="readout__line">
              <span className="readout__k">Canvas</span>
              <span className="readout__v readout__v--compact">
                <span className="readout__views" role="group" aria-label="Canvas">
                  {(["light", "dark", "clock"] as const).map((mode, index) => {
                    const on = mode === "clock" ? source === "auto" : source === "manual" && theme === mode;
                    return (
                      <span key={mode} className="readout__view-slot">
                        {index > 0 ? (
                          <span className="readout__bar" aria-hidden="true">
                            |
                          </span>
                        ) : null}
                        <button type="button" className={`readout__view ${on ? "is-on" : ""}`} aria-pressed={on} onClick={() => onSetTheme(mode)}>
                          {mode === "light" ? "Light" : mode === "dark" ? "Dark" : "Clock"}
                        </button>
                      </span>
                    );
                  })}
                </span>
                <br />
                <span className="readout__note">
                  {source === "manual"
                    ? followingClock
                      ? `your choice · the clock agrees · ${nextChange.toLowerCase()}`
                      : `your choice · the clock turns it ${nextChange.toLowerCase()}`
                    : `light by day, dark from 8:00 pm`}
                </span>
              </span>
              <span />
            </div>

            {/* The count and nothing else. No nudge under 8, no warning over 15 —
                the range is a guide the writer holds, not a rule we enforce (D21). */}
            <div className="readout__line">
              <span className="readout__k">Shape</span>
              <span className="readout__v">
                {/* A count points at what it counts: click lights those cards; with
                    no beats yet, the click opens Structure, the way a wall gets its first. */}
                <button
                  type="button"
                  className="readout__count has-tip"
                  data-tip={beats === 0 ? `No beats yet. ${wordSentence("beat")} Click to start from a structure.` : `${wordSentence("beat")} Click to light them on the wall.`}
                  onClick={() => onShowRank("beat")}
                >
                  {beats} {beats === 1 ? "beat" : "beats"}
                </button>
                {" · "}
                <button
                  type="button"
                  className="readout__count has-tip"
                  data-tip={`${wordSentence("scene")} Click to light them on the wall.`}
                  onClick={() => onShowRank("scene")}
                  disabled={scenes === 0}
                >
                  {scenes} {scenes === 1 ? "scene" : "scenes"}
                </button>
              </span>
              <span />
            </div>

            {/* An estimate, and it says so. The target sits beside it — over or
                under is the only judgement the bar makes. */}
            <div
              className={`readout__line has-tip ${over > 0 ? "is-over" : ""}`}
              data-tip={`A page runs about a minute on screen — fast for dialogue, slow for action — so ${formatPages(runtimeEighths)} pages is about ${formatMinutes(runtimeEighths)}. An estimate: unwritten scenes are your guesses.`}
            >
              <span className="readout__k">Runtime</span>
              <span className="readout__v">
                ≈{formatPages(runtimeEighths)} of{" "}
                <EditableText
                  as="span"
                  className="general-bar__target"
                  value={String(Math.round(targetEighths / EIGHTHS_PER_PAGE))}
                  onCommit={(text) => onSetTarget(Number(text.replace(/[^0-9]/g, "")))}
                  ariaLabel="Target script length in pages"
                  placeholder="120"
                />{" "}
                pages
                {over > 0 ? ` · ${formatPages(over)} over` : ""}
                <br />
                <span className="readout__note">
                  about {formatMinutes(runtimeEighths)} of {formatMinutes(targetEighths)}
                </span>
              </span>
              <span />
            </div>

            {/* Step four of the method (R22): what the wall asks, and the way in. */}
            <div className="readout__line">
              <span className="readout__k">Asks</span>
              <span className="readout__v">
                {asks === 0 ? "nothing to ask" : `${asks} ${asks === 1 ? "question" : "questions"}`}
              </span>
              <span className="readout__acts">
                <button type="button" className={`readout__act ${asks > 0 ? "is-warm" : ""}`} onClick={onAsks}>
                  read the wall
                </button>
              </span>
            </div>

            <div className="readout__line">
              <span className="readout__k">Wall</span>
              <span className="readout__v">{Math.round(zoom * 100)}%</span>
              <span className="readout__acts">
                <button type="button" className="readout__act" onClick={onZoomOut} aria-label="Zoom out">−</button>
                <span aria-hidden="true">·</span>
                <button type="button" className="readout__act" onClick={onZoomIn} aria-label="Zoom in">+</button>
                <span aria-hidden="true">·</span>
                <button type="button" className="readout__act" onClick={onFit} disabled={!canFit}>fit</button>
              </span>
            </div>

            <div className="readout__line readout__line--do">
              <span className="readout__k">Do</span>
              <span className="readout__acts readout__acts--wrap">
                <button type="button" className="readout__act" onClick={onNewNote}>New note</button>
                <span aria-hidden="true">·</span>
                <button type="button" className="readout__act" onClick={onUndo} disabled={!canUndo}>Undo</button>
                <span aria-hidden="true">·</span>
                <button type="button" className="readout__act" onClick={onRedo} disabled={!canRedo}>Redo</button>
                <span aria-hidden="true">·</span>
                <button type="button" className="readout__act" onClick={onOrganize}>Organize</button>
                <span aria-hidden="true">·</span>
                <button type="button" className="readout__act" onClick={onStructure}>Structure</button>
                <span aria-hidden="true">·</span>
                <button type="button" className="readout__act" onClick={onWords}>Words</button>
                {canGroup ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <button type="button" className="readout__act" onClick={onGroup}>Group</button>
                  </>
                ) : null}
                {canBrief ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <button type="button" className="readout__act" onClick={onBrief}>Brief</button>
                    <span aria-hidden="true">·</span>
                    <button type="button" className="readout__act" onClick={onTakes}>Takes</button>
                  </>
                ) : null}
              </span>
              <span />
            </div>
          </div>
        </>
      ) : (
        <div className="general-bar__row">
          <button
            type="button"
            className="general-bar__corner"
            aria-expanded={layer === "strip"}
            aria-label={layer === "dock" ? "Open action buttons" : "Hide action buttons"}
            onClick={() => onSetLayer(layer === "dock" ? "strip" : "dock")}
          >
            <ChevronIcon
              className="general-bar__corner-svg"
              direction={layer === "dock" ? "left" : "right"}
            />
          </button>
          {layer === "strip" ? (
            <div className="general-bar__strip">
              <button
                type="button"
                className="bar-icon"
                onClick={onNewNote}
                aria-label="New note"
                data-tip="New note"
              >
                <NoteIcon className="bar-icon__svg" />
              </button>
              <button
                type="button"
                className="bar-icon"
                onClick={onOrganize}
                aria-label="Organize notes"
                data-tip="Organize notes"
              >
                <OrganizeIcon className="bar-icon__svg" />
              </button>
              <button
                type="button"
                className="bar-icon"
                onClick={onStructure}
                aria-label="Start from a structure"
                data-tip="Start from a structure"
                title="Start from a structure"
              >
                <StructureIcon className="bar-icon__svg" />
              </button>
              {canBrief ? (
                <button
                  type="button"
                  className="bar-icon"
                  onClick={onBrief}
                  aria-label="Brief the selected scenes for video"
                data-tip="Brief the selected scenes for video"
                  title="Brief: everything the wall knows about this segment"
                >
                  <BriefIcon className="bar-icon__svg" />
                </button>
              ) : null}
              {/* The wall's zoom (question 8 answered): one icon that opens into
                  +, the percent, − and Fit above it; closed, it carries the percent. */}
              <span className="bar-wall">
                {wallOpen ? (
                  <div className="bar-fly" role="group" aria-label="The view">
                    <button type="button" className="bar-icon" onClick={onZoomIn} aria-label="Zoom in" data-tip="Zoom in">+</button>
                    <span className="bar-fly__pct">{Math.round(zoom * 100)}%</span>
                    <button type="button" className="bar-icon" onClick={onZoomOut} aria-label="Zoom out" data-tip="Zoom out">−</button>
                    <button type="button" className="bar-icon" onClick={() => { onFit(); setWallOpen(false); }} disabled={!canFit} aria-label="Fit the whole wall" data-tip="Fit the whole wall">
                      <FitIcon className="bar-icon__svg" />
                    </button>
                    <span className="bar-fly__rule" aria-hidden="true" />
                    <button
                      type="button"
                      className="bar-icon"
                      onClick={onToggleTheme}
                      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} canvas`}
                      data-tip={`Switch to ${theme === "dark" ? "light" : "dark"} canvas`}
                    >
                      <ThemeIcon className="bar-icon__svg" />
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  className={`bar-icon bar-icon--wall ${wallOpen ? "is-on" : ""}`}
                  onClick={() => setWallOpen((current) => !current)}
                  aria-expanded={wallOpen}
                  aria-label="The view: zoom, fit and canvas"
                  data-tip="The view: zoom, fit and canvas"
                >
                  <WallIcon className="bar-icon__svg" />
                  <span className="bar-icon__pct">{Math.round(zoom * 100)}%</span>
                </button>
              </span>
              {canGroup ? (
                <button
                  type="button"
                  className="bar-icon"
                  onClick={onGroup}
                  aria-label="Group selected notes"
                data-tip="Group selected notes"
                >
                  <GroupIcon className="bar-icon__svg" />
                </button>
              ) : null}
              <button
                type="button"
                className="bar-icon bar-icon--words"
                onClick={onWords}
                aria-label="What these words mean"
                data-tip="What these words mean"
              >
                ?
              </button>
              <button
                type="button"
                className="bar-icon"
                onClick={() => onSetLayer("tall")}
                aria-label="Show full general bar"
              >
                <ChevronIcon className="bar-icon__svg" direction="up" />
              </button>
              <button
                type="button"
                className="bar-icon"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo"
                data-tip="Undo"
                title="Undo (⌘Z)"
              >
                <UndoIcon className="bar-icon__svg" />
              </button>
              <button
                type="button"
                className="bar-icon"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo"
                data-tip="Redo"
                title="Redo (⇧⌘Z)"
              >
                <RedoIcon className="bar-icon__svg" />
              </button>
            </div>
          ) : null}
        </div>
      )}
    </aside>
  );
}
