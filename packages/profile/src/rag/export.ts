import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseContent } from '../parser';

/**
 * Generates `profile-snapshot.json` — a pre-built, PII-free JSON export of
 * the profile content consumed by the Angular SSG build. Run via
 * `pnpm --filter @vh/profile run export`.
 */
function main(): void {
  const contentDir = join(__dirname, '../../content');
  const outputPath = join(__dirname, '../../profile-snapshot.json');
  const profile = parseContent(contentDir);

  const { email, phone, ...publicProfile } = profile;

  writeFileSync(outputPath, JSON.stringify(publicProfile, null, 2));
  console.log('profile-snapshot.json generated');
}

if (require.main === module) {
  main();
}
