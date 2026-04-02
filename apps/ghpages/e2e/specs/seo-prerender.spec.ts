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
});
