import { createRetriever } from './retriever';
import type { ProfileIndex } from './embedder';

/** Deterministic fake 384-dim unit vectors — unit tests never load the real model. */
function fakeEmbedding(seed: number): number[] {
  const vector = new Array<number>(384).fill(0);

  vector[seed % 384] = 1;

  return vector;
}

function buildIndex(): ProfileIndex {
  return {
    version: 1,
    generatedAt: new Date(0).toISOString(),
    model: 'all-MiniLM-L6-v2',
    dimensions: 384,
    chunks: [
      {
        id: 'experience-alpha',
        text: '[Skills: TypeScript, NestJS]\n[Context: Engineer at AlphaCo, 2020-01 to 2021-01]\nBuilt backend services.',
        metadata: {
          source: 'experience/01-alpha.md',
          type: 'experience',
          skills: ['typescript', 'nestjs'],
          company: 'AlphaCo',
          role: 'Engineer',
          startDate: '2020-01',
          endDate: '2021-01',
        },
        embedding: fakeEmbedding(0),
      },
      {
        id: 'experience-beta',
        text: '[Skills: Docker]\n[Context: DevOps at BetaCo, 2021-01-present]\nRan infrastructure.',
        metadata: {
          source: 'experience/02-beta.md',
          type: 'experience',
          skills: ['docker'],
          company: 'BetaCo',
          role: 'DevOps',
          startDate: '2021-01',
        },
        embedding: fakeEmbedding(1),
      },
      {
        id: 'project-gamma',
        text: '[Skills: TypeScript]\n[Context: Project — Gamma]\nA typescript side project.',
        metadata: {
          source: 'projects.yaml#gamma',
          type: 'project',
          skills: ['typescript'],
        },
        embedding: fakeEmbedding(2),
      },
      {
        id: 'summary-0',
        text: '[Context: Professional summary]\nGeneral summary text.',
        metadata: { source: 'meta.md', type: 'summary', skills: [] },
        embedding: fakeEmbedding(3),
      },
    ],
    graph: {
      bySkill: {
        typescript: { experiences: ['AlphaCo'], projects: ['Gamma'], years: 2 },
        nestjs: { experiences: ['AlphaCo'], projects: [], years: 2 },
        docker: { experiences: ['BetaCo'], projects: [], years: 1 },
      },
      byExperience: {
        AlphaCo: ['typescript', 'nestjs'],
        BetaCo: ['docker'],
      },
      byProject: {
        Gamma: ['typescript'],
      },
    },
  };
}

