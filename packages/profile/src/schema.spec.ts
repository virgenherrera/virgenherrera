/**
 * NOTE: `data.spec.ts` already covers `projectSchema` and `linkSchema`.
 * This spec focuses on schemas NOT tested there: experienceSchema,
 * engagementSchema, educationSchema, certificationSchema,
 * skillCategorySchema, languageSchema, publicProfileSchema,
 * secretsPayloadSchema, profileSnapshotSchema, serializedGraphSchema,
 * and the yearMonth / parseDescription transforms.
 */
import {
  experienceSchema,
  engagementSchema,
  educationSchema,
  certificationSchema,
  skillCategorySchema,
  languageSchema,
  publicProfileSchema,
  secretsPayloadSchema,
  profileSnapshotSchema,
  serializedGraphSchema,
  profileSchema,
} from './schema';

// ── helpers ─────────────────────────────────────────────────────────────────

function validExperience() {
  return {
    company: 'Acme Corp',
    role: 'Senior Engineer',
    startDate: '2020-01',
    endDate: '2023-06',
    description: ['Built scalable services.', '*Implemented REST APIs.'],
    technologies: ['TypeScript', 'Node.js'],
  };
}

function validEngagement() {
  return {
    title: 'AI Platform',
    domain: 'Enterprise Ops',
    client: 'Acme Internal',
    skills: ['nestjs'],
    description: ['Built a platform.', '*Integrated APIs.'],
    technologies: ['NestJS', 'LangChain'],
  };
}

function validLink() {
  return {
    label: 'GitHub',
    url: 'https://github.com/example',
    icon: 'gitHub',
  };
}

function validEducation() {
  return {
    degree: 'B.S. in Computer Science',
    degreeTranslation: 'Licenciatura en Ciencias Computacionales',
    institution: 'MIT',
    location: 'Cambridge, MA',
    startDate: '2014-08',
    graduationDate: '2018-05',
  };
}

function validCertification() {
  return {
    name: 'AWS Solutions Architect',
    issuer: 'Amazon',
    date: '2022-03',
  };
}

function validProfile() {
  return {
    name: 'Jane Doe',
    headline: 'Senior Engineer',
    summary: 'A senior engineer with experience.',
    location: 'Mexico',
    email: 'jane@example.com',
    phone: '+52 555 000 0000',
    links: [validLink()],
    experience: [validExperience()],
    education: [validEducation()],
    certifications: [validCertification()],
    projects: [
      {
        name: 'side-project',
        description: 'A side project.',
        url: 'https://example.com/project',
      },
    ],
    skills: [{ category: 'Languages', skills: ['TypeScript'] }],
    languages: [{ language: 'English', proficiency: 'C1' }],
  };
}

// ── tests ───────────────────────────────────────────────────────────────────

