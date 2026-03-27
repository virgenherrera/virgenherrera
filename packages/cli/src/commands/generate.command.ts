import { Inject } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { getProfile } from "@virgenherrera/profile";
import type { ProfileData } from "@virgenherrera/profile";
import { ProfilePlugin } from "../plugins/plugin.abstract.ts";
import type { PluginResult } from "../plugins/plugin.abstract.ts";
import { validateEnv } from "../env/env.schema.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOTENV_PATH = resolve(__dirname, "../../../../packages/profile/.env");

interface GenerateOptions {
  readonly output?: string;
}

interface SettledFulfilled {
  readonly status: "fulfilled";
  readonly value: PluginResult;
}

interface SettledRejected {
  readonly status: "rejected";
  readonly reason: unknown;
}

@Command({
  name: "generate",
  description: "Generate all profile artifacts via plugins",
})
export class GenerateCommand extends CommandRunner {
  constructor(
    @Inject(ProfilePlugin)
    private readonly plugins: ProfilePlugin[],
  ) {
    super();
  }

  async run(
    _passedParams: string[],
    options?: GenerateOptions,
  ): Promise<void> {
    loadDotenv({ path: DOTENV_PATH });

    const env = validateEnv();
    const profile = getProfile();

    const mergedProfile: ProfileData = {
      ...profile,
      email: env.PROFILE_EMAIL,
      links: [
        ...profile.links,
        { label: "Phone", url: `tel:${env.PROFILE_PHONE}` },
      ],
    };

    if (!Array.isArray(this.plugins) || this.plugins.length === 0) {
      console.warn(
        "⚠ No plugins found. Register plugin modules in AppModule to generate artifacts.",
      );
      return;
    }

    console.log(`Running ${String(this.plugins.length)} plugin(s)...`);

    const results = await Promise.allSettled(
      this.plugins.map((p) => p.generate(mergedProfile)),
    );

    const outputDir = this.resolveOutputDir(options?.output);

    for (const [index, result] of results.entries()) {
      const plugin = this.plugins[index];
      const pluginName = plugin?.name ?? `plugin-${String(index)}`;

      if (result.status === "fulfilled") {
        this.writeResult(result as SettledFulfilled, outputDir, pluginName);
      } else {
        this.reportFailure(result as SettledRejected, pluginName);
      }
    }
  }

  @Option({
    flags: "-o, --output <path>",
    description: "Output directory for generated artifacts (default: repo root)",
  })
  parseOutput(val: string): string {
    return val;
  }

  private resolveOutputDir(output?: string): string {
    const repoRoot = resolve(__dirname, "../../../..");

    if (output) {
      return resolve(repoRoot, output);
    }

    return repoRoot;
  }

  private writeResult(
    result: SettledFulfilled,
    outputDir: string,
    pluginName: string,
  ): void {
    const { fileName, content } = result.value;
    const filePath = join(outputDir, fileName);

    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, "utf-8");

    console.log(`✓ [${pluginName}] → ${filePath}`);
  }

  private reportFailure(result: SettledRejected, pluginName: string): void {
    const errorMessage =
      result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);

    console.error(`✗ [${pluginName}] failed: ${errorMessage}`);
  }
}
