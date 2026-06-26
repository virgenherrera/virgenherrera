import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError, map, of } from 'rxjs';
import { gitHubReposResponseSchema, type GitHubRepo } from './github.schemas';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  constructor(@Inject(HttpService) private readonly http: HttpService) {}

  async fetchUserRepos(username: string): Promise<readonly GitHubRepo[]> {
    const token = process.env['GITHUB_TOKEN'];
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const repos = await firstValueFrom(
      this.http
        .get<unknown[]>(
          `https://api.github.com/users/${encodeURIComponent(username)}/repos`,
          {
            params: { per_page: 100, type: 'owner', sort: 'updated' },
            headers,
          },
        )
        .pipe(
          map((res) => gitHubReposResponseSchema.parse(res.data)),
          map((all) => all.filter((r) => !r.fork && !r.archived)),
          catchError((error: unknown) => {
            const msg =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`GitHub API failed: ${msg} — using empty list.`);

            return of([] as GitHubRepo[]);
          }),
        ),
    );

    return repos;
  }

  aggregateLanguages(repos: readonly GitHubRepo[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const repo of repos) {
      if (repo.language) {
        counts[repo.language] = (counts[repo.language] ?? 0) + 1;
      }
    }

    return Object.fromEntries(
      Object.entries(counts).sort(([, a], [, b]) => b - a),
    );
  }

  getTopRepos(repos: readonly GitHubRepo[], limit = 5): readonly GitHubRepo[] {
    return [...repos]
      .sort((a, b) => {
        if (b.stargazers_count !== a.stargazers_count) {
          return b.stargazers_count - a.stargazers_count;
        }

        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      })
      .slice(0, limit);
  }
}
