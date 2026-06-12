import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { config as loadDotenv } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");

export const secretsSchema = z.object({
  PROFILE_EMAIL: z.email({
    error: "PROFILE_EMAIL must be a valid email address",
  }),
  PROFILE_PHONE: z.string().min(1, { error: "PROFILE_PHONE is required" }),
});

export type SecretsData = z.infer<typeof secretsSchema>;

export function getSecrets(envPath?: string): SecretsData {
  loadDotenv({ path: envPath ?? resolve(REPO_ROOT, ".env") });

  const result = secretsSchema.safeParse({
    PROFILE_EMAIL: process.env["PROFILE_EMAIL"],
    PROFILE_PHONE: process.env["PROFILE_PHONE"],
  });

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Environment variable validation failed:\n${missing}\n\nMake sure .env exists at repo root with PROFILE_EMAIL and PROFILE_PHONE set.`,
    );
  }

  return result.data;
}
