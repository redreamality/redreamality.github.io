import { test, expect } from '@playwright/test';

test('Meditations language toggle preserves the slug across locales', async ({ page }) => {
  await page.goto('/garden/meditations/why-meditations/', { waitUntil: 'domcontentloaded' });

  await page.locator('#language-toggle-btn-desktop').click();
  await page.locator('#language-dropdown-desktop a[href="/cn/garden/meditations/why-meditations/"]').click();
  await expect(page).toHaveURL(/\/cn\/garden\/meditations\/why-meditations\/$/);
  await expect(page.locator('h1')).toContainText('为什么要有一个「沉思录」');

  await page.locator('#language-toggle-btn-desktop').click();
  await page.locator('#language-dropdown-desktop a[href="/ja/garden/meditations/why-meditations/"]').click();
  await expect(page).toHaveURL(/\/ja\/garden\/meditations\/why-meditations\/$/);
  await expect(page.locator('h1')).toContainText('なぜ「瞑想録」という場所をつくるのか');
});
