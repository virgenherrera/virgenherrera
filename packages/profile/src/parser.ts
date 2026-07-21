import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import matter from 'gray-matter';
import {
  profileSchema,
  type ProfileData,
  type SkillCategoryData,
} from './schema';

/**
 * A single canonical entry from `content/skills-registry.yaml`.
 * `slug` is the cross-reference key used by every other content file;
 * `display` is the human-readable name that ends up in `ProfileData`.
 */
interface SkillRegistryEntry {
  readonly slug: string;
  readonly display: string;
  readonly category: string;
}

interface RawMeta {
  readonly name: string;
  readonly headline: string;
  readonly summary: string;
  readonly location: string;
  readonly email?: string;
  readonly phone?: string;
}

interface RawExperience {
  readonly company: string;
  readonly role: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly description: string[];
  readonly technologies: string[];
}

interface RawEducation {
  readonly degree: string;
  readonly degreeTranslation: string;
  readonly institution: string;
  readonly location: string;
  readonly startDate: string;
  readonly graduationDate: string;
  readonly honors?: string;
}

const LINK_FIELDS = [
  'label',
  'url',
  'icon',
  'target',
  'visibility',
  'type',
  'cta',
] as const;

const LANGUAGE_FIELDS = ['language', 'proficiency'] as const;

/**
 * Reads a `content/` directory (Markdown + YAML) and produces a `ProfileData`
 * object validated against `profileSchema` — the same shape previously
 * produced by `profileSchema.parse(profileJson)`.
 */
export function parseContent(contentDir: string): ProfileData {
  const registry = readSkillsRegistry(join(contentDir, 'skills-registry.yaml'));
  const lookup = buildSkillLookup(registry);

  const meta = parseMeta(join(contentDir, 'meta.md'));
  const experience = parseExperienceDir(join(contentDir, 'experience'), lookup);
  const education = parseEducationDir(join(contentDir, 'education'));
  const projects = parseProjects(join(contentDir, 'projects.yaml'), lookup);
  const links = parseRecordArray(
    join(contentDir, 'links.yaml'),
    'links',
    LINK_FIELDS,
    ['label', 'url'],
  );
  const languages = parseRecordArray(
    join(contentDir, 'languages.yaml'),
    'languages',
    LANGUAGE_FIELDS,
    ['language', 'proficiency'],
  );
  const skills = groupSkillsByCategory(registry);

  const raw: Record<string, unknown> = {
    ...meta,
    links,
    experience,
    education,
    certifications: [],
    projects,
    skills,
    languages,
  };

  return profileSchema.parse(raw);
}

// ── file & frontmatter primitives ───────────────────────────────────────────

function readFileOrThrow(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `parseContent: unable to read required content file "${filePath}". ${describeError(error)}`,
      {
        cause: error,
      },
    );
  }
}

function readDirOrThrow(dirPath: string): string[] {
  try {
    return readdirSync(dirPath);
  } catch (error) {
    throw new Error(
      `parseContent: unable to read required content directory "${dirPath}". ${describeError(error)}`,
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
      `parseContent: "${sourceFile}" (${context}) must be a YAML/frontmatter object.`,
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
      `parseContent: failed to parse ${label} in "${filePath}". ${describeError(error)}`,
      {
        cause: error,
      },
    );
  }
}

/** Parses the frontmatter + body of a Markdown file, with descriptive errors on malformed YAML. */
function parseFrontmatter(filePath: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const raw = readFileOrThrow(filePath);
  const { data, content } = safeMatter(raw, filePath, 'frontmatter');

  return { data: asRecord(data, filePath, 'frontmatter'), content };
}

/**
 * Parses a standalone `.yaml` file (no frontmatter delimiters) by reusing
 * gray-matter's public API: wrapping the raw text as a frontmatter block and
 * reading back `.data`. Works for both object and top-level array YAML roots.
 */
function parseYamlFile(filePath: string): unknown {
  const raw = readFileOrThrow(filePath);

  return safeMatter(`---\n${raw}\n---`, filePath, 'YAML').data;
}

/**
 * Reads a standalone `.yaml` content file whose array lives under a named
 * top-level key (e.g. `projects:`, `links:`, `languages:`) — the same
 * wrapping convention used by `skills-registry.yaml`'s `skills:` key.
 */
function readYamlArray(filePath: string, field: string): unknown[] {
  const data = asRecord(parseYamlFile(filePath), filePath, 'root');
  const entries = data[field];

  if (!Array.isArray(entries)) {
    throw new Error(
      `parseContent: "${filePath}" must define a top-level "${field}" array.`,
    );
  }

  return entries;
}

function readMarkdownFilesSorted(dirPath: string): string[] {
  return readDirOrThrow(dirPath)
    .filter((file) => extname(file) === '.md')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// ── field-level readers ──────────────────────────────────────────────────────

function requireString(
  record: Record<string, unknown>,
  field: string,
  sourceFile: string,
): string {
  const value = record[field];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `parseContent: "${sourceFile}" is missing required field "${field}".`,
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
      `parseContent: "${sourceFile}" field "${field}" must be an array of strings.`,
    );
  }

  return value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(
        `parseContent: "${sourceFile}" field "${field}[${index}]" must be a string.`,
      );
    }

    return item;
  });
}

function pickDefined(
  record: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      result[key] = record[key];
    }
  }

  return result;
}

// ── skills registry ──────────────────────────────────────────────────────────

