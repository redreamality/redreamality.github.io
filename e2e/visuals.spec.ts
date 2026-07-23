import { expect, test } from '@playwright/test';

test('English Visuals gallery contains the multilingual published works', async ({ page }) => {
  const response = await page.goto('/visuals/', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveText('Visuals');
  await expect(page.locator('[data-visual-card]')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'What Is Loop Engineering?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How Typhoons Form' })).toBeVisible();
  await expect(page.getByText('Languages: English / Chinese / Japanese')).toHaveCount(2);
  await expect(page.getByText('Agent Architecture Showcase')).toHaveCount(0);
  await expect(page.getByText(/not available in this language/i)).toHaveCount(0);
});

test('stale missing-language query cannot mark multilingual Typhoon as unavailable', async ({ page }) => {
  await page.goto('/visuals/?missing=typhoon', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-missing-visual-banner]')).toBeHidden();
  await expect(page.getByText(/not available in this language/i)).toHaveCount(0);
});

for (const locale of [
  { path: '/cn/visuals/', title: '可视化', work: '什么是 Loop Engineering？' },
  { path: '/ja/visuals/', title: 'ビジュアル', work: 'Loop Engineering とは何か？' },
]) {
  test(`${locale.path} renders a localized Visuals gallery`, async ({ page }) => {
    const response = await page.goto(locale.path, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(locale.title);
    await expect(page.getByRole('heading', { name: locale.work })).toBeVisible();
    await expect(page.locator('[data-visual-card]')).toHaveCount(2);
  });
}

test('primary navigation and homepage expose the Visuals section', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const navigationLink = page.locator('nav').getByRole('link', { name: 'Visuals' });
  await expect(navigationLink).toBeVisible();
  await expect(navigationLink).toHaveAttribute('href', '/visuals/');

  const heroLink = page.locator('main').getByRole('link', { name: /Visuals/ });
  await expect(heroLink).toBeVisible();
  await expect(heroLink).toHaveAttribute('href', '/visuals/');
});

for (const locale of [
  {
    path: '/',
    sectionTitle: 'Latest visual',
    workTitle: 'What Is Loop Engineering?',
    workHref: '/visuals/loop-engineering/',
    typeLabel: 'Interactive explainer',
    allLabel: 'View all visuals',
    allHref: '/visuals/',
  },
  {
    path: '/cn/',
    sectionTitle: '最新可视化',
    workTitle: '什么是 Loop Engineering？',
    workHref: '/cn/visuals/loop-engineering/',
    typeLabel: '交互图解',
    allLabel: '查看全部可视化',
    allHref: '/cn/visuals/',
  },
  {
    path: '/ja/',
    sectionTitle: '最新ビジュアル',
    workTitle: 'Loop Engineering とは何か？',
    workHref: '/ja/visuals/loop-engineering/',
    typeLabel: 'インタラクティブ解説',
    allLabel: 'すべてのビジュアルを見る',
    allHref: '/ja/visuals/',
  },
]) {
  test(`${locale.path} features the latest localized visual`, async ({ page }) => {
    await page.goto(locale.path, { waitUntil: 'domcontentloaded' });

    const section = page.locator('[data-home-latest-visual]');
    await expect(section).toBeVisible();
    await expect(section.getByRole('heading', { name: locale.sectionTitle })).toBeVisible();
    const workLink = section.getByRole('link', { name: locale.workTitle });
    await expect(workLink).toBeVisible();
    await expect(workLink).toHaveAttribute('href', locale.workHref);
    await expect(section.getByText(locale.typeLabel, { exact: true })).toBeVisible();
    await expect(section.getByRole('link', { name: locale.allLabel })).toHaveAttribute('href', locale.allHref);
  });
}

