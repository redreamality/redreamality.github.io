import { expect, test } from '@playwright/test';

test('English Visuals gallery lists the available works and languages', async ({ page }) => {
  const response = await page.goto('/visuals/', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('Visuals');
  await expect(page.getByRole('link', { name: /Agent Architecture Showcase/ })).toBeVisible();
  await expect(page.getByText('Languages: English / Chinese / Japanese')).toBeVisible();
  await expect(page.getByText('Chinese only')).toBeVisible();
});

for (const locale of [
  { path: '/cn/visuals/', title: '可视化', work: '台风如何形成' },
  { path: '/ja/visuals/', title: 'ビジュアル', work: '台風ができるまで' },
]) {
  test(`${locale.path} renders a localized Visuals gallery`, async ({ page }) => {
    const response = await page.goto(locale.path, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(locale.title);
    await expect(page.getByRole('heading', { name: locale.work })).toBeVisible();
  });
}

test('primary navigation exposes the Visuals section', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const link = page.locator('nav').getByRole('link', { name: 'Visuals' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/visuals/');
});

test('homepage hero exposes the Visuals gallery', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const link = page.locator('main').getByRole('link', { name: /Visuals/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/visuals/');
});

test('Agent Architecture opens as a first-class HTML artifact', async ({ page }) => {
  const response = await page.goto('/visuals/agent-architecture-showcase/', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'A responsive visual walkthrough of a multi-agent content workflow, its stages, and handoffs.',
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Agent Architecture Showcase');
  await expect(page.locator('script[src^="http"], img[src^="http"], iframe[src^="http"], source[src^="http"], video[src^="http"], audio[src^="http"], embed[src^="http"], object[data^="http"], [srcset*="http"], link[rel="stylesheet"][href^="http"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Back to Visuals' })).toHaveAttribute('href', '/visuals/');
  await expect(page.getByRole('link', { name: '中文' })).toHaveAttribute('href', '/cn/visuals/agent-architecture-showcase/');
});

test('Chinese Typhoon opens as the full interactive explainer', async ({ page }) => {
  const response = await page.goto('/cn/visuals/typhoon/', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('台风如何形成');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('interactive-figure')).toHaveCount(14);
  await expect(page.getByRole('link', { name: '返回可视化专区' })).toHaveAttribute('href', '/cn/visuals/');

  const firstStep = page.locator('interactive-figure[data-demo="step-01"]');
  await firstStep.scrollIntoViewIfNeeded();
  const slider = firstStep.locator('#day-slider');
  await expect(slider).toBeVisible();
  await firstStep.getByRole('button', { name: '暂停' }).click();
  await slider.fill('15');
  await expect(firstStep.locator('#day-val')).toHaveText('15');
  await firstStep.getByRole('button', { name: '重置' }).click();
  await expect(firstStep.locator('#day-val')).toHaveText('0');
});

test('missing Typhoon translation returns to the gallery with an explicit language choice', async ({ page }) => {
  await page.goto('/visuals/typhoon/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/visuals\/\?missing=typhoon&available=zh#typhoon$/);
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('How Typhoons Form');
  await expect(alert).toContainText('Chinese');
  await expect(alert.getByRole('link', { name: /Open Chinese version/ })).toHaveAttribute('href', '/cn/visuals/typhoon/');
});

test('legacy HTML Showcase URLs preserve the artifact with a canonical Visuals URL', async ({ page }) => {
  const response = await page.goto('/blog/html/agent-architecture-showcase/', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/blog\/html\/agent-architecture-showcase\/$/);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://redreamality.com/visuals/agent-architecture-showcase/',
  );
});

test('sitemap lists only published visual language artifacts', async ({ request }) => {
  const indexResponse = await request.get('/sitemap-index.xml');
  expect(indexResponse.ok()).toBeTruthy();
  const index = await indexResponse.text();
  const sitemapUrls = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(sitemapUrls.length).toBeGreaterThan(0);

  const documents = await Promise.all(sitemapUrls.map(async (url) => {
    const response = await request.get(new URL(url).pathname);
    expect(response.ok()).toBeTruthy();
    return response.text();
  }));
  const xml = documents.join('\n');

  for (const path of [
    '/visuals/agent-architecture-showcase/',
    '/cn/visuals/agent-architecture-showcase/',
    '/ja/visuals/agent-architecture-showcase/',
    '/cn/visuals/typhoon/',
  ]) {
    expect(xml).toContain(`<loc>https://redreamality.com${path}</loc>`);
  }

  for (const path of [
    '/visuals/typhoon/',
    '/ja/visuals/typhoon/',
    '/blog/html/agent-architecture-showcase/',
    '/cn/blog/html/agent-architecture-showcase/',
    '/ja/blog/html/agent-architecture-showcase/',
  ]) {
    expect(xml).not.toContain(`<loc>https://redreamality.com${path}</loc>`);
  }
});

test('mobile navigation opens the localized Visuals gallery', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/cn/', { waitUntil: 'domcontentloaded' });

  await page.locator('#mobile-menu-button').click();
  const link = page.locator('#navbar-default').getByRole('link', { name: '可视化' });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/cn\/visuals\/$/);
});
