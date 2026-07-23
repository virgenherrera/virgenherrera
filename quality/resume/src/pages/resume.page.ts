import type { Locator, Page } from '@playwright/test';
import { BASE_PATH } from '../constants/base-path.constant.js';
import { LAYOUT } from '../constants/layout.constants.js';

export class ResumePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto(`${BASE_PATH}/`);
  }

  /** Navigates and returns the raw HTTP response body — what crawlers see. */
  async gotoRaw(): Promise<string> {
    const response = await this.page.goto(`${BASE_PATH}/`);

    return response!.text();
  }

  async gotoWithHash(hash: string): Promise<void> {
    await this.page.goto(`${BASE_PATH}/#${hash}`);
  }

  async waitForHydration(): Promise<void> {
    await this.page.waitForSelector('vh-resume-page', { state: 'attached' });
    await this.page.waitForLoadState('load');
  }

  async waitForPrivateView(): Promise<void> {
    await this.waitForHydration();
    await this.page.waitForSelector('a[href^="mailto:"]', {
      state: 'attached',
    });
  }

  async expandHub(): Promise<void> {
    const trigger = this.actionHubTrigger;
    const expanded = await trigger.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await trigger.click();
      await this.actionHubPanel.waitFor({ state: 'visible' });
    }
  }

  get rootElement(): Locator {
    return this.page.locator('vh-root');
  }

  /** The `<html>` element — used to verify dark theme class applied by ThemeStore. */
  get htmlRoot(): Locator {
    return this.page.locator('html');
  }

  get jumbotron(): Locator {
    return this.page.locator(LAYOUT.jumbotron.selector);
  }

  get particleCanvas(): Locator {
    return this.page.locator('vh-particle-canvas canvas');
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

  /**
   * The floating action hub trigger button — fixed element visible at all scroll positions.
   * Used for scroll-visibility tests and as the entry point to the hub panel.
   */
  get themeToggle(): Locator {
    return this.page.locator('.vh-floating-actions__trigger');
  }

  get actionHubTrigger(): Locator {
    return this.page.locator('.vh-floating-actions__trigger');
  }

  get actionHubPanel(): Locator {
    return this.page.locator('#vh-action-hub-panel');
  }

  get themeToggleAction(): Locator {
    return this.page.locator('.vh-floating-actions__item[aria-label*="mode"]');
  }

  get downloadButton(): Locator {
    return this.page.locator(
      '.vh-floating-actions__item[aria-label="Download resume"]',
    );
  }

  get linkedInCta(): Locator {
    return this.page.locator(
      '.vh-floating-actions__item[aria-label="Connect on LinkedIn"]',
    );
  }

  get actionItems(): Locator {
    return this.page.locator('.vh-floating-actions__item');
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

  get metaDescription(): Locator {
    return this.page.locator('head meta[name="description"]');
  }

  get metaRobots(): Locator {
    return this.page.locator('head meta[name="robots"]');
  }

  get canonicalLink(): Locator {
    return this.page.locator('head link[rel="canonical"]');
  }

  get ogTitle(): Locator {
    return this.page.locator('head meta[property="og:title"]');
  }

  get ogDescription(): Locator {
    return this.page.locator('head meta[property="og:description"]');
  }

  get ogUrl(): Locator {
    return this.page.locator('head meta[property="og:url"]');
  }

  get ogType(): Locator {
    return this.page.locator('head meta[property="og:type"]');
  }

  get ogSiteName(): Locator {
    return this.page.locator('head meta[property="og:site_name"]');
  }

  get ogImage(): Locator {
    return this.page.locator('head meta[property="og:image"]');
  }

  get ogImageWidth(): Locator {
    return this.page.locator('head meta[property="og:image:width"]');
  }

  get ogImageHeight(): Locator {
    return this.page.locator('head meta[property="og:image:height"]');
  }

  get ogImageAlt(): Locator {
    return this.page.locator('head meta[property="og:image:alt"]');
  }

  get ogLocale(): Locator {
    return this.page.locator('head meta[property="og:locale"]');
  }

  get twitterCard(): Locator {
    return this.page.locator('head meta[name="twitter:card"]');
  }

  get twitterTitle(): Locator {
    return this.page.locator('head meta[name="twitter:title"]');
  }

  get twitterDescription(): Locator {
    return this.page.locator('head meta[name="twitter:description"]');
  }

  get twitterImage(): Locator {
    return this.page.locator('head meta[name="twitter:image"]');
  }

  get twitterImageAlt(): Locator {
    return this.page.locator('head meta[name="twitter:image:alt"]');
  }
}
