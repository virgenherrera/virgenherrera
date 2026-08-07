import { z } from 'zod';

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

export type LanguagesInput = z.infer<typeof languagesInputSchema>;
