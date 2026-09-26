import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { getLegacyBlogRedirectPaths } from '../scripts/legacy-blog-redirects.mjs';

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
