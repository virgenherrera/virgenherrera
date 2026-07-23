function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractMetaContent(
  html: string,
  attr: 'name' | 'property',
  key: string,
): string | null {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const attrRegex = new RegExp(`${attr}=["']${escapeRegExp(key)}["']`, 'i');
  const contentRegex = /content=["']([^"']*)["']/i;

  for (const tag of metaTags) {
    if (!attrRegex.test(tag)) continue;

    const contentMatch = tag.match(contentRegex);
    if (contentMatch) return contentMatch[1];
  }

  return null;
}

export function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return match ? match[1].trim() : null;
}

export function extractLinkHref(html: string, rel: string): string | null {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const relRegex = new RegExp(`rel=["']${escapeRegExp(rel)}["']`, 'i');
  const hrefRegex = /href=["']([^"']*)["']/i;

  for (const tag of linkTags) {
    if (!relRegex.test(tag)) continue;

    const hrefMatch = tag.match(hrefRegex);
    if (hrefMatch) return hrefMatch[1];
  }

  return null;
}

export function extractJsonLd(html: string): unknown {
  const match = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
  );

  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}
