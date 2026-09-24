import { test, expect } from '@playwright/test';

for (const prefix of ['', '/cn', '/ja']) {
  for (const width of [390, 768, 1440]) {
    test(`homepage layout and keyboard navigation ${prefix || 'en'} at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${prefix}/`);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('[data-hero-title]')).toBeVisible();
      await expect(page.locator('.hero-avatar')).toHaveJSProperty('naturalWidth', 512);
      const entries = page.locator('[data-home-entries] a');
      await expect(entries).toHaveCount(5);
      const destinations = ['/projects/', '/visuals/', '/blog/', '/garden/meditations/', '/garden/talks/'];
      for (let i = 0; i < destinations.length; i++) {
        await expect(entries.nth(i)).toHaveAttribute('href', `${prefix}${destinations[i]}`);
        const box = await entries.nth(i).boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await entries.first().focus();
      await expect(entries.first()).toHaveCSS('outline-style', 'solid');
      await page.keyboard.press('Tab');
      await expect(entries.nth(1)).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(entries.nth(2)).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${prefix}/blog/$`));
    });
  }
}

test('homepage retains readable dark theme', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.goto('/cn/');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('[data-hero-title]')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('.home-reading article').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});
