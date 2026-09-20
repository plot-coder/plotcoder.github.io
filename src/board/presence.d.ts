export declare function readPresence(state: Record<string, Array<{ name?: string }>> | null | undefined): { people: string[]; agents: string[] };
/** What a write's tail says about presence — only when it has changed since `lastKey` — and the key to remember. */
export declare function presenceTail(people: string[], lastKey: string | null, hosted: boolean): { key: string; text: string };
export declare function describePresence(state: Record<string, Array<{ name?: string }>> | null | undefined, options: { synced: boolean; project?: string }): string;
