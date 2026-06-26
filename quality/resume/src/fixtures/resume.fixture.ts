// TECH DEBT: This fixture wiring is minimal. Investigate Playwright's
// fixture composition patterns for a more robust setup once the suite grows.
import { test as base } from '@playwright/test';
import { ResumePage } from '../pages/resume.page.js';

export const test = base.extend<{ resumePage: ResumePage }>({
  resumePage: async ({ page }, use) => {
    await use(new ResumePage(page));
  },
});

export { expect } from '@playwright/test';
