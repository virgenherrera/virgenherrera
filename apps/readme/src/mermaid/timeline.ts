import type { ExperienceData } from '@vh/profile';

function escapeMermaid(text: string): string {
  return text
    .replace(/\(/g, '-')
    .replace(/\)/g, '')
    .replace(/:/g, ' -')
    .replace(/;/g, ',');
}

function extractYear(yearMonth: string): number {
  return parseInt(yearMonth.split('-')[0], 10);
}

function calculateScore(
  startDate: string,
  endDate: string | undefined,
): number {
  const startYear = extractYear(startDate);
  const endYear = endDate ? extractYear(endDate) : new Date().getFullYear();
  const duration = endYear - startYear;

  return duration >= 2 ? 5 : 3;
}

export function buildTimelineDiagram(
  experiences: readonly ExperienceData[],
): string {
  if (experiences.length === 0) return '';

  const sorted = [...experiences].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );

  const lines = ['journey', '    title Career Journey'];

  for (const exp of sorted) {
    const start = extractYear(exp.startDate);
    const end = exp.endDate
      ? extractYear(exp.endDate)
      : new Date().getFullYear();
    const range =
      start === end ? String(start) : `${String(start)}-${String(end)}`;
    const score = calculateScore(exp.startDate, exp.endDate);

    lines.push(`    section ${range}`);
    lines.push(
      `      ${escapeMermaid(exp.role)}: ${String(score)}: ${escapeMermaid(exp.company)}`,
    );
  }

  return `\`\`\`mermaid\n${lines.join('\n')}\n\`\`\``;
}
