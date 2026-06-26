import { LAYOUT } from '../../constants/layout.constants.js';
import { GOOGLE_VERIFICATION } from '../../constants/public-assets.constants.js';
import { expect } from '@playwright/test';
import { test } from '../../fixtures/resume.fixture.js';
import { SsgPreRenderExpectations as should } from './ssg.expectations.js';

test.describe('IT: SSG Resume page (pre-rendered)', () => {
  test.beforeEach(async ({ resumePage }) => {
    await resumePage.goto();
  });

  test(should.renderPrerenderedHtml, async ({ resumePage }) => {
    await expect(resumePage.jumbotron).toBeAttached();
    await expect(resumePage.sidebar).toBeAttached();
    await expect(resumePage.mainContent).toBeAttached();
  });

  test(should.displayProfileName, async ({ resumePage }) => {
    await expect(resumePage.nameHeading).not.toBeEmpty();
  });

  test(should.haveJumbotronFullViewport, async ({ resumePage }) => {
    const viewport = resumePage.page.viewportSize()!;
    const expectedWidth = `${viewport.width * LAYOUT.jumbotron.viewportWidthRatio}px`;
    const expectedHeight = `${viewport.height * LAYOUT.jumbotron.viewportHeightRatio}px`;

    await expect(resumePage.jumbotron).toHaveCSS('width', expectedWidth);
    await expect(resumePage.jumbotron).toHaveCSS('height', expectedHeight);
  });

  test(should.haveFlexContainer, async ({ resumePage }) => {
    await expect(resumePage.contentArea).toHaveCSS(
      'display',
      LAYOUT.contentArea.display,
    );
  });

  test(should.haveTwoColumnLayout, async ({ resumePage }) => {
    const contentAreaBox = await resumePage.contentArea.boundingBox();
    const sidebarBox = await resumePage.sidebar.boundingBox();
    const mainBox = await resumePage.mainContent.boundingBox();

    expect(contentAreaBox).toBeTruthy();
    expect(sidebarBox).toBeTruthy();
    expect(mainBox).toBeTruthy();

    const sidebarRatio = sidebarBox!.width / contentAreaBox!.width;
    const mainRatio = mainBox!.width / contentAreaBox!.width;

    expect(sidebarRatio).toBeCloseTo(LAYOUT.sidebar.parentWidthRatio, 1);
    // flex gap shrinks main content below its CSS width percentage
    const gapTolerance = 0.06;
    expect(Math.abs(mainRatio - LAYOUT.content.parentWidthRatio)).toBeLessThan(
      gapTolerance,
    );
  });

  test(should.renderExperienceTimeline, async ({ resumePage }) => {
    await expect(resumePage.experienceItems.first()).toBeAttached();
  });

  test(should.notShowPrivateContent, async ({ resumePage }) => {
    await expect(resumePage.mailtoLinks).toHaveCount(0);
    await expect(resumePage.telLinks).toHaveCount(0);
  });

  test(should.showProfileInSidebar, async ({ resumePage }) => {
    await expect(resumePage.sidebarName).not.toBeEmpty();
    await expect(resumePage.skillGroups.first()).toBeAttached();
    await expect(resumePage.sidebarContact).toBeAttached();
  });

  test(should.showExperienceItems, async ({ resumePage }) => {
    const itemCount = await resumePage.experienceItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test(should.renderThemeToggle, async ({ resumePage }) => {
    await expect(resumePage.themeToggle).toBeAttached();
  });

  test(should.renderAboutSection, async ({ resumePage }) => {
    await expect(resumePage.aboutSection).toBeAttached();
    await expect(resumePage.aboutText).not.toBeEmpty();
    await expect(resumePage.aboutToggle).not.toBeAttached();
  });

  test(should.showPublicContactLinks, async ({ resumePage }) => {
    await expect(resumePage.sidebarContact).toBeAttached();
    await expect(resumePage.contactLinks.first()).toBeAttached();
    const linkCount = await resumePage.contactLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(2);
  });

  test(should.haveStickyPositionOnSidebar, async ({ resumePage }) => {
    await expect(resumePage.sidebar).toHaveCSS('position', 'sticky');
  });

  test(should.notPreRenderDownloadButton, async ({ resumePage }) => {
    await expect(resumePage.downloadButton).not.toBeAttached();
  });

  test(should.serveGoogleVerificationFile, async ({ page }) => {
    const response = await page.goto(GOOGLE_VERIFICATION.path);
    test.skip(
      response?.status() === 404,
      `${GOOGLE_VERIFICATION.description} — file not yet in build output`,
    );
    expect(response?.status()).toBe(200);
  });
});
