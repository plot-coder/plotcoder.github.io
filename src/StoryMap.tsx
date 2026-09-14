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
import { EIGHTHS_PER_PAGE, formatPages, type BoardState } from "./board/reducer";
import type { WallReading } from "./board/readWall";
import { beatLabels, pageTicks, storyMapLayout, xFor } from "./storyMapLayout";
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
  /** A structure set over the strip (R52): its beats as marks at their pages. Null shows none. */
  structure: { name: string; beats: ReadonlyArray<Pick<TemplateBeat, "name" | "at">> } | null;
};

/** Room above the blocks for the structure's marks and names. */
const STRUCTURE_ROW = 34;

const PAPER: Record<string, string> = {
  yellow: "#ffe56a",
  pink: "#ffb6c8",
  blue: "#9fd4f5",
  green: "#c4e48a",
  orange: "#ffc56a",
};

const PAD = 28;
const HEIGHT_OPEN = 120;
const HEIGHT_RULER = 22;

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
  structure,
}: StoryMapProps) {
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
  const height = (open ? HEIGHT_OPEN : HEIGHT_RULER) + (open && structure ? STRUCTURE_ROW : 0);
  const axisY = open ? height - 24 : height - 8;
  const blockTop = axisY - 14;
  const beatTop = axisY - 24;
  const x = (eighths: number) => xFor(eighths, layout.spanEighths, width, PAD);
  const labels = open ? beatLabels(layout.beats, layout.spanEighths, width, PAD) : [];
  const over = layout.totalEighths - layout.targetEighths;

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
      aria-label="Story map"
      onMouseLeave={() => setScrubId(null)}
    >
      <button type="button" className="story-map__tab" onClick={onToggle} aria-expanded={open}>
        Story map · {open ? "hide" : "show"}
      </button>
      {open ? (
        <p className="story-map__readout">
          ≈{formatPages(layout.totalEighths)} of {formatPages(layout.targetEighths)} pages
          {over > 0 ? ` · ${formatPages(over)} over` : ""}
        </p>
      ) : null}
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
              </span>
            </>
          ) : (
            <span className="story-map__scrub-meta">
              {layout.cards.length ? "Move along the strip to read the story" : "No cards yet"}
            </span>
          )}
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
          {layout.totalEighths > layout.targetEighths ? (
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
                      <text className="story-map__run" x={left + w / 2} y={beatTop - 6}>
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
                const gy = beatTop - 18;
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
                          <line className="story-map__structure-line" x1={mx} y1={38} x2={mx} y2={beatTop - 30} />
                          <path className="story-map__structure-mark" d={`M ${mx - 3} 34 L ${mx + 3} 34 L ${mx} 39 Z`} />
                          {labelled ? (
                            <text className="story-map__structure-label" x={mx + 5} y={37}>
                              {index === 0 ? `${structure.name} · ${mark.name}` : mark.name}
                            </text>
                          ) : null}
                        </g>
                      );
                    })}
                    {past > 0 ? (
                      <text className="story-map__structure-past" x={width - PAD} y={37}>
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
              {open && !(!layout.targetInRange && x(layout.spanEighths) - x(tick) < 72) ? (
                <text className="story-map__page" x={x(tick)} y={axisY + 15}>
                  {tick / EIGHTHS_PER_PAGE}
                </text>
              ) : null}
            </g>
          ))}


          {/* The target: a line when the story is near it, a marker at the end of
              the axis while the story is still well short of it. */}
          {layout.targetInRange ? (
            <>
              <line
                className="story-map__target"
                x1={x(layout.targetEighths)}
                y1={open ? 6 : 2}
                x2={x(layout.targetEighths)}
                y2={axisY}
              />
              {open ? (
                <text className="story-map__target-label" x={x(layout.targetEighths) + 3} y={12}>
                  target
                </text>
              ) : null}
            </>
          ) : open ? (
            <text
              className="story-map__target-label story-map__target-label--ahead"
              x={x(layout.spanEighths)}
              y={axisY + 15}
            >
              target {formatPages(layout.targetEighths)} →
            </text>
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

          {/* Beat names above the blocks, only where they fit; the number is always on the block. */}
          {labels.map((label) => (
            <text
              key={label.id}
              className="story-map__beat-label"
              x={label.x + 1}
              y={beatTop - 6}
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
