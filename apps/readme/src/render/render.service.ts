import { Injectable } from '@nestjs/common';
import type { ProfileData } from '@vh/profile';
import { buildTimelineDiagram, buildLanguagePieChart } from '../mermaid/index';
import {
  renderHeader,
  renderSummary,
  renderSkills,
  renderFeaturedProjects,
  renderGitHubStats,
  renderCTA,
  renderDeveloperHub,
  renderFooter,
} from './sections';

@Injectable()
export class RenderService {
  render(
    profile: ProfileData,
    languages: Readonly<Record<string, number>>,
    username: string,
  ): string {
    const sections = [
      renderHeader(profile),
      renderSummary(profile),
      buildTimelineDiagram(profile.experience),
      renderSkills(profile.skills),
      renderFeaturedProjects(profile.projects, username),
      buildLanguagePieChart(languages),
      renderGitHubStats(username),
      renderCTA(profile.links),
      renderDeveloperHub(),
      renderFooter(username),
    ].filter(Boolean);

    return `${sections.join('\n\n---\n\n')}\n`;
  }
}
