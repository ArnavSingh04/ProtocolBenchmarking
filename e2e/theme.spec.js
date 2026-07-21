import { test, expect } from "@playwright/test";

test.describe("Flow 5 — theme and responsive UI", () => {
  test("theme toggles and persists across reloads", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const initial = await html.getAttribute("data-theme");

    await page.getByRole("button", { name: /switch to (dark|light) theme/i }).click();
    const toggled = await html.getAttribute("data-theme");
    expect(toggled).not.toBe(initial);

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", toggled);
  });

  test("mobile navigation menu works at a small viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");

    // Desktop nav is hidden; the hamburger is shown.
    const menuButton = page.getByRole("button", { name: /open menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const mobileNav = page.locator("#mobile-nav");
    await expect(mobileNav).toBeVisible();
    await mobileNav.getByRole("link", { name: /history/i }).click();
    await expect(page).toHaveURL(/\/history/);
    await expect(page.getByRole("heading", { name: /test history/i })).toBeVisible();
  });

  test("results page remains usable on desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.getByLabel(/test name/i).fill("E2E responsive");
    await page.getByRole("button", { name: /start benchmark/i }).click();
    await expect(page.getByRole("button", { name: /view results/i })).toBeVisible({
      timeout: 60_000
    });
    await page.getByRole("button", { name: /view results/i }).click();
    await expect(page.getByRole("heading", { name: /protocol ranking/i })).toBeVisible();
    // No horizontal overflow on the body.
    const scrollW = await page.evaluate(() => document.body.scrollWidth);
    const clientW = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollW).toBeLessThanOrEqual(clientW + 2);
  });
});
