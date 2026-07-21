import { join } from 'node:path';
import { parseContent } from './parser';

const FIXTURES_DIR = join(__dirname, '../test-fixtures');

describe('UT: parser', () => {
  class should {
    static readonly produceValidProfileData =
      'produce a valid ProfileData object';
    static readonly separateFrontmatterAndBody =
      'separate frontmatter from body content';
    static readonly resolveTechnologyDisplayNames =
      'resolve skill slugs to display names for technologies';
    static readonly allowEmptyTechnologies =
      'allow an experience with no technologies';
    static readonly groupSkillsByCategory =
      'group skills-registry entries by category';
    static readonly produceDescriptionBlocks =
      'produce DescriptionBlocks via the schema transform';
    static readonly sortExperienceByNumericPrefix =
      'sort experience files by numeric filename prefix';
    static readonly throwOnUnknownSlug =
      'throw a descriptive error when a technology slug is not in the registry';
    static readonly throwOnDuplicateSlug =
      'throw a descriptive error when the registry has a duplicate slug';
    static readonly throwOnMalformedFrontmatter =
      'throw a descriptive error when frontmatter YAML is malformed';
    static readonly throwOnMissingFile =
      'throw a descriptive error when a required content file is missing';
  }

  describe('parseContent (valid fixtures)', () => {
    const contentDir = join(FIXTURES_DIR, 'valid');

    it(`${should.produceValidProfileData}`, () => {
      const profile = parseContent(contentDir);

      expect(profile.name).toBe('Ada Lovelace');
      expect(profile.headline).toEqual(expect.any(String));
      expect(profile.summary).toEqual(expect.any(String));
      expect(profile.location).toBe('Mexico');
      expect(profile.email).toBe('ada@example.com');
      expect(profile.links.length).toBeGreaterThan(0);
      expect(profile.experience.length).toBeGreaterThan(0);
      expect(profile.education.length).toBeGreaterThan(0);
      expect(profile.certifications).toEqual([]);
      expect(profile.projects.length).toBeGreaterThan(0);
      expect(profile.skills.length).toBeGreaterThan(0);
      expect(profile.languages.length).toBeGreaterThan(0);
    });

    it(`${should.sortExperienceByNumericPrefix}`, () => {
      const profile = parseContent(contentDir);

      expect(
        profile.experience.map((experience) => experience.company),
      ).toEqual(['PwC', 'Globant', 'EPAM Systems']);
    });

    it(`${should.separateFrontmatterAndBody}`, () => {
      const profile = parseContent(contentDir);
      const pwc = profile.experience[0];

      expect(pwc.startDate).toBe('2024-08');
      expect(pwc.endDate).toBeUndefined();
      expect(pwc.description.length).toBeGreaterThan(0);
    });

    it(`${should.produceDescriptionBlocks}`, () => {
      const profile = parseContent(contentDir);
      const pwc = profile.experience[0];

      expect(pwc.description[0]).toMatchObject({ type: 'paragraph' });
      expect(pwc.description.some((block) => block.type === 'bullets')).toBe(
        true,
      );
    });

    it(`${should.resolveTechnologyDisplayNames}`, () => {
      const profile = parseContent(contentDir);
      const pwc = profile.experience[0];

      expect(pwc.technologies).toEqual(
        expect.arrayContaining([
          'TypeScript',
          'Node.js',
          'NestJS',
          'LangChain',
          'OpenAI API',
          '.NET 8',
          'Azure',
        ]),
      );
    });

    it(`${should.allowEmptyTechnologies}`, () => {
      const profile = parseContent(contentDir);
      const leadership = profile.experience.find((experience) =>
        experience.role.includes('Resources Manager'),
      );

      expect(leadership?.technologies).toEqual([]);
    });

    it(`${should.groupSkillsByCategory}`, () => {
      const profile = parseContent(contentDir);
      const languages = profile.skills.find(
        (category) => category.category === 'Languages',
      );

      expect(languages?.skills).toEqual(
        expect.arrayContaining(['TypeScript', 'JavaScript']),
      );
    });
  });

  describe('parseContent (error handling)', () => {
    it(`${should.throwOnUnknownSlug}`, () => {
      expect(() => parseContent(join(FIXTURES_DIR, 'invalid-slug'))).toThrow(
        /unknown skill slug "this-slug-does-not-exist"/,
      );
    });

    it(`${should.throwOnDuplicateSlug}`, () => {
      expect(() => parseContent(join(FIXTURES_DIR, 'duplicate-slug'))).toThrow(
        /duplicate skill slug "typescript"/,
      );
    });

    it(`${should.throwOnMalformedFrontmatter}`, () => {
      expect(() =>
        parseContent(join(FIXTURES_DIR, 'malformed-frontmatter')),
      ).toThrow(/failed to parse frontmatter in ".*meta\.md"/);
    });

    it(`${should.throwOnMissingFile}`, () => {
      expect(() => parseContent(join(FIXTURES_DIR, 'missing-meta'))).toThrow(
        /unable to read required content file ".*meta\.md"/,
      );
    });
  });
});
