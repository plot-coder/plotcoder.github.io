export declare const SESSION_TABLE: string;
export declare const SESSION_LIFE_MS: number;
/** What a door remembers of one agent's session. */
export interface SessionMemory {
  readOnce: boolean;
  said: string[];
  lastReading: { findings: Array<{ kind: string; text: string; ids: string[] }> } | null;
  sinceRead: string[];
}
export interface SessionStore {
  /** null when the store cannot be read at all; an id with no row is a fresh session. */
  load(id: string): Promise<{ memory: SessionMemory; fresh: boolean } | null>;
  save(id: string, memory: SessionMemory, fresh: boolean): Promise<boolean>;
  /** The session's undo trail through the hosted door; a store without these keeps none, and undo says so. */
  pushUndo?(id: string, step: UndoStep): Promise<boolean>;
  peekUndo?(id: string): Promise<(UndoStep & { seq: number; steps: number }) | null>;
  popUndo?(id: string, seq: number): Promise<boolean>;
}
/** One step of a session's trail: the wall as it was, what changed it, and a hash of the wall as the change left it. */
export interface UndoStep {
  what: string;
  before: unknown;
  afterHash: string;
  projectId?: string;
  boardId?: string;
}
export declare const UNDO_TABLE: string;
export declare const UNDO_KEPT: number;
export declare function isSessionId(text: unknown): boolean;
export declare function emptyMemory(): SessionMemory;
export declare function normalizeMemory(raw: unknown): SessionMemory;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export declare function accountSessionStore(client: any, userId: string, now?: () => number): SessionStore;
