import { vol } from 'memfs';
import { chunkContent } from './chunker';

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
jest.mock('node:fs', () => require('memfs').fs);
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */

describe('UT: chunker', () => {
  class should {
    static readonly produceChunksWithCorrectStructure =
      'produce chunks with an id, text, and metadata';
    static readonly produceOneChunkPerShortExperience =
      'produce a single deterministic chunk for a short experience entry';
    static readonly splitLongExperienceWithoutLosingContent =
      'split a long experience entry into multiple chunks without losing or duplicating content';
    static readonly produceUniqueIdsAcrossSameCompany =
      'produce unique deterministic ids even when two experiences share a filename stem risk';
    static readonly enrichWithSkillsPrefix =
      'prepend a [Skills: ...] prefix with display names to enriched text';
    static readonly capEnrichmentSkillsAtFive =
      'cap the [Skills: ...] enrichment prefix at 5 skill display names';
    static readonly enrichWithContextPrefix =
      'prepend a [Context: ...] prefix describing role/company/dates';
    static readonly omitSkillsPrefixWhenNoSkills =
      'omit the [Skills: ...] prefix for chunks with no associated skills';
    static readonly produceSummaryChunk =
      'produce exactly one summary chunk from meta.md';
    static readonly produceEducationChunk =
      'produce one chunk per education entry';
    static readonly produceProjectChunks = 'produce one chunk per project';
    static readonly tagChunkMetadataType =
      'tag each chunk with its correct metadata.type';
    static readonly tagExperienceMetadataFields =
      'tag experience chunks with company, role, startDate, endDate, and skills';
    static readonly produceEngagementChunks =
      "produce one chunk per engagement tagged with type 'engagement'";
    static readonly tagEngagementChunksWithParentMetadata =
      'tag engagement chunks with the parent company/role/dates plus the engagement skills';
    static readonly throwOnEngagementsNotArray =
      'throw a descriptive error when "engagements" is not an array';
  }

  afterEach(() => vol.reset());

  describe('chunkContent (chunker-valid fixture) @critical', () => {
    beforeEach(() => {
      vol.fromJSON({
        '/content/meta.md': [
          '---',
          "name: 'Test Person'",
          "headline: 'Test Headline'",
          "summary: 'A short professional summary used to verify the chunker summary chunk.'",
          "location: 'Testland'",
          '---',
        ].join('\n'),
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
          '  - slug: aws',
          '    display: AWS',
          '    category: Cloud & DevOps',
          '  - slug: graphql',
          '    display: GraphQL',
          '    category: APIs & Protocols',
        ].join('\n'),
        '/content/experience/01-short.md': [
          '---',
          'company: ShortCo',
          'role: Engineer',
          "startDate: '2020-01'",
          "endDate: '2021-01'",
          'skills:',
          '  - typescript',
          '  - nodejs',
          '---',
          '',
          'A single short sentence describing the role at ShortCo.',
        ].join('\n'),
        '/content/experience/02-long.md': [
          '---',
          'company: LongCo',
          'role: Staff Engineer',
          "startDate: '2019-01'",
          'skills:',
          '  - typescript',
          '  - nodejs',
          '  - nestjs',
          '  - docker',
          '  - aws',
          '  - graphql',
          '---',
          '',
          /* eslint-disable max-len */
          '*This is the first bullet point of a deliberately long experience entry, written to comfortably exceed two hundred characters of text so grouping math stays predictable across environments and locales here.',
          '*This is the second bullet point of a deliberately long experience entry, written to comfortably exceed two hundred characters of text so grouping math stays predictable across environments and locales too.',
          '*This is the third bullet point of a deliberately long experience entry, written to comfortably exceed two hundred characters of text so grouping math stays predictable across environments and locales now.',
          '*This is the fourth bullet point of a deliberately long experience entry, written to comfortably exceed two hundred characters of text so grouping math stays predictable across environments and locales still.',
          /* eslint-enable max-len */
        ].join('\n'),
        '/content/education/01-edu.md': [
          '---',
          "degree: 'B.S. in Testing'",
          "degreeTranslation: 'B.S. en Pruebas'",
          "institution: 'Edu University'",
          "location: 'Testland'",
          "startDate: '2010-01'",
          "graduationDate: '2014-05'",
          "honors: 'Graduated with Honors'",
          '---',
        ].join('\n'),
        '/content/projects.yaml': [
          'projects:',
          '  - name: Test Project',
          "    description: 'A test project used to verify project chunking.'",
          '    url: https://example.com/test-project',
          '    technologies:',
          '      - typescript',
          '      - docker',
        ].join('\n'),
      });
    });

    it(`${should.produceChunksWithCorrectStructure}`, () => {
      const chunks = chunkContent('/content');

      expect(chunks.length).toBeGreaterThan(0);

      for (const chunk of chunks) {
        expect(typeof chunk.id).toBe('string');
        expect(chunk.id.length).toBeGreaterThan(0);
        expect(typeof chunk.text).toBe('string');
        expect(chunk.text.length).toBeGreaterThan(0);
        expect(chunk.metadata).toEqual(
          expect.objectContaining({
            source: expect.any(String),
            type: expect.stringMatching(
              /^(experience|education|summary|project)$/,
            ),
            skills: expect.any(Array),
          }),
        );
      }
    });

    it(`${should.produceSummaryChunk}`, () => {
      const chunks = chunkContent('/content');
      const summaryChunks = chunks.filter((c) => c.metadata.type === 'summary');

      expect(summaryChunks).toHaveLength(1);
      expect(summaryChunks[0].id).toBe('summary-0');
      expect(summaryChunks[0].text).toContain(
        'A short professional summary used to verify the chunker summary chunk.',
      );
    });

    it(`${should.produceEducationChunk}`, () => {
      const chunks = chunkContent('/content');
      const educationChunks = chunks.filter(
        (c) => c.metadata.type === 'education',
      );

      expect(educationChunks).toHaveLength(1);
      expect(educationChunks[0].id).toBe('education-edu');
      expect(educationChunks[0].metadata.source).toBe('education/01-edu.md');
      expect(educationChunks[0].text).toContain('Edu University');
    });

    it(`${should.produceProjectChunks}`, () => {
      const chunks = chunkContent('/content');
      const projectChunks = chunks.filter((c) => c.metadata.type === 'project');

      expect(projectChunks).toHaveLength(1);
      expect(projectChunks[0].id).toBe('project-test-project');
      expect(projectChunks[0].metadata.skills).toEqual([
        'typescript',
        'docker',
      ]);
      expect(projectChunks[0].text).toContain(
        'A test project used to verify project chunking.',
      );
    });

    it(`${should.produceOneChunkPerShortExperience}`, () => {
      const chunks = chunkContent('/content');
      const shortChunks = chunks.filter((c) =>
        c.id.startsWith('experience-short'),
      );

      expect(shortChunks).toHaveLength(1);
      expect(shortChunks[0].id).toBe('experience-short');
    });

    it(`${should.splitLongExperienceWithoutLosingContent}`, () => {
      const chunks = chunkContent('/content');
      const longChunks = chunks
        .filter((c) => c.id.startsWith('experience-long'))
        .sort((a, b) => a.id.localeCompare(b.id));

      expect(longChunks.length).toBeGreaterThan(1);
      expect(longChunks.map((c) => c.id)).toEqual([
        'experience-long-1',
        'experience-long-2',
      ]);

      const bulletCount = longChunks.reduce(
        (sum, chunk) =>
          sum +
          (chunk.text.match(
            /first bullet|second bullet|third bullet|fourth bullet/g,
          )?.length ?? 0),
        0,
      );

      expect(bulletCount).toBe(4);
    });

    it(`${should.produceUniqueIdsAcrossSameCompany}`, () => {
      const chunks = chunkContent('/content');
      const ids = chunks.map((c) => c.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it(`${should.tagChunkMetadataType}`, () => {
      const chunks = chunkContent('/content');
      const byId = new Map(chunks.map((c) => [c.id, c]));

      expect(byId.get('experience-short')?.metadata.type).toBe('experience');
      expect(byId.get('education-edu')?.metadata.type).toBe('education');
      expect(byId.get('project-test-project')?.metadata.type).toBe('project');
      expect(byId.get('summary-0')?.metadata.type).toBe('summary');
    });

    it(`${should.tagExperienceMetadataFields}`, () => {
      const chunks = chunkContent('/content');
      const short = chunks.find((c) => c.id === 'experience-short');

      expect(short?.metadata).toEqual(
        expect.objectContaining({
          source: 'experience/01-short.md',
          company: 'ShortCo',
          role: 'Engineer',
          startDate: '2020-01',
          endDate: '2021-01',
          skills: ['typescript', 'nodejs'],
        }),
      );
    });

    it(`${should.enrichWithSkillsPrefix}`, () => {
      const chunks = chunkContent('/content');
      const short = chunks.find((c) => c.id === 'experience-short');

      expect(short?.text).toMatch(/^\[Skills: TypeScript, Node\.js\]/);
    });

    it(`${should.capEnrichmentSkillsAtFive}`, () => {
      const chunks = chunkContent('/content');
      const long = chunks.find((c) => c.id === 'experience-long-1');
      const skillsLine = long?.text.split('\n')[0] ?? '';
      const displayNames = skillsLine
        .replace(/^\[Skills: /, '')
        .replace(/\]$/, '')
        .split(', ');

      expect(displayNames).toHaveLength(5);
      expect(displayNames).toEqual([
        'TypeScript',
        'Node.js',
        'NestJS',
        'Docker',
        'AWS',
      ]);
    });

    it(`${should.enrichWithContextPrefix}`, () => {
      const chunks = chunkContent('/content');
      const short = chunks.find((c) => c.id === 'experience-short');
      const ongoing = chunks.find((c) => c.id === 'experience-long-1');

      expect(short?.text).toContain(
        '[Context: Engineer at ShortCo, 2020-01 to 2021-01]',
      );
      expect(ongoing?.text).toContain(
        '[Context: Staff Engineer at LongCo, 2019-01-present]',
      );
    });

    it(`${should.omitSkillsPrefixWhenNoSkills}`, () => {
      const chunks = chunkContent('/content');
      const summary = chunks.find((c) => c.id === 'summary-0');
      const education = chunks.find((c) => c.id === 'education-edu');

      expect(summary?.text.startsWith('[Skills:')).toBe(false);
      expect(education?.text.startsWith('[Skills:')).toBe(false);
      expect(summary?.text.startsWith('[Context:')).toBe(true);
      expect(education?.text.startsWith('[Context:')).toBe(true);
    });
  });

  describe('chunkContent (chunker-engagement-valid fixture) @critical', () => {
    beforeEach(() => {
      vol.fromJSON({
        '/eng/meta.md': [
          '---',
          "name: 'Test Person'",
          "headline: 'Test Headline'",
          "summary: 'A short professional summary used to verify the chunker engagement fixture.'",
          "location: 'Testland'",
          '---',
        ].join('\n'),
        '/eng/skills-registry.yaml': [
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
        ].join('\n'),
        '/eng/experience/01-eng.md': [
          '---',
          'company: EngCo',
          'role: Engineer',
          "startDate: '2020-01'",
          "endDate: '2021-01'",
          'skills:',
          '  - typescript',
          'engagements:',
          '  - title: AI Platform Engagement',
          '    domain: Platform Engineering',
          '    client: Acme Corp',
          '    skills:',
          '      - nestjs',
          '      - nodejs',
          '    description:',
          "      - 'Built an AI platform for a client.'",
          "      - '*Implemented core services using NestJS and Node.js.'",
          '---',
          '',
          'Worked on the Eng platform.',
        ].join('\n'),
        '/eng/education/01-edu.md': [
          '---',
          "degree: 'B.S. in Testing'",
          "degreeTranslation: 'B.S. en Pruebas'",
          "institution: 'Edu University'",
          "location: 'Testland'",
          "startDate: '2010-01'",
          "graduationDate: '2014-05'",
          "honors: 'Graduated with Honors'",
          '---',
        ].join('\n'),
        '/eng/projects.yaml': [
          'projects:',
          '  - name: Test Project',
          "    description: 'A test project used to verify project chunking.'",
          '    url: https://example.com/test-project',
          '    technologies:',
          '      - typescript',
        ].join('\n'),
      });
    });

    it(`${should.produceEngagementChunks}`, () => {
      const chunks = chunkContent('/eng');
      const engagementChunks = chunks.filter(
        (c) => c.metadata.type === 'engagement',
      );

      expect(engagementChunks).toHaveLength(1);
      expect(engagementChunks[0].id).toBe('engagement-eng');
    });

    it(`${should.tagEngagementChunksWithParentMetadata}`, () => {
      const chunks = chunkContent('/eng');
      const engagement = chunks.find((c) => c.metadata.type === 'engagement');

      expect(engagement?.metadata).toEqual(
        expect.objectContaining({
          source: 'experience/01-eng.md',
          company: 'EngCo',
          role: 'Engineer',
          startDate: '2020-01',
          endDate: '2021-01',
          skills: ['nestjs', 'nodejs'],
        }),
      );
      expect(engagement?.text).toMatch(/^\[Skills: NestJS, Node\.js\]/);
      expect(engagement?.text).toContain(
        '[Context: AI Platform Engagement at EngCo, 2020-01 to 2021-01]',
      );
      expect(engagement?.text).toContain('Built an AI platform for a client.');
      expect(engagement?.text).toContain(
        'Implemented core services using NestJS and Node.js.',
      );
    });
  });

  describe('chunkContent (error handling)', () => {
    it(`${should.throwOnEngagementsNotArray}`, () => {
      vol.fromJSON({
        '/err/meta.md': [
          '---',
          "name: 'Test Person'",
          "headline: 'Test Headline'",
          "summary: 'A short professional summary used to verify chunker error handling.'",
          "location: 'Testland'",
          '---',
        ].join('\n'),
        '/err/skills-registry.yaml': [
          'skills:',
          '  - slug: typescript',
          '    display: TypeScript',
          '    category: Languages',
        ].join('\n'),
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

      expect(() => chunkContent('/err')).toThrow(
        /field "engagements" must be an array/,
      );
    });
  });
});
