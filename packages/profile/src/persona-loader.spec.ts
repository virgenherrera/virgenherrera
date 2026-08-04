import { vol } from 'memfs';
import { loadPersona, loadPersonas } from './persona-loader';

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
jest.mock('node:fs', () => require('memfs').fs);
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */

describe('UT: persona-loader', () => {
  class should {
    static readonly loadAllPersonas =
      'load every *.yaml persona in the directory';
    static readonly resolveExtendsChain =
      'resolve an "extends" chain, child fields winning';
    static readonly mergeNestedSkillsAndExperience =
      'shallow-merge nested skills/experience/meta objects across an extends chain';
    static readonly loadSinglePersonaById =
      'load a single persona by id via loadPersona';
    static readonly throwOnMissingPersona =
      'throw a descriptive error when loadPersona is given an unknown id';
    static readonly throwOnMissingExtendsTarget =
      'throw a descriptive error when "extends" references a persona id that does not exist';
    static readonly throwOnCircularExtends =
      'throw a descriptive error on a circular extends chain';
    static readonly throwOnDuplicateId =
      'throw a descriptive error on a duplicate persona id';
    static readonly throwOnInvalidSchema =
      'throw when a persona file fails personaSchema validation';
    static readonly ignoreNonYamlFiles =
      'ignore non-.yaml files in the personas directory';
  }

  afterEach(() => vol.reset());

  describe('loadPersonas @smoke', () => {
    beforeEach(() => {
      vol.fromJSON({
        '/personas/default.yaml': `id: default
label: Default
sectionOrder: [summary, experience, skills]`,
        '/personas/ai-engineer.yaml': `id: ai-engineer
label: AI Engineer
extends: default
headline: AI/LLM Engineer
skills:
  priority: [langchain]
experience:
  weights:
    PwC: 1`,
      });
    });

    it(`${should.loadAllPersonas}`, () => {
      const personas = loadPersonas('/personas');

      expect(personas.size).toBe(2);
      expect(personas.has('default')).toBe(true);
      expect(personas.has('ai-engineer')).toBe(true);
    });

    it(`${should.resolveExtendsChain}`, () => {
      const personas = loadPersonas('/personas');
      const aiEngineer = personas.get('ai-engineer');

      expect(aiEngineer?.headline).toBe('AI/LLM Engineer');
      // Inherited from "default" (not redefined on ai-engineer.yaml).
      expect(aiEngineer?.sectionOrder).toEqual([
        'summary',
        'experience',
        'skills',
      ]);
    });

    it(`${should.mergeNestedSkillsAndExperience}`, () => {
      const personas = loadPersonas('/personas');
      const aiEngineer = personas.get('ai-engineer');

      expect(aiEngineer?.skills?.priority).toEqual(['langchain']);
      expect(aiEngineer?.experience?.weights).toEqual({ PwC: 1 });
    });

    it(`${should.loadSinglePersonaById}`, () => {
      const result = loadPersona('/personas', 'ai-engineer');

      expect(result.id).toBe('ai-engineer');
      expect(result.headline).toBe('AI/LLM Engineer');
    });

    it(`${should.ignoreNonYamlFiles}`, () => {
      vol.fromJSON({ '/personas/README.md': '# not a persona' });

      const personas = loadPersonas('/personas');

      expect(personas.size).toBe(2);
    });
  });

  describe('loadPersonas (nested override merge) @critical', () => {
    it(`${should.mergeNestedSkillsAndExperience} (parent fields preserved when child omits them)`, () => {
      vol.fromJSON({
        '/personas/default.yaml': `id: default
label: Default
skills:
  exclude: [php]
experience:
  hide: [Ramsal Software]`,
        '/personas/child.yaml': `id: child
label: Child
extends: default
skills:
  priority: [langchain]`,
      });

      const child = loadPersonas('/personas').get('child');

      // Own field is present...
      expect(child?.skills?.priority).toEqual(['langchain']);
      // ...and the parent's sibling field under the same nested object
      // survives the shallow merge instead of being wiped out.
      expect(child?.skills?.exclude).toEqual(['php']);
      expect(child?.experience?.hide).toEqual(['Ramsal Software']);
    });
  });

  describe('loadPersonas (error cases) @critical', () => {
    it(`${should.throwOnMissingPersona}`, () => {
      vol.fromJSON({
        '/personas/default.yaml': 'id: default\nlabel: Default',
      });

      expect(() => loadPersona('/personas', 'does-not-exist')).toThrow(
        /does-not-exist/,
      );
    });

    it(`${should.throwOnMissingExtendsTarget}`, () => {
      vol.fromJSON({
        '/personas/orphan.yaml': 'id: orphan\nlabel: Orphan\nextends: ghost',
      });

      expect(() => loadPersonas('/personas')).toThrow(/ghost/);
    });

    it(`${should.throwOnCircularExtends}`, () => {
      vol.fromJSON({
        '/personas/a.yaml': 'id: a\nlabel: A\nextends: b',
        '/personas/b.yaml': 'id: b\nlabel: B\nextends: a',
      });

      expect(() => loadPersonas('/personas')).toThrow(/circular/i);
    });

    it(`${should.throwOnDuplicateId}`, () => {
      vol.fromJSON({
        '/personas/one.yaml': 'id: default\nlabel: One',
        '/personas/two.yaml': 'id: default\nlabel: Two',
      });

      expect(() => loadPersonas('/personas')).toThrow(/duplicate/i);
    });

    it(`${should.throwOnInvalidSchema}`, () => {
      vol.fromJSON({
        '/personas/bad.yaml': 'id: Not Valid Id\nlabel: Bad',
      });

      expect(() => loadPersonas('/personas')).toThrow();
    });
  });
});
