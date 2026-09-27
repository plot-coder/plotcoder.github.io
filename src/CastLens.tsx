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
import { PanelHead } from "./PanelHead";
import { type WallReading } from "./board/readWall";
import {
  CHARACTER_FIELDS,
  EIGHTHS_PER_PAGE,
  formatPages,
  noteEighths,
  type BoardCharacter,
  type BoardNote,
  type CharacterField,
} from "./board/reducer";
import { EditableText } from "./EditableText";
import type { Asset } from "./board/account";
import type { CastElsewhere } from "./board/project";
import { placeKey, placeSubject, type PlaceField, type PlacePage } from "./board/places";

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
  onUpdate: (id: string, patch: Partial<Record<CharacterField | "open", string>>) => void;
  onRemove: (id: string) => void;
  onJump: (noteId: string) => void;
  /** Pictures on a person's page (Roadmap 2, item 5): null when signed out. */
  pictures: Asset[] | null;
  uploading: number;
  onAddPictures: (characterId: string, files: File[]) => void;
  onRemovePicture: (assetId: string) => void;
  onDownloadPictures: (characterId: string, name: string) => void;
  /** The places on the wall (R37): hover lights their scenes, click holds; with pages and people (item 7). */
  places: Array<{ name: string; cards: number; eighths: number; people: string[] }>;
  placeHover: string | null;
  placeHeld: string | null;
  onPlaceHover: (name: string | null) => void;
  onPlaceHold: (name: string | null) => void;
  /** A place's page (R79): the project's pages, and the writer's lines on one. */
  placePages: PlacePage[];
  onUpdatePlace: (name: string, fields: Partial<Record<PlaceField | "open", string>>) => void;
  /** Rename a place from its page: every card that carries it, on every board, and the page with them. */
  onRenamePlace: (from: string, to: string) => void;
  /** The cast is the project's (R51): its name, how many boards it has, and who is on a card of another board. */
  projectName: string;
  boardCount: number;
  elsewhere: CastElsewhere;
};

