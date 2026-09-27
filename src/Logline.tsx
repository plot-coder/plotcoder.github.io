// Step 1 of the method (R18/R19): what is this story arguing?
//
// One line at rest, one panel when the writer wants it (drawn in
// docs/mockups/the-story-panel.html; built on Robert's word, 2026-09-27).
// The title area held the logline, its open, the premise and the film's
// open questions as text typed on the head of the wall: a long logline ran
// under the buttons, a premise and a logline together stood four hundred
// pixels tall over the cards, a tip opened off the top of the window, and
// the ways on appeared and vanished under the pointer. Now the head of the
// wall is one line, never more, and a press opens the story panel: every
// field with its name and a sentence saying what it is, all in view at once.
//
// Two levels, answering open question 18: the board's central question is
// the one every card is checked against; the premise sits above it and is
// shared by every board of the project. Either can be left open (R61): the
// writer's words for why there is none yet. A value decides the field and
// the words go; clearing the words leaves it blank.

import { useEffect, useRef, useState } from "react";
import { EditableText } from "./EditableText";
import { OpenLines } from "./OpenLines";

type LoglineProps = {
  logline: string;
  /** The writer's words for why there is no logline yet (R61), or empty. */
  loglineOpen: string;
  premise: string;
  /** The writer's words for why there is no premise yet (R61), or empty. */
  premiseOpen: string;
  onSetLogline: (text: string) => void;
  onSetLoglineOpen: (words: string) => void;
  onSetPremise: (text: string) => void;
  onSetPremiseOpen: (words: string) => void;
  /** What is not decided about the film itself, in the writer's sentences. */
  openLines: string[];
  onAddOpenLine: (text: string) => void;
  onStrikeOpenLine: (index: number) => void;
  /** Whether the story panel is open; the app holds it, since a narrow window opens it from a button of its own. */
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

/** How many things are held open about the story: the open questions, and a logline or premise left open. */
export function storyOpenCount({ openLines, loglineOpen, premiseOpen }: Pick<LoglineProps, "openLines" | "loglineOpen" | "premiseOpen">): number {
  return openLines.length + (loglineOpen ? 1 : 0) + (premiseOpen ? 1 : 0);
}

type FieldProps = {
  name: string;
  say: string;
  value: string;
  openWords: string;
  placeholder: string;
  onSet: (text: string) => void;
  onSetOpen: (words: string) => void;
};

/** One field of the panel: its name, what it is, the value or the writer's words for why there is none. */
function StoryField({ name, say, value, openWords, placeholder, onSet, onSetOpen }: FieldProps) {
  // The writer has just chosen to leave it open: the caret waits for their words; leaving them blank puts the field back.
  const [leaving, setLeaving] = useState(false);
  const isOpen = Boolean(openWords) || leaving;
  return (
    <section className="story-panel__field">
      <p className="story-panel__k">
        {name}
        {isOpen ? (
          <button
            type="button"
            className="story-panel__link"
            onClick={() => {
              setLeaving(false);
              onSetOpen("");
            }}
          >
            I have one now
          </button>
        ) : value ? null : (
          <button type="button" className="story-panel__link" onClick={() => setLeaving(true)}>
            Not decided? Say why
          </button>
        )}
      </p>
      <p className="story-panel__say">{say}</p>
      {isOpen ? (
        <span className="open-field story-panel__open">
          <span className="open-mark" aria-hidden="true">
            Open
          </span>
          <EditableText
            as="p"
            className="story-panel__input is-open-field"
            value={openWords}
            onCommit={(words) => {
              setLeaving(false);
              onSetOpen(words);
            }}
            ariaLabel={`${name}, left open`}
            placeholder="not decided: say why, in your words"
            autoFocus={leaving}
            stopPointerDown={false}
          />
        </span>
      ) : (
        <EditableText as="p" className="story-panel__input" value={value} onCommit={onSet} ariaLabel={name} placeholder={placeholder} stopPointerDown={false} />
      )}
    </section>
  );
}

export function Logline({
  logline,
  loglineOpen,
  premise,
  premiseOpen,
  onSetLogline,
  onSetLoglineOpen,
  onSetPremise,
  onSetPremiseOpen,
  openLines,
  onAddOpenLine,
  onStrikeOpenLine,
  open,
  onOpen,
  onClose,
}: LoglineProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const count = storyOpenCount({ openLines, loglineOpen, premiseOpen });

  // Escape closes the panel, wherever the caret is. Once, as it opens: see useSheet for why not on every render.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className={`logline ${open ? "is-open" : ""}`} aria-expanded={open} aria-haspopup="dialog" title="The story: its logline, its premise, and what is not decided" onClick={open ? onClose : onOpen}>
        {/* The words are the line's own text, so a reader of the page finds the logline where it has always been. */}
        <span className={`logline__question ${loglineOpen ? "is-open-field" : ""}`} aria-label="Logline" data-placeholder="What is this story arguing?">
          {logline || (loglineOpen ? `No logline yet: ${loglineOpen}` : "")}
        </span>
        {count ? <span className="logline__count">{count} open</span> : null}
      </button>

      {open ? (
        <>
          <button type="button" className="story-panel__away" aria-label="Close the story panel" onClick={onClose} />
          <div className="story-panel" role="dialog" aria-label="The story">
            <button ref={closeRef} type="button" className="story-panel__close" aria-label="Close the story panel" onClick={onClose}>
              ×
            </button>
            <h2 className="story-panel__head">The story</h2>
            <StoryField
              name="Logline"
              say="The story's central question, in a sentence."
              value={logline}
              openWords={loglineOpen}
              placeholder="Can a man who lies for a living tell the truth once, when it costs him the job?"
              onSet={onSetLogline}
              onSetOpen={onSetLoglineOpen}
            />
            <StoryField
              name="Premise"
              say="What is true before the story starts, or a rule the whole of it keeps. For a series, what the series is about."
              value={premise}
              openWords={premiseOpen}
              placeholder="Five days in August. Nobody says “sell” to her face until the end."
              onSet={onSetPremise}
              onSetOpen={onSetPremiseOpen}
            />
            <section className="story-panel__field">
              <p className="story-panel__k">Open questions{openLines.length ? ` · ${openLines.length}` : ""}</p>
              <p className="story-panel__say">What you have not decided that belongs to no one scene. The wall lists them and never asks you about them.</p>
              <OpenLines lines={openLines} onAdd={onAddOpenLine} onStrike={onStrikeOpenLine} onClose={onClose} />
            </section>
          </div>
        </>
      ) : null}
    </>
  );
}
