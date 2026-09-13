import {
  ChevronIcon,
  FitIcon,
  GroupIcon,
  NoteIcon,
  OrganizeIcon,
  StructureIcon,
  BriefIcon,
  RedoIcon,
  ThemeIcon,
  UndoIcon,
} from "./BarIcons";
import { EditableText } from "./EditableText";
import { EIGHTHS_PER_PAGE, formatPages } from "./board/reducer";
import { formatNextChange, type Theme } from "./theme";

export type BarLayer = "dock" | "strip" | "tall";

type GeneralBarProps = {
  layer: BarLayer;
  theme: Theme;
  scheduled: Theme;
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
  /** A card or cards are selected: the brief for that segment (R28). */
  canBrief: boolean;
  onBrief: () => void;
  zoom: number;
  canFit: boolean;
  beats: number;
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
  canBrief,
  onBrief,
  zoom,
  canFit,
  beats,
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
              onClick={() => onSetLayer("strip")}
            >
              Collapse
            </button>
          </div>

          <div className="general-bar__item">
            <div className="general-bar__item-copy">
              <p className="general-bar__item-label">Canvas</p>
              <p className="general-bar__item-meta">
                {theme === "dark" ? "Black" : "White"}
                {followingClock ? " · follows the clock" : " · until the next clock"}
              </p>
            </div>
            <button
              type="button"
              className={`theme-switch theme-switch--${theme}`}
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} canvas`}
            >
              <span className="theme-switch__knob" />
              <span className="theme-switch__sun" aria-hidden="true" />
              <span className="theme-switch__moon" aria-hidden="true" />
            </button>
          </div>

          <p className="general-bar__clock">{nextChange}</p>

          <button type="button" className="new-note" onClick={onNewNote}>
            <span className="new-note__pad" aria-hidden="true" />
            New note
          </button>
          {/* Undo takes back the last step whoever made it — a drag, a typed
              line, or an agent's tool call that arrived through the bridge. */}
          <div className="undo-row">
            <button type="button" className="new-note new-note--half" onClick={onUndo} disabled={!canUndo}>
              Undo
            </button>
            <button type="button" className="new-note new-note--half" onClick={onRedo} disabled={!canRedo}>
              Redo
            </button>
          </div>
          {canGroup ? (
            <button type="button" className="new-note new-note--group" onClick={onGroup}>
              Group
            </button>
          ) : null}
          <button type="button" className="new-note" onClick={onOrganize}>
            Organize
          </button>
          <button type="button" className="new-note" onClick={onStructure}>
            Structure
          </button>
          {canBrief ? (
            <button type="button" className="new-note" onClick={onBrief}>
              Brief
            </button>
          ) : null}

          {/* The count and nothing else. No nudge under 8, no warning over 15 —
              the range is a guide the writer holds, not a rule we enforce (D21). */}
          <div className="general-bar__item">
            <div className="general-bar__item-copy">
              <p className="general-bar__item-label">Shape</p>
              <p className="general-bar__item-meta">
                {beats} {beats === 1 ? "beat" : "beats"} · {scenes}{" "}
                {scenes === 1 ? "scene" : "scenes"}
              </p>
            </div>
          </div>

          {/* An estimate, and it says so. The number that matters is not the
              total but where the runtime went, which is why the target sits
              beside it — over or under is the only judgement the bar makes. */}
          <div className={`general-bar__item ${over > 0 ? "is-over" : ""}`}>
            <div className="general-bar__item-copy">
              <p className="general-bar__item-label">Runtime</p>
              <p className="general-bar__item-meta">
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
              </p>
            </div>
          </div>

          <div className="general-bar__item">
            <div className="general-bar__item-copy">
              <p className="general-bar__item-label">Wall</p>
              <p className="general-bar__item-meta">{Math.round(zoom * 100)}% · Fit shows every card</p>
            </div>
            <div className="zoom-group">
              <button type="button" className="zoom-step" onClick={onZoomOut} aria-label="Zoom out">
                −
              </button>
              <button type="button" className="zoom-step" onClick={onZoomIn} aria-label="Zoom in">
                +
              </button>
            </div>
          </div>
          <button type="button" className="new-note" onClick={onFit} disabled={!canFit}>
            Fit the whole wall
          </button>
        </>
      ) : (
        <div className="general-bar__row">
          {layer === "strip" ? (
            <div className="general-bar__strip">
              <button
                type="button"
                className="bar-icon"
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} canvas`}
                data-tip={`Switch to ${theme === "dark" ? "light" : "dark"} canvas`}
              >
                <ThemeIcon className="bar-icon__svg" />
              </button>
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
              {canFit ? (
                <button
                  type="button"
                  className="bar-icon"
                  onClick={onFit}
                  aria-label="Fit the whole wall"
                data-tip="Fit the whole wall"
                >
                  <FitIcon className="bar-icon__svg" />
                </button>
              ) : null}
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
                className="bar-icon"
                onClick={() => onSetLayer("tall")}
                aria-label="Show full general bar"
              >
                <ChevronIcon className="bar-icon__svg" direction="up" />
              </button>
            </div>
          ) : null}
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
        </div>
      )}
    </aside>
  );
}
