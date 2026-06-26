import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { of } from 'rxjs';
import { NestFactory } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import type { AxiosResponse } from 'axios';
import { AppModule } from '@vh/app-readme/app.module';
import { ReadmeService } from '@vh/app-readme/readme.service';
import type { GitHubRepo } from '@vh/app-readme/github-schemas';

jest.mock('node:fs', () => {
  const actual = jest.requireActual<typeof import('node:fs')>('node:fs');

  return { ...actual, writeFileSync: jest.fn() };
});

const mockWriteFileSync = writeFileSync as jest.MockedFunction<
  typeof writeFileSync
>;

const mockRepos: GitHubRepo[] = [
  {
    name: 'nest-base',
    description: 'NestJS starter template',
    html_url: 'https://github.com/virgenherrera/nest-base',
    language: 'TypeScript',
    stargazers_count: 5,
    forks_count: 1,
    fork: false,
    archived: false,
    topics: ['nestjs', 'typescript'],
    updated_at: '2026-06-12T00:00:00Z',
  },
  {
    name: 'angular-base',
    description: 'Angular starter template',
    html_url: 'https://github.com/virgenherrera/angular-base',
    language: 'TypeScript',
    stargazers_count: 3,
    forks_count: 0,
    fork: false,
    archived: false,
    topics: ['angular'],
    updated_at: '2026-06-10T00:00:00Z',
  },
];

describe('QA: README Generation', () => {
  let service: ReadmeService;
  let closeApp: () => Promise<void>;

  beforeAll(async () => {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });

    const httpService = app.get(HttpService);
    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(of({ data: mockRepos } as AxiosResponse));

    service = app.get(ReadmeService);
    closeApp = () => app.close();
  });

  afterAll(async () => {
    await closeApp();
  });

  beforeEach(() => {
    mockWriteFileSync.mockClear();
  });

  it('should call writeFileSync with generated markdown', async () => {
    await service.generate();

    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('README.md'),
      expect.any(String),
      'utf-8',
    );
  });

  it('should generate markdown containing profile name in typing SVG', async () => {
    await service.generate();

    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;

    expect(writtenContent).toContain(
      encodeURIComponent('Hugo Enrique Virgen Herrera'),
    );
  });

  it('should generate markdown with expected sections', async () => {
    await service.generate();

    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;

    expect(writtenContent).toContain('## 👤 About');
    expect(writtenContent).toContain('## 🛠️ Skills');
    expect(writtenContent).toContain("## 🤝 Let's Connect");
    expect(writtenContent).toContain('## 📈 GitHub Stats');
    expect(writtenContent).toContain('## 🧑‍💻 For Developers');
    expect(writtenContent).toContain('CONTRIBUTING.md');
  });

  it('should include profile projects in featured projects', async () => {
    await service.generate();

    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;

    expect(writtenContent).toContain('## 🚀 Featured Projects');
    expect(writtenContent).toContain('nest-base');
    expect(writtenContent).toContain('lan-file-share');
  });

  it('should include language distribution from mock repos', async () => {
    await service.generate();

    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;

    expect(writtenContent).toContain('TypeScript');
    expect(writtenContent).toContain('pie title');
  });
});
