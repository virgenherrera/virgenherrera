/**
 * LinkedIn profile field character limits.
 *
 * Derived empirically (LinkedIn has no public API for profile field
 * limits) — see R3 in `.tmp-linkedin-radar-refactor-handoff.md`. Displayed
 * as `(used/limit)` counters in the generated output so the user can trim
 * content before pasting, never enforced as a hard validation error.
 */
export const LINKEDIN_LIMITS = {
  headline: 220,
  about: 2600,
  experienceDescription: 2000,
  jobTitle: 100,
  company: 100,
  skillsMax: 50,
  skillsPinnedMax: 3,
} as const;
