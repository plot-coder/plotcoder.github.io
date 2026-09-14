// Type surface for workflows.js — workflows (R27) and the brief (R28).

import type { BoardState } from "./reducer";

export type Workflow = {
  id: string;
  name: string;
  /** What the writer says to their agent, verbatim or nearly. */
  ask: string;
  /** The tools the agent will compose. */
  tools: string[];
  /** The rule the agent keeps while doing it. */
  then: string;
  /** What the writer's material should say for the workflow to need no questions back, and the tool each answer lands in (R49). */
  needs?: { question: string; hint: string; tool: string }[];
};

export declare const WORKFLOWS: readonly Workflow[];
export declare function workflowById(id: string): Workflow | null;

/** The brief for one card, or several in order. Null when none of the ids is a card. */
export declare function segmentBrief(
  state: BoardState,
  ids: string[],
  options?: { title?: string },
): string | null;
