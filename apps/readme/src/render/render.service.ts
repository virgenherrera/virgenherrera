import { Injectable } from "@nestjs/common";
import type { ProfileData } from "@virgenherrera/profile";
import type { GitHubRepo } from "../github/github.schemas.ts";
import {
  buildTimelineDiagram,
  buildLanguagePieChart,
} from "../mermaid/index.ts";
import {
  renderHeader,
  renderSummary,
  renderFeaturedProjects,
  renderCTA,
  renderFooter,
} from "./sections.ts";

@Injectable()
export class RenderService {
  render(
    profile: ProfileData,
    repos: readonly GitHubRepo[],
    languages: Readonly<Record<string, number>>,
  ): string {
    const sections: string[] = [
      renderHeader(profile),
      renderSummary(profile),
      buildTimelineDiagram(profile.experience),
      buildLanguagePieChart(languages),
      renderFeaturedProjects(repos),
      renderCTA(profile.links),
      renderFooter(),
    ];

    const content = sections.filter(Boolean).join("\n\n");

    return `${content}\n`;
  }
}
