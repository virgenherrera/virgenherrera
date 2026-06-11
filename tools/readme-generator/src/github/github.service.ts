import { Injectable, Logger } from "@nestjs/common";
import {
  gitHubReposResponseSchema,
  type GitHubRepo,
} from "./github.schemas.ts";

const PER_PAGE = 100;
const TIMEOUT_MS = 10_000;

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  async fetchRepos(username: string, page = 1): Promise<GitHubRepo[]> {
    const token = process.env["GITHUB_TOKEN"];
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "virgenherrera-cli",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = new URL(`https://api.github.com/users/${username}/repos`);
    url.searchParams.set("per_page", String(PER_PAGE));
    url.searchParams.set("page", String(page));
    url.searchParams.set("type", "owner");
    url.searchParams.set("sort", "updated");

    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.warn(
          `GitHub API returned ${String(response.status)} — skipping repo data.`,
        );

        return [];
      }

      const data: unknown = await response.json();
      const repos = gitHubReposResponseSchema.parse(data);

      return repos.filter((repo) => !repo.fork && !repo.archived);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.warn(
        `GitHub API request failed: ${message} — skipping repo data.`,
      );

      return [];
    }
  }

  aggregateLanguages(repos: readonly GitHubRepo[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const repo of repos) {
      if (repo.language) {
        counts[repo.language] = (counts[repo.language] ?? 0) + 1;
      }
    }

    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);

    return Object.fromEntries(sorted);
  }

  getTopRepos(repos: readonly GitHubRepo[], limit = 5): GitHubRepo[] {
    return [...repos]
      .sort((a, b) => {
        const starDiff = b.stargazers_count - a.stargazers_count;
        if (starDiff !== 0) return starDiff;

        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      })
      .slice(0, limit);
  }
}
