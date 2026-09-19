// Help in the app (R64): the writer's guide and the words, searched by the
// writer's own words. Pure: the sheet fetches the guide's page and hands its
// HTML here; the maintainer's tools and the tests never touch a browser.

const FILLER = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "on", "at", "is", "it", "i", "do", "how", "can", "my", "me", "we", "you", "your", "for", "with", "be", "what", "when", "where", "does", "did", "this", "that", "from", "as", "by", "are", "am", "if", "so", "up", "one", "two", "not", "no", "yes"]);

/** The words of a question or a paragraph, lower-cased, without the filler. */
export function helpWords(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !FILLER.has(word));
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The guide's page as paragraphs, each under its section (an <h2 id="sN">)
 * and its sub-head (an <h3>), so a hit can say where it comes from and link
 * there. Anything before the first section — the title, the contents — is
 * not indexed.
 */
export function indexGuide(html) {
  const paragraphs = [];
  const sections = html.split(/(?=<h2 id="s\d+">)/g).slice(1);
  for (const chunk of sections) {
    const head = /^<h2 id="(s\d+)">([^<]*)<\/h2>/.exec(chunk);
    if (!head) continue;
    const id = head[1];
    const title = stripTags(head[2]).replace(/^\d+\.\s*/, "");
    let sub = "";
    const parts = chunk.slice(head[0].length).split(/(?=<h3>)|(?=<p>)/g);
    for (const part of parts) {
      const h3 = /^<h3>([^<]*)<\/h3>/.exec(part);
      if (h3) {
        sub = stripTags(h3[1]);
        continue;
      }
      const p = /^<p[^>]*>([\s\S]*?)<\/p>/.exec(part);
      if (p) {
        const text = stripTags(p[1]);
        if (text) paragraphs.push({ id, title, sub, text });
      }
    }
  }
  return paragraphs;
}

/**
 * The hits for a question: the words first, then the guide's paragraphs, each
 * scored by how many of the question's words it holds (a word matches on its
 * start, so "beats" finds "beat"). Nothing matched is an empty list, which is
 * the sheet's cue to offer Ask.
 */
export function searchHelp(query, words, guide, limit = 8) {
  // A plural asks for its singular too: "beats" finds "beat", "writers" finds "writer".
  const stem = (word) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word);
  const wanted = [...new Set(helpWords(query).map(stem))];
  if (wanted.length === 0) return [];
  // A short question is answered whole; a long one may miss a word.
  const needed = wanted.length <= 3 ? wanted.length : wanted.length - 1;
  const holds = (have, want) => have.some((word) => word === want || word.startsWith(want));
  const count = (text) => {
    const have = helpWords(text);
    let hits = 0;
    for (const want of wanted) if (holds(have, want)) hits += 1;
    return hits;
  };
  const scored = [];
  for (const word of words ?? []) {
    const hits = count(`${word.name} ${word.sentence}`);
    if (hits < needed) continue;
    // The entry named for the thing asked about comes first: "A beat" before a sentence that mentions beats.
    const named = count(word.name) > 0 ? 2 : 0;
    scored.push({ kind: "word", from: `The words · ${word.name}`, text: word.sentence, href: null, rank: hits + named, order: scored.length });
  }
  for (const paragraph of guide ?? []) {
    const hits = count(`${paragraph.title} ${paragraph.sub} ${paragraph.text}`);
    if (hits < needed) continue;
    const headed = count(`${paragraph.title} ${paragraph.sub}`) > 0 ? 1 : 0;
    scored.push({
      kind: "guide",
      from: `The guide · ${paragraph.title}${paragraph.sub ? ` · ${paragraph.sub}` : ""}`,
      text: paragraph.text,
      href: `/writers.html#${paragraph.id}`,
      rank: hits + headed,
      order: scored.length,
    });
  }
  scored.sort((a, b) => b.rank - a.rank || (a.kind === "word" ? -1 : b.kind === "word" ? 1 : 0) || a.order - b.order);
  return scored.slice(0, limit).map(({ kind, from, text, href }) => ({ kind, from, text, href }));
}
