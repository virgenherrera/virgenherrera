import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { getProfile } from "@virgenherrera/profile";
import { GitHubService } from "./github/github.service.ts";
import { parseGitHubUsername } from "./github/parse-repo-url.ts";
import { RenderService } from "./render/render.service.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");

@Injectable()
export class ReadmeService {
  constructor(
    @Inject(GitHubService) private readonly github: GitHubService,
    @Inject(RenderService) private readonly renderer: RenderService,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async generate(): Promise<void> {
    const profile = getProfile();

    const rootPkgPath = resolve(REPO_ROOT, "package.json");
    const rootPkg = JSON.parse(readFileSync(rootPkgPath, "utf-8")) as {
      repository?: string | { url: string };
    };

    const username = parseGitHubUsername(rootPkg.repository);

    if (!username) {
      this.logger.warn(
        "Could not extract GitHub username from root package.json repository field.",
      );
    }

    const repos = username
      ? await firstValueFrom(this.github.fetchRepos(username))
      : [];

    const languages = this.github.aggregateLanguages(repos);
    const topRepos = this.github.getTopRepos(repos);

    const markdown = this.renderer.render(profile, topRepos, languages);

    const outputPath = resolve(REPO_ROOT, "README.md");
    writeFileSync(outputPath, markdown, "utf-8");

    this.logger.log(`README.md generated at ${outputPath}`);
  }
}
