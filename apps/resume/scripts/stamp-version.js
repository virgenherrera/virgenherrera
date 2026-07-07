#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf8'),
);

let sha;
try {
  sha = execSync('git rev-parse --short HEAD', {
    stdio: ['pipe', 'pipe', 'pipe'],
  })
    .toString()
    .trim();
} catch {
  sha = process.env['GITHUB_SHA']?.substring(0, 7) ?? 'unknown';
}

const version = pkg.version;
const content = `// Auto-generated at build time — do not edit manually
export const APP_VERSION = '${version}';
export const APP_COMMIT_SHA = '${sha}';
`;

const outPath = path.resolve(
  __dirname,
  '../src/app/version.generated.ts',
);
fs.writeFileSync(outPath, content, 'utf8');
console.log(`[stamp-version] ${version}+${sha} → ${outPath}`);
