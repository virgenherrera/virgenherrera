import { join } from 'node:path';
import { chunkContent } from './chunker';

const FIXTURES_DIR = join(__dirname, '../../test-fixtures');

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
  }

  describe('chunkContent (chunker-valid fixture)', () => {
    const contentDir = join(FIXTURES_DIR, 'chunker-valid');

    it(`${should.produceChunksWithCorrectStructure}`, () => {
      const chunks = chunkContent(contentDir);

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
      const chunks = chunkContent(contentDir);
      const summaryChunks = chunks.filter((c) => c.metadata.type === 'summary');

      expect(summaryChunks).toHaveLength(1);
      expect(summaryChunks[0].id).toBe('summary-0');
      expect(summaryChunks[0].text).toContain(
        'A short professional summary used to verify the chunker summary chunk.',
      );
    });

    it(`${should.produceEducationChunk}`, () => {
      const chunks = chunkContent(contentDir);
      const educationChunks = chunks.filter(
        (c) => c.metadata.type === 'education',
      );

      expect(educationChunks).toHaveLength(1);
      expect(educationChunks[0].id).toBe('education-edu');
      expect(educationChunks[0].metadata.source).toBe('education/01-edu.md');
      expect(educationChunks[0].text).toContain('Edu University');
    });

    it(`${should.produceProjectChunks}`, () => {
      const chunks = chunkContent(contentDir);
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
      const chunks = chunkContent(contentDir);
      const shortChunks = chunks.filter((c) =>
        c.id.startsWith('experience-short'),
      );

      expect(shortChunks).toHaveLength(1);
      expect(shortChunks[0].id).toBe('experience-short');
    });

    it(`${should.splitLongExperienceWithoutLosingContent}`, () => {
      const chunks = chunkContent(contentDir);
      const longChunks = chunks
        .filter((c) => c.id.startsWith('experience-long'))
        .sort((a, b) => a.id.localeCompare(b.id));

      expect(longChunks.length).toBeGreaterThan(1);
      expect(longChunks.map((c) => c.id)).toEqual([
        'experience-long-1',
        'experience-long-2',
      ]);

      // No sentence should be truncated mid-way, and none should repeat.
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
      const chunks = chunkContent(contentDir);
      const ids = chunks.map((c) => c.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it(`${should.tagChunkMetadataType}`, () => {
      const chunks = chunkContent(contentDir);
      const byId = new Map(chunks.map((c) => [c.id, c]));

      expect(byId.get('experience-short')?.metadata.type).toBe('experience');
      expect(byId.get('education-edu')?.metadata.type).toBe('education');
      expect(byId.get('project-test-project')?.metadata.type).toBe('project');
      expect(byId.get('summary-0')?.metadata.type).toBe('summary');
    });

    it(`${should.tagExperienceMetadataFields}`, () => {
      const chunks = chunkContent(contentDir);
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
      const chunks = chunkContent(contentDir);
      const short = chunks.find((c) => c.id === 'experience-short');

      expect(short?.text).toMatch(/^\[Skills: TypeScript, Node\.js\]/);
    });

    it(`${should.capEnrichmentSkillsAtFive}`, () => {
      const chunks = chunkContent(contentDir);
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
      const chunks = chunkContent(contentDir);
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
      const chunks = chunkContent(contentDir);
      const summary = chunks.find((c) => c.id === 'summary-0');
      const education = chunks.find((c) => c.id === 'education-edu');

      expect(summary?.text.startsWith('[Skills:')).toBe(false);
      expect(education?.text.startsWith('[Skills:')).toBe(false);
      expect(summary?.text.startsWith('[Context:')).toBe(true);
      expect(education?.text.startsWith('[Context:')).toBe(true);
    });
  });
});
