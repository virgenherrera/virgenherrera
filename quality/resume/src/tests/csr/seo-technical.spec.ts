import { expect } from '@playwright/test';
import { PUBLIC_PROFILE } from '@vh/profile/data';
import { BASE_PATH } from '../../constants/base-path.constant.js';
import {
  META_DESCRIPTION_MAX_LENGTH,
  SITE_URL,
} from '../../constants/seo.constants.js';
import { test } from '../../fixtures/resume.fixture.js';
import { ClientHydrationExpectations as should } from './csr.expectations.js';

test.describe('IT: CSR Resume page — technical SEO (live DOM)', () => {
  test.beforeEach(async ({ resumePage }) => {
    await resumePage.goto();
    await resumePage.waitForHydration();
  });

  test(should.haveDynamicTitle, async ({ resumePage }) => {
    const title = await resumePage.page.title();

    expect(title.startsWith(`${PUBLIC_PROFILE.name} — `)).toBe(true);
  });

  test(should.haveMetaDescription, async ({ resumePage }) => {
    const description =
      await resumePage.metaDescription.getAttribute('content');

    expect(description).toBeTruthy();
    expect(description!.length).toBeLessThanOrEqual(
      META_DESCRIPTION_MAX_LENGTH,
    );

    const withoutEllipsis = description!.endsWith('…')
      ? description!.slice(0, -1)
      : description!;

    expect(PUBLIC_PROFILE.summary.startsWith(withoutEllipsis)).toBe(true);
  });

  test(should.haveCanonicalLink, async ({ resumePage }) => {
    const href = await resumePage.canonicalLink.getAttribute('href');

    expect(href).toBe(SITE_URL);
  });

  test(should.serveSitemap, async ({ resumePage }) => {
    const response = await resumePage.page.goto(`${BASE_PATH}/sitemap.xml`);
    expect(response?.status()).toBe(200);

    const body = await response!.text();
    const locMatches = body.match(/<loc>/g) ?? [];

    expect(locMatches).toHaveLength(1);
    expect(body).toContain(`<loc>${SITE_URL}</loc>`);
    expect(body).toContain(
      'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    );
  });

  test(should.haveRobotsMeta, async ({ resumePage }) => {
    const content = await resumePage.metaRobots.getAttribute('content');

    expect(content).toBe('index, follow, max-image-preview:large');
  });

  test(should.notLeakPiiInHead, async ({ resumePage }) => {
    const headHtml = await resumePage.page.locator('head').innerHTML();

    expect(headHtml).not.toContain('mailto:');
    expect(headHtml).not.toContain('tel:');
  });
});
