import { describe, it, expect } from "vitest";
import { FormatDatePipe } from "./format-date.pipe";

describe("FormatDatePipe", () => {
  const pipe = new FormatDatePipe();

  describe("valid yyyy-MM values with default pattern", () => {
    it('transforms "2024-01" → "Jan 2024"', () => {
      expect(pipe.transform("2024-01")).toBe("Jan 2024");
    });

    it('transforms "2023-12" → "Dec 2023"', () => {
      expect(pipe.transform("2023-12")).toBe("Dec 2023");
    });

    it('transforms "2020-06" → "Jun 2020"', () => {
      expect(pipe.transform("2020-06")).toBe("Jun 2020");
    });
  });

  describe("custom pattern", () => {
    it('transforms "2024-03" with "MMMM yyyy" → "March 2024"', () => {
      expect(pipe.transform("2024-03", "MMMM yyyy")).toBe("March 2024");
    });
  });

  describe("null / undefined / empty values", () => {
    it('returns "Present" for null', () => {
      expect(pipe.transform(null)).toBe("Present");
    });

    it('returns "Present" for undefined', () => {
      expect(pipe.transform(undefined)).toBe("Present");
    });

    it("returns empty string as-is", () => {
      expect(pipe.transform("")).toBe("");
    });
  });

  describe("values that do not match the yyyy-MM pattern", () => {
    it('returns the value as-is for "invalid"', () => {
      expect(pipe.transform("invalid")).toBe("invalid");
    });

    it('returns the value as-is for "Current"', () => {
      expect(pipe.transform("Current")).toBe("Current");
    });
  });
});
