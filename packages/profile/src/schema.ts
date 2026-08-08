import { z } from 'zod';
import { parseDescription } from './description-block';

const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM format')
  .transform((val) => {
    const [year, month] = val.split('-').map(Number);

    return { year, month };
  });

export type YearMonth = z.infer<typeof yearMonth>;

export const linkSchema = z
  .object({
    label: z.string().min(1),
    url: z.url(),
    icon: z.string().optional(),
    target: z.enum(['blank', 'self']).default('blank'),
    visibility: z.enum(['public', 'private']).default('public'),
    type: z
      .enum(['social', 'professional', 'job-board', 'portfolio'])
      .default('social'),
    cta: z.boolean().default(false),
  })
  .readonly();

export const engagementSchema = z
  .object({
    title: z.string().min(1),
    domain: z.string().min(1).optional(),
    client: z.string().min(1).optional(),
    skills: z.array(z.string()).default([]),
    description: z.array(z.string().min(1)).min(1).transform(parseDescription),
    technologies: z.array(z.string()).default([]),
  })
  .readonly();

export type EngagementData = z.infer<typeof engagementSchema>;

export const experienceSchema = z
  .object({
    company: z.string().min(1),
    role: z.string().min(1),
    startDate: yearMonth,
    endDate: yearMonth.optional(),
    description: z.array(z.string().min(1)).min(1).transform(parseDescription),
    technologies: z.array(z.string().min(1)),
    engagements: z.array(engagementSchema).optional(),
  })
  .readonly();

export const educationSchema = z
  .object({
    degree: z.string().min(1),
    degreeTranslation: z.string().min(1),
    institution: z.string().min(1),
    location: z.string().min(1),
    startDate: yearMonth,
    graduationDate: yearMonth,
    honors: z.string().optional(),
  })
  .readonly();

export const certificationSchema = z
  .object({
    name: z.string().min(1),
    issuer: z.string().min(1),
    date: yearMonth,
    url: z.url().optional(),
  })
  .readonly();

export const projectSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    url: z.url(),
    technologies: z.array(z.string().min(1)).default([]),
  })
  .readonly();

export const skillEntrySchema = z
  .object({
    name: z.string().min(1),
    level: z.number().int().min(1).max(5),
  })
  .readonly();

export const skillCategorySchema = z
  .object({
    category: z.string().min(1),
    skills: z.array(skillEntrySchema).min(1),
  })
  .readonly();

export const languageSchema = z
  .object({
    language: z.string().min(1),
    proficiency: z.string().min(1),
  })
  .readonly();

const profileObject = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1).max(2600),
  location: z.string().min(1),
  email: z.email().optional(),
  phone: z.string().optional(),
  links: z.array(linkSchema).min(1),
  experience: z.array(experienceSchema).min(1),
  education: z.array(educationSchema),
  certifications: z.array(certificationSchema),
  projects: z.array(projectSchema),
  skills: z.array(skillCategorySchema).min(1),
  languages: z.array(languageSchema).min(1),
});

export const profileSchema = profileObject.readonly();

export type ProfileData = z.infer<typeof profileSchema>;
export type LinkData = z.infer<typeof linkSchema>;
export type ExperienceData = z.infer<typeof experienceSchema>;
export type EducationData = z.infer<typeof educationSchema>;
export type CertificationData = z.infer<typeof certificationSchema>;
export type SkillEntryData = z.infer<typeof skillEntrySchema>;
export type SkillCategoryData = z.infer<typeof skillCategorySchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type LanguageData = z.infer<typeof languageSchema>;

export const secretsPayloadSchema = profileObject
  .pick({ email: true, phone: true })
  .required()
  .readonly();

export type SecretsPayload = z.infer<typeof secretsPayloadSchema>;

export const publicProfileSchema = profileObject
  .omit({ email: true, phone: true })
  .readonly();

export type PublicProfileData = z.infer<typeof publicProfileSchema>;

// `profile-snapshot.json` (and PUBLIC_PROFILE/PRIVATE_PROFILE in data.ts) are
// already validated + transformed by `profileSchema.parse()` inside
// `parseContent()` — the `experience[].description` field has already gone
// through the raw-strings -> DescriptionBlock[] transform. Browser consumers
// that read the pre-built snapshot must validate against THIS shape (blocks,
// not raw strings), otherwise re-running `profileSchema` on already-parsed
// data throws (it expects raw strings for `description`).
const descriptionBlockSchema = z.object({
  type: z.enum(['paragraph', 'bullets']),
  lines: z.array(z.string().min(1)).min(1),
});

const parsedYearMonth = z
  .object({
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
  })
  .readonly();

const parsedEngagementSchema = z
  .object({
    title: z.string().min(1),
    domain: z.string().min(1).optional(),
    client: z.string().min(1).optional(),
    skills: z.array(z.string()).default([]),
    description: z.array(descriptionBlockSchema).min(1),
    technologies: z.array(z.string()).default([]),
  })
  .readonly();

const parsedExperienceSchema = z
  .object({
    company: z.string().min(1),
    role: z.string().min(1),
    startDate: parsedYearMonth,
    endDate: parsedYearMonth.optional(),
    description: z.array(descriptionBlockSchema).min(1),
    technologies: z.array(z.string().min(1)),
    engagements: z.array(parsedEngagementSchema).optional(),
  })
  .readonly();

const parsedEducationSchema = z
  .object({
    degree: z.string().min(1),
    degreeTranslation: z.string().min(1),
    institution: z.string().min(1),
    location: z.string().min(1),
    startDate: parsedYearMonth,
    graduationDate: parsedYearMonth,
    honors: z.string().optional(),
  })
  .readonly();

const parsedCertificationSchema = z
  .object({
    name: z.string().min(1),
    issuer: z.string().min(1),
    date: parsedYearMonth,
    url: z.url().optional(),
  })
  .readonly();

const skillStatsSchema = z
  .object({
    experiences: z.array(z.string()),
    projects: z.array(z.string()),
    years: z.number(),
  })
  .readonly();

export const serializedGraphSchema = z
  .object({
    bySkill: z.record(z.string(), skillStatsSchema),
    byExperience: z.record(z.string(), z.array(z.string())),
    byProject: z.record(z.string(), z.array(z.string())),
    /**
     * Registry slug -> display name (e.g. "dotnet-8" -> ".NET 8"). Enables
     * exact persona identifier matching in `persona-projector.ts` instead of
     * heuristically slugifying display names (which fails for irregular
     * slugs). Optional for backward compatibility with pre-existing
     * `profile-snapshot.json` files that predate this field.
     */
    displayNames: z.record(z.string(), z.string()).optional(),
  })
  .readonly();

export type SerializedProfileGraph = z.infer<typeof serializedGraphSchema>;

export const profileSnapshotSchema = profileObject
  .omit({
    email: true,
    phone: true,
    experience: true,
    education: true,
    certifications: true,
  })
  .extend({
    experience: z.array(parsedExperienceSchema).min(1),
    education: z.array(parsedEducationSchema),
    certifications: z.array(parsedCertificationSchema),
    graph: serializedGraphSchema.optional(),
  })
  .readonly();

export type ProfileSnapshotData = z.infer<typeof profileSnapshotSchema>;
