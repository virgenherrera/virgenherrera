import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { profileSchema, type ProfileData } from './schema';

const DATA_PATH = join(__dirname, 'profile.json');

let cached: ProfileData | null = null;

export function getProfile(): ProfileData {
  if (cached) return cached;

  const raw: unknown = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  cached = profileSchema.parse(raw);

  return cached;
}
