import { describe, expect, it } from 'vitest';
import { getPageTitle } from './page-titles';

describe('listing SEO titles', () => {
  for (const [lang, prefix] of [['en', ''], ['zh', '/cn'], ['ja', '/ja']] as const) {
    it(`provides unique branded titles in ${lang}`, () => {
      const paths = ['/', '/blog/', '/projects/', '/visuals/', '/garden/',
        '/garden/chaos/', '/garden/notes/', '/garden/questions/',
        '/garden/talks/', '/garden/meditations/', '/tags/', '/about/'];
      const titles = paths.map(path => getPageTitle(`${prefix}${path}`, lang, 'fallback'));
      expect(new Set(titles).size).toBe(paths.length);
      for (const title of titles) expect(title).toContain('Redreamality');
    });
  }
  it('normalizes trailing slashes without matching detail pages or similar prefixes', () => {
    expect(getPageTitle('/cn/blog', 'zh', '')).toBe(getPageTitle('/cn/blog/', 'zh', ''));
    for (const path of ['/blog/post/', '/visuals/demo/', '/cn/blog/post/', '/cn-other/', '/admin/']) {
      expect(getPageTitle(path, 'en', 'Original title')).toBe('Original title');
    }
  });
});
