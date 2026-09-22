import type { Line } from "./paginate";
import type { BoardState } from "./reducer";

/** What a document carries above the script: the board's name, the project's when it has several boards, the premise. */
export type TakeOptions = { title?: string; episode?: string; premise?: string; /** The byline and contact under the title (pass 1a, entry 50). */ author?: string; contact?: string };

/** The wall as Markdown (R54): title, premise, logline, beats as headings, a heading per scene, the text or the change line. */
export declare function toMarkdown(state: BoardState, options?: TakeOptions): string;

/** The script as plain text, set as it prints: Courier's columns kept with spaces, scene numbers in the margins. */
export declare function toPlainText(state: BoardState, options?: TakeOptions): string;

export declare const GUTTER: number;
export declare const COLUMN: Record<"character" | "more" | "parenthetical" | "dialogue", number>;
/** A printed line set with spaces; `star` adds a revision's star in the right margin. */
export declare function setLine(line: Line, star?: boolean): string;
