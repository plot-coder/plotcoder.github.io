// Type surface for places.js — a place's page (R79).

export type PlacePage = { name: string; looks: string; sound: string; notes: string; open: string };
export type PlaceField = "looks" | "sound" | "notes";
export declare const PLACE_FIELDS: PlaceField[];
export declare function placeKey(name: string): string;
export declare function normalizePlaces(value: unknown): PlacePage[];
export declare function placePage(project: { places?: PlacePage[] }, name: string): PlacePage | null;
export declare function updatePlace<P extends { places?: PlacePage[] }>(project: P, name: string, fields: Partial<Record<PlaceField | "open", string>>, now?: string): P;
export declare function renamePlacePage<P extends { places?: PlacePage[] }>(project: P, from: string, to: string, now?: string): P;
export declare function placeLine(page: PlacePage | null): string;
