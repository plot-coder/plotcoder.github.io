import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedState } from "../src/board/reducer.js";

/** @typedef {import("../src/board/reducer.js").BoardState} BoardState */

const SERVER = fileURLToPath(new URL("../scripts/plotcoder-mcp.mjs", import.meta.url));

export const E2E_ROOT = process.env.PLOTCODER_E2E_ROOT ?? path.resolve(".plotcoder-e2e");
export const E2E_URL = process.env.PLOTCODER_E2E_URL ?? "http://127.0.0.1:5174";

/**
 * Put the dev bridge back to a known board before a spec runs.
 * @param {import("@playwright/test").APIRequestContext} request
 * @param {BoardState} [state]
 */
export async function resetBoard(request, state = seedState()) {
  const response = await request.put("/__plotcoder/board", { data: { state, rev: 0 } });
  if (!response.ok()) throw new Error(`bridge reset failed: ${response.status()}`);
}

/**
 * The board as the open page holds it, through the window.plotcoder door.
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<BoardState>}
 */
export function boardOnPage(page) {
  return page.evaluate(() => window.plotcoder.list());
}

/**
 * The board as the dev bridge holds it — what the file and an agent would see.
 * @param {import("@playwright/test").APIRequestContext} request
 * @returns {Promise<BoardState>}
 */
export async function boardOnBridge(request) {
  const response = await request.get("/__plotcoder/board");
  const payload = await response.json();
  return payload.state;
}

/**
 * A minimal MCP client over stdio, the same shape the Vitest harness uses. It
 * spawns the real server pointed at the test bridge, so a tool call here goes
 * through exactly the path an agent's call would.
 */
export class McpClient {
  constructor() {
    this.nextId = 1;
    this.buffer = "";
    this.pending = new Map();
  }

  async start() {
    this.child = spawn("node", [SERVER], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PLOTCODER_ROOT: E2E_ROOT,
        PLOTCODER_BRIDGE_URL: E2E_URL,
      },
    });
    this.child.stdout.setEncoding("utf8");
    this.child.stdout.on("data", (chunk) => this.#consume(chunk));

    await this.#request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "plotcoder-e2e", version: "1.0.0" },
    });
    this.#send({ jsonrpc: "2.0", method: "notifications/initialized" });
  }

  #consume(chunk) {
    this.buffer += chunk;
    let cut;
    while ((cut = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, cut).trim();
      this.buffer = this.buffer.slice(cut + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      const waiting = this.pending.get(message.id);
      if (waiting) {
        this.pending.delete(message.id);
        waiting(message);
      }
    }
  }

  #send(message) {
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  #request(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request timed out: ${method}`));
      }, 10_000);
      this.pending.set(id, (message) => {
        clearTimeout(timer);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      });
      this.#send({ jsonrpc: "2.0", id, method, params });
    });
  }

  /** Call a tool and return its text: prose, a blank line, then a JSON payload. */
  async callTool(name, args = {}) {
    const result = await this.#request("tools/call", { name, arguments: args });
    return result.content.map((part) => part.text).join("\n");
  }

  /** Call a tool and parse the JSON payload after the blank line. */
  async callToolData(name, args = {}) {
    const text = await this.callTool(name, args);
    const split = text.indexOf("\n\n");
    return split === -1 ? undefined : JSON.parse(text.slice(split + 2));
  }

  stop() {
    this.child?.kill();
  }
}
