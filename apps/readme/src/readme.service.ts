import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { getProfile } from '@vh/profile/server';
import { GitHubService } from './github/github.service';
import { parseGitHubUsername } from './github/parse-repo-url';
import { RenderService } from './render/render.service';

const REPO_ROOT = resolve(__dirname, '../../..');

@Injectable()
export class ReadmeService {
  constructor(
    @Inject(GitHubService) private readonly github: GitHubService,
    @Inject(RenderService) private readonly renderer: RenderService,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  generate(): void {
    const profile = getProfile();

    const rootPkgPath = resolve(REPO_ROOT, 'package.json');
    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8')) as {
      repository?: string | { url: string };
    };
    const username = parseGitHubUsername(rootPkg.repository);

    if (!username) {
      this.logger.warn(
        'Could not extract GitHub username from root package.json.',
      );
    }

    const markdown = this.renderer.render(profile, username ?? '');

    const outputPath = resolve(REPO_ROOT, 'README.md');
    writeFileSync(outputPath, markdown, 'utf-8');

    this.logger.log(`README.md generated at ${outputPath}`);
  }
}
