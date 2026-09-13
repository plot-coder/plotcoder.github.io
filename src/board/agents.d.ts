// Type surface for agents.js — the agent on-ramp (R43).

export type AgentDoor = { id: string; name: string; text: string; code?: string };
export declare const AGENTS: {
  lead: string;
  doors: AgentDoor[];
  first: Array<{ tool: string; why: string }>;
  rules: string[];
  person: string;
  guide: string;
  url: string;
};
export declare function agentsAsText(): string;
