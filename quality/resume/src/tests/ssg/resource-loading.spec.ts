import type { Response } from '@playwright/test';
import { test, expect } from '../../fixtures/resume.fixture.js';
import { SsgPreRenderExpectations as should } from './should.js';

const RESOURCE_EXTENSIONS =
  /\.(jpg|jpeg|png|svg|webp|gif|ico|js|css|woff|woff2|ttf|eot)(\?.*)?$/i;
const RESOURCE_CONTENT_TYPES =
  /^(image|text\/css|application\/javascript|font)\//i;

function isTrackedResource(response: Response): boolean {
  const url = response.url();
  const contentType = response.headers()['content-type'] ?? '';

  return (
    RESOURCE_EXTENSIONS.test(url) || RESOURCE_CONTENT_TYPES.test(contentType)
  );
}

test.describe('IT: SSG Resume page — resource loading', () => {
  test(should.loadAllResourcesWithoutErrors, async ({ page, resumePage }) => {
    const failedResources: Array<{ url: string; status: number }> = [];

    page.on('response', (response: Response) => {
      if (response.status() >= 400 && isTrackedResource(response)) {
        failedResources.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    await resumePage.goto();
    await page.waitForLoadState('networkidle');

    expect(
      failedResources,
      `Failed resources:\n${failedResources.map((r) => `  [${r.status}] ${r.url}`).join('\n')}`,
    ).toHaveLength(0);
  });

  test(should.renderAllImagesSuccessfully, async ({ page, resumePage }) => {
    await resumePage.goto();
    await page.waitForLoadState('networkidle');

    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(
        document.querySelectorAll<HTMLImageElement>('img'),
      );

      return imgs
        .filter((img) => !(img.complete && img.naturalWidth > 0))
        .map((img) => img.src || img.getAttribute('src') || '(no src)');
    });

    expect(
      brokenImages,
      `Broken images:\n${brokenImages.map((src) => `  ${src}`).join('\n')}`,
    ).toHaveLength(0);
  });
});
