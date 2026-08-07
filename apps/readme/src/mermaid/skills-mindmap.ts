import type { SkillCategoryData } from '@vh/profile';
import { skillsInputArraySchema } from './mermaid.schemas';

function escapeMermaid(text: string): string {
  return `"${text.replace(/"/g, "'")}"`;
}

export function buildSkillsMindmap(
  skills: readonly SkillCategoryData[],
): string {
  if (skills.length === 0) return '';

  const parsed = skillsInputArraySchema.parse(skills);

  const lines = ['mindmap', '  root((Skills))'];

  for (const category of parsed) {
    lines.push(`    ${escapeMermaid(category.category)}`);

    for (const skill of category.skills) {
      lines.push(`      ${escapeMermaid(skill)}`);
    }
  }

  return `\`\`\`mermaid\n${lines.join('\n')}\n\`\`\``;
}
