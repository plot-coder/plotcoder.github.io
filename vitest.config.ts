import { defineConfig } from "vitest/config";

// Tests cover the DOM-free half of PlotCoder: the board kernel, the pure
// geometry/layout helpers, and the MCP server's offline path. Nothing here
// needs a browser, so the app's React and dev-bridge plugins stay out of it.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
  },
});
