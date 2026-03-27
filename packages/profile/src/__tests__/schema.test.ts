import { describe, it, expect } from "vitest";
import { profileSchema, type ProfileData } from "../schema.ts";
import { getProfile } from "../get-profile.ts";

const validProfile = {
  name: "Test User",
  headline: "Software Engineer",
  summary: "A passionate engineer.",
  location: "Mexico",
  links: [
    { label: "GitHub", url: "https://github.com/testuser" },
  ],
  experience: [
    {
      company: "Acme Corp",
      role: "Engineer",
      startDate: "2020-01",
      description: "Built things.",
      technologies: ["TypeScript"],
    },
  ],
  education: [
    {
      institution: "University",
      degree: "BSc",
      field: "CS",
      startDate: "2015-08",
      endDate: "2019-06",
    },
  ],
  certifications: [],
  skills: [
    { category: "Languages", skills: ["TypeScript"] },
  ],
  languages: [
    { language: "English", proficiency: "Native" },
  ],
} satisfies ProfileData;

describe("profileSchema", () => {
  it("should validate a valid profile", () => {
    const result = profileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("should reject a profile missing required 'name' field", () => {
    const { name: _name, ...profileWithoutName } = validProfile;
    const result = profileSchema.safeParse(profileWithoutName);
    expect(result.success).toBe(false);
  });

  it("should reject a profile missing required 'headline' field", () => {
    const { headline: _headline, ...profileWithoutHeadline } = validProfile;
    const result = profileSchema.safeParse(profileWithoutHeadline);
    expect(result.success).toBe(false);
  });

  it("should reject a profile with empty skills array", () => {
    const result = profileSchema.safeParse({ ...validProfile, skills: [] });
    expect(result.success).toBe(false);
  });

  it("should reject a profile with invalid link URL", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      links: [{ label: "Bad", url: "not-a-url" }],
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional fields when missing", () => {
    const result = profileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
      expect(result.data.avatarUrl).toBeUndefined();
    }
  });

  it("should accept optional email when provided", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("should validate experience with optional endDate", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      experience: [
        {
          company: "Corp",
          role: "Dev",
          startDate: "2020-01",
          description: "Work",
          technologies: ["Go"],
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("getProfile", () => {
  it("should load and validate profile.json successfully", () => {
    const profile = getProfile();
    expect(profile.name).toBe("Hugo Virgen Herrera");
    expect(profile.skills.length).toBeGreaterThan(0);
    expect(profile.links.length).toBeGreaterThan(0);
    expect(profile.experience.length).toBeGreaterThan(0);
  });
});
