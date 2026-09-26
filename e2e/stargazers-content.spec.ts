import { test, expect } from '@playwright/test';

const locales = [
  {
    prefix: '', title: 'How to See Who Starred Your GitHub Repository',
    permissions: 'a public repository does not guarantee public access to its stargazers',
    empty: 'An empty list therefore does not, by itself, prove that nobody has starred',
    history: 'not every person who ever starred and later unstarred',
    date: 'June 30, 2026',
    headings: ['Open the Stargazers Page', 'Why Is the List Empty or Returning 403?',
      'Current Stargazers Are Not a Complete History', 'Official Sources'],
  },
  {
    prefix: '/cn', title: '谁给我的 GitHub 仓库点了星？如何查看？',
    permissions: '公开仓库不保证任何人都能查看',
    empty: '空列表不能单独证明从来没有人点过星',
    history: '不是所有曾经点星、后来取消的用户档案',
    date: '2026 年 6 月 30 日',
    headings: ['直接导航到 Stargazers 页面', '为什么列表为空或返回 403',
      '当前星标列表不等于完整历史', '官方来源'],
  },
  {
    prefix: '/ja', title: '誰が私の GitHub リポジトリにスターを付けたか？確認方法',
    permissions: '公開リポジトリでも、誰にでも一覧を公開しているとは限りません',
    empty: '空のリストだけで、過去に誰もスターを付けていないとは判断できません',
    history: 'スターを付けた後で解除した人まで含む完全な履歴ではありません',
    date: '2026 年 6 月 30 日',
    headings: ['Stargazers ページへ直接移動', '空のリストや 403 が返る場合',
      '現在の一覧と完全な履歴の違い', '公式資料'],
  },
] as const;

for (const locale of locales) {
  test(`stargazers permissions and history at old URL: ${locale.prefix || 'en'}`, async ({ page }) => {
    const path = `${locale.prefix}/blog/who-starred-my-github-repo-how-to-view/`;
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(locale.title);
    await expect(page.locator('link[rel="canonical"]'))
      .toHaveAttribute('href', `https://redreamality.com${path}`);
    const article = page.locator('main article');
    for (const text of [locale.permissions, locale.empty, locale.history, locale.date,
      '403 Forbidden', '30', '100']) {
      await expect(article).toContainText(text);
    }
    for (const name of locale.headings) {
      await expect(article.getByRole('heading', { name, level: 2, exact: true })).toHaveCount(1);
    }
    const code = (await article.locator('code').allTextContents()).join('\n');
    expect(code).toContain('GET /repos/{owner}/{repo}/stargazers');
    expect(code).toContain('application/vnd.github.star+json');
    expect(code).toContain('starred_at');
    expect(code).toContain('https://github.com/your-username/your-repository-name/stargazers');
    const targets = await article.locator('a[href*="to="]').evaluateAll((links) =>
      links.map((link) => new URL((link as HTMLAnchorElement).href).searchParams.get('to')),
    );
    expect(targets).toContain('https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/');
    expect(targets).toContain('https://docs.github.com/en/rest/activity/starring#list-stargazers');
    expect(targets).toContain('https://docs.github.com/en/rest/activity/starring#get-repository-star-history');
    await expect(article).not.toContainText('You do not need to own a public repository');
  });
}
