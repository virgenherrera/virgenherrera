import { expect } from '@playwright/test';
import { PUBLIC_PROFILE } from '@vh/profile/data';
import { BASE_PATH } from '../../constants/base-path.constant.js';
import {
  META_DESCRIPTION_MAX_LENGTH,
  SITE_URL,
} from '../../constants/seo.constants.js';
import { test } from '../../fixtures/resume.fixture.js';
import {
  extractLinkHref,
  extractMetaContent,
  extractTitle,
} from '../../helpers/head-meta.helper.js';
import { SsgPreRenderExpectations as should } from './ssg.expectations.js';

test.describe('IT: SSG Resume page — technical SEO (raw response)', () => {
  test(should.haveDynamicTitle, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const title = extractTitle(html);

    expect(title).toBeTruthy();
    expect(title!.startsWith(`${PUBLIC_PROFILE.name} — `)).toBe(true);
  });

  test(should.haveMetaDescription, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const description = extractMetaContent(html, 'name', 'description');

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
    const html = await resumePage.gotoRaw();
    const canonical = extractLinkHref(html, 'canonical');

    expect(canonical).toBe(SITE_URL);
  });

  test(should.serveSitemap, async ({ page }) => {
    const response = await page.goto(`${BASE_PATH}/sitemap.xml`);
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
    const html = await resumePage.gotoRaw();
    const robots = extractMetaContent(html, 'name', 'robots');

    expect(robots).toBe('index, follow, max-image-preview:large');
  });

  test(should.notLeakPiiInHead, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const head = headMatch ? headMatch[1] : '';

    expect(head).not.toContain('mailto:');
    expect(head).not.toContain('tel:');
  });
});
