import { test, expect, type Locator, type Page } from '@playwright/test';

const slug = 'my-personal-library';
const repository = 'https://github.com/redreamality/my-personal-library';
const inspiration = 'https://nekonull.me/posts/llm_x_bookmark/';
const site = 'https://redreamality.com';
const locales = [
  {
    prefix: '', htmlLang: 'en', hreflang: 'en', details: 'Project details', continue: 'Continue',
    description: 'An operational Python pipeline for private Markdown archives, Qwen summaries, keyword search, and weekly digests, processing bookmarks in hourly batches.',
  },
  {
    prefix: '/cn', htmlLang: 'zh-CN', hreflang: 'zh', details: '项目详情', continue: '继续访问',
    description: '已运行的 Python 个人资料流水线，按小时分批处理书签，提供私有 Markdown 归档、Qwen 摘要、关键词搜索与每周汇总。',
  },
  {
    prefix: '/ja', htmlLang: 'ja', hreflang: 'ja', details: 'プロジェクト詳細', continue: '続行する',
    description: '毎時のバッチでブックマークを処理する稼働中の Python パイプライン。非公開の Markdown 保存、Qwen 要約、キーワード検索、週次ダイジェストに対応。',
  },
];

async function expectNoHorizontalOverflow(page: Page, region: Locator) {
  await expect(region).toHaveCount(1);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBeLessThanOrEqual(1);
  // Also detect content clipped by overflow:hidden on an otherwise fitting card.
  const overflowing = await region.evaluate((root) =>
    [root, ...root.querySelectorAll('h1, h2, h3, p, a, code, span')].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && (
        rect.left < -1 || rect.right > document.documentElement.clientWidth + 1 ||
        element.scrollWidth > element.clientWidth + 1 && element.clientWidth > 0
      );
    }).map((element) => element.textContent?.trim()),
  );
  expect(overflowing).toEqual([]);
}

