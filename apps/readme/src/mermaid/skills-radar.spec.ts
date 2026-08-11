import type { SkillCategoryData } from '@vh/profile';
import { PRIVATE_PROFILE } from '@vh/profile/data';
import { buildSkillsRadar } from './skills-radar';
import { RADAR_TARGETS } from './radar-targets';

// ── helpers ─────────────────────────────────────────────────────────────────

function category(name: string, levels: readonly number[]): SkillCategoryData {
  return {
    category: name,
    skills: levels.map((level, index) => ({
      name: `Skill ${index}`,
      level,
    })),
  };
}

describe('averageLevel (via buildSkillsRadar)', () => {
  it('averages only levels at or above the threshold (3)', () => {
    const chart = buildSkillsRadar([category('Backend', [5, 4, 3])]);

    // (5 + 4 + 3) / 3 = 4
    expect(chart).toContain('curve Breadth{4}');
  });

  it('filters out levels below the threshold before averaging', () => {
    const chart = buildSkillsRadar([category('Backend', [5, 2, 1])]);

    // only 5 is >= 3, so the average is 5, not (5+2+1)/3
    expect(chart).toContain('curve Breadth{5}');
  });

  it('returns 0 when every level is below the threshold', () => {
    const chart = buildSkillsRadar([category('Backend', [1, 2, 2])]);

    expect(chart).toContain('curve Breadth{0}');
  });

  it('rounds the average to one decimal place', () => {
    const chart = buildSkillsRadar([category('Backend', [5, 4, 3, 3])]);

    // (5 + 4 + 3 + 3) / 4 = 3.75 -> 3.8
    expect(chart).toContain('curve Breadth{3.8}');
  });
});

describe('buildSkillsRadar', () => {
  it('generates valid mermaid radar-beta syntax', () => {
    const chart = buildSkillsRadar([
      category('Backend', [5, 4, 3]),
      category('Databases', [4, 4]),
    ]);

    expect(chart).toContain('```mermaid');
    expect(chart).toContain('radar-beta');
    expect(chart).toContain('title Skills Coverage');
    expect(chart).toContain('axis Backend, Databases');
    expect(chart).toContain('graticule polygon');
    expect(chart).toContain('max 5');
    expect(chart).toContain('min 0');
    expect(chart.trimEnd()).toMatch(/```$/);
  });

  it('returns an empty string for empty input', () => {
    expect(buildSkillsRadar([])).toBe('');
  });

  it('uses short labels for known categories', () => {
    const chart = buildSkillsRadar([
      category('APIs & Protocols', [5, 4]),
      category('Cloud & DevOps', [4, 3]),
      category('ORMs & ODMs', [4, 4]),
      category('AI Engineering', [4, 4]),
      category('IoT & Industrial Systems', [3]),
      category('Testing & QA', [4, 4]),
      category('Architecture & Patterns', [4, 4]),
      category('Developer Tooling', [4, 3]),
    ]);

    expect(chart).toContain(
      'axis APIs, Cloud, ORMs, AI, IoT, Testing, Architecture, Tooling',
    );
  });

  it('falls back to the raw category name when no short label exists', () => {
    const chart = buildSkillsRadar([
      category('Frontend', [5, 4]),
      category('Backend', [5, 4]),
      category('Databases', [4, 4]),
    ]);

    expect(chart).toContain('axis Frontend, Backend, Databases');
  });
});

describe('radar target validation', () => {
  // Mirrors `averageLevel()` in `./skills-radar.ts` exactly. Not imported
  // because the original is not exported — duplicated here so this test
  // stays a faithful reproduction of the production computation instead of
  // silently drifting if the internals change.
  const RADAR_LEVEL_THRESHOLD = 3;

  function averageLevel(levels: readonly number[]): number {
    const eligible = levels.filter((l) => l >= RADAR_LEVEL_THRESHOLD);

    if (eligible.length === 0) return 0;

    const sum = eligible.reduce((acc, level) => acc + level, 0);

    return Math.round((sum / eligible.length) * 10) / 10;
  }

  const skillsByCategory = new Map<string, SkillCategoryData>(
    PRIVATE_PROFILE.skills.map((c) => [c.category, c]),
  );

  it.each(Object.entries(RADAR_TARGETS))(
    '%s computes to its target value (%d) from real profile data',
    (categoryName, target) => {
      const categoryData = skillsByCategory.get(categoryName);

      expect(categoryData).toBeDefined();

      const computed = averageLevel(
        (categoryData as SkillCategoryData).skills.map((s) => s.level),
      );

      expect(computed).toBe(target);
    },
  );
});
