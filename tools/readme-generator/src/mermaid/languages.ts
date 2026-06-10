const TOP_LANGUAGES_LIMIT = 6;

/**
 * Builds a Mermaid pie chart from aggregated language data.
 * Takes top 6 languages, groups the rest as "Other".
 *
 * Pure function: data in, string out.
 */
export function buildLanguagePieChart(
  languages: Readonly<Record<string, number>>,
): string {
  const entries = Object.entries(languages);

  if (entries.length === 0) {
    return "";
  }

  const sorted = entries.sort(([, a], [, b]) => b - a);
  const top = sorted.slice(0, TOP_LANGUAGES_LIMIT);
  const rest = sorted.slice(TOP_LANGUAGES_LIMIT);

  const otherCount = rest.reduce((sum, [, count]) => sum + count, 0);
  const total = top.reduce((sum, [, count]) => sum + count, 0) + otherCount;

  const lines: string[] = ["pie title Languages by Repository Count"];

  for (const [lang, count] of top) {
    const percentage = Math.round((count / total) * 100);
    lines.push(`    "${lang}" : ${percentage}`);
  }

  if (otherCount > 0) {
    const percentage = Math.round((otherCount / total) * 100);
    lines.push(`    "Other" : ${percentage}`);
  }

  const diagram = lines.join("\n");

  return `\`\`\`mermaid\n${diagram}\n\`\`\``;
}
