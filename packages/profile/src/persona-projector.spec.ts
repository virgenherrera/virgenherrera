import { profileSnapshotSchema, serializedGraphSchema } from './schema';
import { DEFAULT_PERSONA, projectProfile } from './persona-projector';
import { personaSchema, type PersonaConfig } from './persona-schema';

function validSnapshot() {
  return profileSnapshotSchema.parse({
    name: 'Jane Doe',
    headline: 'Senior Engineer',
    summary: 'A senior engineer with a decade of experience.',
    location: 'Mexico',
    links: [{ label: 'GitHub', url: 'https://github.com/example' }],
    experience: [
      {
        company: 'PwC',
        role: 'Senior Software Developer',
        startDate: { year: 2024, month: 8 },
        description: [{ type: 'paragraph', lines: ['Built an AI platform.'] }],
        technologies: ['LangChain', 'OpenAI API'],
        engagements: [
          {
            title: 'Enterprise AI Conversational Platform',
            description: [
              { type: 'paragraph', lines: ['Built the orchestration layer.'] },
            ],
            technologies: ['LangChain'],
          },
          {
            title: 'Internal Tooling',
            description: [
              { type: 'paragraph', lines: ['Built internal dashboards.'] },
            ],
            technologies: [],
          },
        ],
      },
      {
        company: 'Globant',
        role: 'Senior Fullstack Node.js Developer',
        startDate: { year: 2021, month: 4 },
        endDate: { year: 2024, month: 8 },
        description: [
          { type: 'paragraph', lines: ['Led backend architecture.'] },
        ],
        technologies: ['Node.js'],
      },
      {
        company: 'Ramsal Software',
        role: 'Fullstack Software Engineer',
        startDate: { year: 2015, month: 8 },
        endDate: { year: 2016, month: 6 },
        description: [
          { type: 'paragraph', lines: ['First engineering role.'] },
        ],
        technologies: ['JavaScript'],
      },
    ],
    education: [],
    certifications: [],
    projects: [],
    skills: [
      { category: 'AI Engineering', skills: ['LangChain', 'OpenAI API'] },
      { category: 'Languages', skills: ['JavaScript', 'TypeScript'] },
      { category: 'Backend Frameworks', skills: ['.NET 8', 'C#'] },
    ],
    languages: [{ language: 'English', proficiency: 'C1' }],
  });
}

function validGraph() {
  return serializedGraphSchema.parse({
    bySkill: {
      langchain: { experiences: ['PwC'], projects: [], years: 1.5 },
      'openai-api': { experiences: ['PwC'], projects: [], years: 1.5 },
      typescript: { experiences: ['PwC', 'Globant'], projects: [], years: 5 },
      javascript: { experiences: ['Ramsal Software'], projects: [], years: 1 },
    },
    byExperience: {
      PwC: ['langchain', 'openai-api'],
      Globant: ['typescript'],
      'Ramsal Software': ['javascript'],
    },
    byProject: {},
    displayNames: {
      langchain: 'LangChain',
      'openai-api': 'OpenAI API',
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      'dotnet-8': '.NET 8',
      csharp: 'C#',
    },
  });
}

function persona(overrides: Partial<PersonaConfig> = {}): PersonaConfig {
  return personaSchema.parse({
    id: 'test-persona',
    label: 'Test Persona',
    ...overrides,
  });
}

