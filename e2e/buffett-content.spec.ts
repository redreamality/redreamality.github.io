import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const locales = [
  {
    folder: 'en', prefix: '', title: "Why Doesn't Warren Buffett Invest in Bonds?",
    facts: [
      'Buffett does not completely avoid bonds',
      'not a description of Berkshire\'s 2026 holdings',
      'published after this page\'s original January 15, 2025 date',
      'underwriting earnings or losses relative to average float',
      'not a permanently free loan',
      'only one cash dividend to Berkshire shareholders during 1965–2024',
      'Contractual bond payments are not the same as a guaranteed investment return',
    ],
    heading: 'What This Answer Establishes',
  },
  {
    folder: 'cn', prefix: '/cn', title: '沃伦·巴菲特为什么不投资债券？',
    facts: [
      '巴菲特并非完全不投资债券',
      '这不是伯克希尔 2026 年持仓说明',
      '其发布时间晚于页面原始日期 2025 年 1 月 15 日',
      '承保盈亏相对于平均浮存金衡量成本',
      '不是永远免费的贷款',
      '1965–2024 年间伯克希尔向股东支付现金股息只有一次',
      '债券约定的支付不等于投资回报有保证',
    ],
    heading: '这份历史材料能说明什么',
  },
  {
    folder: 'ja', prefix: '/ja', title: 'ウォーレン・バフェットはなぜ債券に投資しないのか？',
    facts: [
      'バフェットは債券を完全に避けているわけではありません',
      'バークシャーの 2026 年の保有状況',
      '2025 年 1 月 15 日より後に公表された',
      '平均フロートに対する引受損益',
      '永久に無料の融資でも',
      '1965–2024 年にバークシャーの株主へ支払った現金配当',
      '債券の契約上の支払いと、投資収益の保証は別',
    ],
    heading: 'この歴史資料から分かること',
  },
] as const;

for (const locale of locales) {
  test(`Buffett historical answer preserves scope: ${locale.folder}`, async ({ page }) => {
    const source = readFileSync(new URL(
      `../src/content/questions-${locale.folder}/why-warren-buffett-does-not-invest-in-bonds.md`,
      import.meta.url,
    ), 'utf8');
    expect(source).toContain('date: 2025-01-15');
    expect(source).not.toMatch(/^# /m);
    const path = `${locale.prefix}/garden/questions/why-warren-buffett-does-not-invest-in-bonds/`;
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(locale.title);
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute('href', `https://redreamality.com${path}`);
    const article = page.locator('main article');
    for (const fact of locale.facts) {
      await expect.poll(async () => (await article.innerText()).replaceAll('\u2019', "'"))
        .toContain(fact);
    }
    await expect(article.getByRole('heading', {
      level: 2, name: locale.heading, exact: true,
    })).toHaveCount(1);
    await expect(article).toContainText('K-6');
    await expect(article).toContainText('K-32');
    const text = await article.innerText();
    expect(text).not.toMatch(/15\s*[-–]\s*20\s*%|90\/10|60\/40|50\/50/);
    expect(text).not.toMatch(/third-richest|世界第三富豪|世界で3番目/);
    const targets = await article.locator('a[href*="to="]').evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).searchParams.get('to')),
    );
    expect(targets).toContain('https://www.berkshirehathaway.com/2024ar/2024ar.pdf');
    expect(targets).toContain('https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds');
  });
}
