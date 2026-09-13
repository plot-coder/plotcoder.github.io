// The cast lens (R29, option 2): the roster as a way of seeing the wall.
//
// A panel that stays open while you work. Hover a name and their cards stay
// bright while the rest fade. Click a row and the lens becomes that person's
// page (R36): their name as the title, the five lines of the page — looks,
// voice, wants, needs, notes — each asking the method's question until it is
// answered, and below them their scenes in wall order with a page number and
// the gap read-the-wall would flag, click to jump the wall there. "‹ Cast"
// goes back. The wall stays faded to that person the whole time the page is
// open, which is why the page lives here and not in a modal.

import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { type WallReading } from "./board/readWall";
import {
  CHARACTER_FIELDS,
  EIGHTHS_PER_PAGE,
  formatPages,
  type BoardCharacter,
  type BoardNote,
  type CharacterField,
} from "./board/reducer";
import { EditableText } from "./EditableText";

type CastLensProps = {
  open: boolean;
  characters: BoardCharacter[];
  notes: BoardNote[];
  reading: WallReading | null;
  hoverId: string | null;
  heldId: string | null;
  onOpen: () => void;
  onClose: () => void;
  onHover: (id: string | null) => void;
  onHold: (id: string | null) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onUpdate: (id: string, patch: Partial<Record<CharacterField, string>>) => void;
  onRemove: (id: string) => void;
  onJump: (noteId: string) => void;
};

// A blank line asks the question the field exists for (R18), rather than
// naming itself. Filled, the answer reads as a paragraph under the label.
const PAGE_LINES: Array<{ field: CharacterField; label: string; ask: string }> = [
  { field: "looks", label: "Looks", ask: "What would a stranger notice first?" },
  { field: "voice", label: "Voice", ask: "How do they sound — and how does it change when they lie?" },
  { field: "wants", label: "Wants", ask: "What do they want, plainly?" },
  { field: "needs", label: "Needs", ask: "What do they need that they will not admit?" },
  { field: "notes", label: "Notes", ask: "Anything you would pull up mid-scene." },
];

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(
    el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable),
  );
}

type Scene = { note: BoardNote; page: number; gapAfter: number | null };

/** A person's scenes in wall order, each with its page, and the flagged gap after it. */
function scenesOf(id: string, notes: BoardNote[], reading: WallReading | null): Scene[] {
  const byId = new Map(notes.map((note) => [note.id, note]));
  const order = reading ? reading.order.map((noteId) => byId.get(noteId)).filter(Boolean) as BoardNote[] : notes;
  const absent = reading?.findings.find((finding) => finding.kind === "absent" && finding.ids[0] === id);
  const scenes: Scene[] = [];
  let cursor = 0;
  let previous: Scene | null = null;
  for (const note of order) {
    if (note.characterIds.includes(id)) {
      const scene: Scene = { note, page: Math.floor(cursor / EIGHTHS_PER_PAGE) + 1, gapAfter: null };
      if (previous && absent && absent.ids[1] === previous.note.id && absent.ids[2] === note.id) {
        previous.gapAfter = cursor - (previousEnd(previous) ?? cursor);
      }
      scenes.push(scene);
      previous = scene;
    }
    cursor += note.lengthEighths;
  }
  return scenes;

  function previousEnd(scene: Scene): number | null {
    let at = 0;
    for (const note of order) {
      if (note.id === scene.note.id) return at + note.lengthEighths;
      at += note.lengthEighths;
    }
    return null;
  }
}

