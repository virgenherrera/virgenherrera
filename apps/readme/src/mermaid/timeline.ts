import type { ExperienceData } from '@vh/profile';
import { timelineInputArraySchema } from './mermaid.schemas';

function escapeMermaid(text: string): string {
  return text
    .replace(/\(/g, '-')
    .replace(/\)/g, '')
    .replace(/:/g, ' -')
    .replace(/;/g, ',');
}

function extractYear(yearMonth: { year: number; month: number }): number {
  return yearMonth.year;
}

export function buildTimelineDiagram(
  experiences: readonly ExperienceData[],
): string {
  if (experiences.length === 0) return '';

  const validated = timelineInputArraySchema.parse(experiences);

  const sorted = [...validated].sort(
    (a, b) =>
      a.startDate.year * 12 +
      a.startDate.month -
      (b.startDate.year * 12 + b.startDate.month),
  );

  const lines = ['timeline', '    title Career Journey'];

  for (const exp of sorted) {
    const start = extractYear(exp.startDate);
    const end = exp.endDate
      ? extractYear(exp.endDate)
      : new Date().getFullYear();
    const range =
      start === end ? String(start) : `${String(start)}-${String(end)}`;

    lines.push(`    section ${range}`);
    lines.push(
      `      ${escapeMermaid(exp.role)} : ${escapeMermaid(exp.company)}`,
    );
  }

  return `\`\`\`mermaid\n${lines.join('\n')}\n\`\`\``;
}
