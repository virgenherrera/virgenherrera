import { vol } from 'memfs';
import { buildProfileGraph } from './link-resolver';

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
jest.mock('node:fs', () => require('memfs').fs);
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */

describe('UT: link-resolver', () => {
  class should {
    static readonly buildByExperience = 'map each experience to its skills';
    static readonly buildByProject = 'map each project to its technologies';
    static readonly buildBySkill =
      'map each skill to the experiences and projects that reference it';
    static readonly sumNonOverlappingYears =
      'sum non-overlapping periods for years-per-skill';
    static readonly mergeOverlappingYears =
      'merge overlapping periods instead of double-counting years-per-skill';
    static readonly throwOnUnknownExperienceSlug =
      'throw a descriptive error when an experience references an unknown skill slug';
    static readonly computeOngoingYears =
      'compute years-per-skill up to "now" when endDate is omitted';
    static readonly throwOnMissingExperienceDir =
      'throw a descriptive error when the experience directory is missing';
    static readonly throwOnNonObjectRegistry =
      'throw a descriptive error when skills-registry.yaml is not a YAML object';
    static readonly throwOnMalformedRegistryYaml =
      'throw a descriptive error when skills-registry.yaml has malformed YAML';
    static readonly throwOnDuplicateRegistrySlug =
      'throw a descriptive error when skills-registry.yaml has a duplicate slug';
    static readonly throwOnProjectMissingField =
      'throw a descriptive error when a project is missing a required field';
    static readonly throwOnProjectBadTechnologyType =
      'throw a descriptive error when a project technology entry is not a string';
    static readonly throwOnProjectsKeyMissing =
      'throw a descriptive error when projects.yaml has no top-level "projects" array';
    static readonly throwOnUnknownProjectSlug =
      'throw a descriptive error when a project references an unknown skill slug';
    static readonly includeEngagementSkillsInBySkill =
      'include engagement skills in the bySkill graph';
    static readonly includeEngagementSkillsInByExperience =
      'include engagement skills in byExperience under the parent company';
    static readonly includeEngagementSkillsInYears =
      'compute years-per-skill including engagement skill usage via the parent date range';
    static readonly throwOnUnknownEngagementSlug =
      'throw a descriptive error when an engagement references an unknown skill slug';
    static readonly throwOnEngagementsNotArray =
      'throw a descriptive error when "engagements" is not an array';
  }

  afterEach(() => vol.reset());

  describe('buildProfileGraph (valid fixtures) @critical', () => {
    const contentDir = '/content';

    beforeEach(() => {
      vol.fromJSON({
        '/content/skills-registry.yaml': [
          'skills:',
          '  - slug: typescript',
          '    display: TypeScript',
          '    category: Languages',
          '  - slug: nodejs',
          '    display: Node.js',
          '    category: Backend Frameworks',
          '  - slug: nestjs',
          '    display: NestJS',
          '    category: Backend Frameworks',
          '  - slug: docker',
          '    display: Docker',
          '    category: Cloud & DevOps',
        ].join('\n'),
        '/content/experience/01-alpha.md': [
          '---',
          'company: AlphaCo',
          'role: Engineer',
          "startDate: '2018-01'",
          "endDate: '2019-01'",
          'skills:',
          '  - typescript',
          '  - nodejs',
          '---',
          '',
          'Worked on the Alpha platform.',
        ].join('\n'),
        '/content/experience/02-beta.md': [
          '---',
          'company: BetaCo',
          'role: Engineer',
          "startDate: '2019-06'",
          "endDate: '2020-06'",
          'skills:',
          '  - typescript',
          '---',
          '',
          'Worked on the Beta platform.',
        ].join('\n'),
        '/content/experience/03-gamma.md': [
          '---',
          'company: GammaCo',
          'role: Engineer',
          "startDate: '2020-01'",
          "endDate: '2021-01'",
          'skills:',
          '  - nodejs',
          '---',
          '',
          'Worked on the Gamma platform.',
        ].join('\n'),
        '/content/experience/04-delta.md': [
          '---',
          'company: DeltaCo',
          'role: Engineer',
          "startDate: '2015-01'",
          "endDate: '2016-01'",
          'skills:',
          '  - nestjs',
          '---',
          '',
          'Worked on the Delta platform.',
        ].join('\n'),
        '/content/experience/05-epsilon.md': [
          '---',
          'company: EpsilonCo',
          'role: Engineer',
          "startDate: '2015-07'",
          "endDate: '2016-07'",
          'skills:',
          '  - nestjs',
          '---',
          '',
          'Worked on the Epsilon platform, overlapping with DeltaCo.',
        ].join('\n'),
        '/content/experience/06-zeta.md': [
          '---',
          'company: ZetaCo',
          'role: Engineer',
          "startDate: '2022-01'",
          'skills:',
          '  - docker',
          '---',
          '',
          'Ongoing role, no endDate — years-per-skill must fall back to "now".',
        ].join('\n'),
        '/content/projects.yaml': [
          'projects:',
          '  - name: side-project',
          '    description: "A side project"',
          '    url: https://example.com/side-project',
          '    technologies:',
          '      - typescript',
          '      - docker',
        ].join('\n'),
      });
    });

    it(`${should.buildByExperience}`, () => {
      const graph = buildProfileGraph(contentDir);

      expect(graph.byExperience.get('AlphaCo')).toEqual([
        'typescript',
        'nodejs',
      ]);
      expect(graph.byExperience.get('BetaCo')).toEqual(['typescript']);
      expect(graph.byExperience.get('DeltaCo')).toEqual(['nestjs']);
    });

    it(`${should.buildByProject}`, () => {
      const graph = buildProfileGraph(contentDir);

      expect(graph.byProject.get('side-project')).toEqual([
        'typescript',
        'docker',
      ]);
    });

    it(`${should.buildBySkill}`, () => {
      const graph = buildProfileGraph(contentDir);
      const typescriptStats = graph.bySkill.get('typescript');
      const dockerStats = graph.bySkill.get('docker');

      expect(typescriptStats?.experiences).toEqual(
        expect.arrayContaining(['AlphaCo', 'BetaCo']),
      );
      expect(typescriptStats?.projects).toEqual(['side-project']);
      expect(dockerStats?.experiences).toEqual(['ZetaCo']);
      expect(dockerStats?.projects).toEqual(['side-project']);
    });

    it(`${should.sumNonOverlappingYears}`, () => {
      const graph = buildProfileGraph(contentDir);

      // AlphaCo (2018-01 -> 2019-01, 12mo) + BetaCo (2019-06 -> 2020-06,
      // 12mo), separated by a 5-month gap -> summed, not merged.
      expect(graph.bySkill.get('typescript')?.years).toBe(2.0);

      // AlphaCo (2018-01 -> 2019-01, 12mo) + GammaCo (2020-01 -> 2021-01,
      // 12mo), separated by a 12-month gap -> summed, not merged.
      expect(graph.bySkill.get('nodejs')?.years).toBe(2.0);
    });

    it(`${should.mergeOverlappingYears}`, () => {
      const graph = buildProfileGraph(contentDir);

      // DeltaCo (2015-01 -> 2016-01) overlaps EpsilonCo (2015-07 -> 2016-07)
      // by 6 months. Naive summing would give 24mo/2.0y; merged periods give
      // 2015-01 -> 2016-07 = 18mo -> 1.5y.
      expect(graph.bySkill.get('nestjs')?.years).toBe(1.5);
    });

    it(`${should.computeOngoingYears}`, () => {
      const graph = buildProfileGraph(contentDir);
      const now = new Date();
      const currentMonthIndex = now.getUTCFullYear() * 12 + now.getUTCMonth();
      const startMonthIndex = 2022 * 12 + 0;
      const expectedYears =
        Math.round(((currentMonthIndex - startMonthIndex) / 12) * 10) / 10;

      expect(graph.bySkill.get('docker')?.years).toBe(expectedYears);
    });
  });

  describe('buildProfileGraph (engagement fixtures) @critical', () => {
    const contentDir = '/content';

    beforeEach(() => {
      vol.fromJSON({
        '/content/skills-registry.yaml': [
          'skills:',
          '  - slug: typescript',
          '    display: TypeScript',
          '    category: Languages',
          '  - slug: nodejs',
          '    display: Node.js',
          '    category: Backend Frameworks',
          '  - slug: nestjs',
          '    display: NestJS',
          '    category: Backend Frameworks',
          '  - slug: langchain',
          '    display: LangChain',
          '    category: AI & Integrations',
        ].join('\n'),
        '/content/experience/01-acme.md': [
          '---',
          'company: AcmeCo',
          'role: Engineer',
          "startDate: '2020-01'",
          "endDate: '2021-01'",
          'skills:',
          '  - typescript',
          'engagements:',
          '  - title: AI Platform',
          '    skills:',
          '      - nestjs',
          '      - langchain',
          '    description:',
          "      - 'Built an AI platform.'",
          '---',
          '',
          'Worked on the Acme platform.',
        ].join('\n'),
        '/content/projects.yaml': 'projects: []',
      });
    });

    it(`${should.includeEngagementSkillsInBySkill}`, () => {
      const graph = buildProfileGraph(contentDir);

      expect(graph.bySkill.get('nestjs')?.experiences).toEqual(['AcmeCo']);
      expect(graph.bySkill.get('langchain')?.experiences).toEqual(['AcmeCo']);
    });

    it(`${should.includeEngagementSkillsInByExperience}`, () => {
      const graph = buildProfileGraph(contentDir);

      expect(graph.byExperience.get('AcmeCo')).toEqual([
        'typescript',
        'nestjs',
        'langchain',
      ]);
    });

    it(`${should.includeEngagementSkillsInYears}`, () => {
      const graph = buildProfileGraph(contentDir);

      // AcmeCo runs 2020-01 -> 2021-01 (12mo/1.0y). The engagement skills
      // (nestjs, langchain) have no dates of their own, so they inherit the
      // parent experience's date range.
      expect(graph.bySkill.get('nestjs')?.years).toBe(1.0);
      expect(graph.bySkill.get('langchain')?.years).toBe(1.0);
    });
  });

  describe('buildProfileGraph (error handling)', () => {
    const minimalExp = [
      '---',
      'company: AlphaCo',
      'role: Engineer',
      "startDate: '2018-01'",
      "endDate: '2019-01'",
      'skills:',
      '  - typescript',
      '---',
      '',
      'Worked on the Alpha platform.',
    ].join('\n');

    const minimalRegistry = [
      'skills:',
      '  - slug: typescript',
      '    display: TypeScript',
      '    category: Languages',
    ].join('\n');

    it(`${should.throwOnUnknownExperienceSlug}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': minimalRegistry,
        '/err/experience/01-bad.md': [
          '---',
          'company: BadCo',
          'role: Engineer',
          "startDate: '2020-01'",
          "endDate: '2020-06'",
          'skills:',
          '  - typescript',
          '  - this-slug-does-not-exist',
          '---',
          '',
          'Referenced a skill slug that is not in the registry.',
        ].join('\n'),
        '/err/projects.yaml': 'projects: []',
      });

      expect(() => buildProfileGraph('/err')).toThrow(
        /unknown skill slug "this-slug-does-not-exist"/,
      );
    });

    it(`${should.throwOnMissingExperienceDir}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': minimalRegistry,
      });

      expect(() => buildProfileGraph('/err')).toThrow(
        /unable to read required content directory ".*experience"/,
      );
    });

    it(`${should.throwOnNonObjectRegistry}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': [
          '- slug: typescript',
          '  display: TypeScript',
          '  category: Languages',
        ].join('\n'),
      });

      expect(() => buildProfileGraph('/err')).toThrow(
        /must be a YAML\/frontmatter object/,
      );
    });

    it(`${should.throwOnMalformedRegistryYaml}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': 'skills: [this is: not, valid: yaml',
      });

      expect(() => buildProfileGraph('/err')).toThrow(
        /failed to parse YAML in ".*skills-registry\.yaml"/,
      );
    });

    it(`${should.throwOnDuplicateRegistrySlug}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': [
          'skills:',
          '  - slug: typescript',
          '    display: TypeScript',
          '    category: Languages',
          '  - slug: typescript',
          '    display: TypeScript (dup)',
          '    category: Languages',
        ].join('\n'),
      });

      expect(() => buildProfileGraph('/err')).toThrow(
        /duplicate skill slug "typescript"/,
      );
    });

    it(`${should.throwOnProjectMissingField}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': minimalRegistry,
        '/err/experience/01-alpha.md': minimalExp,
        '/err/projects.yaml': [
          'projects:',
          '  - description: "Missing the required name field"',
          '    url: https://example.com/side-project',
          '    technologies:',
          '      - typescript',
        ].join('\n'),
      });

      expect(() => buildProfileGraph('/err')).toThrow(
        /is missing required field "name"/,
      );
    });

    it(`${should.throwOnProjectBadTechnologyType}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': minimalRegistry,
        '/err/experience/01-alpha.md': minimalExp,
        '/err/projects.yaml': [
          'projects:',
          '  - name: side-project',
          '    description: "A side project"',
          '    url: https://example.com/side-project',
          '    technologies:',
          '      - typescript',
          '      - 42',
        ].join('\n'),
      });

      expect(() => buildProfileGraph('/err')).toThrow(
        /field "technologies\[1\]" must be a string/,
      );
    });

    it(`${should.throwOnProjectsKeyMissing}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': minimalRegistry,
        '/err/experience/01-alpha.md': minimalExp,
        '/err/projects.yaml': [
          'items:',
          '  - name: side-project',
          '    description: "A side project"',
          '    url: https://example.com/side-project',
          '    technologies:',
          '      - typescript',
        ].join('\n'),
      });

      expect(() => buildProfileGraph('/err')).toThrow(
        /must define a top-level "projects" array/,
      );
    });

    it(`${should.throwOnUnknownProjectSlug}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': minimalRegistry,
        '/err/experience/01-alpha.md': minimalExp,
        '/err/projects.yaml': [
          'projects:',
          '  - name: side-project',
          '    description: "A side project"',
          '    url: https://example.com/side-project',
          '    technologies:',
          '      - this-slug-does-not-exist',
        ].join('\n'),
      });

      expect(() => buildProfileGraph('/err')).toThrow(
        /unknown skill slug "this-slug-does-not-exist" referenced by project "side-project"/,
      );
    });

    it(`${should.throwOnUnknownEngagementSlug}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': minimalRegistry,
        '/err/experience/01-bad.md': [
          '---',
          'company: BadCo',
          'role: Engineer',
          "startDate: '2020-01'",
          "endDate: '2021-01'",
          'skills:',
          '  - typescript',
          'engagements:',
          '  - title: Something',
          '    skills:',
          '      - this-slug-does-not-exist',
          '    description:',
          "      - 'Some description.'",
          '---',
          '',
          'Body text.',
        ].join('\n'),
        '/err/projects.yaml': 'projects: []',
      });

      expect(() => buildProfileGraph('/err')).toThrow(
        /unknown skill slug "this-slug-does-not-exist" referenced by engagement "Something"/,
      );
    });

    it(`${should.throwOnEngagementsNotArray}`, () => {
      vol.fromJSON({
        '/err/skills-registry.yaml': minimalRegistry,
        '/err/experience/01-bad.md': [
          '---',
          'company: BadCo',
          'role: Engineer',
          "startDate: '2020-01'",
          "endDate: '2021-01'",
          'skills:',
          '  - typescript',
          'engagements: not-an-array',
          '---',
          '',
          'Body text.',
        ].join('\n'),
      });

      expect(() => buildProfileGraph('/err')).toThrow(
        /field "engagements" must be an array/,
      );
    });
  });
});
