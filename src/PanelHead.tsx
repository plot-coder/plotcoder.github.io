// The head of a panel beside the wall ("The Pages Head", 2026-09-13).
//
// Two rows, so the panels all read alike. First: the panel's name in the
// serif at reading size, a quiet note beside it (the count, the focused
// scene), and Close at the right where every sheet's Close is. Second, only
// when there is something for it: the views as words with a bar between,
// the current one in ink, and the verbs that act on the view at the right.
// No "View" label: three nouns under a title read as views. No pill: the
// head is typography, and a frame drew the eye to the least important thing.

import type { ReactNode } from "react";

export type PanelView<V extends string> = { id: V; name: string };

type PanelHeadProps<V extends string> = {
  title: string;
  /** The quiet note beside the title; shortens by width in CSS. */
  note?: string;
  /** Something before the title — the lens's "‹ Cast" back link. */
  lead?: ReactNode;
  views?: PanelView<V>[];
  view?: V;
  onView?: (view: V) => void;
  /** Verbs for the second row, right side: Print, Widen. */
  verbs?: ReactNode;
  /** Verbs beside Close on the first row: Clear, Remove. */
  aside?: ReactNode;
  onClose: () => void;
  closeRef?: React.Ref<HTMLButtonElement>;
  titleId?: string;
};

export function PanelHead<V extends string>({ title, note, lead, views, view, onView, verbs, aside, onClose, closeRef, titleId }: PanelHeadProps<V>) {
  const second = (views && views.length > 0) || verbs;
  return (
    <div className="panel-head">
      <div className="panel-head__row">
        <div className="panel-head__name">
          {lead}
          <span id={titleId} className="panel-head__title">
            {title}
          </span>
          {note ? <span className="panel-head__note">{note}</span> : null}
        </div>
        <div className="cast-lens__actions">
          {aside}
          <button ref={closeRef} type="button" className="cast-lens__action" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      {second ? (
        <div className="panel-head__row">
          {views && views.length > 0 ? (
            <div className="panel-head__views" role="group" aria-label="View">
              {views.map((item, index) => (
                <span key={item.id} className="panel-head__view-slot">
                  {index > 0 ? (
                    <span className="panel-head__bar" aria-hidden="true">
                      |
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={`panel-head__view ${item.id === view ? "is-on" : ""}`}
                    aria-pressed={item.id === view}
                    onClick={() => onView?.(item.id)}
                  >
                    {item.name}
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span />
          )}
          {verbs ? <div className="cast-lens__actions">{verbs}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
