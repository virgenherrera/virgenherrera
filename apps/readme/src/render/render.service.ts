import { Injectable } from '@nestjs/common';
import type { ProfileData } from '@vh/profile';
import { buildTimelineDiagram } from '../mermaid/index';
import {
  renderHeader,
  renderSummary,
  renderSkills,
  renderFeaturedProjects,
  renderTopLanguages,
  renderGitHubStats,
  renderCTA,
  renderDeveloperHub,
  renderFooter,
} from './sections';

@Injectable()
export class RenderService {
  render(profile: ProfileData, username: string): string {
    const sections = [
      renderHeader(profile),
      renderSummary(profile),
      buildTimelineDiagram(profile.experience),
      renderSkills(profile.skills),
      renderFeaturedProjects(profile.projects, username),
      renderTopLanguages(username),
      renderGitHubStats(username),
      renderCTA(profile.links, username),
      renderDeveloperHub(),
      renderFooter(username),
    ].filter(Boolean);

    return `${sections.join('\n\n---\n\n')}\n`;
  }
}
