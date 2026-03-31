import { test, expect } from "@playwright/test";
import { PortfolioPage } from "../pages/portfolio.page";

test.describe("Public view (/)", () => {
  let portfolio: PortfolioPage;

  test.beforeEach(async ({ page }) => {
    portfolio = new PortfolioPage(page);
    await portfolio.navigatePublic();
  });

  test("renders all portfolio sections", async () => {
    // Assert
    await expect(portfolio.heroSection).toBeVisible();
    await expect(portfolio.aboutSection).toBeVisible();
    await expect(portfolio.experienceSection).toBeVisible();
    await expect(portfolio.projectsSection).toBeVisible();
    await expect(portfolio.contactSection).toBeVisible();
  });

  test("hides private email", async () => {
    // Assert
    await expect(portfolio.contactEmail).not.toBeVisible();
  });

  test("hides PDF download button", async () => {
    // Assert
    await expect(portfolio.pdfButton).not.toBeVisible();
  });

  test("displays portfolio title", async () => {
    // Act
    const title = await portfolio.getTitle();

    // Assert
    expect(title).toMatch(/Hugo Virgen Herrera.*Portfolio/);
  });

  test("includes meta description", async () => {
    // Assert
    await expect(portfolio.metaDescription).toHaveAttribute(
      "content",
      /Hugo Virgen Herrera/,
    );
  });
});
