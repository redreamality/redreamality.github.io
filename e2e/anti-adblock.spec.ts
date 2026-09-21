import { test, expect, type Page } from '@playwright/test';

async function simulateAdBlock(page: Page) {
  await page.addStyleTag({
    content: '.adsbox, .ad-unit, .google-ads, .ads-placement { display: none !important; }',
  });
}

test.describe('No anti-adblock prompts and preserved ad route exclusions', () => {
  const adFreePaths = [
    '/',
    '/about/',
    '/visuals/',
    '/visuals/loop-engineering/',
    '/cn/',
    '/cn/about/',
    '/cn/visuals/',
    '/cn/visuals/loop-engineering/',
    '/ja/',
    '/ja/about/',
    '/ja/visuals/',
    '/ja/visuals/loop-engineering/',
  ];

  for (const path of adFreePaths) {
    test(`does not load ads or anti-adblock on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#anti-adblock-message')).toHaveCount(0);
      await expect(
        page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'),
      ).toHaveCount(0);
      await expect(page.locator('meta[name="google-adsense-account"]')).toHaveCount(0);
    });
  }

  test('keeps ads enabled without anti-adblock on eligible content routes', async ({ page }) => {
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#anti-adblock-message')).toHaveCount(0);
    await expect(
      page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'),
    ).toHaveCount(1);
    await expect(page.locator('meta[name="google-adsense-account"]')).toHaveCount(1);
  });

  for (const path of [
    '/blog/', '/cn/blog/', '/ja/blog/',
    '/blog/pocketflow-tracing/', '/cn/blog/pocketflow-tracing/', '/ja/blog/pocketflow-tracing/',
  ]) {
    test(`never prompts after waiting or scrolling on ${path}`, async ({ page }) => {
      await page.clock.install();
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await simulateAdBlock(page);

      await page.evaluate(() => window.dispatchEvent(new Event('load')));
      await page.clock.fastForward(31_000);
      await expect(page.locator('#anti-adblock-message, #anti-adblock-backdrop')).toHaveCount(0);
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
      await page.clock.runFor(100);
      await expect(page.locator('#anti-adblock-message, #anti-adblock-backdrop')).toHaveCount(0);
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    });
  }
});
