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
