import { useEffect, useState, type PointerEvent } from "react";
import { wordSentence } from "./board/words";
import { CastLine } from "./CastLine";
import { PlaceLine } from "./PlaceLine";
import { EditableText } from "./EditableText";
import { DEFAULT_NOTE_EIGHTHS, formatPages, isMeasured, noteEighths, type BoardCharacter } from "./board/reducer";
import { NOTE_COLORS, type MockNote, type NoteColor, type NoteRank } from "./noteMock";

// The sizes a writer actually reaches for, in eighths of a page. Not a slider:
// nobody knows a scene is 1 3/8 pages before it exists, and pretending to that
// precision would invite fiddling with a number that is a guess either way.
const LENGTH_PRESETS = [2, 4, 8, 12, 16, 24, 32, 48];

type NoteCardProps = {
  note: MockNote;
  active: boolean;
  selected: boolean;
  linking: boolean;
  dropTarget: boolean;
  /** The cast lens is looking at someone who is not in this scene. */
  dimmed: boolean;
  characters: BoardCharacter[];
  /** Every place on the wall, for completion on the place line (R37). */
  places: string[];
  /** The page this scene starts on once it is written and paginated (R23 c). */
  page: number | null;
  /** The scene's number as printed, when the numbers are locked (item 8). */
  sceneNumber: string | null;
  /** The revision's colour when this card changed since its snapshot (item 8). */
  revised: string | null;
  /** A take is filed on this scene (item 9). */
  hasTake: boolean;
  /** When folded: the scene that pays it off, as printed ("14"), or null while unpaid. */
  payoff: string | null;
  /** Open Pages at this scene: the number is the script's address for it. */
  onOpenPages: (id: string) => void;
  onCastNames: (id: string, names: string[]) => void;
  onLocation: (id: string, location: string) => void;
  onRaise: (id: string) => void;
  /** The pointer is over this card (or has left it): the Story Map lights its block. */
  onHover: (id: string | null) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>, note: MockNote) => void;
  onArrowPointerDown: (event: PointerEvent<HTMLElement>, note: MockNote) => void;
  onRecolor: (id: string, color: NoteColor) => void;
  onSetRank: (id: string, rank: NoteRank) => void;
  onSetLength: (id: string, lengthEighths: number) => void;
  onSetPlant: (id: string, plants: boolean) => void;
  onEdit: (id: string, patch: { headline?: string; change?: string }) => void;
};

