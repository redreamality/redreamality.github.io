import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { z } from 'astro/zod';
import { resolveDocumentTitle, resolveMetaDescription } from '../src/utils/seo';

const metadataSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

const pages = [
  {
    slug: 'pythonpathvs-code',
    answer: 'What is PYTHONPATH?',
    content: 'python.terminal.useEnvFile',
  },
  {
    slug: 'who-starred-my-github-repo-how-to-view',
    answer: 'Open the Stargazers Page',
    content: 'a public repository does not guarantee public access to its stargazers',
  },
  {
    slug: 'openspec-tutorial-cli-commands-agents-md-examples',
    answer: 'OpenSpec Quick Start',
    content: 'pnpm dlx @fission-ai/openspec@1.13.2 init . --tools none',
  },
  {
    slug: 'browser-extension-development',
    answer: 'What Is a Browser Extension?',
    content: 'A browser extension is software installed in a web browser',
  },
];

for (const article of pages) {
  test(`GSC content preserves SEO contract: ${article.slug}`, async ({ page }) => {
    const { frontmatter } = parseFrontmatter(readFileSync(
      new URL(`../src/content/blog-en/${article.slug}.md`, import.meta.url), 'utf8',
    ));
    const metadata = metadataSchema.parse(frontmatter);
    const description = metadata.seoDescription ?? metadata.description;
    const path = `/blog/${article.slug}/`;
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(resolveDocumentTitle(metadata.seoTitle ?? metadata.title, 'en', undefined, { description }));
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(metadata.title);
    await expect(page.locator('meta[name="description"]'))
      .toHaveAttribute('content', resolveMetaDescription(description, metadata.title, 'en'));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://redreamality.com${path}`);
    await expect(page.getByRole('heading', { level: 2, name: article.answer, exact: true })).toHaveCount(1);
    await expect(page.locator('main article')).toContainText(article.content);
  });
}