describe('UT: persona-projector', () => {
  class should {
    static readonly matchUnmodifiedProfile =
      'produce skills/experience/headline/summary equivalent to the unmodified profile';
    static readonly attachPersonaId =
      'attach the persona id even for the default persona';
    static readonly reorderSkillsByPriority =
      'reorder skills within a category by priority';
    static readonly filterSkillsByExclude = 'filter out excluded skills';
    static readonly dropEmptyCategoryAfterExclude =
      'drop a category entirely once all of its skills are excluded';
    static readonly filterSkillsByIncludeCategory =
      'keep only categories/skills matched by include';
    static readonly weightSkillsWithoutGraph =
      'sort skills by weight directly when no graph is provided';
    static readonly weightSkillsWithGraph =
      'sort skills by weight * graph years when a graph is provided';
    static readonly truncateSkillsByMaxDisplayed =
      'truncate skills after sorting';
    static readonly extractSkillHighlights =
      'collect skillHighlights from weight entries with highlight: true';
    static readonly matchIrregularSlugsViaDisplayNames =
      'match irregular slugs (e.g. "dotnet-8") via graph.displayNames instead of the slugify heuristic';
    static readonly reorderExperienceByWeight =
      'reorder experience entries by weight (desc)';
    static readonly hideExperienceByCompany =
      'filter out hidden experience companies';
    static readonly truncateExperienceByMaxDisplayed =
      'truncate experience after sorting';
    static readonly reorderEngagementsByWeight =
      'reorder engagements within an experience by engagementWeights';
    static readonly overrideHeadlineAndSummary =
      'override headline and summary when the persona defines them';
    static readonly passThroughTechnologyHighlightsAndMeta =
      'pass technologyHighlights and meta through unchanged';
    static readonly attachSectionOrder =
      'attach sectionOrder metadata when the persona sets it';
  }

  describe('DEFAULT_PERSONA (backward compatibility) @critical', () => {
    it(`${should.matchUnmodifiedProfile}`, () => {
      const profile = validSnapshot();
      const graph = validGraph();

      const projected = projectProfile(profile, graph, DEFAULT_PERSONA);

      expect(projected.skills).toEqual(profile.skills);
      expect(projected.experience).toEqual(profile.experience);
      expect(projected.headline).toBe(profile.headline);
      expect(projected.summary).toBe(profile.summary);
      expect(projected.name).toBe(profile.name);
      expect(projected.sectionOrder).toBeUndefined();
      expect(projected.skillHighlights).toBeUndefined();
    });

    it(`${should.attachPersonaId}`, () => {
      const projected = projectProfile(
        validSnapshot(),
        validGraph(),
        DEFAULT_PERSONA,
      );

      expect(projected.personaId).toBe('default');
    });

    it('is a pure no-op even with a null graph', () => {
      const profile = validSnapshot();

      const projected = projectProfile(profile, null, DEFAULT_PERSONA);

      expect(projected.skills).toEqual(profile.skills);
      expect(projected.experience).toEqual(profile.experience);
    });
  });

  describe('skills projection @critical', () => {
    it(`${should.reorderSkillsByPriority}`, () => {
      const config = persona({ skills: { priority: ['openai-api'] } });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      const aiCategory = projected.skills.find(
        (c) => c.category === 'AI Engineering',
      );

      expect(aiCategory?.skills).toEqual(['OpenAI API', 'LangChain']);
    });

    it(`${should.filterSkillsByExclude}`, () => {
      const config = persona({ skills: { exclude: ['openai-api'] } });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      const aiCategory = projected.skills.find(
        (c) => c.category === 'AI Engineering',
      );

      expect(aiCategory?.skills).toEqual(['LangChain']);
    });

    it(`${should.dropEmptyCategoryAfterExclude}`, () => {
      const config = persona({
        skills: { exclude: ['langchain', 'openai-api'] },
      });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      expect(
        projected.skills.find((c) => c.category === 'AI Engineering'),
      ).toBeUndefined();
    });

    it(`${should.filterSkillsByIncludeCategory}`, () => {
      const config = persona({ skills: { include: ['AI Engineering'] } });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      expect(projected.skills).toEqual([
        { category: 'AI Engineering', skills: ['LangChain', 'OpenAI API'] },
      ]);
    });

    it(`${should.weightSkillsWithoutGraph}`, () => {
      const config = persona({
        skills: { weights: { langchain: 0.3, 'openai-api': 0.9 } },
      });

      const projected = projectProfile(validSnapshot(), null, config);

      const aiCategory = projected.skills.find(
        (c) => c.category === 'AI Engineering',
      );

      expect(aiCategory?.skills).toEqual(['OpenAI API', 'LangChain']);
    });

    it(`${should.weightSkillsWithGraph}`, () => {
      // Both weighted equally, but "typescript" (in Languages) has 5 graph
      // years vs "javascript"'s 1 -> typescript should sort first even
      // though it starts later in the source array.
      const config = persona({
        skills: { weights: { typescript: 0.5, javascript: 0.5 } },
      });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      const languages = projected.skills.find(
        (c) => c.category === 'Languages',
      );

      expect(languages?.skills).toEqual(['TypeScript', 'JavaScript']);
    });

    it(`${should.truncateSkillsByMaxDisplayed}`, () => {
      const config = persona({ skills: { maxDisplayed: 1 } });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      const totalSkills = projected.skills.reduce(
        (sum, c) => sum + c.skills.length,
        0,
      );

      expect(totalSkills).toBe(1);
    });

    it(`${should.extractSkillHighlights}`, () => {
      const config = persona({
        skills: { weights: { langchain: { weight: 1, highlight: true } } },
      });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      expect(projected.skillHighlights).toEqual(['LangChain']);
    });

    it(`${should.matchIrregularSlugsViaDisplayNames}`, () => {
      // "dotnet-8" -slugify-> "dotnet-8", but ".NET 8" -slugify-> "net-8" —
      // the heuristic alone would never match these. Only the exact
      // graph.displayNames lookup resolves it.
      const config = persona({
        skills: {
          priority: ['dotnet-8'],
          weights: { csharp: { weight: 1, highlight: true } },
        },
      });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      const backendCategory = projected.skills.find(
        (c) => c.category === 'Backend Frameworks',
      );

      expect(backendCategory?.skills).toEqual(['.NET 8', 'C#']);
      expect(projected.skillHighlights).toEqual(['C#']);
    });

    it('falls back to the slugify heuristic when displayNames is absent from the graph', () => {
      const graphWithoutDisplayNames = serializedGraphSchema.parse({
        bySkill: {},
        byExperience: {},
        byProject: {},
      });
      const config = persona({ skills: { exclude: ['openai-api'] } });

      const projected = projectProfile(
        validSnapshot(),
        graphWithoutDisplayNames,
        config,
      );

      const aiCategory = projected.skills.find(
        (c) => c.category === 'AI Engineering',
      );

      expect(aiCategory?.skills).toEqual(['LangChain']);
    });
  });

  describe('experience projection @critical', () => {
    it(`${should.reorderExperienceByWeight}`, () => {
      const config = persona({
        experience: {
          weights: { 'Ramsal Software': 1, PwC: 0.5, Globant: 0.1 },
        },
      });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      expect(projected.experience.map((e) => e.company)).toEqual([
        'Ramsal Software',
        'PwC',
        'Globant',
      ]);
    });

    it(`${should.hideExperienceByCompany}`, () => {
      const config = persona({ experience: { hide: ['Ramsal Software'] } });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      expect(projected.experience.map((e) => e.company)).toEqual([
        'PwC',
        'Globant',
      ]);
    });

    it(`${should.truncateExperienceByMaxDisplayed}`, () => {
      const config = persona({ experience: { maxDisplayed: 2 } });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      expect(projected.experience).toHaveLength(2);
    });

    it('falls back to startDate desc when weights tie', () => {
      const config = persona({ experience: {} });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      expect(projected.experience.map((e) => e.company)).toEqual([
        'PwC',
        'Globant',
        'Ramsal Software',
      ]);
    });

    it(`${should.reorderEngagementsByWeight}`, () => {
      const config = persona({
        experience: { engagementWeights: { 'Internal Tooling': 1 } },
      });

      const projected = projectProfile(validSnapshot(), validGraph(), config);
      const pwc = projected.experience.find((e) => e.company === 'PwC');

      expect(pwc?.engagements?.map((e) => e.title)).toEqual([
        'Internal Tooling',
        'Enterprise AI Conversational Platform',
      ]);
    });
  });

  describe('headline, summary, and pass-through metadata @smoke', () => {
    it(`${should.overrideHeadlineAndSummary}`, () => {
      const config = persona({
        headline: 'AI Engineer',
        summary: 'Builds AI platforms.',
      });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      expect(projected.headline).toBe('AI Engineer');
      expect(projected.summary).toBe('Builds AI platforms.');
    });

    it(`${should.passThroughTechnologyHighlightsAndMeta}`, () => {
      const config = persona({
        technologyHighlights: ['LangChain', 'RAG'],
        meta: { description: 'AI-focused view', ogTitle: 'AI Engineer' },
      });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      expect(projected.technologyHighlights).toEqual(['LangChain', 'RAG']);
      expect(projected.meta).toEqual({
        description: 'AI-focused view',
        ogTitle: 'AI Engineer',
      });
    });

    it(`${should.attachSectionOrder}`, () => {
      const config = persona({ sectionOrder: ['summary', 'skills'] });

      const projected = projectProfile(validSnapshot(), validGraph(), config);

      expect(projected.sectionOrder).toEqual(['summary', 'skills']);
    });
  });
});
