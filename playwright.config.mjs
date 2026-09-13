// End-to-end tests for the doors into the kernel: the wall, window.plotcoder,
// the dev bridge, and the MCP server, all against the real dev app.
//
// The test app runs on its own port with its own board file under a temp
// directory, so a run never touches the writer's .plotcoder/board.json or a
// dev server they already have open. Tests share that one bridge and reset it
// before each spec, so they run one at a time.
//
// Plain ESM, like the MCP tests, so it runs on any Node 20 without a
// TypeScript loader.

import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PORT = 5174;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// One throwaway root per run. Workers inherit process.env, so the specs and the
// MCP server they spawn see the same directory the dev bridge writes to.
process.env.PLOTCODER_E2E_ROOT ??= fs.mkdtempSync(path.join(os.tmpdir(), "plotcoder-e2e-"));
process.env.PLOTCODER_E2E_URL = BASE_URL;

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `${BASE_URL}/__plotcoder/board`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PLOTCODER_BOARD_FILE: path.join(process.env.PLOTCODER_E2E_ROOT, ".plotcoder", "board.json"),
    },
  },
});
