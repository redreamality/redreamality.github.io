import { expect, test } from '@playwright/test';

const locales = {
  en: {
    lang: 'en',
    title: 'How a warm ocean organizes a storm',
    pauseAll: 'Pause all motion',
  },
  zh: {
    lang: 'zh-CN',
    title: '温暖海洋如何组织出风暴',
    pauseAll: '暂停所有动画',
  },
  ja: {
    lang: 'ja',
    title: '暖かい海が嵐を組織化する仕組み',
    pauseAll: 'すべての動きを停止',
  },
} as const;

for (const [locale, expected] of Object.entries(locales)) {
  test(`${locale} artifact is localized and self-contained`, async ({ page }) => {
    await page.goto(`/full/${locale}/`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', expected.lang);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(expected.title);
    await expect(page.getByRole('button', { name: expected.pauseAll })).toBeVisible();
    await expect(page.locator('interactive-figure')).toHaveCount(3);
    await expect(page.locator('script[src], link[href^="http"], img[src^="http"]')).toHaveCount(0);
  });
}

test('language navigation preserves the artifact and switches locale', async ({ page }) => {
  await page.goto('/full/en/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: '日本語' }).click();
  await expect(page).toHaveURL(/\/full\/ja\/$/);
  await expect(page.locator('h1')).toHaveText(locales.ja.title);
});

test('shared demos receive localized visible and aria copy', async ({ page }) => {
  await page.goto('/full/zh/', { waitUntil: 'domcontentloaded' });
  const energy = page.locator('interactive-figure[data-demo="energy"]');
  await energy.scrollIntoViewIfNeeded();
  await expect(energy).toHaveAttribute('data-state', 'mounted');
  await expect(energy.getByText('海面温暖程度')).toBeVisible();
  await expect(energy.getByRole('group', { name: '可交互的海洋能量计' })).toBeVisible();

  await page.goto('/full/ja/', { waitUntil: 'domcontentloaded' });
  const organization = page.locator('interactive-figure[data-demo="organization"]');
  await organization.scrollIntoViewIfNeeded();
  await expect(organization).toHaveAttribute('data-state', 'mounted');
  await expect(organization.getByRole('button', { name: '組織化' })).toBeVisible();
});

test('pause and reset lifecycle works through the shared runtime', async ({ page }) => {
  await page.goto('/full/en/', { waitUntil: 'domcontentloaded' });
  const energy = page.locator('interactive-figure[data-demo="energy"]');
  await energy.scrollIntoViewIfNeeded();
  await expect(energy).toHaveAttribute('data-state', 'mounted');
  await expect(energy).toHaveAttribute('data-playback', 'playing');

  const range = energy.locator('input[type="range"]');
  const scene = energy.locator('.energy-demo');
  await expect(scene).toHaveAttribute('data-runtime-size', /^\d+x\d+@\d+(?:\.\d+)?$/);
  await range.fill('88');
  await expect(scene).toHaveAttribute('data-value', '88');

  await energy.getByRole('button', { name: 'Reset' }).click();
  await expect(scene).toHaveAttribute('data-value', '40');

  await energy.getByRole('button', { name: 'Pause' }).click();
  await expect(energy).toHaveAttribute('data-playback', 'paused');
  await expect(energy.getByRole('button', { name: 'Resume' })).toBeVisible();

  await energy.getByRole('button', { name: 'Resume' }).click();
  await page.getByRole('button', { name: 'Pause all motion' }).click();
  await expect(energy).toHaveAttribute('data-playback', 'paused');
});

test('reduced motion mounts a readable static visual in paused state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/full/en/', { waitUntil: 'domcontentloaded' });
  const overview = page.locator('interactive-figure[data-demo="overview"]');
  await overview.scrollIntoViewIfNeeded();

  await expect(overview).toHaveAttribute('data-state', 'mounted');
  await expect(overview).toHaveAttribute('data-playback', 'paused');
  await expect(overview.getByRole('img', {
    name: 'A loop connecting ocean energy, rising moisture, and organized circulation',
  })).toBeVisible();
});

test('overview can be omitted and step count can be reduced', async ({ page }) => {
  await page.goto('/minimal/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.overview')).toHaveCount(0);
  await expect(page.locator('interactive-figure')).toHaveCount(1);
  await expect(page.locator('#storm-organization')).toHaveCount(0);
});

