import { describe, it, expect } from "vitest";
import type { ProfileData } from "@virgenherrera/profile";
import { ReadmePlugin } from "../readme.plugin.ts";

function createMockProfile(
  overrides: Partial<ProfileData> = {},
): ProfileData {
  return {
    name: "Hugo Enrique Virgen Herrera",
    headline: "Senior Fullstack Engineer",
    summary: "Energetic Fullstack Engineer with hands-on experience.",
    location: "Mexico",
    links: [
      { label: "GitHub", url: "https://github.com/virgenherrera" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/virgenherrera" },
    ],
    experience: [
      {
        company: "PwC",
        role: "Software Developer",
        startDate: "2024-08",
        description: "AI-powered integration services.",
        technologies: ["TypeScript", "NestJS", "LangChain"],
      },
      {
        company: "Globant",
        role: "Senior Fullstack Node.js Developer",
        startDate: "2021-04",
        endDate: "2024-08",
        description: "Backend services within AWS-based cloud environments.",
        technologies: ["Node.js", "TypeScript", "NestJS", "GraphQL"],
      },
    ],
    education: [
      {
        institution: "Universidad America Latina",
        degree: "Bachelor's degree",
        field: "Administrative Informatics",
        startDate: "2018",
        endDate: "2021",
      },
    ],
    certifications: [],
    skills: [
      { category: "Languages", skills: ["JavaScript", "TypeScript", "C#"] },
      { category: "Backend Frameworks", skills: ["Node.js", "NestJS"] },
    ],
    languages: [
      { language: "Spanish", proficiency: "Native" },
      { language: "English", proficiency: "C1" },
    ],
    ...overrides,
  };
}

describe("ReadmePlugin", () => {
  const plugin = new ReadmePlugin();

  it("should have correct name and description", () => {
    expect(plugin.name).toBe("readme");
    expect(plugin.description).toBe("Generates README.md from profile data");
  });

  it("should return a PluginResult with fileName README.md", async () => {
    const profile = createMockProfile();
    const result = await plugin.generate(profile);

    expect(result.fileName).toBe("README.md");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("should include the profile name in the content", async () => {
    const profile = createMockProfile();
    const result = await plugin.generate(profile);

    expect(result.content).toContain("Hugo Enrique Virgen Herrera");
  });

  it("should include skills categories", async () => {
    const profile = createMockProfile();
    const result = await plugin.generate(profile);

    expect(result.content).toContain("## Skills");
    expect(result.content).toContain("**Languages**");
    expect(result.content).toContain("**Backend Frameworks**");
    expect(result.content).toContain("JavaScript, TypeScript, C#");
    expect(result.content).toContain("Node.js, NestJS");
  });

  it("should include work experience companies", async () => {
    const profile = createMockProfile();
    const result = await plugin.generate(profile);

    expect(result.content).toContain("## Experience");
    expect(result.content).toContain("PwC");
    expect(result.content).toContain("Globant");
    expect(result.content).toContain("Software Developer @ PwC");
    expect(result.content).toContain(
      "Senior Fullstack Node.js Developer @ Globant",
    );
  });

  it("should show Present for current role without endDate", async () => {
    const profile = createMockProfile();
    const result = await plugin.generate(profile);

    expect(result.content).toContain("2024-08 - Present");
    expect(result.content).toContain("2021-04 - 2024-08");
  });

  it("should handle empty optional arrays gracefully", async () => {
    const profile = createMockProfile({
      certifications: [],
      experience: [],
      education: [],
      links: [],
      languages: [],
    });
    const result = await plugin.generate(profile);

    expect(result.fileName).toBe("README.md");
    expect(result.content).toContain("Hugo Enrique Virgen Herrera");
    expect(result.content).toContain("## Skills");
    expect(result.content).not.toContain("## Experience");
    expect(result.content).not.toContain("## Education");
    expect(result.content).not.toContain("## Links");
    expect(result.content).not.toContain("## Languages");
  });

  it("should include email when present in profile", async () => {
    const profile = createMockProfile({
      email: "hugo@example.com",
    });
    const result = await plugin.generate(profile);

    expect(result.content).toContain("## Contact");
    expect(result.content).toContain("hugo@example.com");
    expect(result.content).toContain("mailto:hugo@example.com");
  });

  it("should omit contact section when email is absent", async () => {
    const profile = createMockProfile();
    const result = await plugin.generate(profile);

    expect(result.content).not.toContain("## Contact");
  });

  it("should include education details", async () => {
    const profile = createMockProfile();
    const result = await plugin.generate(profile);

    expect(result.content).toContain("## Education");
    expect(result.content).toContain("Universidad America Latina");
    expect(result.content).toContain("Bachelor's degree");
    expect(result.content).toContain("Administrative Informatics");
  });

  it("should include the generated-by footer", async () => {
    const profile = createMockProfile();
    const result = await plugin.generate(profile);

    expect(result.content).toContain("Generated by");
    expect(result.content).toContain("virgenherrera-cli");
  });
});
