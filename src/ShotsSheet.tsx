// The walkthrough (R80): the look, the people, the places, then the shots.
//
// A still holds a face from shot to shot only when a picture of the person
// goes with the prompt, so the references come before the stills. Every row
// is the same three moves — copy the prompt, name the file, bring it back —
// and a shot says first what to attach. PlotCoder calls no image tool: the
// writer makes each picture in their own and brings it here. A reference is
// done by a picture or by the writer's tick that they keep it outside the
// app; a shot's still is a picture here, since it is the first frame a video
// tool is handed. Drawn in docs/mockups/r80-the-walkthrough.html.

import { useEffect, useId, useMemo, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { accountStore, type Asset } from "./board/account";
import { EditableText } from "./EditableText";
import { type PlacePage } from "./board/places";
import { type BoardNote, type BoardState } from "./board/reducer";
import { shotSubject } from "./board/shots";
import { matchFile, walkthrough, type WalkReference, type WalkShot } from "./board/walkthrough";
import { workflowById } from "./board/workflows";

type Step = "look" | "people" | "places" | "shots";

type ShotsSheetProps = {
  open: boolean;
  board: BoardState;
  /** The story order, so a shot's file is named by its scene's number. */
  order: BoardNote[];
  projectName: string;
  look: string;
  places: PlacePage[];
  outside: string[];
  /** The project's files, or null when signed out. */
  assets: Asset[] | null;
  uploading: number;
  onClose: () => void;
  onLook: (look: string) => void;
  onTick: (key: string, on: boolean) => void;
  /** What a person or a place looks like, typed here and kept on their page. */
  onLooks: (reference: WalkReference, looks: string) => void;
};

/** A file under the name the row gives it, so what is kept is named as the writer was told to name it. */
function named(file: File, name: string): File {
  const ending = /\.[A-Za-z0-9]+$/.exec(file.name)?.[0]?.toLowerCase() ?? (file.type === "image/jpeg" ? ".jpg" : file.type === "image/webp" ? ".webp" : ".png");
  return new File([file], name.replace(/\.png$/, ending), { type: file.type || "image/png" });
}

/** The name of a row's next file: its own, or with the try's number once it has one. */
function nextName(name: string, held: number): string {
  return held > 0 ? name.replace(/\.png$/, `-${held + 1}.png`) : name;
}

async function download(asset: { url?: string | null }, name: string) {
  if (!asset.url) return;
  const bytes = await (await fetch(asset.url)).blob();
  const url = URL.createObjectURL(bytes);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function ShotsSheet({ open, board, order, projectName, look, places, outside, assets, uploading, onClose, onLook, onTick, onLooks }: ShotsSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>("people");
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [strip, setStrip] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  /** The row a pasted picture goes to: the one last touched. */
  const [target, setTarget] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  /** What a person or a place looks like, as it is typed: kept on the page when the writer says Keep, so the row does not change under the caret. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const walk = useMemo(() => walkthrough(board, { look, places, outside, files: assets, order }), [board, look, places, outside, assets, order]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    setSaid(null);
    setCopied(null);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Open where the work is: the first step with something left.
  useEffect(() => {
    if (!open) return;
    const { counts } = walk;
    setStep(!walk.look.done && counts.people.done === 0 ? "look" : counts.people.done < counts.people.of ? "people" : counts.places.done < counts.places.of ? "places" : "shots");
    setSceneId(walk.next?.scene ?? walk.scenes[0]?.id ?? null);
    setStrip(false);
    // Only as the sheet opens: moving the writer between steps as they work would take the row from under their hand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const scene = walk.scenes.find((item) => item.id === sceneId) ?? walk.scenes[0] ?? null;
  const shotsWaiting = walk.counts.shots.of > 0 && walk.counts.shots.waiting === walk.counts.shots.of;

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      /* the words are on screen to select */
    }
  }

  async function keep(files: File[], subject: string, name: string, held: number) {
    if (!files.length) return;
    if (!walk.signedIn) {
      setSaid("Sign in, and pictures live on the project. Until then a reference can be ticked as kept outside the app.");
      return;
    }
    setSaid(null);
    await accountStore.addFiles(files.map((file, index) => named(file, nextName(name, held + index))), "picture", subject);
  }

  /** Where a row's pictures are filed, what they are called, and how many it holds. */
  function rowOf(key: string): { subject: string; name: string; held: number } | null {
    const reference = [...walk.people, ...walk.places].find((item) => item.key === key);
    if (reference) return { subject: reference.key, name: reference.fileName, held: (assets ?? []).filter((file) => file.kind === "picture" && file.subject === reference.key).length };
    for (const item of walk.scenes) {
      const shot = item.shots.find((one) => shotSubject(one.id) === key);
      if (shot) return { subject: key, name: shot.fileName, held: shot.stills };
    }
    return null;
  }

  /** Files that arrive on the sheet and not on a row: each to the row its name says, or to the row last touched. */
  async function arrive(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name));
    if (!images.length) return;
    const lost: string[] = [];
    for (const file of images) {
      const found = matchFile(file.name, walk);
      const row = rowOf(found?.key ?? target ?? "");
      if (!row) {
        lost.push(file.name);
        continue;
      }
      await keep([file], row.subject, row.name, row.held);
    }
    if (lost.length) setSaid(`${lost.length === 1 ? `"${lost[0]}" is` : `${lost.length} files are`} named for no row here. Drop ${lost.length === 1 ? "it" : "each"} on the row it is for, or click the row and paste.`);
  }

  function onPaste(event: ClipboardEvent<HTMLDivElement>) {
    const files = Array.from(event.clipboardData?.files ?? []);
    if (!files.some((file) => file.type.startsWith("image/"))) return;
    event.preventDefault();
    const row = rowOf(target ?? "");
    if (!row) {
      setSaid("Click the row the picture is for, then paste.");
      return;
    }
    void keep(files.filter((file) => file.type.startsWith("image/")), row.subject, row.name, row.held);
  }

  function onDropSheet(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void arrive(Array.from(event.dataTransfer.files ?? []));
  }

  // Rows are drawn by functions, not components: a component made inside a render is a new one each time, and a field in it loses the caret.
  /** The slot a picture sits in: the picture, or the place to drop, choose or paste one. */
  function slot({ rowKey, picture, wide, name, held }: { rowKey: string; picture: { url?: string | null; name: string } | null; wide?: boolean; name: string; held: number }) {
    return (
      <button
        type="button"
        className={`shots__slot ${wide ? "shots__slot--wide" : ""} ${picture ? "has-picture" : ""} ${target === rowKey ? "is-target" : ""}`}
        aria-label={picture ? `${picture.name}: click, then paste another` : "Click, then paste the picture; or drop it here"}
        aria-pressed={target === rowKey}
        onClick={() => setTarget(rowKey)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setTarget(rowKey);
          void keep(Array.from(event.dataTransfer.files ?? []).filter((file) => file.type.startsWith("image/")), rowKey, name, held);
        }}
      >
        {picture?.url ? <img src={picture.url} alt="" /> : <span>{picture ? picture.name : target === rowKey ? "paste now, or drop it here" : walk.signedIn ? "drop it here, or click and paste" : "sign in to keep it here"}</span>}
        {picture ? <span className="shots__tick">✓</span> : null}
      </button>
    );
  }

  /** Choose a file for a row: the third way in, beside the drop and the paste. */
  function choose(rowKey: string, name: string, held: number, label: string) {
    const inputId = `${titleId}-${rowKey}`;
    return (
      <>
        <label className="shots__btn" htmlFor={inputId}>
          {label}
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
            setTarget(rowKey);
            void keep(files, rowKey, name, held);
          }}
        />
      </>
    );
  }

  function copyLine({ id, label, text, short }: { id: string; label: string; text: string; short?: boolean }) {
    return (
      <>
        <p className="shots__k">{label}</p>
        <div className="shots__copy">
          <span className={`shots__text ${short ? "shots__text--short" : ""}`}>{text}</span>
          <button type="button" className="shots__btn shots__btn--main" onClick={() => void copy(id, text)}>
            {copied === id ? "Copied" : "Copy"}
          </button>
        </div>
      </>
    );
  }

  function reference(item: WalkReference) {
    const held = (assets ?? []).filter((file) => file.kind === "picture" && file.subject === item.key).length;
    return (
      <li key={item.key} className="shots__item">
        {slot({ rowKey: item.key, picture: item.picture, name: item.fileName, held })}
        <div>
          <p className="shots__name">
            {item.name}
            <small>
              in {item.shots} of this board's shots
            </small>
          </p>
          {item.done ? (
            <p className="shots__line">
              <span className="shots__lab">{item.picture ? "Saved as" : "Kept outside the app, as"}</span>
              <span className="shots__ref">{item.fileName}</span>
              {item.picture ? (
                <>
                  <button type="button" className="shots__btn" onClick={() => void download(item.picture ?? {}, item.fileName)}>
                    Download
                  </button>
                  {choose(item.key, item.fileName, held, "Another")}
                </>
              ) : (
                <button type="button" className="shots__btn" onClick={() => onTick(item.key, false)}>
                  Take the tick off
                </button>
              )}
            </p>
          ) : item.prompt ? (
            <>
              {copyLine({ id: `prompt:${item.key}`, label: "1 · Paste this", text: item.prompt })}
              {copyLine({ id: `name:${item.key}`, label: "2 · Name the file", text: item.fileName, short: true })}
              <p className="shots__k">3 · Bring it back</p>
              <p className="shots__line">
                {walk.signedIn ? choose(item.key, item.fileName, held, "Choose a file") : null}
                <span className="shots__lab">{walk.signedIn ? "or drop it on the box, or click the box and paste" : "Signed out, a picture cannot be kept here."}</span>
                <label className="shots__check">
                  <input type="checkbox" checked={false} onChange={() => onTick(item.key, true)} />I have it, outside the app
                </label>
              </p>
            </>
          ) : (
            <>
              <p className="shots__k">Say what {item.kind === "place" ? "it" : item.name.split(/\s+/)[0]} looks like first</p>
              <form
                className="shots__copy"
                onSubmit={(event) => {
                  event.preventDefault();
                  const words = (drafts[item.key] ?? "").trim();
                  if (words) onLooks(item, words);
                }}
              >
                <input
                  className="shots__looks"
                  value={drafts[item.key] ?? ""}
                  onChange={(event) => setDrafts((now) => ({ ...now, [item.key]: event.target.value }))}
                  aria-label={`What ${item.name} looks like`}
                  placeholder={item.kind === "place" ? "What would the camera see there?" : "What would a stranger notice?"}
                />
                <button type="submit" className="shots__btn shots__btn--main">
                  Keep
                </button>
              </form>
              <p className="shots__lab">Your words go on {item.kind === "place" ? "the place's" : "their"} page. No prompt is made without them: the app invents no face and no room.</p>
              <p className="shots__line">
                <label className="shots__check">
                  <input type="checkbox" checked={false} onChange={() => onTick(item.key, true)} />I have the picture already, outside the app
                </label>
              </p>
            </>
          )}
        </div>
      </li>
    );
  }

  function shotRow(shot: WalkShot) {
    const key = shotSubject(shot.id);
    const meta = [shot.move, typeof shot.seconds === "number" ? `${shot.seconds}s` : ""].filter(Boolean).join(" · ");
    if (shot.waiting.length && !shot.still) {
      return (
        <li key={shot.id} className="shots__item is-waiting">
          <span className="shots__slot shots__slot--wide">
            <span>—</span>
          </span>
          <div>
            <p className="shots__name">
              {shot.number} · {shot.what}
              {meta ? <small>{meta}</small> : null}
            </p>
            <p className="shots__line">
              <span>
                Waiting on <b>{shot.waiting.map((item) => item.name).join(", ")}</b>: make {shot.waiting.length === 1 ? "that reference" : "those references"} first.
              </span>
              <button type="button" className="shots__btn" onClick={() => setStep(shot.waiting[0].kind === "place" ? "places" : "people")}>
                Go to {shot.waiting[0].name.split(/\s+/)[0] === "INT." || shot.waiting[0].kind === "place" ? "the place" : shot.waiting[0].name.split(/\s+/)[0]}
              </button>
            </p>
          </div>
        </li>
      );
    }
    const pictures = shot.attach.filter((item) => item.picture);
    return (
      <li key={shot.id} className="shots__item">
        {slot({ rowKey: key, picture: shot.still, wide: true, name: shot.fileName, held: shot.stills })}
        <div>
          <p className="shots__name">
            {shot.number} · {shot.what}
            {meta ? <small>{meta}</small> : null}
          </p>
          {shot.still ? (
            <p className="shots__line">
              <span className="shots__lab">Saved as</span>
              <span className="shots__ref">{shot.still.name}</span>
              {shot.stills > 1 ? <span className="shots__lab">the newest of {shot.stills}</span> : null}
              {choose(key, shot.fileName, shot.stills, "Another try")}
            </p>
          ) : (
            <>
              {shot.attach.length ? (
                <>
                  <p className="shots__k">1 · Attach these</p>
                  <p className="shots__line">
                    {shot.attach.map((item) => (
                      <span key={item.key} className="shots__ref">
                        {item.picture?.url ? <img src={item.picture.url} alt="" /> : null}
                        {item.fileName}
                      </span>
                    ))}
                    {pictures.length ? (
                      <button
                        type="button"
                        className="shots__btn"
                        onClick={() => {
                          for (const item of pictures) void download(item.picture ?? {}, item.fileName);
                        }}
                      >
                        Download {pictures.length === 1 ? "it" : pictures.length === shot.attach.length ? `all ${pictures.length}` : `the ${pictures.length} kept here`}
                      </button>
                    ) : null}
                  </p>
                </>
              ) : null}
              {copyLine({ id: `prompt:${key}`, label: `${shot.attach.length ? 2 : 1} · Paste this`, text: shot.prompt })}
              {copyLine({ id: `name:${key}`, label: `${shot.attach.length ? 3 : 2} · Name the file`, text: shot.fileName, short: true })}
              <p className="shots__k">{shot.attach.length ? 4 : 3} · Bring it back</p>
              <p className="shots__line">
                {walk.signedIn ? choose(key, shot.fileName, shot.stills, "Choose a file") : null}
                <span className="shots__lab">{walk.signedIn ? "or drop it on the box, or click the box and paste" : "Sign in to keep a shot's still: it is the first frame a video tool is handed."}</span>
              </p>
            </>
          )}
        </div>
      </li>
    );
  }

  const ask = workflowById("break-into-shots")?.ask ?? "";

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close shots" onClick={onClose} />
      <div className="modal modal--shots" role="dialog" aria-modal="true" aria-labelledby={titleId} onPaste={onPaste} onDragOver={(event) => event.preventDefault()} onDrop={onDropSheet}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">The look, the people, the places, then the shots</p>
            <h2 id={titleId} className="modal__title">
              Shots · {projectName}
            </h2>
          </div>
          <button ref={closeRef} type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="shots__steps" role="tablist" aria-label="The steps">
          <button type="button" role="tab" aria-selected={step === "look"} className={`shots__step ${step === "look" ? "is-on" : ""} ${walk.look.done ? "is-done" : ""}`} onClick={() => setStep("look")}>
            <span>1</span>The look
          </button>
          <button type="button" role="tab" aria-selected={step === "people"} className={`shots__step ${step === "people" ? "is-on" : ""} ${walk.counts.people.of && walk.counts.people.done === walk.counts.people.of ? "is-done" : ""}`} onClick={() => setStep("people")}>
            <span>2</span>The people · {walk.counts.people.done} of {walk.counts.people.of}
          </button>
          <button type="button" role="tab" aria-selected={step === "places"} className={`shots__step ${step === "places" ? "is-on" : ""} ${walk.counts.places.of && walk.counts.places.done === walk.counts.places.of ? "is-done" : ""}`} onClick={() => setStep("places")}>
            <span>3</span>The places · {walk.counts.places.done} of {walk.counts.places.of}
          </button>
          <button type="button" role="tab" aria-selected={step === "shots"} disabled={shotsWaiting} className={`shots__step ${step === "shots" ? "is-on" : ""} ${shotsWaiting ? "is-waiting" : ""} ${walk.counts.shots.of && walk.counts.shots.done === walk.counts.shots.of ? "is-done" : ""}`} onClick={() => setStep("shots")}>
            <span>4</span>The shots · {shotsWaiting ? "waiting" : `${walk.counts.shots.done} of ${walk.counts.shots.of}`}
          </button>
        </div>

        {said ? <p className="project-error shots__said">{said}</p> : null}
        {uploading ? <p className="shots__lab">{uploading} on the way…</p> : null}

        {walk.scenes.length === 0 ? (
          <div className="shots__empty">
            <p className="project-copy">
              No scene on this board has shots yet. Shots come after the script: write a scene, then ask your agent to break it into shots. Each shot becomes a line in the scene's text, and this sheet walks you
              through the pictures.
            </p>
            {copyLine({ id: "ask", label: "Say this to your agent", text: ask })}
          </div>
        ) : step === "look" ? (
          <div>
            <p className="project-copy">The look every picture of this project shares: your style words, and your image tool's own codes if you use them. It ends every prompt, so one film looks like one film.</p>
            <EditableText className="shots__looks" value={look} onCommit={(text) => onLook(text)} ariaLabel="The look of the project" placeholder="35mm, overcast, desaturated greens" stopPointerDown={false} />
            <p className="shots__lab">Leave it empty and each prompt goes out without one.</p>
          </div>
        ) : step === "people" || step === "places" ? (
          <>
            <div className="shots__how">
              <p className="shots__k">How, each time</p>
              <ol>
                <li>Copy the prompt. Paste it into your image tool.</li>
                <li>Download the picture you keep, and name it as shown.</li>
                <li>Drop it here, or paste it, or tick that you have it.</li>
              </ol>
            </div>
            <ul className="shots__list">
              {(step === "people" ? walk.people : walk.places).map((item) => reference(item))}
            </ul>
            {(step === "people" ? walk.people : walk.places).length === 0 ? <p className="project-copy">{step === "people" ? "No shot names anyone yet. A person joins this list when a shot's line names them." : "No scene with shots has a place yet."}</p> : null}
          </>
        ) : scene ? (
          <>
            <p className="shots__count">
              {walk.scenes.length > 1 ? (
                <select className="shots__pick" value={scene.id} onChange={(event) => setSceneId(event.target.value)} aria-label="The scene">
                  {walk.scenes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.number}. {item.headline} — {item.made} of {item.shots.length}
                    </option>
                  ))}
                </select>
              ) : (
                <b>{scene.headline}</b>
              )}
              <span>
                scene {scene.number} of {scene.of} · {scene.shots.length} shot{scene.shots.length === 1 ? "" : "s"}, {scene.made} with a still
              </span>
              {walk.next ? (
                <button
                  type="button"
                  className="shots__btn"
                  onClick={() => {
                    setSceneId(walk.next?.scene ?? null);
                    setStrip(false);
                    setTarget(shotSubject(walk.next?.shot ?? ""));
                  }}
                >
                  Next without a still ›
                </button>
              ) : null}
              <button type="button" className="shots__btn" aria-pressed={strip} onClick={() => setStrip((now) => !now)}>
                {strip ? "The list" : "The strip"}
              </button>
            </p>
            {strip ? (
              <div className="shots__strip" aria-label={`The frames of ${scene.headline}, in order`}>
                {scene.shots.map((shot) => (
                  <figure key={shot.id} className={shot.still ? "" : "is-empty"}>
                    {shot.still?.url ? <img src={shot.still.url} alt={shot.what} /> : null}
                    <figcaption>{shot.number}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <ul className="shots__list">
                {scene.shots.map((shot) => shotRow(shot))}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
