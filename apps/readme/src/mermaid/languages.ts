const TOP_LIMIT = 6;

export function buildLanguagePieChart(
  languages: Readonly<Record<string, number>>,
): string {
  const entries = Object.entries(languages);
  if (entries.length === 0) return '';

  const sorted = entries.sort(([, a], [, b]) => b - a);
  const top = sorted.slice(0, TOP_LIMIT);
  const rest = sorted.slice(TOP_LIMIT);
  const otherCount = rest.reduce((sum, [, n]) => sum + n, 0);
  const total = top.reduce((sum, [, n]) => sum + n, 0) + otherCount;

  const lines = ['pie title Languages by Repository Count'];

  for (const [lang, count] of top) {
    lines.push(`    "${lang}" : ${String(Math.round((count / total) * 100))}`);
  }

  if (otherCount > 0) {
    lines.push(
      `    "Other" : ${String(Math.round((otherCount / total) * 100))}`,
    );
  }

  return `\`\`\`mermaid\n%%{init: {'theme': 'neutral'}}%%\n${lines.join('\n')}\n\`\`\``;
}
