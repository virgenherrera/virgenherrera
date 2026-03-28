import { Inject, Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import type { Observable } from "rxjs";
import { map, catchError, of } from "rxjs";
import {
  gitHubReposResponseSchema,
  type GitHubRepo,
} from "./github.schemas.ts";

const PER_PAGE = 100;

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  constructor(@Inject(HttpService) private readonly http: HttpService) {}

  fetchRepos(username: string, page = 1): Observable<GitHubRepo[]> {
    const token = process.env["GITHUB_TOKEN"];
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return this.http
      .get<unknown[]>(`https://api.github.com/users/${username}/repos`, {
        params: { per_page: PER_PAGE, page, type: "owner", sort: "updated" },
        headers,
      })
      .pipe(
        map((response) => gitHubReposResponseSchema.parse(response.data)),
        map((repos) => repos.filter((repo) => !repo.fork && !repo.archived)),
        catchError((error: unknown) => {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          this.logger.warn(
            `GitHub API request failed: ${message} — skipping repo data.`,
          );

          return of([]);
        }),
      );
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
