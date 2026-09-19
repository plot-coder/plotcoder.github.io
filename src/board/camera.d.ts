// Type surface for camera.js — the lines the camera cannot see.
export type CameraLine = { at: number; line: string; verbs: string[] };
export declare function cameraLines(text: string): CameraLine[];
export declare function cameraVerbs(found: CameraLine[]): string[];
