import { test, expect } from '@playwright/test';
import { getPageTitle } from '../src/utils/page-titles';

for (const [lang, prefix] of [['en', ''], ['zh', '/cn'], ['ja', '/ja']] as const) {
  test(`localized listing SEO metadata: ${lang}`, async ({ page }) => {
    for (const path of ['/', '/blog/', '/projects/', '/visuals/', '/garden/',
      '/garden/chaos/', '/garden/notes/', '/garden/questions/',
      '/garden/talks/', '/garden/meditations/', '/tags/', '/about/']) {
      const url = `${prefix}${path}`;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      const title = getPageTitle(url, lang, '');
      await expect(page).toHaveTitle(title);
      await expect(page.locator('head title')).toHaveCount(1);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
      await expect(page.locator('meta[property="twitter:title"]')).toHaveAttribute('content', title);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://redreamality.com${url}`);
    }
  });
}

test('article and talk titles describe their distinct formats', async ({ page }) => {
  await page.goto('/cn/blog/multi-agent-system/');
  await expect(page).toHaveTitle('多智能体系统');
  await page.goto('/cn/garden/talks/multi-agent-system/');
  await expect(page).toHaveTitle('多智能体系统：从基础到实践的演讲与课件');
});
