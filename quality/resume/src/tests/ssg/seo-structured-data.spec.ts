import { expect } from '@playwright/test';
import { PUBLIC_PROFILE } from '@vh/profile/data';
import { AVATAR_URL, SITE_URL } from '../../constants/seo.constants.js';
import { test } from '../../fixtures/resume.fixture.js';
import { extractJsonLd } from '../../helpers/head-meta.helper.js';
import { SsgPreRenderExpectations as should } from './ssg.expectations.js';

interface PersonJsonLd {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  image: string;
  jobTitle: string;
  description: string;
  worksFor?: { '@type': string; name: string };
  alumniOf?: { '@type': string; name: string }[];
  knowsAbout?: string[];
  hasCredential?: { '@type': string; name: string }[];
  knowsLanguage?: string[];
  sameAs?: string[];
  email?: string;
  telephone?: string;
}

test.describe('IT: SSG Resume page — structured data SEO (raw response)', () => {
  test(should.haveJsonLdScript, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html);

    expect(jsonLd).toBeTruthy();

    const matches =
      html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi) ??
      [];
    expect(matches).toHaveLength(1);
  });

  test(should.havePersonType, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    expect(jsonLd['@type']).toBe('Person');
  });

  test(should.haveJsonLdName, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    expect(jsonLd.name).toBe(PUBLIC_PROFILE.name);
  });

  test(should.haveJsonLdUrl, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    expect(jsonLd.url).toBe(SITE_URL);
  });

  test(should.haveJsonLdImage, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    expect(jsonLd.image).toBe(AVATAR_URL);
  });

  test(should.haveJsonLdJobTitle, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    expect(jsonLd.jobTitle).toBe(PUBLIC_PROFILE.experience[0].role);
  });

  test(should.haveJsonLdWorksFor, async ({ resumePage }) => {
    test.skip(
      PUBLIC_PROFILE.experience.length === 0,
      'no experience entries in profile',
    );

    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    expect(jsonLd.worksFor?.name).toBe(PUBLIC_PROFILE.experience[0].company);
  });

  test(should.haveJsonLdAlumniOf, async ({ resumePage }) => {
    test.skip(
      PUBLIC_PROFILE.education.length === 0,
      'no education entries in profile',
    );

    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    expect(Array.isArray(jsonLd.alumniOf)).toBe(true);
    expect(jsonLd.alumniOf).toHaveLength(PUBLIC_PROFILE.education.length);
  });

  test(should.haveJsonLdKnowsAbout, async ({ resumePage }) => {
    test.skip(PUBLIC_PROFILE.skills.length === 0, 'no skills in profile');

    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    expect(Array.isArray(jsonLd.knowsAbout)).toBe(true);
    expect(jsonLd.knowsAbout).toHaveLength(
      PUBLIC_PROFILE.skills.flatMap((category) => category.skills).length,
    );
  });

  test(should.haveJsonLdHasCredentialGuarded, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    if (PUBLIC_PROFILE.certifications.length > 0) {
      expect(jsonLd.hasCredential).toHaveLength(
        PUBLIC_PROFILE.certifications.length,
      );
    } else {
      expect(jsonLd.hasCredential).toBeUndefined();
    }
  });

  test(should.haveJsonLdKnowsLanguage, async ({ resumePage }) => {
    test.skip(PUBLIC_PROFILE.languages.length === 0, 'no languages in profile');

    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    expect(Array.isArray(jsonLd.knowsLanguage)).toBe(true);
    expect(jsonLd.knowsLanguage).toHaveLength(PUBLIC_PROFILE.languages.length);
  });

  test(should.haveJsonLdSameAs, async ({ resumePage }) => {
    const publicLinks = PUBLIC_PROFILE.links
      .filter((link) => link.visibility === 'public')
      .map((link) => link.url);

    test.skip(publicLinks.length === 0, 'no public links in profile');

    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    expect(Array.isArray(jsonLd.sameAs)).toBe(true);
    expect(jsonLd.sameAs).toEqual(publicLinks);
  });

  test(should.notLeakPiiInJsonLd, async ({ resumePage }) => {
    const html = await resumePage.gotoRaw();
    const jsonLd = extractJsonLd(html) as PersonJsonLd;

    expect(jsonLd.email).toBeUndefined();
    expect(jsonLd.telephone).toBeUndefined();
  });
});
