import { z } from 'zod';

export const gitHubRepoSchema = z
  .object({
    name: z.string(),
    description: z.string().nullable(),
    html_url: z.url(),
    language: z.string().nullable(),
    stargazers_count: z.number().int().nonnegative(),
    forks_count: z.number().int().nonnegative(),
    fork: z.boolean(),
    archived: z.boolean(),
    topics: z.array(z.string()),
    updated_at: z.iso.datetime(),
  })
  .readonly();

export type GitHubRepo = z.infer<typeof gitHubRepoSchema>;

export const gitHubReposResponseSchema = z.array(gitHubRepoSchema);

export const repoStatsSchema = z
  .object({
    publicRepos: z.number().int().nonnegative(),
    totalStars: z.number().int().nonnegative(),
    totalForks: z.number().int().nonnegative(),
  })
  .readonly();

export type RepoStats = z.infer<typeof repoStatsSchema>;

export const repoDataSchema = z
  .object({
    languages: z.record(z.string(), z.number()),
    stats: repoStatsSchema,
  })
  .readonly();

export type RepoData = z.infer<typeof repoDataSchema>;
