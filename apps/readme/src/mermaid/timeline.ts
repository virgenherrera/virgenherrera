import type { ExperienceData } from "@virgenherrera/profile";

function escapeMermaid(text: string): string {
  return text.replace(/:/g, " -").replace(/;/g, ",");
}

function extractYear(dateStr: string): number {
  return parseInt(dateStr.split("-")[0]!, 10);
}

function toSortableDate(dateStr: string): string {
  return dateStr.length === 4 ? `${dateStr}-01` : dateStr;
}

export function buildTimelineDiagram(
  experiences: readonly ExperienceData[],
): string {
  if (experiences.length === 0) {
    return "";
  }

  const sorted = [...experiences].sort((a, b) =>
    toSortableDate(a.startDate).localeCompare(toSortableDate(b.startDate)),
  );

  const lines: string[] = ["timeline", "    title Career Journey"];

  for (const exp of sorted) {
    const startYear = extractYear(exp.startDate);
    const endYear = exp.endDate
      ? extractYear(exp.endDate)
      : new Date().getFullYear();
    const yearRange =
      startYear === endYear
        ? `${String(startYear)}`
        : `${String(startYear)}-${String(endYear)}`;
    const company = escapeMermaid(exp.company);
    const role = escapeMermaid(exp.role);

    lines.push(`    section ${yearRange}`);
    lines.push(`        ${role} : ${company}`);
  }

  const diagram = lines.join("\n");

  return `\`\`\`mermaid\n${diagram}\n\`\`\``;
}
