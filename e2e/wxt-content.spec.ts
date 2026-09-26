import { test, expect } from '@playwright/test';

const comparisonSlug = 'the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs';
const locales = [
  {
    prefix: '',
    title: 'What Is a Browser Extension? Build Your First One with WXT',
    comparisonTitle: 'The 2025 State of Browser Extension Frameworks: A Comparative Analysis of Plasmo, WXT, and CRXJS',
    sections: ['Example Scope and Versions', 'Background and Content Script', 'Permissions and Troubleshooting', 'Safari and Store Publishing Boundaries'],
  },
  {
    prefix: '/cn',
    title: '浏览器扩展开发指南',
    comparisonTitle: '2025年浏览器扩展框架现状：Plasmo、WXT 和 CRXJS 的对比分析',
    sections: ['示例范围与版本', 'Background 与内容脚本', '权限与失败排查', 'Safari 与商店发布边界'],
  },
  {
    prefix: '/ja',
    title: 'ブラウザ拡張機能開発ガイド',
    comparisonTitle: '2025年ブラウザ拡張フレームワークの現状：Plasmo、WXT、CRXJSの比較分析',
    sections: ['サンプルの範囲とバージョン', 'Background とコンテンツスクリプト', '権限と問題の切り分け', 'Safari とストア公開の境界'],
  },
];

const files = [
  'package.json',
  'tsconfig.json',
  'wxt.config.ts',
  'entrypoints/popup/index.html',
  'entrypoints/popup/main.ts',
  'entrypoints/background.ts',
  'entrypoints/content.ts',
];

for (const locale of locales) {
  test(`WXT complete tutorial and SEO: ${locale.prefix || 'en'}`, async ({ page }) => {
    const path = `${locale.prefix}/blog/browser-extension-development/`;
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(locale.title);
    expect(await page.title()).toContain(locale.title);
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute('href', `https://redreamality.com${path}`);

    const article = page.locator('main article > div.prose');
    for (const name of locale.sections) {
      await expect(article.getByRole('heading', { level: 2, name, exact: true })).toHaveCount(1);
    }
    for (const name of files) {
      await expect(article.getByRole('heading', { level: 3, name, exact: true })).toHaveCount(1);
    }
    const code = (await article.locator('pre code').allTextContents()).join('\n');
    for (const fragment of [
      '"wxt": "0.21.4"',
      '"typecheck": "wxt prepare && tsc --noEmit"',
      '"build:firefox": "wxt build -b firefox"',
      '"build:safari": "wxt build -b safari"',
      "from '#imports'",
      'fallback: false',
      'export default defineBackground(() => {',
      'return true;',
      'async main(ctx)',
      'ctx.onInvalidated',
      'void load();',
      'src="./main.ts"',
      "permissions: ['storage']",
      "matches: ['https://example.com/*']",
      'xcrun safari-web-extension-packager .output/safari-mv2',
    ]) {
      expect(code).toContain(fragment);
    }
    expect(code).not.toContain("from 'wxt/storage'");
    await expect(article).toContainText('2026-09-25 UTC');
    await expect(article).toContainText('.output/firefox-mv2/manifest.json');
  });

  test(`WXT comparison preserves historical SEO and corrected boundaries: ${locale.prefix || 'en'}`, async ({ page }) => {
    const path = `${locale.prefix}/blog/${comparisonSlug}/`;
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(locale.comparisonTitle);
    expect(await page.title()).toContain(locale.comparisonTitle);
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute('href', `https://redreamality.com${path}`);
    const article = page.locator('main article > div.prose');
    await expect(article).toContainText('2026-09-25 UTC');
    await expect(article).toContainText('url:');
    await expect(article).toContainText('0.21');
    await expect(article).toContainText('Safari');
    await expect(article.locator(`a[href="${locale.prefix}/blog/browser-extension-development/"]`))
      .toHaveCount(1);
  });
}
