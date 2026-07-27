import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildProfileGraph, type ProfileGraph } from '../link-resolver';
import { parseContent } from '../parser';
import type { SerializedProfileGraph } from '../schema';

function serializeGraph(graph: ProfileGraph): SerializedProfileGraph {
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
 * Generates `profile-snapshot.json` — a pre-built, PII-free JSON export of
 * the profile content consumed by the Angular SSG build. Run via
 * `pnpm --filter @vh/profile run export`.
 */
function main(): void {
  const contentDir = join(__dirname, '../../content');
  const outputPath = join(__dirname, '../../profile-snapshot.json');
  const profile = parseContent(contentDir);
  const graph = serializeGraph(buildProfileGraph(contentDir));

  const { email, phone, ...publicProfile } = profile;

  writeFileSync(
    outputPath,
    JSON.stringify({ ...publicProfile, graph }, null, 2),
  );
  console.log('profile-snapshot.json generated');
}

if (require.main === module) {
  main();
}
