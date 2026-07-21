import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildProfileGraph, type ProfileGraph } from '../link-resolver';
import { chunkContent, type ChunkMetadata } from './chunker';

const MODEL_NAME = 'all-MiniLM-L6-v2';
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const DIMENSIONS = 384;
const INDEX_VERSION = 1;

export interface ProfileIndex {
  version: number;
  generatedAt: string;
  model: string;
  dimensions: number;
  chunks: Array<{
    id: string;
    text: string;
    metadata: ChunkMetadata;
    embedding: number[];
  }>;
  graph: {
    bySkill: Record<
      string,
      { experiences: string[]; projects: string[]; years: number }
    >;
    byExperience: Record<string, string[]>;
    byProject: Record<string, string[]>;
  };
}

function serializeGraph(graph: ProfileGraph): ProfileIndex['graph'] {
  return {
    bySkill: Object.fromEntries(
      [...graph.bySkill.entries()].map(([slug, stats]) => [
        slug,
        {
          experiences: [...stats.experiences],
          projects: [...stats.projects],
          years: stats.years,
        },
      ]),
    ),
    byExperience: Object.fromEntries(
      [...graph.byExperience.entries()].map(([company, skills]) => [
        company,
        [...skills],
      ]),
    ),
    byProject: Object.fromEntries(
      [...graph.byProject.entries()].map(([project, technologies]) => [
        project,
        [...technologies],
      ]),
    ),
  };
}

/**
 * Builds `profile-index.json`: chunks + 384-dim embeddings (all-MiniLM-L6-v2
 * via `@huggingface/transformers`) + the serialized profile graph. Run via
 * `pnpm --filter @vh/profile run embed`. Not imported by app code — the
 * model download (~45MB, first run only) and `@huggingface/transformers`
 * dependency must never reach the browser-safe `index.ts` export surface.
 */
export async function generateIndex(
  contentDir: string,
  outputPath: string,
): Promise<void> {
  const chunks = chunkContent(contentDir);
  const graph = buildProfileGraph(contentDir);

  // Dynamic import: @huggingface/transformers is an ESM-only package.
  // A static `import` would compile to `require()` under this package's
  // CommonJS module output — dynamic `import()` works from CJS regardless.
  const { pipeline } = await import('@huggingface/transformers');
  const extractor = await pipeline('feature-extraction', MODEL_ID);

  const embeddedChunks: ProfileIndex['chunks'] = [];

  for (const chunk of chunks) {
    // pooling: 'mean' collapses the token dimension, so dims === [1, DIMENSIONS]
    // and the flat `.data` buffer already holds exactly one embedding.
    const output = await extractor(chunk.text, {
      pooling: 'mean',
      normalize: true,
    });

    embeddedChunks.push({
      id: chunk.id,
      text: chunk.text,
      metadata: chunk.metadata,
      embedding: Array.from(output.data as Float32Array),
    });
  }

  const index: ProfileIndex = {
    version: INDEX_VERSION,
    generatedAt: new Date().toISOString(),
    model: MODEL_NAME,
    dimensions: DIMENSIONS,
    chunks: embeddedChunks,
    graph: serializeGraph(graph),
  };

  writeFileSync(outputPath, JSON.stringify(index, null, 2));
}

if (require.main === module) {
  const contentDir = join(__dirname, '../../content');
  const outputPath = join(__dirname, '../../profile-index.json');

  generateIndex(contentDir, outputPath)
    .then(() => console.log('profile-index.json generated'))
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
