import { test, expect } from '@playwright/test';

for (const prefix of ['', '/cn', '/ja']) {
  test(`Markdown math and legacy content survive framework upgrades: ${prefix || 'en'}`, async ({ page }) => {
    const path = `${prefix}/blog/understanding-linearity-in-linear-algebra/`;
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main .katex').first()).toBeVisible();
    await expect(page.locator('main .katex-mathml math').first()).toBeAttached();
    await expect(page.locator('main .katex-error')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://redreamality.com${path}`);
  });
}

test('syntax highlighting and Tailwind styles survive framework upgrades', async ({ page }) => {
  await page.goto('/blog/pythonpathvs-code/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main pre code').first()).toBeVisible();
  await expect(page.locator('main pre code span[style*="color"]').first()).toBeAttached();

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-hero]')).toHaveCSS('max-width', '1152px');
  await expect(page.locator('[data-home-entries]')).toHaveCSS('border-top-width', '1px');
  await expect(page.locator('[data-hero-title]')).toHaveCSS('font-weight', '700');
});
