import { languagesInputSchema } from './mermaid.schemas';

export function buildLanguagesChart(languages: Record<string, number>): string {
  if (Object.keys(languages).length === 0) return '';

  const validated = languagesInputSchema.parse(languages);
  const entries = Object.entries(validated);

  const labels = entries.map(([lang]) => `"${lang}"`).join(', ');
  const values = entries.map(([, count]) => count);
  const maxValue = Math.max(...values);
  const yAxisMax = Math.ceil((maxValue + 5) / 10) * 10;

  const lines = [
    'xychart-beta',
    '    title "Top Languages"',
    `    x-axis [${labels}]`,
    `    y-axis "Repositories" 0 --> ${String(yAxisMax)}`,
    `    bar [${values.join(', ')}]`,
  ];

  return `\`\`\`mermaid\n${lines.join('\n')}\n\`\`\``;
}