test('the same runtime and demos render a second subject', async ({ page }) => {
  await page.goto('/agents/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toHaveText('How independent agents become a working system');
  await expect(page.locator('interactive-figure')).toHaveCount(3);

  const energy = page.locator('interactive-figure[data-demo="energy"]');
  await energy.scrollIntoViewIfNeeded();
  await expect(energy).toHaveAttribute('data-state', 'mounted');
  await expect(energy.getByText('Shared context coverage')).toBeVisible();
  await expect(page.getByRole('link', { name: 'English' })).toHaveCount(1);
});

for (const [locale, title] of Object.entries({
  en: 'How air conditioning moves heat',
  zh: '空调怎样把热量搬出去',
  ja: 'エアコンはどう熱を外へ運ぶのか',
})) {
  test(`${locale} air-conditioner artifact is localized and self-contained`, async ({ page }) => {
    await page.goto(`/air-conditioner/${locale}/`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('interactive-figure')).toHaveCount(6);
    await expect(page.locator('script[src], link[href^="http"], img[src^="http"]')).toHaveCount(0);
  });
}

test('air-conditioner demos expose localized interaction and reset behavior', async ({ page }) => {
  await page.goto('/air-conditioner/zh/', { waitUntil: 'domcontentloaded' });

  const overview = page.locator('interactive-figure[data-demo="ac-cycle-overview"]');
  await overview.scrollIntoViewIfNeeded();
  await overview.getByRole('button', { name: /压缩机/ }).click();
  await expect(overview).toHaveAttribute('data-state', 'mounted');
  await expect(overview.getByText('电功压缩制冷剂蒸气，使它的压力和温度升高到足以向室外空气放热。')).toBeVisible();

  const evaporator = page.locator('interactive-figure[data-demo="ac-evaporator"]');
  await evaporator.scrollIntoViewIfNeeded();
  await evaporator.getByRole('slider', { name: '示意室内热负荷' }).fill('90');
  await expect(evaporator.locator('.ac-evaporator-demo')).toHaveAttribute('data-load', '90');
  await evaporator.getByRole('button', { name: '重置' }).click();
  await expect(evaporator.locator('.ac-evaporator-demo')).toHaveAttribute('data-load', '60');

  const condenser = page.locator('interactive-figure[data-demo="ac-condenser"]');
  await condenser.scrollIntoViewIfNeeded();
  await condenser.getByRole('button', { name: '风路受阻' }).click();
  await expect(condenser.getByText('热量积压在盘管附近')).toBeVisible();
});

test('price-volume kit artifact mounts into a dedicated root without losing runtime status', async ({ page }) => {
  await page.goto('/price-volume-relationship/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toHaveText('Price shows where an auction moved. Volume shows how much traded there.');
  await expect(page.locator('interactive-figure')).toHaveCount(7);
  await expect(page.locator('script[src], link[href^="http"], img[src^="http"]')).toHaveCount(0);

  const overview = page.locator('interactive-figure[data-demo="pv-auction-overview"]');
  await overview.scrollIntoViewIfNeeded();
  await expect(overview).toHaveAttribute('data-state', 'mounted');
  await expect(overview.locator('.stage > .mount')).toHaveCount(1);
  await expect(overview.locator('.mount + [data-runtime-status]')).toHaveCount(1);
  await expect(overview.locator('.stage > .status')).toHaveCount(0);

  const scene = overview.locator('.pv-auction');
  const firstAskDepth = overview.locator('[data-pv-depth-side="ask"][data-pv-depth-index="0"]');
  await expect(scene).toHaveAttribute('data-liquidity', 'thick');
  await expect(scene).toHaveAttribute('data-execution-volume', '900');
  await expect(scene).toHaveAttribute('data-displacement', '0.18');
  await expect(firstAskDepth).toHaveAttribute('data-depth', '82');
  const secondScenario = overview.locator('[data-pv-scenario="1"]');
  await secondScenario.focus();
  await page.keyboard.press('Enter');
  await expect(secondScenario).toHaveAttribute('aria-pressed', 'true');
  await expect(scene).toHaveAttribute('data-liquidity', 'thin');
  await expect(scene).toHaveAttribute('data-execution-volume', '900');
  await expect(scene).toHaveAttribute('data-displacement', '0.92');
  await expect(firstAskDepth).toHaveAttribute('data-depth', '22');
  const expectedStatus = 'Same synthetic execution volume, different displacement: 900 units consume more levels in thin displayed liquidity and move price by +0.92. Equal volume does not mean equal price displacement.';
  await expect(overview.locator('[data-pv-status]')).toHaveText(expectedStatus);
  const runtimeStatus = overview.locator('[data-runtime-status]');
  await expect(runtimeStatus).toBeAttached();
  await expect(runtimeStatus).toHaveAttribute('role', 'status');
  await expect(runtimeStatus).toHaveText(expectedStatus);
  await expect(runtimeStatus).toHaveAttribute('data-live-only', '');
  await expect(runtimeStatus).not.toHaveAttribute('hidden', '');
  await expect(runtimeStatus).toHaveCSS('pointer-events', 'none');
  const runtimeStatusBox = await runtimeStatus.boundingBox();
  expect(runtimeStatusBox).not.toBeNull();
  expect(runtimeStatusBox!.width).toBeLessThanOrEqual(1);
  expect(runtimeStatusBox!.height).toBeLessThanOrEqual(1);
  await expect(secondScenario).toBeVisible();

  await overview.getByRole('button', { name: 'Reset' }).click();
  await expect(overview.locator('[data-pv-scenario="0"]')).toHaveAttribute('aria-pressed', 'true');
});

test('price-volume kit baselines, follow-through paths, and checklist expose stable state', async ({ page }) => {
  await page.goto('/price-volume-relationship/en/', { waitUntil: 'domcontentloaded' });

  const relative = page.locator('interactive-figure[data-demo="pv-relative-volume"]');
  await relative.scrollIntoViewIfNeeded();
  await expect(relative).toHaveAttribute('data-state', 'mounted');
  const output = relative.locator('[data-pv-output]');
  const ratio = relative.locator('[data-pv-ratio]');
  const relativeScene = relative.locator('.pv-relative');
  const initialOutput = await output.textContent();
  const initialRatio = await ratio.textContent();
  await expect(relativeScene).toHaveAttribute('data-period', 'open');
  await expect(relativeScene).toHaveAttribute('data-ratio', '0.71');
  const midday = relative.locator('[data-pv-baseline="midday"]');
  await midday.focus();
  await page.keyboard.press('Enter');
  await expect(relativeScene).toHaveAttribute('data-period', 'midday');
  await expect(relativeScene).toHaveAttribute('data-current', '100');
  await expect(relativeScene).toHaveAttribute('data-ratio', '1.54');
  await relative.locator('[data-pv-relative-input]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(output).not.toHaveText(initialOutput ?? '');
  await expect(relativeScene).toHaveAttribute('data-current', '101');
  await expect(relativeScene).toHaveAttribute('data-ratio', '1.55');
  await relative.getByRole('button', { name: 'Reset' }).click();
  await expect(relativeScene).toHaveAttribute('data-period', 'open');
  await expect(output).toHaveText(initialOutput ?? '');
  await expect(ratio).toHaveText(initialRatio ?? '');

  const breakout = page.locator('interactive-figure[data-demo="pv-breakout-follow-through"]');
  await breakout.scrollIntoViewIfNeeded();
  await expect(breakout).toHaveAttribute('data-state', 'mounted');
  const accepted = breakout.locator('[data-pv-path="accepted"]');
  const rejected = breakout.locator('[data-pv-path="rejected"]');
  await expect(accepted).toHaveAttribute('data-path-state', 'undetermined');
  await expect(rejected).toHaveAttribute('data-path-state', 'undetermined');
  await expect(accepted).toHaveAttribute('data-visible-points', '6');
  await breakout.locator('[data-pv-window="followThrough"]').click();
  await expect(accepted).toHaveAttribute('data-path-state', 'accepted');
  await expect(rejected).toHaveAttribute('data-path-state', 'rejected');
  await expect(accepted).toHaveAttribute('data-visible-points', '10');
  await expect(breakout.locator('[data-pv-status]')).toContainText('Only later evidence distinguishes the paths');

  const checklist = page.locator('interactive-figure[data-demo="pv-context-checklist"]');
  await checklist.scrollIntoViewIfNeeded();
  await expect(checklist).toHaveAttribute('data-state', 'mounted');
  const checklistScene = checklist.locator('.pv-checklist');
  await expect(checklist.locator('[data-pv-check]')).toHaveCount(7);
  const checkbox = checklist.locator('[data-pv-check="0"]');
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(checklistScene).toHaveAttribute('data-checked-count', '1');
  await expect(checklist.locator('[data-pv-status]')).toHaveText('Insufficient information');
  await checklist.getByRole('button', { name: 'Reset' }).click();
  await expect(checkbox).not.toBeChecked();
  await expect(checklistScene).toHaveAttribute('data-checked-count', '0');
  await expect(checklist.locator('[data-pv-status]')).toHaveText('Insufficient information');
});
