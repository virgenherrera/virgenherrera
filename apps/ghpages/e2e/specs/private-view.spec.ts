import { test, expect } from "@playwright/test";
import { PortfolioPage } from "../pages/portfolio.page";

test.describe("Private view (/#full)", () => {
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
  });

  test("shows disabled PDF download button", async () => {
    // Assert
    await expect(portfolio.pdfButton).toBeVisible();
    await expect(portfolio.pdfButton).toBeDisabled();
  });
});
