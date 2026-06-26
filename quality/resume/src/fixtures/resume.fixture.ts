import { test as base } from '@playwright/test';
import { ResumePage } from '../pages/resume.page.js';

export const test = base.extend<{ resumePage: ResumePage }>({
  resumePage: async ({ page }, use) => {
    await use(new ResumePage(page));
  },
});
