import { type Locator, type Page } from "@playwright/test";

export class HeroPage {
  constructor(private readonly page: Page) {}

  get section(): Locator {
    return this.page.locator('[data-testid="interactive-hero-section"]');
  }

  get canvas(): Locator {
    return this.section.locator("canvas");
  }

  get scrollIndicator(): Locator {
    return this.section.locator(".scroll-indicator");
  }

  get name(): Locator {
    return this.section.locator("h1");
  }

  async waitForMount(timeout = 10000): Promise<void> {
    await this.section.waitFor({ state: "attached", timeout });
  }

  async scrollPastHero(): Promise<void> {
    await this.page.evaluate(() =>
      window.scrollTo({ top: window.innerHeight + 100, behavior: "instant" }),
    );
    // Wait for IntersectionObserver to fire and unmount
    await this.page.waitForTimeout(300);
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() =>
      window.scrollTo({ top: 0, behavior: "instant" }),
    );
    await this.page.waitForTimeout(300);
  }
}
