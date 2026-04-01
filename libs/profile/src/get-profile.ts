import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { profileSchema, type ProfileData } from "./schema.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE_JSON_PATH = join(__dirname, "profile.json");

export function getProfile(): ProfileData {
  const raw = readFileSync(PROFILE_JSON_PATH, "utf-8");
  const data: unknown = JSON.parse(raw);

  return profileSchema.parse(data);
}
