import { test, expect } from "@playwright/test";

// Flow 3 — failure handling. Uses Live mode against an unreachable local port
// so the failure is real, fast (connection refused) and deterministic offline.
test.describe("Flow 3 — failure handling", () => {
  test("a failing endpoint is reported and never leaves the run stuck", async ({
    page
  }) => {
    await page.goto("/");

    // Switch to Live mode.
    await page.getByRole("button", { name: "Live", exact: true }).click();

    // Test only MQTT against a refused port.
    for (const name of ["HTTP", "WebSocket"]) {
      await page
        .getByRole("checkbox", { name: new RegExp(name, "i") })
        .uncheck({ force: true });
    }
    await page.getByLabel(/mqtt broker url/i).fill("mqtt://127.0.0.1:1");

    const start = page.getByRole("button", { name: /start benchmark/i });
    await expect(start).toBeEnabled();
    await start.click();

    await expect(page).toHaveURL(/\/live\?testRunId=/);

    // The run must reach a terminal (failed) state — never stuck on "running".
    await expect(page.locator(".status-badge.failed").first()).toBeVisible({
      timeout: 60_000
    });

    // Go to results and confirm the failure is communicated with no false winner.
    await page.getByRole("button", { name: /results/i }).first().click();
    await expect(page).toHaveURL(/\/results\?testRunId=/);
    await expect(
      page.getByText(/no protocol produced usable data|could not be evaluated/i).first()
    ).toBeVisible();
    await expect(page.getByText(/best fit for your priorities/i)).toHaveCount(0);
  });
});
