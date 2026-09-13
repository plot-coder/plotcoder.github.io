// The page as the editor (R23 c, item 2 of Roadmap 2).
//
// A scene's text, editable in place and set as a script: each of the
// writer's lines is one line on the page, styled by what it is — action,
// cue, parenthetical, dialogue, transition — from the same rules the
// paginator reads by. The lines are the writer's own; nothing is wrapped for
// them here except by the page's width, and nothing computed is inside the
// editable text: the page turns, (MORE) and (CONT'D) are drawn beside the
// lines the paginator says they fall on, and cannot be selected or deleted.
//
// Uncontrolled, like EditableText: React never rewrites the lines while the
// caret is in them. The store's copy wins only when the caret is elsewhere.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { classifyLines } from "./board/paginate";
import type { BoardNote } from "./board/reducer";
import type { PageTurn } from "./pagesLayout";

type SceneEditorProps = {
  note: BoardNote;
  /** Page turns that fall inside this scene, from the paginator. */
  turns: PageTurn[];
  onCommit: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

function linesOf(text: string): string[] {
  return (text ?? "").replace(/\r\n?/g, "\n").split("\n");
}

/** The editable's text back as lines, one per child block. */
function readLines(root: HTMLElement): string[] {
  const out: string[] = [];
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      out.push(child.textContent ?? "");
    } else if (child instanceof HTMLElement) {
      // A browser may nest a <br> or a <div> inside; innerText keeps the writer's line as one.
      out.push(child.innerText.replace(/\n$/, ""));
    }
  }
  return out;
}

function paint(root: HTMLElement, lines: string[]): void {
  const kinds = classifyLines(lines.join("\n"));
  const children = Array.from(root.children) as HTMLElement[];
  children.forEach((child, index) => {
    const kind = kinds[index] ?? "action";
    const next = `sl sl--${kind}`;
    if (child.className !== next) child.className = next;
  });
}

function build(root: HTMLElement, text: string): void {
  root.innerHTML = "";
  const lines = linesOf(text);
  for (const line of lines.length ? lines : [""]) {
    const div = document.createElement("div");
    div.textContent = line;
    root.appendChild(div);
  }
  paint(root, lines.length ? lines : [""]);
}

export function SceneEditor({ note, turns, onCommit, onFocus, onBlur }: SceneEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const editing = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(note.text);
  const [marks, setMarks] = useState<Array<{ top: number; turn: PageTurn }>>([]);

  // The store's copy lands only while the caret is elsewhere.
  useEffect(() => {
    if (editing.current || !ref.current) return;
    latest.current = note.text;
    build(ref.current, note.text);
  }, [note.text]);

  // Where the page turns: beside the line it turns at.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const children = Array.from(root.children) as HTMLElement[];
    setMarks(
      turns.map((turn) => {
        const child = turn.src >= 0 ? children[Math.min(turn.src, children.length - 1)] : null;
        return { top: child ? child.offsetTop : 0, turn };
      }),
    );
  }, [turns, note.text]);

  function commit(): void {
    const root = ref.current;
    if (!root) return;
    const text = readLines(root).join("\n").replace(/\s+$/, "");
    if (text === latest.current) return;
    latest.current = text;
    onCommit(text);
  }

  return (
    <div className="scene-editor">
      <div
        ref={ref}
        className="scene-editor__lines"
        contentEditable
        suppressContentEditableWarning
        spellCheck={true}
        role="textbox"
        aria-multiline="true"
        aria-label={`Scene text of ${note.headline}`}
        data-placeholder={note.change || "What happens, in the script's words?"}
        onFocus={() => {
          editing.current = true;
          onFocus();
        }}
        onBlur={() => {
          window.clearTimeout(timer.current);
          commit();
          editing.current = false;
          onBlur();
        }}
        onInput={() => {
          const root = ref.current;
          if (root) paint(root, readLines(root));
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(commit, 400);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") (event.currentTarget as HTMLElement).blur();
        }}
        onPaste={(event) => {
          // Plain text, as lines: the page is Courier and the writer's own words.
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
      />
      {marks.map(({ top, turn }) => (
        <div key={turn.page} className="scene-editor__turn" style={{ top }} contentEditable={false} aria-hidden="true">
          {turn.cue ? <span className="scene-editor__more">(MORE)</span> : null}
          <span className="scene-editor__rule">
            <span className="scene-editor__page">{turn.page}.</span>
          </span>
          {turn.cue ? <span className="scene-editor__contd">{turn.cue}</span> : null}
        </div>
      ))}
    </div>
  );
}
