import { z } from "zod";

export const gitHubRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  html_url: z.string(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  fork: z.boolean(),
  archived: z.boolean(),
  topics: z.array(z.string()),
  updated_at: z.string(),
});

export type GitHubRepo = z.infer<typeof gitHubRepoSchema>;

export const gitHubReposResponseSchema = z.array(gitHubRepoSchema);
