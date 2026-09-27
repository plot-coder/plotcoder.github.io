// Type surface for projectFacts.js — what a project holds, for its row in the list.

import type { BoardState } from "./reducer";

export type ProjectFacts = { boards: number; cards: number; eighths: number; changedAt: string | null; changedBy: string | null };
export declare function projectFacts(boards: BoardState[]): ProjectFacts;
export declare function whenWords(at: string, now?: Date): string;
export declare function factsLine(facts: ProjectFacts, options?: { me?: string; savedAt?: string | null; now?: Date }): { holds: string; changed: string; agent: boolean };
