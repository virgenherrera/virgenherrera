import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getProfile } from "@virgenherrera/profile";
import type { ProfileData } from "@virgenherrera/profile";
import { getSecrets } from "@virgenherrera/secrets";
import { renderReadme } from "./render.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");

function parseOutputArg(): string {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf("--output");

  const outputValue = outputIndex !== -1 ? args[outputIndex + 1] : undefined;

  if (outputValue) {
    return resolve(outputValue);
  }

  return resolve(REPO_ROOT, "README.md");
}

const outputPath = parseOutputArg();
const secrets = getSecrets(resolve(REPO_ROOT, ".env"));
const profile = getProfile();

const merged: ProfileData = {
  ...profile,
  email: secrets.PROFILE_EMAIL,
  links: [
    ...profile.links,
    { label: "Phone", url: `tel:${secrets.PROFILE_PHONE}` },
  ],
};

const markdown = renderReadme(merged);
writeFileSync(outputPath, markdown, "utf-8");
console.log(`README.md generated at ${outputPath}`);