describe('UT: schema', () => {
  class should {
    static readonly parseValidExperience = 'parse a valid experience entry';
    static readonly transformDescriptionToBlocks =
      'transform description strings into DescriptionBlock[]';
    static readonly rejectInvalidStartDate =
      'reject an experience with an invalid startDate format';
    static readonly acceptOptionalEndDate =
      'accept an experience without endDate';
    static readonly rejectEmptyCompany =
      'reject an experience with empty company';
    static readonly rejectEmptyDescription =
      'reject an experience with empty description';
    static readonly parseValidEngagement = 'parse a valid engagement entry';
    static readonly transformEngagementDescription =
      'transform engagement description into DescriptionBlock[]';
    static readonly defaultEngagementSkillsToEmpty =
      'default engagement skills to empty array';
    static readonly defaultEngagementTechnologiesToEmpty =
      'default engagement technologies to empty array';
    static readonly parseValidEducation = 'parse a valid education entry';
    static readonly acceptOptionalHonors =
      'accept education with optional honors';
    static readonly rejectInvalidGraduationDate =
      'reject education with invalid graduationDate';
    static readonly parseValidCertification =
      'parse a valid certification entry';
    static readonly acceptCertificationWithUrl =
      'accept a certification with an optional URL';
    static readonly rejectCertificationWithInvalidUrl =
      'reject a certification with an invalid URL';
    static readonly parseValidSkillCategory = 'parse a valid skill category';
    static readonly rejectEmptySkillsArray =
      'reject a skill category with empty skills array';
    static readonly parseValidLanguage = 'parse a valid language entry';
    static readonly rejectMissingProficiency =
      'reject a language entry missing proficiency';
    static readonly omitPiiFromPublicProfile =
      'omit email and phone from public profile schema';
    static readonly requirePiiInSecretsPayload =
      'require both email and phone in secrets payload schema';
    static readonly rejectSecretsWithMissingEmail =
      'reject secrets payload with missing email';
    static readonly parseValidProfileSnapshot =
      'parse a valid profile snapshot with parsed description blocks';
    static readonly rejectSnapshotWithRawDescriptionStrings =
      'reject a snapshot with raw description strings instead of blocks';
    static readonly parseValidSerializedGraph =
      'parse a valid serialized graph';
    static readonly rejectYearMonthBadFormat =
      'reject dates not matching YYYY-MM format';
    static readonly acceptSnapshotWithGraph =
      'accept a snapshot with an optional graph field';
    static readonly acceptExperienceWithEngagements =
      'accept an experience with engagements';
    static readonly parseFullProfile =
      'parse a complete profile with all fields';
  }

  describe('experienceSchema @smoke', () => {
    it(`${should.parseValidExperience}`, () => {
      const result = experienceSchema.parse(validExperience());

      expect(result.company).toBe('Acme Corp');
      expect(result.role).toBe('Senior Engineer');
      expect(result.startDate).toEqual({ year: 2020, month: 1 });
      expect(result.endDate).toEqual({ year: 2023, month: 6 });
      expect(result.technologies).toEqual(['TypeScript', 'Node.js']);
    });

    it(`${should.transformDescriptionToBlocks}`, () => {
      const result = experienceSchema.parse(validExperience());

      expect(result.description).toEqual([
        { type: 'paragraph', lines: ['Built scalable services.'] },
        { type: 'bullets', lines: ['Implemented REST APIs.'] },
      ]);
    });

    it(`${should.acceptOptionalEndDate}`, () => {
      const input = { ...validExperience(), endDate: undefined };

      const result = experienceSchema.parse(input);

      expect(result.endDate).toBeUndefined();
    });

    it(`${should.acceptExperienceWithEngagements}`, () => {
      const input = {
        ...validExperience(),
        engagements: [validEngagement()],
      };

      const result = experienceSchema.parse(input);

      expect(result.engagements).toHaveLength(1);
      expect(result.engagements?.[0].title).toBe('AI Platform');
    });
  });

  describe('experienceSchema (rejection cases) @critical', () => {
    it(`${should.rejectInvalidStartDate}`, () => {
      const input = { ...validExperience(), startDate: '2020-13' };

      expect(() => experienceSchema.parse(input)).toThrow();
    });

    it(`${should.rejectEmptyCompany}`, () => {
      const input = { ...validExperience(), company: '' };

      expect(() => experienceSchema.parse(input)).toThrow();
    });

    it(`${should.rejectEmptyDescription}`, () => {
      const input = { ...validExperience(), description: [] };

      expect(() => experienceSchema.parse(input)).toThrow();
    });

    it(`${should.rejectYearMonthBadFormat}`, () => {
      expect(() =>
        experienceSchema.parse({
          ...validExperience(),
          startDate: '2020/01',
        }),
      ).toThrow();

      expect(() =>
        experienceSchema.parse({
          ...validExperience(),
          startDate: '2020-1',
        }),
      ).toThrow();

      expect(() =>
        experienceSchema.parse({
          ...validExperience(),
          startDate: '20-01',
        }),
      ).toThrow();

      expect(() =>
        experienceSchema.parse({
          ...validExperience(),
          startDate: '2020-00',
        }),
      ).toThrow();
    });
  });

  describe('engagementSchema @smoke', () => {
    it(`${should.parseValidEngagement}`, () => {
      const result = engagementSchema.parse(validEngagement());

      expect(result.title).toBe('AI Platform');
      expect(result.domain).toBe('Enterprise Ops');
      expect(result.client).toBe('Acme Internal');
    });

    it(`${should.transformEngagementDescription}`, () => {
      const result = engagementSchema.parse(validEngagement());

      expect(result.description).toEqual([
        { type: 'paragraph', lines: ['Built a platform.'] },
        { type: 'bullets', lines: ['Integrated APIs.'] },
      ]);
    });

    it(`${should.defaultEngagementSkillsToEmpty}`, () => {
      const input = { ...validEngagement() };
      delete (input as Record<string, unknown>).skills;

      const result = engagementSchema.parse(input);

      expect(result.skills).toEqual([]);
    });

    it(`${should.defaultEngagementTechnologiesToEmpty}`, () => {
      const input = { ...validEngagement() };
      delete (input as Record<string, unknown>).technologies;

      const result = engagementSchema.parse(input);

      expect(result.technologies).toEqual([]);
    });
  });

  describe('educationSchema @smoke', () => {
    it(`${should.parseValidEducation}`, () => {
      const result = educationSchema.parse(validEducation());

      expect(result.degree).toBe('B.S. in Computer Science');
      expect(result.institution).toBe('MIT');
      expect(result.location).toBe('Cambridge, MA');
      expect(result.startDate).toEqual({ year: 2014, month: 8 });
      expect(result.graduationDate).toEqual({ year: 2018, month: 5 });
    });

    it(`${should.acceptOptionalHonors}`, () => {
      const withHonors = educationSchema.parse({
        ...validEducation(),
        honors: 'Summa Cum Laude',
      });
      const withoutHonors = educationSchema.parse(validEducation());

      expect(withHonors.honors).toBe('Summa Cum Laude');
      expect(withoutHonors.honors).toBeUndefined();
    });

    it(`${should.rejectInvalidGraduationDate}`, () => {
      const input = { ...validEducation(), graduationDate: 'May-2018' };

      expect(() => educationSchema.parse(input)).toThrow();
    });
  });

  describe('certificationSchema @critical', () => {
    it(`${should.parseValidCertification}`, () => {
      const result = certificationSchema.parse(validCertification());

      expect(result.name).toBe('AWS Solutions Architect');
      expect(result.issuer).toBe('Amazon');
      expect(result.date).toEqual({ year: 2022, month: 3 });
    });

    it(`${should.acceptCertificationWithUrl}`, () => {
      const result = certificationSchema.parse({
        ...validCertification(),
        url: 'https://aws.amazon.com/cert/12345',
      });

      expect(result.url).toBe('https://aws.amazon.com/cert/12345');
    });

    it(`${should.rejectCertificationWithInvalidUrl}`, () => {
      expect(() =>
        certificationSchema.parse({
          ...validCertification(),
          url: 'not-a-url',
        }),
      ).toThrow();
    });
  });

  describe('skillCategorySchema @smoke', () => {
    it(`${should.parseValidSkillCategory}`, () => {
      const result = skillCategorySchema.parse({
        category: 'Languages',
        skills: ['TypeScript', 'JavaScript'],
      });

      expect(result.category).toBe('Languages');
      expect(result.skills).toEqual(['TypeScript', 'JavaScript']);
    });

    it(`${should.rejectEmptySkillsArray}`, () => {
      expect(() =>
        skillCategorySchema.parse({ category: 'Languages', skills: [] }),
      ).toThrow();
    });
  });

  describe('languageSchema @smoke', () => {
    it(`${should.parseValidLanguage}`, () => {
      const result = languageSchema.parse({
        language: 'Spanish',
        proficiency: 'Native',
      });

      expect(result.language).toBe('Spanish');
      expect(result.proficiency).toBe('Native');
    });

    it(`${should.rejectMissingProficiency}`, () => {
      expect(() => languageSchema.parse({ language: 'Spanish' })).toThrow();
    });
  });

  describe('derived schemas @critical', () => {
    it(`${should.omitPiiFromPublicProfile}`, () => {
      const profile = validProfile();
      const result = publicProfileSchema.parse(profile);

      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('phone');
      expect(result.name).toBe('Jane Doe');
    });

    it(`${should.requirePiiInSecretsPayload}`, () => {
      const result = secretsPayloadSchema.parse({
        email: 'jane@example.com',
        phone: '+52 555 000 0000',
      });

      expect(result.email).toBe('jane@example.com');
      expect(result.phone).toBe('+52 555 000 0000');
    });

    it(`${should.rejectSecretsWithMissingEmail}`, () => {
      expect(() =>
        secretsPayloadSchema.parse({ phone: '+52 555 000 0000' }),
      ).toThrow();
    });
  });

  describe('profileSnapshotSchema @critical', () => {
    it(`${should.parseValidProfileSnapshot}`, () => {
      const snapshot = {
        name: 'Jane Doe',
        headline: 'Senior Engineer',
        summary: 'A senior engineer.',
        location: 'Mexico',
        links: [validLink()],
        experience: [
          {
            company: 'Acme Corp',
            role: 'Senior Engineer',
            startDate: { year: 2020, month: 1 },
            endDate: { year: 2023, month: 6 },
            description: [
              { type: 'paragraph', lines: ['Built services.'] },
              { type: 'bullets', lines: ['REST APIs.'] },
            ],
            technologies: ['TypeScript'],
          },
        ],
        education: [
          {
            ...validEducation(),
            startDate: { year: 2014, month: 8 },
            graduationDate: { year: 2018, month: 5 },
          },
        ],
        certifications: [
          { ...validCertification(), date: { year: 2022, month: 3 } },
        ],
        projects: [
          {
            name: 'side-project',
            description: 'A side project.',
            url: 'https://example.com/project',
          },
        ],
        skills: [{ category: 'Languages', skills: ['TypeScript'] }],
        languages: [{ language: 'English', proficiency: 'C1' }],
      };

      const result = profileSnapshotSchema.parse(snapshot);

      expect(result.name).toBe('Jane Doe');
      expect(result.experience[0].description[0]).toEqual({
        type: 'paragraph',
        lines: ['Built services.'],
      });
    });

    it(`${should.rejectSnapshotWithRawDescriptionStrings}`, () => {
      const badSnapshot = {
        name: 'Jane Doe',
        headline: 'Senior Engineer',
        summary: 'A senior engineer.',
        location: 'Mexico',
        links: [validLink()],
        experience: [
          {
            company: 'Acme Corp',
            role: 'Senior Engineer',
            startDate: { year: 2020, month: 1 },
            description: ['Raw string instead of block'],
            technologies: ['TypeScript'],
          },
        ],
        education: [],
        certifications: [],
        projects: [],
        skills: [{ category: 'Languages', skills: ['TypeScript'] }],
        languages: [{ language: 'English', proficiency: 'C1' }],
      };

      expect(() => profileSnapshotSchema.parse(badSnapshot)).toThrow();
    });

    it(`${should.acceptSnapshotWithGraph}`, () => {
      const snapshot = {
        name: 'Jane Doe',
        headline: 'Senior Engineer',
        summary: 'A senior engineer.',
        location: 'Mexico',
        links: [validLink()],
        experience: [
          {
            company: 'Acme Corp',
            role: 'Senior Engineer',
            startDate: { year: 2020, month: 1 },
            description: [{ type: 'paragraph', lines: ['Built services.'] }],
            technologies: ['TypeScript'],
          },
        ],
        education: [],
        certifications: [],
        projects: [],
        skills: [{ category: 'Languages', skills: ['TypeScript'] }],
        languages: [{ language: 'English', proficiency: 'C1' }],
        graph: {
          bySkill: {
            typescript: {
              experiences: ['Acme Corp'],
              projects: [],
              years: 3,
            },
          },
          byExperience: { 'Acme Corp': ['typescript'] },
          byProject: {},
        },
      };

      const result = profileSnapshotSchema.parse(snapshot);

      expect(result.graph).toBeDefined();
      expect(result.graph?.bySkill.typescript.years).toBe(3);
    });
  });

  describe('serializedGraphSchema @smoke', () => {
    it(`${should.parseValidSerializedGraph}`, () => {
      const graph = {
        bySkill: {
          typescript: {
            experiences: ['Acme Corp'],
            projects: ['side-project'],
            years: 5,
          },
        },
        byExperience: { 'Acme Corp': ['typescript'] },
        byProject: { 'side-project': ['typescript'] },
      };

      const result = serializedGraphSchema.parse(graph);

      expect(result.bySkill.typescript.years).toBe(5);
      expect(result.byExperience['Acme Corp']).toEqual(['typescript']);
      expect(result.byProject['side-project']).toEqual(['typescript']);
      expect(result.displayNames).toBeUndefined();
    });

    it('parses an optional displayNames map when present', () => {
      const graph = {
        bySkill: {},
        byExperience: {},
        byProject: {},
        displayNames: { 'dotnet-8': '.NET 8', csharp: 'C#' },
      };

      const result = serializedGraphSchema.parse(graph);

      expect(result.displayNames).toEqual({
        'dotnet-8': '.NET 8',
        csharp: 'C#',
      });
    });
  });

  describe('profileSchema (full profile) @smoke', () => {
    it(`${should.parseFullProfile}`, () => {
      const result = profileSchema.parse(validProfile());

      expect(result.name).toBe('Jane Doe');
      expect(result.experience[0].description).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'paragraph' }),
        ]),
      );
    });
  });
});
