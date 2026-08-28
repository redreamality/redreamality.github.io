import { test, expect } from '@playwright/test';

const articlePath = '/cn/blog/cordis-spatiotemporal-composability-deepseek-harness/';

test.describe('Table of contents layout', () => {
  test('keeps article content clear of the fixed table of contents', async ({ page }) => {
    for (const width of [1024, 1317, 1647]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(articlePath, { waitUntil: 'domcontentloaded' });

      const toc = page.locator('.table-of-contents');
      const article = page.locator('article');
      await expect(toc).toBeVisible();

      const { articleRight, tocLeft } = await page.evaluate(() => {
        const articleRect = document.querySelector('article')?.getBoundingClientRect();
        const tocRect = document.querySelector('.table-of-contents')?.getBoundingClientRect();
        return {
          articleRight: articleRect?.right ?? 0,
          tocLeft: tocRect?.left ?? 0,
        };
      });

      expect(articleRight, `article overlaps TOC at ${width}px`).toBeLessThanOrEqual(tocLeft - 16);
      await expect(article.locator('h1')).toBeVisible();
    }
  });

  test('keeps the table of contents out of the mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(articlePath, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.table-of-contents')).toBeHidden();
    await expect(page.locator('article h1')).toBeVisible();
  });
});
