import type { Locator, Page } from '@playwright/test';
import { LAYOUT } from '../constants/layout.constants.js';

export class ResumePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async gotoWithHash(hash: string): Promise<void> {
    await this.page.goto(`/#${hash}`);
  }

  async waitForHydration(): Promise<void> {
    await this.page.waitForSelector('vh-resume-page', { state: 'attached' });
    await this.page.waitForLoadState('load');
  }

  async waitForPrivateView(): Promise<void> {
    await this.waitForHydration();
    await this.page.waitForSelector('vh-file-action[vhContactAction]', {
      state: 'visible',
    });
  }

  get jumbotron(): Locator {
    return this.page.locator(LAYOUT.jumbotron.selector);
  }

  get sidebar(): Locator {
    return this.page.locator(LAYOUT.sidebar.selector);
  }

  get mainContent(): Locator {
    return this.page.locator(LAYOUT.content.selector);
  }

  get contentArea(): Locator {
    return this.page.locator(LAYOUT.contentArea.selector);
  }

  get nameHeading(): Locator {
    return this.page.locator('.vh-jumbotron__heading');
  }

  get scrollCta(): Locator {
    return this.page.locator('.vh-jumbotron__scroll-label');
  }

  get sidebarName(): Locator {
    return this.page.locator('.vh-profile-sidebar__name');
  }

  get sidebarContact(): Locator {
    return this.page.locator('.vh-profile-sidebar__contact');
  }

  get skillGroups(): Locator {
    return this.page.locator('vh-skill-group');
  }

  get experienceItems(): Locator {
    return this.page.locator('vh-experience-item');
  }

  get themeToggle(): Locator {
    return this.page.locator('.vh-theme-toggle');
  }

  get aboutSection(): Locator {
    return this.page.locator('.vh-profile-sidebar__about');
  }

  get aboutText(): Locator {
    return this.page.locator('.vh-profile-sidebar__about-text');
  }

  get aboutToggle(): Locator {
    return this.page.locator('.vh-profile-sidebar__about-toggle');
  }

  get contactLinks(): Locator {
    return this.page.locator('vh-contact-link');
  }

  get contactIcons(): Locator {
    return this.page.locator('.vh-profile-sidebar__contact vh-icon');
  }

  get mailtoLinks(): Locator {
    return this.page.locator('a[href^="mailto:"]');
  }

  get telLinks(): Locator {
    return this.page.locator('a[href^="tel:"]');
  }

  get snackbar(): Locator {
    return this.page.locator('text=Invalid link');
  }

  get downloadButton(): Locator {
    return this.page.locator('vh-file-action[vhContactAction] button');
  }
}
