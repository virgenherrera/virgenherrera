import { expect } from '@playwright/test';
import { PUBLIC_PROFILE } from '@vh/profile/data';
import { AVATAR_URL, SITE_URL } from '../../constants/seo.constants.js';
import { test } from '../../fixtures/resume.fixture.js';
import type { ResumePage } from '../../pages/resume.page.js';
import { ClientHydrationExpectations as should } from './csr.expectations.js';

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
  email?: string;
  telephone?: string;
}

test.describe('IT: CSR Resume page — structured data SEO (live DOM)', () => {
  test.beforeEach(async ({ resumePage }) => {
    await resumePage.goto();
    await resumePage.waitForHydration();
  });

  async function getJsonLd(resumePage: ResumePage): Promise<PersonJsonLd> {
    const content = await resumePage.jsonLdScript.textContent();

    return JSON.parse(content ?? '{}') as PersonJsonLd;
  }

  test(should.haveJsonLdScript, async ({ resumePage }) => {
    await expect(resumePage.jsonLdScript).toHaveCount(1);
  });

  test(should.havePersonType, async ({ resumePage }) => {
    const jsonLd = await getJsonLd(resumePage);

    expect(jsonLd['@type']).toBe('Person');
  });

  test(should.haveJsonLdName, async ({ resumePage }) => {
    const jsonLd = await getJsonLd(resumePage);

    expect(jsonLd.name).toBe(PUBLIC_PROFILE.name);
  });

  test(should.haveJsonLdUrl, async ({ resumePage }) => {
    const jsonLd = await getJsonLd(resumePage);

    expect(jsonLd.url).toBe(SITE_URL);
  });

  test(should.haveJsonLdImage, async ({ resumePage }) => {
    const jsonLd = await getJsonLd(resumePage);

    expect(jsonLd.image).toBe(AVATAR_URL);
  });

  test(should.haveJsonLdJobTitle, async ({ resumePage }) => {
    const jsonLd = await getJsonLd(resumePage);

    expect(jsonLd.jobTitle).toBe(PUBLIC_PROFILE.headline);
  });

  test(should.haveJsonLdWorksFor, async ({ resumePage }) => {
    test.skip(
      PUBLIC_PROFILE.experience.length === 0,
      'no experience entries in profile',
    );

    const jsonLd = await getJsonLd(resumePage);

    expect(jsonLd.worksFor?.name).toBe(PUBLIC_PROFILE.experience[0].company);
  });

  test(should.haveJsonLdAlumniOf, async ({ resumePage }) => {
    test.skip(
      PUBLIC_PROFILE.education.length === 0,
      'no education entries in profile',
    );

    const jsonLd = await getJsonLd(resumePage);

    expect(Array.isArray(jsonLd.alumniOf)).toBe(true);
    expect(jsonLd.alumniOf).toHaveLength(PUBLIC_PROFILE.education.length);
  });

  test(should.haveJsonLdKnowsAbout, async ({ resumePage }) => {
    test.skip(PUBLIC_PROFILE.skills.length === 0, 'no skills in profile');

    const jsonLd = await getJsonLd(resumePage);

    expect(Array.isArray(jsonLd.knowsAbout)).toBe(true);
    expect(jsonLd.knowsAbout).toHaveLength(
      PUBLIC_PROFILE.skills.flatMap((category) => category.skills).length,
    );
  });

  test(should.haveJsonLdHasCredentialGuarded, async ({ resumePage }) => {
    const jsonLd = await getJsonLd(resumePage);

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

    const jsonLd = await getJsonLd(resumePage);

    expect(Array.isArray(jsonLd.knowsLanguage)).toBe(true);
    expect(jsonLd.knowsLanguage).toHaveLength(PUBLIC_PROFILE.languages.length);
  });

  test(should.notLeakPiiInJsonLd, async ({ resumePage }) => {
    const jsonLd = await getJsonLd(resumePage);

    expect(jsonLd.email).toBeUndefined();
    expect(jsonLd.telephone).toBeUndefined();
  });
});
