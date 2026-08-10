import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { getProfile } from '@vh/profile/server';
import { loadPersona } from '@vh/profile/persona-loader';
import { projectProfile } from '@vh/profile/persona-projector';
import type { DescriptionBlock } from '@vh/profile';
import type { ProfileSnapshotData } from '@vh/profile/schema';
import { LINKEDIN_LIMITS } from './limits/linkedin-limits';

const REPO_ROOT = resolve(__dirname, '../../../..');
const PERSONAS_DIR = resolve(REPO_ROOT, 'packages/profile/personas');
const OUTPUT_DIR = 'artifacts';
const OUTPUT_FILE = 'profile-export.txt';
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
type SnapshotEngagement = NonNullable<
  SnapshotExperience['engagements']
>[number];
type SnapshotEducation = ProfileSnapshotData['education'][number];
type YearMonth = { year: number; month: number };

/**
 * Generates a single platform-agnostic profile export the user can
 * copy-paste into any job platform (LinkedIn, Indeed, Computrabajo, etc.).
 *
 * Renders the `linkedin` persona (most complete content with weights and
 * ordering) and shows raw `(N chars)` counts per section - never enforced
 * as validation, just a reference so the user knows what they're working
 * with before pasting into a platform's own field limits.
 */
@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  // Synchronous end-to-end (no network I/O, unlike `ReadmeService.generate()`)
  // — `main.ts` still `await`s the call, which resolves immediately for a
  // non-Promise return value, keeping the platform and readme commands'
  // dispatch symmetric.
  generate(): void {
    const profile = getProfile();
    const persona = loadPersona(PERSONAS_DIR, PERSONA_ID);

    // `getProfile()` already ran the full profile through `profileSchema`
    // (dates -> {year, month}, descriptions -> DescriptionBlock[]) — the
    // exact runtime shape `ProfileSnapshotData` expects, minus the optional
    // `graph` field. No pre-built graph is available to this adapter, so
    // `projectProfile()` receives `null` and falls back to slugified
    // identifier matching (see `persona-projector.ts`), which is sufficient
    // for the regular skill/company identifiers personas reference.
    const snapshot = profile as unknown as ProfileSnapshotData;
    const projected = projectProfile(snapshot, null, persona);

    const skillNames = projected.skills.flatMap((category) =>
      category.skills.map((skill) => skill.name),
    );

    const sections = [
      this.renderBanner(projected.name),
      this.renderLimitsReference(),
      this.renderHeadline(projected.headline),
      this.renderAbout(projected.summary),
      this.renderSkills(skillNames),
      this.renderExperience(projected.experience),
      this.renderEducation(projected.education),
      this.renderFeatured(projected.technologyHighlights ?? []),
    ];

    const outputDir = resolve(REPO_ROOT, OUTPUT_DIR);
    mkdirSync(outputDir, { recursive: true });
    const outputPath = resolve(outputDir, OUTPUT_FILE);

    writeFileSync(outputPath, sections.join('\n\n') + '\n', 'utf-8');

    this.logger.log(`Profile export generated at ${outputPath}`);
  }

  // ── section renderers ────────────────────────────────────────────────

  private renderBanner(name: string): string {
    const rule = '='.repeat(BANNER_WIDTH);
    const generated = new Date().toISOString().slice(0, 10);
    const label = `PROFILE EXPORT - ${name}`;

    return `${rule}\n${label}\nGenerated: ${generated}\n${rule}`;
  }

  private renderLimitsReference(): string {
    return [
      'Platform limits (for reference):',
      `LinkedIn: headline ${LINKEDIN_LIMITS.headline}, about ${LINKEDIN_LIMITS.about}, experience ${LINKEDIN_LIMITS.experienceDescription} per entry`,
      'Computrabajo: about ~500',
      'Indeed: no hard limits documented',
    ].join('\n');
  }

  private renderHeadline(headline: string): string {
    return `${this.sectionHeader('HEADLINE', this.charCount(headline))}\n${headline}`;
  }

  private renderAbout(summary: string): string {
    return `${this.sectionHeader('ABOUT', this.charCount(summary))}\n${summary}`;
  }

  private renderSkills(skillNames: readonly string[]): string {
    const header = this.sectionHeader('SKILLS', `${skillNames.length} items`);

    return `${header}\n${skillNames.join(', ')}`;
  }

  private renderExperience(entries: readonly SnapshotExperience[]): string {
    const header = this.sectionHeader('EXPERIENCE', '');
    const body = entries
      .map((entry) => this.renderExperienceEntry(entry))
      .join('\n\n');

    return `${header}\n\n${body}`;
  }

  private renderEducation(entries: readonly SnapshotEducation[]): string {
    const header = this.sectionHeader('EDUCATION', '');

    if (entries.length === 0) {
      return `${header}\n(none)`;
    }

    const body = entries
      .map((entry) => this.renderEducationEntry(entry))
      .join('\n\n');

    return `${header}\n\n${body}`;
  }

  private renderFeatured(technologyHighlights: readonly string[]): string {
    const header = this.sectionHeader('FEATURED/TECHNOLOGY HIGHLIGHTS', '');

    if (technologyHighlights.length === 0) {
      return `${header}\n(none)`;
    }

    return `${header}\n${technologyHighlights.join(', ')}`;
  }

  // ── shared formatting helpers ──────────────────────────────────────────

  private sectionHeader(label: string, meta: string): string {
    const title = meta ? ` ${label} (${meta}) ` : ` ${label} `;
    const dashes = '─'.repeat(Math.max(0, HEADER_WIDTH - title.length - 2));

    return `──${title}${dashes}`;
  }

  private charCount(text: string): string {
    return `${text.length} chars`;
  }

  private formatYearMonth({ year, month }: YearMonth): string {
    return `${MONTH_NAMES[month - 1]} ${year}`;
  }

  private renderDescriptionBlocks(blocks: readonly DescriptionBlock[]): string {
    return blocks
      .map((block) =>
        block.type === 'bullets'
          ? block.lines.map((line) => `• ${line}`).join('\n')
          : block.lines.join('\n'),
      )
      .join('\n');
  }

  private renderEngagement(eng: SnapshotEngagement): string {
    const meta = [eng.domain, eng.client].filter(Boolean).join(', ');
    const title = meta ? `${eng.title} (${meta})` : eng.title;

    return `${title}\n${this.renderDescriptionBlocks(eng.description)}`;
  }

  private renderExperienceEntry(entry: SnapshotExperience): string {
    const dateRange = `${this.formatYearMonth(entry.startDate)} - ${
      entry.endDate ? this.formatYearMonth(entry.endDate) : 'Present'
    }`;
    const parts = [this.renderDescriptionBlocks(entry.description)];

    for (const eng of entry.engagements ?? []) {
      parts.push(this.renderEngagement(eng));
    }

    const description = parts.join('\n\n');
    const count = this.charCount(description);

    return `${entry.role} at ${entry.company}\n${dateRange}\n(${count})\n${description}`;
  }

  private renderEducationEntry(entry: SnapshotEducation): string {
    const dateRange = `${this.formatYearMonth(entry.startDate)} - ${this.formatYearMonth(entry.graduationDate)}`;
    const lines = [
      `${entry.degree} (${entry.degreeTranslation})`,
      `${entry.institution}, ${entry.location}`,
      dateRange,
    ];

    if (entry.honors) {
      lines.push(entry.honors);
    }

    return lines.join('\n');
  }
}
