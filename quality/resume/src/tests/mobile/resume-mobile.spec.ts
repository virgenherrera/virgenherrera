import { expect } from '@playwright/test';
import { PRIVATE_HASH } from '../../constants/test-data.constants.js';
import { test } from '../../fixtures/resume.fixture.js';
import { MobileViewportExpectations as should } from './mobile.expectations.js';

test.describe('IT: Resume page — mobile viewport (functional)', () => {
  test.beforeEach(async ({ resumePage }) => {
    await resumePage.goto();
    await resumePage.waitForHydration();
  });

  test(should.noHorizontalOverflow, async ({ resumePage }) => {
    const { scrollWidth, clientWidth } = await resumePage.page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test(should.stackSidebarBelowContent, async ({ resumePage }) => {
    await expect(resumePage.contentArea).toHaveCSS('flex-direction', 'column');
    await expect(resumePage.sidebar).toBeVisible();
    await expect(resumePage.mainContent).toBeVisible();
  });

  test(should.showSidebarContact, async ({ resumePage }) => {
    await expect(resumePage.sidebarContact).toBeVisible();
    await expect(resumePage.sidebarName).not.toBeEmpty();
  });

  test(should.showExperienceSection, async ({ resumePage }) => {
    await expect(resumePage.experienceItems.first()).toBeVisible();
    const itemCount = await resumePage.experienceItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test(should.showSkillsSection, async ({ resumePage }) => {
    await expect(resumePage.skillGroups.first()).toBeVisible();
  });

  test.describe('action hub', () => {
    test(should.expandActionHub, async ({ resumePage }) => {
      await resumePage.actionHubTrigger.click();
      await expect(resumePage.actionHubPanel).toBeVisible();
    });

    test(should.collapseActionHub, async ({ resumePage }) => {
      await resumePage.expandHub();
      await expect(resumePage.actionHubPanel).toBeVisible();
      await resumePage.page.keyboard.press('Escape');
      await expect(resumePage.actionHubPanel).toBeHidden();
    });

    test(should.actionHubWithinViewport, async ({ resumePage }) => {
      await resumePage.expandHub();
      const viewport = resumePage.page.viewportSize();
      const box = await resumePage.actionHubPanel.boundingBox();

      expect(box).not.toBeNull();
      expect(viewport).not.toBeNull();
      if (box && viewport) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }
    });

    test(should.showLinkedInCtaInPublicView, async ({ resumePage }) => {
      await resumePage.expandHub();
      await expect(resumePage.linkedInCta).toBeVisible();
    });
  });

  test.describe('theme', () => {
    test(should.toggleTheme, async ({ resumePage }) => {
      await resumePage.expandHub();
      await resumePage.themeToggleAction.click();
      await expect(resumePage.htmlRoot).toHaveClass(/dark/);
    });
  });

  test.describe('private view', () => {
    test.beforeEach(async ({ resumePage }) => {
      await resumePage.gotoWithHash(PRIVATE_HASH);
      await resumePage.waitForPrivateView();
    });

    test(should.showDownloadButton, async ({ resumePage }) => {
      await resumePage.expandHub();
      await expect(resumePage.downloadButton).toBeVisible();
    });

    test(should.downloadPdfOnTap, async ({ resumePage }) => {
      await resumePage.expandHub();
      const downloadPromise = resumePage.page.waitForEvent('download');
      await resumePage.downloadButton.click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });
  });
});
