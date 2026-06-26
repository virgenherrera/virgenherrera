import type { Config } from 'jest';

const config: Config = {
  cache: false,
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/index.ts',
    '!<rootDir>/src/profile.json',
  ],
  coverageDirectory: '<rootDir>/../../artifacts/coverage/profile',
  coverageReporters: ['html-spa'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: 'src/.*\\.(spec|test)\\.ts$',
  testTimeout: 3e3,
  transform: { '^.+\\.ts$': 'ts-jest' },
  verbose: true,
};

export default config;
