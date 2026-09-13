// Type surface for paginate.js — the paginator (R23, slice c1).

export declare const LINES_PER_PAGE: number;
export declare const WIDTH: Record<string, number>;
export declare const TRANSITION: RegExp;

export type Element =
  | { kind: "action" | "transition" | "centered"; text: string; at: number }
  | { kind: "break"; at: number }
  | { kind: "speech"; name: string; dual: boolean; at: number; parts: Array<{ kind: "dialogue" | "parenthetical"; text: string; at?: number }> };

export type LineKind = "blank" | "action" | "character" | "parenthetical" | "dialogue" | "transition" | "centered" | "break" | "note";
export declare function classifyLines(text: string): LineKind[];

export type Line = {
  kind: "heading" | "action" | "character" | "parenthetical" | "dialogue" | "transition" | "centered" | "more" | "blank" | "dual";
  text?: string;
  sceneNumber?: number | null;
  noteId?: string;
  /** The source line of the scene's text this printed line came from; -1 for the heading. */
  src?: number;
  left?: Line;
  right?: Line;
};

export type Block = {
  kind: string;
  name?: string;
  parts?: Array<{ kind: "dialogue" | "parenthetical"; text: string }>;
  width?: number;
  lines: Line[];
};
export type Page = { number: number; lines: Line[] };

export declare function wrap(text: string, width: number): string[];
export declare function parseScene(text: string): Element[];
export declare function layoutScene(elements: Element[], heading: string | null, sceneNumber: number | null): Block[];
export declare function paginateBlocks(scenes: Array<{ id: string; blocks: Block[] }>): {
  pages: Page[];
  placement: Map<string, { page: number; endPage: number }>;
};
export declare function splitSpeech(block: Block, space: number): { head: Line[]; tail: Line[] } | null;
export declare function sceneLineCount(text: string | undefined): number;

export type SceneInput = { id: string; heading: string; text: string; change: string; written: boolean };
export type Pagination = {
  pages: Page[];
  scenes: Array<{ id: string; number: number; page: number; endPage: number }>;
  pageCount: number;
};
export declare function paginate(scenes: SceneInput[]): Pagination;
