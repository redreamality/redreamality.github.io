import { describe, expect, it, vi } from 'vitest';
import { join } from 'node:path';

vi.mock('./content-collections', () => ({ getCollection: async () => [] }));

const { getHreflangAlternates, getXDefaultAlternate } = await import('./i18n');
const { collectStaticRoutes, normalizeRoutePath, resolveAvailableLanguages, stripLocalePrefix } = await import(
  './locale-availability'
);
const { extractHreflang, extractSwitcherHrefs } = await import('../../scripts/check-locale-links.mjs');

type Lang = 'en' | 'zh' | 'ja';
const set = (...values: string[]) => new Set(values);
const perLang = (en: string[] = [], zh: string[] = [], ja: string[] = []) => ({ en: set(...en), zh: set(...zh), ja: set(...ja) });

function makeIndex() {
  return {
    staticRoutes: set('/', '/cn/', '/ja/', '/blog/', '/cn/blog/', '/ja/blog/', '/admin/', '/cn/garden/blog/', '/garden/blog/'),
    details: {
      blog: perLang(['both', 'all', 'en-only'], ['both', 'all', 'zh-only'], ['all']),
      chaos: perLang(),
      notes: perLang(),
      questions: perLang(),
      talks: perLang(),
      meditations: perLang([], ['zh-med'], []),
      projects: perLang(),
      visuals: perLang(['v'], ['v'], []),
      tags: perLang(['System One', 'shared'], ['shared'], ['shared']),
      library: perLang(['lib-1'], ['lib-1'], ['lib-1']),
      columns: perLang([], ['money-machine-nightly/2026-10-08'], []),
    },
  };
}

describe('locale availability resolver', () => {
  const index = makeIndex();
  const resolve = (path: string, lang: Lang) => resolveAvailableLanguages(path, lang, index);

  it('normalizes paths and strips locale prefixes on segment boundaries only', () => {
    expect(normalizeRoutePath('/cn/blog/a')).toBe('/cn/blog/a/');
    expect(normalizeRoutePath('/tags/System%20One/')).toBe('/tags/System One/');
    expect(stripLocalePrefix('/ja/blog/a/')).toBe('/blog/a/');
    expect(stripLocalePrefix('/cn')).toBe('/');
    expect(stripLocalePrefix('/javascript/')).toBe('/javascript/');
  });

  it('hides locales whose blog translation is missing', () => {
    expect(resolve('/cn/blog/both/', 'zh')).toEqual(['en', 'zh']);
    expect(resolve('/blog/both/', 'en')).toEqual(['en', 'zh']);
    expect(resolve('/blog/all/', 'en')).toEqual(['en', 'zh', 'ja']);
    expect(resolve('/blog/en-only/', 'en')).toEqual(['en']);
    expect(resolve('/cn/blog/zh-only/', 'zh')).toEqual(['zh']);
  });

  it('covers garden, visuals, tags and library routes', () => {
    expect(resolve('/cn/garden/meditations/zh-med/', 'zh')).toEqual(['zh']);
    expect(resolve('/visuals/v/', 'en')).toEqual(['en', 'zh']);
    expect(resolve('/tags/System%20One/', 'en')).toEqual(['en']);
    expect(resolve('/ja/tags/shared/', 'ja')).toEqual(['en', 'zh', 'ja']);
    expect(resolve('/ja/garden/notes/library/lib-1/', 'ja')).toEqual(['en', 'zh', 'ja']);
  });

  it('resolves project-column entries per locale and column indexes as static pages', () => {
    const withIndex = { ...index, staticRoutes: new Set([...index.staticRoutes, '/cn/projects/money-machine-nightly/']) };
    expect(resolve('/cn/projects/money-machine-nightly/2026-10-08/', 'zh')).toEqual(['zh']);
    // English/Japanese entries do not exist and must not be advertised.
    expect(resolve('/cn/projects/money-machine-nightly/2026-10-08/', 'zh')).not.toContain('en');
    expect(resolve('/projects/money-machine-nightly/2099-01-01/', 'en')).toEqual(['en']);
    expect(resolveAvailableLanguages('/cn/projects/money-machine-nightly/', 'zh', withIndex)).toEqual(['zh']);
  });

  it('uses src/pages for static routes and keeps all locales only when every page exists', () => {
    expect(resolve('/ja/blog/', 'ja')).toEqual(['en', 'zh', 'ja']);
    expect(resolve('/admin/', 'en')).toEqual(['en']);
    expect(resolve('/garden/blog/', 'en')).toEqual(['en', 'zh']);
  });

  it('falls back to the current locale for unknown routes', () => {
    expect(resolve('/ja/blog/missing/', 'ja')).toEqual(['ja']);
    expect(resolve('/somewhere/else/', 'en')).toEqual(['en']);
  });
});

describe('static route discovery', () => {
  it('reads non-dynamic pages from src/pages', () => {
    const routes = collectStaticRoutes(join(process.cwd(), 'src', 'pages'));
    for (const route of ['/', '/cn/', '/ja/', '/blog/', '/cn/blog/', '/ja/blog/', '/ja/garden/', '/about/', '/admin/']) {
      expect(routes.has(route), route).toBe(true);
    }
    expect(routes.has('/cn/admin/')).toBe(false);
    expect(routes.has('/ja/garden/blog/')).toBe(false);
    expect([...routes].some((route) => route.includes('['))).toBe(false);
  });
});

describe('hreflang alternates', () => {
  const site = 'https://redreamality.com/';

  it('emits only available locales and points x-default at an existing page', () => {
    const alternates = getHreflangAlternates('/cn/blog/both/', site, ['en', 'zh']);
    expect(alternates.map((alt) => alt.lang)).toEqual(['en', 'zh']);
    expect(getXDefaultAlternate(alternates)).toBe('https://redreamality.com/blog/both/');

    const zhOnly = getHreflangAlternates('/cn/garden/meditations/zh-med/', site, ['zh']);
    expect(zhOnly).toEqual([{ lang: 'zh', url: 'https://redreamality.com/cn/garden/meditations/zh-med/' }]);
    expect(getXDefaultAlternate(zhOnly)).toBe('https://redreamality.com/cn/garden/meditations/zh-med/');
  });

  it('keeps the legacy all-locale output when availability is omitted', () => {
    expect(getHreflangAlternates('/about/', site).map((alt) => alt.lang)).toEqual(['en', 'zh', 'ja']);
  });
});

describe('dist locale-link checker parsing', () => {
  it('extracts switcher menu items and hreflang links', () => {
    const html =
      '<link rel="alternate" hreflang="en" href="https://redreamality.com/blog/a/"><link rel="alternate" type="application/rss+xml" href="/rss.xml">' +
      '<nav><a href="/x/" role="menuitem">nav</a></nav>' +
      '<div class="language-toggle"><a href="/blog/a/" class="flex" role="menuitem">EN</a><a href="/cn/blog/a/" role="menuitem">ZH</a></div><script>1</script>';
    expect(extractSwitcherHrefs(html)).toEqual(['/blog/a/', '/cn/blog/a/']);
    expect(extractHreflang(html)).toEqual([{ lang: 'en', href: 'https://redreamality.com/blog/a/' }]);
  });
});
