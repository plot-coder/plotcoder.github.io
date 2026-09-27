// The Story Map (R32), second revision: a filmstrip under the wall.
//
// Every card is a block in its paper colour, as wide as its pages; beats are
// taller, wear their top bar and carry their number. Move along the strip and
// the card under the cursor reads itself at the left — headline, change line,
// cast, pages — so a pass of the cursor reads the story. Groups are brackets,
// setups are arcs, the sag is a warm underline, and a bracket under the axis
// says which pages the window is looking at.
//
// It is a view. It reads the same reading the Reminders modal and read_wall
// use, dispatches nothing, and D20 stays true — click a block and the wall
// pans to the card; nothing on the wall moves.

import { useEffect, useRef, useState } from "react";
import { EIGHTHS_PER_PAGE, TARGET_KINDS, formatMinutes, formatPages, targetChosen, targetWords, type BoardState } from "./board/reducer";
import type { WallReading } from "./board/readWall";
import { beatLabels, pageTicks, storyMapLayout, storyMapRows, xFor } from "./storyMapLayout";
import type { TemplateBeat } from "./board/templates";

type StoryMapProps = {
  board: BoardState;
  reading: WallReading;
  open: boolean;
  /** The person the Cast lens is looking through, if any: their scenes stay bright. */
  castFocusId: string | null;
  /** A place held or hovered in the lens (R37): its scenes light on the strip. */
  placeFocus: string | null;
  /** The card under the pointer on the wall, if any. */
  hoverId: string | null;
  /** The one selected card, if exactly one is. */
  selectedId: string | null;
  /** The cards the window is looking at. */
  visibleIds: ReadonlySet<string>;
  onToggle: () => void;
  onJump: (id: string) => void;
  /** The board's length, by the writer's choice: a kind, a number of pages, or their words for why it is not decided. */
  onSetTarget: (choice: TargetChoice) => void;
  /** A structure set over the strip (R52): its beats as marks at their pages. Null shows none. */
  structure: { name: string; beats: ReadonlyArray<Pick<TemplateBeat, "name" | "at">> } | null;
};

const PAPER: Record<string, string> = {
  yellow: "#ffe56a",
  pink: "#ffb6c8",
  blue: "#9fd4f5",
  green: "#c4e48a",
  orange: "#ffc56a",
};

const PAD = 28;

export type TargetChoice = { kind: "feature" | "hour" | "half-hour" } | { pages: number } | { open: string };