export function NoteCard({
  note,
  active,
  selected,
  linking,
  dropTarget,
  dimmed,
  characters,
  places,
  page,
  sceneNumber,
  revised,
  hasTake,
  payoff,
  onOpenPages,
  onCastNames,
  onLocation,
  onRaise,
  onHover,
  onPointerDown,
  onArrowPointerDown,
  onRecolor,
  onSetRank,
  onSetLength,
  onSetPlant,
  onEdit,
}: NoteCardProps) {
  const isBeat = note.rank === "beat";
  // The ordinary card is about a page. Only the exceptions wear their length on
  // the wall, so what you see while zoomed out is the outliers — which is the
  // only part of the estimate worth reading at a glance (R25).
  const sized = note.lengthEighths !== DEFAULT_NOTE_EIGHTHS;
  const [picking, setPicking] = useState(false);
  const [sizing, setSizing] = useState(false);

  useEffect(() => {
    if (active) {
      setPicking(false);
      setSizing(false);
    }
  }, [active]);

  return (
    <article
      className={`note note--${note.color} ${isBeat ? "is-beat" : ""} ${sized ? "is-sized" : ""} ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${linking ? "is-linking" : ""} ${dropTarget ? "is-drop-target" : ""} ${picking || sizing ? "is-picking" : ""} ${dimmed ? "is-dim" : ""} ${note.plants ? "is-planted" : ""} ${revised ? `is-revised rev--${revised}` : ""}`}
      style={{
        left: note.x,
        top: note.y,
        zIndex: note.z + 10,
        transform: `rotate(${note.rotate}deg)`,
      }}
      data-note={note.id}
      onPointerDown={(event) => onPointerDown(event, note)}
      onPointerEnter={() => onHover(note.id)}
      onPointerLeave={() => onHover(null)}
    >
      {/* Fold the corner (R31): this card plants something. Shown in the paper,
          like the beat bar, so it reads at Fit zoom and steals no colour. */}
      <button
        type="button"
        className="note__fold has-tip"
        aria-label={
          note.plants
            ? `Unfold the corner of ${note.headline}: it no longer plants something`
            : `Fold the corner of ${note.headline}: it plants something to pay off later`
        }
        aria-pressed={note.plants}
        data-tip={wordSentence("corner")}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onSetPlant(note.id, !note.plants)}
      >
        <span className="note__fold-flap" aria-hidden="true" />
      </button>
      {/* The top edge, right of the fold's square: the locked scene number (a
          button — the number is the script's address, so it opens Pages there),
          then the fold's state, a debt in the warm colour until a setup arrow
          leaves the card. One line, one home, whether or not the corner folds. */}
      {sceneNumber || note.plants ? (
        <span className="note__edge">
          {sceneNumber ? (
            <button
              type="button"
              className="note__number has-tip"
              aria-label={`Scene ${sceneNumber}: open it in Pages`}
              data-tip={`Scene ${sceneNumber}. The numbers are locked, so every scene keeps its number${/[A-Z]/.test(sceneNumber) ? ", and this one, added after the lock, keeps its own letter" : ""}; the numbers already out stay true. Click to open it in Pages.`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onOpenPages(note.id)}
            >
              {sceneNumber}
            </button>
          ) : null}
          {note.plants ? (
            <span className={`note__plant ${payoff ? "" : "is-unpaid"}`} aria-live="polite">
              {sceneNumber ? <span aria-hidden="true">· </span> : null}
              {payoff ? (
                <>
                  Plants · <b>paid off in {payoff}</b>
                </>
              ) : (
                "Plants · unpaid"
              )}
            </span>
          ) : null}
        </span>
      ) : null}
      {hasTake ? <span className="note__take" aria-label="A take exists for this scene" title="A take exists" /> : null}
      <EditableText
        as="h3"
        className="note__headline"
        value={note.headline}
        onCommit={(text) => onEdit(note.id, { headline: text })}
        ariaLabel="Card headline"
        placeholder="Headline"
      />
      <EditableText
        as="p"
        className="note__change"
        value={note.change}
        onCommit={(text) => onEdit(note.id, { change: text })}
        ariaLabel="What changes"
        placeholder="What changes?"
      />
      <CastLine
        headline={note.headline}
        characterIds={note.characterIds}
        characters={characters}
        onBegin={() => onRaise(note.id)}
        onCommit={(names) => onCastNames(note.id, names)}
      />
      <PlaceLine
        headline={note.headline}
        location={note.location}
        places={places}
        onBegin={() => onRaise(note.id)}
        onCommit={(location) => onLocation(note.id, location)}
      />
      <button
        type="button"
        className="note__rank has-tip"
        aria-label={isBeat ? `Make ${note.headline} a scene` : `Make ${note.headline} a beat`}
        aria-pressed={isBeat}
        data-tip={isBeat ? wordSentence("beat") : `Mark as a beat. ${wordSentence("beat")}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onSetRank(note.id, isBeat ? "scene" : "beat")}
      >
        <span className="note__rank-bar" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`note__length has-tip ${isMeasured(note) ? "is-measured" : ""}`}
        aria-label={`Length of ${note.headline}: ${formatPages(noteEighths(note))} pages${isMeasured(note) ? ", measured from its scene" : ""}`}
        aria-expanded={sizing}
        data-tip={
          isMeasured(note)
            ? `Measured from the scene’s text: ${formatPages(noteEighths(note))} pages${page !== null ? `, starting on page ${page}` : ""}. The picker sets the guess underneath, for when the text goes.`
            : wordSentence("length")
        }
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => {
          setPicking(false);
          setSizing((open) => !open);
        }}
      >
        {page !== null && isMeasured(note) ? `p. ${page}` : formatPages(noteEighths(note))}
      </button>
      {sizing ? (
        <div className="note__lengths" onPointerDown={(event) => event.stopPropagation()}>
          {/* Pages per scene (R42, Robert's caption): the unit named where it is set. */}
          <p className="note__picker-cap">Pages per scene</p>
          {LENGTH_PRESETS.map((eighths) => (
            <button
              key={eighths}
              type="button"
              className={`note__length-option ${note.lengthEighths === eighths ? "is-current" : ""}`}
              aria-pressed={note.lengthEighths === eighths}
              onClick={() => {
                onSetLength(note.id, eighths);
                setSizing(false);
              }}
            >
              {formatPages(eighths)}
            </button>
          ))}
          <p className="note__picker-foot">
            In eighths: <b>2/8</b> is a quarter of a page. A written scene measures itself.
          </p>
        </div>
      ) : null}
      <button
        type="button"
        className="note__handle"
        aria-label={`Draw arrow from ${note.headline}`}
        onPointerDown={(event) => {
          event.stopPropagation();
          onArrowPointerDown(event, note);
        }}
      />
      <button
        type="button"
        className="note__color"
        aria-label={`Change color of ${note.headline}`}
        aria-expanded={picking}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => {
          setSizing(false);
          setPicking((open) => !open);
        }}
      >
        <span className="note__color-stack" aria-hidden="true">
          <span className="note__color-chip note__color-chip--yellow" />
          <span className="note__color-chip note__color-chip--pink" />
          <span className="note__color-chip note__color-chip--blue" />
        </span>
      </button>
      {picking ? (
        <div className="note__swatches" onPointerDown={(event) => event.stopPropagation()}>
          <p className="note__picker-cap note__picker-cap--paper">Paper</p>
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`note__swatch note__swatch--${color} ${note.color === color ? "is-current" : ""}`}
              aria-label={`${color} paper`}
              aria-pressed={note.color === color}
              onClick={() => {
                onRecolor(note.id, color);
                setPicking(false);
              }}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
