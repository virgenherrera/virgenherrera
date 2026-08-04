import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildProfileGraph, type ProfileGraph } from '../link-resolver';
import { parseContent } from '../parser';
import { loadPersona } from '../persona-loader';
import { projectProfile } from '../persona-projector';
import type { ProfileSnapshotData, SerializedProfileGraph } from '../schema';

const DEFAULT_PERSONA_ID = 'default';

/**
 * Reads `--persona <id>` from `argv` (defaults to `'default'`). Accepts
 * both `--persona ai-engineer` and `--persona=ai-engineer`.
 */
function readPersonaFlag(argv: readonly string[]): string {
  const eqFlag = argv.find((arg) => arg.startsWith('--persona='));

  if (eqFlag) {
    return eqFlag.slice('--persona='.length);
  }

  const flagIndex = argv.indexOf('--persona');

  if (flagIndex !== -1 && argv[flagIndex + 1]) {
    return argv[flagIndex + 1];
  }

  return DEFAULT_PERSONA_ID;
}

function snapshotFileName(personaId: string): string {
  return personaId === DEFAULT_PERSONA_ID
    ? 'profile-snapshot.json'
    : `profile-snapshot.${personaId}.json`;
}

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
 *
 * Accepts an optional `--persona <id>` flag (default: `'default'`) to
 * project the snapshot through `packages/profile/personas/<id>.yaml`
 * before writing it out. The default persona writes the unchanged
 * `profile-snapshot.json` filename for backward compatibility; any other
 * persona writes `profile-snapshot.<id>.json` alongside it.
 */
function main(): void {
  const contentDir = join(__dirname, '../../content');
  const personasDir = join(__dirname, '../../personas');
  const personaId = readPersonaFlag(process.argv.slice(2));
  const fileName = snapshotFileName(personaId);
  const outputPath = join(__dirname, '../../', fileName);

  const profile = parseContent(contentDir);
  const graph = serializeGraph(buildProfileGraph(contentDir));

  const { email, phone, ...publicProfile } = profile;
  const snapshot: ProfileSnapshotData = { ...publicProfile, graph };

  const persona = loadPersona(personasDir, personaId);
  const projected = projectProfile(snapshot, graph, persona);

  writeFileSync(outputPath, JSON.stringify(projected, null, 2));
  console.log(`${fileName} generated (persona: ${personaId})`);
}

if (require.main === module) {
  main();
}
