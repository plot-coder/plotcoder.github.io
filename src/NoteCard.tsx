import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { wordSentence } from "./board/words";
import { CastLine } from "./CastLine";
import { PlaceLine } from "./PlaceLine";
import { EditableText } from "./EditableText";
import { DEFAULT_NOTE_EIGHTHS, formatPages, isMeasured, noteEighths, type BoardCharacter } from "./board/reducer";
import { NOTE_COLORS, type MockNote, type NoteColor, type NoteRank } from "./noteMock";

// The paper colours, for the fold's paper showing through a corner folded in (R58).
const PAPER: Record<NoteColor, string> = { yellow: "#ffe56a", pink: "#ffb6c8", blue: "#9fd4f5", green: "#c4e48a", orange: "#ffc56a" };

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
  /** When folded: where it pays off ("paid off in 14", "pays off in Episode two"), or null while unpaid. */
  payoff: string | null;
  /** The wall still asks about this fold (R58): a promise with no scene yet wears the warm colour. */
  payoffOpen: boolean;
  /** The receiving end (R58): what this card pays off from another board, and that fold's paper. */
  paysOff: { label: string; color: NoteColor } | null;
  /** Folds of other boards waiting for a scene here (R58). */
  waiting: Array<{ fromBoardId: string; fromNoteId: string; label: string }>;
  onClaim: (id: string, fromBoardId: string, fromNoteId: string) => void;
  onUnclaim: (id: string) => void;
  /** Open Pages at this scene: the number is the script's address for it. */
  onOpenPages: (id: string) => void;
  onCastNames: (id: string, names: string[], open: string) => void;
  /** Where and when the scene happens, typed as one line on the card (R37, R55). */
  onLocation: (id: string, location: string, when: string, whenOpen: string, locationOpen: string) => void;
  onRaise: (id: string) => void;
  /** The pointer is over this card (or has left it): the Story Map lights its block. */
  onHover: (id: string | null) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>, note: MockNote) => void;
  onArrowPointerDown: (event: PointerEvent<HTMLElement>, note: MockNote) => void;
  onRecolor: (id: string, color: NoteColor) => void;
  onSetRank: (id: string, rank: NoteRank) => void;
  onSetLength: (id: string, lengthEighths: number) => void;
  onSetPlant: (id: string, plants: boolean) => void;
  /** What the fold plants, in the writer's words (R62); "" keeps the fold and drops the words. */
  onSetPlantWhat: (id: string, what: string) => void;
  /** Leave the card open with the writer's words, or close it with "" (R59). */
  onSetOpen: (id: string, open: string) => void;
  /** The board's threads (R60), each saying whether this card is on it and which ends are open. */
  threads: Array<{ id: string; name: string; on: boolean; startOpen: boolean; endOpen: boolean }>;
  onStartThread: (id: string, name: string, end: "start" | "end") => void;
  /** Two versions of one scene (R65): the front card this one stands behind, the versions behind this one, and the cards it could stand behind. */
  versionOf: string | null;
  versions: Array<{ id: string; headline: string }>;
  candidates: Array<{ id: string; headline: string }>;
  onSetAlternative: (id: string, of: string | null) => void;
  onChooseVersion: (id: string, keep?: boolean) => void;
  /** Set the card aside, or bring it back (R66): on the wall and not in the film. */
  onSetAside: (id: string, aside: boolean) => void;
  onTieThread: (id: string, threadId: string, how: "start" | "end" | "through" | "off") => void;
  onEdit: (id: string, patch: { headline?: string; change?: string; changeOpen?: string }) => void;
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
  payoffOpen,
  paysOff,
  waiting,
  onClaim,
  onUnclaim,
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
  onSetPlantWhat,
  onSetOpen,
  threads,
  onStartThread,
  onTieThread,
  versionOf,
  versions,
  candidates,
  onSetAlternative,
  onSetAside,
  onChooseVersion,
  onEdit,
}: NoteCardProps) {
  const isBeat = note.rank === "beat";
  // The ordinary card is about a page. Only the exceptions wear their length on
  // the wall, so what you see while zoomed out is the outliers — which is the
  // only part of the estimate worth reading at a glance (R25).
  const sized = note.lengthEighths !== null && note.lengthEighths !== DEFAULT_NOTE_EIGHTHS;
  const [picking, setPicking] = useState(false);
  // The writer has just chosen to leave the change line open (R67): the caret waits for their words.
  const [leavingChange, setLeavingChange] = useState(false);
  const [sizing, setSizing] = useState(false);
  // The corner's picker (R58, R59): fold it, leave it open, or pay off a fold waiting from another board.
  const [cornering, setCornering] = useState(false);
  // The picker's list of cards this one could stand behind as another version (R65).
  const [choosingVersion, setChoosingVersion] = useState(false);
  // The open card's words, typed on its edge (R59).
  const isOpen = Boolean((note.open ?? "").trim());
  const [editingOpen, setEditingOpen] = useState(false);
  const [openText, setOpenText] = useState("");
  const openInput = useRef<HTMLInputElement>(null);
  // The fold's words (R62): typed on the edge after "Plants ·", as the open words are.
  const [editingPlant, setEditingPlant] = useState(false);
  const [plantText, setPlantText] = useState("");
  const plantInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editingPlant) plantInput.current?.focus();
  }, [editingPlant]);
  // A thread started at this card (R60): its name typed on the edge, like the open words; which end stays open.
  const [editingThread, setEditingThread] = useState<"start" | "end" | null>(null);
  const [threadText, setThreadText] = useState("");
  const threadInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingOpen) openInput.current?.focus();
  }, [editingOpen]);

  useEffect(() => {
    if (editingThread) threadInput.current?.focus();
  }, [editingThread]);

  function commitThread(text: string) {
    const end = editingThread;
    setEditingThread(null);
    const name = text.trim().replace(/\s+/g, " ");
    if (name && end) onStartThread(note.id, name, end);
  }

  function onThreadKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setEditingThread(null);
    } else if (event.key === "Enter") {
      event.preventDefault();
      commitThread(threadText);
    }
  }

  useEffect(() => {
    if (active) {
      setPicking(false);
      setSizing(false);
      setCornering(false);
    }
  }, [active]);

  function commitOpen(text: string) {
    setEditingOpen(false);
    const next = text.trim().replace(/\s+/g, " ");
    if (next !== (note.open ?? "")) onSetOpen(note.id, next);
  }

  function commitPlant(text: string) {
    setEditingPlant(false);
    const next = text.trim().replace(/\s+/g, " ");
    if (next !== (note.plantsWhat ?? "")) onSetPlantWhat(note.id, next);
  }

  function onPlantKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setEditingPlant(false);
    } else if (event.key === "Enter") {
      event.preventDefault();
      commitPlant(plantText);
    }
  }

  function onOpenKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setEditingOpen(false);
    } else if (event.key === "Enter") {
      event.preventDefault();
      commitOpen(openText);
    }
  }

  return (
    <article
      className={`note note--${note.color} ${isBeat ? "is-beat" : ""} ${sized ? "is-sized" : ""} ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${linking ? "is-linking" : ""} ${dropTarget ? "is-drop-target" : ""} ${picking || sizing || cornering ? "is-picking" : ""} ${dimmed ? "is-dim" : ""} ${note.aside ? "is-aside" : ""} ${note.plants ? "is-planted" : ""} ${paysOff ? "is-paying" : ""} ${isOpen ? "is-open" : ""} ${revised ? `is-revised rev--${revised}` : ""} ${versionOf ? "is-version" : ""}`}
      style={{
        left: note.x,
        top: note.y,
        zIndex: note.z + 10,
        transform: `rotate(${note.rotate}deg)`,
        ...(paysOff ? ({ "--from-paper": PAPER[paysOff.color] } as CSSProperties) : {}),
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
        aria-expanded={waiting.length || paysOff ? cornering : undefined}
        data-tip={wordSentence("corner")}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => {
          // The corner asks (R58, R59): fold it, leave it open, or pay off a fold waiting from another board.
          setPicking(false);
          setSizing(false);
          setCornering((open) => !open);
        }}
      >
        <span className="note__fold-flap" aria-hidden="true" />
      </button>
      {cornering ? (
        <div className="note__lengths note__corner-pick" onPointerDown={(event) => event.stopPropagation()}>
          <p className="note__picker-cap">Corner</p>
          <button
            type="button"
            className="note__length-option note__corner-option"
            onClick={() => {
              onSetPlant(note.id, !note.plants);
              setCornering(false);
              // Folding lands the caret on the edge for what it plants (R62), as leaving it open does for its words.
              if (!note.plants) {
                setPlantText("");
                setEditingPlant(true);
              }
            }}
          >
            {note.plants ? "Unfold: it plants nothing" : "Fold it: this scene plants something"}
          </button>
          <button
            type="button"
            className="note__length-option note__corner-option"
            onClick={() => {
              setCornering(false);
              if (isOpen) onSetOpen(note.id, "");
              else {
                setOpenText("");
                setEditingOpen(true);
              }
            }}
          >
            {isOpen ? "Close it: it is decided" : "Leave it open: not decided yet"}
          </button>
          {versionOf ? null : (
            <button
              type="button"
              className="note__length-option note__corner-option"
              onClick={() => {
                onSetAside(note.id, !note.aside);
                setCornering(false);
              }}
            >
              {note.aside ? "Bring it back into the film" : "Set it aside: not in the film"}
            </button>
          )}
          {versionOf ? (
            <>
              <button
                type="button"
                className="note__length-option note__corner-option"
                onClick={() => {
                  onChooseVersion(note.id);
                  setCornering(false);
                }}
              >
                Choose this version: it is the scene
              </button>
              <button
                type="button"
                className="note__length-option note__corner-option"
                onClick={() => {
                  onChooseVersion(note.id, true);
                  setCornering(false);
                }}
              >
                Choose it, and set the other aside
              </button>
              <button
                type="button"
                className="note__length-option note__corner-option"
                onClick={() => {
                  onSetAlternative(note.id, null);
                  setCornering(false);
                }}
              >
                Take it out from behind "{versionOf}"
              </button>
            </>
          ) : versions.length ? (
            <>
              <button
                type="button"
                className="note__length-option note__corner-option"
                onClick={() => {
                  onChooseVersion(note.id);
                  setCornering(false);
                }}
              >
                Choose this version: it is the scene
              </button>
              {versions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  className="note__length-option note__corner-option"
                  onClick={() => {
                    onChooseVersion(version.id);
                    setCornering(false);
                  }}
                >
                  Choose the other: "{version.headline}"
                </button>
              ))}
              <button
                type="button"
                className="note__length-option note__corner-option"
                onClick={() => {
                  onChooseVersion(note.id, true);
                  setCornering(false);
                }}
              >
                Choose this one, and set the other aside
              </button>
            </>
          ) : choosingVersion ? (
            <>
              <p className="note__picker-cap">Another version of</p>
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className="note__length-option note__corner-option"
                  onClick={() => {
                    onSetAlternative(note.id, candidate.id);
                    setChoosingVersion(false);
                    setCornering(false);
                  }}
                >
                  "{candidate.headline}"
                </button>
              ))}
            </>
          ) : candidates.length ? (
            <button type="button" className="note__length-option note__corner-option" onClick={() => setChoosingVersion(true)}>
              Another version of another card…
            </button>
          ) : null}
          {/* Threads (R60): start one here, or tie one of the board's to this card. */}
          <p className="note__picker-cap">Thread</p>
          <button
            type="button"
            className="note__length-option note__corner-option"
            onClick={() => {
              setCornering(false);
              setThreadText("");
              setEditingThread("end");
            }}
          >
            Start a thread here: it comes back later
          </button>
          <button
            type="button"
            className="note__length-option note__corner-option"
            onClick={() => {
              setCornering(false);
              setThreadText("");
              setEditingThread("start");
            }}
          >
            End a thread here: first seen somewhere not yet decided
          </button>
          {threads.map((thread) =>
            thread.on ? (
              <button
                key={thread.id}
                type="button"
                className="note__length-option note__corner-option"
                onClick={() => {
                  onTieThread(note.id, thread.id, "off");
                  setCornering(false);
                }}
              >
                Take it off "{thread.name}"
              </button>
            ) : (
              <button
                key={thread.id}
                type="button"
                className="note__length-option note__corner-option"
                onClick={() => {
                  onTieThread(note.id, thread.id, thread.startOpen ? "start" : thread.endOpen ? "end" : "through");
                  setCornering(false);
                }}
              >
                {thread.startOpen ? `"${thread.name}" is first seen here` : thread.endOpen ? `"${thread.name}" comes out here` : `Put it on "${thread.name}"`}
              </button>
            ),
          )}
          {waiting.length ? <p className="note__picker-cap">Pays off a fold from another board</p> : null}
          {waiting.map((fold) => (
            <button
              key={`${fold.fromBoardId}:${fold.fromNoteId}`}
              type="button"
              className="note__length-option note__corner-option"
              onClick={() => {
                onClaim(note.id, fold.fromBoardId, fold.fromNoteId);
                setCornering(false);
              }}
            >
              {fold.label}
            </button>
          ))}
          {paysOff ? (
            <button
              type="button"
              className="note__length-option note__corner-option"
              onClick={() => {
                onUnclaim(note.id);
                setCornering(false);
              }}
            >
              Take the claim back: it pays off nothing here
            </button>
          ) : null}
        </div>
      ) : null}
      {/* The top edge, right of the fold's square: the locked scene number (a
          button — the number is the script's address, so it opens Pages there),
          then the fold's state, a debt in the warm colour until a setup arrow
          leaves the card. One line, one home, whether or not the corner folds. */}
      {editingOpen ? (
        <span className="note__edge note__edge--editing" onPointerDown={(event) => event.stopPropagation()}>
          <span className="note__plant is-unpaid" aria-hidden="true">Open ·</span>
          <input
            ref={openInput}
            className="note__open-input"
            value={openText}
            aria-label={`What is open about ${note.headline}`}
            placeholder="what is not decided?"
            spellCheck={false}
            onChange={(event) => setOpenText(event.target.value)}
            onKeyDown={onOpenKeyDown}
            onBlur={() => commitOpen(openText)}
          />
        </span>
      ) : null}
      {editingPlant ? (
        <span className="note__edge note__edge--editing" onPointerDown={(event) => event.stopPropagation()}>
          <span className="note__plant is-unpaid" aria-hidden="true">Plants ·</span>
          <input
            ref={plantInput}
            className="note__open-input"
            value={plantText}
            aria-label={`What ${note.headline} plants`}
            placeholder="what does it plant?"
            spellCheck={false}
            onChange={(event) => setPlantText(event.target.value)}
            onKeyDown={onPlantKeyDown}
            onBlur={() => commitPlant(plantText)}
          />
        </span>
      ) : null}
      {editingThread ? (
        <span className="note__edge note__edge--editing" onPointerDown={(event) => event.stopPropagation()}>
          <span className="note__plant is-unpaid" aria-hidden="true">Thread ·</span>
          <input
            ref={threadInput}
            className="note__open-input"
            value={threadText}
            aria-label={editingThread === "start" ? `Name the thread that comes out at ${note.headline}` : `Name the thread that starts at ${note.headline}`}
            placeholder={editingThread === "start" ? "what comes out here?" : "what starts here?"}
            spellCheck={false}
            onChange={(event) => setThreadText(event.target.value)}
            onKeyDown={onThreadKeyDown}
            onBlur={() => commitThread(threadText)}
          />
        </span>
      ) : null}
      {!editingOpen && !editingThread && !editingPlant && (sceneNumber || note.plants || paysOff || isOpen || versionOf || note.aside) ? (
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
            <button
              type="button"
              className={`note__plant note__plant-words ${payoff && !payoffOpen ? "" : "is-unpaid"}`}
              aria-live="polite"
              aria-label={`Plants${note.plantsWhat ? ` ${note.plantsWhat}` : " something"}${payoff ? `, ${payoff}` : ", unpaid"}. Tap to say what it plants, in your words.`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                setPlantText(note.plantsWhat ?? "");
                setEditingPlant(true);
              }}
            >
              {sceneNumber ? <span aria-hidden="true">· </span> : null}
              {note.plantsWhat ? (
                <>
                  Plants · <b>{note.plantsWhat}</b>
                  {payoff ? <> · {payoff}</> : null}
                </>
              ) : payoff ? (
                <>
                  Plants · <b>{payoff}</b>
                </>
              ) : (
                "Plants · unpaid"
              )}
            </button>
          ) : null}
          {paysOff ? (
            <span className="note__plant" aria-label={`Pays off a fold from another board: ${paysOff.label}`}>
              {sceneNumber || note.plants ? <span aria-hidden="true">· </span> : null}
              Pays off · <b>{paysOff.label}</b>
            </span>
          ) : null}
          {note.aside ? (
            <span className="note__plant note__aside" aria-label="Set aside: on the wall, not in the film">
              {note.plants || paysOff ? <span aria-hidden="true">· </span> : null}
              Aside · <b>not in the film</b>
            </span>
          ) : null}
          {versionOf ? (
            <span className="note__plant is-unpaid" aria-label={`Another version of ${versionOf}; not in the story until chosen`}>
              {sceneNumber || note.plants || paysOff ? <span aria-hidden="true">· </span> : null}
              Version · <b>of "{versionOf}"</b>
            </span>
          ) : null}
          {isOpen ? (
            <button
              type="button"
              className="note__plant is-unpaid note__open"
              aria-label={`Open: ${note.open}. Tap to change the words; clear them to close the card.`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                setOpenText(note.open);
                setEditingOpen(true);
              }}
            >
              {sceneNumber || note.plants || paysOff ? <span aria-hidden="true">· </span> : null}
              Open · <b>{note.open}</b>
            </button>
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
      {/* The change line, or the writer's words for why it waits (R67): open on its own, so the card's other questions stand. */}
      {note.changeOpen || leavingChange ? (
        <span className="open-field note__change-open">
          <span className="open-mark" aria-hidden="true">
            Open
          </span>
          <EditableText
            as="p"
            className="note__change is-open-field"
            value={note.changeOpen}
            onCommit={(words) => {
              setLeavingChange(false);
              if (words.trim() !== note.changeOpen) onEdit(note.id, { changeOpen: words });
            }}
            ariaLabel={`What changes in ${note.headline}, left open`}
            placeholder="not decided: say why, in your words"
            autoFocus={leavingChange}
          />
        </span>
      ) : (
        <>
          <EditableText
            as="p"
            className="note__change"
            value={note.change}
            onCommit={(text) => onEdit(note.id, { change: text })}
            ariaLabel="What changes"
            placeholder="What changes?"
          />
          {!note.change.trim() || note.change.trim() === "What changes?" ? (
            <button
              type="button"
              className="field-offer note__offer note__change-offer"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setLeavingChange(true)}
            >
              Not decided yet…
            </button>
          ) : null}
        </>
      )}
      <CastLine
        headline={note.headline}
        characterIds={note.characterIds}
        maybeCharacterIds={note.maybeCharacterIds}
        castOpen={note.castOpen}
        characters={characters}
        onBegin={() => onRaise(note.id)}
        onCommit={(names, open) => onCastNames(note.id, names, open)}
      />
      <PlaceLine
        headline={note.headline}
        location={note.location}
        when={note.when}
        whenOpen={note.whenOpen}
        locationOpen={note.locationOpen}
        places={places}
        onBegin={() => onRaise(note.id)}
        onCommit={(location, when, whenOpen, locationOpen) => onLocation(note.id, location, when, whenOpen, locationOpen)}
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
