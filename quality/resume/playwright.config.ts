// TODO: TD-RESUME-002 — E2E only runs on desktop Chromium (1280x720)
// CONTEXT: no Firefox, WebKit, or mobile viewport (375px/414px) coverage
// RESOLVE: add webkit and mobile-chrome projects to Playwright config
import { defineConfig } from '@playwright/test';
import { parsePlaywrightEnv } from './src/schemas/playwright-env.schema.js';

export default defineConfig(parsePlaywrightEnv(import.meta.dirname));
