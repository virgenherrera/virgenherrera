import { vol } from 'memfs';
import { parseContent } from './parser';

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
jest.mock('node:fs', () => require('memfs').fs);
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */

const ERROR_META = `---
name: Ada Lovelace
headline: Senior Fullstack Engineer
summary: Senior engineer with a decade of experience building scalable systems.
location: Mexico
---`;

const ERROR_SKILLS = `skills:
  - slug: typescript
    display: TypeScript
    category: Languages`;

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
    static readonly throwOnEngagementsNotArray =
      'throw a descriptive error when "engagements" is not an array';
    static readonly throwOnEmptyEngagementDescription =
      'throw a descriptive error when an engagement has an empty description';
    static readonly produceEngagementData =
      'produce EngagementData[] with resolved skill display names';
    static readonly produceEngagementDescriptionBlocks =
      'produce DescriptionBlocks for engagement description via the schema transform';
    static readonly allowExperienceWithoutEngagements =
      'allow an experience with no engagements (backward compat)';
  }

  afterEach(() => vol.reset());

  describe('parseContent (valid fixtures) @smoke', () => {
    beforeEach(() => {
      vol.fromJSON({
        '/content/meta.md': `---
name: Ada Lovelace
headline: Senior Fullstack Engineer | TypeScript | AI Integrations
summary: Senior engineer with a decade of experience building scalable web and backend systems.
location: Mexico
email: ada@example.com
phone: '+52 555 000 0000'
---`,
        '/content/skills-registry.yaml': `skills:
  - slug: typescript
    display: TypeScript
    category: Languages
  - slug: javascript
    display: JavaScript
    category: Languages
  - slug: nodejs
    display: Node.js
    category: Backend Frameworks
  - slug: nestjs
    display: NestJS
    category: Backend Frameworks
  - slug: langchain
    display: LangChain
    category: AI Engineering
  - slug: openai-api
    display: OpenAI API
    category: AI Engineering
  - slug: dotnet-8
    display: .NET 8
    category: Backend Frameworks
  - slug: azure
    display: Azure
    category: Cloud & DevOps
  - slug: azure-functions
    display: Azure Functions
    category: Cloud & DevOps
  - slug: ci-cd
    display: CI/CD
    category: Cloud & DevOps
  - slug: graphql
    display: GraphQL
    category: APIs & Protocols
  - slug: angular
    display: Angular
    category: Frontend Frameworks
  - slug: zod
    display: Zod
    category: Architecture & Patterns
  - slug: playwright
    display: Playwright
    category: Testing & QA`,
        '/content/experience/01-pwc.md': `---
company: PwC
role: Senior Software Developer
startDate: '2024-08'
endDate: null
skills:
  - typescript
  - nodejs
  - nestjs
  - langchain
  - openai-api
  - dotnet-8
  - azure
  - azure-functions
  - ci-cd
engagements:
  - title: Enterprise AI Platform
    domain: Enterprise Operations
    client: Internal HR Systems
    skills:
      - nestjs
      - langchain
      - openai-api
    description:
      - 'Built a conversational platform automating manual HR workflows.'
      - '*Designed an AI agent orchestration layer with NestJS and LangChain.'
      - '*Integrated the OpenAI API for natural language understanding.'
  - title: Context Engineering Service
    domain: Platform Infrastructure
    skills:
      - dotnet-8
      - azure
    description:
      - 'Built a context engineering service supporting the RAG pipeline.'
---

Contributed to AI-powered integration services unifying enterprise systems into a conversational platform.
*Developed AI-driven microservices using TypeScript, Node.js, NestJS, and LangChain.
*Implemented a .NET 8 microservice on Azure to support data-intensive processing and conversation context management.`,
        '/content/experience/02-globant.md': `---
company: Globant
role: Senior Fullstack Node.js Developer
startDate: '2021-04'
endDate: '2024-08'
skills:
  - nodejs
  - typescript
  - nestjs
  - graphql
  - angular
---

Joined as Senior Fullstack Node.js Developer and was promoted to Lead Backend Developer, leading a team of 4-6 engineers.
*Designed and maintained backend services and SDKs using Node.js, TypeScript, and NestJS.
*Implemented GraphQL APIs within a NestJS architecture, improving API flexibility and developer experience.`,
        '/content/experience/03-no-tech.md': `---
company: EPAM Systems
role: Resources Manager (Leadership Development)
startDate: '2019-05'
endDate: '2020-02'
skills: []
---

Additional leadership development role alongside primary engineering responsibilities.
*Acted as point of contact for engineers, supporting career growth and structured feedback.`,
        '/content/education/01-ual.md': `---
degree: Licenciatura en Informática Administrativa
degreeTranslation: B.S. in Management Information Systems
institution: Universidad América Latina
location: Guadalajara, Mexico
startDate: '2018-01'
graduationDate: '2021-05'
honors: Graduated with Honors (GPA-based)
---`,
        '/content/projects.yaml': `projects:
  - name: virgenherrera
    description: "GitHub special profile repo: Angular resume app (SSR/SSG), NestJS-powered README generator, shared design system."
    url: https://github.com/virgenherrera/virgenherrera
    technologies:
      - typescript
      - angular
      - nestjs
      - playwright
      - zod
  - name: nest-base
    description: Starter template for building NestJS 11 HTTP services with typed environment configuration.
    url: https://github.com/virgenherrera/nest-base
    technologies:
      - typescript
      - nodejs
      - nestjs
      - zod`,
        '/content/links.yaml': `links:
  - label: GitHub
    url: https://github.com/virgenherrera
    icon: gitHub
    type: social
    cta: false
  - label: LinkedIn
    url: https://www.linkedin.com/in/virgenherrera
    icon: linkedIn
    type: professional
    cta: true`,
        '/content/languages.yaml': `languages:
  - language: Spanish
    proficiency: Native
  - language: English
    proficiency: C1`,
      });
    });

    it(`${should.produceValidProfileData}`, () => {
      const profile = parseContent('/content');

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
      const profile = parseContent('/content');

      expect(
        profile.experience.map((experience) => experience.company),
      ).toEqual(['PwC', 'Globant', 'EPAM Systems']);
    });

    it(`${should.separateFrontmatterAndBody}`, () => {
      const profile = parseContent('/content');
      const pwc = profile.experience[0];

      expect(pwc.startDate).toEqual({ year: 2024, month: 8 });
      expect(pwc.endDate).toBeUndefined();
      expect(pwc.description.length).toBeGreaterThan(0);
    });

    it(`${should.produceDescriptionBlocks}`, () => {
      const profile = parseContent('/content');
      const pwc = profile.experience[0];

      expect(pwc.description[0]).toMatchObject({ type: 'paragraph' });
      expect(pwc.description.some((block) => block.type === 'bullets')).toBe(
        true,
      );
    });

    it(`${should.resolveTechnologyDisplayNames}`, () => {
      const profile = parseContent('/content');
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
      const profile = parseContent('/content');
      const leadership = profile.experience.find((experience) =>
        experience.role.includes('Resources Manager'),
      );

      expect(leadership?.technologies).toEqual([]);
    });

    it(`${should.groupSkillsByCategory}`, () => {
      const profile = parseContent('/content');
      const languages = profile.skills.find(
        (category) => category.category === 'Languages',
      );

      expect(languages?.skills).toEqual(
        expect.arrayContaining(['TypeScript', 'JavaScript']),
      );
    });

    it(`${should.produceEngagementData}`, () => {
      const profile = parseContent('/content');
      const pwc = profile.experience[0];

      expect(pwc.engagements).toHaveLength(2);

      const first = pwc.engagements?.[0];

      expect(first?.title).toBe('Enterprise AI Platform');
      expect(first?.domain).toBe('Enterprise Operations');
      expect(first?.client).toBe('Internal HR Systems');
      expect(first?.technologies).toEqual(
        expect.arrayContaining(['NestJS', 'LangChain', 'OpenAI API']),
      );
    });

    it(`${should.produceEngagementDescriptionBlocks}`, () => {
      const profile = parseContent('/content');
      const pwc = profile.experience[0];
      const first = pwc.engagements?.[0];

      expect(first?.description[0]).toMatchObject({ type: 'paragraph' });
      expect(first?.description.some((block) => block.type === 'bullets')).toBe(
        true,
      );
    });

    it(`${should.allowExperienceWithoutEngagements}`, () => {
      const profile = parseContent('/content');
      const leadership = profile.experience.find((experience) =>
        experience.role.includes('Resources Manager'),
      );

      expect(leadership?.engagements).toBeUndefined();
    });
  });

  describe('parseContent (error handling)', () => {
    it(`${should.throwOnUnknownSlug}`, () => {
      vol.fromJSON({
        '/err/meta.md': ERROR_META,
        '/err/skills-registry.yaml': ERROR_SKILLS,
        '/err/experience/01-bad.md': `---
company: PwC
role: Senior Software Developer
startDate: '2024-08'
skills:
  - typescript
  - this-slug-does-not-exist
---

A description paragraph that has enough content to parse correctly.`,
      });

      expect(() => parseContent('/err')).toThrow(
        /unknown skill slug "this-slug-does-not-exist"/,
      );
    });

    it(`${should.throwOnDuplicateSlug}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': `skills:
  - slug: typescript
    display: TypeScript
    category: Languages
  - slug: typescript
    display: TypeScript (duplicate)
    category: Languages`,
      });

      expect(() => parseContent('/err')).toThrow(
        /duplicate skill slug "typescript"/,
      );
    });

    it(`${should.throwOnMalformedFrontmatter}`, () => {
      vol.fromJSON({
        '/err/meta.md': `---
name: Ada Lovelace
headline: [unterminated flow sequence
summary: Senior engineer.
location: Mexico
---`,
        '/err/skills-registry.yaml': ERROR_SKILLS,
      });

      expect(() => parseContent('/err')).toThrow(
        /failed to parse frontmatter in ".*meta\.md"/,
      );
    });

    it(`${should.throwOnMissingFile}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': ERROR_SKILLS,
      });

      expect(() => parseContent('/err')).toThrow(
        /unable to read required content file ".*meta\.md"/,
      );
    });

    it(`${should.throwOnEngagementsNotArray}`, () => {
      vol.fromJSON({
        '/err/meta.md': ERROR_META,
        '/err/skills-registry.yaml': ERROR_SKILLS,
        '/err/experience/01-bad.md': `---
company: PwC
role: Senior Software Developer
startDate: '2024-08'
skills:
  - typescript
engagements: not-an-array
---

A description paragraph that has enough content to parse correctly.`,
      });

      expect(() => parseContent('/err')).toThrow(
        /field "engagements" must be an array/,
      );
    });

    it(`${should.throwOnEmptyEngagementDescription}`, () => {
      vol.fromJSON({
        '/err/meta.md': ERROR_META,
        '/err/skills-registry.yaml': ERROR_SKILLS,
        '/err/experience/01-bad.md': `---
company: PwC
role: Senior Software Developer
startDate: '2024-08'
skills:
  - typescript
engagements:
  - title: Empty Engagement
    skills:
      - typescript
    description: []
---

A description paragraph that has enough content to parse correctly.`,
      });

      expect(() => parseContent('/err')).toThrow(/has an empty "description"/);
    });
  });
});
