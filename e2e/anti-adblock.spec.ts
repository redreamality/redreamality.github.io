import { test, expect, type Page } from '@playwright/test';

async function simulateAdBlock(page: Page) {
  await page.addStyleTag({
    content: '.adsbox, .ad-unit, .google-ads, .ads-placement { display: none !important; }',
  });
}

test.describe('Anti-adblock timing and route exclusions', () => {
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

  test('keeps ads and anti-adblock enabled on eligible content routes', async ({ page }) => {
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#anti-adblock-message')).toHaveCount(1);
    await expect(
      page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'),
    ).toHaveCount(1);
    await expect(page.locator('meta[name="google-adsense-account"]')).toHaveCount(1);
  });

  test('waits 30 seconds before checking when the user does not scroll', async ({ page }) => {
    await page.clock.install();
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
    await simulateAdBlock(page);

    const message = page.locator('#anti-adblock-message');
    await expect(message).toBeHidden();

    // The legacy implementation listens for load and checks one second later.
    // Dispatch it explicitly so this test catches that premature behavior.
    await page.evaluate(() => window.dispatchEvent(new Event('load')));
    await page.clock.fastForward(1_000);
    await expect(message).toBeHidden();

    await page.clock.fastForward(29_000);
    await expect(message).toBeVisible();
    await expect(message.locator('h1, h2, h3, h4, h5, h6')).toHaveCount(0);
    await expect(message.getByText('Ad Blocker Detected', { exact: true })).toBeVisible();
    await expect(message.getByText('How to whitelist our site:', { exact: true })).toBeVisible();
  });

  test('checks immediately after scrolling down two viewport heights', async ({ page }) => {
    await page.clock.install();
    await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
    await simulateAdBlock(page);

    const message = page.locator('#anti-adblock-message');
    await expect(message).toBeHidden();

    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
    await expect(message).toBeVisible();
  });
});
