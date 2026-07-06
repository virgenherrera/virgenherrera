import { expect } from '@playwright/test';
import { test } from '../../fixtures/resume.fixture.js';
import { ParticleCanvasExpectations as should } from './particle-canvas.expectations.js';

test.describe('IT: Particle Canvas — visual regression baseline', () => {
  test.beforeEach(async ({ resumePage }) => {
    // 1. Seed Math.random BEFORE navigation for deterministic particle positions
    await resumePage.page.addInitScript(() => {
      let seed = 42;
      Math.random = () => {
        seed = (seed * 16807) % 2147483647;

        return (seed - 1) / 2147483646;
      };
    });
    // 2. Force reduced-motion for single static frame (no animation)
    await resumePage.page.emulateMedia({ reducedMotion: 'reduce' });
    // 3. Navigate and wait for Angular hydration
    await resumePage.goto();
    await resumePage.waitForHydration();
    // 4. Pin HTML fonts to cross-platform-stable family for visual regression
    await resumePage.page.addStyleTag({
      content:
        '*, *::before, *::after { font-family: "Liberation Sans", Arial, sans-serif !important; }',
    });
    await resumePage.page.waitForTimeout(100);
  });

  test(should.renderInJumbotron, async ({ resumePage }) => {
    const canvas = resumePage.particleCanvas;
    await expect(canvas).toBeAttached();
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test(should.renderDots, async ({ resumePage }) => {
    const hasContent = await resumePage.page.evaluate(() => {
      const canvas = document.querySelector(
        'vh-particle-canvas canvas',
      ) as HTMLCanvasElement;
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      return data.some((v) => v !== 0);
    });
    expect(hasContent).toBe(true);
  });

  test(should.matchLightBaseline, async ({ resumePage }) => {
    await expect(resumePage.jumbotron).toHaveScreenshot(
      'particle-canvas-light.png',
      {
        maxDiffPixelRatio: 0.03,
      },
    );
  });

  test(should.matchDarkBaseline, async ({ resumePage }) => {
    await resumePage.expandHub();
    await resumePage.themeToggleAction.click();
    await expect(resumePage.page.locator('html')).toHaveClass(/dark/);
    await resumePage.page.waitForTimeout(100);
    await expect(resumePage.jumbotron).toHaveScreenshot(
      'particle-canvas-dark.png',
      {
        maxDiffPixelRatio: 0.03,
      },
    );
  });

  test(should.updateOnThemeToggle, async ({ resumePage }) => {
    // Capture light mode canvas data
    const lightPixels = await resumePage.page.evaluate(() => {
      const c = document.querySelector(
        'vh-particle-canvas canvas',
      ) as HTMLCanvasElement;
      const ctx = c.getContext('2d')!;

      return Array.from(ctx.getImageData(0, 0, 20, 20).data);
    });
    // Toggle to dark
    await resumePage.expandHub();
    await resumePage.themeToggleAction.click();
    await expect(resumePage.page.locator('html')).toHaveClass(/dark/);
    await resumePage.page.waitForTimeout(100);
    // Capture dark mode canvas data
    const darkPixels = await resumePage.page.evaluate(() => {
      const c = document.querySelector(
        'vh-particle-canvas canvas',
      ) as HTMLCanvasElement;
      const ctx = c.getContext('2d')!;

      return Array.from(ctx.getImageData(0, 0, 20, 20).data);
    });
    expect(lightPixels.some((v, i) => v !== darkPixels[i])).toBe(true);
  });
});
