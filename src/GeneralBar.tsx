import {
  ChevronIcon,
  GroupIcon,
  NoteIcon,
  OrganizeIcon,
  ScatterIcon,
  ThemeIcon,
} from "./BarIcons";
import { formatNextChange, type Theme } from "./theme";

export type BarLayer = "dock" | "strip" | "tall";

type GeneralBarProps = {
  layer: BarLayer;
  theme: Theme;
  scheduled: Theme;
  onToggleTheme: () => void;
  onSetLayer: (layer: BarLayer) => void;
  onNewNote: () => void;
  canGroup: boolean;
  onGroup: () => void;
  onOrganize: () => void;
  canScatter: boolean;
  onScatter: () => void;
};

export function GeneralBar({
  layer,
  theme,
  scheduled,
  onToggleTheme,
  onSetLayer,
  onNewNote,
  canGroup,
  onGroup,
  onOrganize,
  canScatter,
  onScatter,
}: GeneralBarProps) {
  const nextChange = formatNextChange(theme);
  const followingClock = theme === scheduled;

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
          {canGroup ? (
            <button type="button" className="new-note new-note--group" onClick={onGroup}>
              Group
            </button>
          ) : null}
          <button type="button" className="new-note" onClick={onOrganize}>
            Organize
          </button>
          {canScatter ? (
            <button type="button" className="new-note" onClick={onScatter}>
              Scatter
            </button>
          ) : null}
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
              >
                <ThemeIcon className="bar-icon__svg" />
              </button>
              <button
                type="button"
                className="bar-icon"
                onClick={onNewNote}
                aria-label="New note"
              >
                <NoteIcon className="bar-icon__svg" />
              </button>
              <button
                type="button"
                className="bar-icon"
                onClick={onOrganize}
                aria-label="Organize notes"
              >
                <OrganizeIcon className="bar-icon__svg" />
              </button>
              {canGroup ? (
                <button
                  type="button"
                  className="bar-icon"
                  onClick={onGroup}
                  aria-label="Group selected notes"
                >
                  <GroupIcon className="bar-icon__svg" />
                </button>
              ) : null}
              {canScatter ? (
                <button
                  type="button"
                  className="bar-icon"
                  onClick={onScatter}
                  aria-label="Scatter notes"
                >
                  <ScatterIcon className="bar-icon__svg" />
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
