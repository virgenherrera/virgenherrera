import { join } from 'node:path';
import { type ProfileData, type SkillCategoryData } from './schema';
import { parseContent, parseRadarSkills } from './parser';

const CONTENT_DIR = join(__dirname, '..', 'content');

let cached: ProfileData | null = null;
let cachedRadarSkills: readonly SkillCategoryData[] | null = null;

export function getProfile(): ProfileData {
  if (cached) return cached;

  // parseContent() already validates against profileSchema internally —
  // re-parsing here would break the description field's Zod transform.
  cached = parseContent(CONTENT_DIR);

  return cached;
}

/**
 * Radar-eligible subset of the skills registry, grouped by category —
 * excludes children/niche skills marked `radar: false`. Consumed by the
 * skills radar chart only; `getProfile().skills` remains the full,
 * unfiltered set for every other consumer (resume app, PDF generator,
 * README skills table).
 */
export function getRadarSkills(): readonly SkillCategoryData[] {
  if (cachedRadarSkills) return cachedRadarSkills;

  cachedRadarSkills = parseRadarSkills(CONTENT_DIR);

  return cachedRadarSkills;
}
