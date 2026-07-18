import { test, expect } from '@playwright/test';

// Guard the SEO contract: existing URLs must keep resolving (200), and new
// additive routes must work too. The legacy /projects/projects/ archive is the
// most important canary because the projects data model changed.
const mustResolve = [
  '/',
  '/cn/',
  '/ja/',
  '/projects/',
  '/projects/projects/', // legacy monolithic overview — MUST stay 200
  '/cn/projects/projects/',
  '/ja/projects/projects/',
  '/blog/',
  '/blog/agents-of-chaos-ai-agent-failures/',
  '/ja/blog/',
  '/garden/notes/',
  '/garden/chaos/',
  '/garden/questions/',
  '/garden/talks/',
  '/garden/meditations/', // new
  '/garden/meditations/why-meditations/', // new
  '/cn/garden/meditations/why-meditations/',
  '/ja/garden/meditations/why-meditations/',
  '/rss.xml',
  '/sitemap-0.xml',
];

for (const path of mustResolve) {
  test(`route resolves 200: ${path}`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status(), `${path} should return 200`).toBe(200);
  });
}

test('legacy projects overview still renders its original content', async ({ page }) => {
  const res = await page.goto('/projects/projects/', { waitUntil: 'domcontentloaded' });
  expect(res?.status()).toBe(200);
  // canonical should point to the same URL (self-canonical preserved)
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toContain('/projects/projects/');
});

test('homepage exposes the new Meditations section link', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // The nav-dropdown copy is hidden until hover; assert the in-page hero/section link instead.
  await expect(page.locator('main a[href="/garden/meditations/"]').first()).toBeVisible();
});

test('meditation tag links never point to missing routes', async ({ page, request }) => {
  await page.goto('/garden/meditations/why-meditations/', { waitUntil: 'domcontentloaded' });

  const tagLinks = page.locator('article header a[href^="/tags/"]');
  for (let index = 0; index < (await tagLinks.count()); index += 1) {
    const href = await tagLinks.nth(index).getAttribute('href');
    expect(href).toBeTruthy();
    const response = await request.get(href!);
    expect(response.status(), `${href} should resolve`).toBe(200);
  }
});
