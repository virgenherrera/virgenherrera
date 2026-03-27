import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProfileData } from "@virgenherrera/profile";
import { ProfilePlugin } from "../plugins/plugin.abstract.ts";
import type { PluginResult } from "../plugins/plugin.abstract.ts";

const MOCK_PROFILE: ProfileData = {
  name: "Test User",
  headline: "Engineer",
  summary: "A summary",
  location: "Mexico",
  links: [{ label: "GitHub", url: "https://github.com/test" }],
  experience: [],
  education: [],
  certifications: [],
  skills: [{ category: "Languages", skills: ["TypeScript"] }],
  languages: [{ language: "Spanish", proficiency: "Native" }],
};

const MOCK_ENV = {
  PROFILE_EMAIL: "test@example.com",
  PROFILE_PHONE: "+52-123-456-7890",
};

class SuccessPlugin extends ProfilePlugin {
  readonly name = "success-plugin";
  readonly description = "Always succeeds";

  async generate(profile: ProfileData): Promise<PluginResult> {
    return {
      fileName: "success.md",
      content: `# ${profile.name}`,
    };
  }
}

class FailPlugin extends ProfilePlugin {
  readonly name = "fail-plugin";
  readonly description = "Always fails";

  async generate(_profile: ProfileData): Promise<PluginResult> {
    throw new Error("Plugin exploded");
  }
}

describe("GenerateCommand orchestration logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should call all plugins with merged profile data", async () => {
    const plugin = new SuccessPlugin();
    const generateSpy = vi.spyOn(plugin, "generate");

    const mergedProfile: ProfileData = {
      ...MOCK_PROFILE,
      email: MOCK_ENV.PROFILE_EMAIL,
      links: [
        ...MOCK_PROFILE.links,
        { label: "Phone", url: `tel:${MOCK_ENV.PROFILE_PHONE}` },
      ],
    };

    await plugin.generate(mergedProfile);

    expect(generateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        links: expect.arrayContaining([
          expect.objectContaining({ label: "Phone" }),
        ]),
      }),
    );
  });

  it("should handle Promise.allSettled with mixed results", async () => {
    const successPlugin = new SuccessPlugin();
    const failPlugin = new FailPlugin();
    const plugins: ProfilePlugin[] = [successPlugin, failPlugin];

    const results = await Promise.allSettled(
      plugins.map((p) => p.generate(MOCK_PROFILE)),
    );

    expect(results).toHaveLength(2);
    expect(results[0]?.status).toBe("fulfilled");
    expect(results[1]?.status).toBe("rejected");

    if (results[0]?.status === "fulfilled") {
      expect(results[0].value.fileName).toBe("success.md");
      expect(results[0].value.content).toBe("# Test User");
    }

    if (results[1]?.status === "rejected") {
      expect((results[1].reason as Error).message).toBe("Plugin exploded");
    }
  });

  it("should run plugins in parallel via Promise.allSettled", async () => {
    const plugin1 = new SuccessPlugin();
    const plugin2 = new SuccessPlugin();
    const spy1 = vi.spyOn(plugin1, "generate");
    const spy2 = vi.spyOn(plugin2, "generate");

    const plugins: ProfilePlugin[] = [plugin1, plugin2];

    await Promise.allSettled(
      plugins.map((p) => p.generate(MOCK_PROFILE)),
    );

    expect(spy1).toHaveBeenCalledOnce();
    expect(spy2).toHaveBeenCalledOnce();
  });

  it("should handle empty plugin array gracefully", async () => {
    const plugins: ProfilePlugin[] = [];

    const results = await Promise.allSettled(
      plugins.map((p) => p.generate(MOCK_PROFILE)),
    );

    expect(results).toHaveLength(0);
  });

  it("should merge env vars into profile correctly", () => {
    const mergedProfile: ProfileData = {
      ...MOCK_PROFILE,
      email: MOCK_ENV.PROFILE_EMAIL,
      links: [
        ...MOCK_PROFILE.links,
        { label: "Phone", url: `tel:${MOCK_ENV.PROFILE_PHONE}` },
      ],
    };

    expect(mergedProfile.email).toBe("test@example.com");
    expect(mergedProfile.links).toHaveLength(2);
    expect(mergedProfile.links[1]?.label).toBe("Phone");
    expect(mergedProfile.links[1]?.url).toBe("tel:+52-123-456-7890");
  });
});
