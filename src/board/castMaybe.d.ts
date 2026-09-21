/** "Tomás?" -> { name: "Tomás", maybe: true }; a bare "?" is nobody. */
export declare function readMaybe(text: string): { name: string; maybe: boolean };
/** The cast line as it is read and typed: "Marta, Tomás?". */
export declare function castLine(characterIds: ReadonlyArray<string> | undefined, maybeCharacterIds: ReadonlyArray<string> | undefined, characters: ReadonlyArray<{ id: string; name: string }> | undefined): string;
