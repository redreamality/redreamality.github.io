import { test, expect, type Page } from '@playwright/test';

async function simulateAdBlock(page: Page) {
  await page.addStyleTag({
    content: '.adsbox, .ad-unit, .google-ads, .ads-placement { display: none !important; }',
  });
}

test.describe('Anti-adblock timing and route exclusions', () => {
  for (const path of ['/', '/about/', '/cn/', '/cn/about/', '/ja/', '/ja/about/']) {
    test(`does not mount on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#anti-adblock-message')).toHaveCount(0);
    });
  }

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
