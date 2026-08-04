import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import matter from 'gray-matter';
import { personaSchema, type PersonaConfig } from './persona-schema';

// ── file & YAML primitives ───────────────────────────────────────────────
//
// Mirrors the standalone-YAML parsing convention used by `parser.ts` and
// `link-resolver.ts`: gray-matter only parses frontmatter blocks, so a bare
// `*.yaml` file is wrapped as one to reuse its (js-yaml-backed) parser.

function readFileOrThrow(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `loadPersonas: unable to read required persona file "${filePath}". ${describeError(error)}`,
      { cause: error },
    );
  }
}

function readDirOrThrow(dirPath: string): string[] {
  try {
    return readdirSync(dirPath);
  } catch (error) {
    throw new Error(
      `loadPersonas: unable to read required personas directory "${dirPath}". ${describeError(error)}`,
      { cause: error },
    );
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseYamlFile(filePath: string): unknown {
  const raw = readFileOrThrow(filePath);

  try {
    return matter(`---\n${raw}\n---`).data;
  } catch (error) {
    throw new Error(
      `loadPersonas: failed to parse YAML in "${filePath}". ${describeError(error)}`,
      { cause: error },
    );
  }
}

function readYamlFilesSorted(dirPath: string): string[] {
  return readDirOrThrow(dirPath)
    .filter((file) => extname(file) === '.yaml')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// ── persona merging (extends chain) ──────────────────────────────────────

function mergePersona(
  base: PersonaConfig,
  override: PersonaConfig,
): PersonaConfig {
  return {
    ...base,
    ...override,
    id: override.id,
    skills: override.skills
      ? { ...base.skills, ...override.skills }
      : base.skills,
    experience: override.experience
      ? { ...base.experience, ...override.experience }
      : base.experience,
    meta: override.meta ? { ...base.meta, ...override.meta } : base.meta,
  };
}

/**
 * Reads every `*.yaml` file in `personasDir`, validates each against
 * `personaSchema`, and resolves `extends` chains (a persona whose `extends`
 * points at another persona id inherits its fields, with its own fields
 * taking precedence — shallow-merged per top-level key, and for the
 * `skills` / `experience` / `meta` objects, per nested key).
 *
 * Throws on: malformed YAML, schema validation failure, duplicate persona
 * ids, an `extends` reference to a persona id that doesn't exist, and
 * circular `extends` chains.
 */
export function loadPersonas(personasDir: string): Map<string, PersonaConfig> {
  const raw = new Map<string, PersonaConfig>();

  for (const file of readYamlFilesSorted(personasDir)) {
    const filePath = join(personasDir, file);
    const parsed = personaSchema.parse(parseYamlFile(filePath));

    if (raw.has(parsed.id)) {
      throw new Error(
        `loadPersonas: duplicate persona id "${parsed.id}" — already defined by another file in "${personasDir}".`,
      );
    }

    raw.set(parsed.id, parsed);
  }

  const resolved = new Map<string, PersonaConfig>();

  function resolve(id: string, chain: readonly string[]): PersonaConfig {
    const cached = resolved.get(id);

    if (cached) {
      return cached;
    }

    if (chain.includes(id)) {
      throw new Error(
        `loadPersonas: circular "extends" chain detected: ${[...chain, id].join(' -> ')}.`,
      );
    }

    const persona = raw.get(id);

    if (!persona) {
      throw new Error(
        `loadPersonas: persona "${id}" not found (referenced via "extends" in "${personasDir}").`,
      );
    }

    if (!persona.extends) {
      resolved.set(id, persona);

      return persona;
    }

    const parent = resolve(persona.extends, [...chain, id]);
    const merged = mergePersona(parent, persona);

    resolved.set(id, merged);

    return merged;
  }

  for (const id of raw.keys()) {
    resolve(id, []);
  }

  return resolved;
}

/** Loads and resolves a single persona by id from `personasDir`. */
export function loadPersona(personasDir: string, id: string): PersonaConfig {
  const persona = loadPersonas(personasDir).get(id);

  if (!persona) {
    throw new Error(
      `loadPersona: persona "${id}" not found in "${personasDir}".`,
    );
  }

  return persona;
}
