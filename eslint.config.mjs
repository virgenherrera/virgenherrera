// @ts-check
import eslint from '@eslint/js';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'eslint.config.mjs',
      '**/artifacts/**',
      '**/node_modules/**',
      'README.md',
      '**/CHANGELOG.md',
      '**/.angular/**',
      '**/.storybook/**',
      '**/version.generated.ts',
    ],
  },

  // ── TypeScript ─────────────────────────────────────────────────────────────
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      eslintPluginPrettierRecommended,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'all',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'eol-last': ['error', 'always'],
      'linebreak-style': ['error', 'unix'],
      'max-len': ['error', 150],
      'newline-before-return': 'error',
      'no-multiple-empty-lines': ['error'],
      'prettier/prettier': ['error', { endOfLine: 'lf' }],
    },
  },

  // ── JSON ───────────────────────────────────────────────────────────────────
  {
    ...json.configs.recommended,
    files: ['**/*.json'],
    ignores: ['**/tsconfig*.json'],
    language: 'json/json',
  },

  // ── Markdown ───────────────────────────────────────────────────────────────
  ...markdown.configs.recommended,
);
