// Type surface for zip.js — a stored zip writer (Roadmap 2, item 5).

export declare function crc32(bytes: Uint8Array): number;
export declare function zip(entries: Array<{ name: string; bytes: Uint8Array | ArrayBuffer; date?: Date | string }>, now?: Date): Uint8Array;
export declare function unzip(bytes: Uint8Array): Array<{ name: string; bytes: Uint8Array }>;
