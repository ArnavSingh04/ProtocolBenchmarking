import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    actionTimeout: 15_000
  },
  webServer: {
    // Production build so routes are fully compiled up front (no dev-mode
    // on-demand compilation racing with an in-flight benchmark run).
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    // Small simulation step keeps runs fast while still showing a live state.
    env: { SIM_STEP_MS: "40" }
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
