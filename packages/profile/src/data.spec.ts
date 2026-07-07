import { PUBLIC_PROFILE, PRIVATE_PROFILE } from './data';
import { getProfile } from './get-profile';
import { linkSchema, projectSchema } from './schema';

describe('IT: @vh/profile', () => {
  class should {
    static readonly excludePii = 'exclude PII fields';
    static readonly beDeeplyFrozen = 'be deeply frozen';
    static readonly matchPublicShape = 'match public shape';
    static readonly matchFullShape = 'match full shape';
    static readonly rejectMutation = 'reject mutation';
    static readonly rejectNestedMutation = 'reject nested mutation';
    static readonly produceDescriptionBlocks = 'produce DescriptionBlocks';
    static readonly returnValidData = 'return valid data';
    static readonly cacheInstance = 'cache instance';
    static readonly parseValidProject = 'parse a valid project';
    static readonly rejectMissingFields =
      'reject a project with missing required fields';
    static readonly rejectInvalidUrl = 'reject a project with an invalid URL';
    static readonly defaultTechnologiesToEmptyArray =
      'default technologies to an empty array when omitted';
    static readonly includeProjectsInPublicProfile =
      'include projects in PUBLIC_PROFILE';
  }

  describe('PUBLIC_PROFILE (anti-doxxing)', () => {
    it(`${should.excludePii}`, () => {
      expect(PUBLIC_PROFILE).not.toHaveProperty('email');
      expect(PUBLIC_PROFILE).not.toHaveProperty('phone');
    });

    it(`${should.beDeeplyFrozen}`, () => {
      expect(Object.isFrozen(PUBLIC_PROFILE)).toBe(true);
      expect(Object.isFrozen(PUBLIC_PROFILE.experience)).toBe(true);
      expect(Object.isFrozen(PUBLIC_PROFILE.experience[0])).toBe(true);
      expect(Object.isFrozen(PUBLIC_PROFILE.links)).toBe(true);
    });

    it(`${should.matchPublicShape}`, () => {
      expect(PUBLIC_PROFILE).toMatchObject({
        name: expect.any(String),
        headline: expect.any(String),
        summary: expect.any(String),
        location: expect.any(String),
        links: expect.arrayContaining([
          expect.objectContaining({
            label: expect.any(String),
            url: expect.any(String),
          }),
        ]),
        experience: expect.arrayContaining([
          expect.objectContaining({
            company: expect.any(String),
            role: expect.any(String),
            startDate: expect.stringMatching(/^\d{4}-(0[1-9]|1[0-2])$/),
            description: expect.any(Array),
            technologies: expect.any(Array),
          }),
        ]),
        skills: expect.arrayContaining([
          expect.objectContaining({
            category: expect.any(String),
            skills: expect.arrayContaining([expect.any(String)]),
          }),
        ]),
        languages: expect.arrayContaining([
          expect.objectContaining({
            language: expect.any(String),
            proficiency: expect.any(String),
          }),
        ]),
      });
    });

    it(`${should.rejectMutation}`, () => {
      expect(() => {
        (PUBLIC_PROFILE as Record<string, unknown>).name = 'tampered';
      }).toThrow(TypeError);
    });

    it(`${should.rejectNestedMutation}`, () => {
      const experience = PUBLIC_PROFILE.experience as unknown[];
      const firstEntry = PUBLIC_PROFILE.experience[0] as Record<
        string,
        unknown
      >;
      const descriptionBlock = PUBLIC_PROFILE.experience[0]
        .description[0] as unknown as Record<string, unknown>;

      expect(() => {
        experience.push({});
      }).toThrow(TypeError);

      expect(() => {
        firstEntry.company = 'hacked';
      }).toThrow(TypeError);

      expect(() => {
        descriptionBlock.type = 'hacked';
      }).toThrow(TypeError);
    });
  });

  describe('PRIVATE_PROFILE', () => {
    it(`${should.beDeeplyFrozen}`, () => {
      expect(Object.isFrozen(PRIVATE_PROFILE)).toBe(true);
      expect(Object.isFrozen(PRIVATE_PROFILE.experience)).toBe(true);
    });

    it(`${should.matchFullShape}`, () => {
      expect(PRIVATE_PROFILE).toMatchObject({
        name: expect.any(String),
        headline: expect.any(String),
        links: expect.any(Array),
        experience: expect.any(Array),
        skills: expect.any(Array),
        languages: expect.any(Array),
      });
    });

    it(`${should.rejectMutation}`, () => {
      expect(() => {
        (PRIVATE_PROFILE as Record<string, unknown>).name = 'tampered';
      }).toThrow(TypeError);
    });
  });

  describe('description transform', () => {
    it(`${should.produceDescriptionBlocks}`, () => {
      for (const experience of PUBLIC_PROFILE.experience) {
        for (const block of experience.description) {
          expect(block).toMatchObject({
            type: expect.stringMatching(/^(paragraph|bullets)$/),
            lines: expect.arrayContaining([expect.any(String)]),
          });
        }
      }
    });
  });

  describe('projectSchema', () => {
    it(`${should.parseValidProject}`, () => {
      const result = projectSchema.parse({
        name: 'my-lib',
        description: 'A utility library',
        url: 'https://github.com/virgenherrera/my-lib',
        technologies: ['TypeScript', 'Node.js'],
      });

      expect(result.name).toBe('my-lib');
      expect(result.description).toBe('A utility library');
      expect(result.url).toBe('https://github.com/virgenherrera/my-lib');
      expect(result.technologies).toEqual(['TypeScript', 'Node.js']);
    });

    it(`${should.defaultTechnologiesToEmptyArray}`, () => {
      const result = projectSchema.parse({
        name: 'my-lib',
        description: 'A utility library',
        url: 'https://github.com/virgenherrera/my-lib',
      });

      expect(result.technologies).toEqual([]);
    });

    it(`${should.rejectMissingFields}`, () => {
      expect(() =>
        projectSchema.parse({
          name: 'my-lib',
          url: 'https://github.com/virgenherrera/my-lib',
        }),
      ).toThrow();
    });

    it(`${should.rejectInvalidUrl}`, () => {
      expect(() =>
        projectSchema.parse({
          name: 'my-lib',
          description: 'A utility library',
          url: 'not-a-valid-url',
        }),
      ).toThrow();
    });
  });

  describe('projects in profile data', () => {
    it(`${should.includeProjectsInPublicProfile}`, () => {
      expect(PUBLIC_PROFILE).toHaveProperty('projects');
      expect(Array.isArray(PUBLIC_PROFILE.projects)).toBe(true);

      for (const project of PUBLIC_PROFILE.projects) {
        expect(project).toMatchObject({
          name: expect.any(String),
          description: expect.any(String),
          url: expect.any(String),
          technologies: expect.any(Array),
        });
      }
    });
  });

  describe('linkSchema', () => {
    const baseLink = {
      label: 'GitHub',
      url: 'https://github.com/virgenherrera',
      icon: 'gitHub',
    };

    it('parses a link with explicit type and cta fields', () => {
      const result = linkSchema.parse({
        ...baseLink,
        type: 'social',
        cta: false,
      });

      expect(result.type).toBe('social');
      expect(result.cta).toBe(false);
    });

    it('parses a link without type or cta (backward compatibility via defaults)', () => {
      const result = linkSchema.parse(baseLink);

      expect(result.type).toBe('social');
      expect(result.cta).toBe(false);
    });

    it('defaults cta to false when omitted', () => {
      const result = linkSchema.parse({ ...baseLink, type: 'professional' });

      expect(result.cta).toBe(false);
    });

    it('rejects an invalid type value', () => {
      expect(() =>
        linkSchema.parse({ ...baseLink, type: 'invalid-type' }),
      ).toThrow();
    });

    it('parses all valid type values', () => {
      const types = [
        'social',
        'professional',
        'job-board',
        'portfolio',
      ] as const;

      for (const type of types) {
        expect(() => linkSchema.parse({ ...baseLink, type })).not.toThrow();
      }
    });

    it('parses a link with cta set to true', () => {
      const result = linkSchema.parse({
        ...baseLink,
        type: 'professional',
        cta: true,
      });

      expect(result.cta).toBe(true);
    });
  });

  describe('getProfile (server)', () => {
    it(`${should.returnValidData}`, () => {
      const profile = getProfile();

      expect(profile.name).toBeDefined();
      expect(profile.experience.length).toBeGreaterThan(0);
    });

    it(`${should.cacheInstance}`, () => {
      expect(getProfile()).toBe(getProfile());
    });
  });
});
