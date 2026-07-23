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
    systemMode: 'Engineered loop',
    systemStatus: 'The person owns the loop: repetitive coordination is encoded, observable, and bounded.',
    engineered: 'Engineered contract',
    engineeredStatus: 'The loop can make a defensible pass, retry, or escalate decision.',
    reset: 'Reset',
    retry: 'Retry',
    independent: 'Independent checker',
    fail: 'Checks fail',
    budgetScenario: 'Attempt cap reached',
    budgetRoute: 'BUDGET',
    missingEvidence: 'Independent evidence',
    failureStatus: 'Self-confidence becomes the exit condition when evidence disappears.',
    nextStage: 'Next stage',
    secondStage: 'Stage 2 of 10',
    ogDescription: 'A plain-language visual guide to Agent loops, from bounded attempts and evidence to memory, safe stopping, human review, and continuous improvement.',
  },
  {
    path: '/cn/visuals/loop-engineering/',
    htmlLang: 'zh-CN',
    h1: 'Loop Engineering 入门',
    pageTitle: '什么是 Loop Engineering？',
    visualsLink: '可视化',
    pauseAll: '暂停所有动画',
    resumeAll: '继续所有动画',
    systemMode: '工程化 Loop',
    systemStatus: '人拥有 Loop：重复协调被编码下来，可以观察，也有明确边界。',
    engineered: '工程化契约',
    engineeredStatus: '循环可以有依据地选择通过、重试或升级。',
    reset: '重置',
    retry: '重试',
    independent: '独立检查器',
    fail: '检查失败',
    budgetScenario: '尝试次数已用完',
    budgetRoute: '预算触顶',
    missingEvidence: '独立证据',
    failureStatus: '证据消失后，Agent 的自信就会变成退出条件。',
    nextStage: '下一阶段',
    secondStage: '第 2 / 10 阶段',
    ogDescription: '一份面向普通读者的 Agent 闭环图解：从有限尝试与独立证据，到外部记忆、安全停止、人工裁决和持续改进。',
  },
  {
    path: '/ja/visuals/loop-engineering/',
    htmlLang: 'ja',
    h1: 'ループエンジニアリング',
    pageTitle: 'Loop Engineering とは何か？',
    visualsLink: 'ビジュアル',
    pauseAll: 'すべての動きを停止',
    resumeAll: 'すべての動きを再開',
    systemMode: '設計された Loop',
    systemStatus: '人が Loop を所有します。反復調整はコード化され、観測でき、境界があります。',
    engineered: '設計された契約',
    engineeredStatus: 'ループは、合格・再試行・引き継ぎを根拠付きで判断できます。',
    reset: 'リセット',
    retry: '再試行',
    independent: '独立チェッカー',
    fail: 'チェック失敗',
    budgetScenario: '試行上限に到達',
    budgetRoute: '予算切れ',
    missingEvidence: '独立した証拠',
    failureStatus: '証拠が消えると、自己信頼が終了条件になります。',
    nextStage: '次の段階',
    secondStage: '10 段階中 2',
    ogDescription: 'Agent Loop をやさしく理解する視覚ガイド。限定試行と証拠から、外部記憶、安全な停止、人の判断、継続改善までを説明します。',
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
    await expect(page.locator('interactive-figure')).toHaveCount(10);

    const globalMotion = page.locator('[data-global-motion]');
    await expect(globalMotion).toHaveAccessibleName(locale.pauseAll);
    await globalMotion.click();
    await expect(globalMotion).toHaveText(locale.resumeAll);
    await globalMotion.click();

    const roleShift = page.locator('interactive-figure[data-demo="role-shift"]');
    await roleShift.scrollIntoViewIfNeeded();
    await roleShift.getByRole('button', { name: locale.systemMode }).click();
    await expect(roleShift.getByText(locale.systemStatus)).toBeVisible();

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

    const stopRouter = page.locator('interactive-figure[data-demo="stop-router"]');
    await stopRouter.scrollIntoViewIfNeeded();
    await stopRouter.getByRole('button', { name: locale.budgetScenario }).click();
    await expect(stopRouter.locator('.stop-router-routes li.is-active')).toContainText(locale.budgetRoute);

    const failureLab = page.locator('interactive-figure[data-demo="failure-lab"]');
    await failureLab.scrollIntoViewIfNeeded();
    await failureLab.getByRole('button', { name: locale.missingEvidence }).click();
    await expect(failureLab.getByText(locale.failureStatus)).toBeVisible();
    const failureCanvasSize = await failureLab.locator('canvas').evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height]);
    expect(failureCanvasSize[0]).toBeGreaterThan(0);
    expect(failureCanvasSize[1]).toBeGreaterThan(0);
    await failureLab.getByRole('button', { name: locale.reset }).click();
    await expect(failureLab.locator('.failure-lab-demo')).toHaveAttribute('data-component', 'healthy');

    const workflow = page.locator('interactive-figure[data-demo="workflow-blueprint"]');
    await workflow.scrollIntoViewIfNeeded();
    await workflow.locator('[data-action="pause"]').click();
    await expect(workflow).toHaveAttribute('data-playback', 'paused');
    await workflow.getByRole('button', { name: locale.nextStage }).click();
    await expect(workflow.locator('.workflow-stage-label')).toHaveText(locale.secondStage);
    await workflow.getByRole('button', { name: locale.reset }).click();
    await expect(workflow.locator('.workflow-demo')).toHaveAttribute('data-phase', '0');
  });
}

test('Loop Engineering theme follows the shared dark-mode toggle', async ({ page }) => {
  await page.goto('/visuals/loop-engineering/', { waitUntil: 'domcontentloaded' });

  const visual = page.locator('[data-visual-artifact="loop-engineering"]');
  const failureLab = page.locator('interactive-figure[data-demo="failure-lab"]');
  await failureLab.scrollIntoViewIfNeeded();
  const canvas = failureLab.locator('canvas');
  await expect(canvas).toHaveAttribute('data-ocean-color', /\S+/);
  const initialBackground = await visual.evaluate((element) => getComputedStyle(element).backgroundColor);
  const initialCanvasColor = await canvas.getAttribute('data-ocean-color');
  await page.locator('body > nav .theme-toggle:visible').click();

  await expect.poll(() => visual.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(initialBackground);
  await expect.poll(() => canvas.getAttribute('data-ocean-color')).not.toBe(initialCanvasColor);
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
