#!/usr/bin/env node
'use strict';

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const level = process.argv[2];
if (!['patch', 'minor', 'major'].includes(level)) {
  console.error('Usage: pnpm run release:<patch|minor|major>');
  process.exit(1);
}

const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
if (status) {
  console.error('Working tree is not clean. Commit or stash changes first.');
  process.exit(1);
}

execSync(`pnpm version ${level} --no-git-tag-version`, { stdio: 'inherit' });

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'),
);

execSync('git add package.json', { stdio: 'inherit' });
execSync(`git commit -m "release: v${pkg.version}"`, { stdio: 'inherit' });

console.log(`\nBumped to v${pkg.version}`);
