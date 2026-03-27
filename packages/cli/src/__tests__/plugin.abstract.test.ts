import { describe, it, expect } from "vitest";
import type { ProfileData } from "@virgenherrera/profile";
import { ProfilePlugin, type PluginResult } from "../plugins/index.ts";

class TestPlugin extends ProfilePlugin {
  readonly name = "test";
  readonly description = "A test plugin";

  async generate(profile: ProfileData): Promise<PluginResult> {
    return {
      fileName: "test.md",
      content: `# ${profile.name}`,
    };
  }
}

describe("ProfilePlugin abstract class", () => {
  it("should allow concrete implementations", () => {
    const plugin = new TestPlugin();
    expect(plugin.name).toBe("test");
    expect(plugin.description).toBe("A test plugin");
  });

  it("should generate a PluginResult from profile data", async () => {
    const plugin = new TestPlugin();
    const mockProfile = {
      name: "Test User",
      headline: "Engineer",
      summary: "Summary",
      location: "Mexico",
      links: [],
      experience: [],
      education: [],
      certifications: [],
      skills: [{ category: "Languages", skills: ["TypeScript"] }],
      languages: [],
    } satisfies ProfileData;

    const result = await plugin.generate(mockProfile);
    expect(result.fileName).toBe("test.md");
    expect(result.content).toBe("# Test User");
  });

  it("should be an instance of ProfilePlugin", () => {
    const plugin = new TestPlugin();
    expect(plugin).toBeInstanceOf(ProfilePlugin);
  });
});
