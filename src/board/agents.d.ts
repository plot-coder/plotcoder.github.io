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
