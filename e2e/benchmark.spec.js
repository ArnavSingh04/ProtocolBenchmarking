import { test, expect } from "@playwright/test";

async function startDefaultRun(page, name) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /configure a benchmark/i })).toBeVisible();
  if (name) {
    await page.getByLabel(/test name/i).fill(name);
  }
  const start = page.getByRole("button", { name: /start benchmark/i });
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page).toHaveURL(/\/live\?testRunId=/);
}

async function waitForCompletion(page) {
  // On the live page the primary button becomes "View results →" when done.
  await expect(page.getByRole("button", { name: /view results/i })).toBeVisible({
    timeout: 60_000
  });
}

test.describe("Flow 1 — successful benchmark", () => {
  test("configure, run, and view results with metrics, ranking and report", async ({
    page
  }) => {
    await startDefaultRun(page, "E2E happy path");

    // Live progress shows protocol status and reaches completion.
    await expect(page.getByRole("heading", { name: /live progress/i })).toBeVisible();
    await waitForCompletion(page);
    await page.getByRole("button", { name: /view results/i }).click();

    await expect(page).toHaveURL(/\/results\?testRunId=/);
    // Winner + ranking + charts + report action.
    await expect(page.getByText(/best fit for your priorities/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /protocol ranking/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /download report/i })).toBeVisible();
    // At least one chart canvas rendered.
    await expect(page.locator("canvas").first()).toBeVisible();
    // Raw metrics table present with units.
    await expect(page.getByRole("table")).toBeVisible();
  });
});

test.describe("Flow 2 — validation", () => {
  test("cannot start with no protocols or an invalid weight total", async ({ page }) => {
    await page.goto("/");
    const start = page.getByRole("button", { name: /start benchmark/i });
    await expect(start).toBeEnabled();

    // Deselect all protocols (checkboxes are visually hidden → force).
    for (const name of ["MQTT", "HTTP", "WebSocket"]) {
      await page
        .getByRole("checkbox", { name: new RegExp(name, "i") })
        .uncheck({ force: true });
    }
    await expect(start).toBeDisabled();
    await expect(
      page.getByText(/select at least one protocol to compare/i).first()
    ).toBeVisible();

    // Re-select one protocol, then break the weight total.
    await page.getByRole("checkbox", { name: /mqtt/i }).check({ force: true });
    await page.getByLabel(/latency weight percent/i).fill("90");
    await expect(start).toBeDisabled();
    await expect(page.getByText(/weights must total 100%/i).first()).toBeVisible();

    // The "Normalise to 100%" helper repairs the total.
    await page.getByRole("button", { name: /normalise to 100/i }).click();
    await expect(start).toBeEnabled();
  });
});

test.describe("Flow 4 — history", () => {
  test("a completed run appears in history and opens its results", async ({ page }) => {
    const name = "E2E history run";
    await startDefaultRun(page, name);
    await waitForCompletion(page);

    await page.goto("/history");
    await expect(page.getByRole("heading", { name: /test history/i })).toBeVisible();
    const card = page.getByRole("button", { name }).first();
    await expect(card).toBeVisible();
    await card.click();

    await expect(page).toHaveURL(/\/results\?testRunId=/);
    await expect(page.getByRole("heading", { name: name })).toBeVisible();
    await expect(page.getByRole("heading", { name: /protocol ranking/i })).toBeVisible();
  });
});
