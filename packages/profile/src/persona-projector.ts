import type {
  ProfileSnapshotData,
  SkillCategoryData,
  SkillEntryData,
  SerializedProfileGraph,
} from './schema';
import type { DescriptionBlock } from './description-block';
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
  const displayNames = graph?.displayNames;
  const { skills, highlights } = projectSkills(
    profile.skills,
    graph,
    displayNames,
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
// "openai-api"). `graph.displayNames` (slug -> display name, populated from
// `skills-registry.yaml` by `buildProfileGraph()`) gives an exact lookup for
// this mapping, so that is the primary matching strategy. When no graph (or
// no `displayNames` on it) is available — e.g. a caller that only has the
// profile snapshot without its graph — matching falls back to a best-effort
// slugification of the display name, which only resolves regular slugs
// (anything derivable via lowercase + hyphenation) and misses irregular ones
// (".NET 8" -> "dotnet-8", "C#" -> "csharp", etc.).

function slugifyDisplayName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchesIdentifier(
  displayName: string,
  identifier: string,
  displayNames?: Record<string, string>,
): boolean {
  if (displayNames) {
    const mapped = displayNames[identifier];

    if (mapped) {
      return mapped === displayName;
    }
  }

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
  readonly level: number;
  score: number;
  highlight: boolean;
  priorityIndex: number;
  readonly originalIndex: number;
}

function flattenSkills(categories: readonly SkillCategoryData[]): FlatSkill[] {
  const flat: FlatSkill[] = [];
  let index = 0;

  for (const category of categories) {
    for (const skill of category.skills) {
      flat.push({
        category: category.category,
        name: skill.name,
        level: skill.level,
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
  displayNames?: Record<string, string>,
): FlatSkill[] {
  if (exclude.length === 0) {
    return skills;
  }

  return skills.filter(
    (skill) =>
      !exclude.some((id) => matchesIdentifier(skill.name, id, displayNames)),
  );
}

function applyInclude(
  skills: FlatSkill[],
  include: readonly string[] | undefined,
  displayNames?: Record<string, string>,
): FlatSkill[] {
  if (!include || include.length === 0) {
    return skills;
  }

  return skills.filter((skill) =>
    include.some(
      (id) =>
        matchesIdentifier(skill.name, id, displayNames) ||
        skill.category === id,
    ),
  );
}

function applyWeights(
  skills: FlatSkill[],
  weights: Record<string, number | { weight: number; highlight?: boolean }>,
  graph: SerializedProfileGraph | null,
  displayNames?: Record<string, string>,
): void {
  const identifiers = Object.keys(weights);

  if (identifiers.length === 0) {
    return;
  }

  for (const skill of skills) {
    const matchedId = identifiers.find((id) =>
      matchesIdentifier(skill.name, id, displayNames),
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

function applyPriority(
  skills: FlatSkill[],
  priority: readonly string[],
  displayNames?: Record<string, string>,
): void {
  priority.forEach((id, priorityIndex) => {
    for (const skill of skills) {
      if (
        skill.priorityIndex === -1 &&
        matchesIdentifier(skill.name, id, displayNames)
      ) {
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
 * "AI Engineering" would still render that category last just because
 * `content/skills-registry.yaml` happens to declare it last.
 */
function regroupSkills(skills: readonly FlatSkill[]): SkillCategoryData[] {
  const byCategory = new Map<string, SkillEntryData[]>();

  for (const skill of skills) {
    const list = byCategory.get(skill.category) ?? [];

    list.push({ name: skill.name, level: skill.level });
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
  displayNames: Record<string, string> | undefined,
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

  let working = applyExclude(flattenSkills(categories), exclude, displayNames);

  working = applyInclude(working, include, displayNames);
  applyWeights(working, weights, graph, displayNames);
  applyPriority(working, priority, displayNames);

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
    charLimit,
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

  const truncated = maxDisplayed ? projected.slice(0, maxDisplayed) : projected;

  return charLimit
    ? truncated.map((entry) =>
        applyExperienceCharLimit(entry, charLimit, engagementWeights),
      )
    : truncated;
}

// ── experience char-limit truncation ─────────────────────────────────────
//
// LinkedIn hard-caps a position's description field at 2000 chars. This
// mirrors `PlatformService.renderExperienceEntry()` in
// `apps/readme/src/platform/platform.service.ts` char-for-char: the counted
// string is the umbrella description blocks + each engagement's rendered
// block ("title (domain, client)" header + its description blocks), joined
// by blank lines. Role, company, date range, and the "(N chars)" label are
// renderer metadata and are NOT counted. If this drifts from
// `renderExperienceEntry()`, the projector's truncation target stops
// matching what actually gets pasted into LinkedIn — keep both in sync.

function renderBlocksForCount(blocks: readonly DescriptionBlock[]): string {
  return blocks
    .map((block) =>
      block.type === 'bullets'
        ? block.lines.map((line) => `• ${line}`).join('\n')
        : block.lines.join('\n'),
    )
    .join('\n');
}

function renderEngagementForCount(eng: SnapshotEngagement): string {
  const meta = [eng.domain, eng.client].filter(Boolean).join(', ');
  const title = meta ? `${eng.title} (${meta})` : eng.title;

  return `${title}\n${renderBlocksForCount(eng.description)}`;
}

function experienceCharCount(
  description: readonly DescriptionBlock[],
  engagements: readonly SnapshotEngagement[] | undefined,
): number {
  const parts = [renderBlocksForCount(description)];

  for (const eng of engagements ?? []) {
    parts.push(renderEngagementForCount(eng));
  }

  return parts.join('\n\n').length;
}

/**
 * Removes the last line of the last non-empty `bullets` block, starting
 * search from `startIndex` (exclusive of anything before it). Drops the
 * block entirely once it runs out of lines. Returns `null` when there is
 * nothing left to trim (no `bullets` block with lines at/after `startIndex`)
 * — `paragraph` blocks are never touched, matching the rule that context
 * text is never removed, only bullets.
 */
function trimLastBulletLine(
  blocks: readonly DescriptionBlock[],
  startIndex: number,
): DescriptionBlock[] | null {
  const next = blocks.map((block) => ({ ...block, lines: [...block.lines] }));

  for (let i = next.length - 1; i >= startIndex; i--) {
    if (next[i].type === 'bullets' && next[i].lines.length > 0) {
      next[i].lines.pop();

      if (next[i].lines.length === 0) {
        next.splice(i, 1);
      }

      return next;
    }
  }

  return null;
}

function hasBulletLines(blocks: readonly DescriptionBlock[]): boolean {
  return blocks.some(
    (block) => block.type === 'bullets' && block.lines.length > 0,
  );
}

/**
 * Index of the engagement with the lowest `engagementWeights` score that
 * still has at least one bullet line to trim, or -1 when none remain.
 * Unweighted engagements default to score 0, so they are trimmed before
 * any explicitly weighted engagement.
 */
function lowestWeightEngagementWithBullets(
  engagements: readonly SnapshotEngagement[],
  engagementWeights: Record<string, number>,
): number {
  let bestIndex = -1;
  let bestWeight = Infinity;

  engagements.forEach((eng, index) => {
    if (!hasBulletLines(eng.description)) {
      return;
    }

    const weight = engagementWeights[eng.title] ?? 0;

    if (weight < bestWeight) {
      bestWeight = weight;
      bestIndex = index;
    }
  });

  return bestIndex;
}

/**
 * Trims a single experience entry to fit within `charLimit`, matching how
 * `renderExperienceEntry()` counts chars (see `experienceCharCount()`).
 *
 * Trimming order (never removes umbrella paragraph text or engagement
 * headers/context paragraphs — only bullets):
 * 1. Engagement bullets, lowest-weight engagement first, last bullet first
 *    within that engagement. An engagement that loses all its bullets is
 *    removed entirely.
 * 2. Once no engagement has bullets left to trim, umbrella bullets (the
 *    entry's own `description` blocks after the first/paragraph block),
 *    last bullet first.
 */
function applyExperienceCharLimit(
  entry: SnapshotExperience,
  charLimit: number,
  engagementWeights: Record<string, number>,
): SnapshotExperience {
  let description = entry.description;
  let engagements = entry.engagements;

  if (experienceCharCount(description, engagements) <= charLimit) {
    return entry;
  }

  if (engagements && engagements.length > 0) {
    let working = [...engagements];

    while (experienceCharCount(description, working) > charLimit) {
      const targetIndex = lowestWeightEngagementWithBullets(
        working,
        engagementWeights,
      );

      if (targetIndex === -1) {
        break;
      }

      const trimmedDescription = trimLastBulletLine(
        working[targetIndex].description,
        0,
      );

      if (trimmedDescription === null) {
        break;
      }

      working = hasBulletLines(trimmedDescription)
        ? working.map((eng, index) =>
            index === targetIndex
              ? { ...eng, description: trimmedDescription }
              : eng,
          )
        : working.filter((_, index) => index !== targetIndex);
    }

    engagements = working;
  }

  if (experienceCharCount(description, engagements) > charLimit) {
    let working = description;

    while (experienceCharCount(working, engagements) > charLimit) {
      const trimmed = trimLastBulletLine(working, 1);

      if (trimmed === null) {
        break;
      }

      working = trimmed;
    }

    description = working;
  }

  return { ...entry, description, engagements };
}
