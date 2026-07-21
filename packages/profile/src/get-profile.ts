import { join } from 'node:path';
import { type ProfileData } from './schema';
import { parseContent } from './parser';

const CONTENT_DIR = join(__dirname, '..', 'content');

let cached: ProfileData | null = null;

export function getProfile(): ProfileData {
  if (cached) return cached;

  // parseContent() already validates against profileSchema internally —
  // re-parsing here would break the description field's Zod transform.
  cached = parseContent(CONTENT_DIR);

  return cached;
}
