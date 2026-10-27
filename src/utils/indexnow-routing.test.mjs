import { readdir } from 'node:fs/promises';
import { describe, it, expect } from 'vitest';
import { contentSlug } from '../../scripts/content-slug.mjs';
import { contentSlugFromEntry } from '../../scripts/indexnow.mjs';

describe('IndexNow content URLs match generated content slugs', () => {
  it('preserves leading, trailing and repeated hyphens', () => {
    for (const name of ['-sddbmad-vs-spec-kit-vs-openspec-vs-promptx.md', 'claude-agent-sdk-python-.md', 'a--b.md']) {
      expect(contentSlugFromEntry(name)).toBe(contentSlug(name));
    }
  });

  it('matches every current content filename and respects explicit slugs', async () => {
    const files = await readdir('src/content', { recursive: true });
    for (const path of files.filter(path => /\.mdx?$/.test(path))) {
      const entry = path.replaceAll('\\', '/').split('/').slice(1).join('/');
      expect(contentSlugFromEntry(entry), path).toBe(contentSlug(entry));
    }
    expect(contentSlugFromEntry('ignored.md', 'chosen-slug')).toBe('chosen-slug');
  });
});
