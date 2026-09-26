import { expect, test, type Page } from '@playwright/test';

const tutorialSlug = 'openspec-tutorial-cli-commands-agents-md-examples';
const openspec = 'pnpm dlx @fission-ai/openspec@1.13.2';
const locales = [
  {
    prefix: '',
    bmadTitle: 'BMAD Method Guide: Install, Run a Workflow, and Inspect the Outputs',
    notesTitle: 'What Is OpenSpec? Workflow, Files, and When to Use It',
    blogTitle: 'OpenSpec Tutorial: Install the CLI and Run Your First Change',
  },
  {
    prefix: '/cn',
    bmadTitle: 'BMAD Method 入门：安装、首个工作流与产物检查',
    notesTitle: 'OpenSpec 是什么？变更工作流、文件结构与适用场景',
    blogTitle: 'OpenSpec 教程：CLI 安装、命令、AGENTS.md 与实战示例',
  },
  {
    prefix: '/ja',
    bmadTitle: 'BMAD Method入門：インストール、最初のワークフロー、成果物の確認',
    notesTitle: 'OpenSpecとは？変更ワークフロー、ファイル構成、適した用途',
    blogTitle: 'OpenSpecチュートリアル：CLIの導入、コマンド、AGENTS.md、実践例',
  },
];

async function openArticle(page: Page, path: string, title: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe(path);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(title);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://redreamality.com${path}`,
  );
  const article = page.locator('main article > div.prose');
  await expect(article).toHaveCount(1);
  await expect(article.locator('a[href^="/en/"]')).toHaveCount(0);
  return article;
}

for (const locale of locales) {
  const label = locale.prefix || '/';
  const notesPath = `${locale.prefix}/garden/notes/openspec-guide/`;
  const blogPath = `${locale.prefix}/blog/${tutorialSlug}/`;

  test(`BMAD published installation and workflow: ${label}`, async ({ page }) => {
    const article = await openArticle(
      page,
      `${locale.prefix}/garden/notes/bmad-method-guide/`,
      locale.bmadTitle,
    );
    const code = (await article.locator('pre').allTextContents()).join('\n');
    expect(code).toContain(
      'pnpm dlx bmad-method@6.12.0 install --directory . --modules bmm --tools claude-code --yes',
    );
    for (const entry of [
      '_bmad/', 'config.toml', 'bmad-help.csv', '.claude/',
      'bmad-help/', 'bmad-build/', '/bmad-help', '/bmad-build',
      'implementation_artifacts', 'normalize_name.py',
      'uv run --no-project python -m unittest -v test_normalize_name.py',
    ]) {
      expect(code).toContain(entry);
    }
    expect(code).not.toMatch(/bmad-method@(alpha|latest)|quality:|pre_commit:|\.bmad-core/);
    await expect(article).not.toContainText('90%');
    await expect(article.locator(`a[href="${notesPath}"]`)).toHaveCount(1);
  });

  test(`OpenSpec notes explain artifacts and link to the tutorial: ${label}`, async ({ page }) => {
    const article = await openArticle(page, notesPath, locale.notesTitle);
    for (const text of [
      `${openspec} init . --tools none`,
      `${openspec} new change add-magic-link-login`,
      'openspec/changes/add-magic-link-login/specs/auth/spec.md',
      'openspec/specs/auth/spec.md',
      'openspec/changes/archive/YYYY-MM-DD-add-magic-link-login/',
      'config.yaml', 'proposal.md', 'design.md', 'tasks.md',
    ]) {
      await expect(article).toContainText(text);
    }
    await expect.poll(async () => {
      const officialLinks = await article.locator('a').evaluateAll((links) =>
        links.map((link) => link.getAttribute('href') ?? '').filter((href) => href.includes('/go/?to=')),
      );
      return officialLinks.some((href) => {
        const url = new URL(href, 'https://redreamality.com');
        return url.pathname === `${locale.prefix}/go/`
          && url.searchParams.get('to') === 'https://github.com/Fission-AI/OpenSpec';
      });
    }).toBe(true);

    // Exercise the locale-preserving round trip, not just the href text.
    await article.locator(`a[href="${blogPath}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${blogPath}$`));
    await expect(page.locator('h1')).toHaveText(locale.blogTitle);
    await page.locator(`main article a[href="${notesPath}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${notesPath}$`));
    await expect(page.locator('h1')).toHaveText(locale.notesTitle);
  });

  test(`OpenSpec tutorial contains a complete first change: ${label}`, async ({ page }) => {
    const article = await openArticle(page, blogPath, locale.blogTitle);
    for (const command of [
      `${openspec} init . --tools none`,
      `${openspec} new change add-magic-link-login`,
      `${openspec} validate add-magic-link-login --strict --json --no-interactive`,
      `${openspec} archive add-magic-link-login --yes`,
      `${openspec} validate auth --type spec --strict --json --no-interactive`,
    ]) {
      await expect(article).toContainText(command);
    }
    for (const file of ['proposal.md', 'specs/auth/spec.md', 'design.md', 'tasks.md']) {
      await expect(article).toContainText(`openspec/changes/add-magic-link-login/${file}`);
    }
    const delta = article.locator('pre').filter({
      hasText: '### Requirement: Single-use magic-link sign-in',
    });
    await expect(delta).toHaveCount(1);
    const deltaText = await delta.innerText();
    expect(deltaText).toContain('## Purpose');
    expect(deltaText).toContain('## ADDED Requirements');
    expect(deltaText.match(/^### Requirement:/gm)).toHaveLength(2);
    expect(deltaText.match(/^#### Scenario:/gm)).toHaveLength(4);
    for (const scenario of ['Valid link', 'Expired link', 'Reused link', 'Existing password login']) {
      expect(deltaText).toContain(`#### Scenario: ${scenario}`);
    }
    expect(deltaText).toContain('The system SHALL');
    expect(deltaText).toContain('consume it atomically');
    expect(deltaText).toContain('without creating a session');

    const blocks = (await article.locator('pre').allTextContents()).join('\n');
    expect(blocks).not.toMatch(/@latest|--areas|--initiative|--no-validate/);
    expect(blocks).toContain('--goal <text>');
    await expect(article).toContainText('AGENTS.md');
    await expect(article).toContainText('.claude/skills/openspec-propose/SKILL.md');
    await expect(article.locator(`a[href="${notesPath}"]`)).toHaveCount(1);
  });
}
