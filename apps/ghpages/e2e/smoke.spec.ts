import { test, expect } from "@playwright/test";

test.describe("GH Pages Smoke", () => {
  test("renders the portfolio placeholder", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toHaveText("Hugo Virgen Herrera");
    await expect(page.locator("p")).toHaveText("Portfolio coming soon");
  });
});
