import { test, expect } from "@playwright/test";
import { SeoScenario } from "../scenarios";

test.describe("SEO / Prerender validation", () => {
  let html: string;

  test.beforeAll(async ({ request }) => {
    // Arrange — fetch like a search engine crawler (no JS execution)
    const response = await request.get("/");
    html = await response.text();
  });

  test(SeoScenario.ContainsMetaDescription, () => {
    // Assert
    expect(html).toContain('name="description"');
    expect(html).toContain("Hugo Virgen Herrera");
  });

  test(SeoScenario.ContainsPageTitle, () => {
    // Assert
    expect(html).toContain("<title>");
    expect(html).toContain("Hugo Virgen Herrera");
  });

  test(SeoScenario.ContainsSidebarSections, () => {
    // Assert
    expect(html).toContain('data-testid="hero-section"');
    expect(html).toContain('data-testid="about-section"');
    expect(html).toContain('data-testid="contact-section"');
  });

  test(SeoScenario.ExcludesInteractiveHero, () => {
    // Assert
    expect(html).not.toContain('data-testid="interactive-hero-section"');
  });

  test(SeoScenario.ExcludesClientOnlyContent, () => {
    // Assert
    expect(html).not.toContain("particleCanvas");
    expect(html).not.toContain("typewriter");
    expect(html).not.toContain("<canvas");
  });

  test(SeoScenario.ContainsEducation, () => {
    // Assert
    expect(html).toContain('data-testid="education-section"');
    expect(html).toContain("Universidad");
  });

  test(SeoScenario.ExcludesPrivateData, () => {
    // Assert — no real email/phone should leak into prerender
    expect(html).not.toContain("virgenherrera@gmail.com");
  });

  test(SeoScenario.HasNoSkippedHeadingLevels, () => {
    // Arrange — extract all heading tags in document order
    const headingRegex = /<h([1-6])[\s>]/gi;
    const levels: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = headingRegex.exec(html)) !== null) {
      levels.push(Number(match[1]));
    }

    // Assert — each heading level must not skip (e.g. h1 → h3 is invalid)
    expect(levels.length).toBeGreaterThan(0);
    for (let i = 1; i < levels.length; i++) {
      expect(
        levels[i] - levels[i - 1],
        `heading h${levels[i]} after h${levels[i - 1]} skips a level`,
      ).toBeLessThanOrEqual(1);
    }
  });

  test(SeoScenario.ImagesHaveWidthAndHeight, () => {
    // Arrange — extract all <img> tags
    const imgRegex = /<img\b[^>]*>/gi;
    const images = html.match(imgRegex) ?? [];

    // Assert — every image must have width and height attributes
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expect(img, `img tag missing width: ${img}`).toMatch(/\bwidth="/);
      expect(img, `img tag missing height: ${img}`).toMatch(/\bheight="/);
    }
  });
});
