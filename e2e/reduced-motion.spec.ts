import { test, expect } from '@playwright/test';

// Users who prefer reduced motion must see content fully visible (no opacity:0 left behind).
test.describe('Reduced motion', () => {
  test('reveal elements are fully visible without animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect
      .poll(() => page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches))
      .toBe(true);

    const reveal = page.locator('.reveal-init').first();
    await expect(reveal).toBeVisible();
    await expect(reveal).toHaveClass(/reveal-shown/);
    await expect(reveal).toHaveCSS('opacity', '1');
  });
});