export function CastLens({
  open,
  characters,
  notes,
  reading,
  hoverId,
  heldId,
  onOpen,
  onClose,
  onHover,
  onHold,
  onAdd,
  onRename,
  onUpdate,
  onRemove,
  onJump,
}: CastLensProps) {
  const titleId = useId();
  const [draft, setDraft] = useState("");
  // Which person's page is open, if any. The page holds them on the wall.
  const [pageId, setPageId] = useState<string | null>(null);
  const page = pageId ? characters.find((character) => character.id === pageId) ?? null : null;

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !isTyping(event.target)) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // A page whose person was removed, or a lens that closed, is no page.
  useEffect(() => {
    if (!open || (pageId && !page)) setPageId(null);
  }, [open, pageId, page]);

  const focusId = heldId ?? hoverId;
  const focus = characters.find((character) => character.id === focusId) ?? null;
  const question = focus
    ? reading?.findings.find(
        (finding) =>
          (finding.kind === "uncast" || finding.kind === "absent") && finding.ids[0] === focus.id,
      ) ?? null
    : null;

  function countFor(id: string): number {
    return notes.filter((note) => note.characterIds.includes(id)).length;
  }

  function openPage(id: string) {
    setPageId(id);
    onHold(id);
  }

  function closePage() {
    setPageId(null);
    onHold(null);
  }

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    onAdd(name);
    setDraft("");
  }

  function onDraftKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft("");
      event.currentTarget.blur();
    }
  }

  return (
    <>
      <button
        type="button"
        className={`cast-launch ${open ? "is-open" : ""}`}
        aria-pressed={open}
        aria-controls={titleId}
        onClick={open ? onClose : onOpen}
      >
        Cast
      </button>

      {open && page ? (
        <section
          id={titleId}
          className="cast-lens cast-lens--page"
          aria-label={`${page.name}'s page`}
        >
          <div className="cast-lens__head">
            <button type="button" className="cast-lens__action cast-lens__back" onClick={closePage}>
              ‹ Cast
            </button>
            <div className="cast-lens__actions">
              <button
                type="button"
                className="cast-lens__action"
                onClick={() => {
                  closePage();
                  onRemove(page.id);
                }}
              >
                Remove
              </button>
              <button type="button" className="cast-lens__action" onClick={onClose}>
                Close
              </button>
            </div>
          </div>

          <div className="cast-page">
            <EditableText
              as="h3"
              className="cast-page__name"
              value={page.name}
              onCommit={(name) => {
                if (name) onRename(page.id, name);
              }}
              ariaLabel={`Name of ${page.name}`}
              placeholder="Name"
            />
            <PageMeta id={page.id} notes={notes} reading={reading} />

            {PAGE_LINES.map((line) => (
              <div key={line.field} className="cast-page__line">
                <p className="cast-lens__kicker">{line.label}</p>
                <EditableText
                  className="cast-page__text"
                  value={page[line.field]}
                  onCommit={(text) => onUpdate(page.id, { [line.field]: text })}
                  ariaLabel={`${line.label} of ${page.name}`}
                  placeholder={line.ask}
                />
              </div>
            ))}

            <PageScenes id={page.id} notes={notes} reading={reading} onJump={onJump} />
          </div>
        </section>
      ) : open ? (
        <section
          id={titleId}
          className="cast-lens"
          aria-label="Cast"
          onMouseLeave={() => onHover(null)}
        >
          <div className="cast-lens__head">
            <p className="cast-lens__kicker">
              Cast · {characters.length}
            </p>
            <div className="cast-lens__actions">
              {heldId ? (
                <button type="button" className="cast-lens__action" onClick={() => onHold(null)}>
                  Clear
                </button>
              ) : null}
              <button type="button" className="cast-lens__action" onClick={onClose}>
                Close
              </button>
            </div>
          </div>

          {characters.length > 0 ? (
            <ul className="cast-lens__list">
              {characters.map((character) => {
                const count = countFor(character.id);
                const held = heldId === character.id;
                const lit = focusId === character.id;
                const filled = CHARACTER_FIELDS.filter((field) => character[field].trim()).length;
                return (
                  <li
                    key={character.id}
                    className={`cast-lens__row ${lit ? "is-focus" : ""} ${held ? "is-held" : ""}`}
                    onMouseEnter={() => onHover(character.id)}
                    onClick={(event) => {
                      if (isTyping(event.target)) return;
                      openPage(character.id);
                    }}
                  >
                    <EditableText
                      as="span"
                      className="cast-lens__name"
                      value={character.name}
                      onCommit={(name) => {
                        if (name) onRename(character.id, name);
                      }}
                      ariaLabel={`Name of ${character.name}`}
                      placeholder="Name"
                    />
                    <span className={`cast-lens__count ${count === 0 ? "is-none" : ""}`}>
                      {count === 0 ? "no card" : count === 1 ? "1 card" : `${count} cards`}
                    </span>
                    <button
                      type="button"
                      className={`cast-lens__open ${filled ? "has-page" : ""}`}
                      aria-label={`Open ${character.name}'s page`}
                      title={filled ? `${character.name}'s page · ${filled} of 5 lines` : `${character.name}'s page`}
                      onClick={(event) => {
                        event.stopPropagation();
                        openPage(character.id);
                      }}
                    >
                      ›
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="cast-lens__empty">No one yet. Add someone below, or type a name on a card.</p>
          )}

          <form className="cast-lens__add" onSubmit={add}>
            <input
              className="cast-lens__input"
              value={draft}
              placeholder="Add someone…"
              aria-label="Add someone to the cast"
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onDraftKey}
            />
          </form>

          {focus ? (
            <p className="cast-lens__foot">
              {question ? question.text : `${focus.name}: nothing to ask.`}
            </p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

function PageMeta({ id, notes, reading }: { id: string; notes: BoardNote[]; reading: WallReading | null }) {
  const scenes = scenesOf(id, notes, reading);
  const eighths = scenes.reduce((sum, scene) => sum + scene.note.lengthEighths, 0);
  const cards = scenes.length;
  const line =
    cards === 0
      ? `on no card of ${notes.length}`
      : `${cards} of ${notes.length} card${notes.length === 1 ? "" : "s"} · about ${formatPages(eighths)} pages`;
  return <p className="cast-page__meta">{line}</p>;
}

function PageScenes({
  id,
  notes,
  reading,
  onJump,
}: {
  id: string;
  notes: BoardNote[];
  reading: WallReading | null;
  onJump: (noteId: string) => void;
}) {
  const scenes = scenesOf(id, notes, reading);
  return (
    <div className="cast-page__scenes">
      <p className="cast-lens__kicker">Their scenes</p>
      {scenes.length === 0 ? (
        <p className="cast-lens__empty">On no card yet. Type their name on a card's "with" line.</p>
      ) : (
        <ol className="cast-page__list">
          {scenes.map((scene, index) => (
            <li key={scene.note.id} className="cast-page__scene">
              <button type="button" className="cast-page__jump" onClick={() => onJump(scene.note.id)}>
                <span className="cast-page__n">{index + 1}</span>
                <span className="cast-page__headline">{scene.note.headline || "Untitled"}</span>
                <span className="cast-page__pg">p. {scene.page}</span>
              </button>
              {scene.gapAfter !== null ? (
                <p className="cast-page__gap">gone for about {formatPages(scene.gapAfter)} pages</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
