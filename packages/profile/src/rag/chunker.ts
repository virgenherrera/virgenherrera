import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import matter from 'gray-matter';

/**
 * Metadata attached to every chunk, used by the retriever for filtering,
 * boosting, and graph expansion (see `retriever.ts`).
 */
export interface ChunkMetadata {
  source: string;
  type: 'experience' | 'education' | 'summary' | 'project';
  skills: string[];
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
}

export interface Chunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
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

const MAX_CHUNK_CHARS = 500;
const ENRICHMENT_SKILL_LIMIT = 5;

/**
 * Splits `content/` into enriched chunks for embedding (D6). Reads the raw
 * content files directly — independent of `parser.ts` / `link-resolver.ts` —
 * so it can evolve its own chunking strategy without coupling to the typed
 * `ProfileData` shape.
 */
export function chunkContent(contentDir: string): Chunk[] {
  const displayBySlug = readSkillsRegistry(
    join(contentDir, 'skills-registry.yaml'),
  );

  return [
    ...chunkSummary(join(contentDir, 'meta.md')),
    ...chunkExperience(join(contentDir, 'experience'), displayBySlug),
    ...chunkEducation(join(contentDir, 'education')),
    ...chunkProjects(join(contentDir, 'projects.yaml'), displayBySlug),
  ];
}

// ── file & frontmatter primitives ───────────────────────────────────────────

function readFileOrThrow(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `chunkContent: unable to read required content file "${filePath}". ${describeError(error)}`,
      { cause: error },
    );
  }
}

function readDirOrThrow(dirPath: string): string[] {
  try {
    return readdirSync(dirPath);
  } catch (error) {
    throw new Error(
      `chunkContent: unable to read required content directory "${dirPath}". ${describeError(error)}`,
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
      `chunkContent: "${sourceFile}" (${context}) must be a YAML/frontmatter object.`,
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
      `chunkContent: failed to parse ${label} in "${filePath}". ${describeError(error)}`,
      { cause: error },
    );
  }
}

function parseFrontmatter(filePath: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const raw = readFileOrThrow(filePath);
  const { data, content } = safeMatter(raw, filePath, 'frontmatter');

  return { data: asRecord(data, filePath, 'frontmatter'), content };
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
      `chunkContent: "${filePath}" must define a top-level "${field}" array.`,
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
      `chunkContent: "${sourceFile}" is missing required field "${field}".`,
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
      `chunkContent: "${sourceFile}" field "${field}" must be an array of strings.`,
    );
  }

  return value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(
        `chunkContent: "${sourceFile}" field "${field}[${index}]" must be a string.`,
      );
    }

    return item;
  });
}

// ── skills registry ──────────────────────────────────────────────────────────

function readSkillsRegistry(filePath: string): Map<string, string> {
  const entries = readYamlArray(filePath, 'skills');
  const displayBySlug = new Map<string, string>();

  entries.forEach((entry, index) => {
    const context = `${filePath}#skills[${index}]`;
    const record = asRecord(entry, filePath, `skills[${index}]`);
    const slug = requireString(record, 'slug', context);
    const display = requireString(record, 'display', context);

    displayBySlug.set(slug, display);
  });

  return displayBySlug;
}

function resolveDisplayNames(
  slugs: readonly string[],
  displayBySlug: ReadonlyMap<string, string>,
): string[] {
  return slugs.map((slug) => displayBySlug.get(slug) ?? slug);
}

// ── shared helpers ────────────────────────────────────────────────────────

/**
 * Strips the numeric ordering prefix and extension from a content filename,
 * e.g. "04-epam-engineer.md" -> "epam-engineer". Used as the chunk id
 * fragment instead of `slugify(company)` because a company can appear in
 * multiple files (e.g. two roles at the same employer), which would
 * otherwise collide.
 */
function fileStem(file: string): string {
  return file.replace(/\.md$/, '').replace(/^\d+-/, '');
}

/** kebab-cases free text into a deterministic id fragment. */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Splits body text into non-empty lines (each authored as a single sentence
 * or bullet, mirroring `parser.ts`'s `parseDescriptionLines`), then groups
 * those lines into ~500 char chunks without ever splitting a line — so a
 * chunk boundary never lands mid-sentence.
 */
function groupLines(lines: readonly string[], maxChars: number): string[][] {
  const groups: string[][] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const line of lines) {
    const addedLength = line.length + 1;

    if (current.length > 0 && currentLength + addedLength > maxChars) {
      groups.push(current);
      current = [];
      currentLength = 0;
    }

    current.push(line);
    currentLength += addedLength;
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
}

/**
 * Splits markdown body content into non-empty lines, stripping the leading
 * `*` bullet marker (see `description-block.ts`) so it doesn't pollute the
 * embedded text — the marker is an authoring convention, not content.
 */
function bodyLines(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => (line.startsWith('*') ? line.slice(1).trim() : line));
}

