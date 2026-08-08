import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { getProfile } from '@vh/profile/server';
import { loadPersona } from '@vh/profile/persona-loader';
import { projectProfile } from '@vh/profile/persona-projector';
import type { DescriptionBlock } from '@vh/profile';
import type { ProfileSnapshotData } from '@vh/profile/schema';
import { LINKEDIN_LIMITS } from './linkedin-limits';

const REPO_ROOT = resolve(__dirname, '../../../..');
const PERSONAS_DIR = resolve(REPO_ROOT, 'packages/profile/personas');
const OUTPUT_FILE = '.tmp-linkedin-profile.txt';
const PERSONA_ID = 'linkedin';

const BANNER_WIDTH = 80;
const HEADER_WIDTH = 82;

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

type SnapshotExperience = ProfileSnapshotData['experience'][number];
type SnapshotEducation = ProfileSnapshotData['education'][number];
type YearMonth = { year: number; month: number };

@Injectable()
export class LinkedinService {
  private readonly logger = new Logger(LinkedinService.name);

  // Synchronous end-to-end (no network I/O, unlike `ReadmeService.generate()`)
  // — `main.ts` still `await`s the call, which resolves immediately for a
  // non-Promise return value, keeping the two commands' dispatch symmetric.
  generate(): void {
    const profile = getProfile();
    const persona = loadPersona(PERSONAS_DIR, PERSONA_ID);

    // `getProfile()` already ran the full profile through `profileSchema`
    // (dates -> {year, month}, descriptions -> DescriptionBlock[]) — the
    // exact runtime shape `ProfileSnapshotData` expects, minus the optional
    // `graph` field. No pre-built graph is available to this adapter, so
    // `projectProfile()` receives `null` and falls back to slugified
    // identifier matching (see `persona-projector.ts`), which is sufficient
    // for the regular skill/company identifiers this persona references.
    const snapshot = profile as unknown as ProfileSnapshotData;
    const projected = projectProfile(snapshot, null, persona);

    const skillNames = projected.skills.flatMap((category) =>
      category.skills.map((skill) => skill.name),
    );

    const sections = [
      renderBanner(projected.name),
      renderHeadline(projected.headline),
      renderAbout(projected.summary),
      renderSkills(skillNames),
      renderExperience(projected.experience),
      renderEducation(projected.education),
      renderFeatured(projected.technologyHighlights ?? []),
      renderFooter(),
    ];

    const outputPath = resolve(REPO_ROOT, OUTPUT_FILE);

    writeFileSync(outputPath, sections.join('\n\n') + '\n', 'utf-8');

    this.logger.log(`LinkedIn profile generated at ${outputPath}`);
  }
}

// ── section renderers ────────────────────────────────────────────────────

function renderBanner(name: string): string {
  const rule = '='.repeat(BANNER_WIDTH);
  const generated = new Date().toISOString().slice(0, 10);

  return `${rule}\nLINKEDIN PROFILE — ${name}\nGenerated: ${generated}\n${rule}`;
}

function renderHeadline(headline: string): string {
  return `${sectionHeader('HEADLINE', charCount(headline, LINKEDIN_LIMITS.headline))}\n${headline}`;
}

function renderAbout(summary: string): string {
  return `${sectionHeader('ABOUT', charCount(summary, LINKEDIN_LIMITS.about))}\n${summary}`;
}

function renderSkills(skillNames: readonly string[]): string {
  const header = sectionHeader('SKILLS', `${skillNames.length} items`);

  return `${header}\n${skillNames.join(', ')}`;
}

function renderExperience(entries: readonly SnapshotExperience[]): string {
  const header = sectionHeader('EXPERIENCE', '');
  const body = entries.map(renderExperienceEntry).join('\n\n');

  return `${header}\n\n${body}`;
}

function renderExperienceEntry(entry: SnapshotExperience): string {
  const dateRange = `${formatYearMonth(entry.startDate)} — ${entry.endDate ? formatYearMonth(entry.endDate) : 'Present'}`;
  const description = renderDescriptionBlocks(entry.description);
  const count = charCount(description, LINKEDIN_LIMITS.experienceDescription);

  return `### ${entry.role} at ${entry.company}\n${dateRange}\n(${count})\n${description}`;
}

function renderEducation(entries: readonly SnapshotEducation[]): string {
  const header = sectionHeader('EDUCATION', '');

  if (entries.length === 0) {
    return `${header}\n(none)`;
  }

  const body = entries.map(renderEducationEntry).join('\n\n');

  return `${header}\n\n${body}`;
}

function renderEducationEntry(entry: SnapshotEducation): string {
  const dateRange = `${formatYearMonth(entry.startDate)} — ${formatYearMonth(entry.graduationDate)}`;
  const lines = [
    `${entry.degree} (${entry.degreeTranslation})`,
    `${entry.institution} — ${entry.location}`,
    dateRange,
  ];

  if (entry.honors) {
    lines.push(entry.honors);
  }

  return lines.join('\n');
}

function renderFeatured(technologyHighlights: readonly string[]): string {
  const header = sectionHeader('FEATURED/TECHNOLOGY HIGHLIGHTS', '');

  if (technologyHighlights.length === 0) {
    return `${header}\n(none)`;
  }

  return `${header}\n${technologyHighlights.join(', ')}`;
}

function renderFooter(): string {
  const rule = '='.repeat(BANNER_WIDTH);

  return (
    `${rule}\n` +
    `Copy each section into the corresponding LinkedIn field.\n` +
    `Character counts shown to help you stay within limits.\n` +
    `${rule}`
  );
}

// ── formatting helpers ───────────────────────────────────────────────────

function sectionHeader(label: string, meta: string): string {
  const title = meta ? ` ${label} (${meta}) ` : ` ${label} `;
  const dashes = '─'.repeat(Math.max(0, HEADER_WIDTH - title.length - 2));

  return `──${title}${dashes}`;
}

function charCount(text: string, limit: number): string {
  return `${text.length}/${limit} chars`;
}

function formatYearMonth({ year, month }: YearMonth): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function renderDescriptionBlocks(blocks: readonly DescriptionBlock[]): string {
  return blocks
    .map((block) =>
      block.type === 'bullets'
        ? block.lines.map((line) => `• ${line}`).join('\n')
        : block.lines.join('\n'),
    )
    .join('\n');
}
