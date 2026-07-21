import type { ProfileIndex } from './embedder';
import type { Chunk } from './chunker';

export interface RetrievalResult {
  chunk: Chunk;
  score: number;
  expandedSkills?: string[];
}

export interface RetrievalOptions {
  topK?: number;
  skillFilter?: string[];
  expandGraph?: boolean;
}

const DEFAULT_TOP_K = 5;
const SKILL_FILTER_BOOST = 0.1;
const QUERY_MENTION_BOOST = 0.05;
const GRAPH_EXPANSION_SCORE_PENALTY = 0.5;

/**
 * `ProfileIndex["chunks"][number]` already has the same `{ id, text,
 * metadata, embedding }` shape a `Chunk` + embedding would have — this
 * narrows it back to the `{ chunk, embedding }` pair the retriever needs.
 */
function toChunk(entry: ProfileIndex['chunks'][number]): Chunk {
  return { id: entry.id, text: entry.text, metadata: entry.metadata };
}

/**
 * Normalizes a string for identity comparison between graph node names
 * (raw, e.g. "Gamma") and chunk metadata (slugified, e.g.
 * "projects.yaml#gamma") — lowercases and strips all non-alphanumerics so
 * casing/punctuation differences never cause a false negative.
 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Step 1 — metadata filter/boost: chunks whose `metadata.skills` overlap
 * with `skillFilter`, or whose skill display names / company are literally
 * mentioned in the query text, get a small additive boost before ranking.
 */
function metadataBoost(
  entry: ProfileIndex['chunks'][number],
  query: string,
  skillFilter: readonly string[],
): number {
  let boost = 0;
  const lowerQuery = query.toLowerCase();

  if (skillFilter.length > 0) {
    const overlaps = entry.metadata.skills.some((slug) =>
      skillFilter.includes(slug),
    );

    if (overlaps) {
      boost += SKILL_FILTER_BOOST;
    }
  }

  const mentionsSkill = entry.metadata.skills.some((slug) =>
    lowerQuery.includes(slug.toLowerCase()),
  );
  const mentionsCompany =
    entry.metadata.company !== undefined &&
    lowerQuery.includes(entry.metadata.company.toLowerCase());

  if (mentionsSkill || mentionsCompany) {
    boost += QUERY_MENTION_BOOST;
  }

  return boost;
}

/**
 * Step 3 — conditional 1-hop graph expansion: for each of the top results,
 * look up its skills in `index.graph.bySkill` and pull in sibling
 * experiences/projects not already present, scored below the weakest
 * direct hit so they only ever supplement — never outrank — real matches.
 */
function expandViaGraph(
  index: ProfileIndex,
  topResults: readonly RetrievalResult[],
  chunkById: ReadonlyMap<string, RetrievalResult>,
  alreadyIncluded: ReadonlySet<string>,
): RetrievalResult[] {
  const weakestScore = topResults.reduce(
    (min, result) => Math.min(min, result.score),
    topResults[0]?.score ?? 0,
  );
  const expandedScore = weakestScore * GRAPH_EXPANSION_SCORE_PENALTY;
  const expansions = new Map<string, RetrievalResult>();

  for (const result of topResults) {
    for (const slug of result.chunk.metadata.skills) {
      const stats = index.graph.bySkill[slug];

      if (!stats) {
        continue;
      }

      const relatedNames = [...stats.experiences, ...stats.projects];

      for (const name of relatedNames) {
        const normalizedName = normalize(name);

        for (const candidate of chunkById.values()) {
          const { metadata } = candidate.chunk;
          const matchesName =
            (metadata.company !== undefined &&
              normalize(metadata.company) === normalizedName) ||
            normalize(metadata.source).includes(normalizedName);

          if (
            !matchesName ||
            alreadyIncluded.has(candidate.chunk.id) ||
            expansions.has(candidate.chunk.id)
          ) {
            continue;
          }

          expansions.set(candidate.chunk.id, {
            chunk: candidate.chunk,
            score: expandedScore,
            expandedSkills: [slug],
          });
        }
      }
    }
  }

  return [...expansions.values()];
}

/**
 * Builds a retriever over a pre-computed `ProfileIndex` (see `embedder.ts`).
 * 3-step pipeline (D7): metadata filter/boost -> cosine similarity ->
 * conditional 1-hop graph expansion.
 */
export function createRetriever(index: ProfileIndex): {
  retrieve: (
    query: string,
    embedding: number[],
    options?: RetrievalOptions,
  ) => RetrievalResult[];
} {
  return {
    retrieve(
      query: string,
      embedding: number[],
      options: RetrievalOptions = {},
    ): RetrievalResult[] {
      const topK = options.topK ?? DEFAULT_TOP_K;
      const skillFilter = options.skillFilter ?? [];

      const scored: RetrievalResult[] = index.chunks.map((entry) => ({
        chunk: toChunk(entry),
        score:
          cosineSimilarity(embedding, entry.embedding) +
          metadataBoost(entry, query, skillFilter),
      }));

      const ranked = [...scored].sort((a, b) => b.score - a.score);
      const topResults = ranked.slice(0, topK);

      if (!options.expandGraph) {
        return topResults;
      }

      const chunkById = new Map(
        scored.map((result) => [result.chunk.id, result]),
      );
      const alreadyIncluded = new Set(
        topResults.map((result) => result.chunk.id),
      );
      const expansions = expandViaGraph(
        index,
        topResults,
        chunkById,
        alreadyIncluded,
      );

      return [...topResults, ...expansions];
    },
  };
}
