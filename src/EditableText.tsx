// One caret-safe editable line, shared by the cards and the logline strip.
//
// The words are uncontrolled: React never renders them as children, so it can
// never rewrite text out from under the caret mid-keystroke. The value is
// pushed in only while the field is not focused. Edits commit on a short debounce
// and are flushed on blur, Enter, or Escape — matching R13, tap the words to type.

import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type ElementType,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type EditableTextProps = {
  as?: ElementType;
  value: string;
  onCommit: (text: string) => void;
  ariaLabel: string;
  placeholder: string;
  className?: string;
  /** Cards swallow pointerdown so typing never starts a drag. */
  stopPointerDown?: boolean;
  debounceMs?: number;
};

export function EditableText({
  as: Tag = "p",
  value,
  onCommit,
  ariaLabel,
  placeholder,
  className,
  stopPointerDown = true,
  debounceMs = 250,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const timer = useRef<number | undefined>(undefined);
  // Kept in a ref so the debounced commit always compares against the newest
  // value rather than the one captured when the timer was set.
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (document.activeElement === element) return;
    if (element.textContent === value) return;
    element.textContent = value;
  }, [value]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function commit() {
    const element = ref.current;
    if (!element) return;
    const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text === latest.current) return;
    onCommit(text);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== "Escape") return;
    event.preventDefault();
    event.currentTarget.blur();
  }

  function onPaste(event: ClipboardEvent<HTMLElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain").replace(/\s+/g, " ");
    document.execCommand("insertText", false, text);
  }

  return (
    <Tag
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label={ariaLabel}
      data-placeholder={placeholder}
      onPointerDown={(event: PointerEvent<HTMLElement>) => {
        if (stopPointerDown) event.stopPropagation();
      }}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onInput={() => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(commit, debounceMs);
      }}
      onBlur={() => {
        window.clearTimeout(timer.current);
        commit();
      }}
    />
  );
}
