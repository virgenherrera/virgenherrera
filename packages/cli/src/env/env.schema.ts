import { z } from "zod";

export const envSchema = z.object({
  PROFILE_EMAIL: z.email({ error: "PROFILE_EMAIL must be a valid email address" }),
  PROFILE_PHONE: z.string().min(1, { error: "PROFILE_PHONE is required" }),
});

export type EnvVars = z.infer<typeof envSchema>;

export function validateEnv(): EnvVars {
  const result = envSchema.safeParse({
    PROFILE_EMAIL: process.env["PROFILE_EMAIL"],
    PROFILE_PHONE: process.env["PROFILE_PHONE"],
  });

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Environment variable validation failed:\n${missing}\n\nMake sure packages/profile/.env exists with PROFILE_EMAIL and PROFILE_PHONE set.`,
    );
  }

  return result.data;
}
