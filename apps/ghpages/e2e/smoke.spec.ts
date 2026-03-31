import { test, expect } from "@playwright/test";

test.describe("Public route (/)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero section", async ({ page }) => {
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
  });

  test("renders about section", async ({ page }) => {
    await expect(page.locator('[data-testid="about-section"]')).toBeVisible();
  });

  test("renders experience section", async ({ page }) => {
    await expect(
      page.locator('[data-testid="experience-section"]'),
    ).toBeVisible();
  });

  test("renders projects section", async ({ page }) => {
    await expect(
      page.locator('[data-testid="projects-section"]'),
    ).toBeVisible();
  });

  test("renders contact section", async ({ page }) => {
    await expect(page.locator('[data-testid="contact-section"]')).toBeVisible();
  });

  test("email is hidden on public route", async ({ page }) => {
    await expect(
      page.locator('[data-testid="contact-email"]'),
    ).not.toBeVisible();
  });

  test("PDF button is hidden on public route", async ({ page }) => {
    await expect(page.locator('[data-testid="pdf-button"]')).not.toBeVisible();
  });

  test("has correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/Hugo Virgen Herrera.*Portfolio/);
  });

  test("has meta description", async ({ page }) => {
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute("content", /Hugo Virgen Herrera/);
  });
});

test.describe("Private view (/#full)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#full");
  });

  test("renders all 5 sections", async ({ page }) => {
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="about-section"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="experience-section"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="projects-section"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="contact-section"]')).toBeVisible();
  });

  test("email is visible on private view", async ({ page }) => {
    await expect(page.locator('[data-testid="contact-email"]')).toBeVisible();
  });

  test("PDF button is visible and disabled on private view", async ({
    page,
  }) => {
    const button = page.locator('[data-testid="pdf-button"]');
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  });
});
