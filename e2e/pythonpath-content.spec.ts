import { expect, test } from '@playwright/test';

for (const prefix of ['', '/cn', '/ja']) {
  test(`PYTHONPATH distinguishes editor, terminal and runtime in ${prefix || 'en'}`, async ({ page }) => {
    const path = `${prefix}/blog/pythonpathvs-code/`;
    expect((await page.goto(path, { waitUntil: 'domcontentloaded' }))?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://redreamality.com${path}`);
    const article = page.locator('main article').first();
    await expect(article).toContainText('"python.terminal.useEnvFile": true');
    await expect(article).toContainText('python.analysis.extraPaths');
    await expect(article).toContainText('my_package.__file__');
    await expect(article).toContainText('uv pip install -e .');
    await expect(article).toContainText('/new/path${PYTHONPATH:+:$PYTHONPATH}');
    await expect(article).not.toContainText('会自动处理好所有的模块路径问题');
    await expect(article).not.toContainText('すべてのモジュールパス問題を自動的に処理');
  });
}
