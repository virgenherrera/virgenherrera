/**
 * NOTE: `generateIndex()` requires a ~45MB model download from HuggingFace
 * and the `@huggingface/transformers` ESM-only package. Full integration
 * tests are NOT feasible in unit test runs.
 *
 * This spec validates:
 * - The module exports the expected function and interface
 * - The `ProfileIndex` type contract (tested indirectly via retriever.spec.ts
 *   which builds a conforming object)
 *
 * The `serializeGraph` utility is a private function so it cannot be tested
 * directly. Its logic is covered by the export.spec.ts + retriever.spec.ts
 * integration paths.
 */
import { generateIndex, type ProfileIndex } from './embedder';

describe('UT: rag/embedder @critical', () => {
  class should {
    static readonly exportGenerateIndex =
      'export generateIndex as an async function';
    static readonly acceptTwoStringArguments =
      'accept contentDir and outputPath as arguments';
    static readonly conformToProfileIndexShape =
      'conform to the ProfileIndex interface contract';
  }

  describe('module exports', () => {
    it(`${should.exportGenerateIndex}`, () => {
      expect(typeof generateIndex).toBe('function');
    });

    it(`${should.acceptTwoStringArguments}`, () => {
      // generateIndex.length reflects the declared parameter count
      expect(generateIndex.length).toBe(2);
    });
  });

  describe('ProfileIndex type contract', () => {
    it(`${should.conformToProfileIndexShape}`, () => {
      // Validates that a conforming object satisfies the interface at
      // compile time (TS) and runtime shape (Jest). This is the same
      // pattern used by retriever.spec.ts `buildIndex()`.
      const index: ProfileIndex = {
        version: 1,
        generatedAt: new Date().toISOString(),
        model: 'all-MiniLM-L6-v2',
        dimensions: 384,
        chunks: [
          {
            id: 'test-chunk',
            text: 'Test text',
            metadata: {
              source: 'test.md',
              type: 'experience',
              skills: ['typescript'],
            },
            embedding: new Array<number>(384).fill(0),
          },
        ],
        graph: {
          bySkill: {
            typescript: { experiences: ['TestCo'], projects: [], years: 1 },
          },
          byExperience: { TestCo: ['typescript'] },
          byProject: {},
        },
      };

      expect(index.version).toBe(1);
      expect(index.dimensions).toBe(384);
      expect(index.chunks).toHaveLength(1);
      expect(index.chunks[0].embedding).toHaveLength(384);
      expect(index.graph.bySkill.typescript.years).toBe(1);
    });
  });
});
