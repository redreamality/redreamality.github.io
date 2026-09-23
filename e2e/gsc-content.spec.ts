import { test, expect } from '@playwright/test';

const pages = [
  {
    slug: 'pythonpathvs-code',
    title: 'How to Set PYTHONPATH on Windows, Linux, macOS and VS Code',
    answer: 'What is PYTHONPATH?',
    content: 'python.terminal.useEnvFile',
    description: 'Set and check PYTHONPATH with PowerShell or export commands. Configure VS Code terminals and debugging, and diagnose Python import errors.',
  },
  {
    slug: 'who-starred-my-github-repo-how-to-view',
    title: 'How to See Who Starred Your GitHub Repository',
    answer: 'Open the Stargazers Page',
    content: 'You do not need to own a public repository',
    description: 'See who starred a GitHub repository using its Stargazers page. Find the URL, understand access limits, and distinguish stars from watchers.',
  },
  {
    slug: 'openspec-tutorial-cli-commands-agents-md-examples',
    title: 'OpenSpec Tutorial: Install the CLI and Run Your First Change',
    answer: 'OpenSpec Quick Start',
    content: 'pnpm dlx @fission-ai/openspec@latest init .',
    description: 'Install and initialize OpenSpec, create your first change, validate specs, and archive completed work. Includes CLI commands and AGENTS.md examples.',
  },
  {
    slug: 'browser-extension-development',
    title: 'What Is a Browser Extension? Build Your First One with WXT',
    answer: 'What Is a Browser Extension?',
    content: 'A browser extension is software installed in a web browser',
    description: 'Learn what browser extensions do, how popups and content scripts work, and how to start building an extension with WXT, TypeScript and pnpm.',
  },
];

for (const article of pages) {
  test(`GSC content preserves SEO contract: ${article.slug}`, async ({ page }) => {
    const path = `/blog/${article.slug}/`;
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(new RegExp(article.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(article.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', article.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://redreamality.com${path}`);
    await expect(page.getByRole('heading', { level: 2, name: article.answer, exact: true })).toHaveCount(1);
    await expect(page.locator('main article')).toContainText(article.content);
  });
}
