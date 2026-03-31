import { type Locator, type Page } from "@playwright/test";

export class PortfolioPage {
  constructor(private readonly page: Page) {}

  get heroSection(): Locator {
    return this.page.locator('[data-testid="hero-section"]');
  }

  get aboutSection(): Locator {
    return this.page.locator('[data-testid="about-section"]');
  }

  get experienceSection(): Locator {
    return this.page.locator('[data-testid="experience-section"]');
  }

  get projectsSection(): Locator {
    return this.page.locator('[data-testid="projects-section"]');
  }

  get contactSection(): Locator {
    return this.page.locator('[data-testid="contact-section"]');
  }

  get contactEmail(): Locator {
    return this.page.locator('[data-testid="contact-email"]');
  }

  get pdfButton(): Locator {
    return this.page.locator('[data-testid="pdf-button"]');
  }

  get metaDescription(): Locator {
    return this.page.locator('meta[name="description"]');
  }

  async navigatePublic(): Promise<void> {
    await this.page.goto("/");
  }

  async navigatePrivate(): Promise<void> {
    await this.page.goto("/#full");
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }
}