function formatDateRange(
  startDate: string,
  endDate: string | undefined,
): string {
  return endDate ? `${startDate} to ${endDate}` : `${startDate}-present`;
}

/** Prepends the D6 context-enrichment prefix used before embedding. */
function enrich(
  skills: readonly string[],
  context: string,
  body: string,
): string {
  const lines: string[] = [];

  if (skills.length > 0) {
    lines.push(
      `[Skills: ${skills.slice(0, ENRICHMENT_SKILL_LIMIT).join(', ')}]`,
    );
  }

  lines.push(`[Context: ${context}]`);
  lines.push(body);

  return lines.join('\n');
}

// ── summary (meta.md) ────────────────────────────────────────────────────

function chunkSummary(filePath: string): Chunk[] {
  const { data } = parseFrontmatter(filePath);
  const name = requireString(data, 'name', filePath);
  const headline = requireString(data, 'headline', filePath);
  const summary = requireString(data, 'summary', filePath);

  return [
    {
      id: 'summary-0',
      text: enrich([], `Professional summary — ${name}, ${headline}`, summary),
      metadata: { source: 'meta.md', type: 'summary', skills: [] },
    },
  ];
}

// ── experience/*.md ──────────────────────────────────────────────────────

function chunkExperience(
  dirPath: string,
  displayBySlug: ReadonlyMap<string, string>,
): Chunk[] {
  return readMarkdownFilesSorted(dirPath).flatMap((file) => {
    const filePath = join(dirPath, file);
    const { data, content } = parseFrontmatter(filePath);
    const company = requireString(data, 'company', filePath);
    const role = requireString(data, 'role', filePath);
    const startDate = requireString(data, 'startDate', filePath);
    const endDate = optionalString(data, 'endDate');
    const slugs = requireStringArray(data, 'skills', filePath);
    const displayNames = resolveDisplayNames(slugs, displayBySlug);
    const context = `${role} at ${company}, ${formatDateRange(startDate, endDate)}`;
    const groups = groupLines(bodyLines(content), MAX_CHUNK_CHARS);

    if (groups.length === 0) {
      throw new Error(
        `chunkContent: "${filePath}" has an empty body — at least one description line is required.`,
      );
    }

    const baseId = `experience-${fileStem(file)}`;

    return groups.map((group, index) => ({
      id: groups.length === 1 ? baseId : `${baseId}-${index + 1}`,
      text: enrich(displayNames, context, group.join(' ')),
      metadata: {
        source: `experience/${file}`,
        type: 'experience' as const,
        skills: slugs,
        company,
        role,
        startDate,
        endDate,
      },
    }));
  });
}

// ── education/*.md ───────────────────────────────────────────────────────

function readEducationEntry(filePath: string): RawEducation {
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
}

function chunkEducation(dirPath: string): Chunk[] {
  return readMarkdownFilesSorted(dirPath).map((file) => {
    const filePath = join(dirPath, file);
    const education = readEducationEntry(filePath);
    const range = formatDateRange(
      education.startDate,
      education.graduationDate,
    );
    const title = `${education.degree} (${education.degreeTranslation})`;
    const context = `${title} — ${education.institution}, ${education.location}, ${range}`;
    const honorsSuffix = education.honors ? ` ${education.honors}.` : '';
    const body = `${title} from ${education.institution}, ${education.location}.${honorsSuffix}`;

    return {
      id: `education-${fileStem(file)}`,
      text: enrich([], context, body),
      metadata: {
        source: `education/${file}`,
        type: 'education' as const,
        skills: [],
        startDate: education.startDate,
        endDate: education.graduationDate,
      },
    };
  });
}

// ── projects.yaml ────────────────────────────────────────────────────────

function chunkProjects(
  filePath: string,
  displayBySlug: ReadonlyMap<string, string>,
): Chunk[] {
  return readYamlArray(filePath, 'projects').map((item, index) => {
    const context = `${filePath}[${index}]`;
    const record = asRecord(item, filePath, `[${index}]`);
    const name = requireString(record, 'name', context);
    const description = requireString(record, 'description', context);
    const slugs = requireStringArray(record, 'technologies', context);
    const displayNames = resolveDisplayNames(slugs, displayBySlug);

    return {
      id: `project-${slugify(name)}`,
      text: enrich(displayNames, `Project — ${name}`, description),
      metadata: {
        source: `projects.yaml#${slugify(name)}`,
        type: 'project' as const,
        skills: slugs,
      },
    };
  });
}
