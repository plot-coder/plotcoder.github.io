// Help in the app (R64): search the writer's guide and the words by the
// writer's own words; when nothing answers, Ask sends the question to the
// people who build the app, and the answer comes back into the guide and
// here under Your questions. The fifth button top right (Robert's A).

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { indexGuide, searchHelp, type GuideParagraph } from "./board/help";
import { WORDS } from "./board/words";

export type HelpQuestion = {
  id: string;
  question: string;
  askedAt: string;
  answeredAt: string | null;
  answer: string | null;
  section: string | null;
};

type HelpSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Signed in: a question has an address to answer to. */
  signedIn: boolean;
  /** The writer's own questions, or null until they are read. */
  questions: HelpQuestion[] | null;
  onLoad: () => void;
  onAsk: (question: string) => Promise<void>;
};

const GUIDE_URL = "/writers.html";

function whenSaid(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function HelpSheet({ open, onClose, signedIn, questions, onLoad, onAsk }: HelpSheetProps) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [guide, setGuide] = useState<GuideParagraph[] | null>(null);
  const [asking, setAsking] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // The guide's page, fetched once the sheet first opens; without it the words still answer.
  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    onLoad();
    if (guide !== null) return;
    let live = true;
    fetch(GUIDE_URL)
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error(String(response.status)))))
      .then((html) => {
        if (live) setGuide(indexGuide(html));
      })
      .catch(() => {
        if (live) setGuide([]);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hits = useMemo(() => searchHelp(query, WORDS, guide ?? []), [query, guide]);
  const asked = query.trim();

  async function ask() {
    if (!asked || asking) return;
    setAsking(true);
    setFailed(null);
    try {
      await onAsk(asked);
      setSent(asked);
      setQuery("");
    } catch (error) {
      setFailed(error instanceof Error ? error.message : "It did not send.");
    } finally {
      setAsking(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-root">
      <button type="button" className="modal-backdrop" aria-label="Close the sheet" onClick={onClose} />
      <div className="modal modal--narrow account words help" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <p className="modal__kicker">PlotCoder</p>
            <h2 id={titleId} className="modal__title">
              Help
            </h2>
          </div>
          <button type="button" className="modal__close" onClick={onClose}>
            Close
          </button>
        </div>

        <input
          ref={searchRef}
          className="help__search"
          value={query}
          placeholder="What do you want to know?"
          aria-label="What do you want to know?"
          spellCheck={false}
          onChange={(event) => {
            setQuery(event.target.value);
            setSent(null);
          }}
        />

        {asked && hits.length > 0 ? (
          <div className="help__hits" aria-live="polite">
            {hits.map((hit, index) => (
              <div key={`${hit.from}-${index}`} className="help__hit">
                <p className="help__from">{hit.from}</p>
                <p className="help__text">{hit.text}</p>
                {hit.href ? (
                  <a className="help__go" href={hit.href} target="_blank" rel="noreferrer">
                    Read it there →
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {asked && hits.length === 0 ? (
          <div className="help__askwrap">
            <p className="help__none">Nothing in the guide or the words answers that.</p>
            {signedIn ? (
              <>
                <p className="help__fine">
                  Ask, and this question goes, with your email, to the people who build PlotCoder. The answer lands in the
                  guide, without your name, and here under Your questions. It takes days, not minutes.
                </p>
                {failed ? <p className="help__fine help__fine--warm">{failed}</p> : null}
                <button type="button" className="help__button" disabled={asking} onClick={() => void ask()}>
                  {asking ? "Sending…" : "Ask this question"}
                </button>
              </>
            ) : (
              <p className="help__fine">Sign in to ask: a question needs an address to answer to. The guide is at plotcoder.com/writers.html.</p>
            )}
          </div>
        ) : null}

        {sent ? <p className="help__fine">Sent: "{sent}". It is under Your questions until it is answered.</p> : null}

        {!asked && signedIn ? (
          <section className="account__group" aria-label="Your questions">
            <p className="cast-lens__kicker">Your questions</p>
            {questions === null ? (
              <p className="help__fine">Looking…</p>
            ) : questions.length === 0 ? (
              <p className="help__fine">None yet. Type a question above; if nothing answers it, Ask.</p>
            ) : (
              questions.map((item) => (
                <p key={item.id} className="help__q">
                  {item.answeredAt ? (
                    <span className="help__state">Answered {whenSaid(item.answeredAt)}</span>
                  ) : (
                    <span className="help__state is-warm">Waiting</span>
                  )}
                  <br />
                  {item.question} <span className="help__state">· asked {whenSaid(item.askedAt)}</span>
                  {item.answer ? <span className="help__answer">{item.answer}</span> : null}
                  {item.section ? (
                    <a className="help__go" href={`${GUIDE_URL}${item.section}`} target="_blank" rel="noreferrer">
                      In the guide →
                    </a>
                  ) : null}
                </p>
              ))
            )}
          </section>
        ) : null}

        {!asked ? (
          <p className="help__fine">
            Type a question: the words and the guide answer as you go. The whole guide is at{" "}
            <a className="help__link" href={GUIDE_URL} target="_blank" rel="noreferrer">
              plotcoder.com/writers.html
            </a>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}
