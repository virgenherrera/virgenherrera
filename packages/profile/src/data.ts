import {
  profileSchema,
  publicProfileSchema,
  type ProfileData,
  type PublicProfileData,
} from './schema';
import profileJson from './profile.json';

export type { PublicProfileData };

function deepFreeze<T extends object>(target: T): T {
  Object.freeze(target);

  for (const value of Object.values(target)) {
    if (value !== null && typeof value === 'object') {
      deepFreeze(value);
    }
  }

  return target;
}

export const PRIVATE_PROFILE: ProfileData = deepFreeze(
  profileSchema.parse(profileJson),
);

export const PUBLIC_PROFILE: PublicProfileData = deepFreeze(
  publicProfileSchema.parse(profileJson),
);
