import { Injectable } from '@nestjs/common';
import type { ProfileData, SkillCategoryData } from '@vh/profile';
import type { RepoData } from '../github/github.schemas';
import {
  renderHeader,
  renderSummary,
  renderSkills,
  renderFeaturedProjects,
  renderTopLanguages,
  renderGitHubStats,
  renderCredentials,
  renderCTA,
  renderDeveloperHub,
  renderFooter,
} from './sections';

@Injectable()
export class RenderService {
  render(
    profile: ProfileData,
    radarSkills: readonly SkillCategoryData[],
    username: string,
    repoData: RepoData,
  ): string {
    const sections = [
      renderHeader(profile),
      renderSummary(profile),
      renderSkills(radarSkills),
      renderFeaturedProjects(profile.projects, username),
      renderTopLanguages(repoData.languages),
      renderGitHubStats(repoData.stats),
      renderCredentials(profile.certifications),
      renderCTA(profile.links, username),
      renderDeveloperHub(),
      renderFooter(username),
    ].filter(Boolean);

    return `${sections.join('\n\n---\n\n')}\n`;
  }
}
