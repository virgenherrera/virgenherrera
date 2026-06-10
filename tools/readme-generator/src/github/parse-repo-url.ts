/**
 * Extracts a GitHub username from a package.json repository field.
 *
 * Supported formats:
 * - `"git+https://github.com/{user}/{repo}.git"`
 * - `{ "url": "git+https://github.com/{user}/{repo}.git" }`
 * - `"github:{user}/{repo}"`
 * - `"https://github.com/{user}/{repo}"`
 * - `"git@github.com:{user}/{repo}.git"`
 */
export function parseGitHubUsername(
  repository: string | { url: string } | undefined,
): string | undefined {
  const url = typeof repository === "string" ? repository : repository?.url;

  if (!url) return undefined;

  const shorthandMatch = /^github:([^/]+)\//.exec(url);
  if (shorthandMatch?.[1]) return shorthandMatch[1];

  const httpsMatch = /github\.com[/:]([^/]+)\//.exec(url);

  return httpsMatch?.[1];
}
