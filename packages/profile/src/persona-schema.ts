import { z } from 'zod';

/**
 * A skill's relative importance within a persona projection. Either a bare
 * weight (0-1) or an object pairing the weight with a `highlight` flag used
 * to surface the skill as a callout (see `ProjectedProfile.skillHighlights`
 * in `persona-projector.ts`).
 */
const weightedSkillSchema = z.union([
  z.number().min(0).max(1),
  z.object({
    weight: z.number().min(0).max(1),
    highlight: z.boolean().default(false),
  }),
]);

export const sectionIdSchema = z.enum([
  'summary',
  'experience',
  'skills',
  'projects',
  'education',
  'certifications',
  'languages',
  'links',
]);

export type SectionId = z.infer<typeof sectionIdSchema>;

/**
 * A persona is a declarative view over the canonical `ProfileData` — it
 * never mutates the source content, only how it's ordered, weighted, and
 * (optionally) headlined/summarized when projected via `projectProfile()`
 * (see `persona-projector.ts`).
 *
 * `skills.priority`, `skills.weights`, `skills.include`, and `skills.exclude`
 * reference skill slugs from `content/skills-registry.yaml`.
 * `experience.weights` / `experience.hide` reference exact `company` values
 * from `content/experience/*.md` frontmatter; `experience.engagementWeights`
 * references exact engagement `title` values.
 */
export const personaSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  extends: z.string().optional(),

  headline: z.string().min(1).max(220).optional(),
  summary: z.string().min(1).max(2600).optional(),

  sectionOrder: z.array(sectionIdSchema).optional(),

  skills: z
    .object({
      priority: z.array(z.string()).optional(),
      weights: z.record(z.string(), weightedSkillSchema).optional(),
      include: z.array(z.string()).optional(),
      exclude: z.array(z.string()).optional(),
      maxDisplayed: z.number().int().positive().optional(),
    })
    .optional(),

  experience: z
    .object({
      weights: z.record(z.string(), z.number().min(0).max(1)).optional(),
      engagementWeights: z
        .record(z.string(), z.number().min(0).max(1))
        .optional(),
      hide: z.array(z.string()).optional(),
      maxDisplayed: z.number().int().positive().optional(),
      /**
       * Hard cap (in characters) on a rendered experience entry's
       * description — matches `PlatformService.renderExperienceEntry()`'s
       * char count in `apps/readme`. When set, `projectExperience()` trims
       * bullets (lowest-weight engagement first, last bullet first) to fit
       * each entry within this limit. See `persona-projector.ts`.
       */
      charLimit: z.number().int().positive().optional(),
    })
    .optional(),

  technologyHighlights: z.array(z.string()).max(12).optional(),

  meta: z
    .object({
      description: z.string().optional(),
      ogTitle: z.string().optional(),
    })
    .optional(),
});

export type PersonaConfig = z.infer<typeof personaSchema>;

export { weightedSkillSchema };
