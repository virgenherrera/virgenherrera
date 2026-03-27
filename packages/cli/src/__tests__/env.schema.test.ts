import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateEnv, envSchema } from "../env/env.schema.ts";

describe("envSchema", () => {
  const VALID_ENV = {
    PROFILE_EMAIL: "hugo@example.com",
    PROFILE_PHONE: "+52-123-456-7890",
  };

  it("should parse valid env vars", () => {
    const result = envSchema.safeParse(VALID_ENV);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.PROFILE_EMAIL).toBe("hugo@example.com");
      expect(result.data.PROFILE_PHONE).toBe("+52-123-456-7890");
    }
  });

  it("should reject missing PROFILE_EMAIL", () => {
    const result = envSchema.safeParse({
      PROFILE_PHONE: "+52-123-456-7890",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid PROFILE_EMAIL", () => {
    const result = envSchema.safeParse({
      PROFILE_EMAIL: "not-an-email",
      PROFILE_PHONE: "+52-123-456-7890",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing PROFILE_PHONE", () => {
    const result = envSchema.safeParse({
      PROFILE_EMAIL: "hugo@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty PROFILE_PHONE", () => {
    const result = envSchema.safeParse({
      PROFILE_EMAIL: "hugo@example.com",
      PROFILE_PHONE: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("validateEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env["PROFILE_EMAIL"] = "hugo@example.com";
    process.env["PROFILE_PHONE"] = "+52-123-456-7890";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return validated env vars when valid", () => {
    const result = validateEnv();
    expect(result.PROFILE_EMAIL).toBe("hugo@example.com");
    expect(result.PROFILE_PHONE).toBe("+52-123-456-7890");
  });

  it("should throw with actionable error when PROFILE_EMAIL is missing", () => {
    delete process.env["PROFILE_EMAIL"];
    expect(() => validateEnv()).toThrow("Environment variable validation failed");
    expect(() => validateEnv()).toThrow("PROFILE_EMAIL");
  });

  it("should throw with actionable error when PROFILE_PHONE is missing", () => {
    delete process.env["PROFILE_PHONE"];
    expect(() => validateEnv()).toThrow("Environment variable validation failed");
    expect(() => validateEnv()).toThrow("PROFILE_PHONE");
  });
});
