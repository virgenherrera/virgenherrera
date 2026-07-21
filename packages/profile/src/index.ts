export {
  profileSchema,
  linkSchema,
  experienceSchema,
  educationSchema,
  certificationSchema,
  skillCategorySchema,
  projectSchema,
  languageSchema,
  secretsPayloadSchema,
  publicProfileSchema,
  profileSnapshotSchema,
} from './schema';

export type {
  ProfileData,
  LinkData,
  ExperienceData,
  EducationData,
  CertificationData,
  SkillCategoryData,
  ProjectData,
  LanguageData,
  SecretsPayload,
  PublicProfileData,
  ProfileSnapshotData,
} from './schema';

export { parseDescription, type DescriptionBlock } from './description-block';

// PUBLIC_PROFILE and PRIVATE_PROFILE read content/ from the filesystem and
// are intentionally NOT re-exported here — this keeps the main export
// browser-safe. Server consumers must import from '@vh/profile/data'.
