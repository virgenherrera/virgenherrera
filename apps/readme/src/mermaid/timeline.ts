import type { ExperienceData } from '@vh/profile';

function escapeMermaid(text: string): string {
  return text.replace(/:/g, ' -').replace(/;/g, ',');
}

function extractYear(yearMonth: string): number {
  return parseInt(yearMonth.split('-')[0], 10);
}

export function buildTimelineDiagram(
  experiences: readonly ExperienceData[],
): string {
  if (experiences.length === 0) return '';

  const sorted = [...experiences].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
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
      `        ${escapeMermaid(exp.role)} : ${escapeMermaid(exp.company)}`,
    );
  }

  return `\`\`\`mermaid\n%%{init: {'theme': 'neutral'}}%%\n${lines.join('\n')}\n\`\`\``;
}
