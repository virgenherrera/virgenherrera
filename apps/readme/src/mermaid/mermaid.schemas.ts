import { z } from 'zod';

export const timelineInputSchema = z
  .object({
    company: z.string().min(1),
    role: z.string().min(1),
    startDate: z.object({ year: z.number().int(), month: z.number().int() }),
    endDate: z
      .object({ year: z.number().int(), month: z.number().int() })
      .optional(),
  })
  .readonly();

export type TimelineInput = z.infer<typeof timelineInputSchema>;

export const timelineInputArraySchema = z.array(timelineInputSchema).min(1);

export const skillCategoryInputSchema = z
  .object({
    category: z.string().min(1),
    skills: z.array(z.string().min(1)).min(1),
  })
  .readonly();

export const skillsInputArraySchema = z.array(skillCategoryInputSchema).min(1);

export const languagesInputSchema = z.record(
  z.string().min(1),
  z.number().int().nonnegative(),
);
