export function parseGitHubUsername(
  repository: string | { url: string } | undefined,
): string | undefined {
  const raw = typeof repository === 'string' ? repository : repository?.url;

  if (!raw) return undefined;

  const shorthand = /^github:([^/]+)\//.exec(raw);
  if (shorthand?.[1]) return shorthand[1];

  const url = /github\.com[/:]([^/]+)\//.exec(raw);

  return url?.[1];
}
