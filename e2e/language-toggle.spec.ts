import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

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

// Derive fixtures from the content collections so the test survives new translations.

function blogSlugs(locale: 'cn' | 'en' | 'ja'): Set<string> {
  const dir = join(process.cwd(), 'src', 'content', `blog-${locale}`);
  return new Set(readdirSync(dir).filter((name) => /\.mdx?$/.test(name)).map((name) => name.replace(/\.mdx?$/, '')));
}

const cnSlugs = blogSlugs('cn');
const enSlugs = blogSlugs('en');
const jaSlugs = blogSlugs('ja');
const missingJaSlug = [...cnSlugs].sort().find((slug) => enSlugs.has(slug) && !jaSlugs.has(slug));
const trilingualSlug = [...cnSlugs].sort().find((slug) => enSlugs.has(slug) && jaSlugs.has(slug));

test('language toggle and hreflang hide locales without a translation', async ({ page }) => {
  test.skip(!missingJaSlug, 'every zh+en blog already has a Japanese translation');
  for (const path of [`/cn/blog/${missingJaSlug}/`, `/blog/${missingJaSlug}/`]) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const items = page.locator('#language-dropdown-desktop a[role="menuitem"]');
    await expect(items).toHaveCount(2);
    await expect(page.locator(`#language-dropdown-desktop a[href="/ja/blog/${missingJaSlug}/"]`)).toHaveCount(0);
    await expect(page.locator(`#language-dropdown-desktop a[href="/blog/${missingJaSlug}/"]`)).toHaveCount(1);
    await expect(page.locator(`#language-dropdown-desktop a[href="/cn/blog/${missingJaSlug}/"]`)).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="ja"]')).toHaveCount(0);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href',
      `https://redreamality.com/blog/${missingJaSlug}/`,
    );
  }
});

test('language toggle keeps all three locales when every translation exists', async ({ page }) => {
  test.skip(!trilingualSlug, 'no trilingual blog post found');
  await page.goto(`/ja/blog/${trilingualSlug}/`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#language-dropdown-desktop a[role="menuitem"]')).toHaveCount(3);
  await expect(page.locator('link[rel="alternate"][hreflang]:not([hreflang="x-default"])')).toHaveCount(3);

  await page.goto('/cn/blog/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#language-dropdown-desktop a[role="menuitem"]')).toHaveCount(3);
});
