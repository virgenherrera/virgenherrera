import { expect } from '@playwright/test';
import {
  INVALID_HASH,
  PRIVATE_HASH,
} from '../../constants/test-data.constants.js';
import { test } from '../../fixtures/resume.fixture.js';
import { ClientHydrationExpectations as should } from './csr.expectations.js';

test.describe('IT: CSR Resume page (client-side hydration)', () => {
  test.beforeEach(async ({ resumePage }) => {
    await resumePage.goto();
    await resumePage.waitForHydration();
  });

  test(should.showPublicByDefault, async ({ resumePage }) => {
    await expect(resumePage.sidebarContact).toBeAttached();
    await expect(resumePage.sidebarName).not.toBeEmpty();
  });

  test(should.stayPublicOnInvalidHash, async ({ resumePage }) => {
    await resumePage.gotoWithHash(INVALID_HASH);
    await resumePage.waitForHydration();
    await expect(resumePage.sidebarContact).toBeAttached();
    await expect(resumePage.mailtoLinks).toHaveCount(0);
    await expect(resumePage.telLinks).toHaveCount(0);
  });

  test(should.showExperienceAfterHydration, async ({ resumePage }) => {
    await expect(resumePage.experienceItems.first()).toBeAttached();
    const itemCount = await resumePage.experienceItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test(should.activatePrivateView, async ({ resumePage }) => {
    await resumePage.gotoWithHash(PRIVATE_HASH);
    await resumePage.waitForPrivateView();
    await expect(resumePage.sidebarContact).toBeVisible();
    await expect(resumePage.experienceItems.first()).toBeAttached();
  });

  test(should.revertToPublicOnClear, async ({ resumePage }) => {
    await resumePage.gotoWithHash(PRIVATE_HASH);
    await resumePage.waitForPrivateView();
    await resumePage.goto();
    await resumePage.waitForHydration();
    await expect(resumePage.sidebarContact).toBeAttached();
    await expect(resumePage.mailtoLinks).toHaveCount(0);
    await expect(resumePage.telLinks).toHaveCount(0);
  });

  test(should.showPublicContactLinksDefault, async ({ resumePage }) => {
    await expect(resumePage.sidebarContact).toBeAttached();
    const linkCount = await resumePage.contactLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(2);
    await expect(
      resumePage.contactLinks.filter({ hasText: 'GitHub' }),
    ).toBeAttached();
    await expect(
      resumePage.contactLinks.filter({ hasText: 'LinkedIn' }),
    ).toBeAttached();
  });

  test(should.renderContactIcons, async ({ resumePage }) => {
    await expect(resumePage.contactIcons.first()).toBeAttached();
    const iconCount = await resumePage.contactIcons.count();
    const linkCount = await resumePage.contactLinks.count();
    expect(iconCount).toBe(linkCount);
  });

  test(should.applyBlankTargetOnExternalLinks, async ({ resumePage }) => {
    const githubAnchor = resumePage.contactLinks
      .filter({ hasText: 'GitHub' })
      .locator('a');
    await expect(githubAnchor).toHaveAttribute('target', '_blank');
    await expect(githubAnchor).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test(should.applyStickyPositionOnSidebar, async ({ resumePage }) => {
    await expect(resumePage.sidebar).toHaveCSS('position', 'sticky');
  });

  test(should.hideDownloadInPublicView, async ({ resumePage }) => {
    await expect(resumePage.downloadButton).not.toBeAttached();
  });

  test.describe('theme', () => {
    test(should.toggleToDarkTheme, async ({ resumePage }) => {
      await resumePage.themeToggle.click();
      await expect(resumePage.rootElement).toHaveClass(/dark/);
    });

    test(should.toggleBackToLightTheme, async ({ resumePage }) => {
      await resumePage.themeToggle.click();
      await expect(resumePage.rootElement).toHaveClass(/dark/);
      await resumePage.themeToggle.click();
      await expect(resumePage.rootElement).not.toHaveClass(/dark/);
    });

    test(should.keepThemeToggleVisibleOnScroll, async ({ resumePage }) => {
      await resumePage.page.evaluate(() =>
        window.scrollTo(0, window.innerHeight),
      );
      await expect(resumePage.themeToggle).toBeVisible();
      await expect(resumePage.themeToggle).toHaveCSS('position', 'fixed');
    });

    test(should.applyDarkBackgroundToBody, async ({ resumePage }) => {
      await resumePage.themeToggle.click();
      await expect(resumePage.rootElement).toHaveClass(/dark/);
      const bodyBg = await resumePage.page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      );
      expect(bodyBg).not.toBe('rgba(0, 0, 0, 0)');
      expect(bodyBg).not.toBe('rgb(255, 255, 255)');
    });

    test(should.differentiateSidebarFromPage, async ({ resumePage }) => {
      await resumePage.themeToggle.click();
      await expect(resumePage.rootElement).toHaveClass(/dark/);
      const [sidebarBg, rootBg] = await resumePage.page.evaluate(() => {
        const sidebar = document.querySelector('.vh-profile-sidebar');
        const root = document.querySelector('vh-root');

        return [
          getComputedStyle(sidebar!).backgroundColor,
          getComputedStyle(root!).backgroundColor,
        ];
      });
      expect(sidebarBg).not.toBe(rootBg);
    });
  });

  test.describe('private view', () => {
    test.beforeEach(async ({ resumePage }) => {
      await resumePage.gotoWithHash(PRIVATE_HASH);
      await resumePage.waitForPrivateView();
    });

    test(should.displayPrivateContact, async ({ resumePage }) => {
      await expect(resumePage.sidebarContact).toBeVisible();
    });

    test(should.displayFullExperience, async ({ resumePage }) => {
      await expect(resumePage.experienceItems.first()).toBeVisible();
    });

    test(should.addPrivateContactsWithHash, async ({ resumePage }) => {
      await expect(
        resumePage.contactLinks.filter({ hasText: 'Email' }),
      ).toBeAttached();
      await expect(
        resumePage.contactLinks.filter({ hasText: 'Phone' }),
      ).toBeAttached();
      const linkCount = await resumePage.contactLinks.count();
      expect(linkCount).toBe(4);
    });

    test(should.noTargetOnTelLinks, async ({ resumePage }) => {
      const phoneAnchor = resumePage.contactLinks
        .filter({ hasText: 'Phone' })
        .locator('a');
      const targetAttr = await phoneAnchor.getAttribute('target');
      expect(targetAttr).toBeNull();
    });

    test(should.expandAboutWithShowMore, async ({ resumePage }) => {
      await expect(resumePage.aboutToggle).toBeVisible();
      await expect(resumePage.aboutToggle).toHaveText('Show more');
      await resumePage.aboutToggle.click();
      await expect(resumePage.aboutText).toHaveClass(/--expanded/);
      await expect(resumePage.aboutToggle).toHaveText('Show less');
    });

    test(should.collapseAboutWithShowLess, async ({ resumePage }) => {
      await expect(resumePage.aboutToggle).toBeVisible();
      await resumePage.aboutToggle.click();
      await expect(resumePage.aboutText).toHaveClass(/--expanded/);
      await resumePage.aboutToggle.click();
      await expect(resumePage.aboutText).not.toHaveClass(/--expanded/);
      await expect(resumePage.aboutToggle).toHaveText('Show more');
    });

    test(should.showDownloadInPrivateView, async ({ resumePage }) => {
      await expect(resumePage.downloadButton).toBeVisible();
      await expect(resumePage.downloadButton).toHaveText(/Download PDF/);
    });

    test(should.downloadPdfOnClick, async ({ resumePage }) => {
      const downloadPromise = resumePage.page.waitForEvent('download');
      await resumePage.downloadButton.click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });

    test(should.downloadValidPdf, async ({ resumePage }) => {
      const downloadPromise = resumePage.page.waitForEvent('download');
      await resumePage.downloadButton.click();
      const download = await downloadPromise;

      const filePath = await download.path();
      if (!filePath) throw new Error('Download path is null');

      const { readFileSync } = await import('node:fs');
      const buffer = readFileSync(filePath);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.toString('ascii', 0, 5)).toBe('%PDF-');

      const content = buffer.toString('latin1');
      expect(content).toContain('Hugo');
    });

    test(should.navigateToDownloadWithKeyboard, async ({ resumePage }) => {
      await resumePage.downloadButton.focus();
      await expect(resumePage.downloadButton).toBeFocused();

      const downloadPromise = resumePage.page.waitForEvent('download');
      await resumePage.page.keyboard.press('Enter');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
      await expect(resumePage.downloadButton).toBeFocused();
    });
  });
});