for (const locale of [
  {
    path: '/visuals/loop-engineering/',
    htmlLang: 'en',
    h1: 'Loop Engineering',
    pageTitle: 'What Is Loop Engineering?',
    visualsLink: 'Visuals',
    pauseAll: 'Pause all motion',
    resumeAll: 'Resume all motion',
    engineered: 'Engineered contract',
    engineeredStatus: 'The loop can make a defensible pass, retry, or escalate decision.',
    reset: 'Reset',
    retry: 'Retry',
    independent: 'Independent checker',
    fail: 'Checks fail',
    ogDescription: 'See how goals, bounded attempts, independent evidence, durable state, and stop conditions turn coding agents into a reliable system.',
  },
  {
    path: '/cn/visuals/loop-engineering/',
    htmlLang: 'zh-CN',
    h1: 'Loop Engineering：设计 Agent 外循环',
    pageTitle: '什么是 Loop Engineering？',
    visualsLink: '可视化',
    pauseAll: '暂停所有动画',
    resumeAll: '继续所有动画',
    engineered: '工程化契约',
    engineeredStatus: '循环可以有依据地选择通过、重试或升级。',
    reset: '重置',
    retry: '重试',
    independent: '独立检查器',
    fail: '检查失败',
    ogDescription: '理解目标、有限尝试、独立证据、持久状态与停止条件，如何把编码 Agent 组织成可靠系统。',
  },
  {
    path: '/ja/visuals/loop-engineering/',
    htmlLang: 'ja',
    h1: 'ループエンジニアリング',
    pageTitle: 'Loop Engineering とは何か？',
    visualsLink: 'ビジュアル',
    pauseAll: 'すべての動きを停止',
    resumeAll: 'すべての動きを再開',
    engineered: '設計された契約',
    engineeredStatus: 'ループは、合格・再試行・引き継ぎを根拠付きで判断できます。',
    reset: 'リセット',
    retry: '再試行',
    independent: '独立チェッカー',
    fail: 'チェック失敗',
    ogDescription: '目標、限定された試行、独立した証拠、永続状態、停止条件が Agent を信頼できるシステムへ変える仕組みを解説します。',
  },
]) {
  test(`${locale.path} explains Loop Engineering inside the shared site layout`, async ({ page }) => {
    const response = await page.goto(locale.path, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.htmlLang);
    await expect(page.locator('body > nav')).toBeVisible();
    await expect(page.locator('body > nav').getByRole('link', { name: locale.visualsLink })).toBeVisible();
    await expect(page.locator('h1')).toHaveText(locale.h1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', locale.pageTitle);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', locale.ogDescription);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('.visual-site-chrome, .site-header')).toHaveCount(0);
    await expect(page.locator('interactive-figure')).toHaveCount(6);

    const globalMotion = page.locator('[data-global-motion]');
    await expect(globalMotion).toHaveAccessibleName(locale.pauseAll);
    await globalMotion.click();
    await expect(globalMotion).toHaveText(locale.resumeAll);
    await globalMotion.click();

    const contract = page.locator('interactive-figure[data-demo="contract-gate"]');
    await contract.scrollIntoViewIfNeeded();
    await contract.getByRole('button', { name: locale.engineered }).click();
    await expect(contract.getByText(locale.engineeredStatus)).toBeVisible();
    await contract.getByRole('button', { name: locale.reset }).click();

    const evidence = page.locator('interactive-figure[data-demo="evidence-gate"]');
    await evidence.scrollIntoViewIfNeeded();
    await evidence.getByRole('button', { name: locale.independent }).click();
    await evidence.getByRole('button', { name: locale.fail }).click();
    await expect(evidence.locator('.route.is-active')).toContainText(locale.retry);
  });
}

