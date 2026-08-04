import type {
  ProfileSnapshotData,
  SkillCategoryData,
  SerializedProfileGraph,
} from './schema';
import type { PersonaConfig, SectionId } from './persona-schema';

type SkillsConfig = NonNullable<PersonaConfig['skills']>;
type ExperienceConfig = NonNullable<PersonaConfig['experience']>;
type SnapshotExperience = ProfileSnapshotData['experience'][number];
type SnapshotEngagement = NonNullable<
  SnapshotExperience['engagements']
>[number];

/**
 * `ProfileSnapshotData` shaped by a persona projection.
 *
 * `skills` and `experience` keep the exact shape of the source profile
 * (same category grouping / experience entry shape) — only reordering,
 * filtering, and truncation are applied — so a no-op persona produces a
 * deep-equal `skills` / `experience` compared to the source profile.
 *
 * `skillHighlights` / `sectionOrder` / `technologyHighlights` / `meta` /
 * `personaId` are additive fields with no equivalent on `ProfileSnapshotData`.
 */
export interface ProjectedProfile extends Omit<
  ProfileSnapshotData,
  'skills' | 'experience'
> {
  readonly skills: SkillCategoryData[];
  readonly experience: SnapshotExperience[];
  readonly sectionOrder?: SectionId[];
  readonly technologyHighlights?: string[];
  /** Display names of skills whose persona weight entry set `highlight: true`. */
  readonly skillHighlights?: string[];
  readonly meta?: { description?: string; ogTitle?: string };
  readonly personaId: string;
}

/**
 * The identity persona — projecting a profile through it must be a pure
 * pass-through (no header overrides, no skill/experience reordering). Used
 * as the backward-compatibility baseline: any consumer that doesn't know
 * about personas yet can keep calling `projectProfile(profile, graph,
 * DEFAULT_PERSONA)` and see the exact same profile it always did.
 */
export const DEFAULT_PERSONA: PersonaConfig = {
  id: 'default',
  label: 'Default',
};

/**
 * Projects a `ProfileSnapshotData` through a `PersonaConfig`: reorders,
 * weights, filters, and (optionally) truncates skills and experience,
 * optionally overrides headline/summary, and attaches persona metadata.
 *
 * PURE — no I/O, no mutation of its inputs. Safe for browser and Node.js.
 */
export function projectProfile(
  profile: ProfileSnapshotData,
  graph: SerializedProfileGraph | null,
  persona: PersonaConfig,
): ProjectedProfile {
  const { skills, highlights } = projectSkills(
    profile.skills,
    graph,
    persona.skills,
  );
  const experience = projectExperience(profile.experience, persona.experience);

  return {
    ...profile,
    headline: persona.headline ?? profile.headline,
    summary: persona.summary ?? profile.summary,
    skills,
    experience,
    sectionOrder: persona.sectionOrder,
    technologyHighlights: persona.technologyHighlights,
    skillHighlights: highlights.length > 0 ? highlights : undefined,
    meta: persona.meta,
    personaId: persona.id,
  };
}

// ── skill identifier matching ────────────────────────────────────────────
//
// `profile.skills` stores resolved display names (e.g. "LangChain",
// "OpenAI API"); persona configs reference registry slugs (e.g. "langchain",
// "openai-api"). There is no slug<->display map available to this pure
// function (it only receives `ProfileSnapshotData` + `SerializedProfileGraph`,
// neither of which carries the registry mapping), so identifiers are matched
// via a best-effort slugification of the display name.
//
// This resolves the vast majority of registry slugs (anything the original
// author derived from its display name via lowercase + hyphenation, e.g.
// "OpenAI API" -> "openai-api", "Azure Functions" -> "azure-functions").
// A handful of slugs are irregular relative to their display name (e.g.
// ".NET 8" -> "dotnet-8", "C#" -> "csharp", "Azure Kubernetes Service" ->
// "azure-aks", "LLM-based orchestration" -> "llm-orchestration") and will
// NOT match through this heuristic — those skills simply fall back to
// natural ordering/no highlight instead of throwing. Persona authors should
// prefer slugs whose display name slugifies back to the slug (see
// `packages/profile/personas/ai-engineer.yaml` for known-safe examples).

function slugifyDisplayName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchesIdentifier(displayName: string, identifier: string): boolean {
  return slugifyDisplayName(displayName) === slugifyDisplayName(identifier);
}

function normalizeWeightEntry(
  entry: number | { weight: number; highlight?: boolean },
): { weight: number; highlight: boolean } {
  if (typeof entry === 'number') {
    return { weight: entry, highlight: false };
  }

  return { weight: entry.weight, highlight: entry.highlight ?? false };
}

// ── skills projection ────────────────────────────────────────────────────

interface FlatSkill {
  readonly category: string;
  readonly name: string;
  score: number;
  highlight: boolean;
  priorityIndex: number;
  readonly originalIndex: number;
}

function flattenSkills(categories: readonly SkillCategoryData[]): FlatSkill[] {
  const flat: FlatSkill[] = [];
  let index = 0;

  for (const category of categories) {
    for (const name of category.skills) {
      flat.push({
        category: category.category,
        name,
        score: 0,
        highlight: false,
        priorityIndex: -1,
        originalIndex: index++,
      });
    }
  }

  return flat;
}

function applyExclude(
  skills: FlatSkill[],
  exclude: readonly string[],
): FlatSkill[] {
  if (exclude.length === 0) {
    return skills;
  }

  return skills.filter(
    (skill) => !exclude.some((id) => matchesIdentifier(skill.name, id)),
  );
}