describe('UT: retriever', () => {
  class should {
    static readonly scoreIdenticalVectorsAsOne =
      'score identical (normalized) vectors with cosine similarity 1';
    static readonly scoreOrthogonalVectorsAsZero =
      'score orthogonal vectors with cosine similarity 0';
    static readonly rankByCosineSimilarity =
      'rank results by cosine similarity to the query embedding';
    static readonly boostSkillFilterMatches =
      'boost chunks whose metadata.skills overlap with skillFilter';
    static readonly limitToTopK = 'limit results to topK';
    static readonly defaultTopKToFive = 'default topK to 5 when not provided';
    static readonly expandGraphOnlyWhenRequested =
      'only perform graph expansion when expandGraph is true';
    static readonly expandGraphAddsRelatedSkillChunks =
      'add related experiences/projects via 1-hop graph expansion';
    static readonly expandedResultsScoreBelowDirectHits =
      'score graph-expanded results below the weakest direct hit';
    static readonly expansionDoesNotDuplicateDirectHits =
      'never duplicate a chunk already present in the direct top-K results';
  }

  describe('cosineSimilarity (via retrieve scores)', () => {
    it(`${should.scoreIdenticalVectorsAsOne}`, () => {
      const index = buildIndex();
      const retriever = createRetriever(index);
      const results = retriever.retrieve('query', fakeEmbedding(0), {
        topK: 1,
      });

      expect(results[0].chunk.id).toBe('experience-alpha');
      expect(results[0].score).toBeCloseTo(1, 5);
    });

    it(`${should.scoreOrthogonalVectorsAsZero}`, () => {
      const index = buildIndex();
      const retriever = createRetriever(index);
      const results = retriever.retrieve('query', fakeEmbedding(0), {
        topK: index.chunks.length,
      });
      const orthogonal = results.find((r) => r.chunk.id === 'experience-beta');

      expect(orthogonal?.score).toBeCloseTo(0, 5);
    });
  });

  describe('ranking', () => {
    it(`${should.rankByCosineSimilarity}`, () => {
      const index = buildIndex();
      const retriever = createRetriever(index);
      const results = retriever.retrieve('query', fakeEmbedding(2), {
        topK: index.chunks.length,
      });

      expect(results[0].chunk.id).toBe('project-gamma');
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });
  });

  describe('metadata filter/boost', () => {
    it(`${should.boostSkillFilterMatches}`, () => {
      const index = buildIndex();
      const retriever = createRetriever(index);

      // Query embedding equidistant (orthogonal) from every chunk, so the
      // skillFilter boost is the only thing that can separate scores.
      const neutralEmbedding = new Array<number>(384).fill(0);
      neutralEmbedding[300] = 1;

      const withoutFilter = retriever.retrieve('query', neutralEmbedding, {
        topK: index.chunks.length,
      });
      const withFilter = retriever.retrieve('query', neutralEmbedding, {
        topK: index.chunks.length,
        skillFilter: ['docker'],
      });

      const betaWithout = withoutFilter.find(
        (r) => r.chunk.id === 'experience-beta',
      );
      const betaWith = withFilter.find((r) => r.chunk.id === 'experience-beta');

      expect(betaWith!.score).toBeGreaterThan(betaWithout!.score);
      expect(withFilter[0].chunk.id).toBe('experience-beta');
    });
  });

  describe('topK', () => {
    it(`${should.limitToTopK}`, () => {
      const index = buildIndex();
      const retriever = createRetriever(index);
      const results = retriever.retrieve('query', fakeEmbedding(0), {
        topK: 2,
      });

      expect(results).toHaveLength(2);
    });

    it(`${should.defaultTopKToFive}`, () => {
      const index = buildIndex();
      const retriever = createRetriever(index);
      const results = retriever.retrieve('query', fakeEmbedding(0));

      expect(results.length).toBe(Math.min(5, index.chunks.length));
    });
  });

  describe('graph expansion', () => {
    it(`${should.expandGraphOnlyWhenRequested}`, () => {
      const index = buildIndex();
      const retriever = createRetriever(index);
      const withoutExpansion = retriever.retrieve('query', fakeEmbedding(0), {
        topK: 1,
      });
      const withExpansion = retriever.retrieve('query', fakeEmbedding(0), {
        topK: 1,
        expandGraph: true,
      });

      expect(
        withoutExpansion.every((r) => r.expandedSkills === undefined),
      ).toBe(true);
      expect(withExpansion.length).toBeGreaterThan(withoutExpansion.length);
    });

    it(`${should.expandGraphAddsRelatedSkillChunks}`, () => {
      const index = buildIndex();
      const retriever = createRetriever(index);
      const results = retriever.retrieve('query', fakeEmbedding(0), {
        topK: 1,
        expandGraph: true,
      });
      const expanded = results.filter((r) => r.expandedSkills !== undefined);

      // experience-alpha (typescript, nestjs) graph-expands to project-gamma
      // via the shared "typescript" skill.
      expect(expanded.map((r) => r.chunk.id)).toContain('project-gamma');
      expect(expanded.every((r) => r.expandedSkills!.length > 0)).toBe(true);
    });

    it(`${should.expandedResultsScoreBelowDirectHits}`, () => {
      const index = buildIndex();
      const retriever = createRetriever(index);
      const results = retriever.retrieve('query', fakeEmbedding(0), {
        topK: 1,
        expandGraph: true,
      });
      const direct = results.filter((r) => r.expandedSkills === undefined);
      const expanded = results.filter((r) => r.expandedSkills !== undefined);
      const minDirectScore = Math.min(...direct.map((r) => r.score));

      expect(expanded.every((r) => r.score < minDirectScore)).toBe(true);
    });

    it(`${should.expansionDoesNotDuplicateDirectHits}`, () => {
      const index = buildIndex();
      const retriever = createRetriever(index);
      const results = retriever.retrieve('query', fakeEmbedding(0), {
        topK: index.chunks.length,
        expandGraph: true,
      });
      const ids = results.map((r) => r.chunk.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