test('Loop Engineering theme follows the shared dark-mode toggle', async ({ page }) => {
  await page.goto('/visuals/loop-engineering/', { waitUntil: 'domcontentloaded' });

  const visual = page.locator('[data-visual-artifact="loop-engineering"]');
  const initialBackground = await visual.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.locator('body > nav .theme-toggle:visible').click();

  await expect.poll(() => visual.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(initialBackground);
});

for (const locale of [
  {
    path: '/visuals/typhoon/',
    htmlLang: 'en',
    title: 'How Typhoons Form',
    visualsLink: 'Visuals',
    pause: 'Pause',
    reset: 'Reset',
    slider: 'Days of sunshine',
    ogDescription: 'Follow thirteen interactive steps from warm-ocean disturbance to organized tropical cyclone.',
  },
  {
    path: '/cn/visuals/typhoon/',
    htmlLang: 'zh-CN',
    title: '台风如何形成',
    visualsLink: '可视化',
    pause: '暂停',
    reset: '重置',
    slider: '日照天数',
    ogDescription: '用十三个交互步骤，从温暖海面上的扰动一路理解成熟台风的形成。',
  },
  {
    path: '/ja/visuals/typhoon/',
    htmlLang: 'ja',
    title: '台風ができるまで',
    visualsLink: 'ビジュアル',
    pause: '一時停止',
    reset: 'リセット',
    slider: '日照日数',
    ogDescription: '暖かい海の擾乱が台風へ成長する過程を、13のインタラクティブな段階でたどります。',
  },
]) {
  test(`${locale.path} opens a localized Typhoon inside the shared site layout`, async ({ page }) => {
    const response = await page.goto(locale.path, { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale.htmlLang);
    await expect(page.locator('body > nav')).toBeVisible();
    await expect(page.locator('body > nav').getByRole('link', { name: locale.visualsLink })).toBeVisible();
    await expect(page.locator('h1')).toHaveText(locale.title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', locale.title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', locale.ogDescription);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('.visual-site-chrome, .site-header')).toHaveCount(0);
    await expect(page.locator('interactive-figure')).toHaveCount(14);

    const firstStep = page.locator('interactive-figure[data-demo="step-01"]');
    await firstStep.scrollIntoViewIfNeeded();
    const slider = firstStep.getByRole('slider', { name: locale.slider });
    await expect(slider).toBeVisible();
    await firstStep.getByRole('button', { name: locale.pause }).click();
    await slider.fill('15');
    await expect(firstStep.locator('#day-val')).toHaveText('15');
    await firstStep.getByRole('button', { name: locale.reset }).click();
    await expect(firstStep.locator('#day-val')).toHaveText('0');
  });
}

test('Typhoon theme follows the shared dark-mode toggle without restyling the site chrome', async ({ page }) => {
  await page.goto('/visuals/typhoon/', { waitUntil: 'domcontentloaded' });

  const visual = page.locator('[data-visual-artifact="typhoon"]');
  const initialBackground = await visual.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.locator('body > nav .theme-toggle:visible').click();

  await expect.poll(() => visual.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(initialBackground);
  await expect(page.locator('body > nav')).toHaveClass(/bg-surface-50\/80/);
});

test('Agent Architecture routes are removed', async ({ request }) => {
  for (const path of [
    '/visuals/agent-architecture-showcase/',
    '/cn/visuals/agent-architecture-showcase/',
    '/ja/visuals/agent-architecture-showcase/',
    '/blog/html/agent-architecture-showcase/',
    '/cn/blog/html/agent-architecture-showcase/',
    '/ja/blog/html/agent-architecture-showcase/',
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
  }
});

test('sitemap lists every published visual locale and no Agent Architecture routes', async ({ request }) => {
  const indexResponse = await request.get('/sitemap-index.xml');
  expect(indexResponse.ok()).toBeTruthy();
  const index = await indexResponse.text();
  const sitemapUrls = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const documents = await Promise.all(sitemapUrls.map(async (url) => {
    const response = await request.get(new URL(url).pathname);
    expect(response.ok()).toBeTruthy();
    return response.text();
  }));
  const xml = documents.join('\n');

  for (const path of [
    '/visuals/loop-engineering/',
    '/cn/visuals/loop-engineering/',
    '/ja/visuals/loop-engineering/',
    '/visuals/typhoon/',
    '/cn/visuals/typhoon/',
    '/ja/visuals/typhoon/',
  ]) {
    expect(xml).toContain(`<loc>https://redreamality.com${path}</loc>`);
  }
  expect(xml).not.toContain('agent-architecture-showcase');
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
