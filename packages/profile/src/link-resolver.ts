import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import matter from 'gray-matter';

/**
 * Aggregated stats for a single skill slug across the whole profile graph.
 */
export interface SkillStats {
  readonly experiences: string[];
  readonly projects: string[];
  readonly years: number;
}

/**
 * Bidirectional adjacency graph between skills, experiences, and projects.
 *
 * Built directly from `content/` (skills-registry.yaml, experience/*.md
 * frontmatter, projects.yaml) — independent of `parser.ts`.
 */
export interface ProfileGraph {
  readonly bySkill: Map<string, SkillStats>;
  readonly byExperience: Map<string, string[]>;
  readonly byProject: Map<string, string[]>;
}

interface ExperienceEntry {
  readonly company: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly skills: string[];
}

interface ProjectEntry {
  readonly name: string;
  readonly technologies: string[];
}

interface Interval {
  start: number;
  end: number;
}

/**
 * Reads `content/` (skills-registry.yaml, experience/*.md, projects.yaml)
 * and builds a bidirectional adjacency graph between skills, experiences,
 * and projects, along with a computed years-per-skill figure (D5).
 */
export function buildProfileGraph(contentDir: string): ProfileGraph {
  const validSlugs = readSkillSlugs(join(contentDir, 'skills-registry.yaml'));
  const experiences = readExperiences(join(contentDir, 'experience'));
  const projects = readProjects(join(contentDir, 'projects.yaml'));

  validateSlugs(experiences, projects, validSlugs);

  const byExperience = buildByExperience(experiences);
  const byProject = buildByProject(projects);
  const bySkill = buildBySkill(experiences, projects);

  return { bySkill, byExperience, byProject };
}

// ── file & frontmatter primitives ───────────────────────────────────────────

function readFileOrThrow(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `buildProfileGraph: unable to read required content file "${filePath}". ${describeError(error)}`,
      { cause: error },
    );
  }
}

function readDirOrThrow(dirPath: string): string[] {
  try {
    return readdirSync(dirPath);
  } catch (error) {
    throw new Error(
      `buildProfileGraph: unable to read required content directory "${dirPath}". ${describeError(error)}`,
      { cause: error },
    );
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function asRecord(
  value: unknown,
  sourceFile: string,
  context: string,
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(
      `buildProfileGraph: "${sourceFile}" (${context}) must be a YAML/frontmatter object.`,
    );
  }

  return value as Record<string, unknown>;
}

function safeMatter(
  raw: string,
  filePath: string,
  label: string,
): ReturnType<typeof matter> {
  try {
    return matter(raw);
  } catch (error) {
    throw new Error(
      `buildProfileGraph: failed to parse ${label} in "${filePath}". ${describeError(error)}`,
      { cause: error },
    );
  }
}

function parseFrontmatter(filePath: string): Record<string, unknown> {
  const raw = readFileOrThrow(filePath);
  const { data } = safeMatter(raw, filePath, 'frontmatter');

  return asRecord(data, filePath, 'frontmatter');
}

function parseYamlFile(filePath: string): unknown {
  const raw = readFileOrThrow(filePath);

  return safeMatter(`---\n${raw}\n---`, filePath, 'YAML').data;
}

function readYamlArray(filePath: string, field: string): unknown[] {
  const data = asRecord(parseYamlFile(filePath), filePath, 'root');
  const entries = data[field];

  if (!Array.isArray(entries)) {
    throw new Error(
      `buildProfileGraph: "${filePath}" must define a top-level "${field}" array.`,
    );
  }

  return entries;
}

function readMarkdownFilesSorted(dirPath: string): string[] {
  return readDirOrThrow(dirPath)
    .filter((file) => extname(file) === '.md')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function requireString(
  record: Record<string, unknown>,
  field: string,
  sourceFile: string,
): string {
  const value = record[field];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `buildProfileGraph: "${sourceFile}" is missing required field "${field}".`,
    );
  }

  return value;
}

function optionalString(
  record: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = record[field];

  return typeof value === 'string' && value.trim().length > 0
    ? value
    : undefined;
}

function requireStringArray(
  record: Record<string, unknown>,
  field: string,
  sourceFile: string,
): string[] {
  const value = record[field];

  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(
      `buildProfileGraph: "${sourceFile}" field "${field}" must be an array of strings.`,
    );
  }

  return value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(
        `buildProfileGraph: "${sourceFile}" field "${field}[${index}]" must be a string.`,
      );
    }

    return item;
  });
}

// ── content readers ──────────────────────────────────────────────────────

function readSkillSlugs(filePath: string): Set<string> {
  const entries = readYamlArray(filePath, 'skills');
  const slugs = new Set<string>();

  entries.forEach((entry, index) => {
    const context = `${filePath}#skills[${index}]`;
    const record = asRecord(entry, filePath, `skills[${index}]`);
    const slug = requireString(record, 'slug', context);

    if (slugs.has(slug)) {
      throw new Error(
        `buildProfileGraph: duplicate skill slug "${slug}" in skills-registry.yaml.`,
      );
    }

    slugs.add(slug);
  });

  return slugs;
}

