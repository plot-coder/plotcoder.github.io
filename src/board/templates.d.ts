// Type surface for templates.js — structure templates (R38).

export type TemplateBeat = {
  name: string;
  /** The question the beat exists to answer; goes on the change line. */
  prompt: string;
  /** Where it tends to fall, as a fraction of the story, 0 to 1. */
  at: number;
};

export type StructureTemplate = {
  id: string;
  name: string;
  blurb: string;
  beats: TemplateBeat[];
};

export declare const TEMPLATES: readonly StructureTemplate[];
export declare function templateById(id: string): StructureTemplate | null;
/** The page a beat tends to fall near, on a story of this many eighths. */
export declare function beatPage(at: number, targetEighths: number): number;