function applyInclude(
  skills: FlatSkill[],
  include: readonly string[] | undefined,
): FlatSkill[] {
  if (!include || include.length === 0) {
    return skills;
  }

  return skills.filter((skill) =>
    include.some(
      (id) => matchesIdentifier(skill.name, id) || skill.category === id,
    ),
  );
}

function applyWeights(
  skills: FlatSkill[],
  weights: Record<string, number | { weight: number; highlight?: boolean }>,
  graph: SerializedProfileGraph | null,
): void {
  const identifiers = Object.keys(weights);

  if (identifiers.length === 0) {
    return;
  }

  for (const skill of skills) {
    const matchedId = identifiers.find((id) =>
      matchesIdentifier(skill.name, id),
    );

    if (!matchedId) {
      continue;
    }

    const { weight, highlight } = normalizeWeightEntry(weights[matchedId]);
    const years = graph?.bySkill[matchedId]?.years;

    skill.score = graph ? weight * (years && years > 0 ? years : 1) : weight;
    skill.highlight = highlight;
  }
}

function applyPriority(skills: FlatSkill[], priority: readonly string[]): void {
  priority.forEach((id, priorityIndex) => {
    for (const skill of skills) {
      if (skill.priorityIndex === -1 && matchesIdentifier(skill.name, id)) {
        skill.priorityIndex = priorityIndex;
      }
    }
  });
}

function sortSkills(skills: FlatSkill[]): FlatSkill[] {
  return [...skills].sort((a, b) => {
    const aHasPriority = a.priorityIndex !== -1;
    const bHasPriority = b.priorityIndex !== -1;

    if (aHasPriority && bHasPriority) {
      return a.priorityIndex - b.priorityIndex;
    }

    if (aHasPriority !== bHasPriority) {
      return aHasPriority ? -1 : 1;
    }

    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return a.originalIndex - b.originalIndex;
  });
}

/**
 * Regroups a flat, already-sorted skill list back into `SkillCategoryData[]`.
 *
 * Category order follows first appearance in the SORTED list (not the
 * source registry order) — otherwise a persona that prioritizes e.g.
 * "AI & Integrations" would still render that category last just because
 * `content/skills-registry.yaml` happens to declare it last.
 */
function regroupSkills(skills: readonly FlatSkill[]): SkillCategoryData[] {
  const byCategory = new Map<string, string[]>();

  for (const skill of skills) {
    const list = byCategory.get(skill.category) ?? [];

    list.push(skill.name);
    byCategory.set(skill.category, list);
  }

  return [...byCategory.entries()].map(([category, categorySkills]) => ({
    category,
    skills: categorySkills,
  }));
}

function projectSkills(
  categories: readonly SkillCategoryData[],
  graph: SerializedProfileGraph | null,
  config: SkillsConfig | undefined,
): { skills: SkillCategoryData[]; highlights: string[] } {
  if (!config) {
    return {
      skills: categories.map((category) => ({
        ...category,
        skills: [...category.skills],
      })),
      highlights: [],
    };
  }

  const {
    priority = [],
    weights = {},
    include,
    exclude = [],
    maxDisplayed,
  } = config;

  let working = applyExclude(flattenSkills(categories), exclude);

  working = applyInclude(working, include);
  applyWeights(working, weights, graph);
  applyPriority(working, priority);

  const sorted = sortSkills(working);
  const truncated = maxDisplayed ? sorted.slice(0, maxDisplayed) : sorted;
  const highlights = truncated
    .filter((skill) => skill.highlight)
    .map((skill) => skill.name);

  return { skills: regroupSkills(truncated), highlights };
}

// ── experience projection ────────────────────────────────────────────────

function toMonthIndex(yearMonth: { year: number; month: number }): number {
  return yearMonth.year * 12 + yearMonth.month;
}

function sortEngagements(
  engagements: readonly SnapshotEngagement[],
  weights: Record<string, number>,
): SnapshotEngagement[] {
  return [...engagements].sort((a, b) => {
    const scoreA = weights[a.title] ?? 0;
    const scoreB = weights[b.title] ?? 0;

    return scoreB - scoreA;
  });
}

function projectExperience(
  experience: readonly SnapshotExperience[],
  config: ExperienceConfig | undefined,
): SnapshotExperience[] {
  if (!config) {
    return [...experience];
  }

  const {
    weights = {},
    engagementWeights = {},
    hide = [],
    maxDisplayed,
  } = config;

  const visible = experience.filter((entry) => !hide.includes(entry.company));

  const scored = visible.map((entry, originalIndex) => ({
    entry,
    score: weights[entry.company] ?? 0,
    originalIndex,
  }));

  scored.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    const timeDelta =
      toMonthIndex(b.entry.startDate) - toMonthIndex(a.entry.startDate);

    if (timeDelta !== 0) {
      return timeDelta;
    }

    return a.originalIndex - b.originalIndex;
  });

  const hasEngagementWeights = Object.keys(engagementWeights).length > 0;

  const projected = scored.map(({ entry }) => {
    if (
      !hasEngagementWeights ||
      !entry.engagements ||
      entry.engagements.length === 0
    ) {
      return entry;
    }

    return {
      ...entry,
      engagements: sortEngagements(entry.engagements, engagementWeights),
    };
  });

  return maxDisplayed ? projected.slice(0, maxDisplayed) : projected;
}
