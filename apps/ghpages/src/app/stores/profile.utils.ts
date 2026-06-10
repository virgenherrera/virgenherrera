import type { ExperienceData } from "../types/profile.types";
import {
  secretsPayloadSchema,
  type SecretsPayload,
} from "../schemas/secrets-payload.schema";
import {
  SUMMARY_SENTENCES,
  DESCRIPTION_MAX_LENGTH,
  MAX_TECHNOLOGIES,
} from "../constants/profile.constants";

export function trimSummary(summary: string): string {
  const sentences = summary.split(/(?<=\.)\s+/);

  return sentences.slice(0, SUMMARY_SENTENCES).join(" ");
}

export function trimExperience(
  experiences: ExperienceData[],
): ExperienceData[] {
  return experiences.map((exp) => {
    const firstParagraph = exp.description.find(
      (item) => !item.startsWith("*"),
    );
    const trimmed = firstParagraph
      ? firstParagraph.length > DESCRIPTION_MAX_LENGTH
        ? `${firstParagraph.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd()}...`
        : firstParagraph
      : exp.description[0]!;

    return {
      ...exp,
      description: [trimmed],
      technologies: exp.technologies.slice(0, MAX_TECHNOLOGIES),
    };
  });
}

export function decodeHashPayload(hash: string): SecretsPayload | null {
  if (!hash || hash === "#") return null;
  try {
    const base64 = hash.startsWith("#") ? hash.slice(1) : hash;
    const json = atob(base64);
    const parsed = JSON.parse(json) as unknown;

    return secretsPayloadSchema.parse(parsed);
  } catch {
    return null;
  }
}
