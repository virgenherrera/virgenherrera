import type { SkillCategoryData } from '@vh/profile';
import { skillsInputArraySchema } from './mermaid.schemas';

const SHORT_LABELS: Record<string, string> = {
  'Backend Frameworks': 'Backend',
  'Frontend Frameworks': 'Frontend',
  'APIs & Protocols': 'APIs',
  'Cloud & DevOps': 'Cloud',
  'ORMs & ODMs': 'ORMs',
  'AI Engineering': 'AI',
  'IoT & Industrial Systems': 'IoT',
  'Testing & QA': 'Testing',
  'Architecture & Patterns': 'Architecture',
  'Developer Tooling': 'Tooling',
};

function axisLabel(category: string): string {
  return SHORT_LABELS[category] ?? category;
}

/** Average of the given levels, rounded to 1 decimal place. */
function averageLevel(levels: readonly number[]): number {
  const sum = levels.reduce((acc, level) => acc + level, 0);

  return Math.round((sum / levels.length) * 10) / 10;
}

export function buildSkillsRadar(skills: readonly SkillCategoryData[]): string {
  if (skills.length === 0) return '';

  const parsed = skillsInputArraySchema.parse(skills);

  const axes = parsed.map((c) => `${axisLabel(c.category)}`);
  const values = parsed.map((c) => averageLevel(c.skills.map((s) => s.level)));

  const lines = [
    'radar-beta',
    '  title Skills Coverage',
    `  axis ${axes.join(', ')}`,
    `  curve Breadth{${values.join(', ')}}`,
    '  graticule polygon',
    '  max 5',
    '  min 0',
  ];

  return `\`\`\`mermaid\n${lines.join('\n')}\n\`\`\``;
}
