import { test, expect } from "@playwright/test";
import { HeroPage } from "../pages/hero.page";
import { HeroScenario } from "../scenarios";

test.describe("Interactive Hero (client-only)", () => {
  let hero: HeroPage;

  test.beforeEach(async ({ page }) => {
    hero = new HeroPage(page);
    await page.goto("/", { waitUntil: "networkidle" });
  });

  test(HeroScenario.MountsInBrowser, async () => {
    // Act
    await hero.waitForMount();

    // Assert
    await expect(hero.section).toBeAttached();
    await expect(hero.name).toContainText("Hugo Virgen");
  });

  test(HeroScenario.CanvasAttached, async () => {
    // Arrange
    await hero.waitForMount();

    // Assert
    await expect(hero.canvas).toBeAttached();
  });

  test(HeroScenario.ScrollIndicatorScrolls, async ({ page }) => {
    // Arrange
    await hero.waitForMount();

    // Act
    await hero.scrollIndicator.click();
    await page.waitForTimeout(500);

    // Assert
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(100);
  });

  test(HeroScenario.UnmountsOnScroll, async () => {
    // Arrange
    await hero.waitForMount();

    // Act
    await hero.scrollPastHero();

    // Assert
    await expect(hero.section).not.toBeAttached();
  });

  test(HeroScenario.RemountsOnScrollBack, async () => {
    // Arrange
    await hero.waitForMount();
    await hero.scrollPastHero();
    await expect(hero.section).not.toBeAttached();

    // Act
    await hero.scrollToTop();

    // Assert
    await hero.waitForMount();
    await expect(hero.section).toBeAttached();
  });
});
