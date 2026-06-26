/**
 * PDF layout configuration — A4 page, all values in millimetres unless noted.
 *
 * Design decision: module-level `const` with `as const`, NOT a class with
 * static readonly properties. These are fixed layout values (A4 = 210 mm,
 * always). A class/provider would add DI overhead for values that never change
 * and cannot be meaningfully swapped at runtime.
 */

// ---------------------------------------------------------------------------
// Page dimensions (A4, mm)
// ---------------------------------------------------------------------------

export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const MARGIN = 20;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/**
 * Practical bottom limit used in page-break checks (mm).
 *
 * This is an explicit design value — it intentionally leaves a tighter bottom
 * margin than `PAGE_HEIGHT - MARGIN` (277 mm) to give jsPDF room for baseline
 * descent and avoid content clipping near the physical page edge.
 */
export const PAGE_BOTTOM_LIMIT = 280;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const LINE_HEIGHT = 5;

export const FONT_SIZES = {
  name: 20,
  sectionTitle: 11,
  body: 9,
  small: 8,
} as const;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

/** Vertical gap between sections. */
export const SECTION_GAP = 8;

/** Space added below the candidate name before the headline. */
export const HEADER_POST_NAME_GAP = 8;

/** Horizontal indent for bullet-list items. */
export const BULLET_INDENT = 4;

/** Small generic spacer used in several places. */
export const SPACER_SM = 2;

/** Bottom gap added after each experience block. */
export const EXPERIENCE_GAP = 4;

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

/**
 * jsPDF grayscale values (0 = black, 255 = white) and RGB tuples.
 * Passed directly to `setTextColor` / `setDrawColor`.
 */
export const COLORS = {
  /** Full black — default text reset. */
  textDefault: 0,

  /** Subdued text (dates, locations, secondary info). */
  textMuted: 100,

  /** Body-copy text (paragraphs, summaries). */
  textBody: 60,

  /** Technology stack line. */
  textTech: 120,

  /** Issuer / skills secondary text. */
  textSecondary: 80,

  /** Hyperlink colour (RGB). */
  linkRgb: [0, 0, 180] as [number, number, number],

  /** Section-title underline divider. */
  drawDivider: 220,

  /** Header rule (slightly darker). */
  drawDividerHeader: 200,
} as const;

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

export const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});
