import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { contentSlug } from './content-slug.mjs';

// The blog routes generate compatibility redirects from these same collections.
export function getLegacyBlogRedirectPaths(contentDirectory) {
  const paths = new Set();
  for (const language of ['en', 'cn', 'ja']) {
    const directory = join(contentDirectory, `chaos-${language}`);
    const prefix = language === 'en' ? '' : `/${language}`;
    for (const entry of readdirSync(directory, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
      const file = join(entry.parentPath, entry.name);
      const { frontmatter } = parseFrontmatter(readFileSync(file, 'utf8'));
      const slug = contentSlug(relative(directory, file), frontmatter);
      paths.add(new URL(`${prefix}/blog/${slug}/`, 'https://redreamality.com').pathname);
    }
  }
  return paths;
}