// A place's page asks the questions a place answers (R79): no wants, no needs.
const PLACE_LINES: Array<{ field: PlaceField; label: string; ask: string }> = [
  { field: "looks", label: "Looks", ask: "What would the camera see first?" },
  { field: "sound", label: "Sound", ask: "What is heard here when nobody speaks?" },
  { field: "notes", label: "Notes", ask: "What does the treatment say of it?" },
];

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
    cursor += noteEighths(note);
  }
  return scenes;

  function previousEnd(scene: Scene): number | null {
    let at = 0;
    for (const note of order) {
      if (note.id === scene.note.id) return at + noteEighths(note);
      at += noteEighths(note);
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
  pictures,
  uploading,
  onAddPictures,
  onRemovePicture,
  onDownloadPictures,
  places,
  placeHover,
  placeHeld,
  onPlaceHover,
  onPlaceHold,
  placePages,
  onUpdatePlace,
  onRenamePlace,
  projectName,
  boardCount,
  elsewhere,
}: CastLensProps) {
  const titleId = useId();
  const [draft, setDraft] = useState("");
  // Which person's page is open, if any. The page holds them on the wall.
  const [pageId, setPageId] = useState<string | null>(null);
  // The writer has just chosen to leave something open about this person: the caret waits for their words.
  const [leavingOpen, setLeavingOpen] = useState<string | null>(null);
  const page = pageId ? characters.find((character) => character.id === pageId) ?? null : null;
  // Which place's page is open, if any, by its phrase (R79). The page holds the place on the wall.
  const [placeName, setPlaceName] = useState<string | null>(null);
  const placeRow = placeName ? places.find((place) => placeKey(place.name) === placeKey(placeName)) ?? null : null;
  const placeSaved = placeName ? placePages.find((item) => placeKey(item.name) === placeKey(placeName)) ?? null : null;

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
  // A place no card carries any more, or a lens that closed, is no place page.
  useEffect(() => {
    if (!open || (placeName && !placeRow && !placeSaved)) setPlaceName(null);
  }, [open, placeName, placeRow, placeSaved]);

  const focusId = heldId ?? hoverId;
  const focus = characters.find((character) => character.id === focusId) ?? null;
  const question = focus
    ? reading?.findings.find(
        (finding) =>
          (finding.kind === "uncast" || finding.kind === "absent") && finding.ids[0] === focus.id,
      ) ?? null
    : null;

  // The report by place (Roadmap 2, item 7): the held or hovered place in one line.
  const focusPlace = focusId === null ? (placeHeld ?? placeHover) : null;
  const reported = focusPlace ? places.find((place) => place.name === focusPlace) : null;
  const placeReport = reported
    ? `${reported.name}: ${reported.cards} ${reported.cards === 1 ? "scene" : "scenes"}, ${formatPages(reported.eighths)} ${reported.eighths === 8 ? "page" : "pages"}${reported.people.length ? `, with ${reported.people.join(" and ")}` : ""}.`
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

  function openPlace(name: string) {
    setPageId(null);
    setPlaceName(name);
    onPlaceHold(name);
  }

  function closePlace() {
    setPlaceName(null);
    onPlaceHold(null);
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

      {open && placeName ? (
        <section id={titleId} className="cast-lens cast-lens--page" aria-label={`The page of ${placeName}`}>
          <PanelHead
            title=""
            lead={
              <button type="button" className="cast-lens__action cast-lens__back" onClick={closePlace}>
                ‹ Cast
              </button>
            }
            onClose={onClose}
          />
          <div className="cast-page">
            <EditableText
              as="h3"
              className="cast-page__name"
              value={placeRow?.name ?? placeSaved?.name ?? placeName}
              onCommit={(name) => {
                const from = placeRow?.name ?? placeSaved?.name ?? placeName;
                const to = name.trim().replace(/\s+/g, " ");
                if (!to || to === from) return;
                onRenamePlace(from, to);
                setPlaceName(to);
              }}
              ariaLabel={`Name of ${placeName}`}
              placeholder="The place"
            />
            <p className="cast-page__meta">
              {placeRow
                ? `${placeRow.cards} of ${notes.length} card${notes.length === 1 ? "" : "s"} · about ${formatPages(placeRow.eighths)} pages`
                : "on no card of this board"}
            </p>
            {PLACE_LINES.map((line) => (
              <div key={line.field} className="cast-page__line">
                <p className="cast-lens__kicker">{line.label}</p>
                <EditableText
                  className="cast-page__text"
                  value={placeSaved?.[line.field] ?? ""}
                  onCommit={(text) => {
                    if (text.trim() !== (placeSaved?.[line.field] ?? "")) onUpdatePlace(placeRow?.name ?? placeName, { [line.field]: text });
                  }}
                  ariaLabel={`${line.label} of ${placeName}`}
                  placeholder={line.ask}
                />
              </div>
            ))}
            {/* What is not decided about this place, in the writer's words: listed, never asked. */}
            {(placeSaved?.open ?? "").trim() || leavingOpen === placeSubject(placeName) ? (
              <div className="cast-page__line">
                <p className="cast-lens__kicker">Not decided yet</p>
                <span className="open-field">
                  <span className="open-mark" aria-hidden="true">
                    Open
                  </span>
                  <EditableText
                    className="cast-page__text is-open-field"
                    value={placeSaved?.open ?? ""}
                    onCommit={(words) => {
                      setLeavingOpen(null);
                      if (words.trim() !== (placeSaved?.open ?? "")) onUpdatePlace(placeRow?.name ?? placeName, { open: words });
                    }}
                    ariaLabel={`What is not decided about ${placeName}`}
                    placeholder="not decided: say what, in your words"
                    autoFocus={leavingOpen === placeSubject(placeName)}
                  />
                </span>
              </div>
            ) : (
              <button type="button" className="field-offer cast-page__offer" onClick={() => setLeavingOpen(placeSubject(placeName))}>
                Something not decided yet…
              </button>
            )}
            <PagePictures
              name={placeRow?.name ?? placeName}
              pictures={pictures === null ? null : pictures.filter((asset) => asset.subject === placeSubject(placeName) && asset.kind === "picture")}
              uploading={uploading}
              onAdd={(files) => onAddPictures(placeSubject(placeName), files)}
              onRemove={onRemovePicture}
              onDownload={() => onDownloadPictures(placeSubject(placeName), placeRow?.name ?? placeName)}
            />
            <PlaceScenes name={placeName} notes={notes} reading={reading} onJump={onJump} />
            <p className="cast-lens__foot">One page for the project: the phrase on any board's card is this place, spelt any way.</p>
          </div>
        </section>
      ) : open && page ? (
        <section
          id={titleId}
          className="cast-lens cast-lens--page"
          aria-label={`${page.name}'s page`}
        >
          <PanelHead
            title=""
            lead={
              <button type="button" className="cast-lens__action cast-lens__back" onClick={closePage}>
                ‹ Cast
              </button>
            }
            aside={
              elsewhere[page.id]?.length ? (
                <span className="cast-lens__stays" title="The cast is the project's: a person leaves it only when no board has them on a card.">
                  on {elsewhere[page.id].map((item) => item.board).join(", ")}
                </span>
              ) : (
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
              )
            }
            onClose={onClose}
          />

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

            {/* What is not decided about this person, in the writer's words (round twenty-two, entries 12, 24): listed by the reading, never asked. */}
            {(page.open ?? "").trim() || leavingOpen === page.id ? (
              <div className="cast-page__line">
                <p className="cast-lens__kicker">Not decided yet</p>
                <span className="open-field">
                  <span className="open-mark" aria-hidden="true">
                    Open
                  </span>
                  <EditableText
                    className="cast-page__text is-open-field"
                    value={page.open ?? ""}
                    onCommit={(words) => {
                      setLeavingOpen(null);
                      if (words.trim() !== (page.open ?? "")) onUpdate(page.id, { open: words });
                    }}
                    ariaLabel={`What is not decided about ${page.name}`}
                    placeholder="not decided: say what, in your words"
                    autoFocus={leavingOpen === page.id}
                  />
                </span>
              </div>
            ) : (
              <button type="button" className="field-offer cast-page__offer" onClick={() => setLeavingOpen(page.id)}>
                Something not decided yet…
              </button>
            )}

            <PagePictures
              name={page.name}
              pictures={pictures === null ? null : pictures.filter((asset) => asset.subject === page.id && asset.kind === "picture")}
              uploading={uploading}
              onAdd={(files) => onAddPictures(page.id, files)}
              onRemove={onRemovePicture}
              onDownload={() => onDownloadPictures(page.id, page.name)}
            />
            <PageScenes id={page.id} notes={notes} reading={reading} onJump={onJump} />
          </div>
        </section>
      ) : open ? (
        <section
          id={titleId}
          className="cast-lens"
          aria-label="Cast"
          onMouseLeave={() => {
            onHover(null);
            onPlaceHover(null);
          }}
        >
          <PanelHead
            title="Cast"
            note={boardCount > 1 ? `${characters.length} · ${projectName}` : `${characters.length}`}
            aside={
              heldId || placeHeld ? (
                <button
                  type="button"
                  className="cast-lens__action"
                  onClick={() => {
                    onHold(null);
                    onPlaceHold(null);
                  }}
                >
                  Clear
                </button>
              ) : null
            }
            onClose={onClose}
          />

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
                      {count === 0
                        ? elsewhere[character.id]?.length
                          ? elsewhere[character.id].map((item) => `on ${item.board} · ${item.cards}`).join(", ")
                          : "no card"
                        : count === 1
                          ? "1 card"
                          : `${count} cards`}
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

          {places.length > 0 ? (
            <>
              <p className="cast-lens__kicker cast-lens__section">Places · {places.length}</p>
              <ul className="cast-lens__list" aria-label="Places">
                {places.map((place) => {
                  const held = placeHeld === place.name;
                  const lit = (placeHeld ?? placeHover) === place.name && focusId === null;
                  return (
                    <li
                      key={place.name}
                      className={`cast-lens__row cast-lens__row--place ${lit ? "is-focus" : ""} ${held ? "is-held" : ""}`}
                      onMouseEnter={() => onPlaceHover(place.name)}
                      onClick={() => onPlaceHold(held ? null : place.name)}
                    >
                      <span className="cast-lens__name">{place.name}</span>
                      <span className="cast-lens__count">
                        {place.cards === 1 ? "1 card" : `${place.cards} cards`} · {formatPages(place.eighths)} pp
                      </span>
                      <button
                        type="button"
                        className={`cast-lens__open ${placePages.some((item) => placeKey(item.name) === placeKey(place.name)) ? "has-page" : ""}`}
                        aria-label={`Open the page of ${place.name}`}
                        title={`The page of ${place.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openPlace(place.name);
                        }}
                      >
                        ›
                      </button>
                    </li>
                  );
                })}
              </ul>
              {placeReport ? (
                <p className="cast-lens__foot cast-lens__report">
                  {placeReport}
                  <button
                    type="button"
                    className="cast-lens__action cast-lens__copy"
                    onClick={() => void navigator.clipboard?.writeText(placeReport).catch(() => undefined)}
                  >
                    Copy
                  </button>
                </p>
              ) : null}
            </>
          ) : null}

          {focus ? (
            <p className="cast-lens__foot">
              {question ? question.text : `${focus.name}: nothing to ask.`}
            </p>
          ) : boardCount > 1 ? (
            <p className="cast-lens__foot">One cast for the project. A name on any of its boards is in it; their page is the same page everywhere.</p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

function PageMeta({ id, notes, reading }: { id: string; notes: BoardNote[]; reading: WallReading | null }) {
  const scenes = scenesOf(id, notes, reading);
  const eighths = scenes.reduce((sum, scene) => sum + noteEighths(scene.note), 0);
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

// Pictures on the page (Roadmap 2, item 5): what they look like, as files on
// the project — drop them in or pick several, remove one, or take them all
// as one package. Signed out, the line says where pictures would live.
function PagePictures({
  name,
  pictures,
  uploading,
  onAdd,
  onRemove,
  onDownload,
}: {
  name: string;
  pictures: Asset[] | null;
  uploading: number;
  onAdd: (files: File[]) => void;
  onRemove: (assetId: string) => void;
  onDownload: () => void;
}) {
  const inputId = useId();
  const [over, setOver] = useState(false);
  if (pictures === null) {
    return (
      <div className="cast-page__line">
        <p className="cast-lens__kicker">Pictures</p>
        <p className="cast-page__text cast-page__text--muted">Sign in and pictures of {name} live on the project, on every device.</p>
      </div>
    );
  }
  return (
    <div
      className={`cast-page__line cast-page__pictures ${over ? "is-over" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
        if (files.length) onAdd(files);
      }}
    >
      <p className="cast-lens__kicker">
        Pictures{pictures.length ? ` · ${pictures.length}` : ""}
        {uploading ? ` · ${uploading} on the way` : ""}
      </p>
      {pictures.length ? (
        <ul className="cast-page__gallery">
          {pictures.map((asset) => (
            <li key={asset.id} className="cast-page__picture">
              {asset.url ? <img src={asset.url} alt={asset.name} loading="lazy" /> : <span className="cast-page__picture-empty" />}
              <button type="button" className="cast-page__picture-remove" aria-label={`Remove ${asset.name}`} title="Remove" onClick={() => onRemove(asset.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="cast-page__text cast-page__text--muted">Drop pictures here, or add some. They live on the project.</p>
      )}
      <div className="cast-page__picture-actions">
        <label className="cast-lens__action cast-page__add" htmlFor={inputId}>
          Add pictures…
        </label>
        <input
          id={inputId}
          className="project-file"
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length) onAdd(files);
          }}
        />
        {pictures.length ? (
          <button type="button" className="cast-lens__action" onClick={onDownload}>
            Download all
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** The place's scenes on this board, in story order with a page number, click to jump the wall there (R79). */
function PlaceScenes({ name, notes, reading, onJump }: { name: string; notes: BoardNote[]; reading: WallReading | null; onJump: (noteId: string) => void }) {
  const byId = new Map(notes.map((note) => [note.id, note]));
  const order = reading ? (reading.order.map((id) => byId.get(id)).filter(Boolean) as BoardNote[]) : notes;
  let cursor = 0;
  const here: Array<{ note: BoardNote; page: number }> = [];
  for (const note of order) {
    if (placeKey(note.location ?? "") === placeKey(name)) here.push({ note, page: Math.floor(cursor / EIGHTHS_PER_PAGE) + 1 });
    cursor += noteEighths(note);
  }
  return (
    <div className="cast-page__scenes">
      <p className="cast-lens__kicker">Its scenes</p>
      {here.length ? (
        <ol className="cast-page__list">
          {here.map((scene, index) => (
            <li key={scene.note.id} className="cast-page__scene">
              <button type="button" className="cast-page__jump" onClick={() => onJump(scene.note.id)}>
                <span className="cast-page__n">{index + 1}</span>
                <span className="cast-page__headline">{scene.note.headline || "Untitled"}</span>
                <span className="cast-page__pg">p. {scene.page}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="cast-lens__empty">No card on this board is here. Type the place on a card's "at" line.</p>
      )}
    </div>
  );
}
