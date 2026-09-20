export declare function readPresence(state: Record<string, Array<{ name?: string }>> | null | undefined): { people: string[]; agents: string[] };
export declare function describePresence(state: Record<string, Array<{ name?: string }>> | null | undefined, options: { synced: boolean; project?: string }): string;
