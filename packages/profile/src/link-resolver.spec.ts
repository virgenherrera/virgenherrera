import { join } from 'node:path';
import { buildProfileGraph } from './link-resolver';

const FIXTURES_DIR = join(__dirname, '../test-fixtures');

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
  }

  describe('buildProfileGraph (valid fixtures)', () => {
    const contentDir = join(FIXTURES_DIR, 'graph-valid');

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

  describe('buildProfileGraph (error handling)', () => {
    it(`${should.throwOnUnknownExperienceSlug}`, () => {
      expect(() =>
        buildProfileGraph(join(FIXTURES_DIR, 'graph-invalid-slug')),
      ).toThrow(/unknown skill slug "this-slug-does-not-exist"/);
    });

    it(`${should.throwOnMissingExperienceDir}`, () => {
      expect(() =>
        buildProfileGraph(join(FIXTURES_DIR, 'graph-missing-exp-dir')),
      ).toThrow(/unable to read required content directory ".*experience"/);
    });

    it(`${should.throwOnNonObjectRegistry}`, () => {
      expect(() =>
        buildProfileGraph(join(FIXTURES_DIR, 'graph-registry-not-object')),
      ).toThrow(/must be a YAML\/frontmatter object/);
    });

    it(`${should.throwOnMalformedRegistryYaml}`, () => {
      expect(() =>
        buildProfileGraph(join(FIXTURES_DIR, 'graph-malformed-registry')),
      ).toThrow(/failed to parse YAML in ".*skills-registry\.yaml"/);
    });

    it(`${should.throwOnDuplicateRegistrySlug}`, () => {
      expect(() =>
        buildProfileGraph(join(FIXTURES_DIR, 'graph-duplicate-registry')),
      ).toThrow(/duplicate skill slug "typescript"/);
    });

    it(`${should.throwOnProjectMissingField}`, () => {
      expect(() =>
        buildProfileGraph(join(FIXTURES_DIR, 'graph-bad-project-fields')),
      ).toThrow(/is missing required field "name"/);
    });

    it(`${should.throwOnProjectBadTechnologyType}`, () => {
      expect(() =>
        buildProfileGraph(join(FIXTURES_DIR, 'graph-bad-project-technologies')),
      ).toThrow(/field "technologies\[1\]" must be a string/);
    });

    it(`${should.throwOnProjectsKeyMissing}`, () => {
      expect(() =>
        buildProfileGraph(join(FIXTURES_DIR, 'graph-project-missing-key')),
      ).toThrow(/must define a top-level "projects" array/);
    });

    it(`${should.throwOnUnknownProjectSlug}`, () => {
      expect(() =>
        buildProfileGraph(join(FIXTURES_DIR, 'graph-project-unknown-slug')),
      ).toThrow(
        /unknown skill slug "this-slug-does-not-exist" referenced by project "side-project"/,
      );
    });
  });
});
