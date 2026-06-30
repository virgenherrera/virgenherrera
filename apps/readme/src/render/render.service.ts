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

interface RepoData {
  languages: Record<string, number>;
  stats: { publicRepos: number; totalStars: number; totalForks: number };
}

@Injectable()
export class RenderService {
  render(profile: ProfileData, username: string, repoData: RepoData): string {
    const sections = [
      renderHeader(profile),
      renderSummary(profile),
      buildTimelineDiagram(profile.experience),
      renderSkills(profile.skills),
      renderFeaturedProjects(profile.projects, username),
      renderTopLanguages(repoData.languages),
      renderGitHubStats(repoData.stats),
      renderCTA(profile.links, username),
      renderDeveloperHub(),
      renderFooter(username),
    ].filter(Boolean);

    return `${sections.join('\n\n---\n\n')}\n`;
  }
}
