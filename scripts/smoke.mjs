// Standalone browser smoke test — drives the real app the way a user does.
// Usage: BASE=http://localhost:3300 node scripts/smoke.mjs
import { chromium } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:3000";
const ITERATIONS = Number(process.env.ITERATIONS || 3);

function log(...a) {
  console.log("[smoke]", ...a);
}

const browser = await chromium.launch();
let failures = 0;

for (let i = 1; i <= ITERATIONS; i += 1) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

  try {
    log(`iteration ${i}: opening ${BASE}`);
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: /configure a benchmark/i }).waitFor({ timeout: 30000 });
    await page.getByLabel(/test name/i).fill(`smoke run ${i}`);

    const start = page.getByRole("button", { name: /start benchmark/i });
    await start.click();
    await page.waitForURL(/\/live/, { timeout: 20000 });
    log(`iteration ${i}: run started, waiting for completion…`);

    await page
      .getByRole("button", { name: /view results/i })
      .waitFor({ timeout: 90000 });
    log(`iteration ${i}: run COMPLETED`);

    await page.getByRole("button", { name: /view results/i }).click();
    await page.getByRole("heading", { name: /protocol ranking/i }).waitFor({ timeout: 20000 });
    await page.getByText(/best fit for your priorities/i).waitFor({ timeout: 20000 });
    log(`iteration ${i}: results rendered (winner + ranking)`);

    if (consoleErrors.length) {
      log(`iteration ${i}: CONSOLE ERRORS:`, consoleErrors.slice(0, 5));
      failures += 1;
    }
  } catch (err) {
    failures += 1;
    log(`iteration ${i}: FAILED —`, err.message);
    if (consoleErrors.length) log("  console:", consoleErrors.slice(0, 5));
  } finally {
    await context.close();
  }
}

await browser.close();
if (failures > 0) {
  console.error(`\n[smoke] ${failures}/${ITERATIONS} iterations had problems`);
  process.exit(1);
}
console.log(`\n[smoke] all ${ITERATIONS} iterations completed successfully ✓`);
