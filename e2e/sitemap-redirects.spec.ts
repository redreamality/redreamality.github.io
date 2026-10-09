import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { getLegacyBlogRedirectPaths } from '../scripts/legacy-blog-redirects.mjs';
import legacyRedirects from '../src/data/legacy-redirects.json' with { type: 'json' };

test('sitemap excludes every legacy Chaos blog alias but retains the destinations', async ({ request }) => {
  const response = await request.get('/sitemap-0.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const aliases = getLegacyBlogRedirectPaths(fileURLToPath(new URL('../src/content/', import.meta.url)));
  for (const alias of aliases) {
    expect(xml).not.toContain(`<loc>https://redreamality.com${alias}</loc>`);
    const destination = alias.replace('/blog/', '/garden/chaos/');
    expect(xml).toContain(`<loc>https://redreamality.com${destination}</loc>`);
  }
  expect(xml).toContain('<loc>https://redreamality.com/blog/browser-extension-development/</loc>');
});

for (const prefix of ['', '/cn', '/ja']) {
  test(`legacy Chaos URL still redirects in ${prefix || 'en'}`, async ({ page }) => {
    const destination = `${prefix}/garden/chaos/aws-ai-registry-for-agents-spec/`;
    await page.goto(`${prefix}/blog/aws-ai-registry-for-agents-spec/`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(`**${destination}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://redreamality.com${destination}`);
    await expect(page.locator('h1')).toHaveCount(1);
  });
}

test('moved project-column URLs redirect and only the new URLs are in the sitemap', async ({ page, request }) => {
  const xml = await (await request.get('/sitemap-0.xml')).text();
  for (const [from, to] of Object.entries(legacyRedirects)) {
    expect(xml).not.toContain(`<loc>https://redreamality.com${from}</loc>`);
    expect(xml).toContain(`<loc>https://redreamality.com${to}</loc>`);
    await page.goto(from, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(`**${to}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://redreamality.com${to}`);
  }
});

test('money-machine-nightly lives under projects, not blog', async ({ page, request }) => {
  await page.goto('/cn/projects/money-machine-nightly/');
  await expect(page.locator('[data-series-summary]')).toBeVisible();
  await expect(page.locator('[data-series-entry="2026-10-08"]')).toHaveAttribute('href', '/cn/projects/money-machine-nightly/2026-10-08/');
  await page.goto('/cn/projects/money-machine-nightly/2026-10-08/');
  await expect(page.locator('[data-series-badge]')).toHaveAttribute('href', '/cn/projects/money-machine-nightly/');
  await expect(page.locator('[data-series-nav]')).toBeVisible();
  await page.goto('/cn/projects/');
  await expect(page.locator('a[href="/cn/projects/money-machine-nightly/"]').first()).toBeVisible();
  for (const path of ['/projects/', '/ja/projects/']) {
    await page.goto(path);
    await expect(page.locator('a[href*="money-machine-nightly"]')).toHaveCount(0);
  }
  for (const path of ['/cn/', '/cn/blog/', '/cn/rss.xml']) {
    expect(await (await request.get(path)).text()).not.toContain('money-machine-nightly');
  }
});
