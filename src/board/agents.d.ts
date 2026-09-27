// Type surface for agents.js — the agent on-ramp (R43).

export type AgentDoor = { id: string; name: string; text: string; code?: string };
export declare const AGENTS: {
  lead: string;
  doors: AgentDoor[];
  firstNote: string;
  first: Array<{ tool: string; why: string }>;
  rules: string[];
  person: string;
  guide: string;
  dayOne: string;
  wiring: string;
  url: string;
};
export declare function agentsAsText(): string;
/** The doors, for whoever wires a server in: the file at /wiring.md. */
export declare function wiringAsText(): string;
/** What the MCP server hands a client at initialize: the day's rules, with nothing to fetch. */
export declare function agentsInstructions(): string;

export type AgentsSheetStep = { say: string; copy?: string; from?: string; agent?: boolean };
export type AgentsSheetTab = { id: string; name: string; doors: string[]; steps: AgentsSheetStep[] };
export type AgentsSheetFold = { id: string; title: string; hint: string; whole: "firstNote" | "rules" | "person"; lines?: string[] };
/** The on-ramp as a person meets it: short lines, each held to a door of the agent's own text. */
export declare const AGENTS_SHEET: { lead: string; hand: string; tabs: AgentsSheetTab[]; folds: AgentsSheetFold[] };
