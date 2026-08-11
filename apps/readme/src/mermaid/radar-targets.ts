/**
 * Target radar values for the skills chart, derived from the original
 * `RADAR_OVERRIDES` constant (commit 425f4f85) that was removed when the
 * radar computation became fully dynamic (`averageLevel()` in
 * `skills-radar.ts`). These represent the intended skill levels backed by
 * 11 years of enterprise experience and act as the acceptance criteria for
 * bringing the dynamic computation back in line with reality.
 */
export const RADAR_TARGETS: Readonly<Record<string, number>> = {
  Frontend: 4.9,
  Backend: 4.9,
  'APIs & Protocols': 4.9,
  'Cloud & DevOps': 3.9,
  Databases: 4.5,
  'ORMs & ODMs': 4.8,
  'AI Engineering': 3.9,
  'IoT & Industrial Systems': 3.5,
  'Testing & QA': 4.7,
  'Architecture & Patterns': 4.0,
  'Developer Tooling': 4.5,
};
