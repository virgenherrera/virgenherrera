import { test, expect } from "@playwright/test";
import { PortfolioPage } from "../pages/portfolio.page";

test.describe("Private view (valid payload hash)", () => {
  let portfolio: PortfolioPage;

  test.beforeEach(async ({ page }) => {
    portfolio = new PortfolioPage(page);
    await portfolio.navigatePrivate();
  });

  test("renders all portfolio sections", async () => {
    // Assert
    await expect(portfolio.heroSection).toBeVisible();
    await expect(portfolio.aboutSection).toBeVisible();
    await expect(portfolio.experienceSection).toBeVisible();
    await expect(portfolio.projectsSection).toBeVisible();
    await expect(portfolio.contactSection).toBeVisible();
  });

  test("reveals private email", async () => {
    // Assert
    await expect(portfolio.contactEmail).toBeVisible();
    await expect(portfolio.contactEmail).toHaveText("test@example.com");
  });

  test("reveals private phone as clickable tel link", async () => {
    // Assert
    await expect(portfolio.contactPhone).toBeVisible();
    await expect(portfolio.contactPhone).toHaveText("+1234567890");
    await expect(portfolio.contactPhone).toHaveAttribute(
      "href",
      "tel:+1234567890",
    );
  });

  test("shows enabled PDF download button", async () => {
    // Assert
    await expect(portfolio.pdfButton).toBeVisible();
    await expect(portfolio.pdfButton).toBeEnabled();
  });
});

test.describe("Invalid payload hash", () => {
  test("shows snackbar for invalid hash", async ({ page }) => {
    // Arrange
    const portfolio = new PortfolioPage(page);

    // Act
    await page.goto("/#invalidbase64garbage");

    // Assert
    await expect(portfolio.snackbar).toBeVisible();
    await expect(portfolio.snackbar).toHaveText(
      "Invalid link — showing public version",
    );
    await expect(portfolio.contactEmail).not.toBeVisible();
    await expect(portfolio.contactPhone).not.toBeVisible();
  });

  test("auto-dismisses snackbar after timeout", async ({ page }) => {
    // Arrange
    const portfolio = new PortfolioPage(page);

    // Act
    await page.goto("/#invalidbase64garbage");
    await expect(portfolio.snackbar).toBeVisible();

    // Assert — snackbar disappears after ~4s
    await expect(portfolio.snackbar).not.toBeVisible({ timeout: 6000 });
  });
});
