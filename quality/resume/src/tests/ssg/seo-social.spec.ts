import { expect } from '@playwright/test';
import { PUBLIC_PROFILE } from '@vh/profile/data';
import {
  AVATAR_URL,
  META_DESCRIPTION_MAX_LENGTH,
  SITE_URL,
} from '../../constants/seo.constants.js';
import { test } from '../../fixtures/resume.fixture.js';
import { extractMetaContent } from '../../helpers/head-meta.helper.js';
import { SsgPreRenderExpectations as should } from './ssg.expectations.js';

test.describe('IT: SSG Resume page — social sharing SEO (raw response)', () => {
  test(should.haveOgTitle, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const ogTitle = extractMetaContent(html, 'property', 'og:title');

    expect(ogTitle).toBeTruthy();
    expect(ogTitle!.startsWith(`${PUBLIC_PROFILE.name} — `)).toBe(true);
  });

  test(should.haveOgDescription, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const ogDescription = extractMetaContent(
      html,
      'property',
      'og:description',
    );

    expect(ogDescription).toBeTruthy();
    expect(ogDescription!.length).toBeLessThanOrEqual(
      META_DESCRIPTION_MAX_LENGTH,
    );
  });

  test(should.haveOgUrl, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const ogUrl = extractMetaContent(html, 'property', 'og:url');

    expect(ogUrl).toBe(SITE_URL);
  });

  test(should.haveOgType, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const ogType = extractMetaContent(html, 'property', 'og:type');

    expect(ogType).toBe('profile');
  });

  test(should.haveOgImage, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const ogImage = extractMetaContent(html, 'property', 'og:image');

    expect(ogImage).toBe(AVATAR_URL);
  });

  test(should.haveOgImageDimensions, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const width = extractMetaContent(html, 'property', 'og:image:width');
    const height = extractMetaContent(html, 'property', 'og:image:height');

    expect(width).toBe('528');
    expect(height).toBe('528');
  });

  test(should.haveTwitterCard, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const twitterCard = extractMetaContent(html, 'name', 'twitter:card');

    expect(twitterCard).toBe('summary');
  });

  test(should.haveTwitterTitle, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const twitterTitle = extractMetaContent(html, 'name', 'twitter:title');

    expect(twitterTitle).toBeTruthy();
  });

  test(should.haveTwitterImage, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const twitterImage = extractMetaContent(html, 'name', 'twitter:image');

    expect(twitterImage).toBe(AVATAR_URL);
  });

  test(should.haveOgLocale, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const ogLocale = extractMetaContent(html, 'property', 'og:locale');

    expect(ogLocale).toBe('en_US');
  });

  test(should.haveImageAltText, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const ogImageAlt = extractMetaContent(html, 'property', 'og:image:alt');
    const twitterImageAlt = extractMetaContent(
      html,
      'name',
      'twitter:image:alt',
    );

    expect(ogImageAlt).toBeTruthy();
    expect(ogImageAlt).toContain(PUBLIC_PROFILE.name);
    expect(twitterImageAlt).toBeTruthy();
    expect(twitterImageAlt).toContain(PUBLIC_PROFILE.name);
  });

  test(should.notLeakPiiInSocialMeta, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const values = [
      extractMetaContent(html, 'property', 'og:title'),
      extractMetaContent(html, 'property', 'og:description'),
      extractMetaContent(html, 'name', 'twitter:title'),
      extractMetaContent(html, 'name', 'twitter:description'),
    ];

    for (const value of values) {
      expect(value).not.toContain('mailto:');
      expect(value).not.toContain('tel:');
      expect(value).not.toContain('@');
    }
  });
});
