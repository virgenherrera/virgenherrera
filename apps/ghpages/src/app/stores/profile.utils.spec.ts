import { describe, it, expect } from "vitest";
import {
  trimSummary,
  trimExperience,
  decodeHashPayload,
} from "./profile.utils";
import type { ExperienceData } from "../types/profile.types";

describe("trimSummary", () => {
  it("returns first 2 sentences from multi-sentence text", () => {
    const summary =
      "First sentence. Second sentence. Third sentence. Fourth sentence.";
    const result = trimSummary(summary);

    expect(result).toBe("First sentence. Second sentence.");
  });

  it("returns full text when fewer sentences than SUMMARY_SENTENCES", () => {
    const summary = "Only one sentence.";
    const result = trimSummary(summary);

    expect(result).toBe("Only one sentence.");
  });

  it("handles empty string", () => {
    const result = trimSummary("");

    expect(result).toBe("");
  });
});

describe("trimExperience", () => {
  const baseExp: ExperienceData = {
    company: "Acme Corp",
    role: "Engineer",
    startDate: "2020-01",
    description: [],
    technologies: [],
  };

  it("trims description to first non-bullet paragraph, max 150 chars with '...'", () => {
    const longText = "A".repeat(200);
    const exp: ExperienceData = {
      ...baseExp,
      description: ["* bullet item", longText],
      technologies: [],
    };
    const [result] = trimExperience([exp]);

    expect(result!.description).toHaveLength(1);
    expect(result!.description[0]).toHaveLength(153); // 150 + "..."
    expect(result!.description[0]).toMatch(/\.\.\.$/);
  });

  it("keeps short description without truncation", () => {
    const shortText = "Short description.";
    const exp: ExperienceData = {
      ...baseExp,
      description: [shortText],
      technologies: [],
    };
    const [result] = trimExperience([exp]);

    expect(result!.description[0]).toBe(shortText);
  });

  it("limits technologies to MAX_TECHNOLOGIES (6)", () => {
    const exp: ExperienceData = {
      ...baseExp,
      description: ["Some work done here."],
      technologies: ["A", "B", "C", "D", "E", "F", "G", "H"],
    };
    const [result] = trimExperience([exp]);

    expect(result!.technologies).toHaveLength(6);
    expect(result!.technologies).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("uses first description item (even if bullet) when no paragraph found", () => {
    const exp: ExperienceData = {
      ...baseExp,
      description: ["* only bullet item"],
      technologies: [],
    };
    const [result] = trimExperience([exp]);

    expect(result!.description[0]).toBe("* only bullet item");
  });
});

describe("decodeHashPayload", () => {
  const validPayload = { email: "test@example.com", phone: "+1234567890" };
  const validBase64 = btoa(JSON.stringify(validPayload));

  it("returns parsed payload for valid base64 JSON with email and phone", () => {
    const result = decodeHashPayload(validBase64);

    expect(result).toEqual(validPayload);
  });

  it("strips leading '#' from hash before decoding", () => {
    const result = decodeHashPayload(`#${validBase64}`);

    expect(result).toEqual(validPayload);
  });

  it("returns null for empty string", () => {
    expect(decodeHashPayload("")).toBeNull();
  });

  it("returns null for '#' only", () => {
    expect(decodeHashPayload("#")).toBeNull();
  });

  it("returns null for invalid base64", () => {
    expect(decodeHashPayload("not-valid-base64!!!")).toBeNull();
  });

  it("returns null for valid base64 but invalid schema (missing email)", () => {
    const invalidPayload = { phone: "+1234567890" };
    const encoded = btoa(JSON.stringify(invalidPayload));

    expect(decodeHashPayload(encoded)).toBeNull();
  });

  it("returns null for valid base64 but invalid schema (missing phone)", () => {
    const invalidPayload = { email: "test@example.com" };
    const encoded = btoa(JSON.stringify(invalidPayload));

    expect(decodeHashPayload(encoded)).toBeNull();
  });
});
