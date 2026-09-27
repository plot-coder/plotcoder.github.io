// Type surface for agentSeen.js — whether an agent is on the wall, and when one last was (R81).

export type AgentSeen = {
  state: "here" | "seen" | "never";
  at: string | null;
  short: string;
  words: string;
  changed: { at: string; line: string } | null;
};
export declare function agoShort(at: string, now?: string): string;
export declare function agoWords(at: string, now?: string): string;
export declare function agentSeen(input?: { present?: string[]; sessionAt?: string | null; record?: { by: string; at: string; lines: string[] }[]; now?: string }): AgentSeen;
export declare function basicHeader(email: string, password: string): string;
export declare function firstMessage(projectName: string, boards?: number): string;
