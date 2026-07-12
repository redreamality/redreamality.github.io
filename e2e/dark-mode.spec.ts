import { test, expect } from '@playwright/test';

test.describe('Dark mode toggle', () => {
  test('toggles the .dark class and persists across reload', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const html = page.locator('html');
    const toggle = page.locator('.theme-toggle:visible').first();
    await expect(toggle).toBeVisible();

    const wasDark = await html.evaluate((el) => el.classList.contains('dark'));

    await toggle.click();
    // class should flip
    await expect
      .poll(() => html.evaluate((el) => el.classList.contains('dark')))
      .toBe(!wasDark);

    // localStorage records the choice
    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(stored).toBe(!wasDark ? 'dark' : 'light');

    // reload — the pre-paint inline script must restore the same state
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect
      .poll(() => page.locator('html').evaluate((el) => el.classList.contains('dark')))
      .toBe(!wasDark);
  });
});
