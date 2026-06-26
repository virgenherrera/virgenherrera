import rootConfig from '../../eslint.config.mjs';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...rootConfig,
  {
    files: ['src/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      sourceType: 'module',
    },
  },
]);
