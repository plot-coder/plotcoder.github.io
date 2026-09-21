/** "Tomás?" -> { name: "Tomás", maybe: true }; a bare "?" is nobody. */
export declare function readMaybe(text: string): { name: string; maybe: boolean };
/** The cast line as it is read and typed: "Marta, Tomás?". */
export declare function castLine(characterIds: ReadonlyArray<string> | undefined, maybeCharacterIds: ReadonlyArray<string> | undefined, characters: ReadonlyArray<{ id: string; name: string }> | undefined): string;
export declare const CAST_OPEN_MARK: string;
/** The cast line as typed: the names, and the writer's open words from the first part that starts with the mark. */
export declare function splitCastLine(text: string): { names: string; open: string };
/** The whole line as it is typed back, open words behind their mark. */
export declare function castLineWithOpen(characterIds: ReadonlyArray<string> | undefined, maybeCharacterIds: ReadonlyArray<string> | undefined, characters: ReadonlyArray<{ id: string; name: string }> | undefined, castOpen: string | undefined): string;
