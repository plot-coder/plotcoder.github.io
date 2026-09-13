// Type surface for words.js — what these words mean (R42).

export type WordTarget = "card" | "logline" | "beat" | "change" | "corner" | "arrow" | "length" | "cast" | "place" | "group" | "strip";
export type Word = { id: string; name: string; sentence: string; target?: WordTarget };
export type WordGroup = { id: string; name: string; words: Word[] };

export declare const WORD_GROUPS: WordGroup[];
export declare const WORDS: Word[];
export declare function wordSentence(id: string): string;
export declare function wordsAsText(): string;
