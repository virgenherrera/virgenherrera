import type { ExperienceData } from "@virgenherrera/profile";

/**
 * Escapes special characters that break Mermaid syntax.
 * Colons and semicolons in text content must be removed or replaced.
 */
function escapeMermaid(text: string): string {
  return text.replace(/:/g, " -").replace(/;/g, ",");
}

/**
 * Extracts the year from a date string like "2024-08" or "2018".
 */
function extractYear(dateStr: string): number {
  return parseInt(dateStr.split("-")[0]!, 10);
}

/**
 * Builds a Mermaid timeline diagram from profile experience data.
 * Sorts by startDate ascending and formats each as a timeline entry.
 *
 * Pure function: data in, string out.
 */
export function buildTimelineDiagram(
  experiences: readonly ExperienceData[],
): string {
  if (experiences.length === 0) {
    return "";
  }

  const sorted = [...experiences].sort(
    (a, b) => extractYear(a.startDate) - extractYear(b.startDate),
  );

  const lines: string[] = ["timeline", "    title Career Journey"];

  for (const exp of sorted) {
    const startYear = extractYear(exp.startDate);
    const endYear = exp.endDate
      ? extractYear(exp.endDate)
      : new Date().getFullYear();
    const yearRange =
      startYear === endYear ? `${startYear}` : `${startYear}-${endYear}`;
    const company = escapeMermaid(exp.company);
    const role = escapeMermaid(exp.role);

    lines.push(`    section ${yearRange}`);
    lines.push(`        ${role} : ${company}`);
  }

  const diagram = lines.join("\n");

  return `\`\`\`mermaid\n${diagram}\n\`\`\``;
}
