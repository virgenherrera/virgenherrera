import { type Locator, type Page } from "@playwright/test";

interface PrivatePayload {
  email: string;
  phone: string;
}

const DEFAULT_PAYLOAD: PrivatePayload = {
  email: "test@example.com",
  phone: "+1234567890",
};

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

  get contactPhone(): Locator {
    return this.page.locator('[data-testid="contact-phone"]');
  }

  get pdfButton(): Locator {
    return this.page.locator('[data-testid="pdf-button"]');
  }

  get snackbar(): Locator {
    return this.page.locator('[data-testid="snackbar"]');
  }

  get metaDescription(): Locator {
    return this.page.locator('meta[name="description"]');
  }

  async navigatePublic(): Promise<void> {
    await this.page.goto("/");
  }

  async navigatePrivate(
    payload: PrivatePayload = DEFAULT_PAYLOAD,
  ): Promise<void> {
    const hash = btoa(JSON.stringify(payload));
    await this.page.goto(`/#${hash}`);
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  // --- Scroll helpers ---

  async scrollToPortfolio(): Promise<void> {
    await this.heroSection.scrollIntoViewIfNeeded();
    await this.heroSection.waitFor({ state: "visible", timeout: 5000 });
  }

  async scrollToContact(): Promise<void> {
    await this.contactSection.scrollIntoViewIfNeeded();
    await this.contactSection.waitFor({ state: "visible", timeout: 5000 });
  }
}
