import { test, expect } from "@playwright/test";
import { PortfolioPage } from "../pages/portfolio.page";
import { HeroPage } from "../pages/hero.page";
import { PrivateScenario } from "../scenarios";

test.describe("Private view (valid payload hash)", () => {
  let portfolio: PortfolioPage;
  let hero: HeroPage;

  test.beforeEach(async ({ page }) => {
    // Arrange
    portfolio = new PortfolioPage(page);
    hero = new HeroPage(page);
    await portfolio.navigatePrivate();
    await hero.waitForMount();
    await hero.scrollPastHero();
    await portfolio.scrollToContact();
  });

  test(PrivateScenario.RevealsEmail, async () => {
    // Assert
    await expect(portfolio.contactEmail).toBeVisible();
    await expect(portfolio.contactEmail).toHaveText("test@example.com");
  });

  test(PrivateScenario.RevealsPhone, async () => {
    // Assert
    await expect(portfolio.contactPhone).toBeVisible();
    await expect(portfolio.contactPhone).toHaveText("+1234567890");
    await expect(portfolio.contactPhone).toHaveAttribute(
      "href",
      "tel:+1234567890",
    );
  });

  test(PrivateScenario.EnablesPdfButton, async () => {
    // Assert
    await expect(portfolio.pdfButton).toBeVisible();
    await expect(portfolio.pdfButton).toBeEnabled();
  });
});

test.describe("Invalid payload hash", () => {
  let portfolio: PortfolioPage;

  test.beforeEach(async ({ page }) => {
    portfolio = new PortfolioPage(page);
  });

  test(PrivateScenario.ShowsSnackbarOnInvalidHash, async ({ page }) => {
    // Act
    await page.goto("/#invalidbase64garbage");

    // Assert
    await expect(portfolio.snackbar).toBeVisible();
    await expect(portfolio.snackbar).toHaveText(
      "Invalid link — showing public version",
    );
  });

  test(PrivateScenario.DismissesSnackbar, async ({ page }) => {
    // Arrange
    await page.goto("/#invalidbase64garbage");
    await expect(portfolio.snackbar).toBeVisible();

    // Act & Assert — snackbar disappears after ~4s
    await expect(portfolio.snackbar).not.toBeVisible({ timeout: 10000 });
  });
});
