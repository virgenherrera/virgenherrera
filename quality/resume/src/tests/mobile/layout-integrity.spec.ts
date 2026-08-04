import { expect, type Locator } from '@playwright/test';
import { test } from '../../fixtures/resume.fixture.js';
import { MobileLayoutIntegrityExpectations as should } from './mobile.expectations.js';

/** Asserts an element's bounding box never spills past the viewport's right edge. */
async function expectWithinViewport(
  locator: Locator,
  viewportWidth: number,
): Promise<void> {
  const box = await locator.boundingBox();

  expect(box).not.toBeNull();
  if (box) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth);
  }
}

test.describe('IT: Resume page — mobile layout integrity @structural', () => {
  test.beforeEach(async ({ resumePage }) => {
    await resumePage.goto();
    await resumePage.waitForHydration();
  });

  test(should.noBodyOverflow, async ({ resumePage }) => {
    const { scrollWidth, clientWidth } = await resumePage.page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test(should.jumbotronWithinViewport, async ({ resumePage }) => {
    const viewport = resumePage.page.viewportSize();
    expect(viewport).not.toBeNull();
    if (viewport) {
      await expectWithinViewport(resumePage.jumbotron, viewport.width);
    }
  });

  test(should.sidebarWithinViewport, async ({ resumePage }) => {
    const viewport = resumePage.page.viewportSize();
    expect(viewport).not.toBeNull();
    if (viewport) {
      await expectWithinViewport(resumePage.sidebar, viewport.width);
    }
  });

  test(should.mainContentWithinViewport, async ({ resumePage }) => {
    const viewport = resumePage.page.viewportSize();
    expect(viewport).not.toBeNull();
    if (viewport) {
      await expectWithinViewport(resumePage.mainContent, viewport.width);
    }
  });

  test(should.floatingActionsWithinViewport, async ({ resumePage }) => {
    const viewport = resumePage.page.viewportSize();
    expect(viewport).not.toBeNull();
    if (viewport) {
      await expectWithinViewport(resumePage.actionHubTrigger, viewport.width);
    }
  });

  test(should.experienceItemsWithinViewport, async ({ resumePage }) => {
    const viewport = resumePage.page.viewportSize();
    expect(viewport).not.toBeNull();
    if (viewport) {
      await expectWithinViewport(
        resumePage.experienceItems.first(),
        viewport.width,
      );
    }
  });
});
