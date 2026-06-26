import { Injectable } from '@nestjs/common';
import type { ProfileData } from '@vh/profile';
import type { GitHubRepo } from '../github/github.schemas';
import { buildTimelineDiagram, buildLanguagePieChart } from '../mermaid/index';
import {
  renderHeader,
  renderSummary,
  renderSkills,
  renderFeaturedProjects,
  renderCTA,
  renderFooter,
} from './sections';

@Injectable()
export class RenderService {
  render(
    profile: ProfileData,
    repos: readonly GitHubRepo[],
    languages: Readonly<Record<string, number>>,
  ): string {
    const sections = [
      renderHeader(profile),
      renderSummary(profile),
      buildTimelineDiagram(profile.experience),
      renderSkills(profile.skills),
      buildLanguagePieChart(languages),
      renderFeaturedProjects(repos),
      renderCTA(profile.links),
      renderFooter(),
    ].filter(Boolean);

    return `${sections.join('\n\n')}\n`;
  }
}
