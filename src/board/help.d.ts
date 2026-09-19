// Type surface for help.js — Help in the app (R64).

export type GuideParagraph = { id: string; title: string; sub: string; text: string };
export type HelpHit = { kind: "word" | "guide"; from: string; text: string; href: string | null };
export type HelpWord = { name: string; sentence: string };

export declare function helpWords(text: string): string[];
/** The guide's page as paragraphs under their section and sub-head. */
export declare function indexGuide(html: string): GuideParagraph[];
/** The hits for a question: the words first, then the guide, by how many of the question's words each holds. Empty when nothing matches. */
export declare function searchHelp(query: string, words: HelpWord[], guide: GuideParagraph[], limit?: number): HelpHit[];
