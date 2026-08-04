/**
 * NOTE: The core `getProfile()` tests (returnValidData, cacheInstance) live in
 * `data.spec.ts` lines 263-274 and MUST NOT be duplicated here.
 *
 * This spec covers the module's structural contract — the shape of the
 * returned data, the description transform output, and field-level invariants
 * that data.spec.ts does not assert directly on the getProfile path.
 */
import { getProfile } from './get-profile';

describe('UT: get-profile @critical', () => {
  class should {
    static readonly returnProfileWithRequiredTopLevelFields =
      'return a profile with all required top-level fields';
    static readonly returnExperienceWithDescriptionBlocks =
      'return experience entries with DescriptionBlock[] descriptions';
    static readonly returnValidYearMonthDates =
      'return experience dates as { year, month } objects';
    static readonly returnNonEmptySkillCategories =
      'return at least one skill category with non-empty skills';
  }

  describe('structural shape', () => {
    it(`${should.returnProfileWithRequiredTopLevelFields}`, () => {
      const profile = getProfile();

      expect(profile).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          headline: expect.any(String),
          summary: expect.any(String),
          location: expect.any(String),
          links: expect.any(Array),
          experience: expect.any(Array),
          education: expect.any(Array),
          certifications: expect.any(Array),
          projects: expect.any(Array),
          skills: expect.any(Array),
          languages: expect.any(Array),
        }),
      );
    });

    it(`${should.returnExperienceWithDescriptionBlocks}`, () => {
      const profile = getProfile();

      for (const experience of profile.experience) {
        expect(experience.description.length).toBeGreaterThan(0);

        for (const block of experience.description) {
          expect(block.type).toMatch(/^(paragraph|bullets)$/);
          expect(block.lines.length).toBeGreaterThan(0);

          for (const line of block.lines) {
            expect(typeof line).toBe('string');
            expect(line.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it(`${should.returnValidYearMonthDates}`, () => {
      const profile = getProfile();
      const isValidYearMonth = (value: { year: number; month: number }) =>
        Number.isInteger(value.year) &&
        Number.isInteger(value.month) &&
        value.month >= 1 &&
        value.month <= 12;

      for (const experience of profile.experience) {
        expect(isValidYearMonth(experience.startDate)).toBe(true);

        if (experience.endDate !== undefined) {
          expect(isValidYearMonth(experience.endDate)).toBe(true);
        }
      }
    });

    it(`${should.returnNonEmptySkillCategories}`, () => {
      const profile = getProfile();

      expect(profile.skills.length).toBeGreaterThan(0);

      for (const category of profile.skills) {
        expect(category.category.length).toBeGreaterThan(0);
        expect(category.skills.length).toBeGreaterThan(0);
      }
    });
  });
});
