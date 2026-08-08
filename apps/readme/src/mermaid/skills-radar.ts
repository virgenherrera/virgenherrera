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

const SKIP_CATEGORIES = new Set(['Languages']);

// TD: replace with dynamic aggregation (threshold ≥3, parent-only, dissolve Languages)
const RADAR_OVERRIDES: Record<string, number> = {
  'Frontend Frameworks': 4.9,
  'Backend Frameworks': 4.9,
  'APIs & Protocols': 4.9,
  'Cloud & DevOps': 3.9,
  Databases: 4.5,
  'ORMs & ODMs': 4.8,
  'AI Engineering': 3.9,
  'IoT & Industrial Systems': 3.5,
  'Testing & QA': 4.7,
  'Architecture & Patterns': 4.0,
  'Developer Tooling': 4.5,
};

function axisLabel(category: string): string {
  return SHORT_LABELS[category] ?? category;
}

function averageLevel(levels: readonly number[]): number {
  const sum = levels.reduce((acc, level) => acc + level, 0);

  return Math.round((sum / levels.length) * 10) / 10;
}

export function buildSkillsRadar(skills: readonly SkillCategoryData[]): string {
  if (skills.length === 0) return '';

  const parsed = skillsInputArraySchema.parse(skills);
  const visible = parsed.filter((c) => !SKIP_CATEGORIES.has(c.category));

  const axes = visible.map((c) => axisLabel(c.category));
  const values = visible.map(
    (c) =>
      RADAR_OVERRIDES[c.category] ?? averageLevel(c.skills.map((s) => s.level)),
  );

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
