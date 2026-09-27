// Type surface for placeFiles.js — a place's files follow its rename (R79).

type AssetsClient = { from: (table: string) => any };
export declare function movePlaceFiles(client: AssetsClient | null | undefined, projectId: string | null | undefined, from: string, to: string): Promise<{ moved: number; error: string | null }>;
