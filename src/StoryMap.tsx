// The Story Map (R32): a strip under the wall that lays the beats along a
// page axis, the runs between them as bands, setups as arcs, the target as a
// line. Screen chrome like the logline: it holds still while the wall pans.
//
// It is a view. It reads the same reading the Reminders modal and read_wall
// use, dispatches nothing, and D20 stays true — click a beat and the wall
// pans to the card; nothing on the wall moves.

import { useEffect, useRef, useState } from "react";
import { EIGHTHS_PER_PAGE, formatPages, type BoardState } from "./board/reducer";
import type { WallReading } from "./board/readWall";
import { beatLabels, pageTicks, storyMapLayout, xFor } from "./storyMapLayout";

type StoryMapProps = {
  board: BoardState;
  reading: WallReading;
  open: boolean;
  /** The person the Cast lens is looking through, if any: their scenes light up. */
  castFocusId: string | null;
  onToggle: () => void;
  onJump: (id: string) => void;
};

const PAD = 28;
const HEIGHT_OPEN = 88;
const HEIGHT_RULER = 22;

export function StoryMap({ board, reading, open, castFocusId, onToggle, onJump }: StoryMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

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
  const height = open ? HEIGHT_OPEN : HEIGHT_RULER;
  const axisY = open ? height - 24 : height - 8;
  const x = (eighths: number) => xFor(eighths, layout.spanEighths, width, PAD);
  const labels = open ? beatLabels(layout.beats, layout.spanEighths, width, PAD) : [];
  const nameOf = new Map(layout.cards.map((card) => [card.id, card.headline]));
  const over = layout.totalEighths - layout.targetEighths;

  return (
    <div
      ref={hostRef}
      className={`story-map ${open ? "is-open" : "is-ruler"}`}
      style={{ height }}
      aria-label="Story map"
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
      {width > 0 ? (
        <svg className="story-map__svg" width={width} height={height} role="img" aria-hidden="false">
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

          {/* The runs between beats. Alternate bands so each reads as a length;
              the one read the wall asked about is tinted. */}
          {open
            ? layout.bands.map((band, index) => {
                const left = x(band.start);
                const w = Math.max(x(band.end) - left, 0);
                const pages = Math.round((band.end - band.start) / EIGHTHS_PER_PAGE);
                return (
                  <g key={`${band.from}>${band.to}`}>
                    {index % 2 === 0 || band.sag ? (
                      <rect
                        className={`story-map__band ${band.sag ? "is-sag" : ""}`}
                        x={left}
                        y={axisY - 12}
                        width={w}
                        height={12}
                      />
                    ) : null}
                    {w > 24 ? (
                      <text className="story-map__run" x={left + w / 2} y={axisY - 15}>
                        {pages}
                      </text>
                    ) : null}
                  </g>
                );
              })
            : null}

          <line className="story-map__axis" x1={x(0)} y1={axisY} x2={x(layout.spanEighths)} y2={axisY} />
          {pageTicks(layout.spanEighths).map((tick) => (
            <g key={tick}>
              <line className="story-map__tick" x1={x(tick)} y1={axisY} x2={x(tick)} y2={axisY + 4} />
              {open ? (
                <text className="story-map__page" x={x(tick)} y={axisY + 15}>
                  {tick / EIGHTHS_PER_PAGE}
                </text>
              ) : null}
            </g>
          ))}

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

          {/* Every card: scenes as hairlines, beats as heavy marks. Click to go there. */}
          {layout.cards.map((card) => {
            const lit = castFocusId !== null && card.characterIds.includes(castFocusId);
            const dim = castFocusId !== null && !lit;
            return (
              <g
                key={card.id}
                className={`story-map__card ${card.beat ? "is-beat" : ""} ${lit ? "is-lit" : ""} ${dim ? "is-dim" : ""}`}
                onClick={() => onJump(card.id)}
              >
                <title>{card.headline}</title>
                <rect
                  className="story-map__hit"
                  x={x(card.start)}
                  y={0}
                  width={Math.max(x(card.start + card.length) - x(card.start), 4)}
                  height={height}
                />
                <line
                  className="story-map__mark"
                  x1={x(card.start)}
                  y1={axisY - (card.beat ? (open ? 16 : 8) : open ? 6 : 4)}
                  x2={x(card.start)}
                  y2={axisY + 3}
                />
                {lit ? <circle className="story-map__lit" cx={x(card.start)} cy={axisY} r={3.5} /> : null}
              </g>
            );
          })}

          {/* Setups as arcs under the axis; a fold nothing pays off as a short arc to nowhere. */}
          {open
            ? layout.setups.map((setup) => {
                const xa = x(setup.start);
                const xb = x(setup.end);
                const bow = Math.min(Math.abs(xb - xa) / 2, 14);
                return (
                  <path
                    key={setup.id}
                    className="story-map__setup"
                    d={`M ${xa} ${axisY + 2} Q ${(xa + xb) / 2} ${axisY + 2 + bow} ${xb} ${axisY + 2}`}
                  >
                    <title>{`${nameOf.get(setup.from)} sets up ${nameOf.get(setup.to)}`}</title>
                  </path>
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
                    <title>{`${card.headline} plants something nothing pays off`}</title>
                    <path d={`M ${xa} ${axisY + 2} Q ${xa + 10} ${axisY + 14} ${xa + 22} ${axisY + 10}`} />
                    <circle cx={xa + 24} cy={axisY + 9} r={2.2} />
                  </g>
                );
              })
            : null}

          {labels.map((label) => (
            <text
              key={label.id}
              className="story-map__beat-label"
              x={label.x + 3}
              y={axisY - (label.row === 0 ? 24 : 36)}
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