export function StoryMap({
  board,
  reading,
  open,
  castFocusId,
  placeFocus,
  hoverId,
  selectedId,
  visibleIds,
  onToggle,
  onJump,
  onSetTarget,
  structure,
}: StoryMapProps) {
  const [lengthOpen, setLengthOpen] = useState(false);
  const [ownPages, setOwnPages] = useState("");
  const [ownWords, setOwnWords] = useState("");
  const chosen = targetChosen(board);

  useEffect(() => {
    if (!lengthOpen) return;
    setOwnPages(chosen && !board.targetKind && !board.targetOpen ? String(Math.round(board.targetEighths / EIGHTHS_PER_PAGE)) : "");
    setOwnWords(board.targetOpen ?? "");
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLengthOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // The fields take the board's length as the menu opens, and are the writer's until it closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lengthOpen]);

  /** The menu opens where it was asked for: beside the tab, or at the axis's end under the target's words. */
  const [lengthSide, setLengthSide] = useState<"start" | "end">("start");
  function openLength(side: "start" | "end") {
    setLengthSide(side);
    setLengthOpen(true);
  }

  function choose(choice: TargetChoice) {
    onSetTarget(choice);
    setLengthOpen(false);
  }
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [scrubId, setScrubId] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => setWidth(host.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const layout = storyMapLayout(board, reading);
  // Only the rows that have something to show take room.
  const rows = storyMapRows({ open, structure: Boolean(structure), groups: layout.groups.length > 0, beats: layout.beats.length > 0 });
  const { height, axisY, blockTop, beatTop } = rows;
  const x = (eighths: number) => xFor(eighths, layout.spanEighths, width, PAD);
  const labels = open ? beatLabels(layout.beats, layout.spanEighths, width, PAD) : [];
  const over = targetChosen(board) && !board.targetOpen ? layout.totalEighths - layout.targetEighths : 0;

  // The scrub reads the card under the cursor on the strip, or the one under
  // the pointer on the wall, or the selected one.
  const readId = scrubId ?? hoverId ?? selectedId;
  const readCard = readId ? layout.cards.find((card) => card.id === readId) ?? null : null;

  const visible = layout.cards.filter((card) => visibleIds.has(card.id));
  const here =
    visible.length > 0
      ? {
          start: Math.min(...visible.map((card) => card.start)),
          end: Math.max(...visible.map((card) => card.start + card.length)),
        }
      : null;

  return (
    <div
      ref={hostRef}
      className={`story-map ${open ? "is-open" : "is-ruler"}`}
      style={{ height }}
      data-height={height}
      aria-label="Story map"
      onMouseLeave={() => setScrubId(null)}
    >
      <div className="story-map__tabs">
        <button type="button" className="story-map__tab" onClick={onToggle} aria-expanded={open}>
          Story map · {open ? "hide" : "show"}
        </button>
        {open ? (
          <button
            type="button"
            className={`story-map__tab story-map__length ${chosen ? "" : "is-asking"}`}
            aria-expanded={lengthOpen}
            aria-haspopup="dialog"
            onClick={() => (lengthOpen ? setLengthOpen(false) : openLength("start"))}
            title="How long is this board? Each board of a project has its own length."
          >
            {board.targetOpen ? (
              <>
                ≈{formatPages(layout.totalEighths)} {formatPages(layout.totalEighths) === "1" ? "page" : "pages"} · <span className="is-open-field">length not decided</span>
              </>
            ) : chosen ? (
              <>
                ≈{formatPages(layout.totalEighths)} of {formatPages(layout.targetEighths)} pages
                {/* The target in the writer's word, when they gave a kind and not a number (round twenty-two, entry 91). */}
                {targetWords(board) ? <small>{targetWords(board)}</small> : null}
                {over > 0 ? ` · ${formatPages(over)} over` : ""}
              </>
            ) : (
              <>{layout.totalEighths > 0 ? `≈${formatPages(layout.totalEighths)} ${formatPages(layout.totalEighths) === "1" ? "page" : "pages"} · ` : ""}Set a length</>
            )}
          </button>
        ) : null}
      </div>
      {open && lengthOpen ? (
        <>
          <button type="button" className="story-map__length-away" aria-label="Close the length menu" onClick={() => setLengthOpen(false)} />
          <div className={`story-map__menu ${lengthSide === "end" ? "story-map__menu--end" : ""}`} role="dialog" aria-label="How long is this board?">
            <p className="story-map__menu-k">How long is this board?</p>
            {(Object.keys(TARGET_KINDS) as Array<keyof typeof TARGET_KINDS>).map((kind) => {
              const pages = TARGET_KINDS[kind].eighths / EIGHTHS_PER_PAGE;
              const words = TARGET_KINDS[kind].words;
              return (
                <button key={kind} type="button" className={`story-map__opt ${board.targetKind === kind ? "is-on" : ""}`} onClick={() => choose({ kind })}>
                  <span>{words.charAt(0).toUpperCase() + words.slice(1)}</span>
                  <small>
                    {pages} pages · about {formatMinutes(TARGET_KINDS[kind].eighths)}
                  </small>
                </button>
              );
            })}
            <form
              className={`story-map__own ${chosen && !board.targetKind && !board.targetOpen ? "is-on" : ""}`}
              onSubmit={(event) => {
                event.preventDefault();
                const pages = Number(ownPages.replace(/[^0-9]/g, ""));
                if (!pages) return;
                // A hundred and twenty is a feature, by the app's own word for it; any other number is the writer's own.
                choose(pages === TARGET_KINDS.feature.eighths / EIGHTHS_PER_PAGE ? { kind: "feature" } : { pages });
              }}
            >
              <label htmlFor="story-map-own">My own</label>
              <input id="story-map-own" inputMode="numeric" value={ownPages} placeholder="45" onChange={(event) => setOwnPages(event.target.value)} />
              <small>pages</small>
              <button type="submit" className="story-map__set" disabled={!ownPages.replace(/[^0-9]/g, "")}>
                Set
              </button>
            </form>
            <form
              className={`story-map__own ${board.targetOpen ? "is-on" : ""}`}
              onSubmit={(event) => {
                event.preventDefault();
                if (ownWords.trim() || board.targetOpen) choose({ open: ownWords.trim() });
              }}
            >
              <label htmlFor="story-map-open">Not decided</label>
              <input id="story-map-open" className="is-wide" value={ownWords} placeholder="say why, in your words" onChange={(event) => setOwnWords(event.target.value)} />
              <button type="submit" className="story-map__set" disabled={!ownWords.trim() && !board.targetOpen}>
                {board.targetOpen && !ownWords.trim() ? "Clear" : "Hold"}
              </button>
            </form>
            <p className="story-map__menu-note">This board's length. Each board of a project has its own, so each episode can have one. A page runs about a minute.</p>
          </div>
        </>
      ) : null}
      {/* The card under the pointer, read over the wall's foot and only while there is one: the map keeps no row for it, and reading a card moves nothing. */}
      {open ? (
        <p className="story-map__scrub" aria-live="polite">
          {readCard ? (
            <>
              <b>
                {readCard.number !== null ? `Beat ${readCard.number} · ` : ""}
                {readCard.headline}
              </b>
              {readCard.change ? ` — ${readCard.change}` : ""}
              <span className="story-map__scrub-meta">
                {formatPages(readCard.length)} {readCard.length === EIGHTHS_PER_PAGE ? "page" : "pages"}
                {readCard.castNames.length ? ` · with ${readCard.castNames.join(", ")}` : ""}
                {readCard.location ? ` · at ${readCard.location}` : ""}
                {readCard.when ? `${readCard.location ? ", " : " · "}${readCard.when}` : ""}
              </span>
            </>
          ) : null}
        </p>
      ) : null}
      {width > 0 ? (
        <svg className="story-map__svg" width={width} height={height} role="img" aria-hidden="false">
          <defs>
            <pattern id="story-map-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="transparent" />
              <line x1="0" y1="0" x2="0" y2="6" className="story-map__hatch" />
            </pattern>
          </defs>
          {/* Past the target: warm ground, the same note the bar makes. */}
          {chosen && !board.targetOpen && layout.totalEighths > layout.targetEighths ? (
            <rect
              className="story-map__overrun"
              x={x(layout.targetEighths)}
              y={0}
              width={x(layout.totalEighths) - x(layout.targetEighths)}
              height={height}
            />
          ) : null}

          {/* You are here: the pages the window is looking at, lit behind the blocks. */}
          {open && here ? (
            <rect
              className="story-map__here"
              x={x(here.start) - 2}
              y={beatTop - 3}
              width={x(here.end) - x(here.start) + 4}
              height={axisY - beatTop + 9}
              rx={2}
            />
          ) : null}

          {/* Runs between beats: the page count above, and the sag as a warm
              underline under the axis, where nothing else is. */}
          {open
            ? layout.bands.map((band) => {
                const left = x(band.start);
                const w = Math.max(x(band.end) - left, 0);
                const pages = Math.round((band.end - band.start) / EIGHTHS_PER_PAGE);
                return (
                  <g key={`${band.from}>${band.to}`}>
                    {band.sag ? (
                      <rect className="story-map__sag" x={left} y={axisY + 1} width={w} height={5} />
                    ) : null}
                    {w > 24 ? (
                      <text className="story-map__run" x={left + w / 2} y={rows.labelY}>
                        {pages}
                      </text>
                    ) : null}
                  </g>
                );
              })
            : null}

          {/* Groups as brackets over the blocks they frame. */}
          {open
            ? layout.groups.map((group) => {
                const gx0 = x(group.start);
                const gx1 = x(group.end);
                const gy = rows.groupY - 5;
                return (
                  <g key={group.id}>
                    <path className="story-map__group" d={`M ${gx0} ${gy + 5} v -5 H ${gx1} v 5`} />
                    {gx1 - gx0 > 40 ? (
                      <text className="story-map__group-label" x={gx0 + 3} y={gy - 3}>
                        {group.title}
                      </text>
                    ) : null}
                  </g>
                );
              })
            : null}

          {/* A structure over the strip (R52): a mark at each beat's page, named where there is room. A view: nothing on the wall moves. */}
          {open && structure
            ? (() => {
                const marks = structure.beats.map((beat) => ({ name: beat.name, eighths: beat.at * board.targetEighths }));
                const shown = marks.filter((mark) => mark.eighths <= layout.spanEighths);
                const past = marks.length - shown.length;
                let lastLabelX = -Infinity;
                return (
                  <g className="story-map__structure">
                    {shown.map((mark, index) => {
                      const mx = x(mark.eighths);
                      const labelled = mx - lastLabelX > 58;
                      if (labelled) lastLabelX = mx;
                      return (
                        <g key={mark.name}>
                          <line className="story-map__structure-line" x1={mx} y1={rows.structureY + 4} x2={mx} y2={beatTop - 2} />
                          <path className="story-map__structure-mark" d={`M ${mx - 3} ${rows.structureY} L ${mx + 3} ${rows.structureY} L ${mx} ${rows.structureY + 5} Z`} />
                          {labelled ? (
                            <text className="story-map__structure-label" x={mx + 5} y={rows.structureY + 3}>
                              {index === 0 ? `${structure.name} · ${mark.name}` : mark.name}
                            </text>
                          ) : null}
                        </g>
                      );
                    })}
                    {past > 0 ? (
                      <text className="story-map__structure-past" x={width - PAD} y={rows.structureY + 3}>
                        {past} more past the end of the story so far →
                      </text>
                    ) : null}
                  </g>
                );
              })()
            : null}
          <line className="story-map__axis" x1={x(0)} y1={axisY} x2={x(layout.spanEighths)} y2={axisY} />
          {pageTicks(layout.spanEighths).map((tick) => (
            <g key={tick}>
              <line className="story-map__tick" x1={x(tick)} y1={axisY} x2={x(tick)} y2={axisY + 4} />
              {/* A page number gives way to the target label when the target is
                  still ahead and the two would share the axis's end (Robert, 2026-09-13). */}
              {open && !(!(chosen && !board.targetOpen && layout.targetInRange) && x(layout.spanEighths) - x(tick) < 72) ? (
                <text className="story-map__page" x={x(tick)} y={axisY + 15}>
                  {tick / EIGHTHS_PER_PAGE}
                </text>
              ) : null}
            </g>
          ))}


          {/* The target: a line when the story is near it, a marker at the end of
              the axis while the story is still well short of it. */}
          {!chosen || board.targetOpen ? null : layout.targetInRange ? (
            <>
              <line
                className="story-map__target"
                x1={x(layout.targetEighths)}
                y1={open ? 6 : 2}
                x2={x(layout.targetEighths)}
                y2={axisY}
              />
            </>
          ) : null}

          {/* Every card as a block. Click to go there; hover to read it. */}
          {layout.cards.map((card) => {
            const left = x(card.start);
            const w = Math.max(x(card.start + card.length) - left - 1, 2);
            const top = open ? (card.beat ? beatTop : blockTop) : axisY - (card.beat ? 8 : 4);
            const focused = castFocusId !== null || placeFocus !== null;
            const lit =
              (castFocusId !== null && card.characterIds.includes(castFocusId)) ||
              (placeFocus !== null && card.location.trim().toLowerCase() === placeFocus.trim().toLowerCase());
            const dim = focused && !lit;
            const hovered = card.id === scrubId || card.id === hoverId;
            return (
              <g
                key={card.id}
                className={`story-map__card ${card.beat ? "is-beat" : ""} ${dim ? "is-dim" : ""} ${hovered ? "is-hover" : ""} ${card.id === selectedId ? "is-selected" : ""}`}
                onClick={() => onJump(card.id)}
                onMouseEnter={() => setScrubId(card.id)}
                onMouseLeave={() => setScrubId((current) => (current === card.id ? null : current))}
              >
                <rect
                  className="story-map__block"
                  x={left}
                  y={top}
                  width={w}
                  height={axisY - top}
                  fill={PAPER[card.color] ?? "#ffe56a"}
                />
                {/* An estimated length is a guess; the hatch says so. Measured is solid (R23 b). */}
                {!card.measured && open ? (
                  <rect
                    className="story-map__estimate"
                    x={left}
                    y={top}
                    width={w}
                    height={axisY - top}
                    fill="url(#story-map-hatch)"
                  />
                ) : null}
                {card.beat ? (
                  <rect className="story-map__beat-bar" x={left} y={top} width={w} height={3} />
                ) : null}
                {card.plants ? (
                  <path className="story-map__fold" d={`M ${left} ${top} h 4 l -4 4 z`} />
                ) : null}
                {open && card.beat && card.number !== null && w > 9 ? (
                  <text className="story-map__number" x={left + w / 2} y={axisY - 4}>
                    {card.number}
                  </text>
                ) : null}
                <rect className="story-map__hit" x={left} y={0} width={w + 1} height={height} />
              </g>
            );
          })}

          {/* Setups as arcs under the axis; a fold nothing pays off as a short arc to nowhere. */}
          {open
            ? layout.setups.map((setup) => {
                const xa = x(setup.start);
                const xb = x(setup.end);
                const bow = Math.min(Math.abs(xb - xa) / 2, 12);
                return (
                  <path
                    key={setup.id}
                    className="story-map__setup"
                    d={`M ${xa} ${axisY + 2} Q ${(xa + xb) / 2} ${axisY + 2 + bow} ${xb} ${axisY + 2}`}
                  />
                );
              })
            : null}
          {open
            ? layout.unpaid.map((id) => {
                const card = layout.cards.find((item) => item.id === id);
                if (!card) return null;
                const xa = x(card.start);
                return (
                  <g key={id} className="story-map__unpaid">
                    <title>{`“${card.headline}” plants something, and no arrow pays it off yet. Where does it come back?`}</title>
                    <path d={`M ${xa} ${axisY + 2} Q ${xa + 10} ${axisY + 12} ${xa + 22} ${axisY + 9}`} />
                    <circle cx={xa + 24} cy={axisY + 8} r={2.2} />
                  </g>
                );
              })
            : null}

          {/* The target's own words, drawn last so they are above every block and can be pressed: they open the length menu
              where they stand (Robert, 2026-09-27). A board with no length chosen says so at the axis's end. */}
          {open
            ? (() => {
                const press = {
                  role: "button",
                  tabIndex: 0,
                  onClick: () => openLength("end"),
                  onKeyDown: (event: { key: string; preventDefault: () => void }) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openLength("end");
                    }
                  },
                } as const;
                if (board.targetOpen) {
                  return (
                    <text className="story-map__target-label story-map__target-label--ahead" x={x(layout.spanEighths)} y={axisY + 15} aria-label="The board's length: not decided. Press to set it." {...press}>
                      length not decided →
                    </text>
                  );
                }
                if (!chosen) {
                  return (
                    <text className="story-map__target-label story-map__target-label--ahead" x={x(layout.spanEighths)} y={axisY + 15} aria-label="Set this board's length" {...press}>
                      set a length →
                    </text>
                  );
                }
                return layout.targetInRange ? (
                  <text className="story-map__target-label" x={x(layout.targetEighths) + 3} y={12} aria-label={`The board's length: ${formatPages(layout.targetEighths)} pages. Press to change it.`} {...press}>
                    target{targetWords(board) ? ` · ${targetWords(board)}` : ""} {formatPages(layout.targetEighths)}
                  </text>
                ) : (
                  <text className="story-map__target-label story-map__target-label--ahead" x={x(layout.spanEighths)} y={axisY + 15} aria-label={`The board's length: ${formatPages(layout.targetEighths)} pages. Press to change it.`} {...press}>
                    {targetWords(board) ? `${targetWords(board)} · ` : "target "}
                    {formatPages(layout.targetEighths)} →
                  </text>
                );
              })()
            : null}

          {/* Beat names above the blocks, only where they fit; the number is always on the block. */}
          {labels.map((label) => (
            <text
              key={label.id}
              className="story-map__beat-label"
              x={label.x + 1}
              y={rows.labelY}
              onClick={() => onJump(label.id)}
            >
              {label.text}
            </text>
          ))}
        </svg>
      ) : null}
    </div>
  );
}