for (const locale of locales) {
  const detailPath = `${locale.prefix}/projects/${slug}/`;
  const confirmHref = (url: string) => `${locale.prefix}/go/?to=${encodeURIComponent(url)}`;

  test(`${locale.htmlLang}: project SEO uses its description and localized URLs`, async ({ page }) => {
    const response = await page.goto(detailPath);
    expect(response?.status()).toBe(200);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);
    await expect(description).toHaveAttribute('content', locale.description);
    expect((await description.getAttribute('content'))?.trim()).toBeTruthy();
    await expect(page.locator('main header > p')).toHaveText(locale.description);
    await expect(page.locator('meta[property="og:description"]'))
      .toHaveAttribute('content', locale.description);
    await expect(page.locator('meta[property="twitter:description"]'))
      .toHaveAttribute('content', locale.description);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical).toHaveAttribute('href', `${site}${detailPath}`);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(4);
    for (const alternate of locales) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${alternate.hreflang}"]`))
        .toHaveAttribute('href', `${site}${alternate.prefix}/projects/${slug}/`);
    }
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]'))
      .toHaveAttribute('href', `${site}/projects/${slug}/`);

    // A project-specific description must not silently fall back to the index copy.
    await page.goto(`${locale.prefix}/projects/`);
    await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', locale.description);
  });

  test(`${locale.htmlLang}: project card opens localized details without changing existing links`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const response = await page.goto(`${locale.prefix}/projects/`);
    expect(response?.status()).toBe(200);
    const card = page.locator('article').filter({
      has: page.getByRole('heading', { name: 'My Personal Library', exact: true }),
    });
    await expect(card).toHaveCount(1);
    await expect(card.getByRole('link', { name: 'My Personal Library', exact: true }))
      .toHaveAttribute('href', confirmHref(repository));
    await expect(card.getByRole('link', { name: 'GitHub', exact: true }))
      .toHaveAttribute('href', confirmHref(repository));
    await expect(card.getByRole('link', { name: 'Live demo', exact: true })).toHaveCount(0);

    // The optional details flag must not change cards that do not opt in.
    const legacy = page.locator('article').filter({
      has: page.getByRole('heading', { name: 'GTPlanner', exact: true }),
    });
    await expect(legacy.getByRole('link', { name: locale.details, exact: true })).toHaveCount(0);
    await expect(legacy.getByRole('link', { name: 'GTPlanner', exact: true }))
      .toHaveAttribute('href', confirmHref('https://github.com/OpenSQZ/GTPlanner'));
    await expect(legacy.getByRole('link', { name: 'Live demo', exact: true }))
      .toHaveAttribute('href', confirmHref('https://the-agent-builder.com/'));

    const details = card.getByRole('link', { name: locale.details, exact: true });
    await expect(details).toHaveAttribute('href', detailPath);
    await details.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${detailPath}$`));
    await expect(page.locator('html')).toHaveAttribute('lang', locale.htmlLang);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('My Personal Library');
  });

  test(`${locale.htmlLang}: detail external links use localized confirmation`, async ({ page }) => {
    for (const destination of [repository, inspiration]) {
      const response = await page.goto(detailPath);
      expect(response?.status()).toBe(200);
      const link = page.locator(`main article a[href="${confirmHref(destination)}"]`);
      await expect(link).toHaveCount(1);
      await link.click();
      await expect(page).toHaveURL((url) =>
        url.pathname === `${locale.prefix}/go/` && url.searchParams.get('to') === destination,
      );
      await expect(page.locator('#outbound-continue')).toHaveText(locale.continue);
      await expect(page.locator('#outbound-continue')).toHaveAttribute('href', destination);
      // Stop at the confirmation page; never navigate to the remote service.
    }
  });

  test(`${locale.htmlLang}: language menu preserves the project slug`, async ({ page }) => {
    await page.goto(detailPath);
    for (const target of locales.filter((entry) => entry.prefix !== locale.prefix)) {
      const targetPath = `${target.prefix}/projects/${slug}/`;
      await page.locator('#language-toggle-btn-desktop').click();
      await page.locator(`#language-dropdown-desktop a[href="${targetPath}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${targetPath}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', target.htmlLang);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText('My Personal Library');
    }
  });

  for (const width of [320, 390]) {
    test(`${locale.htmlLang}: mobile card and detail fit at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
      await page.addInitScript(() => localStorage.setItem('theme', 'light'));
      await page.goto(`${locale.prefix}/projects/`);
      await page.evaluate(() => document.fonts.ready);
      const card = page.locator('article').filter({
        has: page.getByRole('heading', { name: 'My Personal Library', exact: true }),
      });
      await card.scrollIntoViewIfNeeded();
      await expect(card).toHaveCSS('opacity', '1');
      const cardScreenshot = testInfo.outputPath('mobile-project-card.png');
      await card.screenshot({ path: cardScreenshot, animations: 'disabled' });
      await testInfo.attach('mobile-project-card', { path: cardScreenshot, contentType: 'image/png' });
      await expectNoHorizontalOverflow(page, card);

      await card.getByRole('link', { name: locale.details, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${detailPath}$`));
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText('My Personal Library');
      await page.evaluate(() => document.fonts.ready);
      const detailScreenshot = testInfo.outputPath('mobile-project-detail.png');
      await page.screenshot({ path: detailScreenshot, fullPage: true, animations: 'disabled' });
      await testInfo.attach('mobile-project-detail', { path: detailScreenshot, contentType: 'image/png' });
      // Layout owns the outer main; project templates also have an inner main.
      await expectNoHorizontalOverflow(page, page.locator('body > main'));
    });
  }
}

test('sitemap includes each localized My Personal Library detail exactly once', async ({ page, request }) => {
  const indexResponse = await request.get('/sitemap-index.xml');
  expect(indexResponse.ok()).toBeTruthy();
  const indexXml = await indexResponse.text();
  const sitemapUrls = await page.evaluate((xml) => {
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    return Array.from(document.querySelectorAll('sitemap > loc'), (node) => node.textContent!.trim());
  }, indexXml);
  expect(sitemapUrls.length).toBeGreaterThan(0);
  const locations: string[] = [];
  for (const sitemapUrl of sitemapUrls) {
    const response = await request.get(new URL(sitemapUrl).pathname);
    expect(response.ok()).toBeTruthy();
    const xml = await response.text();
    locations.push(...await page.evaluate((source) => {
      const document = new DOMParser().parseFromString(source, 'application/xml');
      return Array.from(document.querySelectorAll('url > loc'), (node) => node.textContent!.trim());
    }, xml));
  }
  for (const locale of locales) {
    const url = `${site}${locale.prefix}/projects/${slug}/`;
    expect(locations.filter((location) => location === url)).toHaveLength(1);
  }
});