function readExperiences(dirPath: string): ExperienceEntry[] {
  return readMarkdownFilesSorted(dirPath).map((file) => {
    const filePath = join(dirPath, file);
    const data = parseFrontmatter(filePath);

    return {
      company: requireString(data, 'company', filePath),
      startDate: requireString(data, 'startDate', filePath),
      endDate: optionalString(data, 'endDate'),
      skills: requireStringArray(data, 'skills', filePath),
    };
  });
}

function readProjects(filePath: string): ProjectEntry[] {
  return readYamlArray(filePath, 'projects').map((item, index) => {
    const context = `${filePath}[${index}]`;
    const record = asRecord(item, filePath, `[${index}]`);

    return {
      name: requireString(record, 'name', context),
      technologies: requireStringArray(record, 'technologies', context),
    };
  });
}

// ── validation ────────────────────────────────────────────────────────────

function validateSlugs(
  experiences: readonly ExperienceEntry[],
  projects: readonly ProjectEntry[],
  validSlugs: ReadonlySet<string>,
): void {
  for (const experience of experiences) {
    for (const slug of experience.skills) {
      if (!validSlugs.has(slug)) {
        throw new Error(
          `buildProfileGraph: unknown skill slug "${slug}" referenced by experience "${experience.company}". ` +
            'Add it to content/skills-registry.yaml or fix the typo.',
        );
      }
    }
  }

  for (const project of projects) {
    for (const slug of project.technologies) {
      if (!validSlugs.has(slug)) {
        throw new Error(
          `buildProfileGraph: unknown skill slug "${slug}" referenced by project "${project.name}". ` +
            'Add it to content/skills-registry.yaml or fix the typo.',
        );
      }
    }
  }
}

// ── graph assembly ───────────────────────────────────────────────────────

function buildByExperience(
  experiences: readonly ExperienceEntry[],
): Map<string, string[]> {
  const byExperience = new Map<string, string[]>();

  for (const experience of experiences) {
    byExperience.set(experience.company, [...experience.skills]);
  }

  return byExperience;
}

function buildByProject(
  projects: readonly ProjectEntry[],
): Map<string, string[]> {
  const byProject = new Map<string, string[]>();

  for (const project of projects) {
    byProject.set(project.name, [...project.technologies]);
  }

  return byProject;
}

function buildBySkill(
  experiences: readonly ExperienceEntry[],
  projects: readonly ProjectEntry[],
): Map<string, SkillStats> {
  const experiencesBySlug = new Map<string, string[]>();
  const projectsBySlug = new Map<string, string[]>();
  const intervalsBySlug = new Map<string, Interval[]>();

  for (const experience of experiences) {
    const interval = toInterval(experience.startDate, experience.endDate);

    for (const slug of experience.skills) {
      pushUnique(experiencesBySlug, slug, experience.company);
      pushInterval(intervalsBySlug, slug, interval);
    }
  }

  for (const project of projects) {
    for (const slug of project.technologies) {
      pushUnique(projectsBySlug, slug, project.name);
    }
  }

  const allSlugs = new Set<string>([
    ...experiencesBySlug.keys(),
    ...projectsBySlug.keys(),
  ]);

  const bySkill = new Map<string, SkillStats>();

  for (const slug of allSlugs) {
    bySkill.set(slug, {
      experiences: experiencesBySlug.get(slug) ?? [],
      projects: projectsBySlug.get(slug) ?? [],
      years: computeYears(intervalsBySlug.get(slug) ?? []),
    });
  }

  return bySkill;
}

function pushUnique(
  map: Map<string, string[]>,
  key: string,
  value: string,
): void {
  const list = map.get(key);

  if (!list) {
    map.set(key, [value]);

    return;
  }

  if (!list.includes(value)) {
    list.push(value);
  }
}

function pushInterval(
  map: Map<string, Interval[]>,
  key: string,
  interval: Interval,
): void {
  const list = map.get(key);

  if (!list) {
    map.set(key, [interval]);

    return;
  }

  list.push(interval);
}

// ── years-per-skill (D5) ─────────────────────────────────────────────────

function toMonthIndex(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);

  return year * 12 + (month - 1);
}

function currentMonthIndex(): number {
  const now = new Date();

  return now.getUTCFullYear() * 12 + now.getUTCMonth();
}

function toInterval(startDate: string, endDate: string | undefined): Interval {
  const start = toMonthIndex(startDate);
  const end = endDate ? toMonthIndex(endDate) : currentMonthIndex();

  return { start, end: Math.max(end, start) };
}

/**
 * Merges overlapping/adjacent intervals so periods like the EPAM engineer +
 * manager roles (same skill referenced by two overlapping date ranges)
 * aren't double-counted.
 */
function mergeIntervals(intervals: readonly Interval[]): Interval[] {
  if (intervals.length === 0) {
    return [];
  }

  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [{ ...sorted[0] }];

  for (const current of sorted.slice(1)) {
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

function computeYears(intervals: readonly Interval[]): number {
  const totalMonths = mergeIntervals(intervals).reduce(
    (sum, interval) => sum + (interval.end - interval.start),
    0,
  );

  return Math.round((totalMonths / 12) * 10) / 10;
}
