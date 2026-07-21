import { join } from 'node:path';
import { type ProfileData, type PublicProfileData } from './schema';
import { parseContent } from './parser';

export type { PublicProfileData };

const contentDir = join(__dirname, '..', 'content');
const parsed = parseContent(contentDir);

function deepFreeze<T extends object>(target: T): T {
  Object.freeze(target);

  for (const value of Object.values(target)) {
    if (value !== null && typeof value === 'object') {
      deepFreeze(value);
    }
  }

  return target;
}

// `parsed` is already validated + transformed by `parseContent()` (which
// runs `profileSchema.parse()` internally). Re-parsing here would break the
// `description` field's Zod transform (raw strings -> DescriptionBlock[]) by
// feeding it already-transformed objects, so we freeze the parsed result
// directly instead of parsing it a second time.
export const PRIVATE_PROFILE: ProfileData = deepFreeze(parsed);

const { email, phone, ...publicFields } = parsed;

export const PUBLIC_PROFILE: PublicProfileData = deepFreeze(publicFields);
