import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Mirror the webpack alias in next.config.js so the benchmark engine's
      // `require("meteor/meteor")` resolves in the test runner too.
      "meteor/meteor": path.resolve(__dirname, "lib/server/meteorShim.js")
    }
  },
  test: {
    globals: true,
    include: [
      "tests/unit/**/*.test.{js,jsx}",
      "tests/integration/**/*.test.{js,jsx}"
    ],
    setupFiles: ["tests/setup.js"],
    environment: "node"
  }
});
