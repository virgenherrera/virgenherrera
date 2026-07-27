// TODO: TD-PROFILE-002 — 5 source files lack unit tests
// CONTEXT: description-block, get-profile, schema, embedder, export have zero test coverage
// RESOLVE: add Jest specs; prioritize schema.ts (Zod transforms) and description-block.ts (pure functions)
export {
  profileSchema,
  linkSchema,
  experienceSchema,
  engagementSchema,
  educationSchema,
  certificationSchema,
  skillCategorySchema,
  projectSchema,
  languageSchema,
  secretsPayloadSchema,
  publicProfileSchema,
  profileSnapshotSchema,
  serializedGraphSchema,
} from './schema';

export type {
  ProfileData,
  LinkData,
  ExperienceData,
  EngagementData,
  EducationData,
  CertificationData,
  SkillCategoryData,
  ProjectData,
  LanguageData,
  SecretsPayload,
  PublicProfileData,
  ProfileSnapshotData,
  SerializedProfileGraph,
} from './schema';

export { parseDescription, type DescriptionBlock } from './description-block';

// PUBLIC_PROFILE and PRIVATE_PROFILE read content/ from the filesystem and
// are intentionally NOT re-exported here — this keeps the main export
// browser-safe. Server consumers must import from '@vh/profile/data'.
