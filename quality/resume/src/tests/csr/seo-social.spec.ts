import { expect } from '@playwright/test';
import { PUBLIC_PROFILE } from '@vh/profile/data';
import {
  AVATAR_URL,
  META_DESCRIPTION_MAX_LENGTH,
  SITE_URL,
} from '../../constants/seo.constants.js';
import { test } from '../../fixtures/resume.fixture.js';
import { ClientHydrationExpectations as should } from './csr.expectations.js';

test.describe('IT: CSR Resume page — social sharing SEO (live DOM)', () => {
  test.beforeEach(async ({ resumePage }) => {
    await resumePage.goto();
    await resumePage.waitForHydration();
  });

  test(should.haveOgTitle, async ({ resumePage }) => {
    const ogTitle = await resumePage.ogTitle.getAttribute('content');

    expect(ogTitle).toBeTruthy();
    const expectedTitle = `${PUBLIC_PROFILE.name} — ${PUBLIC_PROFILE.experience[0].role}`;
    expect(ogTitle).toBe(expectedTitle);
  });

  test(should.haveOgDescription, async ({ resumePage }) => {
    const ogDescription =
      await resumePage.ogDescription.getAttribute('content');

    expect(ogDescription).toBeTruthy();
    expect(ogDescription!.length).toBeLessThanOrEqual(
      META_DESCRIPTION_MAX_LENGTH,
    );
  });

  test(should.haveOgUrl, async ({ resumePage }) => {
    const ogUrl = await resumePage.ogUrl.getAttribute('content');

    expect(ogUrl).toBe(SITE_URL);
  });

  test(should.haveOgType, async ({ resumePage }) => {
    const ogType = await resumePage.ogType.getAttribute('content');

    expect(ogType).toBe('profile');
  });

  test(should.haveOgImage, async ({ resumePage }) => {
    const ogImage = await resumePage.ogImage.getAttribute('content');

    expect(ogImage).toBe(AVATAR_URL);
  });

  test(should.haveOgImageDimensions, async ({ resumePage }) => {
    const width = await resumePage.ogImageWidth.getAttribute('content');
    const height = await resumePage.ogImageHeight.getAttribute('content');

    expect(width).toBe('528');
    expect(height).toBe('528');
  });

  test(should.haveTwitterCard, async ({ resumePage }) => {
    const twitterCard = await resumePage.twitterCard.getAttribute('content');

    expect(twitterCard).toBe('summary');
  });

  test(should.haveTwitterTitle, async ({ resumePage }) => {
    const twitterTitle = await resumePage.twitterTitle.getAttribute('content');

    expect(twitterTitle).toBeTruthy();
  });

  test(should.haveTwitterImage, async ({ resumePage }) => {
    const twitterImage = await resumePage.twitterImage.getAttribute('content');

    expect(twitterImage).toBe(AVATAR_URL);
  });

  test(should.haveOgLocale, async ({ resumePage }) => {
    const ogLocale = await resumePage.ogLocale.getAttribute('content');

    expect(ogLocale).toBe('en_US');
  });

  test(should.haveImageAltText, async ({ resumePage }) => {
    const ogImageAlt = await resumePage.ogImageAlt.getAttribute('content');
    const twitterImageAlt =
      await resumePage.twitterImageAlt.getAttribute('content');

    expect(ogImageAlt).toBeTruthy();
    expect(ogImageAlt).toContain(PUBLIC_PROFILE.name);
    expect(twitterImageAlt).toBeTruthy();
    expect(twitterImageAlt).toContain(PUBLIC_PROFILE.name);
  });

  test(should.notLeakPiiInSocialMeta, async ({ resumePage }) => {
    const values = await Promise.all([
      resumePage.ogTitle.getAttribute('content'),
      resumePage.ogDescription.getAttribute('content'),
      resumePage.twitterTitle.getAttribute('content'),
      resumePage.twitterDescription.getAttribute('content'),
    ]);

    for (const value of values) {
      expect(value).not.toContain('mailto:');
      expect(value).not.toContain('tel:');
      expect(value).not.toContain('@');
    }
  });
});
