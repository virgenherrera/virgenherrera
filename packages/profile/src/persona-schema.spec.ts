import {
  personaSchema,
  sectionIdSchema,
  weightedSkillSchema,
} from './persona-schema';

function validPersona() {
  return {
    id: 'ai-engineer',
    label: 'AI Engineer',
  };
}

describe('UT: persona-schema', () => {
  class should {
    static readonly parseMinimalPersona =
      'parse a persona with only id and label';
    static readonly parseFullPersona =
      'parse a persona with every optional field set';
    static readonly rejectInvalidId =
      'reject an id that does not match ^[a-z0-9-]+$';
    static readonly rejectEmptyLabel = 'reject an empty label';
    static readonly rejectHeadlineOverMaxLength =
      'reject a headline over 220 characters';
    static readonly rejectSummaryOverMaxLength =
      'reject a summary over 2600 characters';
    static readonly rejectInvalidSectionId =
      'reject a sectionOrder entry not in sectionIdSchema';
    static readonly rejectSkillWeightOutOfRange =
      'reject a skills.weights entry outside [0, 1]';
    static readonly defaultWeightObjectHighlightToFalse =
      'default the object form of weightedSkillSchema.highlight to false';
    static readonly acceptBareNumberWeight =
      'accept a bare number as a weighted skill';
    static readonly rejectNonPositiveMaxDisplayed =
      'reject a non-positive skills.maxDisplayed';
    static readonly rejectExperienceWeightOutOfRange =
      'reject an experience.weights entry outside [0, 1]';
    static readonly acceptExtendsReference =
      'accept an "extends" reference to another persona id';
    static readonly rejectTooManyTechnologyHighlights =
      'reject more than 12 technologyHighlights';
  }

  describe('personaSchema (valid) @smoke', () => {
    it(`${should.parseMinimalPersona}`, () => {
      const result = personaSchema.parse(validPersona());

      expect(result.id).toBe('ai-engineer');
      expect(result.label).toBe('AI Engineer');
      expect(result.extends).toBeUndefined();
    });

    it(`${should.parseFullPersona}`, () => {
      const full = {
        ...validPersona(),
        extends: 'default',
        headline: 'AI/LLM Engineer',
        summary: 'Builds AI-powered platforms.',
        sectionOrder: ['summary', 'skills', 'experience'],
        skills: {
          priority: ['langchain'],
          weights: { langchain: { weight: 1, highlight: true }, nodejs: 0.5 },
          include: ['AI & Integrations'],
          exclude: ['php'],
          maxDisplayed: 10,
        },
        experience: {
          weights: { PwC: 1 },
          engagementWeights: { 'Enterprise AI Conversational Platform': 1 },
          hide: ['Ramsal Software'],
          maxDisplayed: 5,
        },
        technologyHighlights: ['LangChain', 'RAG'],
        meta: { description: 'AI-focused view', ogTitle: 'AI Engineer' },
      };

      const result = personaSchema.parse(full);

      expect(result.extends).toBe('default');
      expect(result.skills?.weights?.langchain).toEqual({
        weight: 1,
        highlight: true,
      });
      expect(result.skills?.weights?.nodejs).toBe(0.5);
      expect(result.experience?.hide).toEqual(['Ramsal Software']);
      expect(result.meta?.ogTitle).toBe('AI Engineer');
    });

    it(`${should.acceptExtendsReference}`, () => {
      const result = personaSchema.parse({
        ...validPersona(),
        extends: 'default',
      });

      expect(result.extends).toBe('default');
    });
  });

  describe('personaSchema (rejection cases) @critical', () => {
    it(`${should.rejectInvalidId}`, () => {
      expect(() =>
        personaSchema.parse({ ...validPersona(), id: 'AI Engineer' }),
      ).toThrow();
    });

    it(`${should.rejectEmptyLabel}`, () => {
      expect(() =>
        personaSchema.parse({ ...validPersona(), label: '' }),
      ).toThrow();
    });

    it(`${should.rejectHeadlineOverMaxLength}`, () => {
      const input = { ...validPersona(), headline: 'x'.repeat(221) };

      expect(() => personaSchema.parse(input)).toThrow();
    });

    it(`${should.rejectSummaryOverMaxLength}`, () => {
      const input = { ...validPersona(), summary: 'x'.repeat(2601) };

      expect(() => personaSchema.parse(input)).toThrow();
    });

    it(`${should.rejectInvalidSectionId}`, () => {
      const input = {
        ...validPersona(),
        sectionOrder: ['summary', 'not-a-section'],
      };

      expect(() => personaSchema.parse(input)).toThrow();
    });

    it(`${should.rejectSkillWeightOutOfRange}`, () => {
      const input = {
        ...validPersona(),
        skills: { weights: { langchain: 1.5 } },
      };

      expect(() => personaSchema.parse(input)).toThrow();
    });

    it(`${should.rejectNonPositiveMaxDisplayed}`, () => {
      const input = { ...validPersona(), skills: { maxDisplayed: 0 } };

      expect(() => personaSchema.parse(input)).toThrow();
    });

    it(`${should.rejectExperienceWeightOutOfRange}`, () => {
      const input = {
        ...validPersona(),
        experience: { weights: { PwC: -0.1 } },
      };

      expect(() => personaSchema.parse(input)).toThrow();
    });

    it(`${should.rejectTooManyTechnologyHighlights}`, () => {
      const input = {
        ...validPersona(),
        technologyHighlights: Array.from({ length: 13 }, (_, i) => `tech-${i}`),
      };

      expect(() => personaSchema.parse(input)).toThrow();
    });
  });

  describe('sectionIdSchema @smoke', () => {
    it('accepts every documented section id', () => {
      const ids = [
        'summary',
        'experience',
        'skills',
        'projects',
        'education',
        'certifications',
        'languages',
        'links',
      ];

      for (const id of ids) {
        expect(() => sectionIdSchema.parse(id)).not.toThrow();
      }
    });

    it('rejects an unknown section id', () => {
      expect(() => sectionIdSchema.parse('unknown-section')).toThrow();
    });
  });

  describe('weightedSkillSchema @smoke', () => {
    it(`${should.acceptBareNumberWeight}`, () => {
      expect(weightedSkillSchema.parse(0.7)).toBe(0.7);
    });

    it(`${should.defaultWeightObjectHighlightToFalse}`, () => {
      const result = weightedSkillSchema.parse({ weight: 0.7 });

      expect(result).toEqual({ weight: 0.7, highlight: false });
    });
  });
});