function readSkillsRegistry(filePath: string): SkillRegistryEntry[] {
  const data = parseYamlFile(filePath);
  const record = asRecord(data, filePath, 'root');
  const entries = record.skills;

  if (!Array.isArray(entries)) {
    throw new Error(
      `parseContent: "${filePath}" must define a top-level "skills" array.`,
    );
  }

  return entries.map((entry, index) => {
    const context = `${filePath}#skills[${index}]`;
    const entryRecord = asRecord(entry, filePath, `skills[${index}]`);

    return {
      slug: requireString(entryRecord, 'slug', context),
      display: requireString(entryRecord, 'display', context),
      category: requireString(entryRecord, 'category', context),
    };
  });
}

function buildSkillLookup(
  registry: readonly SkillRegistryEntry[],
): Map<string, SkillRegistryEntry> {
  const lookup = new Map<string, SkillRegistryEntry>();

  for (const entry of registry) {
    if (lookup.has(entry.slug)) {
      throw new Error(
        `parseContent: duplicate skill slug "${entry.slug}" in skills-registry.yaml.`,
      );
    }

    lookup.set(entry.slug, entry);
  }

  return lookup;
}

function resolveDisplayNames(
  slugs: readonly string[],
  lookup: ReadonlyMap<string, SkillRegistryEntry>,
  sourceContext: string,
): string[] {
  return slugs.map((slug) => {
    const entry = lookup.get(slug);

    if (!entry) {
      throw new Error(
        `parseContent: unknown skill slug "${slug}" referenced in ${sourceContext}. ` +
          'Add it to content/skills-registry.yaml or fix the typo.',
      );
    }

    return entry.display;
  });
}

function groupSkillsByCategory(
  registry: readonly SkillRegistryEntry[],
): SkillCategoryData[] {
  const categoryOrder: string[] = [];
  const byCategory = new Map<string, string[]>();

  for (const entry of registry) {
    let skills = byCategory.get(entry.category);

    if (!skills) {
      skills = [];
      byCategory.set(entry.category, skills);
      categoryOrder.push(entry.category);
    }

    skills.push(entry.display);
  }

  return categoryOrder.map((category) => ({
    category,
    skills: byCategory.get(category) ?? [],
  }));
}

// ── meta.md ───────────────────────────────────────────────────────────────

function parseMeta(filePath: string): RawMeta {
  const { data } = parseFrontmatter(filePath);

  return {
    name: requireString(data, 'name', filePath),
    headline: requireString(data, 'headline', filePath),
    summary: requireString(data, 'summary', filePath),
    location: requireString(data, 'location', filePath),
    email: optionalString(data, 'email'),
    phone: optionalString(data, 'phone'),
  };
}

// ── experience/*.md ──────────────────────────────────────────────────────

function parseDescriptionLines(body: string): string[] {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parseExperienceDir(
  dirPath: string,
  lookup: ReadonlyMap<string, SkillRegistryEntry>,
): RawExperience[] {
  return readMarkdownFilesSorted(dirPath).map((file) => {
    const filePath = join(dirPath, file);
    const { data, content } = parseFrontmatter(filePath);
    const slugs = requireStringArray(data, 'skills', filePath);
    const technologies = resolveDisplayNames(slugs, lookup, filePath);
    const description = parseDescriptionLines(content);

    if (description.length === 0) {
      throw new Error(
        `parseContent: "${filePath}" has an empty body — at least one description line is required.`,
      );
    }

    return {
      company: requireString(data, 'company', filePath),
      role: requireString(data, 'role', filePath),
      startDate: requireString(data, 'startDate', filePath),
      endDate: optionalString(data, 'endDate'),
      description,
      technologies,
    };
  });
}

// ── education/*.md ───────────────────────────────────────────────────────

function parseEducationDir(dirPath: string): RawEducation[] {
  return readMarkdownFilesSorted(dirPath).map((file) => {
    const filePath = join(dirPath, file);
    const { data } = parseFrontmatter(filePath);

    return {
      degree: requireString(data, 'degree', filePath),
      degreeTranslation: requireString(data, 'degreeTranslation', filePath),
      institution: requireString(data, 'institution', filePath),
      location: requireString(data, 'location', filePath),
      startDate: requireString(data, 'startDate', filePath),
      graduationDate: requireString(data, 'graduationDate', filePath),
      honors: optionalString(data, 'honors'),
    };
  });
}

// ── projects.yaml ────────────────────────────────────────────────────────

function parseProjects(
  filePath: string,
  lookup: ReadonlyMap<string, SkillRegistryEntry>,
): Record<string, unknown>[] {
  return readYamlArray(filePath, 'projects').map((item, index) => {
    const context = `${filePath}[${index}]`;
    const record = asRecord(item, filePath, `[${index}]`);
    const slugs = requireStringArray(record, 'technologies', context);
    const technologies = resolveDisplayNames(slugs, lookup, context);

    return {
      ...pickDefined(record, ['name', 'description', 'url']),
      technologies,
    };
  });
}

// ── links.yaml / languages.yaml ──────────────────────────────────────────

function parseRecordArray(
  filePath: string,
  field: string,
  allowedFields: readonly string[],
  requiredFields: readonly string[],
): Record<string, unknown>[] {
  return readYamlArray(filePath, field).map((item, index) => {
    const context = `${filePath}[${index}]`;
    const record = asRecord(item, filePath, `[${index}]`);

    for (const field of requiredFields) {
      requireString(record, field, context);
    }

    return pickDefined(record, allowedFields);
  });
}
