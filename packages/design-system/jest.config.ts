import type { Config } from 'jest';

const config: Config = {
  cache: false,
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.stories.ts',
    '!<rootDir>/src/index.ts',
  ],
  coverageDirectory: '<rootDir>/../../artifacts/coverage/design-system',
  coverageReporters: ['html-spa'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@angular/core$': '<rootDir>/test/angular-core.mock.ts',
  },
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: 'src/.*\\.(spec|test)\\.ts$',
  testTimeout: 3e3,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  verbose: true,
};

export default config;
