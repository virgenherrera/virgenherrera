import { defineConfig } from '@playwright/test';
import { parsePlaywrightEnv } from './src/schemas/playwright-env.schema.js';

export default defineConfig(parsePlaywrightEnv(import.meta.dirname));
