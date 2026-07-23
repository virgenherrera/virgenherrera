import { expect } from '@playwright/test';
import { test } from '../../fixtures/resume.fixture.js';
import {
  extractJsonLd,
  extractLinkHref,
  extractMetaContent,
} from '../../helpers/head-meta.helper.js';
import { SsgPreRenderExpectations as should } from './ssg.expectations.js';

test.describe('IT: Resume page — SSG/CSR structured data parity', () => {
  test(should.matchJsonLdBetweenSsgAndCsr, async ({ resumePage }) => {
    const rawHtml = await resumePage.gotoRaw();
    const ssgJsonLd = extractJsonLd(rawHtml);

    expect(ssgJsonLd).toBeTruthy();

    await resumePage.goto();
    await resumePage.waitForHydration();

    const csrContent = await resumePage.jsonLdScript.textContent();
    const csrJsonLd = JSON.parse(csrContent ?? 'null') as unknown;

    expect(csrJsonLd).toBeTruthy();
    expect(csrJsonLd).toEqual(ssgJsonLd);
  });

  test(should.matchCanonicalOgUrlAndJsonLdUrl, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const canonical = extractLinkHref(html, 'canonical');
    const ogUrl = extractMetaContent(html, 'property', 'og:url');
    const jsonLd = extractJsonLd(html) as Record<string, unknown>;

    expect(canonical).toBeTruthy();
    expect(canonical).toBe(ogUrl);
    expect(canonical).toBe(jsonLd?.url);
  });
});
