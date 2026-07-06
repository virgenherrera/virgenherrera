import { defineConfig, devices } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

type PlaywrightConfig = Parameters<typeof defineConfig>[0];

const WEB_SERVER_TIMEOUT = 10_000;

function envSchema(configDir: string) {
  const defaultArtifactsDir = resolve(
    configDir,
    '../../artifacts/resume/virgenherrera',
  );
  const qualityArtifactsDir = resolve(
    configDir,
    '../../artifacts/quality/resume',
  );
  const reportDir = resolve(qualityArtifactsDir, 'playwright-report');
  const outputDir = resolve(qualityArtifactsDir, 'test-results');

  return z
    .object({
      CI: z
        .string()
        .optional()
        .transform((value) => !!value),
      PW_PORT: z.coerce.number().int().positive().default(4300),
      PW_ARTIFACTS_DIR: z
        .string()
        .default(defaultArtifactsDir)
        .refine((dir) => existsSync(dir), {
          message:
            'Build artifacts directory not found.\n' +
            'Run: pnpm --filter resume build',
        })
        .transform((dir) => ({ dir, entries: readdirSync(dir) }))
        .refine(({ entries }) => entries.includes('index.html'), {
          message:
            'Missing index.html — build required.\n' +
            'Run: pnpm --filter resume build',
        })
        .refine(
          ({ entries }) =>
            entries.some(
              (file) => file.startsWith('main-') && file.endsWith('.js'),
            ),
          {
            message:
              'Build output incomplete — missing main-*.js bundle.\n' +
              'Run: pnpm --filter resume build',
          },
        )
        .refine(
          ({ entries }) =>
            entries.some(
              (file) => file.startsWith('styles-') && file.endsWith('.css'),
            ),
          {
            message:
              'Build output incomplete — missing styles-*.css bundle.\n' +
              'Run: pnpm --filter resume build',
          },
        )
        .transform(({ dir }) => dir),
    })
    .transform((raw): PlaywrightConfig => {
      const baseUrl = `http://localhost:${raw.PW_PORT}`;
      const serveDir = resolve(raw.PW_ARTIFACTS_DIR, '..');

      return {
        testDir: './src/tests',
        outputDir,
        fullyParallel: true,
        forbidOnly: raw.CI,
        retries: raw.CI ? 2 : 0,
        workers: raw.CI ? 1 : undefined,
        reporter: raw.CI
          ? [['github'], ['html', { outputFolder: reportDir, open: 'never' }]]
          : [['html', { outputFolder: reportDir, open: 'on-failure' }]],

        use: {
          baseURL: baseUrl,
          trace: 'on-first-retry',
          screenshot: 'only-on-failure',
          viewport: { width: 1280, height: 720 },
          acceptDownloads: true,
        },

        snapshotPathTemplate:
          '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{ext}',

        webServer: {
          command: `pnpm exec http-server ${serveDir} --port ${raw.PW_PORT} --silent --cors -c-1`,
          url: `${baseUrl}/virgenherrera`,
          reuseExistingServer: !raw.CI,
          timeout: WEB_SERVER_TIMEOUT,
        },

        projects: [
          {
            name: 'ssg',
            testDir: './src/tests/ssg',
            use: { ...devices['Desktop Chrome'] },
          },
          {
            name: 'csr',
            testDir: './src/tests/csr',
            use: { ...devices['Desktop Chrome'] },
          },
        ],
      };
    });
}

export function parsePlaywrightEnv(configDir: string): PlaywrightConfig {
  return envSchema(configDir).parse(process.env);
}
